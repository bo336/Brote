-- 0125 — /panel/acciones: cómo funcionan las acciones de verdad, y las reglas a mano.
--
-- Para "equilibrar" hace falta ver: qué se ofrece y no se hace, qué se cambia
-- y por qué, cuánta gente contó cómo es su casa. Y poder mover las reglas del
-- día (docs/ACCIONES.md §5) sin deploy. Las dos funciones piden la contraseña
-- del panel, como el resto.

create or replace function public.admin_acciones(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reglas', brote_acciones_reglas(),
    'reglas_guardadas', coalesce((select value from app_settings where key = 'acciones_reglas'), '{}'::jsonb),
    -- El catálogo, por tema.
    'catalogo', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dominio', domain_slug, 'dia', dia, 'catalogo', cat, 'chicos', chicos,
               'con_contexto', ctx, 'de_temporada', tem) order by domain_slug), '[]'::jsonb)
        from (select domain_slug,
                     count(*) filter (where type = 'daily') dia,
                     count(*) filter (where type = 'catalog') cat,
                     count(*) filter (where 'kid' = any(age_groups)) chicos,
                     count(*) filter (where cardinality(requiere) > 0) ctx,
                     count(*) filter (where cardinality(estaciones) > 0) tem
                from activities where active and not ('interno' = any(tags))
               group by domain_slug) x),
    -- Las más cambiadas en 60 días, con el motivo.
    'cambiadas', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'slug', a.slug, 'titulo', a.title_es, 'dominio', a.domain_slug, 'total', t.total,
               'hoy_no', t.hoy_no, 'no_aplica', t.no_aplica, 'ya_lo_hago', t.ya, 'no_me_gusta', t.no_gusta)
               order by t.total desc), '[]'::jsonb)
        from (select activity_id, count(*) total,
                     count(*) filter (where motivo = 'hoy_no') hoy_no,
                     count(*) filter (where motivo = 'no_aplica') no_aplica,
                     count(*) filter (where motivo = 'ya_lo_hago') ya,
                     count(*) filter (where motivo = 'no_me_gusta') no_gusta
                from acciones_feedback where created_at > now() - interval '60 days'
               group by activity_id order by count(*) desc limit 20) t
        join activities a on a.id = t.activity_id),
    -- Ofrecidas en el set vs hechas ese mismo día (30 días, al menos 3 veces ofrecida).
    'ofrecidas', (
      with o as (
        select ds.user_id, ds.local_date, x.aid
          from daily_sets ds, unnest(ds.activity_ids) x(aid)
         where ds.local_date > (now() at time zone 'America/Argentina/Buenos_Aires')::date - 30
      ), r as (
        select o.aid, count(*) ofrecida,
               count(*) filter (where exists (select 1 from activity_completions c
                                               where c.user_id = o.user_id and c.activity_id = o.aid
                                                 and c.local_date = o.local_date)) hecha
          from o group by o.aid having count(*) >= 3
      )
      select jsonb_build_object(
        'menos_hechas', coalesce((select jsonb_agg(j order by (j->>'tasa')::numeric asc) from (
            select jsonb_build_object('slug', a.slug, 'titulo', a.title_es, 'ofrecida', r.ofrecida, 'hecha', r.hecha,
                                      'tasa', round(r.hecha::numeric / r.ofrecida, 2)) j
              from r join activities a on a.id = r.aid order by r.hecha::numeric / r.ofrecida asc limit 12) z), '[]'::jsonb),
        'mas_hechas', coalesce((select jsonb_agg(j order by (j->>'tasa')::numeric desc) from (
            select jsonb_build_object('slug', a.slug, 'titulo', a.title_es, 'ofrecida', r.ofrecida, 'hecha', r.hecha,
                                      'tasa', round(r.hecha::numeric / r.ofrecida, 2)) j
              from r join activities a on a.id = r.aid order by r.hecha::numeric / r.ofrecida desc limit 12) z), '[]'::jsonb),
        'sets', (select count(*) from daily_sets
                  where local_date > (now() at time zone 'America/Argentina/Buenos_Aires')::date - 30),
        'cambios', (select coalesce(sum(cambios), 0) from daily_sets
                     where local_date > (now() at time zone 'America/Argentina/Buenos_Aires')::date - 30))),
    -- Cuánta gente contó cómo es su casa, y qué tiene.
    'contexto', jsonb_build_object(
      'personas', (select count(*) from profiles where onboarding_completed),
      'respondieron', (select count(*) from profiles where context -> 'respondido' = 'true'::jsonb),
      'claves', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (
                   select k, count(*) n from profiles, jsonb_each(context) e(k, v)
                    where v = 'true'::jsonb and k <> 'respondido' group by k) c)),
    'caminos', (select coalesce(jsonb_agg(jsonb_build_object('slug', c.slug, 'titulo', c.titulo_es,
                   'terminados', (select count(*) from user_caminos u where u.camino_slug = c.slug)) order by c.orden), '[]'::jsonb)
                  from caminos c where c.active));
end $fn$;

-- Guarda las reglas del día. Sólo claves conocidas y números en rangos sanos:
-- un error de tipeo no puede dejar a nadie sin acciones.
create or replace function public.admin_acciones_reglas_guardar(p_pass text, p_reglas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_limpio jsonb := '{}'::jsonb; v_pesos jsonb := '{}'::jsonb; k text; v jsonb; kp text; vp jsonb; n numeric;
  rangos constant jsonb := '{"tamano":[3,8],"rapidas_min":[0,8],"rapida_minutos":[1,30],"larga_minutos":[5,120],
    "max_largas":[0,8],"max_por_dominio":[1,8],"max_temporada":[0,8],"ventana_dias":[0,90],"cambios_por_dia":[0,10],
    "ya_lo_hago_dias":[0,365],"hoy_no_dias":[0,60],"hecha_reciente_dias":[0,30]}'::jsonb;
  pesos constant text[] := array['interes','afinidad','nueva','temporada','efemeride','contexto','impacto_medio',
    'impacto_alto','ofrecida','hoy_no','hecha_reciente','azar'];
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  if jsonb_typeof(p_reglas) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'error', 'Formato inválido');
  end if;
  for k, v in select * from jsonb_each(p_reglas) loop
    if k = 'pesos' then
      if jsonb_typeof(v) <> 'object' then continue; end if;
      for kp, vp in select * from jsonb_each(v) loop
        continue when not (kp = any(pesos)) or jsonb_typeof(vp) <> 'number';
        n := (vp #>> '{}')::numeric;
        continue when n < 0 or n > 100;
        v_pesos := v_pesos || jsonb_build_object(kp, round(n)::int);
      end loop;
    elsif rangos ? k and jsonb_typeof(v) = 'number' then
      n := (v #>> '{}')::numeric;
      if n < (rangos -> k ->> 0)::numeric or n > (rangos -> k ->> 1)::numeric then
        return jsonb_build_object('ok', false, 'error', format('%s fuera de rango (%s a %s)', k, rangos -> k ->> 0, rangos -> k ->> 1));
      end if;
      v_limpio := v_limpio || jsonb_build_object(k, round(n)::int);
    end if;
  end loop;
  if v_pesos <> '{}'::jsonb then v_limpio := v_limpio || jsonb_build_object('pesos', v_pesos); end if;
  insert into app_settings (key, value, description) values ('acciones_reglas', v_limpio,
    'Reglas del set de acciones del día (docs/ACCIONES.md §5). Vacío = los valores por omisión.')
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true, 'reglas', brote_acciones_reglas());
end $fn$;

revoke all on function public.admin_acciones(text) from public, anon;
revoke all on function public.admin_acciones_reglas_guardar(text, jsonb) from public, anon;
grant execute on function public.admin_acciones(text) to authenticated;
grant execute on function public.admin_acciones_reglas_guardar(text, jsonb) to authenticated;

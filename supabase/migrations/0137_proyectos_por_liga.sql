-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0137 — Los proyectos dependen de la liga de la semana.
--
-- Hasta acá se podía organizar desde un nivel de por vida (Arbusto): una vez
-- alcanzado valía para siempre, aunque esa persona no hiciera nada hace meses.
-- Ahora lo decide el RANGO del período (0133): Aprendiz … Faro, lo que hiciste
-- en la última semana o mes. Organizar gente en persona se sostiene.
--
-- CUÁNTOS PROYECTOS A LA VEZ (`proyectos_reglas.cupos`, se edita en el panel):
--   Aprendiz, Practicante, Ambientalista: 0 · Referente: 1 · Agente de cambio: 2
--   Guía: 3 · Faro: 5.
-- Vale el rango cerrado o el que ya cumpliste en el período en curso (`camino`):
-- quien ya hizo lo que pide no tiene que esperar al cierre, que en modo mensual
-- podrían ser semanas.
--
-- SI ALGUIEN BAJA DE RANGO (lo que pasa con lo que ya creó):
--   1. Nada se corta de golpe. Un proyecto es un compromiso con otra gente: sigue
--      en pie, y quien ya se sumó conserva su lugar aunque también baje.
--   2. No se pueden crear más hasta volver a tener cupo libre.
--   3. Si tiene más proyectos que cupo, siguen en regla los más próximos; a los
--      otros les corre una GRACIA de `gracia_dias` (28 días: es tiempo y no
--      períodos, así significa lo mismo en modo semanal y mensual). Se le avisa
--      al organizador el primer día, una sola vez.
--   4. Pasada la gracia el proyecto queda EN PAUSA: no aparece en las listas ni
--      acepta gente nueva; se les avisa a quienes ya estaban. Nunca se pausa uno
--      con fecha dentro de los próximos 14 días: esa reunión ya está armada.
--   5. Volver al rango lo reactiva solo, con aviso. Nada se borra.
--   6. En cualquier momento se le puede pasar la organización a alguien que ya se
--      sumó y tenga cupo (`proyecto_ceder`). Los proyectos sin organizador
--      (cuenta borrada) no se tocan: los maneja el panel.
--
-- SUMARSE: quien organiza puede pedir un rango mínimo (`min_rango`, por omisión
-- ninguno, y como mucho el suyo). Se mira al sumarse: bajar después no te saca.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.projects
  add column if not exists min_rango smallint not null default 1 check (min_rango between 1 and 7),
  add column if not exists pausado_at timestamptz,
  add column if not exists organizador_bajo_desde date;

grant select (min_rango, pausado_at, organizador_bajo_desde) on public.projects to anon, authenticated;

create index if not exists projects_organizador on public.projects (creator_id) where status in ('active', 'proposed');

-- Lo que antes pedía un nivel de por vida, ahora pide el rango equivalente.
update public.projects p
   set min_rango = case when r.tier <= 2 then 1 when r.tier <= 4 then 2 when r.tier <= 6 then 3
                        when r.tier <= 8 then 4 when r.tier = 9 then 5 when r.tier = 10 then 6 else 7 end
  from public.ranks r
 where r.slug = p.min_rank_slug and p.min_rango = 1;

insert into app_settings (key, value, description) values
  ('proyectos_reglas',
   '{"cupos": {"1": 0, "2": 0, "3": 0, "4": 1, "5": 2, "6": 3, "7": 5}, "gracia_dias": 28}'::jsonb,
   'Cuántos proyectos puede organizar a la vez cada rango y cuántos días de gracia hay al bajar. Se edita en /panel/proyectos.')
on conflict (key) do nothing;
delete from app_settings where key = 'project_min_rank_tier';

-- ── Las reglas y el cupo de cada uno ────────────────────────────────────────

create or replace function public.brote_proyectos_reglas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value from app_settings where key = 'proyectos_reglas'),
                  '{"cupos": {"1": 0, "2": 0, "3": 0, "4": 1, "5": 2, "6": 3, "7": 5}, "gracia_dias": 28}'::jsonb);
$$;

create or replace function public.brote_proyecto_cupo_de(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglas jsonb := brote_proyectos_reglas();
  per rango_periodos%rowtype; v_hoy date := brote_hoy_ba();
  v_tier smallint; v_camino smallint; v_ef smallint; v_cupo int; v_activos int; v_m jsonb; v_min smallint;
begin
  per := brote_rango_periodo();
  v_tier := coalesce((select tier from rango_usuario where user_id = p_uid), 1);
  select jsonb_build_object('dias', m.dias, 'acciones', m.acciones, 'temas', m.temas, 'medidas', m.medidas,
                            'comunidad', m.comunidad, 'aprendizaje', m.aprendizaje)
    into v_m from brote_rango_metricas(per.inicio, least(per.fin, v_hoy), p_uid) m;
  v_camino := brote_rango_calificado(coalesce(v_m, '{}'::jsonb), per.fin - per.inicio + 1, v_tier);
  v_ef := greatest(v_tier, v_camino);
  v_cupo := coalesce((v_reglas -> 'cupos' ->> v_ef::text)::int, 0);
  select count(*) into v_activos from projects p
   where p.creator_id = p_uid and p.status in ('active', 'proposed')
     and (p.event_date is null or p.event_date > now() - interval '1 day');
  select min(k::smallint) into v_min from jsonb_each_text(v_reglas -> 'cupos') e(k, v) where v::int > 0;
  return jsonb_build_object(
    'tier', v_tier, 'camino', v_camino, 'efectivo', v_ef, 'cupo', v_cupo, 'activos', v_activos,
    'libres', greatest(v_cupo - v_activos, 0), 'min_tier', v_min,
    'min_nombre', (select nombre from rangos where tier = v_min),
    'efectivo_nombre', (select nombre from rangos where tier = v_ef),
    'cupos', v_reglas -> 'cupos', 'gracia_dias', v_reglas -> 'gracia_dias',
    'adulto', coalesce((select account_type = 'adult' from profiles where id = p_uid), false));
end $$;
revoke all on function public.brote_proyectos_reglas() from public, anon, authenticated;
revoke all on function public.brote_proyecto_cupo_de(uuid) from public, anon, authenticated;

-- Lo que la app necesita saber para ofrecer "Organizar" o explicar qué falta.
create or replace function public.proyecto_cupo()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false); end if;
  return brote_proyecto_cupo_de(auth.uid()) || jsonb_build_object('ok', true);
end $$;
revoke all on function public.proyecto_cupo() from public, anon;
grant execute on function public.proyecto_cupo() to authenticated;

-- ── Crear ───────────────────────────────────────────────────────────────────

drop function if exists public.create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, integer, text, text, text, text);

create or replace function public.create_project(
  p_title text, p_description text, p_type text, p_domain text, p_neighborhood text,
  p_location_text text, p_lat double precision, p_lng double precision,
  p_event_date timestamp with time zone, p_max_participants integer, p_image_url text,
  p_min_rank text default null, p_contact_info text default null, p_contact_kind text default null,
  p_min_rango smallint default 1)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_c jsonb; v_id uuid; v_ef smallint;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  v_c := brote_proyecto_cupo_de(v_uid);

  if not (v_c ->> 'adulto')::boolean then
    raise exception 'Los proyectos los organizan personas adultas: son encuentros en persona, con lugar y contacto.';
  end if;
  if (v_c ->> 'cupo')::int = 0 then
    raise exception 'Podés organizar proyectos desde el rango %. Es lo que se sostiene semana a semana.', v_c ->> 'min_nombre';
  end if;
  if (v_c ->> 'libres')::int = 0 then
    raise exception 'Con tu rango podés organizar % a la vez y ya tenés %. Terminá uno, pasalo o subí de rango.',
      v_c ->> 'cupo', v_c ->> 'activos';
  end if;
  if p_contact_kind is not null and p_contact_kind not in ('whatsapp', 'email', 'instagram', 'telegram', 'otro') then
    raise exception 'Tipo de contacto inválido';
  end if;

  v_ef := (v_c ->> 'efectivo')::smallint;
  insert into projects (creator_id, title, description, type, domain_slug, neighborhood, location_text,
                        lat, lng, event_date, max_participants, image_url, min_rango, status,
                        contact_info, contact_kind)
  values (v_uid, p_title, p_description, coalesce(p_type, 'otro'), p_domain, p_neighborhood, p_location_text,
          p_lat, p_lng, p_event_date, p_max_participants, p_image_url,
          -- No se puede pedir más de lo que tiene quien organiza.
          least(greatest(coalesce(p_min_rango, 1), 1), v_ef), 'active',
          nullif(btrim(coalesce(p_contact_info, '')), ''), p_contact_kind)
  returning id into v_id;

  insert into project_participants (project_id, user_id, status)
  values (v_id, v_uid, 'organizer') on conflict do nothing;
  return v_id;
end $fn$;
revoke all on function public.create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, integer, text, text, text, text, smallint) from public, anon;
grant execute on function public.create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, integer, text, text, text, text, smallint) to authenticated;

-- ── Sumarse ─────────────────────────────────────────────────────────────────

create or replace function public.join_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_c jsonb; v_count int; p projects%rowtype; v_tipo text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo = 'kid' then
    raise exception 'Los proyectos son encuentros en persona: con una cuenta de chico no se puede sumar. Puede hacerlo una persona adulta de tu familia.';
  end if;
  select * into p from projects where id = p_project_id;
  if not found or p.status not in ('active', 'proposed') then raise exception 'Este proyecto ya no está abierto.'; end if;
  if p.pausado_at is not null then raise exception 'Este proyecto está en pausa por ahora.'; end if;
  v_c := brote_proyecto_cupo_de(v_uid);
  if (v_c ->> 'efectivo')::smallint < p.min_rango then
    raise exception 'Este proyecto pide el rango % o más.', (select nombre from rangos where tier = p.min_rango);
  end if;
  if p.max_participants is not null then
    select count(*) into v_count from project_participants where project_id = p_project_id and status in ('joined', 'organizer');
    if v_count >= p.max_participants then raise exception 'El proyecto está completo'; end if;
  end if;
  insert into project_participants (project_id, user_id, status) values (p_project_id, v_uid, 'joined')
    on conflict (project_id, user_id) do update set status = 'joined';
  return true;
end $fn$;

-- ── Lo que ve quien organiza ────────────────────────────────────────────────

create or replace function public.proyecto_organizacion(p_project uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); p projects%rowtype; v_reglas jsonb := brote_proyectos_reglas(); v_gracia int;
begin
  select * into p from projects where id = p_project;
  if not found or p.creator_id is distinct from v_uid then return jsonb_build_object('ok', false); end if;
  v_gracia := coalesce((v_reglas ->> 'gracia_dias')::int, 28);
  return jsonb_build_object(
    'ok', true,
    'cupo', brote_proyecto_cupo_de(v_uid),
    'pausado_at', p.pausado_at,
    'bajo_desde', p.organizador_bajo_desde,
    'dias_restantes', case when p.organizador_bajo_desde is null then null
                           else greatest(p.organizador_bajo_desde + v_gracia - brote_hoy_ba(), 0) end,
    -- A quién se le puede pasar: ya se sumó, adulta y con cupo libre.
    'candidatos', coalesce((select jsonb_agg(jsonb_build_object('user_id', x.user_id, 'nombre', x.nombre)) from (
        select pp.user_id, coalesce(pr.display_name, pr.username::text, 'Alguien') as nombre
          from (select q.user_id from project_participants q
                 where q.project_id = p_project and q.user_id <> v_uid and q.status = 'joined'
                 order by q.joined_at limit 60) pp
          join profiles pr on pr.id = pp.user_id
         where pr.account_type = 'adult'
           and (brote_proyecto_cupo_de(pp.user_id) ->> 'libres')::int > 0
         limit 30) x), '[]'::jsonb));
end $$;
revoke all on function public.proyecto_organizacion(uuid) from public, anon;
grant execute on function public.proyecto_organizacion(uuid) to authenticated;

create or replace function public.proyecto_ceder(p_project uuid, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); p projects%rowtype; v_c jsonb;
begin
  select * into p from projects where id = p_project for update;
  if not found or p.creator_id is distinct from v_uid then return jsonb_build_object('ok', false, 'error', 'Sólo quien organiza puede pasar el proyecto.'); end if;
  if not exists (select 1 from project_participants where project_id = p_project and user_id = p_user and status = 'joined') then
    return jsonb_build_object('ok', false, 'error', 'Tiene que haberse sumado al proyecto.');
  end if;
  v_c := brote_proyecto_cupo_de(p_user);
  if not (v_c ->> 'adulto')::boolean or (v_c ->> 'libres')::int <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Esa persona no tiene cupo para organizar otro proyecto.');
  end if;
  update projects set creator_id = p_user, organizador_bajo_desde = null, pausado_at = null, updated_at = now() where id = p_project;
  update project_participants set status = 'joined' where project_id = p_project and user_id = v_uid;
  update project_participants set status = 'organizer' where project_id = p_project and user_id = p_user;
  insert into notifications (user_id, type, title_es, body_es, data)
  values (p_user, 'project', 'Te pasaron la organización de un proyecto',
          '«' || p.title || '» ahora está a tu cargo.', jsonb_build_object('url', '/proyectos/' || p.id));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.proyecto_ceder(uuid, uuid) from public, anon;
grant execute on function public.proyecto_ceder(uuid, uuid) to authenticated;

-- ── La revisión de cada noche ───────────────────────────────────────────────

create or replace function public.brote_proyectos_revisar()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglas jsonb := brote_proyectos_reglas();
  v_gracia int := coalesce((v_reglas ->> 'gracia_dias')::int, 28);
  v_hoy date := brote_hoy_ba();
  r record; v_cupo int; v_avisos int := 0; v_pausas int := 0; v_vueltas int := 0;
begin
  for r in
    select p.id, p.title, p.creator_id, p.event_date, p.pausado_at, p.organizador_bajo_desde, c.cupo,
           row_number() over (partition by p.creator_id
                              order by (p.event_date is null), p.event_date, p.created_at) as n
      from projects p
      -- El mismo cupo que al crear (rango cerrado o el que ya cumplió en este
      -- período), calculado una vez por persona.
      join (select o.creator_id, (brote_proyecto_cupo_de(o.creator_id) ->> 'cupo')::int as cupo
              from (select distinct creator_id from projects
                     where status in ('active', 'proposed') and creator_id is not null) o) c
        on c.creator_id = p.creator_id
     where p.status in ('active', 'proposed') and p.creator_id is not null
       and (p.event_date is null or p.event_date > now() - interval '1 day')
  loop
    v_cupo := coalesce(r.cupo, 0);

    if r.n <= v_cupo then
      -- En regla (volvió al rango, o se liberó cupo).
      if r.organizador_bajo_desde is not null or r.pausado_at is not null then
        update projects set organizador_bajo_desde = null, pausado_at = null, updated_at = now() where id = r.id;
        if r.pausado_at is not null then
          v_vueltas := v_vueltas + 1;
          insert into notifications (user_id, type, title_es, body_es, data)
          select pp.user_id, 'project', 'Volvió «' || r.title || '»', 'El proyecto está abierto de nuevo.',
                 jsonb_build_object('url', '/proyectos/' || r.id)
            from project_participants pp where pp.project_id = r.id;
        end if;
      end if;

    elsif r.organizador_bajo_desde is null then
      -- Primer día fuera de cupo: el aviso, una sola vez.
      update projects set organizador_bajo_desde = v_hoy, updated_at = now() where id = r.id;
      v_avisos := v_avisos + 1;
      insert into notifications (user_id, type, title_es, body_es, data)
      values (r.creator_id, 'project', 'Tu rango ya no alcanza para «' || r.title || '»',
              'El proyecto sigue en pie y nadie pierde su lugar. Tenés ' || v_gracia || ' días para volver al rango o pasarle la organización a alguien.',
              jsonb_build_object('url', '/proyectos/' || r.id));

    elsif r.pausado_at is null and r.organizador_bajo_desde <= v_hoy - v_gracia
          and (r.event_date is null or r.event_date > now() + interval '14 days') then
      -- Se acabó la gracia. Lo que tiene fecha cercana no se toca.
      update projects set pausado_at = now(), updated_at = now() where id = r.id;
      v_pausas := v_pausas + 1;
      insert into notifications (user_id, type, title_es, body_es, data)
      select pp.user_id, 'project', '«' || r.title || '» quedó en pausa',
             case when pp.user_id = r.creator_id
                  then 'Vuelve solo en cuanto recuperes el rango, o pasale la organización a alguien.'
                  else 'Quien lo organiza no sostuvo su rango. Vuelve cuando lo recupere; tu lugar sigue siendo tuyo.' end,
             jsonb_build_object('url', '/proyectos/' || r.id)
        from project_participants pp where pp.project_id = r.id;
    end if;
  end loop;
  return jsonb_build_object('avisos', v_avisos, 'pausas', v_pausas, 'vueltas', v_vueltas);
end $$;
revoke all on function public.brote_proyectos_revisar() from public, anon, authenticated;

select cron.unschedule('brote-proyectos-revisar') where exists (select 1 from cron.job where jobname = 'brote-proyectos-revisar');
select cron.schedule('brote-proyectos-revisar', '30 3 * * *', $$select public.brote_proyectos_revisar()$$);

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_proyectos(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  return jsonb_build_object(
    'ok', true,
    'reglas', brote_proyectos_reglas(),
    'rangos', (select jsonb_agg(jsonb_build_object('tier', tier, 'nombre', nombre, 'color', color) order by tier) from rangos),
    'resumen', jsonb_build_object(
      'activos', (select count(*) from projects where status in ('active', 'proposed') and pausado_at is null),
      'en_pausa', (select count(*) from projects where status in ('active', 'proposed') and pausado_at is not null),
      'en_gracia', (select count(*) from projects where status in ('active', 'proposed') and pausado_at is null and organizador_bajo_desde is not null),
      'completados', (select count(*) from projects where status = 'completed'),
      'participaciones', (select count(*) from project_participants),
      'sumados_7d', (select count(*) from project_participants where joined_at > now() - interval '7 days'),
      'jornadas_30d', (select count(*) from project_sessions where held_at > now() - interval '30 days')),
    'proyectos', coalesce((select jsonb_agg(x order by x.orden, x.event_date nulls last) from (
      select p.id, p.title, p.status, p.city, p.neighborhood, p.domain_slug, p.event_date, p.created_at, p.min_rango,
             p.pausado_at, p.organizador_bajo_desde, p.max_participants,
             (select coalesce(pr.display_name, pr.username::text) from profiles pr where pr.id = p.creator_id) as organizador,
             (select pr.username::text from profiles pr where pr.id = p.creator_id) as organizador_usuario,
             (select r.nombre from rangos r join rango_usuario ru on ru.tier = r.tier where ru.user_id = p.creator_id) as organizador_rango,
             (select count(*) from project_participants pp where pp.project_id = p.id) as personas,
             (select count(*) from project_sessions s where s.project_id = p.id) as jornadas,
             case when p.status in ('active', 'proposed') and p.pausado_at is not null then 1
                  when p.status in ('active', 'proposed') and p.organizador_bajo_desde is not null then 0
                  when p.status in ('active', 'proposed') then 2 else 3 end as orden
        from projects p order by p.created_at desc limit 300) x), '[]'::jsonb));
end $$;

create or replace function public.admin_proyecto_accion(p_pass text, p_id uuid, p_accion text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  if p_accion = 'pausar' then
    update projects set pausado_at = now(), updated_at = now() where id = p_id;
  elsif p_accion = 'reanudar' then
    update projects set pausado_at = null, organizador_bajo_desde = null, updated_at = now() where id = p_id;
  elsif p_accion = 'cerrar' then
    update projects set status = 'completed', completed_at = now(), updated_at = now() where id = p_id;
  elsif p_accion = 'cancelar' then
    update projects set status = 'cancelled', updated_at = now() where id = p_id;
  else
    return jsonb_build_object('ok', false, 'error', 'Acción desconocida');
  end if;
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.admin_proyectos_reglas_guardar(p_pass text, p_reglas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_gracia int; v_cupos jsonb := p_reglas -> 'cupos';
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  v_gracia := (p_reglas ->> 'gracia_dias')::int;
  if v_gracia is null or v_gracia not between 0 and 180 then
    return jsonb_build_object('ok', false, 'error', 'La gracia va de 0 a 180 días.');
  end if;
  if jsonb_typeof(v_cupos) <> 'object' or exists (
       select 1 from generate_series(1, 7) t
        where coalesce((v_cupos ->> t::text)::int, -1) not between 0 and 50) then
    return jsonb_build_object('ok', false, 'error', 'Cada rango necesita un cupo entre 0 y 50.');
  end if;
  insert into app_settings (key, value, description)
  values ('proyectos_reglas', jsonb_build_object('cupos', v_cupos, 'gracia_dias', v_gracia), 'Cupos de proyectos por rango y días de gracia.')
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true);
exception when invalid_text_representation then
  return jsonb_build_object('ok', false, 'error', 'Los cupos tienen que ser números enteros.');
end $$;

revoke all on function public.admin_proyectos(text) from public, anon;
revoke all on function public.admin_proyecto_accion(text, uuid, text) from public, anon;
revoke all on function public.admin_proyectos_reglas_guardar(text, jsonb) from public, anon;
grant execute on function public.admin_proyectos(text) to authenticated;
grant execute on function public.admin_proyecto_accion(text, uuid, text) to authenticated;
grant execute on function public.admin_proyectos_reglas_guardar(text, jsonb) to authenticated;

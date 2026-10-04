-- 0121 — Dos cuentas de empresa distintas, y una liga donde el tamaño no pesa.
--
-- Hasta acá toda empresa nueva entraba como TIENDA (Mercado v2), y el programa
-- Mejora quedaba al final del menú de la tienda. El dueño pidió marcar la
-- diferencia:
--
--   · TIENDA (`objetivo = 'vender'`): su único objetivo es vender en el
--     Mercado. Productos, preguntas, tienda, analítica, plan. Sin Mejora ni liga.
--   · EMPRESA QUE MEJORA (`objetivo = 'mejorar'`): usa Brote para bajar su
--     huella. Cuenta cómo trabaja (el dossier), recibe objetivos y acciones
--     a su medida —la IA propone, las reglas de realismo filtran: siempre
--     alcanzables— y compite en la Liga de empresas. No publica productos.
--   · `ambos`: las dos cosas. Lo eligen después, desde el resumen.
--
-- La liga. Para que una PyME de tres personas compita de igual a igual con una
-- planta de doscientas, el puntaje no mira NINGÚN volumen (litros, kilos,
-- facturación, empleados): mira cuánto cumple cada una de su PROPIO plan.
--
--   logros      hasta 600  objetivos cerrados en la temporada y aprobados por
--                          un revisor: 150 × (1 logrado · 0,5 parcial) ×
--                          ambición (1 · 1,2 · 1,5). Cuentan los 4 mejores:
--                          un equipo grande no gana por hacer más cantidad.
--   constancia  hasta 250  semanas de la temporada con un avance reportado,
--                          sobre las semanas transcurridas.
--   avance      hasta 150  pasos hechos sobre pasos totales, promedio de los
--                          objetivos en curso.
--
-- La temporada es el trimestre (hora de Buenos Aires). Una empresa aparece en
-- la tabla pública cuando está verificada (nivel de evidencia mayor a e0, o un
-- método de verificación de dominio, mail o red aprobado): una liga con
-- empresas inventadas no le sirve a nadie. Mientras tanto ve su propio puntaje.

-- ── 1 · El objetivo de cada empresa ─────────────────────────────────────────

alter table public.businesses add column if not exists objetivo text not null default 'vender';
do $$ begin
  alter table public.businesses add constraint businesses_objetivo check (objetivo in ('vender', 'mejorar', 'ambos'));
exception when duplicate_object then null; end $$;

-- Las del flujo anterior dijeron en el alta qué les interesaba (`intereses`).
update public.businesses
   set objetivo = case
         when 'mejora' = any(intereses) and 'mercado' = any(intereses) then 'ambos'
         when 'mejora' = any(intereses) then 'mejorar'
         when modelo = 'legacy' then 'ambos'
         else 'vender' end
 where modelo = 'legacy';

alter table public.businesses drop constraint if exists businesses_modelo;
alter table public.businesses add constraint businesses_modelo check (modelo in ('vendedor', 'legacy', 'empresa'));

-- El selector de cuenta necesita el objetivo para armar el menú.
drop function if exists public.my_businesses();
create function public.my_businesses()
returns table(id uuid, nombre text, slug text, role text, status business_status, tier evidence_tier, modelo text, objetivo text)
language sql
stable
security definer
set search_path = public
as $fn$
  select b.id, b.nombre_comercial, b.slug, m.role::text, b.status, b.tier, b.modelo, b.objetivo
  from business_members m join businesses b on b.id = m.business_id
  where m.user_id = auth.uid()
  order by b.created_at;
$fn$;
revoke all on function public.my_businesses() from public, anon;
grant execute on function public.my_businesses() to authenticated;

-- Una empresa que sólo mejora no publica productos.
create or replace function public.brote_listado_exige_vender()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if (select objetivo from businesses where id = new.business_id) = 'mejorar' then
    raise exception 'Esta cuenta es de una empresa que mejora su impacto: para vender, sumá la tienda desde el resumen.'
      using errcode = 'P0001';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_listado_exige_vender on public.listings;
create trigger trg_listado_exige_vender before insert on public.listings
  for each row execute function public.brote_listado_exige_vender();
revoke all on function public.brote_listado_exige_vender() from public, anon, authenticated;

-- Cambiar el objetivo: sólo quien es dueño, y nunca sacarle la tienda a quien
-- tiene productos publicados (primero se retiran).
create or replace function public.negocio_set_objetivo(p_business uuid, p_objetivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare b businesses%rowtype;
begin
  if p_objetivo not in ('vender', 'mejorar', 'ambos') then
    return jsonb_build_object('ok', false, 'error', 'objetivo_invalido');
  end if;
  if brote_biz_role(p_business) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select * into b from businesses where id = p_business for update;
  if p_objetivo = 'mejorar'
     and exists (select 1 from listings l where l.business_id = p_business and l.status in ('publicado', 'pendiente')) then
    return jsonb_build_object('ok', false, 'error', 'tiene_productos');
  end if;
  -- Una tienda que suma Mejora necesita estar aprobada para recibir objetivos;
  -- eso ya lo pide `objetivos_proponer`.
  update businesses set objetivo = p_objetivo, updated_at = now() where id = p_business;
  return jsonb_build_object('ok', true, 'objetivo', p_objetivo);
end $fn$;
revoke all on function public.negocio_set_objetivo(uuid, text) from public, anon;
grant execute on function public.negocio_set_objetivo(uuid, text) to authenticated;

-- ── 2 · Dar de alta una empresa que mejora ──────────────────────────────────

create or replace function public.empresa_crear(
  p_nombre text, p_rubro text, p_tamano business_size, p_provincia text, p_ciudad text, p_sitio_web text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid(); v_prof profiles%rowtype; v_confirmado timestamptz;
  v_owned int; v_tope int; v_nombre text := trim(coalesce(p_nombre, '')); v_id uuid;
  v_sitio text := nullif(trim(coalesce(p_sitio_web, '')), '');
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into v_prof from profiles where id = v_uid;
  if v_prof.account_type is distinct from 'adult' then return jsonb_build_object('ok', false, 'error', 'solo_adultos'); end if;
  if not coalesce(v_prof.onboarding_completed, false) then
    return jsonb_build_object('ok', false, 'error', 'onboarding_pendiente');
  end if;
  select email_confirmed_at into v_confirmado from auth.users where id = v_uid;
  if v_confirmado is null then return jsonb_build_object('ok', false, 'error', 'email_sin_confirmar'); end if;
  if char_length(v_nombre) not between 2 and 80 or brote_matches_blocklist(v_nombre) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'nombre_comercial');
  end if;
  if p_rubro is null or not (p_rubro = any (brote_rubros())) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'rubro');
  end if;
  if p_tamano is null then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'tamano');
  end if;
  if p_provincia is not null and not (p_provincia = any (brote_provincias())) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'provincia');
  end if;
  if char_length(coalesce(p_ciudad, '')) > 80 then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'ciudad');
  end if;
  if v_sitio is not null and (char_length(v_sitio) > 200 or v_sitio !~* '^(https?://)?[a-z0-9.-]+\.[a-z]{2,}(/.*)?$') then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'sitio_web');
  end if;

  perform pg_advisory_xact_lock(hashtext('create_business:' || v_uid::text));
  v_tope := coalesce((select (value #>> '{}')::int from app_settings where key = 'negocios_max_por_dueno'), 3);
  select count(*) into v_owned from business_members where user_id = v_uid and role = 'owner';
  if v_owned >= v_tope then return jsonb_build_object('ok', false, 'error', 'limite_negocios'); end if;

  -- Aprobada para su programa privado desde el primer día: los objetivos son
  -- suyos y no se muestran. La liga pública pide además verificarse.
  insert into businesses (slug, nombre_comercial, rubro, tamano, provincia, ciudad, sitio_web,
                          modelo, objetivo, status, intereses, created_by, alta_paso)
  values (brote_slugify(v_nombre), v_nombre, p_rubro, p_tamano, p_provincia, nullif(trim(coalesce(p_ciudad, '')), ''),
          case when v_sitio is null then null when v_sitio ~* '^https?://' then v_sitio else 'https://' || v_sitio end,
          'empresa', 'mejorar', 'approved', '{mejora}', v_uid, 5)
  returning id into v_id;
  insert into business_members (business_id, user_id, role) values (v_id, v_uid, 'owner');
  insert into improvement_dossiers (business_id) values (v_id) on conflict (business_id) do nothing;
  return jsonb_build_object('ok', true, 'id', v_id);
end $fn$;
revoke all on function public.empresa_crear(text, text, business_size, text, text, text) from public, anon;
grant execute on function public.empresa_crear(text, text, business_size, text, text, text) to authenticated;

-- ── 3 · La liga ─────────────────────────────────────────────────────────────

create or replace function public.brote_liga_temporada()
returns table(desde timestamptz, hasta timestamptz, nombre text)
language sql
stable
set search_path = public
as $fn$
  with q as (
    select date_trunc('quarter', now() at time zone 'America/Argentina/Buenos_Aires') as ini
  )
  select (q.ini at time zone 'America/Argentina/Buenos_Aires'),
         ((q.ini + interval '3 months') at time zone 'America/Argentina/Buenos_Aires'),
         extract(quarter from q.ini)::int || 'º trimestre ' || extract(year from q.ini)::int
  from q;
$fn$;

create or replace function public.brote_liga_verificada(p_business uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from businesses b
     where b.id = p_business and b.status = 'approved'
       and (b.tier <> 'e0'
            or exists (select 1 from business_verifications v
                        where v.business_id = b.id and v.status = 'verificado'
                          and v.method in ('dominio_meta', 'dominio_dns', 'dominio_archivo', 'email_dominio', 'social_token'))));
$fn$;

create or replace function public.brote_liga_puntaje(p_business uuid, p_desde timestamptz, p_hasta timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_logros numeric := 0; v_const numeric := 0; v_avance numeric := 0;
  v_semanas int; v_activas int; v_cerrados int; v_activos int; v_hasta timestamptz := least(now(), p_hasta);
begin
  -- Logros: los 4 mejores cierres aprobados por un revisor dentro de la temporada.
  select coalesce(sum(pts), 0), count(*) into v_logros, v_cerrados from (
    select 150
           * case g.status when 'logrado' then 1.0 else 0.5 end
           * case g.ambicion::text when 'avanzado' then 1.5 when 'intermedio' then 1.2 else 1.0 end as pts
      from improvement_goals g
     where g.business_id = p_business
       and g.status in ('logrado', 'logrado_parcial')
       and g.aprobado_por is not null
       and g.cerrado_at >= p_desde and g.cerrado_at < p_hasta
     order by 1 desc
     limit 4) x;
  v_logros := least(600, v_logros);

  -- Objetivos en curso hoy, y su avance por pasos.
  select count(*),
         coalesce(avg(least(1.0, coalesce(jsonb_array_length(g.pasos_hechos), 0)::numeric
                                 / greatest(1, coalesce(jsonb_array_length(g.pasos), 0)))), 0)
    into v_activos, v_avance
    from improvement_goals g
   where g.business_id = p_business and g.reemplazado_at is null
     and g.status in ('activo', 'en_riesgo', 'en_revision')
     and jsonb_typeof(coalesce(g.pasos, '[]'::jsonb)) = 'array'
     and jsonb_typeof(coalesce(g.pasos_hechos, '[]'::jsonb)) = 'array';
  v_avance := round(150 * v_avance);

  -- Constancia: semanas con un avance reportado (o un cierre), sobre las transcurridas.
  v_semanas := greatest(1, ceil(extract(epoch from (v_hasta - p_desde)) / (7 * 86400))::int);
  select count(distinct date_trunc('week', t)) into v_activas from (
    select c.created_at as t from goal_checkins c
     where c.business_id = p_business and c.created_at >= p_desde and c.created_at < v_hasta
    union all
    select g.cerrado_at from improvement_goals g
     where g.business_id = p_business and g.cerrado_at >= p_desde and g.cerrado_at < v_hasta
  ) s;
  v_const := round(250 * least(1.0, v_activas::numeric / v_semanas));

  return jsonb_build_object(
    'logros', round(v_logros)::int, 'constancia', v_const::int, 'avance', v_avance::int,
    'total', (round(v_logros) + v_const + v_avance)::int,
    'cerrados', v_cerrados, 'activos', v_activos, 'semanas', v_semanas, 'semanas_activas', v_activas);
end $fn$;

-- La tabla pública: empresas que mejoran, verificadas. Opcionalmente por rubro.
create or replace function public.liga_empresas(p_rubro text default null, p_limit int default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare t record;
begin
  if auth.uid() is null then return null; end if;
  select * into t from brote_liga_temporada();
  return jsonb_build_object(
    'temporada', jsonb_build_object('nombre', t.nombre, 'desde', t.desde, 'hasta', t.hasta),
    'filas', coalesce((
      select jsonb_agg(f order by (f->>'total')::int desc, f->>'nombre')
        from (
          select jsonb_build_object(
                   'id', b.id, 'nombre', b.nombre_comercial, 'slug', b.slug, 'logo', b.logo_url,
                   'rubro', b.rubro, 'tamano', b.tamano, 'provincia', b.provincia, 'tier', b.tier,
                   'progreso_mejora', b.progreso_mejora)
                 || brote_liga_puntaje(b.id, t.desde, t.hasta) as f
            from businesses b
           where b.objetivo in ('mejorar', 'ambos')
             and brote_liga_verificada(b.id)
             and (p_rubro is null or b.rubro = p_rubro)
        ) x
       limit greatest(1, least(200, coalesce(p_limit, 50)))), '[]'::jsonb));
end $fn$;

-- El puesto propio, esté o no verificada: así ve su puntaje desde el día uno.
create or replace function public.liga_mi_puesto(p_business uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare t record; v_mio jsonb; v_puesto int; v_total int; v_verif boolean; b businesses%rowtype;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  select * into t from brote_liga_temporada();
  v_mio := brote_liga_puntaje(p_business, t.desde, t.hasta);
  v_verif := brote_liga_verificada(p_business);
  select count(*) + 1 into v_puesto
    from businesses o
   where o.id <> p_business and o.objetivo in ('mejorar', 'ambos') and brote_liga_verificada(o.id)
     and (brote_liga_puntaje(o.id, t.desde, t.hasta)->>'total')::int > (v_mio->>'total')::int;
  select count(*) into v_total
    from businesses o where o.objetivo in ('mejorar', 'ambos') and brote_liga_verificada(o.id);
  return jsonb_build_object(
    'temporada', jsonb_build_object('nombre', t.nombre, 'desde', t.desde, 'hasta', t.hasta),
    'puntaje', v_mio,
    'verificada', v_verif,
    'participa', b.objetivo in ('mejorar', 'ambos'),
    'puesto', case when v_verif then v_puesto else null end,
    'empresas', v_total);
end $fn$;

revoke all on function public.brote_liga_temporada() from public, anon;
revoke all on function public.brote_liga_verificada(uuid) from public, anon, authenticated;
revoke all on function public.brote_liga_puntaje(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.liga_empresas(text, int) from public, anon;
revoke all on function public.liga_mi_puesto(uuid) from public, anon;
grant execute on function public.brote_liga_temporada() to authenticated;
grant execute on function public.liga_empresas(text, int) to authenticated;
grant execute on function public.liga_mi_puesto(uuid) to authenticated;

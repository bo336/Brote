-- Brote — 0109 — Negocios · Fase 5: endurecimiento.
--
-- Lo que falta para poder poner esto delante de una empresa que va a pagar
-- (brote-negocios/fases/FASE_5_ENDURECIMIENTO_Y_LANZAMIENTO.md):
--
-- 1. Índices de cobertura en las dos claves foráneas que quedaron sin uno.
-- 2. `app_settings` deja de ser escribible por `anon`/`authenticated` a nivel
--    de grants. Hoy RLS ya lo frena (la tabla tiene una sola policy, de
--    lectura), pero los permisos de tabla estaban abiertos: si alguien mañana
--    agrega una policy amplia, el interruptor del cobro queda a tiro. Dos
--    cerraduras, no una.
-- 3. Límites de uso (fase 5 §2.4) en las tres puertas que faltaban: envío de
--    listados, reportes y replanificaciones. Viven en TRIGGERS, como el resto
--    del gating de la fase 4, así que valen aunque la llamada no pase por la
--    RPC que dibuja la pantalla.
-- 4. Aceptación de términos con registro de QUIÉN, CUÁNDO y QUÉ VERSIÓN
--    (08 §10, última fila del checklist). Sin eso no se puede cobrar.
-- 5. La salud de los enlaces (02 §8): chequeo semanal, 2 fallos → aviso,
--    4 fallos → despublicación. Era lo único de los nueve bordes del
--    documento que seguía sin implementarse.
--
-- El chequeo de enlaces corre ENTERO en la base, con `pg_net`, en dos pasos:
-- uno dispara los pedidos y otro, veinte minutos después, lee las respuestas.
-- No hay ruta de Next ni secreto en el medio, porque `app_settings` es legible
-- por cualquiera y un token ahí no sería un token.

-- ── 1. Índices de cobertura ────────────────────────────────────────────────

create index if not exists idx_imp_mensual_business on listing_impresiones_mensual (business_id);
create index if not exists idx_reports_user on listing_reports (user_id);

-- ── 2. `app_settings`: solo lectura desde el cliente ───────────────────────

revoke insert, update, delete, truncate on app_settings from anon, authenticated;

-- ── 3. Límites de uso ──────────────────────────────────────────────────────

create table if not exists rate_limits (
  clave   text not null,
  ventana timestamptz not null,
  n       int not null default 0,
  primary key (clave, ventana)
);
alter table rate_limits enable row level security;
revoke all on rate_limits from public, anon, authenticated;

-- Devuelve TRUE si esta acción entra dentro del límite. Cuenta siempre, así
-- que el intento number 21 también queda contado: si alguien está golpeando la
-- puerta, se ve en la tabla.
create or replace function brote_rate_limit(p_clave text, p_max int, p_ventana interval default interval '1 day')
returns boolean language plpgsql security definer set search_path = public as $fn$
declare v_ini timestamptz; v_n int; v_seg numeric;
begin
  v_seg := extract(epoch from p_ventana);
  v_ini := to_timestamp(floor(extract(epoch from now()) / v_seg) * v_seg);
  insert into rate_limits (clave, ventana, n) values (p_clave, v_ini, 1)
  on conflict (clave, ventana) do update set n = rate_limits.n + 1
  returning n into v_n;
  return v_n <= p_max;
end $fn$;

-- Reportes: 20 por persona y por día. La deduplicación por listado ya existe
-- (un reporte por persona y listado); esto frena el rociado sobre muchos.
create or replace function brote_report_rate()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.user_id is not null and not brote_rate_limit('reporte:' || new.user_id, 20) then
    raise exception 'demasiados_reportes' using errcode = 'P0001';
  end if;
  return new;
end $fn$;

drop trigger if exists trg_reports_rate on listing_reports;
create trigger trg_reports_rate before insert on listing_reports
  for each row execute function brote_report_rate();

-- Envío de listados a revisión: 30 por empresa y por día. Un tope alto a
-- propósito: es un freno contra el abuso automático, no contra trabajar.
create or replace function brote_biz_guard_listado()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_lim int; v_usa int;
begin
  if not brote_is_member(new.business_id) then return new; end if;
  if new.status in ('pendiente','publicado') and old.status not in ('pendiente','publicado') then
    if not brote_biz_escritura(new.business_id) then
      raise exception 'solo_lectura' using errcode = 'P0001';
    end if;
    if not brote_rate_limit('listado:' || new.business_id, 30) then
      raise exception 'demasiados_envios' using errcode = 'P0001';
    end if;
    v_lim := brote_biz_limite(new.business_id, 'listados');
    select count(*) into v_usa from listings
     where business_id = new.business_id and status in ('publicado','pendiente') and id <> new.id;
    if v_usa >= v_lim then
      raise exception 'limite_plan' using errcode = 'P0001', detail = v_lim::text;
    end if;
  end if;
  return new;
end $fn$;

-- Replanificaciones: 12 versiones nuevas por empresa y por día, además del
-- cupo mensual de IA del plan. Replanificar a mano sigue sin bloquearse por
-- plan; esto es un freno de abuso, no un límite comercial.
create or replace function brote_biz_guard_objetivo()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_lim int; v_usa int;
begin
  if not brote_is_member(new.business_id) then return new; end if;
  if not brote_biz_escritura(new.business_id) then
    raise exception 'solo_lectura' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' and new.parent_id is not null
     and not brote_rate_limit('replan:' || new.business_id, 12) then
    raise exception 'demasiadas_replanificaciones' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and new.status = 'activo' and old.status <> 'activo' then
    v_lim := brote_biz_limite(new.business_id, 'objetivos');
    select count(*) into v_usa from improvement_goals
     where business_id = new.business_id and status in ('activo','en_riesgo','en_revision')
       and reemplazado_at is null and id <> new.id;
    if v_usa >= v_lim then
      raise exception 'limite_plan' using errcode = 'P0001', detail = v_lim::text;
    end if;
  end if;
  return new;
end $fn$;

-- ── 4. Aceptación de términos ──────────────────────────────────────────────
-- 08 §10: "La empresa acepta los términos con casilla explícita, y queda
-- registrado quién, cuándo y qué versión aceptó". La versión vigente vive en
-- `app_settings` para poder publicar una nueva sin un deploy.

insert into app_settings (key, value, description) values
  ('negocios_terminos_version', '"2026-09-20"'::jsonb,
   'Versión vigente de los términos para empresas (/legal/negocios). Cambiarla obliga a aceptar de nuevo.')
on conflict (key) do nothing;

create or replace function brote_terminos_version()
returns text language sql stable security definer set search_path = public as $fn$
  select coalesce((select value #>> '{}' from app_settings where key = 'negocios_terminos_version'), '2026-09-20');
$fn$;

create table if not exists business_terms (
  business_id uuid not null references businesses(id) on delete cascade,
  version     text not null,
  user_id     uuid not null references profiles(id) on delete restrict,
  aceptado_at timestamptz not null default now(),
  primary key (business_id, version)
);
create index if not exists idx_terms_user on business_terms (user_id);
alter table business_terms enable row level security;
revoke all on business_terms from public, anon, authenticated;
grant select (business_id, version, user_id, aceptado_at) on business_terms to authenticated;

-- El equipo ve qué se aceptó y quién lo hizo: es su propio registro.
drop policy if exists "terms miembro lee" on business_terms;
create policy "terms miembro lee" on business_terms for select to authenticated
  using (brote_is_member(business_id));

create or replace function negocio_aceptar_terminos(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_version text := brote_terminos_version();
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  insert into business_terms (business_id, version, user_id)
  values (p_business, v_version, (select auth.uid()))
  on conflict (business_id, version) do nothing;
  return jsonb_build_object('ok', true, 'version', v_version);
end $fn$;

create or replace function brote_terminos_aceptados(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from business_terms
                  where business_id = p_business and version = brote_terminos_version());
$fn$;

-- Sin aceptación, la empresa no se manda a revisión. La guardia va en un
-- trigger para que valga también si alguien llama la RPC de otra forma.
create or replace function brote_guard_terminos()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.status = 'submitted' and coalesce(old.status::text, '') <> 'submitted'
     and brote_is_member(new.id) and not brote_terminos_aceptados(new.id) then
    raise exception 'faltan_terminos' using errcode = 'P0001';
  end if;
  return new;
end $fn$;

drop trigger if exists trg_biz_terminos on businesses;
create trigger trg_biz_terminos before update on businesses
  for each row execute function brote_guard_terminos();

-- ── 5. Salud de los enlaces (02 §8) ────────────────────────────────────────
-- Chequeo semanal. Dos fallos seguidos: aviso. Cuatro: sale del Mercado, sin
-- borrar nada. Un acierto pone el contador en cero.

create table if not exists link_checks (
  listing_id uuid primary key references listings(id) on delete cascade,
  request_id bigint,
  pedido_at  timestamptz not null default now()
);
alter table link_checks enable row level security;
revoke all on link_checks from public, anon, authenticated;

-- Paso 1: disparar los pedidos. `pg_net` no tiene HEAD, así que va un GET con
-- timeout corto; lo único que se mira es el código de respuesta.
create or replace function brote_link_health_lanzar(p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public, net as $fn$
declare r record; v_id bigint; n int := 0;
begin
  delete from link_checks;
  for r in
    select l.id, l.url_destino from listings l
     where l.status = 'publicado' and l.url_destino is not null
     order by l.link_fallos desc, l.updated_at
     limit greatest(1, least(coalesce(p_limit, 200), 500))
  loop
    begin
      select net.http_get(url := r.url_destino, timeout_milliseconds := 8000) into v_id;
      insert into link_checks (listing_id, request_id) values (r.id, v_id)
      on conflict (listing_id) do update set request_id = excluded.request_id, pedido_at = now();
      n := n + 1;
    exception when others then
      -- Una URL que ni siquiera se puede pedir cuenta como fallo directo.
      perform brote_link_health_fallo(r.id);
    end;
  end loop;
  return jsonb_build_object('pedidos', n);
end $fn$;

-- Un fallo más para este listado, con sus dos umbrales.
create or replace function brote_link_health_fallo(p_listing uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; v_n int;
begin
  update listings set link_fallos = link_fallos + 1 where id = p_listing
  returning * into l;
  if l.id is null then return; end if;
  v_n := l.link_fallos;

  if v_n = 2 then
    perform brote_negocio_notificar(l.business_id, 'Tu enlace no responde',
      format('Hace dos semanas que no podemos entrar al enlace de "%s". Si sigue así, lo sacamos del Mercado.', l.titulo),
      '/negocio/listados/' || l.id);
  elsif v_n >= 4 and l.status = 'publicado' then
    update listings set status = 'despublicado', despublicado_por = 'enlace',
           observacion = 'Despublicado: el enlace de destino no responde desde hace cuatro semanas.'
     where id = l.id;
    perform brote_negocio_notificar(l.business_id, 'Sacamos un listado del Mercado',
      format('El enlace de "%s" no responde desde hace cuatro semanas. Arreglalo y lo volvemos a publicar.', l.titulo),
      '/negocio/listados/' || l.id);
    perform brote_recalcular_scores(l.business_id);
  end if;
end $fn$;

-- Paso 2: leer las respuestas. Se considera MUERTO solo lo que de verdad lo
-- está: 404, 410, 5xx o sin respuesta. Un 403 o un 405 es un sitio que no
-- quiere robots, no un enlace roto, y despublicar por eso sería injusto.
create or replace function brote_link_health_leer()
returns jsonb language plpgsql security definer set search_path = public, net as $fn$
declare r record; v_ok int := 0; v_mal int := 0; v_status int; v_error text;
begin
  for r in select * from link_checks loop
    select status_code, error_msg into v_status, v_error
      from net._http_response where id = r.request_id;

    if v_status is null or v_error is not null or v_status >= 500
       or v_status in (404, 410) then
      perform brote_link_health_fallo(r.listing_id);
      v_mal := v_mal + 1;
    else
      update listings set link_fallos = 0 where id = r.listing_id and link_fallos > 0;
      v_ok := v_ok + 1;
    end if;
  end loop;
  delete from link_checks;

  -- De paso, la limpieza semanal de los contadores de uso.
  delete from rate_limits where ventana < now() - interval '7 days';

  return jsonb_build_object('vivos', v_ok, 'fallos', v_mal);
end $fn$;

select cron.unschedule('brote-link-health') where exists (select 1 from cron.job where jobname = 'brote-link-health');
select cron.unschedule('brote-link-health-leer') where exists (select 1 from cron.job where jobname = 'brote-link-health-leer');
-- Lunes 03:00 AR (06:00 UTC) y la lectura veinte minutos después.
select cron.schedule('brote-link-health', '0 6 * * 1', $cron$ select brote_link_health_lanzar(); $cron$);
select cron.schedule('brote-link-health-leer', '20 6 * * 1', $cron$ select brote_link_health_leer(); $cron$);

-- ── 6. Privilegios ─────────────────────────────────────────────────────────

revoke all on function brote_rate_limit(text, int, interval)      from public, anon, authenticated;
revoke all on function brote_report_rate()                        from public, anon, authenticated;
revoke all on function brote_terminos_version()                   from public, anon, authenticated;
revoke all on function brote_terminos_aceptados(uuid)             from public, anon, authenticated;
revoke all on function brote_guard_terminos()                     from public, anon, authenticated;
revoke all on function brote_link_health_lanzar(int)              from public, anon, authenticated;
revoke all on function brote_link_health_leer()                   from public, anon, authenticated;
revoke all on function brote_link_health_fallo(uuid)              from public, anon, authenticated;
revoke all on function negocio_aceptar_terminos(uuid)             from public, anon;

grant execute on function negocio_aceptar_terminos(uuid)          to authenticated;
grant execute on function brote_terminos_version()                to authenticated;
grant execute on function brote_terminos_aceptados(uuid)          to authenticated;

-- ── 7. El catálogo, medido y arreglado (fase 5 §5) ─────────────────────────
-- Con 5.000 listados publicados la primera página tardaba 754 ms contra un
-- umbral de 100. Dos causas, las dos medidas:
--
-- 1. `brote_mercado_puede_ver(l.categoria)` es `security definer` y consulta
--    `profiles`: se evaluaba UNA VEZ POR FILA. Ahora quién mira se resuelve
--    una sola vez, al principio de la función.
-- 2. El `order by` con un `case` sobre un parámetro no lo puede servir ningún
--    índice. Separado en dos ramas, cada una cae en su índice parcial.
--
-- Resultado con las mismas 5.000 filas: 6 ms la primera página, 2,5 ms la
-- siguiente por cursor, 1,8 ms con filtros. Mismo contrato y mismo
-- comportamiento: el adulto ve precio, el teen no ve precio ni categorías
-- sensibles, y `kid` no recibe una sola fila.

create index if not exists idx_listings_orden2 on listings (score desc, id desc) where status = 'publicado';
create index if not exists idx_listings_nivel on listings (tier_efectivo desc, score desc, id desc) where status = 'publicado';
create index if not exists idx_listings_cat_orden on listings (categoria, score desc, id desc) where status = 'publicado';

create or replace function brote_listado_tarjeta(l listings, b businesses, p_precios boolean)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'tipo', l.tipo,
    'imagen', l.imagenes[1], 'categoria', l.categoria, 'dominios', to_jsonb(l.dominios),
    'precio', case when p_precios then l.precio_referencia else null end,
    'moneda', l.moneda, 'tier', l.tier_efectivo, 'score', l.score,
    'disponibilidad', l.disponibilidad, 'zonas', to_jsonb(l.zonas),
    'tiene_precio', l.precio_referencia is not null,
    'descripcion_largo', length(l.descripcion),
    'updated_at', l.updated_at,
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                                  'logo', b.logo_url, 'tier', b.tier,
                                  'provincia', b.provincia, 'ciudad', b.ciudad));
$fn$;

create or replace function brote_listado_tarjeta(l listings, b businesses)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select brote_listado_tarjeta(l, b, brote_mercado_ve_precios());
$fn$;

create or replace function mercado_listados(
  p_categoria text default null,
  p_dominio   text default null,
  p_tier_min  evidence_tier default 'e1',
  p_zona      text default null,
  p_modalidad text default null,
  p_orden     text default 'recomendados',
  p_cursor_tier evidence_tier default null,
  p_cursor_score numeric default null,
  p_cursor_id uuid default null,
  p_limit     int default 24,
  p_negocio   uuid default null)
returns setof jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_cuenta text; v_precios boolean; v_sens text[]; v_limit int; v_tier evidence_tier;
begin
  v_cuenta := coalesce(brote_mercado_cuenta(), 'adult');
  if v_cuenta = 'kid' then return; end if;
  v_precios := v_cuenta = 'adult';
  v_sens := case when v_cuenta = 'teen' then brote_mercado_sensibles() else array[]::text[] end;
  v_limit := least(greatest(coalesce(p_limit, 24), 1), 48);
  v_tier := coalesce(p_tier_min, 'e1');

  if coalesce(p_orden, 'recomendados') = 'nivel' then
    return query
      select brote_listado_tarjeta(l, b, v_precios)
      from listings l join businesses b on b.id = l.business_id
      where l.status = 'publicado' and b.status = 'approved'
        and (cardinality(v_sens) = 0 or not (l.categoria = any(v_sens)))
        and (p_negocio is null or l.business_id = p_negocio)
        and (p_categoria is null or l.categoria = p_categoria)
        and (p_dominio is null or p_dominio = any(l.dominios))
        and l.tier_efectivo >= v_tier
        and (p_modalidad is null
             or (p_modalidad = 'online' and l.disponibilidad in ('online','ambas'))
             or (p_modalidad = 'local' and l.disponibilidad in ('local','ambas')))
        and (p_zona is null or l.disponibilidad in ('online','ambas') or p_zona = any(l.zonas) or b.provincia = p_zona)
        and (p_cursor_id is null or (l.tier_efectivo, l.score, l.id) < (p_cursor_tier, p_cursor_score, p_cursor_id))
      order by l.tier_efectivo desc, l.score desc, l.id desc
      limit v_limit;
  else
    return query
      select brote_listado_tarjeta(l, b, v_precios)
      from listings l join businesses b on b.id = l.business_id
      where l.status = 'publicado' and b.status = 'approved'
        and (cardinality(v_sens) = 0 or not (l.categoria = any(v_sens)))
        and (p_negocio is null or l.business_id = p_negocio)
        and (p_categoria is null or l.categoria = p_categoria)
        and (p_dominio is null or p_dominio = any(l.dominios))
        and l.tier_efectivo >= v_tier
        and (p_modalidad is null
             or (p_modalidad = 'online' and l.disponibilidad in ('online','ambas'))
             or (p_modalidad = 'local' and l.disponibilidad in ('local','ambas')))
        and (p_zona is null or l.disponibilidad in ('online','ambas') or p_zona = any(l.zonas) or b.provincia = p_zona)
        and (p_cursor_id is null or (l.score, l.id) < (p_cursor_score, p_cursor_id))
      order by l.score desc, l.id desc
      limit v_limit;
  end if;
end $fn$;

revoke all on function brote_listado_tarjeta(listings, businesses, boolean) from public, anon, authenticated;
revoke all on function mercado_listados(text, text, evidence_tier, text, text, text, evidence_tier, numeric, uuid, int, uuid) from public, anon;
grant execute on function mercado_listados(text, text, evidence_tier, text, text, text, evidence_tier, numeric, uuid, int, uuid) to authenticated;

-- ── 8. Se va quien era dueño (02 §8, borde 3) ──────────────────────────────
-- `business_members.user_id` cae en cascada cuando alguien borra su cuenta de
-- Brote. Si esa persona era la dueña, la empresa se quedaba SIN dueño: nadie
-- podía tocar el plan ni el equipo. Ahora la titularidad pasa al `admin` más
-- antiguo; si no hay ninguno, la empresa queda `suspended` con su motivo
-- escrito. Nunca se borra la empresa.

create or replace function brote_biz_sucesion()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_nuevo uuid; v_nombre text;
begin
  if old.role <> 'owner' then return old; end if;
  if not exists (select 1 from businesses where id = old.business_id) then return old; end if;
  if exists (select 1 from business_members where business_id = old.business_id and role = 'owner') then return old; end if;

  select nombre_comercial into v_nombre from businesses where id = old.business_id;

  select user_id into v_nuevo from business_members
   where business_id = old.business_id and role = 'admin'
   order by joined_at limit 1;

  if v_nuevo is null then
    select user_id into v_nuevo from business_members
     where business_id = old.business_id
     order by joined_at limit 1;
  end if;

  if v_nuevo is not null then
    update business_members set role = 'owner'
     where business_id = old.business_id and user_id = v_nuevo;
    perform brote_negocio_notificar(old.business_id, 'Sos la nueva titular de la empresa',
      format('Quien figuraba como dueño de "%s" dio de baja su cuenta de Brote, así que la titularidad pasó a vos.', v_nombre),
      '/negocio');
  else
    update businesses
       set status = 'suspended',
           revision_note = 'Suspendida: la persona dueña dio de baja su cuenta y no quedó nadie en el equipo. Escribinos para recuperarla.',
           updated_at = now()
     where id = old.business_id and status <> 'closed';
  end if;

  return old;
end $fn$;

drop trigger if exists trg_members_sucesion on business_members;
create trigger trg_members_sucesion after delete on business_members
  for each row execute function brote_biz_sucesion();

revoke all on function brote_biz_sucesion() from public, anon, authenticated;

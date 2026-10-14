-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0130 — Avisos para el equipo (docs/LANZAMIENTO.md F4).
--
-- Cada vez que algo espera una respuesta del equipo, las cuentas vinculadas al
-- panel (0127, `brote_admins`) reciben un aviso: en la campana y en el
-- teléfono, sin horario de silencio ni tope (categoría 'admin', 0129).
--
-- Para que una ráfaga no sea una ráfaga de avisos: si llega lo mismo (misma
-- `clave`) mientras el aviso anterior sigue sin leer y tiene menos de 30
-- minutos, no se manda otro — se actualiza el que está ("3 productos para
-- revisar"). Pasada media hora, sí suena de nuevo.
--
-- Qué avisa:
--   · una empresa que pide revisión (alta nueva o corrección enviada);
--   · productos que esperan revisión;
--   · objetivos de empresas para cerrar;
--   · reportes de la Plaza y del Mercado;
--   · compromisos de tiendas con foto para mirar;
--   · altas, bajas y cobros fallidos de Brote+, tiendas y empresas;
--   · todas las mañanas a las 9, un resumen del día anterior y lo pendiente.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.brote_avisar_admins(p_clave text, p_titulo text, p_cuerpo text, p_url text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare a record; v_prev uuid; v_n int := 0; v_cuenta int;
begin
  for a in select user_id from brote_admins loop
    select n.id, coalesce((n.data ->> 'n')::int, 1) into v_prev, v_cuenta
      from notifications n
     where n.user_id = a.user_id and n.type = 'admin' and not n.read
       and n.data ->> 'clave' = p_clave and n.created_at > now() - interval '30 minutes'
     order by n.created_at desc limit 1;
    if v_prev is not null then
      update notifications
         set title_es = p_titulo, body_es = p_cuerpo,
             data = data || jsonb_build_object('n', v_cuenta + 1, 'url', p_url)
       where id = v_prev;
    else
      insert into notifications (user_id, type, title_es, body_es, data)
      values (a.user_id, 'admin', p_titulo, p_cuerpo,
              jsonb_build_object('admin', true, 'clave', p_clave, 'url', p_url, 'n', 1));
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
exception when others then
  return 0;  -- un aviso al equipo nunca puede frenar lo que hizo la persona
end $$;
revoke all on function public.brote_avisar_admins(text, text, text, text) from public, anon, authenticated;

-- ── Empresas que piden revisión ─────────────────────────────────────────────

create or replace function public.brote_equipo_negocio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug like 'demo-%' then return new; end if;
  if new.status in ('submitted', 'in_review')
     and (tg_op = 'INSERT' or old.status is distinct from new.status
          or (old.revision_note is not null and new.revision_note is null)) then
    perform brote_avisar_admins(
      'negocio:' || new.id,
      case when tg_op = 'UPDATE' and old.revision_note is not null and new.revision_note is null
           then 'Corrección enviada: ' || coalesce(new.nombre_comercial, 'una empresa')
           else 'Empresa para revisar: ' || coalesce(new.nombre_comercial, 'nueva') end,
      case new.objetivo when 'vender' then 'Una tienda quiere vender en el Mercado.'
                        when 'mejorar' then 'Una empresa quiere mejorar su impacto con Brote.'
                        else 'Una empresa quiere vender y mejorar.' end,
      '/panel/negocios/' || new.id);
  end if;
  return new;
end $$;

drop trigger if exists businesses_equipo on public.businesses;
create trigger businesses_equipo
  after insert or update of status, revision_note on public.businesses
  for each row execute function public.brote_equipo_negocio();

-- ── Productos para revisar ──────────────────────────────────────────────────

create or replace function public.brote_equipo_listado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  if new.status = 'pendiente' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    select count(*) into v_n from listings where status = 'pendiente';
    perform brote_avisar_admins(
      'listados',
      case when v_n <= 1 then 'Un producto para revisar' else v_n || ' productos para revisar' end,
      'El último: ' || coalesce(new.titulo, 'sin título') || '.',
      '/panel/listados');
  end if;
  return new;
end $$;

drop trigger if exists listings_equipo on public.listings;
create trigger listings_equipo
  after insert or update of status on public.listings
  for each row execute function public.brote_equipo_listado();

-- ── Objetivos de empresas para cerrar ───────────────────────────────────────

create or replace function public.brote_equipo_objetivo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'en_revision' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform brote_avisar_admins(
      'objetivos',
      'Objetivo para cerrar',
      coalesce((select nombre_comercial from businesses where id = new.business_id), 'Una empresa')
        || ' mandó evidencia de "' || left(coalesce(new.titulo, 'su objetivo'), 80) || '".',
      '/panel/objetivos');
  end if;
  return new;
end $$;

drop trigger if exists improvement_goals_equipo on public.improvement_goals;
create trigger improvement_goals_equipo
  after insert or update of status on public.improvement_goals
  for each row execute function public.brote_equipo_objetivo();

-- ── Reportes ────────────────────────────────────────────────────────────────

create or replace function public.brote_equipo_reporte_plaza()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  select count(*) into v_n from content_reports where status = 'open';
  perform brote_avisar_admins(
    'reportes_plaza',
    case when v_n <= 1 then 'Un reporte en la Plaza' else v_n || ' reportes en la Plaza' end,
    'Motivo del último: ' || coalesce(new.reason, 'sin motivo') || '.',
    '/panel#moderacion');
  return new;
end $$;

drop trigger if exists content_reports_equipo on public.content_reports;
create trigger content_reports_equipo
  after insert on public.content_reports
  for each row execute function public.brote_equipo_reporte_plaza();

create or replace function public.brote_equipo_reporte_mercado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  select count(*) into v_n from listing_reports where estado = 'abierto';
  perform brote_avisar_admins(
    'reportes_mercado',
    case when v_n <= 1 then 'Un reporte en el Mercado' else v_n || ' reportes en el Mercado' end,
    'Sobre: ' || coalesce((select titulo from listings where id = new.listing_id), 'un producto') || '.',
    '/panel/reportes');
  return new;
end $$;

drop trigger if exists listing_reports_equipo on public.listing_reports;
create trigger listing_reports_equipo
  after insert on public.listing_reports
  for each row execute function public.brote_equipo_reporte_mercado();

-- ── Compromisos de tiendas con foto ─────────────────────────────────────────

create or replace function public.brote_equipo_compromiso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'declarado' and new.foto_path is not null
     and (tg_op = 'INSERT' or old.foto_path is distinct from new.foto_path or old.estado is distinct from new.estado) then
    perform brote_avisar_admins(
      'compromisos',
      'Compromiso de tienda para mirar',
      coalesce((select nombre_comercial from businesses where id = new.business_id), 'Una tienda')
        || ' subió la foto de "' || new.practica || '".',
      '/panel/compromisos');
  end if;
  return new;
end $$;

drop trigger if exists tienda_compromisos_equipo on public.tienda_compromisos;
create trigger tienda_compromisos_equipo
  after insert or update of estado, foto_path on public.tienda_compromisos
  for each row execute function public.brote_equipo_compromiso();

-- ── Suscripciones: altas, bajas y cobros con problemas ──────────────────────

create or replace function public.brote_equipo_suscripcion_persona()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_quien text;
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;
  select coalesce(display_name, username::text, 'Alguien') into v_quien from profiles where id = new.user_id;
  if new.status = 'authorized' then
    perform brote_avisar_admins('plus:' || new.id || ':' || new.status, 'Nueva suscripción a Brote+ 🌱', v_quien || ' se suscribió.', '/panel/suscripciones');
  elsif new.status in ('cancelled', 'expired') and tg_op = 'UPDATE' and old.status = 'authorized' then
    perform brote_avisar_admins('plus:' || new.id || ':' || new.status, 'Baja de Brote+', v_quien || ' dejó Brote+.', '/panel/suscripciones');
  elsif new.status = 'paused' then
    perform brote_avisar_admins('plus:' || new.id || ':' || new.status, 'Brote+ en pausa', 'El cobro de ' || v_quien || ' quedó en pausa en Mercado Pago.', '/panel/suscripciones');
  end if;
  return new;
end $$;

drop trigger if exists subscriptions_equipo on public.subscriptions;
create trigger subscriptions_equipo
  after insert or update of status on public.subscriptions
  for each row execute function public.brote_equipo_suscripcion_persona();

create or replace function public.brote_equipo_suscripcion_negocio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_quien text; v_plan text;
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;
  select coalesce(nombre_comercial, 'Una empresa') into v_quien from businesses where id = new.business_id;
  v_plan := case new.plan::text when 'vendedor' then 'tienda' when 'semilla' then 'Semilla' when 'raiz' then 'Raíz' when 'bosque' then 'Bosque' else new.plan::text end;
  if new.status = 'activa' and (tg_op = 'INSERT' or old.status in ('pendiente', 'en_gracia', 'pausada')) then
    perform brote_avisar_admins('bizsub:' || new.id || ':' || new.status,
      case when tg_op = 'UPDATE' and old.status = 'en_gracia' then 'Cobro recuperado' else 'Nueva suscripción: ' || v_plan end,
      v_quien || ' está al día con el plan ' || v_plan || '.', '/panel/suscripciones');
  elsif new.status = 'en_gracia' then
    perform brote_avisar_admins('bizsub:' || new.id || ':' || new.status, 'Cobro rechazado', 'No entró el pago de ' || v_quien || ' (' || v_plan || '). Está en período de gracia.', '/panel/suscripciones');
  elsif new.status in ('cancelada', 'vencida') and tg_op = 'UPDATE' then
    perform brote_avisar_admins('bizsub:' || new.id || ':' || new.status, 'Baja: ' || v_plan, v_quien || ' dejó el plan ' || v_plan || '.', '/panel/suscripciones');
  end if;
  return new;
end $$;

drop trigger if exists business_subscriptions_equipo on public.business_subscriptions;
create trigger business_subscriptions_equipo
  after insert or update of status on public.business_subscriptions
  for each row execute function public.brote_equipo_suscripcion_negocio();

-- ── El resumen de las 9 ─────────────────────────────────────────────────────

create or replace function public.brote_resumen_equipo()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ayer date := (now() at time zone 'America/Argentina/Buenos_Aires')::date - 1;
  v_altas int; v_activos int; v_acciones int; v_pend int; v_errores int; v_total int;
begin
  if not exists (select 1 from brote_admins) then return 0; end if;
  select count(*) into v_total from profiles where not coalesce(es_prueba, false);
  select count(*) into v_altas from profiles
   where not coalesce(es_prueba, false) and (created_at at time zone 'America/Argentina/Buenos_Aires')::date = v_ayer;
  select count(distinct x.user_id) into v_activos from (
    select user_id from uso_diario where clave = 'activo' and dia = v_ayer
    union select user_id from activity_completions where local_date = v_ayer) x;
  select count(*) into v_acciones from activity_completions where local_date = v_ayer and status in ('honor', 'verified');
  select (select count(*) from content_reports where status = 'open')
       + (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null and slug not like 'demo-%')
       + (select count(*) from listings where status = 'pendiente')
       + (select count(*) from listing_reports where estado = 'abierto')
       + (select count(*) from improvement_goals where status = 'en_revision')
       + (select count(*) from ac_revision_cola where estado = 'pendiente')
    into v_pend;
  select count(*) into v_errores from world_client_errors where created_at > now() - interval '24 hours';

  return brote_avisar_admins(
    'resumen:' || v_ayer,
    'Ayer en Brote: ' || v_activos || ' personas activas',
    v_altas || ' cuentas nuevas (' || v_total || ' en total) · ' || v_acciones || ' acciones'
      || case when v_pend > 0 then ' · ' || v_pend || ' cosas esperan respuesta' else ' · nada pendiente' end
      || case when v_errores >= 5 then ' · ' || v_errores || ' fallos del mundo' else '' end || '.',
    '/panel');
end $$;
revoke all on function public.brote_resumen_equipo() from public, anon, authenticated;

select cron.unschedule('brote-resumen-equipo') where exists (select 1 from cron.job where jobname = 'brote-resumen-equipo');
select cron.schedule('brote-resumen-equipo', '0 12 * * *', $$select public.brote_resumen_equipo()$$);

revoke all on function public.brote_equipo_negocio() from public, anon, authenticated;
revoke all on function public.brote_equipo_listado() from public, anon, authenticated;
revoke all on function public.brote_equipo_objetivo() from public, anon, authenticated;
revoke all on function public.brote_equipo_reporte_plaza() from public, anon, authenticated;
revoke all on function public.brote_equipo_reporte_mercado() from public, anon, authenticated;
revoke all on function public.brote_equipo_compromiso() from public, anon, authenticated;
revoke all on function public.brote_equipo_suscripcion_persona() from public, anon, authenticated;
revoke all on function public.brote_equipo_suscripcion_negocio() from public, anon, authenticated;

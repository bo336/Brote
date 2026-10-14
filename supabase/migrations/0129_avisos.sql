-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0129 — Avisos que llegan de verdad (docs/LANZAMIENTO.md D6, D7, F3).
--
-- Lo que había: cada fila nueva en `notifications` disparaba UNA llamada a la
-- edge function `send-push`, con el título y el texto en el cuerpo del pedido.
-- Tres problemas:
--   1. `send-push` aceptaba `{user_id, title, body, url}` de cualquiera que
--      tuviera la anon key — que es pública —: cualquiera podía mandarle un
--      aviso con cualquier texto y cualquier enlace a cualquier persona.
--   2. Una invocación por aviso. En el plan gratis (500k/mes) un día con mucha
--      actividad social se come el cupo.
--   3. No había aviso de racha en riesgo a la noche, el resumen del lunes no
--      se empujaba (`system` no estaba en la lista) y nada respetaba la noche.
--
-- Lo nuevo:
--   · Cada aviso entra a una COLA (`push_estado`): un trigger BEFORE INSERT
--     decide si va al teléfono, cuándo (horario de silencio 22–9 h para lo que
--     no es urgente) y si no se pasa del tope (2 avisos de enganche por día).
--   · `send-push` ya no recibe textos: toma de la cola lo que venció
--     (`brote_push_tomar`), lo manda y lo cierra (`brote_push_cerrar`). Sólo se
--     puede empujar lo que existe en la base.
--   · La despierta un cron por minuto SÓLO si hay algo vencido, y un trigger
--     por sentencia con freno de 10 segundos, así lo que pasa ahora llega
--     ahora sin una invocación por fila.
--   · Claves VAPID: si no hay secretos, `send-push` genera el par la primera
--     vez y lo guarda en `push_config` (sin acceso desde el cliente). La
--     clave pública se pide con `brote_push_clave_publica()`.
--   · Avisos nuevos: racha en riesgo (20 h), novedades de la Plaza de gente
--     que seguís (18 h), y "te extrañamos" a los 3 y 14 días.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tipos nuevos ────────────────────────────────────────────────────────────
-- Se agregan acá y se usan sólo dentro de funciones: un valor de enum recién
-- agregado no se puede usar en la misma transacción fuera de un cuerpo.
alter type notif_type add value if not exists 'plaza';
alter type notif_type add value if not exists 'rango';
alter type notif_type add value if not exists 'reenganche';
alter type notif_type add value if not exists 'admin';

-- ── La cola ─────────────────────────────────────────────────────────────────

alter table public.notifications
  add column if not exists push_estado text
    check (push_estado in ('pendiente', 'enviando', 'enviada', 'omitida', 'sin_dispositivo', 'fallida')),
  add column if not exists push_programada_at timestamptz,
  add column if not exists push_enviada_at timestamptz,
  add column if not exists push_intentos smallint not null default 0,
  add column if not exists push_detalle text;

create index if not exists notifications_push_cola
  on public.notifications (push_programada_at)
  where push_estado in ('pendiente', 'enviando');
create index if not exists notifications_usuario_dia
  on public.notifications (user_id, created_at desc);

-- ── Claves VAPID ────────────────────────────────────────────────────────────

create table if not exists public.push_config (
  id          smallint primary key default 1 check (id = 1),
  public_key  text not null,
  private_key text,
  subject     text not null default 'mailto:hola@brote.app',
  origen      text not null default 'generada' check (origen in ('generada', 'secretos')),
  created_at  timestamptz not null default now()
);
alter table public.push_config enable row level security;
revoke all on public.push_config from public, anon, authenticated;

create or replace function public.brote_push_clave_publica()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public_key from push_config where id = 1;
$$;
revoke all on function public.brote_push_clave_publica() from public;
grant execute on function public.brote_push_clave_publica() to anon, authenticated;

-- ── Llamar a una edge function desde la base ────────────────────────────────
-- Sin clave: sólo para funciones desplegadas con "Verify JWT" apagado que no
-- confían en nada de lo que reciben. `send-push` es una: ignora el cuerpo y
-- sólo vacía la cola de la base, así que lo peor que puede hacer quien la
-- llame es adelantar un envío que igual iba a salir. Así la base no guarda
-- ninguna clave en el código.

create or replace function public.brote_llamar_funcion(p_funcion text, p_cuerpo jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_funcion !~ '^[a-z0-9-]{1,40}$' then return null; end if;
  return net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/' || p_funcion,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := coalesce(p_cuerpo, '{}'::jsonb));
end $$;
revoke all on function public.brote_llamar_funcion(text, jsonb) from public, anon, authenticated;

-- ── De qué se trata un aviso ────────────────────────────────────────────────
-- La categoría decide la preferencia que lo apaga, si respeta la noche y si
-- cuenta para el tope diario.

create or replace function public.brote_aviso_categoria(p_type notif_type, p_data jsonb, p_business uuid)
returns text
language sql
immutable
as $$
  select case
    when p_business is not null then 'empresa'
    when p_type::text = 'admin' or coalesce(p_data ->> 'admin', '') = 'true' then 'admin'
    when p_type::text in ('streak_risk', 'streak_lost') then 'racha'
    when p_type::text in ('reply', 'mention', 'follow', 'follow_request', 'friend') then 'social'
    when p_type::text in ('like', 'repost') then 'reacciones'
    when p_type::text = 'plaza' then 'plaza'
    when p_type::text in ('rango', 'rank_up') then 'rango'
    when p_type::text = 'reenganche' then 'reenganche'
    when p_type::text = 'academia_riego' then 'academia'
    when p_type::text = 'project' then 'proyectos'
    when p_type::text = 'challenge' then 'retos'
    when p_type::text = 'moderation' then 'cuenta'
    when p_type::text = 'system' and p_data ? 'recap_week' then 'recap'
    when p_type::text = 'system' then 'cuenta'
    else 'otros'  -- points, title, news: se ven en la app, no suenan
  end;
$$;

-- Qué preferencia de `notification_prefs` apaga cada categoría. Las claves
-- viejas (streak, challenges, projects, notif_*) se respetan tal cual.
create or replace function public.brote_aviso_permitido(p_prefs jsonb, p_cat text, p_type notif_type)
returns boolean
language sql
immutable
as $$
  select case
    when coalesce((p_prefs ->> 'push')::boolean, true) = false and p_cat <> 'admin' then false
    when p_cat = 'racha'      then coalesce((p_prefs ->> 'streak')::boolean, true)
    when p_cat = 'retos'      then coalesce((p_prefs ->> 'challenges')::boolean, true)
    when p_cat = 'proyectos'  then coalesce((p_prefs ->> 'projects')::boolean, true)
    when p_cat = 'social'     then coalesce((p_prefs ->> ('notif_' || p_type::text))::boolean, true)
    when p_cat = 'plaza'      then coalesce((p_prefs ->> 'plaza')::boolean, true)
    when p_cat = 'rango'      then coalesce((p_prefs ->> 'rango')::boolean, true)
    when p_cat = 'recap'      then coalesce((p_prefs ->> 'recap')::boolean, true)
    when p_cat = 'reenganche' then coalesce((p_prefs ->> 'reenganche')::boolean, true)
    when p_cat = 'academia'   then coalesce((p_prefs ->> 'academia')::boolean, true)
    when p_cat in ('empresa', 'admin', 'cuenta') then true
    else false
  end;
$$;

-- Cuándo sale: de noche (22 a 9, hora de Buenos Aires), lo que no es urgente
-- espera a las 9. Se puede apagar en Ajustes ('silencio' = false).
create or replace function public.brote_aviso_programar(p_ahora timestamptz, p_silencio boolean, p_cat text)
returns timestamptz
language sql
immutable
as $$
  select case
    when p_cat in ('admin', 'empresa') or not p_silencio then p_ahora
    when extract(hour from p_ahora at time zone 'America/Argentina/Buenos_Aires') >= 22 then
      (((p_ahora at time zone 'America/Argentina/Buenos_Aires')::date + 1)::timestamp + time '09:00') at time zone 'America/Argentina/Buenos_Aires'
    when extract(hour from p_ahora at time zone 'America/Argentina/Buenos_Aires') < 9 then
      (((p_ahora at time zone 'America/Argentina/Buenos_Aires')::date)::timestamp + time '09:00') at time zone 'America/Argentina/Buenos_Aires'
    else p_ahora
  end;
$$;

-- ── El trigger que decide ───────────────────────────────────────────────────

create or replace function public.brote_aviso_preparar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat text := brote_aviso_categoria(new.type, coalesce(new.data, '{}'::jsonb), new.business_id);
  v_prefs jsonb;
  v_biz jsonb;
  v_ahora_ba timestamp := now() at time zone 'America/Argentina/Buenos_Aires';
  v_enganche boolean := v_cat in ('racha', 'plaza', 'rango', 'recap', 'reenganche', 'academia');
  v_hoy_ba date := v_ahora_ba::date;
begin
  -- Quien ya decidió (un generador que marca 'omitida') manda.
  if new.push_estado is not null then return new; end if;

  if v_cat in ('otros', 'reacciones') then return new; end if;

  if not exists (select 1 from push_subscriptions where user_id = new.user_id) then
    new.push_estado := 'sin_dispositivo';
    return new;
  end if;

  select notification_prefs into v_prefs from profiles where id = new.user_id;
  v_prefs := coalesce(v_prefs, '{}'::jsonb);

  if new.business_id is not null then
    -- Las preferencias del equipo de la empresa (0108): los pagos siempre.
    select avisos into v_biz from business_members where business_id = new.business_id and user_id = new.user_id;
    if coalesce(new.data ->> 'categoria', 'cuenta') <> 'pagos'
       and coalesce((v_biz ->> coalesce(new.data ->> 'categoria', 'cuenta'))::boolean, true) = false then
      return new;
    end if;
    if coalesce((v_prefs ->> 'push')::boolean, true) = false then return new; end if;
  elsif not brote_aviso_permitido(v_prefs, v_cat, new.type) then
    return new;
  end if;

  -- Tope: dos avisos de enganche por día y por persona. El resto queda en la
  -- campana de la app, que es donde pertenece.
  if v_enganche and (
      select count(*) from notifications n
       where n.user_id = new.user_id
         and n.created_at >= (v_hoy_ba::timestamp at time zone 'America/Argentina/Buenos_Aires')
         and n.push_estado in ('pendiente', 'enviando', 'enviada')
         and brote_aviso_categoria(n.type, coalesce(n.data, '{}'::jsonb), n.business_id)
             in ('racha', 'plaza', 'rango', 'recap', 'reenganche', 'academia')) >= 2 then
    new.push_estado := 'omitida';
    new.push_detalle := 'tope_diario';
    return new;
  end if;

  new.push_estado := 'pendiente';
  new.push_programada_at := brote_aviso_programar(now(), coalesce((v_prefs ->> 'silencio')::boolean, true), v_cat);
  return new;
end $$;
revoke all on function public.brote_aviso_preparar() from public, anon, authenticated;

drop trigger if exists notifications_push on public.notifications;
drop function if exists public.notify_push();
drop trigger if exists notifications_aviso_preparar on public.notifications;
create trigger notifications_aviso_preparar
  before insert on public.notifications
  for each row execute function public.brote_aviso_preparar();

-- Despierta a `send-push` cuando entra algo para ya, como mucho cada 10 s.
create or replace function public.brote_push_despertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_ultima timestamptz;
begin
  if not exists (select 1 from nuevas where push_estado = 'pendiente' and push_programada_at <= now()) then
    return null;
  end if;
  select updated_at into v_ultima from app_state where key = 'push_despertar';
  if v_ultima is not null and v_ultima > now() - interval '10 seconds' then return null; end if;
  insert into app_state (key, value, updated_at) values ('push_despertar', '{}'::jsonb, now())
  on conflict (key) do update set updated_at = now();
  perform brote_llamar_funcion('send-push', '{}'::jsonb);
  return null;
exception when others then
  return null;  -- un aviso nunca puede hacer fallar lo que lo generó
end $$;
revoke all on function public.brote_push_despertar() from public, anon, authenticated;

drop trigger if exists notifications_push_despertar on public.notifications;
create trigger notifications_push_despertar
  after insert on public.notifications
  referencing new table as nuevas
  for each statement execute function public.brote_push_despertar();

-- ── Lo que usa `send-push` ──────────────────────────────────────────────────

-- Toma hasta p_limite avisos vencidos y los marca 'enviando'. Un 'enviando' de
-- hace más de 10 minutos es un envío que murió a mitad: se reintenta (3 veces).
create or replace function public.brote_push_tomar(p_limite int default 200)
returns table (id uuid, user_id uuid, titulo text, cuerpo text, url text, etiqueta text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  return query
  with tomadas as (
    select n.id
      from notifications n
     where (n.push_estado = 'pendiente' and n.push_programada_at <= now())
        or (n.push_estado = 'enviando' and n.push_programada_at <= now() - interval '10 minutes' and n.push_intentos < 3)
     order by n.push_programada_at
     limit least(greatest(coalesce(p_limite, 200), 1), 500)
     for update skip locked
  ), marcadas as (
    update notifications n
       set push_estado = 'enviando', push_intentos = n.push_intentos + 1, push_programada_at = now()
      from tomadas t
     where n.id = t.id
    returning n.*
  )
  select m.id, m.user_id, m.title_es, coalesce(m.body_es, ''),
         -- Enlace profundo + marca de origen para la analítica.
         (case
            when coalesce(m.data ->> 'url', '') ~ '^/' then m.data ->> 'url'
            when m.data ? 'post_id' then '/feed/p/' || (m.data ->> 'post_id')
            when m.data ? 'user_id' then coalesce('/perfil/' || (select p.username::text from profiles p where p.id = (m.data ->> 'user_id')::uuid), '/feed')
            when m.business_id is not null then '/negocio'
            else '/'
          end)
         || (case when coalesce(m.data ->> 'url', '/') like '%?%' then '&' else '?' end) || 'desde=aviso',
         brote_aviso_categoria(m.type, coalesce(m.data, '{}'::jsonb), m.business_id)
    from marcadas m;
end $$;

-- Cierra lo que se mandó: [{id, ok, detalle}].
create or replace function public.brote_push_cerrar(p_resultados jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  update notifications n
     set push_estado = case
                         when (r ->> 'ok')::boolean then 'enviada'
                         when r ->> 'detalle' = 'sin_dispositivo' then 'sin_dispositivo'
                         when n.push_intentos >= 3 then 'fallida'
                         else 'pendiente' end,
         push_enviada_at = case when (r ->> 'ok')::boolean then now() else n.push_enviada_at end,
         push_programada_at = case when (r ->> 'ok')::boolean then n.push_programada_at else now() + interval '5 minutes' end,
         push_detalle = left(r ->> 'detalle', 200)
    from jsonb_array_elements(coalesce(p_resultados, '[]'::jsonb)) r
   where n.id = (r ->> 'id')::uuid and n.push_estado = 'enviando';
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function public.brote_push_tomar(int) from public, anon, authenticated;
revoke all on function public.brote_push_cerrar(jsonb) from public, anon, authenticated;
grant execute on function public.brote_push_tomar(int) to service_role;
grant execute on function public.brote_push_cerrar(jsonb) to service_role;

-- El reloj: cada minuto, y sólo si hay algo vencido (sin cola, cero invocaciones).
select cron.unschedule('brote-push') where exists (select 1 from cron.job where jobname = 'brote-push');
select cron.schedule('brote-push', '* * * * *', $$
  select public.brote_llamar_funcion('send-push', '{}'::jsonb)
   where exists (select 1 from public.notifications
                  where push_estado = 'pendiente' and push_programada_at <= now())
      or not exists (select 1 from public.push_config);
$$);

-- ── Avisos nuevos ───────────────────────────────────────────────────────────

-- 20 h: racha en riesgo. Sólo a quien tiene racha y hoy todavía no hizo nada.
create or replace function public.brote_avisos_racha()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; v_n int;
begin
  insert into notifications (user_id, type, title_es, body_es, data)
  select p.id, 'streak_risk',
         case when p.current_streak >= 7 then 'Tu racha de ' || p.current_streak || ' días se corta a medianoche 🔥'
              else 'Tu racha se corta a medianoche' end,
         case when coalesce(p.streak_freezes, 0) > 0
              then 'Una acción de un minuto alcanza. Si no, usás un protector.'
              else 'Una acción de un minuto alcanza para sostenerla.' end,
         jsonb_build_object('url', '/acciones', 'racha', p.current_streak, 'dia', v_hoy)
    from profiles p
   where p.current_streak >= 1
     and p.last_streak_date = v_hoy - 1
     and p.onboarding_completed
     and not exists (select 1 from notifications n
                      where n.user_id = p.id and n.type = 'streak_risk' and n.data ->> 'dia' = v_hoy::text);
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- 18 h: lo nuevo en la Plaza de gente que seguís, desde tu última visita.
create or replace function public.brote_avisos_plaza()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; v_n int;
begin
  with ultima as (
    select f.follower_id as user_id,
           coalesce((select max(u.dia) from uso_diario u where u.user_id = f.follower_id and u.clave = 'sec:plaza'),
                    v_hoy - 1) as visto
      from follows f
     group by f.follower_id
  ), nuevas as (
    select u.user_id, count(*) as n,
           array_agg(distinct coalesce(p.display_name, p.username::text)) as autores
      from ultima u
      join follows f on f.follower_id = u.user_id
      join feed_posts fp on fp.author_id = f.followee_id
      join profiles p on p.id = fp.author_id
     where fp.kind = 'post' and not fp.hidden
       and fp.created_at > greatest((u.visto + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires', now() - interval '2 days')
     group by u.user_id
  )
  insert into notifications (user_id, type, title_es, body_es, data)
  select x.user_id, 'plaza',
         case when x.n = 1 then 'Hay algo nuevo en la Plaza' else 'Hay ' || x.n || ' publicaciones nuevas en la Plaza' end,
         case array_length(x.autores, 1)
           when 1 then x.autores[1] || ' compartió lo que está haciendo.'
           when 2 then x.autores[1] || ' y ' || x.autores[2] || ' compartieron lo que están haciendo.'
           else x.autores[1] || ', ' || x.autores[2] || ' y ' || (array_length(x.autores, 1) - 2)
                || case when array_length(x.autores, 1) - 2 = 1 then ' persona más' else ' personas más' end
                || ' compartieron lo que están haciendo.'
         end,
         jsonb_build_object('url', '/feed', 'dia', v_hoy, 'n', x.n)
    from nuevas x
    join profiles pr on pr.id = x.user_id
   where pr.account_type <> 'kid' and pr.onboarding_completed
     and not exists (select 1 from notifications n
                      where n.user_id = x.user_id and n.type = 'plaza' and n.created_at > now() - interval '20 hours');
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- 18:30: "te extrañamos", a los 3 y a los 14 días sin abrir. Una vez cada uno.
create or replace function public.brote_avisos_reenganche()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; v_n int;
begin
  with ultimo as (
    select p.id,
           greatest(
             coalesce((select max(u.dia) from uso_diario u where u.user_id = p.id and u.clave = 'activo'), date '2000-01-01'),
             coalesce(p.last_streak_date, date '2000-01-01'),
             (p.created_at at time zone 'America/Argentina/Buenos_Aires')::date) as dia,
           p.current_streak, p.longest_streak
      from profiles p
     where p.onboarding_completed and not coalesce(p.es_prueba, false)
  )
  insert into notifications (user_id, type, title_es, body_es, data)
  select u.id, 'reenganche',
         case when v_hoy - u.dia = 3 then 'Tu mundo te espera 🌱' else 'Hace dos semanas que no pasás' end,
         case when v_hoy - u.dia = 3 then 'Una acción de hoy y vuelve a crecer. Lo que construiste sigue ahí.'
              else 'Arrancá de nuevo con algo chiquito: hoy hay acciones de un minuto.' end,
         jsonb_build_object('url', '/', 'dias', v_hoy - u.dia)
    from ultimo u
   where v_hoy - u.dia in (3, 14)
     and not exists (select 1 from notifications n
                      where n.user_id = u.id and n.type = 'reenganche' and n.created_at > now() - interval '6 days');
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function public.brote_avisos_racha() from public, anon, authenticated;
revoke all on function public.brote_avisos_plaza() from public, anon, authenticated;
revoke all on function public.brote_avisos_reenganche() from public, anon, authenticated;

-- Horarios en UTC (Buenos Aires = UTC−3).
select cron.unschedule('brote-avisos-racha') where exists (select 1 from cron.job where jobname = 'brote-avisos-racha');
select cron.unschedule('brote-avisos-plaza') where exists (select 1 from cron.job where jobname = 'brote-avisos-plaza');
select cron.unschedule('brote-avisos-reenganche') where exists (select 1 from cron.job where jobname = 'brote-avisos-reenganche');
select cron.schedule('brote-avisos-racha', '0 23 * * *', $$select public.brote_avisos_racha()$$);
select cron.schedule('brote-avisos-plaza', '0 21 * * *', $$select public.brote_avisos_plaza()$$);
select cron.schedule('brote-avisos-reenganche', '30 21 * * *', $$select public.brote_avisos_reenganche()$$);

-- ── Dispositivos ────────────────────────────────────────────────────────────
-- Un dispositivo avisa a la cuenta que lo está usando ahora. Con un upsert
-- directo desde el cliente, un teléfono que cambió de cuenta chocaba contra la
-- fila de la anterior (RLS) y quedaba avisándole a la otra persona.

create or replace function public.registrar_dispositivo(p_endpoint text, p_p256dh text, p_auth text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    return jsonb_build_object('ok', false, 'error', 'suscripcion_invalida');
  end if;
  if not brote_rate_limit('dispositivo:' || v_uid, 30, interval '1 day') then
    return jsonb_build_object('ok', false, 'error', 'limite');
  end if;
  insert into push_subscriptions (user_id, endpoint, p256dh, auth)
  values (v_uid, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = v_uid, p256dh = excluded.p256dh, auth = excluded.auth;
  -- Más de 10 dispositivos por persona no es un uso real: se quedan los últimos.
  delete from push_subscriptions s
   where s.user_id = v_uid
     and s.id not in (select id from push_subscriptions where user_id = v_uid order by created_at desc limit 10);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.registrar_dispositivo(text, text, text) from public, anon;
grant execute on function public.registrar_dispositivo(text, text, text) to authenticated;

-- ── Para Ajustes y el panel ─────────────────────────────────────────────────

-- El estado de los avisos de una persona (para "probar un aviso" en Ajustes).
create or replace function public.mis_avisos_probar()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  if not exists (select 1 from push_subscriptions where user_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Este dispositivo todavía no tiene los avisos activados.');
  end if;
  if not brote_rate_limit('aviso_prueba:' || v_uid, 3, interval '1 hour') then
    return jsonb_build_object('ok', false, 'error', 'Ya mandamos varios de prueba. Probá en un rato.');
  end if;
  insert into notifications (user_id, type, title_es, body_es, data, push_estado, push_programada_at)
  values (v_uid, 'system', 'Así te van a llegar los avisos 🌱', 'Todo listo. Te avisamos sólo lo que elegiste.',
          jsonb_build_object('url', '/perfil/ajustes', 'prueba', true), 'pendiente', now());
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.mis_avisos_probar() from public, anon;
grant execute on function public.mis_avisos_probar() to authenticated;

-- El estado de la cola, para el panel.
create or replace function public.admin_avisos_estado(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object(
    'ok', true,
    'claves', exists (select 1 from push_config),
    'clave_origen', (select origen from push_config where id = 1),
    'dispositivos', (select count(*) from push_subscriptions),
    'personas_con_avisos', (select count(distinct user_id) from push_subscriptions),
    'pendientes', (select count(*) from notifications where push_estado in ('pendiente', 'enviando')),
    'vencidas', (select count(*) from notifications where push_estado = 'pendiente' and push_programada_at <= now() - interval '5 minutes'),
    'enviadas_24h', (select count(*) from notifications where push_estado = 'enviada' and push_enviada_at > now() - interval '24 hours'),
    'fallidas_24h', (select count(*) from notifications where push_estado = 'fallida' and created_at > now() - interval '24 hours'),
    'omitidas_24h', (select count(*) from notifications where push_estado = 'omitida' and created_at > now() - interval '24 hours'),
    'por_categoria_7d', (select coalesce(jsonb_object_agg(cat, n), '{}'::jsonb) from (
        select brote_aviso_categoria(type, coalesce(data, '{}'::jsonb), business_id) cat, count(*) n
          from notifications where push_estado = 'enviada' and push_enviada_at > now() - interval '7 days' group by 1) x)
  );
end $$;
revoke all on function public.admin_avisos_estado(text) from public, anon;
grant execute on function public.admin_avisos_estado(text) to authenticated;

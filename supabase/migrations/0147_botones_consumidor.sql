-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0147 — Botón de arrepentimiento y botón de baja de servicio.
--
-- Lo que pide la Disposición 954/2025 (SSDCyLC, BO 04/09/2025, que derogó las
-- Res. 424/2020 y 316/2018), con la Disposición 3/2026 (DNDCyAC, BO 06/02/2026):
--
--   · Art. 1 y 4: dos links a simple vista, en lugar destacado y en el primer
--     acceso, "BOTÓN DE ARREPENTIMIENTO" y "BOTÓN DE BAJA DE SERVICIO", que se
--     usan SIN registración previa ni trámite adicional. Por eso las dos RPC de
--     acá se pueden llamar sin cuenta (anon).
--   · Art. 5: dentro de las 24 horas y por el mismo medio, un código de
--     identificación del pedido, y hacer lo necesario para que se cumpla. El
--     código sale en el momento, en la misma pantalla.
--   · Disp. 3/2026: se puede verificar la identidad con pasos razonables, nunca
--     para retener ni demorar. Acá alcanza con el correo de la cuenta: si el
--     pedido llega con sesión, ya está verificado; si no, el panel muestra con
--     qué cuenta coincide el correo.
--
-- El derecho de arrepentimiento son 10 días corridos (Ley 24.240 art. 34, CCyC
-- art. 1110). Para Brote+ dentro de ese plazo, la app puede devolver el dinero
-- sola (ajuste `consumidor_reembolso_auto`); lo demás lo resuelve el dueño
-- desde /panel/consumidor, con un botón por caso.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.consumidor_solicitudes (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique,
  tipo           text not null check (tipo in ('arrepentimiento', 'baja')),
  servicio       text not null check (servicio in ('brote_plus', 'tienda', 'empresa', 'anuncio', 'otro')),
  user_id        uuid references auth.users (id) on delete set null,
  nombre         text not null check (char_length(nombre) between 2 and 120),
  email          text not null check (char_length(email) between 5 and 200),
  referencia     text check (char_length(referencia) <= 120),
  mensaje        text check (char_length(mensaje) <= 1000),
  estado         text not null default 'recibida' check (estado in ('recibida', 'en_proceso', 'resuelta', 'rechazada')),
  resolucion     text check (char_length(resolucion) <= 1000),
  detalle        jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  actualizada_at timestamptz not null default now(),
  resuelta_at    timestamptz
);
create index if not exists idx_consumidor_abiertas on public.consumidor_solicitudes (created_at)
  where estado in ('recibida', 'en_proceso');
create index if not exists idx_consumidor_user on public.consumidor_solicitudes (user_id);
create index if not exists idx_consumidor_email on public.consumidor_solicitudes (lower(email));
alter table public.consumidor_solicitudes enable row level security;
revoke all on public.consumidor_solicitudes from public, anon, authenticated;

insert into app_settings (key, value, description) values
  ('consumidor_reembolso_auto', 'true'::jsonb,
   'Botón de arrepentimiento de Brote+ dentro de los 10 días, con sesión iniciada: se da de baja y se devuelve el dinero sola, sin esperar al panel. Una sola vez por persona.')
on conflict (key) do nothing;

-- ARR-XXXX-XXXX o BAJ-XXXX-XXXX, sin letras que se confundan.
create or replace function public.brote_consumidor_codigo(p_tipo text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v text; alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  loop
    v := case when p_tipo = 'baja' then 'BAJ-' else 'ARR-' end;
    for i in 1..8 loop
      v := v || substr(alfabeto, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % length(alfabeto)), 1);
      if i = 4 then v := v || '-'; end if;
    end loop;
    exit when not exists (select 1 from consumidor_solicitudes where codigo = v);
  end loop;
  return v;
end $$;
revoke all on function public.brote_consumidor_codigo(text) from public, anon, authenticated;

create or replace function public.brote_consumidor_servicio(p text)
returns text
language sql
immutable
as $$
  select case p when 'brote_plus' then 'Brote+' when 'tienda' then 'la suscripción de tu tienda'
                when 'empresa' then 'el plan de tu empresa' when 'anuncio' then 'un anuncio'
                else 'otro servicio' end;
$$;

-- ── El pedido: con cuenta o sin ella ────────────────────────────────────────

create or replace function public.consumidor_solicitar(
  p_tipo text, p_servicio text, p_nombre text, p_email text,
  p_referencia text default null, p_mensaje text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_ref text := nullif(btrim(coalesce(p_referencia, '')), '');
  v_msg text := nullif(btrim(coalesce(p_mensaje, '')), '');
  v_codigo text; v_id uuid; v_creada timestamptz;
begin
  if coalesce(p_tipo, '') not in ('arrepentimiento', 'baja') then return jsonb_build_object('ok', false, 'error', 'tipo'); end if;
  if coalesce(p_servicio, '') not in ('brote_plus', 'tienda', 'empresa', 'anuncio', 'otro') then
    return jsonb_build_object('ok', false, 'error', 'servicio');
  end if;
  if v_email = '' and v_uid is not null then select lower(email) into v_email from auth.users where id = v_uid; end if;
  if char_length(v_nombre) not between 2 and 120 then return jsonb_build_object('ok', false, 'error', 'nombre'); end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_email) > 200 then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;
  if char_length(coalesce(v_ref, '')) > 120 then return jsonb_build_object('ok', false, 'error', 'referencia'); end if;
  if char_length(coalesce(v_msg, '')) > 1000 then return jsonb_build_object('ok', false, 'error', 'mensaje'); end if;

  -- Sin cuenta también (Disp. 954/2025): el freno es por correo, y uno general
  -- para los pedidos sin sesión, alto, sólo contra el abuso automático.
  if not brote_rate_limit('consumidor:' || v_email, 6) then return jsonb_build_object('ok', false, 'error', 'demasiadas'); end if;
  if v_uid is null and not brote_rate_limit('consumidor:sin_cuenta', 300) then
    return jsonb_build_object('ok', false, 'error', 'demasiadas');
  end if;

  v_codigo := brote_consumidor_codigo(p_tipo);
  insert into consumidor_solicitudes (codigo, tipo, servicio, user_id, nombre, email, referencia, mensaje)
  values (v_codigo, p_tipo, p_servicio, v_uid, v_nombre, v_email, v_ref, v_msg)
  returning id, created_at into v_id, v_creada;

  perform brote_avisar_admins('consumidor:' || v_codigo,
    case when p_tipo = 'baja' then 'Botón de baja: ' else 'Botón de arrepentimiento: ' end || brote_consumidor_servicio(p_servicio),
    v_nombre || ' · ' || v_codigo || ' · ' || case when v_uid is null then 'sin cuenta' else 'con su cuenta' end,
    '/panel/consumidor');

  if v_uid is not null then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'system',
            case when p_tipo = 'baja' then 'Recibimos tu pedido de baja' else 'Recibimos tu pedido de arrepentimiento' end,
            'Tu código es ' || v_codigo || '. Te avisamos acá cuando esté resuelto.',
            jsonb_build_object('url', '/legal/' || case when p_tipo = 'baja' then 'baja' else 'arrepentimiento' end || '?codigo=' || v_codigo));
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'codigo', v_codigo, 'creada', v_creada);
end $$;
revoke all on function public.consumidor_solicitar(text, text, text, text, text, text) from public;
grant execute on function public.consumidor_solicitar(text, text, text, text, text, text) to anon, authenticated;

-- Cómo va un pedido: con el código y el correo, sin cuenta.
create or replace function public.consumidor_consultar(p_codigo text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare s consumidor_solicitudes%rowtype; v_cod text := upper(btrim(coalesce(p_codigo, '')));
begin
  if not brote_rate_limit('consumidor_consulta:' || v_cod, 30) then return jsonb_build_object('ok', false, 'error', 'demasiadas'); end if;
  select * into s from consumidor_solicitudes
   where codigo = v_cod
     and (email = lower(btrim(coalesce(p_email, ''))) or (user_id is not null and user_id = auth.uid()));
  if s.id is null then return jsonb_build_object('ok', false, 'error', 'no_encontrada'); end if;
  return jsonb_build_object('ok', true, 'codigo', s.codigo, 'tipo', s.tipo, 'servicio', s.servicio,
    'estado', s.estado, 'creada', s.created_at, 'resuelta', s.resuelta_at, 'resolucion', s.resolucion);
end $$;
revoke all on function public.consumidor_consultar(text, text) from public;
grant execute on function public.consumidor_consultar(text, text) to anon, authenticated;

-- Lo que esta persona tiene contratado, para darlo de baja en el momento.
create or replace function public.consumidor_mis_servicios()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); s subscriptions%rowtype; v_reemb boolean;
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  select * into s from subscriptions where user_id = v_uid order by created_at desc limit 1;
  -- Una devolución sola por persona: cuenta también la pedida sin sesión con su correo.
  v_reemb := exists (select 1 from consumidor_solicitudes c
                      where (c.user_id = v_uid or c.email = (select lower(email) from auth.users where id = v_uid))
                        and c.detalle ? 'reembolsos');
  return jsonb_build_object(
    'ok', true,
    'tipo', (select account_type from profiles where id = v_uid),
    'email', (select email from auth.users where id = v_uid),
    'nombre', (select display_name from profiles where id = v_uid),
    'es_plus', brote_is_pro(v_uid),
    'brote_plus', case when s.id is null then null else jsonb_build_object(
        'estado', s.status, 'alta', s.created_at, 'monto', s.amount,
        'activa', s.status in ('authorized', 'paused', 'pending'),
        'en_plazo', s.created_at > now() - interval '10 days',
        'ya_reembolsada', v_reemb) end,
    'negocios', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'nombre', b.nombre_comercial, 'plan', bs.plan, 'estado', bs.status,
                                          'alta', bs.created_at, 'en_plazo', bs.created_at > now() - interval '10 days')
                       order by bs.created_at desc)
        from business_members m
        join businesses b on b.id = m.business_id
        join lateral (select * from business_subscriptions x where x.business_id = b.id
                       and x.status in ('activa', 'en_gracia', 'pendiente') order by x.created_at desc limit 1) bs on true
       where m.user_id = v_uid and m.role = 'owner'), '[]'::jsonb),
    'reembolso_auto', brote_ajuste_bool('consumidor_reembolso_auto', true));
end $$;
revoke all on function public.consumidor_mis_servicios() from public, anon;
grant execute on function public.consumidor_mis_servicios() to authenticated;

-- ── Lo que escribe el servidor (service_role) ───────────────────────────────

-- Cerrar o mover un pedido, y avisarle a la persona si tiene cuenta.
create or replace function public.consumidor_marcar(p_codigo text, p_estado text, p_resolucion text, p_detalle jsonb default '{}')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare s consumidor_solicitudes%rowtype;
begin
  if coalesce(p_estado, '') not in ('recibida', 'en_proceso', 'resuelta', 'rechazada') then
    return jsonb_build_object('ok', false, 'error', 'estado');
  end if;
  update consumidor_solicitudes
     set estado = p_estado,
         resolucion = coalesce(nullif(btrim(coalesce(p_resolucion, '')), ''), resolucion),
         detalle = detalle || coalesce(p_detalle, '{}'::jsonb),
         actualizada_at = now(),
         resuelta_at = case when p_estado in ('resuelta', 'rechazada') then now() else null end
   where codigo = upper(btrim(p_codigo))
  returning * into s;
  if s.id is null then return jsonb_build_object('ok', false, 'error', 'no_encontrada'); end if;
  if s.user_id is not null and p_estado in ('resuelta', 'rechazada', 'en_proceso') then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (s.user_id, 'system',
            case p_estado when 'resuelta' then 'Tu pedido ' || s.codigo || ' está resuelto'
                          when 'rechazada' then 'Tu pedido ' || s.codigo || ' no se pudo hacer'
                          else 'Estamos con tu pedido ' || s.codigo end,
            coalesce(s.resolucion, 'Mirá el detalle en el enlace.'),
            jsonb_build_object('url', '/legal/' || case when s.tipo = 'baja' then 'baja' else 'arrepentimiento' end || '?codigo=' || s.codigo));
  end if;
  return jsonb_build_object('ok', true, 'codigo', s.codigo, 'estado', s.estado);
end $$;
revoke all on function public.consumidor_marcar(text, text, text, jsonb) from public, anon, authenticated;

-- Lo que el servidor necesita para cobrar o devolver: nunca sale al navegador.
create or replace function public.consumidor_datos_cobro(p_codigo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare s consumidor_solicitudes%rowtype; v_user uuid; sub subscriptions%rowtype;
begin
  select * into s from consumidor_solicitudes where codigo = upper(btrim(p_codigo));
  if s.id is null then return null; end if;
  v_user := coalesce(s.user_id, (select id from auth.users where lower(email) = s.email limit 1));
  select * into sub from subscriptions where user_id = v_user order by created_at desc limit 1;
  return jsonb_build_object(
    'codigo', s.codigo, 'tipo', s.tipo, 'servicio', s.servicio, 'estado', s.estado,
    'user_id', v_user,
    'plus', case when sub.id is null then null else jsonb_build_object(
        'external_id', sub.external_id, 'estado', sub.status, 'alta', sub.created_at, 'monto', sub.amount) end,
    'ya_reembolsada', exists (select 1 from consumidor_solicitudes c
                               where (c.user_id = v_user or c.email = (select lower(email) from auth.users where id = v_user))
                                 and c.detalle ? 'reembolsos' and c.id <> s.id),
    'negocios', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'external_id', bs.external_id, 'estado', bs.status))
        from business_members m
        join businesses b on b.id = m.business_id
        join lateral (select * from business_subscriptions x where x.business_id = b.id
                       order by x.created_at desc limit 1) bs on true
       where m.user_id = v_user and m.role = 'owner'), '[]'::jsonb));
end $$;
revoke all on function public.consumidor_datos_cobro(text) from public, anon, authenticated;

-- Arrepentimiento de Brote+: se termina en el momento (no hasta el fin del
-- período, como una baja común), porque se devuelve lo pagado.
create or replace function public.plus_revocar(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update subscriptions set status = 'cancelled', updated_at = now()
   where user_id = p_user and status in ('authorized', 'paused', 'pending');
  update profiles set plan = 'free'::plan_tier, plan_expires_at = now() where id = p_user;
  return jsonb_build_object('ok', true, 'is_pro', brote_is_pro(p_user));
end $$;
revoke all on function public.plus_revocar(uuid) from public, anon, authenticated;

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_consumidor(p_pass text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  return jsonb_build_object(
    'ok', true,
    'reembolso_auto', brote_ajuste_bool('consumidor_reembolso_auto', true),
    'abiertas', (select count(*) from consumidor_solicitudes where estado in ('recibida', 'en_proceso')),
    'filas', coalesce((
      select jsonb_agg(f order by f.abierta desc, f.creada desc)
        from (
          select s.id, s.codigo, s.tipo, s.servicio, s.nombre, s.email, s.referencia, s.mensaje, s.estado,
                 s.resolucion, s.detalle, s.created_at as creada, s.resuelta_at as resuelta,
                 s.estado in ('recibida', 'en_proceso') as abierta,
                 (s.user_id is not null) as con_sesion,
                 u.id as cuenta_id, p.display_name as cuenta_nombre, p.account_type as cuenta_tipo,
                 case when sub.id is null then null else jsonb_build_object(
                   'estado', sub.status, 'alta', sub.created_at, 'monto', sub.amount,
                   'dias', floor(extract(epoch from (s.created_at - sub.created_at)) / 86400)) end as plus,
                 coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'nombre', b.nombre_comercial, 'plan', bs.plan, 'estado', bs.status))
                             from business_members m join businesses b on b.id = m.business_id
                             join lateral (select * from business_subscriptions x where x.business_id = b.id
                                            order by x.created_at desc limit 1) bs on true
                            where m.user_id = u.id and m.role = 'owner'), '[]'::jsonb) as negocios
            from consumidor_solicitudes s
            left join auth.users u on u.id = coalesce(s.user_id, (select id from auth.users x where lower(x.email) = s.email limit 1))
            left join profiles p on p.id = u.id
            left join lateral (select * from subscriptions y where y.user_id = u.id order by y.created_at desc limit 1) sub on true
           order by s.created_at desc
           limit 200) f), '[]'::jsonb));
end $$;
revoke all on function public.admin_consumidor(text) from public, anon;
grant execute on function public.admin_consumidor(text) to authenticated;

create or replace function public.admin_consumidor_resolver(p_pass text, p_codigo text, p_estado text, p_resolucion text, p_detalle jsonb default '{}')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  if p_estado in ('resuelta', 'rechazada') and char_length(btrim(coalesce(p_resolucion, ''))) < 5 then
    return jsonb_build_object('ok', false, 'error', 'Escribí qué se hizo: la persona lo ve.');
  end if;
  return consumidor_marcar(p_codigo, p_estado, p_resolucion,
    coalesce(p_detalle, '{}'::jsonb) || jsonb_build_object('resuelta_por', auth.uid()));
end $$;
revoke all on function public.admin_consumidor_resolver(text, text, text, text, jsonb) from public, anon;
grant execute on function public.admin_consumidor_resolver(text, text, text, text, jsonb) to authenticated;

-- La bandeja del panel cuenta los pedidos abiertos (copia de 0143 + `consumidor`).
create or replace function public.admin_pendientes(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Sin acceso');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reportes_plaza', (select count(*) from content_reports where status = 'open'),
    'negocios',       (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null),
    'desafios',       (select count(*) from empresa_desafio_inscripciones where estado = 'enviada'),
    'listados',       (select count(*) from listings l join businesses b on b.id = l.business_id
                        where l.status = 'pendiente' and b.slug not like 'demo-%'),
    'auditoria',      (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
    'reportes_mercado', (select count(*) from listing_reports where estado = 'abierto'),
    'objetivos',      (select count(*) from improvement_goals where status = 'en_revision'),
    'compromisos',    (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                        where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'academia',       (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'pagos_fallidos', (select count(*) from business_subscriptions where status = 'en_gracia')
                    + (select count(*) from subscriptions where status = 'paused')
                    + (select count(*) from pagos_eventos where procesado_at is null and recibido_at < now() - interval '10 minutes'),
    'consumidor',     (select count(*) from consumidor_solicitudes where estado in ('recibida', 'en_proceso')),
    'errores_mundo_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours'),
    'errores_app_24h', (select coalesce(sum(n), 0) from app_errores where ultimo_at > now() - interval '24 hours'));
end $$;

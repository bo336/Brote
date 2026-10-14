-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0131 — Las tres suscripciones, listas para cobrar (LANZAMIENTO F5).
--
--   · Brote+ (personas): mensual y anual. Se fija en DÓLARES y se cobra en
--     pesos al oficial del día, igual que la tienda (0114): un precio en pesos
--     fijo queda viejo en un mes. Se vende sólo con `plus_venta_activa`; si está
--     apagado, la pantalla muestra los beneficios y "muy pronto", sin botón.
--   · Tiendas del Mercado (plan `vendedor`, 0114): sin cambios de lógica; sus
--     dos ajustes (`mercado_cobro_vendedores`, `mercado_vendedor_usd`) ahora
--     existen en `app_settings`, así se ven y se cambian desde el panel.
--   · Empresas que mejoran (semilla/raíz/bosque, 0108): sin cambios de lógica;
--     el cobro se inicia ahora desde el servidor de la app como la tienda.
--
-- Arreglos y lo que faltaba para que Brote+ cumpla lo que promete:
--   · `apply_subscription_event` mandaba "¡Bienvenido a Brote+!" con CADA
--     cobro mensual. Ahora sólo cuando la suscripción pasa a autorizada, y avisa
--     también la baja (con hasta cuándo sigue).
--   · "2 protectores de racha por mes" no lo daba nada: `brote_plus_protectores`
--     los suma una vez por mes (tope 4 guardados).
--   · "Tu impacto mes a mes": `mi_impacto_mensual()` (sólo Brote+).
--   · El panel: `admin_suscripciones` (cuántas, cuánto entra, las últimas) y la
--     bandeja suma los cobros con problemas.
-- ════════════════════════════════════════════════════════════════════════════

insert into app_settings (key, value, description) values
  ('plus_venta_activa', 'false'::jsonb, 'Brote+ a la venta. Apagado: se ven los beneficios y "muy pronto", sin botón para pagar.'),
  ('plus_usd_mes', '2.99'::jsonb, 'Brote+ por mes, en dólares. Se cobra en pesos al dólar oficial del día.'),
  ('plus_usd_anio', '24.99'::jsonb, 'Brote+ por año, en dólares. Se cobra en pesos al dólar oficial del día.'),
  ('mercado_cobro_vendedores', 'true'::jsonb, 'Cobrar la suscripción a las tiendas del Mercado. Apagado: abren sin pagar.'),
  ('mercado_vendedor_usd', '5'::jsonb, 'Suscripción mensual de una tienda del Mercado, en dólares.')
on conflict (key) do nothing;

-- ── El precio de Brote+ ─────────────────────────────────────────────────────

create or replace function public.brote_plus_precio(p_periodo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_usd numeric; v_tc jsonb;
begin
  v_usd := case when p_periodo = 'anio' then brote_ajuste_num('plus_usd_anio', 24.99)
                else brote_ajuste_num('plus_usd_mes', 2.99) end;
  v_tc := brote_tipo_cambio_actual();
  return jsonb_build_object(
    'periodo', case when p_periodo = 'anio' then 'anio' else 'mes' end,
    'usd', v_usd,
    -- Redondeado para arriba a la decena: "$ 4.590", no "$ 4.589,65".
    'ars', case when v_tc is null then null else ceil(v_usd * (v_tc ->> 'venta')::numeric / 10) * 10 end,
    'tipo_cambio', (v_tc ->> 'venta')::numeric,
    'fecha', v_tc ->> 'fecha');
end $$;
revoke all on function public.brote_plus_precio(text) from public, anon, authenticated;

-- Lo que la pantalla de Brote+ necesita, en una llamada.
create or replace function public.plus_estado()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); p profiles%rowtype; s subscriptions%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  select * into p from profiles where id = v_uid;
  select * into s from subscriptions where user_id = v_uid order by updated_at desc limit 1;
  return jsonb_build_object(
    'ok', true,
    'tipo', p.account_type,
    'es_plus', brote_is_pro(v_uid),
    'hasta', p.plan_expires_at,
    'suscripcion', case when s.id is null then null else jsonb_build_object(
        'estado', s.status, 'monto', s.amount, 'moneda', s.currency, 'proximo', s.current_period_end,
        'periodo', case when coalesce((s.raw #>> '{auto_recurring,frequency}')::int, 1) >= 12 then 'anio' else 'mes' end) end,
    'venta_activa', brote_ajuste_bool('plus_venta_activa', false),
    'precios', jsonb_build_object('mes', brote_plus_precio('mes'), 'anio', brote_plus_precio('anio')),
    'protectores', p.streak_freezes);
end $$;
revoke all on function public.plus_estado() from public, anon;
grant execute on function public.plus_estado() to authenticated;

-- La cotización que usa el servidor para crear el cobro: el monto lo decide
-- la base, nunca el cliente.
create or replace function public.plus_cotizar(p_periodo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_tipo account_type; v_precio jsonb; v_email text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select account_type into v_tipo from profiles where id = v_uid;
  -- Un cobro que se repite todos los meses no lo firma un menor (D7).
  if v_tipo is distinct from 'adult' then return jsonb_build_object('ok', false, 'error', 'menor'); end if;
  if not brote_ajuste_bool('plus_venta_activa', false) then return jsonb_build_object('ok', false, 'error', 'venta_cerrada'); end if;
  if exists (select 1 from subscriptions where user_id = v_uid and status = 'authorized') then
    return jsonb_build_object('ok', false, 'error', 'ya_suscripta');
  end if;
  v_precio := brote_plus_precio(p_periodo);
  if (v_precio ->> 'ars') is null then return jsonb_build_object('ok', false, 'error', 'sin_cotizacion'); end if;
  select email into v_email from auth.users where id = v_uid;
  return jsonb_build_object(
    'ok', true,
    'monto', (v_precio ->> 'ars')::numeric,
    'periodo', v_precio ->> 'periodo',
    'frecuencia', case when v_precio ->> 'periodo' = 'anio' then 12 else 1 end,
    'email', v_email,
    'razon', case when v_precio ->> 'periodo' = 'anio'
                  then format('Brote+ anual (USD %s por año)', replace(v_precio ->> 'usd', '.', ','))
                  else format('Brote+ mensual (USD %s por mes)', replace(v_precio ->> 'usd', '.', ',')) end);
end $$;
revoke all on function public.plus_cotizar(text) from public, anon;
grant execute on function public.plus_cotizar(text) to authenticated;

-- La suscripción vigente de esta persona en Mercado Pago (para darse de baja).
create or replace function public.plus_suscripcion_externa()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select external_id from subscriptions
   where user_id = auth.uid() and status in ('authorized', 'paused', 'pending')
   order by updated_at desc limit 1;
$$;
revoke all on function public.plus_suscripcion_externa() from public, anon;
grant execute on function public.plus_suscripcion_externa() to authenticated;

-- ── Lo que aplica el webhook ────────────────────────────────────────────────

create or replace function public.apply_subscription_event(
  p_user_id uuid, p_external_id text, p_status text, p_amount numeric, p_currency text,
  p_period_end timestamptz, p_raw jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_status sub_status; v_prev sub_status; v_hasta timestamptz;
begin
  v_status := case lower(coalesce(p_status, ''))
    when 'authorized' then 'authorized' when 'active' then 'authorized'
    when 'paused' then 'paused' when 'cancelled' then 'cancelled'
    when 'canceled' then 'cancelled' when 'expired' then 'expired'
    else 'pending' end::sub_status;

  select status into v_prev from subscriptions where external_id = p_external_id;

  insert into subscriptions (user_id, external_id, status, amount, currency, current_period_end, raw)
  values (p_user_id, p_external_id, v_status, p_amount, coalesce(p_currency, 'ARS'), p_period_end, coalesce(p_raw, '{}'))
  on conflict (external_id) do update
    set status = excluded.status, amount = coalesce(excluded.amount, subscriptions.amount),
        currency = excluded.currency,
        current_period_end = coalesce(excluded.current_period_end, subscriptions.current_period_end),
        raw = excluded.raw, updated_at = now();

  if v_status = 'authorized' then
    -- Hasta el próximo cobro, con un día de margen por si Mercado Pago tarda.
    v_hasta := coalesce(p_period_end, now() + interval '31 days') + interval '1 day';
    update profiles set plan = 'plus'::plan_tier, plan_expires_at = greatest(coalesce(plan_expires_at, now()), v_hasta)
     where id = p_user_id;
    if v_prev is distinct from 'authorized' then
      insert into notifications (user_id, type, title_es, body_es, data)
      values (p_user_id, 'system', '¡Ya sos Brote+! 🌟',
              'Gracias por sostener el proyecto. Se fue la publicidad y la Academia no tiene tope.',
              jsonb_build_object('url', '/brote-plus'));
      -- Los protectores del mes, en el momento: no hay que esperar al cron.
      perform brote_plus_protectores_de(p_user_id);
    end if;
  else
    -- Pausada o dada de baja: sigue siendo Brote+ hasta el final de lo pagado.
    -- (El original no casteaba el `case` y fallaba con "plan is of type
    -- plan_tier but expression is of type text": ninguna baja se aplicaba.)
    update profiles set plan = (case when plan_expires_at is not null and plan_expires_at > now() then 'plus' else 'free' end)::plan_tier
     where id = p_user_id;
    if v_prev = 'authorized' and v_status in ('cancelled', 'expired') then
      insert into notifications (user_id, type, title_es, body_es, data)
      select p_user_id, 'system', 'Tu Brote+ termina pronto',
             case when plan_expires_at > now()
                  then 'Seguís teniendo todo hasta el ' || to_char(plan_expires_at at time zone 'America/Argentina/Buenos_Aires', 'DD/MM') || '. Gracias por acompañar.'
                  else 'Gracias por haber acompañado. Lo que hiciste en Brote sigue siendo tuyo.' end,
             jsonb_build_object('url', '/brote-plus')
        from profiles where id = p_user_id;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'status', v_status::text, 'is_pro', brote_is_pro(p_user_id));
end $$;

-- ── Los protectores de racha del mes ────────────────────────────────────────

create table if not exists public.plus_beneficios (
  user_id uuid not null references auth.users (id) on delete cascade,
  mes     date not null,
  protectores smallint not null default 0,
  primary key (user_id, mes)
);
alter table public.plus_beneficios enable row level security;
revoke all on public.plus_beneficios from public, anon, authenticated;

create or replace function public.brote_plus_protectores_de(p_uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_mes date := date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if not brote_is_pro(p_uid) then return false; end if;
  insert into plus_beneficios (user_id, mes, protectores) values (p_uid, v_mes, 2)
  on conflict (user_id, mes) do nothing;
  if not found then return false; end if;
  -- Se acumulan, pero no más de 4 guardados: es un salvavidas, no una reserva.
  update profiles set streak_freezes = least(coalesce(streak_freezes, 0) + 2, greatest(coalesce(streak_freezes, 0), 4))
   where id = p_uid;
  return true;
end $$;

create or replace function public.brote_plus_protectores()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r record; v_n int := 0;
begin
  for r in select id from profiles where plan = 'plus' and (plan_expires_at is null or plan_expires_at > now()) loop
    if brote_plus_protectores_de(r.id) then v_n := v_n + 1; end if;
  end loop;
  return v_n;
end $$;
revoke all on function public.brote_plus_protectores_de(uuid) from public, anon, authenticated;
revoke all on function public.brote_plus_protectores() from public, anon, authenticated;

select cron.unschedule('brote-plus-protectores') where exists (select 1 from cron.job where jobname = 'brote-plus-protectores');
select cron.schedule('brote-plus-protectores', '20 3 * * *', $$select public.brote_plus_protectores()$$);

-- ── Tu impacto mes a mes (Brote+) ───────────────────────────────────────────

create or replace function public.mi_impacto_mensual()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  if not brote_is_pro(v_uid) then return jsonb_build_object('ok', false, 'plus', false); end if;
  return jsonb_build_object('ok', true, 'plus', true, 'meses', coalesce((
    select jsonb_agg(jsonb_build_object(
             'mes', m.mes,
             'acciones', coalesce(x.acciones, 0),
             'dias', coalesce(x.dias, 0),
             'agua_l', round(coalesce(x.agua, 0)),
             'co2_kg', round(coalesce(x.co2, 0)::numeric, 1),
             'residuos_kg', round(coalesce(x.residuos, 0)::numeric, 1),
             'energia_kwh', round(coalesce(x.energia, 0)::numeric, 1),
             'tema', x.tema) order by m.mes)
      from (select generate_series(date_trunc('month', v_hoy) - interval '11 months', date_trunc('month', v_hoy), interval '1 month')::date as mes) m
      left join lateral (
        select count(*) as acciones, count(distinct c.local_date) as dias,
               sum(coalesce(c.impact_water_l, a.impact_water_l)) as agua,
               sum(coalesce(c.impact_co2_kg, a.impact_co2_kg)) as co2,
               sum(coalesce(c.impact_waste_kg, a.impact_waste_kg)) as residuos,
               sum(coalesce(c.impact_energy_kwh, a.impact_energy_kwh)) as energia,
               mode() within group (order by c.domain_slug) as tema
          from activity_completions c join activities a on a.id = c.activity_id
         where c.user_id = v_uid and c.status in ('honor', 'verified') and not ('juego' = any(a.tags))
           and c.local_date >= m.mes and c.local_date < (m.mes + interval '1 month')::date
      ) x on true), '[]'::jsonb));
end $$;
revoke all on function public.mi_impacto_mensual() from public, anon;
grant execute on function public.mi_impacto_mensual() to authenticated;

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_suscripciones(p_pass text)
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
    'ajustes', (select coalesce(jsonb_object_agg(key, jsonb_build_object('value', value, 'description', description)), '{}'::jsonb)
                  from app_settings
                 where key in ('plus_venta_activa', 'plus_usd_mes', 'plus_usd_anio', 'mercado_cobro_vendedores',
                               'mercado_vendedor_usd', 'negocios_cobro_activo', 'negocios_precio_semilla',
                               'negocios_precio_raiz', 'negocios_precio_bosque')),
    'tipo_cambio', brote_tipo_cambio_actual(),
    'precios', jsonb_build_object(
      'plus_mes', brote_plus_precio('mes'), 'plus_anio', brote_plus_precio('anio'),
      'tienda', brote_vendedor_precio(),
      'semilla', brote_biz_precio('semilla'), 'raiz', brote_biz_precio('raiz'), 'bosque', brote_biz_precio('bosque')),
    'plus', jsonb_build_object(
      'activas', (select count(*) from subscriptions where status = 'authorized'),
      'anuales', (select count(*) from subscriptions where status = 'authorized' and coalesce((raw #>> '{auto_recurring,frequency}')::int, 1) >= 12),
      'pendientes', (select count(*) from subscriptions where status = 'pending' and created_at > now() - interval '7 days'),
      'pausadas', (select count(*) from subscriptions where status = 'paused'),
      'bajas_30d', (select count(*) from subscriptions where status in ('cancelled', 'expired') and updated_at > now() - interval '30 days'),
      'con_beneficio', (select count(*) from profiles where plan = 'plus' and (plan_expires_at is null or plan_expires_at > now())),
      -- Ingreso mensual estimado: lo mensual entero + lo anual dividido 12.
      'ingreso_mes_ars', (select coalesce(sum(case when coalesce((raw #>> '{auto_recurring,frequency}')::int, 1) >= 12
                                                  then amount / 12 else amount end), 0)
                            from subscriptions where status = 'authorized')),
    'negocios', (select coalesce(jsonb_object_agg(k.plan, k.datos), '{}'::jsonb) from (
        select plan::text as plan, jsonb_build_object(
                 'activas', count(*) filter (where status = 'activa'),
                 'en_gracia', count(*) filter (where status = 'en_gracia'),
                 'pendientes', count(*) filter (where status = 'pendiente'),
                 'bajas_30d', count(*) filter (where status in ('cancelada', 'vencida') and updated_at > now() - interval '30 days'),
                 'ingreso_mes_ars', coalesce(sum(monto) filter (where status in ('activa', 'en_gracia')), 0)) as datos
          from business_subscriptions group by plan) k),
    'eventos_sin_procesar', (select count(*) from pagos_eventos where procesado_at is null and recibido_at < now() - interval '10 minutes'),
    'ultimas', coalesce((
      select jsonb_agg(x order by x.cuando desc) from (
        select 'plus' as producto, s.status::text as estado, s.amount as monto, s.updated_at as cuando,
               coalesce(p.display_name, p.username::text) as quien,
               case when coalesce((s.raw #>> '{auto_recurring,frequency}')::int, 1) >= 12 then 'anual' else 'mensual' end as detalle
          from subscriptions s left join profiles p on p.id = s.user_id
        union all
        select case when bs.plan = 'vendedor' then 'tienda' else 'empresa' end, bs.status::text, bs.monto, bs.updated_at,
               b.nombre_comercial, bs.plan::text
          from business_subscriptions bs left join businesses b on b.id = bs.business_id
        order by 4 desc limit 40) x), '[]'::jsonb)
  );
end $$;
revoke all on function public.admin_suscripciones(text) from public, anon;
grant execute on function public.admin_suscripciones(text) to authenticated;

-- La bandeja (0128) suma los cobros con problemas.
create or replace function public.admin_pendientes(p_pass text)
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
    'reportes_plaza', (select count(*) from content_reports where status = 'open'),
    'negocios',       (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null),
    'listados',       (select count(*) from listings where status = 'pendiente'),
    'auditoria',      (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
    'reportes_mercado', (select count(*) from listing_reports where estado = 'abierto'),
    'objetivos',      (select count(*) from improvement_goals where status = 'en_revision'),
    'compromisos',    (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                        where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'academia',       (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'pagos_fallidos', (select count(*) from business_subscriptions where status = 'en_gracia')
                    + (select count(*) from subscriptions where status = 'paused')
                    + (select count(*) from pagos_eventos where procesado_at is null and recibido_at < now() - interval '10 minutes'),
    'errores_mundo_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours')
  );
end $$;

-- Brote — 0108 — Negocios · Fase 4: integración y cobro.
--
-- Tres cosas: el Mercado se conecta con la app de personas, la empresa ve una
-- analítica honesta, y existe el cobro mensual por MercadoPago —apagado detrás
-- de una bandera hasta que el dueño decida prenderlo (09 §10).
-- (brote-negocios/fases/FASE_4_INTEGRACION_Y_COBRO.md, 04_ESQUEMA_DB.md §5,
-- 09_MONETIZACION.md, 02_ESPECIFICACION.md §6-§8.)
--
-- LO QUE NO CAMBIA, Y ES LO MÁS IMPORTANTE
--
-- El plan NO entra en el orden del catálogo. `brote_listado_score` no recibe
-- ningún término de plan en esta migración ni en ninguna otra (09 §2.1). Lo
-- único que el plan compra es CAPACIDAD (cuántos listados, cuántos objetivos)
-- y CONVENIENCIA (analítica, publicación acelerada, equipo).
--
-- DECISIONES DE ESTA FASE
--
-- 1. El gating vive en TRIGGERS, no repartido por las RPC. Un `insert` directo
--    de un miembro (las policies de `business_members` dejan al owner escribir)
--    tiene que chocar con el mismo tope que la pantalla: esconder un botón no
--    es gating (09 §5). Los triggers solo frenan a un MIEMBRO: el job diario
--    (sin `auth.uid()`) y el revisor siguen pudiendo mover todo.
-- 2. La bandera y los precios viven en `app_settings`, no en `app_state`: es
--    la tabla que el panel de `/panel` ya pinta sola —los booleanos como
--    interruptor y los números como campo—, así que prenderlo es un clic y no
--    un deploy, que es lo que pide 09 §10. Sin fila de precio no se puede
--    suscribir a nadie: el precio nunca está en el código.
-- 3. Con el cobro APAGADO, toda empresa aprobada está en MODO FUNDADOR: plan
--    `raiz`, sin prueba, sin tarjeta y con escritura completa (09 §3.2 les da
--    Raíz a las fundadoras). Prendido, empieza la prueba de 14 días.
-- 4. Las impresiones pasan a agregarse por día y por origen
--    (`listing_impresiones_dia`). La tabla por persona queda SOLO como llave
--    de deduplicación y se borra a los 2 días: para el CTR alcanza el agregado
--    y guardar quién vio qué durante 90 días era guardar de más (08 §7.1).
-- 5. Una notificación de empresa lleva `business_id`. La campana personal
--    filtra `business_id is null` —el cambio de una línea de la fase 4— y el
--    shell de negocio tiene su propia campana.

-- ── 1. Enums ────────────────────────────────────────────────────────────────

do $$ begin create type biz_plan as enum ('semilla','raiz','bosque');
exception when duplicate_object then null; end $$;

do $$ begin create type biz_sub_status as enum
  ('pendiente','activa','en_gracia','pausada','cancelada','vencida');
exception when duplicate_object then null; end $$;

-- ── 2. Suscripciones ────────────────────────────────────────────────────────

create table if not exists business_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  plan          biz_plan not null default 'semilla',
  status        biz_sub_status not null default 'pendiente',
  provider      text not null default 'mercadopago',
  external_id   text unique,
  monto         numeric,
  moneda        text default 'ARS',
  precio_bloqueado boolean not null default false,   -- fundadoras (09 §3.2)
  periodo_fin   timestamptz,
  gracia_fin    timestamptz,
  raw           jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_bsubs_business on business_subscriptions (business_id, status);
create index if not exists idx_bsubs_periodo  on business_subscriptions (periodo_fin)
  where status in ('activa','en_gracia');

-- Los avisos ya mandados, para no repetirlos todos los días: un aviso de cobro
-- duplicado es la forma más rápida de que alguien apague las notificaciones.
create table if not exists business_billing_log (
  business_id uuid not null references businesses(id) on delete cascade,
  evento      text not null,          -- prueba_inicio | prueba_3dias | prueba_fin | cobro_3dias | gracia | vencida | cierre
  clave       text not null,          -- lo que hace único al aviso (fecha del período, por ejemplo)
  created_at  timestamptz not null default now(),
  primary key (business_id, evento, clave)
);

-- Eventos crudos del proveedor. La idempotencia de 09 §4.4 vive acá: la misma
-- notificación dos veces entra una sola vez, y lo pesado se puede reintentar
-- desde el cron sin volver a pedirle nada a MercadoPago.
create table if not exists pagos_eventos (
  id          uuid primary key default gen_random_uuid(),
  proveedor   text not null default 'mercadopago',
  clave       text not null,          -- id de la notificación (o tipo:data_id)
  tipo        text,
  data_id     text,
  payload     jsonb not null default '{}',
  recibido_at timestamptz not null default now(),
  procesado_at timestamptz,
  intentos    int not null default 0,
  resultado   jsonb,
  unique (proveedor, clave)
);
create index if not exists idx_pagos_pendientes on pagos_eventos (recibido_at)
  where procesado_at is null;

-- ── 3. El puente acciones ↔ Mercado ─────────────────────────────────────────

create table if not exists activity_market_hints (
  activity_id  uuid not null references activities(id) on delete cascade,
  categoria    text not null,
  dominios     text[] not null default '{}',
  texto_puente text,
  activo       boolean not null default true,
  primary key (activity_id, categoria)
);

-- ── 4. Impresiones agregadas ────────────────────────────────────────────────

create table if not exists listing_impresiones_dia (
  listing_id  uuid not null references listings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  dia         date not null default current_date,
  origen      text not null default 'catalogo',   -- catalogo | accion | plaza | perfil_negocio
  impresiones int not null default 0,
  primary key (listing_id, dia, origen)
);
create index if not exists idx_imp_dia_business on listing_impresiones_dia (business_id, dia);

create table if not exists listing_impresiones_mensual (
  listing_id  uuid not null references listings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  mes         date not null,
  impresiones int not null default 0,
  primary key (listing_id, mes)
);

-- ── 5. Columnas nuevas ──────────────────────────────────────────────────────

-- La insignia de fundadora (09 §3.2): las primeras 30 aprobadas. Se marca al
-- aprobar y no se saca nunca: el riesgo que corrieron ya lo corrieron.
alter table businesses add column if not exists fundador boolean not null default false;
alter table businesses add column if not exists prueba_fin timestamptz;
alter table businesses add column if not exists cierre_ofrecido_at timestamptz;

-- Preferencias de aviso por persona y por empresa (fase 4 §6).
alter table business_members add column if not exists avisos jsonb not null default '{}';

-- Una notificación de empresa. La campana personal filtra `business_id is null`.
alter table notifications add column if not exists business_id uuid references businesses(id) on delete cascade;
create index if not exists idx_notif_business on notifications (business_id, created_at desc)
  where business_id is not null;

-- Lo que ya existía queda donde estaba: las notificaciones de empresa de las
-- fases 1 a 3 se marcan con su empresa, así dejan de aparecer en la campana
-- personal el mismo día que se aplica esto.
update notifications
   set business_id = (data->>'negocio_id')::uuid
 where business_id is null and data ? 'negocio_id'
   and exists (select 1 from businesses b where b.id = (data->>'negocio_id')::uuid);

-- ── 6. Privilegios de tabla ─────────────────────────────────────────────────
-- Igual que en 0105-0107: `authenticated` no escribe ninguna tabla nueva.

revoke all on business_subscriptions, business_billing_log, pagos_eventos,
              activity_market_hints, listing_impresiones_dia, listing_impresiones_mensual
  from public, anon, authenticated;

grant select (business_id, plan, status, monto, moneda, precio_bloqueado, periodo_fin, gracia_fin, created_at)
  on business_subscriptions to authenticated;
grant select (activity_id, categoria, dominios, texto_puente, activo)
  on activity_market_hints to authenticated, anon;

alter table business_subscriptions    enable row level security;
alter table business_billing_log      enable row level security;
alter table pagos_eventos             enable row level security;
alter table activity_market_hints     enable row level security;
alter table listing_impresiones_dia   enable row level security;
alter table listing_impresiones_mensual enable row level security;

-- La suscripción la lee el owner (04 §5). El resto del equipo ve el plan por
-- RPC, sin el monto ni el identificador del proveedor.
drop policy if exists "bsubs owner lee" on business_subscriptions;
create policy "bsubs owner lee" on business_subscriptions for select to authenticated
  using (brote_biz_role(business_id) = 'owner');

drop policy if exists "hints lee" on activity_market_hints;
create policy "hints lee" on activity_market_hints for select using (activo);

-- `pagos_eventos`, `business_billing_log` y las impresiones agregadas: sin
-- policy de select. Nadie las lee de afuera; la analítica sale por RPC.

-- ── 7. La bandera del cobro y los precios ───────────────────────────────────
-- Filas en `app_settings`, que `/panel` pinta solo: el booleano como
-- interruptor y los números como campo. Arrancan apagado y en 0 = sin precio.

insert into app_settings (key, value, description) values
  ('negocios_cobro_activo', 'false'::jsonb,
   'Cobro a empresas. Apagado = modo fundador: todo funciona, sin tarjeta y sin prueba.'),
  ('negocios_precio_semilla', '0'::jsonb, 'Precio mensual del plan Semilla, en pesos. 0 = sin definir (no se puede suscribir).'),
  ('negocios_precio_raiz',    '0'::jsonb, 'Precio mensual del plan Raíz, en pesos. 0 = sin definir.'),
  ('negocios_precio_bosque',  '0'::jsonb, 'Precio mensual del plan Bosque, en pesos. 0 = sin definir.')
on conflict (key) do nothing;

-- ── 8. Planes, topes y modo fundador ────────────────────────────────────────

create or replace function brote_biz_cobro_activo()
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((select (value #>> '{}')::boolean from app_settings where key = 'negocios_cobro_activo'), false);
$fn$;

-- El precio SIEMPRE sale de `app_settings` (09 §3.1): con la inflación
-- argentina, un número en el código está mal en tres meses. 0 = sin definir.
create or replace function brote_biz_precio(p_plan biz_plan)
returns numeric language sql stable security definer set search_path = public as $fn$
  select coalesce((select (value #>> '{}')::numeric from app_settings
                   where key = 'negocios_precio_' || p_plan::text), 0);
$fn$;

-- Espejo exacto de `LIMITES` en `lib/negocio/plan.ts` (09 §5). Un test compara
-- los dos: si alguien cambia uno solo, falla.
create or replace function brote_biz_limites(p_plan biz_plan)
returns jsonb language sql immutable set search_path = public as $fn$
  select case p_plan
    when 'semilla' then '{"listados":3,"objetivos":2,"replanificaciones":4,"miembros":1,
                          "analitica":"basica","historial_publico":false,"destacados":0,"acelerada":false}'::jsonb
    when 'raiz'    then '{"listados":15,"objetivos":3,"replanificaciones":8,"miembros":3,
                          "analitica":"completa","historial_publico":true,"destacados":0,"acelerada":true}'::jsonb
    else                '{"listados":999999,"objetivos":3,"replanificaciones":15,"miembros":10,
                          "analitica":"completa","historial_publico":true,"destacados":1,"acelerada":true}'::jsonb
  end;
$fn$;

-- El plan vigente. Con el cobro apagado, TODA empresa está en modo fundador y
-- vale `raiz` (09 §3.2 y §5.3): el producto funciona entero mientras el dueño
-- consigue las primeras empresas a mano.
create or replace function brote_negocio_plan(p_business uuid)
returns text language sql stable security definer set search_path = public as $fn$
  select case
    when not brote_biz_cobro_activo() then 'raiz'
    else coalesce((select s.plan::text from business_subscriptions s
                    where s.business_id = p_business and s.status in ('activa','en_gracia')
                    order by s.created_at desc limit 1), 'semilla')
  end;
$fn$;

create or replace function brote_biz_plan(p_business uuid)
returns biz_plan language sql stable security definer set search_path = public as $fn$
  select brote_negocio_plan(p_business)::biz_plan;
$fn$;

create or replace function brote_biz_activo(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from business_subscriptions
                  where business_id = p_business and status in ('activa','en_gracia'));
$fn$;

create or replace function brote_negocio_en_gracia(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from business_subscriptions
                  where business_id = p_business and status = 'en_gracia');
$fn$;

-- La prueba de 14 días (09 §3.3): sin tarjeta. La fecha se fija cuando el
-- cobro se prende o cuando se aprueba la empresa, lo que pase después.
create or replace function brote_biz_en_prueba(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from businesses where id = p_business and prueba_fin > now());
$fn$;

-- ¿Puede escribir? Con el cobro apagado, siempre. Prendido: mientras dure la
-- prueba o mientras la suscripción esté activa o en gracia. Si no, Mejora
-- queda en LECTURA —ve todo, no cierra objetivos ni pide ajustes— y no se
-- borra nada nunca (09 §3.3 y 02 §8).
create or replace function brote_biz_escritura(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select (not brote_biz_cobro_activo())
      or brote_biz_en_prueba(p_business)
      or brote_biz_activo(p_business);
$fn$;

create or replace function brote_negocio_permite(p_business uuid, p_que text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select case p_que
    when 'historial_publico' then (brote_biz_limites(brote_biz_plan(p_business))->>'historial_publico')::boolean
    when 'acelerada'         then (brote_biz_limites(brote_biz_plan(p_business))->>'acelerada')::boolean
    when 'analitica_completa' then brote_biz_limites(brote_biz_plan(p_business))->>'analitica' = 'completa'
    when 'escritura'         then brote_biz_escritura(p_business)
    else false end;
$fn$;

create or replace function brote_biz_limite(p_business uuid, p_clave text)
returns int language sql stable security definer set search_path = public as $fn$
  select (brote_biz_limites(brote_biz_plan(p_business))->>p_clave)::int;
$fn$;

-- Lo que la empresa está usando hoy. Un listado pendiente ocupa lugar: si no,
-- se podrían mandar veinte a la cola y superar el tope al aprobarse.
create or replace function brote_biz_uso(p_business uuid)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'listados', (select count(*) from listings
                  where business_id = p_business and status in ('publicado','pendiente')),
    'objetivos', (select count(*) from improvement_goals
                   where business_id = p_business and status in ('activo','en_riesgo','en_revision')
                     and reemplazado_at is null),
    'miembros', (select count(*) from business_members where business_id = p_business),
    'replanificaciones', (select count(*) from ai_jobs
                           where business_id = p_business and kind = 'replan'
                             and created_at >= date_trunc('month', now())));
$fn$;

-- La publicación acelerada (fase 3 §6.3) ahora sí mira el plan de verdad.
create or replace function brote_negocio_acelerado(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select brote_verificacion_fuerte(p_business)
     and exists (select 1 from listings where business_id = p_business and revisado_at is not null
                   and status in ('publicado','despublicado') and not acelerada)
     and not exists (select 1 from listing_reports where business_id = p_business and estado = 'confirmado')
     and brote_negocio_permite(p_business, 'acelerada');
$fn$;

-- Las primeras 30 aprobadas son fundadoras, para siempre (09 §3.2).
create or replace function brote_biz_marcar_fundador()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.status = 'approved' and coalesce(old.status::text, '') <> 'approved' and not new.fundador then
    if (select count(*) from businesses where fundador) < 30 then
      new.fundador := true;
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists trg_biz_fundador on businesses;
create trigger trg_biz_fundador before update on businesses
  for each row execute function brote_biz_marcar_fundador();

-- ── 9. Gating, en el servidor ───────────────────────────────────────────────
-- 09 §5: "Esconder un botón en el cliente no es gating". Estos triggers frenan
-- a un MIEMBRO de la empresa; el job diario (sin `auth.uid()`) y quien revisa
-- desde `/panel` no son miembros y siguen pudiendo mover todo.
--
-- Nunca se pierde trabajo (09 §5.1): el listado por encima del tope se queda
-- en borrador, con todo lo que la empresa escribió.

create or replace function brote_biz_guard_listado()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_lim int; v_usa int;
begin
  if not brote_is_member(new.business_id) then return new; end if;
  if new.status in ('pendiente','publicado') and old.status not in ('pendiente','publicado') then
    if not brote_biz_escritura(new.business_id) then
      raise exception 'solo_lectura' using errcode = 'P0001';
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

drop trigger if exists trg_listings_plan on listings;
create trigger trg_listings_plan before update on listings
  for each row execute function brote_biz_guard_listado();

create or replace function brote_biz_guard_objetivo()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_lim int; v_usa int;
begin
  if not brote_is_member(new.business_id) then return new; end if;
  if not brote_biz_escritura(new.business_id) then
    raise exception 'solo_lectura' using errcode = 'P0001';
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

drop trigger if exists trg_goals_plan on improvement_goals;
create trigger trg_goals_plan before insert or update on improvement_goals
  for each row execute function brote_biz_guard_objetivo();

-- Check-ins, evidencia y dossier: lo mismo, sin tope, solo lectura/escritura.
create or replace function brote_biz_guard_escritura()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if brote_is_member(new.business_id) and not brote_biz_escritura(new.business_id) then
    raise exception 'solo_lectura' using errcode = 'P0001';
  end if;
  return new;
end $fn$;

drop trigger if exists trg_checkins_plan on goal_checkins;
create trigger trg_checkins_plan before insert on goal_checkins
  for each row execute function brote_biz_guard_escritura();

drop trigger if exists trg_evidencia_plan on goal_evidence;
create trigger trg_evidencia_plan before insert on goal_evidence
  for each row execute function brote_biz_guard_escritura();

drop trigger if exists trg_dossier_plan on improvement_dossiers;
create trigger trg_dossier_plan before insert or update on improvement_dossiers
  for each row execute function brote_biz_guard_escritura();

-- Equipo: el tope de miembros del plan. Las policies de `business_members`
-- dejan al owner escribir la tabla directo, así que el tope va acá.
create or replace function brote_biz_guard_miembro()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_lim int; v_usa int;
begin
  if not brote_is_member(new.business_id) then return new; end if;
  v_lim := brote_biz_limite(new.business_id, 'miembros');
  select count(*) into v_usa from business_members where business_id = new.business_id;
  if v_usa >= v_lim then
    raise exception 'limite_plan' using errcode = 'P0001', detail = v_lim::text;
  end if;
  return new;
end $fn$;

drop trigger if exists trg_members_plan on business_members;
create trigger trg_members_plan before insert on business_members
  for each row execute function brote_biz_guard_miembro();

-- ── 10. Notificaciones de empresa ───────────────────────────────────────────
-- 02 §7: la campana personal nunca muestra avisos de empresa y viceversa. Acá
-- se marca el `business_id`; la consulta personal filtra `business_id is null`.
-- La categoría sale de la URL del aviso, que es lo que ya distingue un área de
-- otra, y es la que apaga o prende cada persona en sus preferencias.

create or replace function brote_negocio_categoria_aviso(p_url text)
returns text language sql immutable set search_path = public as $fn$
  select case
    when p_url like '/negocio/plan%'     then 'pagos'
    when p_url like '/negocio/listados%' then 'listados'
    when p_url like '/negocio/mejora%'   then 'mejora'
    else 'cuenta' end;
$fn$;

create or replace function brote_negocio_notificar(
  p_business uuid, p_titulo text, p_cuerpo text, p_url text default '/negocio'
) returns void language sql security definer set search_path = public as $fn$
  insert into notifications (user_id, business_id, type, title_es, body_es, data)
  select m.user_id, p_business, 'system', p_titulo, p_cuerpo,
         jsonb_build_object('url', p_url, 'negocio_id', p_business,
                            'categoria', brote_negocio_categoria_aviso(p_url))
  from business_members m where m.business_id = p_business;
$fn$;

-- Preferencias de aviso, por persona y por empresa. Los avisos de PAGO no se
-- pueden apagar: perderse uno termina en listados despublicados.
create or replace function negocio_avisos_guardar(p_business uuid, p_avisos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not brote_is_member(p_business) then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  update business_members
     set avisos = jsonb_strip_nulls(jsonb_build_object(
           'listados', p_avisos->'listados', 'mejora', p_avisos->'mejora', 'cuenta', p_avisos->'cuenta'))
   where business_id = p_business and user_id = (select auth.uid());
  return jsonb_build_object('ok', true);
end $fn$;

-- Push: misma infraestructura VAPID de siempre (fase 4 §6). La rama de empresa
-- va primero porque un aviso de empresa es de tipo `system`, que la lista de
-- abajo no incluye.
create or replace function notify_push()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_prefs jsonb; v_allow boolean; v_key text; v_url text; v_cat text;
begin
  if new.business_id is not null then
    v_cat := coalesce(new.data->>'categoria', 'cuenta');
    select avisos into v_prefs from business_members
     where business_id = new.business_id and user_id = new.user_id;
    if v_cat <> 'pagos' and coalesce((v_prefs->>v_cat)::boolean, true) = false then return new; end if;
    if coalesce((select (notification_prefs->>'push')::boolean from profiles where id = new.user_id), true) = false then
      return new;
    end if;
    v_url := coalesce(new.data->>'url', '/negocio');
  else
    if new.type not in ('rank_up','streak_risk','streak_lost','title','project','challenge',
                        'points','friend','reply','mention','follow','moderation') then
      return new;
    end if;

    select notification_prefs into v_prefs from profiles where id = new.user_id;
    if coalesce((v_prefs->>'push')::boolean, true) = false then return new; end if;

    v_allow := case
      when new.type in ('streak_risk','streak_lost') then coalesce((v_prefs->>'streak')::boolean, true)
      when new.type = 'challenge' then coalesce((v_prefs->>'challenges')::boolean, true)
      when new.type = 'project'   then coalesce((v_prefs->>'projects')::boolean, true)
      when new.type = 'reply'     then coalesce((v_prefs->>'notif_reply')::boolean, true)
      when new.type = 'mention'   then coalesce((v_prefs->>'notif_mention')::boolean, true)
      when new.type = 'follow'    then coalesce((v_prefs->>'notif_follow')::boolean, true)
      else true end;
    if not v_allow then return new; end if;

    -- Enlace profundo. Antes sólo se usaba data->>'url', que las notificaciones
    -- sociales no traen: tocarlas habría llevado a la home.
    v_url := coalesce(
      new.data->>'url',
      case
        when new.data ? 'post_id' then '/feed/p/' || (new.data->>'post_id')
        when new.data ? 'user_id' then
          coalesce('/perfil/' || (select username::text from profiles where id = (new.data->>'user_id')::uuid), '/feed')
        else '/'
      end);
  end if;

  v_key := current_setting('app.anon_key', true);
  if v_key is null then
    v_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4';
  end if;

  perform net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','apikey', v_key,
                                  'Authorization','Bearer ' || v_key),
    body := jsonb_build_object('user_id', new.user_id, 'title', new.title_es,
                               'body', coalesce(new.body_es, ''), 'url', v_url));
  return new;
end $fn$;

-- ── 11. Cupo de IA por plan ─────────────────────────────────────────────────
-- "Replanificaciones IA" es lo único del plan que toca a Mejora (09 §2). Las
-- generaciones siguen con su tope semanal de 06 §1.3, que no es comercial sino
-- de costo. Replanificar a mano NUNCA se bloquea: sin cupo, la vía
-- determinista da el mismo resultado.
create or replace function brote_biz_cupo_ia(p_business uuid, p_kind text)
returns int language sql stable security definer set search_path = public as $fn$
  select case p_kind
    when 'replan' then greatest(0, brote_biz_limite(p_business, 'replanificaciones')
      - (select count(*)::int from ai_jobs
          where business_id = p_business and kind = 'replan' and status = 'ok'
            and created_at >= date_trunc('month', now())))
    else greatest(0, 4 - (select count(*)::int from ai_jobs
          where business_id = p_business and kind = 'objetivos' and status = 'ok'
            and created_at >= now() - interval '7 days'))
  end;
$fn$;

-- ── 12. Impresiones: agregado por día y por origen ──────────────────────────
-- Fase 4 §3.2: se cuenta cuando la tarjeta entra en pantalla, con deduplicación
-- por sesión del lado del cliente; acá se deduplica por persona y día, y lo que
-- queda guardado es un AGREGADO. La fila por persona es solo la llave de
-- deduplicación y dura dos días: para el CTR alcanza el agregado, y guardar
-- quién vio qué durante 90 días era guardar de más (08 §7.1).

drop function if exists mercado_vistas(uuid[]);

create or replace function mercado_vistas(p_ids uuid[], p_origen text default 'catalogo')
returns void language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := (select auth.uid()); v_org text;
begin
  if v_uid is null then return; end if;
  v_org := case when p_origen in ('catalogo','accion','plaza','perfil_negocio') then p_origen else 'catalogo' end;
  with nuevas as (
    insert into listing_impresiones (listing_id, user_id, dia)
    select l.id, v_uid, current_date
      from listings l
     where l.id = any((coalesce(p_ids, '{}'))[1:48]) and l.status = 'publicado'
    on conflict do nothing
    returning listing_id
  )
  insert into listing_impresiones_dia (listing_id, business_id, dia, origen, impresiones)
  select n.listing_id, l.business_id, current_date, v_org, count(*)
    from nuevas n join listings l on l.id = n.listing_id
   group by 1, 2
  on conflict (listing_id, dia, origen)
    do update set impresiones = listing_impresiones_dia.impresiones + excluded.impresiones;
end $fn$;

-- Las impresiones de un listado en los últimos N días, sumando el agregado
-- diario. Una sola definición para el CTR, el puntaje y la analítica.
create or replace function brote_listado_impresiones(p_listing uuid, p_dias int default 90)
returns int language sql stable security definer set search_path = public as $fn$
  select coalesce((select sum(impresiones)::int from listing_impresiones_dia
                    where listing_id = p_listing and dia > current_date - p_dias), 0);
$fn$;

create or replace function brote_mercado_ctr_mediana(p_categoria text)
returns numeric language sql stable security definer set search_path = public as $fn$
  with x as (
    select l.id,
           brote_listado_impresiones(l.id, 90) as imp,
           (select count(distinct (c.user_id, c.created_at::date)) from listing_clicks c
             where c.listing_id = l.id and c.created_at > now() - interval '90 days') as clics
    from listings l where l.status = 'publicado' and l.categoria = p_categoria
  )
  select (percentile_cont(0.5) within group (order by clics::numeric / imp))::numeric from x where imp >= 50;
$fn$;

-- ── 13. El job diario, con la retención nueva ───────────────────────────────
-- Igual que en 0107 salvo el punto 5: las impresiones ahora tienen agregado
-- diario (180 días), agregado mensual para siempre, y la llave por persona se
-- borra a los dos días.

create or replace function brote_negocios_diario()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare r record; v_avisos int := 0; v_riesgo int := 0; v_vencidos int := 0; v_despub int := 0;
begin
  -- 1. Certificados que vencen en 30 días: un aviso, una sola vez.
  for r in
    select c.id, c.business_id, c.alcance, c.cert_vence from business_claims c
    where c.status = 'aprobada' and c.cert_vence is not null
      and c.cert_vence between current_date and current_date + 30 and c.aviso_vence_at is null
  loop
    perform brote_negocio_notificar(r.business_id, 'Un certificado vence pronto',
      format('La certificación de "%s" vence el %s. Al vencer, la afirmación baja de Nivel 3 a Nivel 2.',
             r.alcance, to_char(r.cert_vence, 'DD/MM/YYYY')), '/negocio/listados');
    update business_claims set aviso_vence_at = now() where id = r.id;
    v_avisos := v_avisos + 1;
  end loop;

  -- 2. Objetivos (lo que la fase 2 dejó sin programar): por vencer y vencidos.
  for r in
    update improvement_goals set status = 'en_riesgo', updated_at = now()
     where status = 'activo' and reemplazado_at is null and vence_at is not null
       and vence_at < now() + interval '7 days' and vence_at >= now()
    returning id, business_id, titulo
  loop
    perform brote_negocio_notificar(r.business_id, 'Un objetivo vence en menos de una semana',
      format('"%s". Si necesitás más tiempo, decilo en la ficha y lo ajustamos.', r.titulo),
      '/negocio/mejora/' || r.id);
    v_riesgo := v_riesgo + 1;
  end loop;
  for r in
    update improvement_goals set status = 'incumplido', cerrado_at = now(), updated_at = now()
     where status in ('activo','en_riesgo') and reemplazado_at is null and vence_at is not null and vence_at < now()
    returning id, business_id, titulo
  loop
    perform brote_negocio_notificar(r.business_id, 'Un objetivo venció',
      format('"%s" venció sin cerrarse. Podés pedir uno nuevo desde Mejora.', r.titulo),
      '/negocio/mejora/' || r.id);
    v_vencidos := v_vencidos + 1;
  end loop;

  -- 3. Reportes confirmados sin corregir en 30 días: el listado sale.
  for r in
    update listings l set status = 'despublicado', despublicado_por = 'correccion',
           observacion = 'Despublicado: pasaron 30 días desde el reporte confirmado sin una corrección.'
     where l.status = 'publicado'
       and exists (select 1 from listing_reports x where x.listing_id = l.id and x.estado = 'confirmado'
                     and x.corregir_hasta < now() and l.updated_at < x.resuelto_at)
    returning l.id, l.business_id, l.titulo
  loop
    perform brote_negocio_notificar(r.business_id, 'Sacamos un listado del Mercado',
      format('"%s": pasaron 30 días desde el reporte confirmado sin una corrección.', r.titulo),
      '/negocio/listados/' || r.id);
    v_despub := v_despub + 1;
  end loop;

  -- 4. Progreso de Mejora con su decaimiento, niveles y puntajes.
  update businesses set progreso_mejora = brote_progreso_mejora(id) where status = 'approved';
  perform brote_recalcular_tiers(null);
  perform brote_recalcular_scores(null);

  -- 5. Retención (04 §8 y fase 4 §3.2): clics e impresiones con 180 días de
  -- detalle y agregado mensual para siempre. La llave de deduplicación por
  -- persona dura dos días: es lo único que necesita para su trabajo.
  insert into listing_clicks_mensual (listing_id, business_id, mes, clics)
  select listing_id, business_id, date_trunc('month', created_at)::date, count(*)
    from listing_clicks where created_at < now() - interval '180 days'
   group by 1, 2, 3
  on conflict (listing_id, mes) do update set clics = listing_clicks_mensual.clics + excluded.clics;
  delete from listing_clicks where created_at < now() - interval '180 days';

  insert into listing_impresiones_mensual (listing_id, business_id, mes, impresiones)
  select listing_id, business_id, date_trunc('month', dia)::date, sum(impresiones)
    from listing_impresiones_dia where dia < current_date - 180
   group by 1, 2, 3
  on conflict (listing_id, mes) do update
    set impresiones = listing_impresiones_mensual.impresiones + excluded.impresiones;
  delete from listing_impresiones_dia where dia < current_date - 180;
  delete from listing_impresiones where dia < current_date - 2;

  return jsonb_build_object('avisos_vence', v_avisos, 'objetivos_en_riesgo', v_riesgo,
                            'objetivos_vencidos', v_vencidos, 'despublicados', v_despub);
end $fn$;

-- ── 14. Analítica de la empresa (09 §6) ─────────────────────────────────────
-- Todo sale de lo que de verdad pasó. "Salidas" son clics registrados en el
-- interstitial: lo que pase DESPUÉS, en el sitio del comercio, no lo vemos, y
-- el aviso de honestidad al pie de la pantalla lo dice con todas las letras.
--
-- La analítica básica (plan Semilla) trae los totales y la tabla por listado.
-- La completa suma el origen del tráfico y la serie de 30 días.

create or replace function negocio_analitica(p_business uuid, p_dias int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_desde date; v_completa boolean; v_imp int; v_sal int;
begin
  if not brote_is_member(p_business) then return null; end if;
  p_dias := least(greatest(coalesce(p_dias, 30), 7), 90);
  v_desde := current_date - p_dias;
  v_completa := brote_negocio_permite(p_business, 'analitica_completa');

  select coalesce(sum(impresiones), 0)::int into v_imp from listing_impresiones_dia
   where business_id = p_business and dia > v_desde;
  select count(*)::int into v_sal from listing_clicks
   where business_id = p_business and created_at > v_desde::timestamptz;

  return jsonb_build_object(
    'dias', p_dias,
    'plan', brote_negocio_plan(p_business),
    'completa', v_completa,
    'totales', jsonb_build_object(
      'impresiones', v_imp,
      'salidas', v_sal,
      'tasa', case when v_imp = 0 then null else round(v_sal::numeric * 100 / v_imp, 1) end,
      'reportes_resueltos', (select count(*) from listing_reports
                              where business_id = p_business and estado <> 'abierto'
                                and resuelto_at > v_desde::timestamptz)),
    'listados', coalesce((
      select jsonb_agg(x order by (x->>'salidas')::int desc, (x->>'impresiones')::int desc)
      from (
        select jsonb_build_object(
          'id', l.id, 'titulo', l.titulo, 'status', l.status, 'slug', l.slug,
          'impresiones', coalesce((select sum(i.impresiones)::int from listing_impresiones_dia i
                                    where i.listing_id = l.id and i.dia > v_desde), 0),
          'salidas', (select count(*)::int from listing_clicks c
                       where c.listing_id = l.id and c.created_at > v_desde::timestamptz)) as x
        from listings l
        where l.business_id = p_business and l.status in ('publicado','despublicado')) y), '[]'::jsonb),
    'origenes', case when not v_completa then null else coalesce((
      select jsonb_object_agg(origen, n) from (
        select coalesce(origen, 'ficha') as origen, count(*)::int as n from listing_clicks
         where business_id = p_business and created_at > v_desde::timestamptz
         group by 1) o), '{}'::jsonb) end,
    'serie', case when not v_completa then null else coalesce((
      select jsonb_agg(jsonb_build_object('dia', d::date,
               'impresiones', coalesce((select sum(i.impresiones)::int from listing_impresiones_dia i
                                         where i.business_id = p_business and i.dia = d::date), 0),
               'salidas', (select count(*)::int from listing_clicks c
                            where c.business_id = p_business and c.created_at::date = d::date))
               order by d)
      from generate_series(v_desde + 1, current_date, interval '1 day') d), '[]'::jsonb) end);
end $fn$;

-- El puntaje, igual que en 0107 salvo de dónde salen las impresiones: ahora del
-- agregado diario. La fórmula no cambia —y el plan sigue sin entrar en ella.
create or replace function brote_listado_score(p_listing uuid)
returns numeric language plpgsql stable security definer set search_path = public as $fn$
declare
  l listings%rowtype; b businesses%rowtype;
  v_base numeric; v_decl int; v_aprob int; v_rev timestamptz; v_cob numeric; v_fres numeric; v_c numeric;
  v_resp numeric; v_rep int; v_rep_ok int; v_a numeric;
  v_enlace numeric; v_clics int; v_conf90 int; v_tasa numeric; v_imp int; v_med numeric; v_senal numeric; v_s numeric;
  v_dias_pub numeric; v_x numeric;
  v_p numeric := 0; v_venc date;
begin
  select * into l from listings where id = p_listing;
  if l.id is null or l.status <> 'publicado' then return 0; end if;
  select * into b from businesses where id = l.business_id;

  -- C — credibilidad (§3.4)
  v_base := case l.tier_efectivo when 'e3' then 0.90 when 'e2' then 0.65 when 'e1' then 0.35 else 0 end;
  if b.tier = 'e4' then v_base := least(1.0, v_base + 0.10); end if;
  select count(*),
         count(*) filter (where bc.status = 'aprobada' and bc.tier <> 'e0'),
         max(bc.revisado_at) filter (where bc.status = 'aprobada')
    into v_decl, v_aprob, v_rev
    from listing_claims lc join business_claims bc on bc.id = lc.claim_id
   where lc.listing_id = l.id;
  v_cob := 0.7 + 0.3 * case when v_decl = 0 then 0 else v_aprob::numeric / v_decl end;
  v_rev := coalesce(v_rev, l.revisado_at, l.publicado_at, l.created_at);
  v_fres := case when v_rev > now() - interval '12 months' then 1.0
                 when v_rev > now() - interval '24 months' then 0.9 else 0.8 end;
  v_c := v_base * v_cob * v_fres;

  -- A — actividad (§4.3). `respuesta`: reportes de "no responde" / "enlace
  -- roto" de 90 días con descargo o resolución dentro de los 7 días.
  select count(*),
         count(*) filter (where (r.descargo_at is not null and r.descargo_at <= r.created_at + interval '7 days')
                             or (r.estado <> 'abierto' and r.resuelto_at <= r.created_at + interval '7 days'))
    into v_rep, v_rep_ok
    from listing_reports r
   where r.listing_id = l.id and r.motivo in ('no_responde','enlace_roto') and r.created_at > now() - interval '90 days';
  v_resp := case when v_rep = 0 then 1.0 else v_rep_ok::numeric / v_rep end;
  v_a := 0.4 * exp(-(extract(epoch from now() - l.updated_at) / 86400) / 120)
       + 0.3 * least(100, greatest(0, coalesce(b.progreso_mejora, 0))) / 100.0
       + 0.3 * v_resp;

  -- S — salud (§4.4). El CTR necesita ≥50 impresiones: por debajo vale 0.5.
  v_enlace := case when l.link_fallos <= 0 then 1.0 when l.link_fallos = 1 then 0.5 else 0 end;
  select count(distinct (c.user_id, c.created_at::date)) into v_clics
    from listing_clicks c where c.listing_id = l.id and c.created_at > now() - interval '90 days';
  select count(*) into v_conf90 from listing_reports
   where listing_id = l.id and estado = 'confirmado' and resuelto_at > now() - interval '90 days';
  v_tasa := case when v_clics = 0 then (case when v_conf90 > 0 then 1.0 else 0 end)
                 else least(1.0, v_conf90::numeric / v_clics) end;
  v_imp := brote_listado_impresiones(l.id, 90);
  if v_imp < 50 then
    v_senal := 0.5;
  else
    v_med := brote_mercado_ctr_mediana(l.categoria);
    v_senal := case when v_med is null or v_med = 0 then 0.5
                    else least(1.0, 0.5 * (v_clics::numeric / v_imp) / v_med) end;
  end if;
  v_s := 0.5 * v_enlace + 0.3 * (1 - v_tasa) + 0.2 * v_senal;

  -- X — exploración (§4.5): e^(−días/7) los primeros 21 días.
  v_dias_pub := extract(epoch from now() - coalesce(l.publicado_at, now())) / 86400;
  v_x := case when v_dias_pub < 21 then exp(-v_dias_pub / 7) else 0 end;

  -- P — penalizaciones (§4.6).
  select min(bc.cert_vence) into v_venc
    from listing_claims lc join business_claims bc on bc.id = lc.claim_id
   where lc.listing_id = l.id and bc.status in ('aprobada','vencida')
     and bc.cert_vence is not null and bc.cert_vence < current_date;
  if v_venc is not null then
    v_p := v_p + case when v_venc >= current_date - 30 then 5 else 15 end;
  end if;
  if exists (select 1 from listing_reports where listing_id = l.id and motivo = 'afirmacion_falsa' and estado = 'abierto') then
    v_p := v_p + 20;
  end if;
  if v_conf90 > 0 then v_p := v_p + 30; end if;
  if l.link_fallos >= 2 then v_p := v_p + 25; end if;
  if l.updated_at < now() - interval '12 months' then v_p := v_p + 10; end if;
  if brote_negocio_en_gracia(l.business_id) then v_p := v_p + 15; end if;

  return round(100 * (0.40 * v_c + 0.15 * v_a + 0.10 * v_s + 0.10 * v_x) - v_p, 3);
end $fn$;

-- ── 15. El puente: "Dónde conseguirlo" (02 §6.1) ────────────────────────────
-- Solo acciones de SUSTITUCIÓN con una categoría del Mercado que las respalde
-- de verdad. Empezamos con ~27, no con las 475: un módulo que aparece en todas
-- las acciones deja de leerse como una ayuda y pasa a leerse como publicidad.

insert into activity_market_hints (activity_id, categoria, dominios, texto_puente)
select a.id, h.categoria, h.dominios, h.texto
from (values
  ('compra-a-granel-o-en-estaciones-de-recarga', 'almacen-granel', array['residuos'],
   'Comprar a granel es fácil cuando sabés dónde. Estos negocios están en el programa de Brote.'),
  ('res-comprar-a-granel', 'almacen-granel', array['residuos'],
   'Comprar a granel es fácil cuando sabés dónde. Estos negocios están en el programa de Brote.'),
  ('res-comprar-a-quien-recibe-envase', 'almacen-granel', array['residuos'],
   'Estos comercios trabajan con envase propio o retornable, y están en el programa de Brote.'),
  ('res-envase-grande', 'almacen-granel', array['residuos'],
   'Si comprás más cantidad y menos envase, estos negocios del programa de Brote lo hacen posible.'),
  ('cambia-a-productos-recargables-del-hogar', 'limpieza-hogar', array['residuos'],
   'Pasarse a recargable necesita alguien que te recargue. Estos negocios están en el programa de Brote.'),
  ('agua-jabon-concentrado', 'limpieza-hogar', array['agua'],
   'Concentrado rinde más y viaja con menos agua. Estos negocios están en el programa de Brote.'),
  ('agua-azul-detergente-biodegradable', 'limpieza-hogar', array['agua_azul'],
   'Lo que tirás por la pileta termina en algún lado. Estos negocios están en el programa de Brote.'),
  ('azul-detergente-biodegradable', 'limpieza-hogar', array['agua_azul'],
   'Lo que tirás por la pileta termina en algún lado. Estos negocios están en el programa de Brote.'),
  ('air-vinagre-y-bicarbonato', 'limpieza-hogar', array['aire_suelo'],
   'Si preferís comprarlo hecho, estos negocios del programa de Brote hacen limpieza con menos química.'),
  ('cambia-a-jabon-o-champu-en-barra', 'cuidado-personal', array['residuos'],
   'La barra viene sin botella. Estos negocios están en el programa de Brote.'),
  ('res-jabon-en-barra', 'cuidado-personal', array['residuos'],
   'La barra viene sin botella. Estos negocios están en el programa de Brote.'),
  ('res-cepillo-recargable', 'cuidado-personal', array['residuos'],
   'Cabezal recambiable, mango que dura. Estos negocios están en el programa de Brote.'),
  ('azul-cosmeticos-sin-microplastico', 'cuidado-personal', array['agua_azul'],
   'Si estás cambiando de producto, estos negocios del programa de Brote cuentan qué lleva el suyo.'),
  ('ali-verduras-de-estacion', 'alimentos-frescos', array['alimentacion'],
   'De estación y de cerca. Estos productores y comercios están en el programa de Brote.'),
  ('compra-productos-locales-y-de-estacion', 'alimentos-frescos', array['alimentacion'],
   'De estación y de cerca. Estos productores y comercios están en el programa de Brote.'),
  ('compra-en-una-feria-de-productores', 'alimentos-frescos', array['alimentacion'],
   'Si no tenés feria cerca, estos productores del programa de Brote venden directo.'),
  ('ali-feria-o-verduleria', 'alimentos-frescos', array['alimentacion'],
   'Si no tenés feria cerca, estos productores del programa de Brote venden directo.'),
  ('reduci-los-lacteos-hoy', 'alimentos-frescos', array['alimentacion'],
   'Artesanal y de productor. Estos negocios están en el programa de Brote.'),
  ('pasa-una-semana-100-a-base-de-plantas', 'alimentos-frescos', array['alimentacion'],
   'Para una semana de compra local, estos negocios del programa de Brote son un buen punto de partida.'),
  ('ali-leer-etiqueta', 'alimentos-frescos', array['alimentacion'],
   'Estos negocios del programa de Brote cuentan de dónde viene lo que venden, con su nivel de evidencia.'),
  ('compra-ropa-de-segunda-mano-o-vintage', 'indumentaria', array['consumo'],
   'Usada, reparada o hecha para durar. Estos negocios están en el programa de Brote.'),
  ('agua-ropa-segunda-mano', 'indumentaria', array['agua'],
   'Usada, reparada o hecha para durar. Estos negocios están en el programa de Brote.'),
  ('con-reparar-antes-de-reemplazar', 'reparacion-y-reuso', array['consumo'],
   'Antes de reemplazarlo, alguien puede arreglarlo. Estos negocios están en el programa de Brote.'),
  ('repara-algo-en-vez-de-tirarlo', 'reparacion-y-reuso', array['residuos'],
   'Antes de tirarlo, alguien puede arreglarlo. Estos negocios están en el programa de Brote.'),
  ('compra-electronica-reacondicionada', 'reparacion-y-reuso', array['consumo'],
   'Reacondicionado, con garantía y sin fabricar uno nuevo. Estos negocios están en el programa de Brote.'),
  ('cons-elegi-lo-que-se-puede-reparar', 'reparacion-y-reuso', array['consumo'],
   'Lo que se puede abrir y arreglar dura más. Estos negocios están en el programa de Brote.'),
  ('empeza-una-huerta-en-el-balcon-o-ventana', 'jardin-y-huerta', array['plantas'],
   'Semillas, tierra y macetas para empezar. Estos negocios están en el programa de Brote.'),
  ('empeza-a-compostar-en-casa', 'jardin-y-huerta', array['residuos'],
   'Compostera, lombrices o el curso para arrancar. Estos negocios están en el programa de Brote.'),
  ('evita-compost-a-base-de-turba', 'jardin-y-huerta', array['aire_suelo'],
   'Sustrato sin turba, de acá. Estos negocios están en el programa de Brote.'),
  ('lleva-tu-botella-reutilizable', 'hogar-y-deco', array['residuos'],
   'Si todavía no tenés una, estos negocios del programa de Brote las venden.'),
  ('compra-productos-con-contenido-reciclado', 'hogar-y-deco', array['residuos'],
   'Con contenido reciclado declarado y su nivel de evidencia a la vista. Estos negocios están en el programa de Brote.'),
  ('mov-mantene-la-bici', 'movilidad', array['movilidad'],
   'Un service a tiempo alarga la vida de la bici. Estos negocios están en el programa de Brote.')
) as h(slug, categoria, dominios, texto)
join activities a on a.slug = h.slug
on conflict (activity_id, categoria) do update
  set texto_puente = excluded.texto_puente, dominios = excluded.dominios, activo = true;

-- Los 3 listados de una acción, o nada. Las cinco reglas duras de la fase 4
-- §2.2 se aplican ACÁ, en el servidor:
--   · `kid` no recibe nada, nunca;
--   · `teen` no ve categorías sensibles (ni precios: eso ya lo decide la
--     tarjeta);
--   · con menos de 3 listados relevantes no se devuelve nada — un módulo con
--     un listado triste es peor que ningún módulo;
--   · como máximo uno por empresa, para que no sea la vidriera de uno solo;
--   · comprar no da puntos: esta función no toca `complete_activity` ni suma
--     nada. Es de solo lectura.
create or replace function mercado_para_accion(p_slug text, p_limit int default 3)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_cuenta text; v_act uuid; v_cats text[]; v_texto text; v_items jsonb;
begin
  v_cuenta := coalesce(brote_mercado_cuenta(), 'adult');
  if v_cuenta = 'kid' then return null; end if;

  select id into v_act from activities where slug = p_slug and active;
  if v_act is null then return null; end if;

  select array_agg(h.categoria), min(h.texto_puente)
    into v_cats, v_texto
    from activity_market_hints h
   where h.activity_id = v_act and h.activo and brote_mercado_puede_ver(h.categoria);
  if v_cats is null or cardinality(v_cats) = 0 then return null; end if;

  select jsonb_agg(t order by (t->>'score')::numeric desc)
    into v_items
    from (
      select distinct on (l.business_id) brote_listado_tarjeta(l, b) as t
        from listings l
        join businesses b on b.id = l.business_id and b.status = 'approved'
       where l.status = 'publicado' and l.categoria = any(v_cats)
       order by l.business_id, l.score desc
    ) x;

  if v_items is null or jsonb_array_length(v_items) < 3 then return null; end if;

  return jsonb_build_object(
    'texto', v_texto,
    'categoria', v_cats[1],
    'items', (select jsonb_agg(v) from (
                select v from jsonb_array_elements(v_items) v limit greatest(1, least(coalesce(p_limit, 3), 6))) z));
end $fn$;

-- ── 16. El plan, como lo ve la empresa ──────────────────────────────────────

create or replace function negocio_plan_estado(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; s business_subscriptions%rowtype; v_plan biz_plan;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  select * into s from business_subscriptions
   where business_id = p_business and status in ('activa','en_gracia','pendiente')
   order by created_at desc limit 1;
  v_plan := brote_biz_plan(p_business);

  return jsonb_build_object(
    'cobro_activo', brote_biz_cobro_activo(),
    'plan', v_plan,
    'limites', brote_biz_limites(v_plan),
    'uso', brote_biz_uso(p_business),
    'escritura', brote_biz_escritura(p_business),
    'fundador', b.fundador,
    'prueba_fin', b.prueba_fin,
    'en_prueba', brote_biz_en_prueba(p_business),
    'rol', brote_biz_role(p_business),
    'suscripcion', case when s.id is null then null else jsonb_build_object(
      'plan', s.plan, 'status', s.status, 'monto', s.monto, 'moneda', s.moneda,
      'precio_bloqueado', s.precio_bloqueado, 'periodo_fin', s.periodo_fin, 'gracia_fin', s.gracia_fin,
      'desde', s.created_at) end,
    'precios', jsonb_build_object(
      'semilla', brote_biz_precio('semilla'), 'raiz', brote_biz_precio('raiz'),
      'bosque', brote_biz_precio('bosque'), 'moneda', 'ARS'));
end $fn$;

-- Lo que la función de MercadoPago necesita para armar la suscripción. El
-- precio NUNCA viaja desde el cliente: se calcula acá.
--
-- Fundadoras (09 §3.2): Raíz al precio de Semilla durante 6 meses, y el precio
-- queda bloqueado 12 meses. Si todavía está en prueba, el primer cobro empieza
-- cuando la prueba termina: nadie paga dos veces por el mismo mes.
create or replace function negocio_plan_cotizar(p_business uuid, p_plan biz_plan)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; v_monto numeric; v_inicio timestamptz;
begin
  if brote_biz_role(p_business) <> 'owner' then
    return jsonb_build_object('ok', false, 'error', 'solo_owner');
  end if;
  select * into b from businesses where id = p_business;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
  if not brote_biz_cobro_activo() then return jsonb_build_object('ok', false, 'error', 'cobro_apagado'); end if;

  v_monto := brote_biz_precio(p_plan);
  if b.fundador and p_plan = 'raiz' and b.created_at > now() - interval '6 months' then
    v_monto := brote_biz_precio('semilla');
  end if;
  if v_monto is null or v_monto <= 0 then
    return jsonb_build_object('ok', false, 'error', 'precio_sin_definir');
  end if;

  v_inicio := case when b.prueba_fin > now() + interval '1 day' then b.prueba_fin else null end;

  return jsonb_build_object('ok', true, 'monto', v_monto, 'moneda', 'ARS',
    'plan', p_plan, 'inicio', v_inicio, 'fundador', b.fundador,
    'razon', format('Brote Negocios — plan %s', initcap(p_plan::text)));
end $fn$;

-- El identificador de la suscripción en el proveedor, para cancelarla. Solo el
-- owner, y nunca viaja en `negocio_plan_estado`.
create or replace function negocio_suscripcion_externa(p_business uuid)
returns text language sql stable security definer set search_path = public as $fn$
  select s.external_id from business_subscriptions s
   where s.business_id = p_business and brote_biz_role(p_business) = 'owner'
     and s.status in ('activa','en_gracia','pendiente')
   order by s.created_at desc limit 1;
$fn$;

-- ── 17. Lo que escribe el proveedor (solo `service_role`) ───────────────────

create or replace function pagos_evento_registrar(
  p_clave text, p_tipo text, p_data_id text, p_payload jsonb, p_proveedor text default 'mercadopago')
returns boolean language plpgsql security definer set search_path = public as $fn$
begin
  insert into pagos_eventos (proveedor, clave, tipo, data_id, payload)
  values (p_proveedor, p_clave, p_tipo, p_data_id, coalesce(p_payload, '{}'::jsonb));
  return true;
exception when unique_violation then
  -- MercadoPago reintenta: el mismo evento dos veces entra una sola vez.
  return false;
end $fn$;

-- Un intento fallido suma un intento pero NO marca el evento como procesado:
-- si no, un error de red haría que un cobro se pierda para siempre.
create or replace function pagos_evento_cerrar(p_clave text, p_resultado jsonb, p_proveedor text default 'mercadopago')
returns void language sql security definer set search_path = public as $fn$
  update pagos_eventos
     set procesado_at = case when p_resultado is null then procesado_at else now() end,
         intentos = intentos + 1,
         resultado = coalesce(p_resultado, resultado)
   where proveedor = p_proveedor and clave = p_clave;
$fn$;

-- Los eventos que quedaron sin procesar (la API del proveedor no respondió, por
-- ejemplo). El cron los reintenta; por eso el webhook puede contestar 200 sin
-- esperar a que todo salga bien.
create or replace function pagos_eventos_pendientes(p_limit int default 20)
returns jsonb language sql security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('clave', clave, 'tipo', tipo, 'data_id', data_id)), '[]'::jsonb)
    from (select * from pagos_eventos
           where procesado_at is null and intentos < 6 and recibido_at > now() - interval '7 days'
           order by recibido_at limit greatest(1, least(coalesce(p_limit, 20), 100))) x;
$fn$;

-- El ÚNICO lugar donde cambia el estado de una suscripción de empresa.
-- La verdad viene siempre de consultar al proveedor, nunca del cuerpo del
-- webhook; acá llega ya consultada (09 §4.3).
create or replace function negocio_suscripcion_aplicar(
  p_business uuid, p_external_id text, p_estado text, p_pago text,
  p_plan biz_plan, p_monto numeric, p_moneda text, p_periodo_fin timestamptz, p_raw jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare s business_subscriptions%rowtype; v_new biz_sub_status; v_prev biz_sub_status; v_lim int;
begin
  if p_business is null or not exists (select 1 from businesses where id = p_business) then
    return jsonb_build_object('ok', false, 'error', 'negocio_desconocido');
  end if;

  select * into s from business_subscriptions where external_id = p_external_id;
  v_prev := s.status;

  -- Mapeo de 09 §4.4. Un pago rechazado abre la gracia de 7 días: una tarjeta
  -- vencida es el motivo de baja más común y no dice nada de la intención.
  v_new := case
    when p_pago = 'rejected' then 'en_gracia'
    when p_estado = 'authorized' then 'activa'
    when p_estado = 'paused' then 'pausada'
    when p_estado = 'cancelled' then 'cancelada'
    when p_estado = 'pending' then 'pendiente'
    else coalesce(v_prev, 'pendiente') end;

  if s.id is null then
    insert into business_subscriptions (business_id, plan, status, external_id, monto, moneda,
                                        precio_bloqueado, periodo_fin, gracia_fin, raw)
    values (p_business, coalesce(p_plan, 'semilla'), v_new, p_external_id, p_monto, coalesce(p_moneda, 'ARS'),
            (select fundador from businesses where id = p_business), p_periodo_fin,
            case when v_new = 'en_gracia' then now() + interval '7 days' else null end,
            coalesce(p_raw, '{}'::jsonb))
    returning * into s;
  else
    update business_subscriptions
       set status = v_new,
           plan = coalesce(p_plan, plan),
           monto = coalesce(p_monto, monto),
           moneda = coalesce(p_moneda, moneda),
           periodo_fin = coalesce(p_periodo_fin, periodo_fin),
           gracia_fin = case
             when v_new = 'en_gracia' then coalesce(gracia_fin, now() + interval '7 days')
             else null end,
           raw = coalesce(p_raw, raw),
           updated_at = now()
     where id = s.id
    returning * into s;
  end if;

  -- Efectos, solo cuando el estado CAMBIA: aplicar dos veces el mismo evento
  -- no puede avisar dos veces ni despublicar dos veces.
  if v_prev is distinct from v_new then
    if v_new = 'activa' then
      -- Vuelve lo que el cobro había despublicado, hasta donde llegue el plan.
      v_lim := brote_biz_limite(p_business, 'listados');
      update listings set status = 'publicado', despublicado_por = null, updated_at = now()
       where id in (select id from listings
                     where business_id = p_business and status = 'despublicado' and despublicado_por = 'cobro'
                     order by score desc nulls last
                     limit greatest(0, v_lim - (select count(*) from listings
                                                 where business_id = p_business and status in ('publicado','pendiente'))));
      perform brote_recalcular_scores(p_business);
      perform brote_negocio_notificar(p_business, 'Suscripción activa',
        'Listo: tu plan está activo y tus listados vuelven al Mercado.', '/negocio/plan');
    elsif v_new = 'en_gracia' then
      perform brote_recalcular_scores(p_business);
      perform brote_negocio_notificar(p_business, 'No pudimos cobrar tu plan',
        'Tenés 7 días para actualizar el medio de pago. Tus listados siguen publicados mientras tanto.',
        '/negocio/plan');
    elsif v_new in ('pausada','cancelada') then
      update listings set status = 'despublicado', despublicado_por = 'cobro', updated_at = now()
       where business_id = p_business and status = 'publicado';
      perform brote_negocio_notificar(p_business,
        case when v_new = 'pausada' then 'Tu plan quedó en pausa' else 'Diste de baja tu plan' end,
        'Tus listados salieron del Mercado. No borramos nada: cuando vuelvas, están donde los dejaste.',
        '/negocio/plan');
    end if;
  end if;

  return jsonb_build_object('ok', true, 'status', v_new, 'cambio', v_prev is distinct from v_new,
                            'business_id', p_business);
end $fn$;

-- La suscripción recién creada, antes de que la persona pague: así el webhook
-- la encuentra por `external_id` aunque el primer aviso llegue en un segundo.
create or replace function negocio_suscripcion_registrar(
  p_business uuid, p_external_id text, p_plan biz_plan, p_monto numeric, p_moneda text, p_raw jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  insert into business_subscriptions (business_id, plan, status, external_id, monto, moneda, precio_bloqueado, raw)
  values (p_business, p_plan, 'pendiente', p_external_id, p_monto, coalesce(p_moneda, 'ARS'),
          (select fundador from businesses where id = p_business), coalesce(p_raw, '{}'::jsonb))
  on conflict (external_id) do update set plan = excluded.plan, monto = excluded.monto, updated_at = now();
  return jsonb_build_object('ok', true);
end $fn$;

-- ¿A qué empresa pertenece esta referencia externa? El webhook es uno solo para
-- todo MercadoPago: si la referencia no es una empresa, el pago es de una
-- persona (Brote+) y sigue por el camino de siempre.
create or replace function pagos_negocio_de_referencia(p_ref text)
returns uuid language plpgsql stable security definer set search_path = public as $fn$
declare v_id uuid;
begin
  begin
    v_id := p_ref::uuid;
  exception when others then
    return null;
  end;
  return (select id from businesses where id = v_id);
end $fn$;

-- ── 18. El cron de cobro (fase 4 §4.4) ──────────────────────────────────────
-- Con la bandera apagada no hace absolutamente nada. Prendida: avisa antes,
-- da 7 días de gracia, despublica (nunca borra) y a los 90 días ofrece
-- exportar y cerrar.

create or replace function brote_negocios_cobro()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare r record; v_prueba int := 0; v_avisos int := 0; v_gracia int := 0; v_vencidas int := 0; v_cierres int := 0;
begin
  if not brote_biz_cobro_activo() then return jsonb_build_object('cobro_activo', false); end if;

  -- 1. Empieza la prueba: al aprobarse, o el día que se prende el cobro.
  for r in
    update businesses
       set prueba_fin = now() + case when fundador then interval '90 days' else interval '14 days' end
     where status = 'approved' and prueba_fin is null
    returning id, fundador, prueba_fin
  loop
    perform brote_negocio_notificar(r.id, 'Empezó tu prueba',
      format('Tenés hasta el %s para usar todo sin tarjeta.', to_char(r.prueba_fin, 'DD/MM/YYYY')),
      '/negocio/plan');
    v_prueba := v_prueba + 1;
  end loop;

  -- 2. Faltan 3 días para que termine la prueba.
  for r in
    select b.id, b.prueba_fin from businesses b
     where b.status = 'approved' and b.prueba_fin between now() and now() + interval '3 days'
       and not brote_biz_activo(b.id)
       and not exists (select 1 from business_billing_log l
                        where l.business_id = b.id and l.evento = 'prueba_3dias'
                          and l.clave = to_char(b.prueba_fin, 'YYYY-MM-DD'))
  loop
    perform brote_negocio_notificar(r.id, 'Tu prueba termina en 3 días',
      'Si no elegís un plan, tus listados salen del Mercado y Mejora queda en modo lectura. No se borra nada.',
      '/negocio/plan');
    insert into business_billing_log (business_id, evento, clave)
    values (r.id, 'prueba_3dias', to_char(r.prueba_fin, 'YYYY-MM-DD')) on conflict do nothing;
    v_avisos := v_avisos + 1;
  end loop;

  -- 3. Prueba terminada sin plan: los listados salen, Mejora queda en lectura.
  for r in
    select b.id, b.prueba_fin from businesses b
     where b.status = 'approved' and b.prueba_fin < now() and not brote_biz_activo(b.id)
       and not exists (select 1 from business_billing_log l
                        where l.business_id = b.id and l.evento = 'prueba_fin'
                          and l.clave = to_char(b.prueba_fin, 'YYYY-MM-DD'))
  loop
    update listings set status = 'despublicado', despublicado_por = 'cobro', updated_at = now()
     where business_id = r.id and status = 'publicado';
    perform brote_negocio_notificar(r.id, 'Terminó tu prueba',
      'Tus listados salieron del Mercado y Mejora quedó en modo lectura. Elegís un plan y vuelve todo como estaba.',
      '/negocio/plan');
    insert into business_billing_log (business_id, evento, clave)
    values (r.id, 'prueba_fin', to_char(r.prueba_fin, 'YYYY-MM-DD')) on conflict do nothing;
    v_vencidas := v_vencidas + 1;
  end loop;

  -- 4. Faltan 3 días para el próximo cobro.
  for r in
    select s.business_id, s.periodo_fin, s.monto from business_subscriptions s
     where s.status = 'activa' and s.periodo_fin between now() and now() + interval '3 days'
       and not exists (select 1 from business_billing_log l
                        where l.business_id = s.business_id and l.evento = 'cobro_3dias'
                          and l.clave = to_char(s.periodo_fin, 'YYYY-MM-DD'))
  loop
    perform brote_negocio_notificar(r.business_id, 'Tu próximo cobro es en 3 días',
      format('El %s se te cobra el plan.', to_char(r.periodo_fin, 'DD/MM/YYYY')), '/negocio/plan');
    insert into business_billing_log (business_id, evento, clave)
    values (r.business_id, 'cobro_3dias', to_char(r.periodo_fin, 'YYYY-MM-DD')) on conflict do nothing;
    v_avisos := v_avisos + 1;
  end loop;

  -- 5. En gracia: aviso diario mientras dure.
  for r in
    select s.business_id, s.gracia_fin from business_subscriptions s
     where s.status = 'en_gracia' and s.gracia_fin > now()
       and not exists (select 1 from business_billing_log l
                        where l.business_id = s.business_id and l.evento = 'gracia'
                          and l.clave = to_char(current_date, 'YYYY-MM-DD'))
  loop
    perform brote_negocio_notificar(r.business_id, 'Seguimos sin poder cobrar tu plan',
      format('Tenés hasta el %s para actualizar el medio de pago.', to_char(r.gracia_fin, 'DD/MM/YYYY')),
      '/negocio/plan');
    insert into business_billing_log (business_id, evento, clave)
    values (r.business_id, 'gracia', to_char(current_date, 'YYYY-MM-DD')) on conflict do nothing;
    v_gracia := v_gracia + 1;
  end loop;

  -- 6. Gracia vencida: la suscripción queda vencida y los listados salen.
  for r in
    update business_subscriptions set status = 'vencida', updated_at = now()
     where status = 'en_gracia' and gracia_fin < now()
    returning business_id
  loop
    update listings set status = 'despublicado', despublicado_por = 'cobro', updated_at = now()
     where business_id = r.business_id and status = 'publicado';
    perform brote_negocio_notificar(r.business_id, 'Tu plan venció',
      'Tus listados salieron del Mercado y Mejora quedó en modo lectura. Guardamos todo: cuando vuelvas, sigue donde estaba.',
      '/negocio/plan');
    v_vencidas := v_vencidas + 1;
  end loop;

  -- 7. Noventa días después: ofrecer llevarse los datos (02 §8). No se borra
  -- nada por nuestra cuenta, nunca.
  for r in
    select s.business_id from business_subscriptions s
     join businesses b on b.id = s.business_id
     where s.status in ('vencida','cancelada') and s.updated_at < now() - interval '90 days'
       and b.cierre_ofrecido_at is null
  loop
    perform brote_negocio_notificar(r.business_id, '¿Te llevás tus datos?',
      'Pasaron 90 días. Podés descargar todo lo que cargaste, o retomar donde lo dejaste cuando quieras.',
      '/negocio/plan');
    update businesses set cierre_ofrecido_at = now() where id = r.business_id;
    v_cierres := v_cierres + 1;
  end loop;

  perform brote_recalcular_scores(null);

  return jsonb_build_object('cobro_activo', true, 'pruebas', v_prueba, 'avisos', v_avisos,
                            'gracia', v_gracia, 'vencidas', v_vencidas, 'cierres', v_cierres);
end $fn$;

select cron.unschedule('brote-billing') where exists (select 1 from cron.job where jobname = 'brote-billing');
select cron.schedule('brote-billing', '0 5 * * *', $cron$ select brote_negocios_cobro(); $cron$);

-- ── 19. Historial público de mejora (fase 4 §8) ─────────────────────────────
-- El objetivo logrado, con su métrica y su fecha. El dossier NO se expone
-- nunca, ni siquiera parcialmente: de ahí sale el objetivo, no al revés.

create or replace function objetivo_publico(p_goal uuid, p_valor boolean)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare g improvement_goals%rowtype;
begin
  select * into g from improvement_goals where id = p_goal;
  if g.id is null or not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if p_valor and not brote_negocio_permite(g.business_id, 'historial_publico') then
    return jsonb_build_object('ok', false, 'error', 'plan');
  end if;
  update improvement_goals set es_publico = p_valor, updated_at = now() where id = g.id;
  return jsonb_build_object('ok', true, 'es_publico', p_valor);
end $fn$;

-- ── 20. La ficha pública del negocio ────────────────────────────────────────
-- Igual que en 0107, con la insignia de fundadora ya real. Se le concede a
-- `anon`: el sello del kit de marca linkea acá desde el sitio de la empresa, y
-- una persona que llega de afuera tiene que ver algo, no un login. Los
-- listados y los precios siguen pidiendo cuenta (08 §9).
create or replace function mercado_negocio(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype;
begin
  if coalesce(brote_mercado_cuenta(), 'adult') = 'kid' then return null; end if;
  select * into b from businesses where slug = p_slug and status = 'approved';
  if b.id is null then return null; end if;
  return jsonb_build_object(
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial, 'rubro', b.rubro,
                'descripcion', b.descripcion, 'logo', b.logo_url, 'portada', b.portada_url,
                'provincia', b.provincia, 'ciudad', b.ciudad, 'sitio_web', brote_dominio(b.sitio_web),
                'tier', b.tier, 'progreso_mejora', b.progreso_mejora,
                'verificacion', brote_verificacion_fuerza(b.id),
                'nota_correccion', b.nota_correccion, 'nota_correccion_at', b.nota_correccion_at,
                'fundador', b.fundador,
                'desde', b.created_at),
    -- El historial público depende del plan (Raíz y Bosque) y de que la
    -- empresa haya marcado cada objetivo como público, uno por uno.
    'mejora', case when brote_negocio_permite(b.id, 'historial_publico') then coalesce((
        select jsonb_agg(jsonb_build_object('titulo', g.titulo, 'dominio', g.dominio, 'unidad', g.unidad,
                           'linea_base', g.linea_base, 'valor_final', g.valor_final, 'cerrado_at', g.cerrado_at)
                         order by g.cerrado_at desc)
        from improvement_goals g where g.business_id = b.id and g.es_publico and g.status = 'logrado'), '[]'::jsonb)
      else '[]'::jsonb end);
end $fn$;

-- ── 20 bis. Los datos de "Qué te haría subir" (fase 4 §3.3) ────────────────
-- Hechos, no consejos: las sugerencias se arman en `lib/negocio/sugerencias.ts`
-- con reglas deterministas, para poder testearlas sin una base al lado.

create or replace function negocio_sugerencias_datos(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
begin
  if not brote_is_member(p_business) then return null; end if;
  return jsonb_build_object(
    'progreso', (select progreso_mejora from businesses where id = p_business),
    'verificacion_fuerte', brote_verificacion_fuerte(p_business),
    'listados', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'titulo', l.titulo, 'status', l.status, 'tier', l.tier_efectivo,
        'score', l.score, 'imagenes', cardinality(l.imagenes), 'descripcion', length(l.descripcion),
        'afirmaciones', (select count(*) from listing_claims lc where lc.listing_id = l.id)))
      from listings l where l.business_id = p_business and l.status in ('publicado','pendiente')), '[]'::jsonb),
    'afirmaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'kind', c.kind, 'alcance', c.alcance, 'tier', c.tier, 'status', c.status,
        'evidencia', c.evidencia_path is not null, 'cert_slug', c.cert_slug, 'cert_vence', c.cert_vence,
        'listados', (select count(*) from listing_claims lc where lc.claim_id = c.id)))
      from business_claims c where c.business_id = p_business and c.status in ('aprobada','borrador','rechazada','vencida')), '[]'::jsonb),
    'objetivos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'titulo', g.titulo, 'dominio', g.dominio, 'ambicion', g.ambicion,
        'status', g.status, 'vence_at', g.vence_at, 'es_publico', g.es_publico))
      from improvement_goals g
      where g.business_id = p_business and g.reemplazado_at is null
        and g.status in ('activo','en_riesgo','en_revision')), '[]'::jsonb),
    'ciclos', coalesce((
      select jsonb_agg(jsonb_build_object('status', g.status, 'ambicion', g.ambicion, 'cerrado_at', g.cerrado_at))
      from improvement_goals g
      where g.business_id = p_business and g.status in ('logrado','logrado_parcial') and g.cerrado_at is not null), '[]'::jsonb));
end $fn$;

-- ── 21. Privilegios de funciones ────────────────────────────────────────────
-- Misma disciplina que 0105-0107: todo revocado, y se concede una por una.

revoke all on function brote_biz_cobro_activo()                          from public, anon, authenticated;
revoke all on function brote_biz_precio(biz_plan)                        from public, anon, authenticated;
revoke all on function brote_biz_limites(biz_plan)                       from public, anon, authenticated;
revoke all on function brote_biz_plan(uuid)                              from public, anon, authenticated;
revoke all on function brote_biz_activo(uuid)                            from public, anon, authenticated;
revoke all on function brote_biz_en_prueba(uuid)                         from public, anon, authenticated;
revoke all on function brote_biz_escritura(uuid)                         from public, anon, authenticated;
revoke all on function brote_biz_limite(uuid, text)                      from public, anon, authenticated;
revoke all on function brote_biz_uso(uuid)                               from public, anon, authenticated;
revoke all on function brote_biz_cupo_ia(uuid, text)                     from public, anon, authenticated;
revoke all on function brote_biz_marcar_fundador()                       from public, anon, authenticated;
revoke all on function brote_biz_guard_listado()                         from public, anon, authenticated;
revoke all on function brote_biz_guard_objetivo()                        from public, anon, authenticated;
revoke all on function brote_biz_guard_escritura()                       from public, anon, authenticated;
revoke all on function brote_biz_guard_miembro()                         from public, anon, authenticated;
revoke all on function brote_negocio_categoria_aviso(text)               from public, anon, authenticated;
revoke all on function brote_listado_impresiones(uuid, int)              from public, anon, authenticated;
revoke all on function brote_negocios_cobro()                            from public, anon, authenticated;
revoke all on function pagos_evento_registrar(text, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function pagos_evento_cerrar(text, jsonb, text)            from public, anon, authenticated;
revoke all on function pagos_eventos_pendientes(int)                     from public, anon, authenticated;
revoke all on function pagos_negocio_de_referencia(text)                 from public, anon, authenticated;
revoke all on function negocio_suscripcion_aplicar(uuid, text, text, text, biz_plan, numeric, text, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function negocio_suscripcion_registrar(uuid, text, biz_plan, numeric, text, jsonb)
  from public, anon, authenticated;
revoke all on function negocio_plan_estado(uuid)                         from public, anon;
revoke all on function negocio_plan_cotizar(uuid, biz_plan)              from public, anon;
revoke all on function negocio_suscripcion_externa(uuid)                 from public, anon;
revoke all on function negocio_analitica(uuid, int)                      from public, anon;
revoke all on function negocio_avisos_guardar(uuid, jsonb)               from public, anon;
revoke all on function objetivo_publico(uuid, boolean)                   from public, anon;
revoke all on function mercado_para_accion(text, int)                    from public, anon;
revoke all on function mercado_vistas(uuid[], text)                      from public, anon;

grant execute on function negocio_plan_estado(uuid)                      to authenticated;
grant execute on function negocio_plan_cotizar(uuid, biz_plan)           to authenticated;
grant execute on function negocio_suscripcion_externa(uuid)              to authenticated;
grant execute on function negocio_analitica(uuid, int)                   to authenticated;
grant execute on function negocio_avisos_guardar(uuid, jsonb)            to authenticated;
grant execute on function objetivo_publico(uuid, boolean)                to authenticated;
grant execute on function mercado_para_accion(text, int)                 to authenticated;
grant execute on function mercado_vistas(uuid[], text)                   to authenticated;
grant execute on function brote_biz_cupo_ia(uuid, text)                  to authenticated;

-- La ficha pública también para quien llega sin cuenta, desde el sello.
grant execute on function mercado_negocio(text)                          to anon, authenticated;

-- El proveedor de pagos escribe con `service_role` desde el webhook y el cron.
grant execute on function pagos_evento_registrar(text, text, text, jsonb, text) to service_role;
grant execute on function pagos_evento_cerrar(text, jsonb, text)         to service_role;
grant execute on function pagos_eventos_pendientes(int)                  to service_role;
grant execute on function pagos_negocio_de_referencia(text)              to service_role;
grant execute on function negocio_suscripcion_aplicar(uuid, text, text, text, biz_plan, numeric, text, timestamptz, jsonb)
  to service_role;
grant execute on function negocio_suscripcion_registrar(uuid, text, biz_plan, numeric, text, jsonb) to service_role;
grant execute on function brote_negocios_cobro()                         to service_role;
grant execute on function brote_biz_cupo_ia(uuid, text)                  to service_role;
grant execute on function negocio_plan_cotizar(uuid, biz_plan)           to service_role;
revoke all on function negocio_sugerencias_datos(uuid)                   from public, anon;
grant execute on function negocio_sugerencias_datos(uuid)                to authenticated;

-- Brote — 0105 — Negocios · Fase 1: Fundaciones.
--
-- Una empresa pasa a existir en Brote: entidad, membresías, verificación de
-- identidad y la cola de revisión del dueño. Sin IA, sin listados, sin
-- objetivos (brote-negocios/fases/FASE_1_FUNDACIONES.md).
--
-- NUMERACIÓN. La carpeta de negocios asumía `0037 → 0038`; el repo iba por
-- `0103` y la base viva ya tiene una `0104_mundo_flag_allowlist` sin archivo
-- en el repo. Esta es `0105` en los dos lados.
--
-- DÓNDE ESTO SE APARTA DEL SQL DE `04_ESQUEMA_DB.md` §2, Y POR QUÉ
--
-- 1. Escritura solo por RPC. La policy de UPDATE del documento dejaba que un
--    owner hiciera `update businesses set status = 'approved', tier = 'e4'`
--    desde el cliente: se autoaprobaba. Y la de INSERT dejaba crear negocios
--    salteando el tope de 3 y sin fila de miembro. Las policies quedan (son la
--    matriz de 03 §4.2), pero `authenticated` no tiene privilegio de INSERT,
--    UPDATE ni DELETE sobre `businesses`: todo pasa por `create_business`,
--    `negocio_guardar_alta` y `negocio_enviar`, que validan estado y campos.
--
-- 2. Lectura pública por columnas. 03 §4.2 dice "solo approved y columnas
--    públicas", y RLS filtra filas, no columnas. `anon` y `authenticated`
--    leen solo las columnas de una ficha pública; lo interno (CUIT, contacto,
--    nota del revisor, informe de IA, quién lo creó, token de verificación)
--    lo lee el miembro por `negocio_detalle` y el revisor por el panel.
--
-- 3. El CUIT no es único. El índice único del documento contradice a 02 §8 y
--    a la fase 1 §7.3 ("avisa, no bloquea") y abría un ataque barato: cargar
--    el CUIT de un competidor le impedía darse de alta. Queda un índice común
--    para detectar duplicados.
--
-- 4. El revisor es la contraseña del panel. El repo no tiene flag de admin:
--    `/panel` se abre con una contraseña verificada en `admin_check`, pedida
--    de nuevo en cada lectura y escritura. Las RPC de la cola siguen ese
--    patrón. `revisado_por` guarda la cuenta con la que se entró al panel, y
--    "notificar al revisor" avisa a las cuentas que ya revisaron negocios; la
--    primera vez, el aviso es el contador de pendientes en `/panel`.
--
-- 5. Menores y cuentas nuevas se frenan en el servidor. `create_business`
--    exige cuenta adulta, onboarding terminado, email confirmado y un día de
--    antigüedad (02 §3.1). Sin el onboarding no alcanza: `account_type` vale
--    'adult' por defecto hasta que el onboarding lo fija.
--
-- 6. Las funciones internas (duplicados, riesgos, notificaciones, slug) NO se
--    otorgan a `authenticated`, igual que `brote_notify_social` en 0045. La
--    regla del documento ("grant a authenticated en todas") habría dejado a
--    cualquiera consultar duplicados de negocios ajenos sin aprobar.
--
-- Columnas agregadas a `businesses`: `enviado_at` (antigüedad real en la
-- cola: un borrador puede dormir días antes de enviarse), `alta_paso` (el alta
-- retoma donde quedó), `verify_token` (un token por empresa, 02 §3.3) y
-- `sitio_estado`/`sitio_chequeado_at` (el chip de riesgo "sitio caído" sale de
-- un dato guardado, no de un fetch en la consulta). A
-- `business_verifications`: `ultimo_intento_at` y el contador diario para los
-- reintentos (1 cada 10 minutos, 20 por día).

-- ── 1. Enums ────────────────────────────────────────────────────────────────

do $$ begin create type business_status as enum
  ('draft','submitted','in_review','approved','suspended','rejected','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type business_role as enum ('owner','admin','editor');
exception when duplicate_object then null; end $$;

do $$ begin create type evidence_tier as enum ('e0','e1','e2','e3','e4');
exception when duplicate_object then null; end $$;

do $$ begin create type verification_method as enum
  ('dominio_meta','dominio_dns','dominio_archivo','email_dominio','social_token','cuit_declarado');
exception when duplicate_object then null; end $$;

do $$ begin create type verification_status as enum ('pendiente','verificado','fallido','expirado');
exception when duplicate_object then null; end $$;

do $$ begin create type business_size as enum ('1','2-10','11-50','51-200','200+');
exception when duplicate_object then null; end $$;

-- ── 2. Utilidades puras ─────────────────────────────────────────────────────

-- `unaccent` no está instalada en la base viva (verificado en pg_extension).
create or replace function unaccent_safe(p text)
returns text language sql immutable parallel safe set search_path = public as $fn$
  select translate(coalesce(p, ''),
    'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC');
$fn$;

-- `brote-verify-` + 12 caracteres sin ambiguos (sin 0/o, 1/l). 256 es múltiplo
-- de 32, así que `byte % 32` no sesga el alfabeto.
create or replace function brote_verify_token()
returns text language plpgsql volatile set search_path = public as $fn$
declare
  v_alfabeto constant text := 'abcdefghijkmnpqrstuvwxyz23456789';
  v_bytes bytea := extensions.gen_random_bytes(12);
  v_out text := '';
begin
  for i in 0..11 loop
    v_out := v_out || substr(v_alfabeto, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  return 'brote-verify-' || v_out;
end $fn$;

-- Dígito verificador del CUIT/CUIL (módulo 11). Solo dígitos; los guiones se
-- limpian antes. Un resultado 10 no es un CUIT válido para ningún tipo.
create or replace function brote_cuit_valido(p text)
returns boolean language plpgsql immutable set search_path = public as $fn$
declare
  v text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
  v_pesos constant int[] := array[5,4,3,2,7,6,5,4,3,2];
  v_suma int := 0;
  v_dv int;
begin
  if length(v) <> 11 then return false; end if;
  if substr(v, 1, 2) not in ('20','23','24','25','26','27','30','33','34') then return false; end if;
  for i in 1..10 loop
    v_suma := v_suma + substr(v, i, 1)::int * v_pesos[i];
  end loop;
  v_dv := 11 - (v_suma % 11);
  if v_dv = 11 then v_dv := 0; end if;
  if v_dv = 10 then return false; end if;
  return v_dv = substr(v, 11, 1)::int;
end $fn$;

-- Host en minúsculas, sin esquema, sin `www.`, sin puerto ni path.
create or replace function brote_dominio(p text)
returns text language sql immutable set search_path = public as $fn$
  select nullif(
    regexp_replace(
      regexp_replace(lower(trim(coalesce(p, ''))), '^[a-z][a-z0-9+.-]*://', ''),
      '^www\.|[/:?#].*$', '', 'g'),
    '');
$fn$;

-- Nombre comparable: sin acentos, minúsculas, sin signos y sin la forma
-- societaria ("Panadería del Sur S.R.L." = "panaderia del sur").
create or replace function brote_nombre_normalizado(p text)
returns text language sql immutable set search_path = public as $fn$
  select trim(regexp_replace(
    regexp_replace(
      regexp_replace(lower(unaccent_safe(p)), '[^a-z0-9]+', ' ', 'g'),
      '\m(s a u|s a s|s r l|s a|s h|s c|sau|sas|srl|sa|sh|ltda|limitada|sociedad anonima|cooperativa|coop)\M',
      ' ', 'g'),
    '\s+', ' ', 'g'));
$fn$;

-- Los 12 rubros. Mismo listado, mismo orden, que `lib/negocio/rubros.ts`.
create or replace function brote_rubros()
returns text[] language sql immutable set search_path = public as $fn$
  select array[
    'gastronomia','comercio-minorista','produccion-alimentos','indumentaria-textil',
    'belleza-cuidado-personal','servicios-profesionales','logistica-transporte',
    'hoteleria-turismo','agro-vivero-huerta','limpieza-higiene','hogar-construccion',
    'reparacion-reuso'];
$fn$;

-- Las 24 jurisdicciones. Mismo listado que `lib/data/cities.ts` (F15.4).
create or replace function brote_provincias()
returns text[] language sql immutable set search_path = public as $fn$
  select array[
    'Ciudad Autónoma de Buenos Aires','Buenos Aires','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja',
    'Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis',
    'Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'];
$fn$;

-- ── 3. Tablas ───────────────────────────────────────────────────────────────

create table if not exists businesses (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  nombre_comercial  text not null check (char_length(nombre_comercial) between 2 and 80),
  razon_social      text check (char_length(razon_social) <= 120),
  cuit              text check (cuit ~ '^\d{11}$'),   -- DECLARADO, nunca "verificado"
  rubro             text not null,
  tamano            business_size not null default '1',
  pais              text not null default 'AR',       -- v1 valida 'AR'; existe para el futuro
  provincia         text,
  ciudad            text check (char_length(ciudad) <= 80),

  descripcion       text check (char_length(descripcion) <= 4000),
  logo_url          text,
  portada_url       text,

  sitio_web         text check (char_length(sitio_web) <= 200),
  instagram         text check (instagram ~ '^[a-z0-9._]{1,30}$'),
  whatsapp          text check (whatsapp ~ '^\+?\d{8,15}$'),
  email_contacto    text check (char_length(email_contacto) <= 160),

  status            business_status not null default 'draft',
  tier              evidence_tier   not null default 'e0',
  progreso_mejora   int             not null default 0 check (progreso_mejora between 0 and 100),

  score_ia          int check (score_ia between 0 and 100),
  informe_ia        jsonb,
  revision_note     text,
  revisado_por      uuid references profiles(id) on delete set null,
  revisado_at       timestamptz,
  ultima_revision   timestamptz,

  intereses         text[] not null default '{}' check (intereses <@ array['mejora','mercado']),
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Agregadas (ver cabecera).
  enviado_at         timestamptz,
  alta_paso          smallint not null default 1 check (alta_paso between 1 and 5),
  verify_token       text not null default brote_verify_token(),
  sitio_estado       text check (sitio_estado in ('ok','caido')),
  sitio_chequeado_at timestamptz
);

create index if not exists idx_businesses_status  on businesses (status);
create index if not exists idx_businesses_tier    on businesses (tier);
create index if not exists idx_businesses_creador on businesses (created_by);
create index if not exists idx_businesses_revisor on businesses (revisado_por);
create index if not exists idx_businesses_rubro   on businesses (rubro, provincia);
create index if not exists idx_businesses_cuit    on businesses (cuit) where cuit is not null;
create index if not exists idx_businesses_cola    on businesses (enviado_at)
  where status in ('submitted','in_review');

drop trigger if exists businesses_updated_at on businesses;
create trigger businesses_updated_at before update on businesses
  for each row execute function set_updated_at();

create table if not exists business_members (
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid not null references profiles(id)   on delete cascade,
  role        business_role not null default 'editor',
  joined_at   timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index if not exists idx_bmembers_user on business_members (user_id);

create table if not exists business_verifications (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  method        verification_method not null,
  token         text not null,
  target        text,                      -- dominio, handle, o casilla
  status        verification_status not null default 'pendiente',
  intentos      int not null default 0,
  ultimo_error  text,                      -- mensaje HUMANO, no técnico
  evidencia_url text,                      -- captura, para social_token
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  -- Agregadas: los reintentos se miden, no se suponen.
  ultimo_intento_at timestamptz,
  intentos_dia      int  not null default 0,
  dia_intentos      date
);
create index if not exists idx_bverif_business on business_verifications (business_id, status);
create unique index if not exists idx_bverif_metodo on business_verifications (business_id, method);

create table if not exists ai_jobs (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,              -- 'alta' | 'objetivos' | 'replan' | 'listado'
  business_id  uuid references businesses(id) on delete cascade,
  input_hash   text not null,
  status       text not null default 'ok', -- 'ok' | 'fallback' | 'error'
  modelo       text,
  request      jsonb,
  response     jsonb,
  tokens_in    int,
  tokens_out   int,
  created_at   timestamptz not null default now()
);
create unique index if not exists idx_ai_jobs_hash on ai_jobs (kind, input_hash);
create index if not exists idx_ai_jobs_business on ai_jobs (business_id, created_at desc);
create index if not exists idx_ai_jobs_dia on ai_jobs (created_at desc);

-- ── 4. Privilegios de tabla ─────────────────────────────────────────────────
-- Los privilegios por defecto del proyecto dan ALL a anon y authenticated en
-- toda tabla nueva de `public`. Se sacan y se vuelve a dar solo lo necesario.

revoke all on businesses, business_members, business_verifications, ai_jobs from anon, authenticated;

grant select (id, slug, nombre_comercial, rubro, tamano, pais, provincia, ciudad,
              descripcion, logo_url, portada_url, sitio_web, instagram,
              status, tier, progreso_mejora, created_at)
  on businesses to anon, authenticated;

grant select on business_members, business_verifications to authenticated;

-- ── 5. Funciones de membresía ───────────────────────────────────────────────

create or replace function brote_is_member(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from business_members
                 where business_id = p_business and user_id = (select auth.uid()));
$fn$;

create or replace function brote_biz_role(p_business uuid)
returns text language sql stable security definer set search_path = public as $fn$
  select role::text from business_members
  where business_id = p_business and user_id = (select auth.uid());
$fn$;

create or replace function brote_can_write(p_business uuid, p_min text default 'editor')
returns boolean language sql stable security definer set search_path = public as $fn$
  select case brote_biz_role(p_business)
    when 'owner'  then true
    when 'admin'  then p_min in ('admin','editor')
    when 'editor' then p_min = 'editor'
    else false end;
$fn$;

-- Para las policies de Storage: el primer segmento de la ruta es el negocio.
-- Postgres no garantiza el orden de evaluación de un `and` dentro de una
-- policy, así que castear `foldername(name)[1]::uuid` ahí podría romper las
-- subidas de OTROS buckets con carpetas que no son uuid. Acá se valida antes.
-- Las policies que la llaman van `to authenticated`: anon no tiene EXECUTE, y
-- una policy sin rol se evalúa también para anon en cualquier bucket.
create or replace function brote_storage_negocio(p_name text, p_min text default null)
returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare v_seg text := split_part(coalesce(p_name, ''), '/', 1);
begin
  if v_seg !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  if p_min is null then return brote_is_member(v_seg::uuid); end if;
  return brote_can_write(v_seg::uuid, p_min);
end $fn$;

-- ── 6. RLS ──────────────────────────────────────────────────────────────────

alter table businesses             enable row level security;
alter table business_members       enable row level security;
alter table business_verifications enable row level security;
alter table ai_jobs                enable row level security;

drop policy if exists "businesses publicas" on businesses;
create policy "businesses publicas" on businesses for select
  using (status = 'approved');

drop policy if exists "businesses miembro" on businesses;
create policy "businesses miembro" on businesses for select to authenticated
  using (brote_is_member(id));

-- Sin privilegio de INSERT/UPDATE para authenticated (ver cabecera, punto 1):
-- estas dos quedan como la matriz de acceso, no como un camino de escritura.
drop policy if exists "businesses crea" on businesses;
create policy "businesses crea" on businesses for insert to authenticated
  with check (
    (select auth.uid()) = created_by
    and (select account_type from profiles where id = (select auth.uid())) = 'adult'
    and status = 'draft' and tier = 'e0'
  );

drop policy if exists "businesses edita" on businesses;
create policy "businesses edita" on businesses for update to authenticated
  using (brote_can_write(id, 'admin')) with check (brote_can_write(id, 'admin'));

drop policy if exists "bmembers lee" on business_members;
create policy "bmembers lee" on business_members for select to authenticated
  using (brote_is_member(business_id));

-- Igual que arriba: la gestión de equipo no existe en la fase 1 y no hay
-- privilegio de escritura. Cuando llegue, entra por RPC con invitación: un
-- owner no puede sumar a una persona a su negocio sin que acepte.
drop policy if exists "bmembers owner escribe" on business_members;
create policy "bmembers owner escribe" on business_members for all to authenticated
  using (brote_biz_role(business_id) = 'owner')
  with check (brote_biz_role(business_id) = 'owner');

drop policy if exists "bverif lee" on business_verifications;
create policy "bverif lee" on business_verifications for select to authenticated
  using (brote_is_member(business_id));

-- ai_jobs: sin policies = sin acceso. Solo service_role pasa por encima de RLS.

-- ── 7. Internas: slug, duplicados, riesgos, avisos ──────────────────────────

create or replace function brote_slugify(p text)
returns text language plpgsql stable set search_path = public as $fn$
declare v_base text; v_out text; n int := 0;
begin
  v_base := regexp_replace(lower(unaccent_safe(p)), '[^a-z0-9]+', '-', 'g');
  v_base := left(trim(both '-' from v_base), 60);
  v_base := trim(both '-' from v_base);
  if v_base = '' then v_base := 'negocio'; end if;
  v_out := v_base;
  while exists (select 1 from businesses where slug = v_out) loop
    n := n + 1; v_out := v_base || '-' || n;
  end loop;
  return v_out;
end $fn$;

-- Otros negocios que se le parecen: mismo dominio, mismo CUIT, o mismo nombre
-- normalizado en la misma provincia. Avisa; nunca bloquea (fase 1 §7.3).
create or replace function brote_negocio_duplicados(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with b as (select * from businesses where id = p_id)
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id, 'nombre', o.nombre_comercial, 'status', o.status,
      'motivos', array_remove(array[
        case when brote_dominio(o.sitio_web) is not null
              and brote_dominio(o.sitio_web) = brote_dominio(b.sitio_web) then 'dominio' end,
        case when o.cuit is not null and o.cuit = b.cuit then 'cuit' end,
        case when brote_nombre_normalizado(o.nombre_comercial) = brote_nombre_normalizado(b.nombre_comercial)
              and o.provincia is not distinct from b.provincia then 'nombre' end
      ], null))
      order by o.created_at), '[]'::jsonb)
  from b join businesses o on o.id <> b.id
  where (brote_dominio(o.sitio_web) is not null and brote_dominio(o.sitio_web) = brote_dominio(b.sitio_web))
     or (o.cuit is not null and o.cuit = b.cuit)
     or (brote_nombre_normalizado(o.nombre_comercial) = brote_nombre_normalizado(b.nombre_comercial)
         and o.provincia is not distinct from b.provincia);
$fn$;

-- Chips de riesgo por reglas (en la fase 2 se suman los de la IA).
create or replace function brote_negocio_riesgos(p_id uuid)
returns text[] language sql stable security definer set search_path = public as $fn$
  select array_remove(array[
    case when not exists (select 1 from business_verifications v
                          where v.business_id = b.id and v.status = 'verificado')
         then 'sin_verificar' end,
    case when coalesce(char_length(trim(b.descripcion)), 0) < 120
         then 'sin_descripcion' end,
    -- La lista negra de 02 §5.4 más sus parientes cercanos: absolutos sin
    -- calificar. Es un aviso para el revisor, no un rechazo.
    case when unaccent_safe(lower(coalesce(b.descripcion, ''))) ~
         '100 ?% ?(ecologic|natural|organic|sustentable|biodegradable|verde)|carbono neutr|huella (de carbono )?(cero|neutra)|totalmente (natural|ecologic|sustentable)|no contamina|cero impacto|libre de quimicos|eco ?friendly|amigable con el (medio )?ambiente'
         then 'afirmaciones_vagas' end,
    case when b.sitio_estado = 'caido' then 'sitio_caido' end,
    case when jsonb_array_length(brote_negocio_duplicados(b.id)) > 0 then 'posible_duplicado' end
  ], null)
  from businesses b where b.id = p_id;
$fn$;

-- Aviso a todos los miembros. Tipo `system` y sin `business_id` en esta fase
-- (la columna llega en la fase 4); `data.url` es lo que abre el push y la fila.
create or replace function brote_negocio_notificar(
  p_business uuid, p_titulo text, p_cuerpo text, p_url text default '/negocio'
) returns void language sql security definer set search_path = public as $fn$
  insert into notifications (user_id, type, title_es, body_es, data)
  select m.user_id, 'system', p_titulo, p_cuerpo,
         jsonb_build_object('url', p_url, 'negocio_id', p_business)
  from business_members m where m.business_id = p_business;
$fn$;

-- Aviso a quienes revisan: las cuentas que ya revisaron un negocio en el último
-- año. Ver cabecera, punto 4.
create or replace function brote_negocio_notificar_revisores(
  p_titulo text, p_cuerpo text, p_url text
) returns void language sql security definer set search_path = public as $fn$
  insert into notifications (user_id, type, title_es, body_es, data)
  select distinct b.revisado_por, 'system'::notif_type, p_titulo, p_cuerpo,
         jsonb_build_object('url', p_url)
  from businesses b
  where b.revisado_por is not null and b.revisado_at > now() - interval '365 days';
$fn$;

-- ── 8. RPCs del negocio ─────────────────────────────────────────────────────

-- Crea la empresa en borrador y hace owner al creador, en una transacción.
create or replace function create_business(
  p_nombre text, p_rubro text, p_tamano business_size,
  p_provincia text, p_ciudad text
) returns uuid language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_prof profiles%rowtype;
  v_confirmado timestamptz;
  v_owned int;
  v_tope int;
  v_nombre text := trim(coalesce(p_nombre, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'no_autenticado' using errcode = 'P0001'; end if;

  select * into v_prof from profiles where id = v_uid;
  if v_prof.account_type is distinct from 'adult' then
    raise exception 'solo_adultos' using errcode = 'P0001';
  end if;
  if not coalesce(v_prof.onboarding_completed, false) then
    raise exception 'onboarding_pendiente' using errcode = 'P0001';
  end if;
  select email_confirmed_at into v_confirmado from auth.users where id = v_uid;
  if v_confirmado is null then raise exception 'email_sin_confirmar' using errcode = 'P0001'; end if;
  if v_prof.created_at > now() - interval '1 day' then
    raise exception 'cuenta_nueva' using errcode = 'P0001';
  end if;

  if char_length(v_nombre) not between 2 and 80
     or p_rubro is null or not (p_rubro = any (brote_rubros()))
     or (p_provincia is not null and not (p_provincia = any (brote_provincias())))
     or char_length(coalesce(p_ciudad, '')) > 80 then
    raise exception 'datos_invalidos' using errcode = 'P0001';
  end if;

  -- Dos pestañas creando a la vez no pueden pasarse del tope.
  perform pg_advisory_xact_lock(hashtext('create_business:' || v_uid::text));

  -- Ajustable desde el panel si hace falta; sin fila, vale 3 (02 §3.1).
  v_tope := coalesce((select (value #>> '{}')::int from app_settings
                      where key = 'negocios_max_por_dueno'), 3);
  select count(*) into v_owned from business_members
   where user_id = v_uid and role = 'owner';
  if v_owned >= v_tope then raise exception 'limite_negocios' using errcode = 'P0001'; end if;

  insert into businesses (slug, nombre_comercial, rubro, tamano, provincia, ciudad, created_by)
  values (brote_slugify(v_nombre), v_nombre, p_rubro, coalesce(p_tamano, '1'),
          p_provincia, nullif(trim(coalesce(p_ciudad, '')), ''), v_uid)
  returning id into v_id;

  insert into business_members (business_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
end $fn$;

-- Los negocios del usuario, para el selector de contexto.
create or replace function my_businesses()
returns table (id uuid, nombre text, slug text, role text, status business_status, tier evidence_tier)
language sql stable security definer set search_path = public as $fn$
  select b.id, b.nombre_comercial, b.slug, m.role::text, b.status, b.tier
  from business_members m join businesses b on b.id = m.business_id
  where m.user_id = auth.uid()
  order by b.created_at;
$fn$;

-- Todo lo que un miembro puede ver de su negocio, incluidas las columnas que
-- la lectura por tabla no expone. Sin el informe de IA: eso es del revisor.
create or replace function negocio_detalle(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  if not found then return null; end if;

  return jsonb_build_object(
    'id', b.id, 'slug', b.slug, 'nombre_comercial', b.nombre_comercial,
    'razon_social', b.razon_social, 'cuit', b.cuit, 'rubro', b.rubro, 'tamano', b.tamano,
    'pais', b.pais, 'provincia', b.provincia, 'ciudad', b.ciudad, 'descripcion', b.descripcion,
    'logo_url', b.logo_url, 'sitio_web', b.sitio_web, 'instagram', b.instagram,
    'whatsapp', b.whatsapp, 'email_contacto', b.email_contacto,
    'status', b.status, 'tier', b.tier, 'intereses', to_jsonb(b.intereses),
    'revision_note', b.revision_note, 'revisado_at', b.revisado_at,
    'enviado_at', b.enviado_at, 'alta_paso', b.alta_paso, 'created_at', b.created_at,
    'verify_token', b.verify_token,
    'role', brote_biz_role(p_business),
    'puede_reaplicar_at', case when b.status = 'rejected'
                               then b.revisado_at + interval '30 days' end,
    'verificaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'method', v.method, 'status', v.status, 'target', v.target, 'token', v.token,
        'intentos', v.intentos, 'ultimo_error', v.ultimo_error,
        'tiene_captura', v.evidencia_url is not null,
        'verified_at', v.verified_at, 'ultimo_intento_at', v.ultimo_intento_at,
        'intentos_hoy', case when v.dia_intentos = (now() at time zone 'America/Argentina/Buenos_Aires')::date
                             then v.intentos_dia else 0 end)
        order by v.created_at)
      from business_verifications v where v.business_id = b.id), '[]'::jsonb)
  );
end $fn$;

-- Guarda uno o más campos del alta. Solo mientras hay algo que completar: un
-- negocio en revisión no cambia debajo del revisor, y uno aprobado no se
-- reescribe por acá (editar datos de un negocio aprobado es otra pantalla).
create or replace function negocio_guardar_alta(p_business uuid, p_datos jsonb, p_paso int default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  b businesses%rowtype;
  v text;
  v_intereses text[];
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select * into b from businesses where id = p_business for update;

  if not (b.status = 'draft'
          or (b.status in ('submitted','in_review') and b.revision_note is not null)
          or b.status = 'rejected') then
    return jsonb_build_object('ok', false, 'error', 'no_editable');
  end if;

  if p_datos ? 'nombre_comercial' then
    v := trim(coalesce(p_datos->>'nombre_comercial', ''));
    if char_length(v) not between 2 and 80 then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'nombre_comercial');
    end if;
    b.nombre_comercial := v;
    -- El slug se fija con el nombre mientras nadie lo vio publicado.
    if b.status = 'draft' then b.slug := brote_slugify(v); end if;
  end if;

  if p_datos ? 'razon_social' then
    b.razon_social := nullif(trim(coalesce(p_datos->>'razon_social', '')), '');
    if char_length(b.razon_social) > 120 then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'razon_social');
    end if;
  end if;

  if p_datos ? 'cuit' then
    v := regexp_replace(coalesce(p_datos->>'cuit', ''), '\D', '', 'g');
    if v = '' then b.cuit := null;
    elsif not brote_cuit_valido(v) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'cuit');
    else b.cuit := v;
    end if;
  end if;

  if p_datos ? 'rubro' then
    if not (coalesce(p_datos->>'rubro', '') = any (brote_rubros())) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'rubro');
    end if;
    b.rubro := p_datos->>'rubro';
  end if;

  if p_datos ? 'tamano' then
    if coalesce(p_datos->>'tamano', '') not in ('1','2-10','11-50','51-200','200+') then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'tamano');
    end if;
    b.tamano := (p_datos->>'tamano')::business_size;
  end if;

  if p_datos ? 'provincia' then
    v := nullif(p_datos->>'provincia', '');
    if v is not null and not (v = any (brote_provincias())) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'provincia');
    end if;
    b.provincia := v;
  end if;

  if p_datos ? 'ciudad' then
    b.ciudad := nullif(trim(coalesce(p_datos->>'ciudad', '')), '');
    if char_length(b.ciudad) > 80 then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'ciudad');
    end if;
  end if;

  -- El cliente ya normaliza; acá solo se rechaza lo que no tiene forma.
  if p_datos ? 'sitio_web' then
    v := nullif(trim(coalesce(p_datos->>'sitio_web', '')), '');
    if v is not null and v !~ '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'sitio_web');
    end if;
    -- Cambiar el dominio invalida lo verificado contra el anterior.
    if v is distinct from b.sitio_web then
      delete from business_verifications
       where business_id = p_business and method in ('dominio_meta','dominio_dns','dominio_archivo','email_dominio');
      b.sitio_estado := null; b.sitio_chequeado_at := null;
    end if;
    b.sitio_web := v;
  end if;

  if p_datos ? 'instagram' then
    v := nullif(lower(trim(coalesce(p_datos->>'instagram', ''))), '');
    if v is not null and v !~ '^[a-z0-9._]{1,30}$' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'instagram');
    end if;
    if v is distinct from b.instagram then
      delete from business_verifications where business_id = p_business and method = 'social_token';
    end if;
    b.instagram := v;
  end if;

  if p_datos ? 'whatsapp' then
    v := nullif(regexp_replace(coalesce(p_datos->>'whatsapp', ''), '[^\d+]', '', 'g'), '');
    if v is not null and v !~ '^\+?\d{8,15}$' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'whatsapp');
    end if;
    b.whatsapp := v;
  end if;

  if p_datos ? 'email_contacto' then
    v := nullif(lower(trim(coalesce(p_datos->>'email_contacto', ''))), '');
    if v is not null and (v !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' or char_length(v) > 160) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'email_contacto');
    end if;
    b.email_contacto := v;
  end if;

  if p_datos ? 'descripcion' then
    b.descripcion := nullif(trim(coalesce(p_datos->>'descripcion', '')), '');
    if char_length(b.descripcion) > 4000 then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'descripcion');
    end if;
  end if;

  if p_datos ? 'intereses' then
    if jsonb_typeof(p_datos->'intereses') is distinct from 'array' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'intereses');
    end if;
    select coalesce(array_agg(distinct x), '{}') into v_intereses
      from jsonb_array_elements_text(p_datos->'intereses') x;
    if not (v_intereses <@ array['mejora','mercado']) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'intereses');
    end if;
    b.intereses := v_intereses;
  end if;

  update businesses set
    nombre_comercial = b.nombre_comercial, slug = b.slug, razon_social = b.razon_social,
    cuit = b.cuit, rubro = b.rubro, tamano = b.tamano, provincia = b.provincia,
    ciudad = b.ciudad, sitio_web = b.sitio_web, instagram = b.instagram,
    whatsapp = b.whatsapp, email_contacto = b.email_contacto, descripcion = b.descripcion,
    intereses = b.intereses, sitio_estado = b.sitio_estado,
    sitio_chequeado_at = b.sitio_chequeado_at,
    alta_paso = greatest(b.alta_paso, least(5, greatest(1, coalesce(p_paso, b.alta_paso))))
  where id = p_business;

  return jsonb_build_object('ok', true);
end $fn$;

-- Envía la solicitud. También reenvía después de "pedir más datos", y vuelve a
-- aplicar un rechazo pasados 30 días (02 §3.4).
create or replace function negocio_enviar(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  b businesses%rowtype;
  v_falta text[] := '{}';
  v_reenvio boolean;
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select * into b from businesses where id = p_business for update;

  if b.status = 'rejected' and b.revisado_at > now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'error', 'rechazo_reciente',
                              'desde', b.revisado_at + interval '30 days');
  end if;
  if not (b.status in ('draft','rejected')
          or (b.status in ('submitted','in_review') and b.revision_note is not null)) then
    return jsonb_build_object('ok', false, 'error', 'ya_enviada');
  end if;

  if b.sitio_web is null and b.instagram is null then v_falta := v_falta || 'sitio_o_instagram'::text; end if;
  if b.email_contacto is null then v_falta := v_falta || 'email_contacto'::text; end if;
  if b.provincia is null then v_falta := v_falta || 'provincia'::text; end if;
  if coalesce(char_length(b.descripcion), 0) < 120 then v_falta := v_falta || 'descripcion'::text; end if;
  if cardinality(b.intereses) = 0 then v_falta := v_falta || 'intereses'::text; end if;
  if cardinality(v_falta) > 0 then
    return jsonb_build_object('ok', false, 'error', 'incompleta', 'faltan', to_jsonb(v_falta));
  end if;

  v_reenvio := b.status <> 'draft';
  update businesses set status = 'submitted', enviado_at = now(), revision_note = null, alta_paso = 5
   where id = p_business;

  perform brote_negocio_notificar(p_business,
    'Recibimos la solicitud de ' || b.nombre_comercial,
    'La vamos a revisar y te avisamos acá mismo. Mientras tanto podés completar la verificación.',
    '/negocio');
  perform brote_negocio_notificar_revisores(
    case when v_reenvio then b.nombre_comercial || ' volvió a enviar su solicitud'
         else 'Negocio nuevo para revisar: ' || b.nombre_comercial end,
    null, '/panel/negocios/' || p_business::text);

  return jsonb_build_object('ok', true);
end $fn$;

-- Prepara un método de verificación: crea (o reutiliza) su fila con el token
-- del negocio y el destino a chequear. El chequeo lo hace `verify-business`.
create or replace function negocio_verificacion_preparar(p_business uuid, p_method verification_method)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  b businesses%rowtype;
  v_target text;
  v_row business_verifications%rowtype;
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  -- `email_dominio` necesita un remitente que todavía no existe (fase 1 §6.1):
  -- se oculta en lugar de ofrecerse roto. `cuit_declarado` no es un flujo.
  if p_method not in ('dominio_meta','dominio_dns','dominio_archivo','social_token') then
    return jsonb_build_object('ok', false, 'error', 'metodo_no_disponible');
  end if;

  select * into b from businesses where id = p_business;
  if b.status in ('suspended','closed') then
    return jsonb_build_object('ok', false, 'error', 'no_editable');
  end if;

  v_target := case when p_method = 'social_token' then b.instagram else brote_dominio(b.sitio_web) end;
  if v_target is null then
    return jsonb_build_object('ok', false, 'error',
      case when p_method = 'social_token' then 'falta_instagram' else 'falta_sitio' end);
  end if;

  insert into business_verifications (business_id, method, token, target)
  values (p_business, p_method, b.verify_token, v_target)
  on conflict (business_id, method) do update
    set target = excluded.target, token = excluded.token
    where business_verifications.status <> 'verificado'
  returning * into v_row;

  if v_row.id is null then
    select * into v_row from business_verifications where business_id = p_business and method = p_method;
  end if;

  return jsonb_build_object('ok', true, 'method', v_row.method, 'status', v_row.status,
                            'target', v_row.target, 'token', v_row.token);
end $fn$;

-- La captura del método de Instagram. En esta fase queda siempre en revisión
-- manual: la lectura con Gemini Vision llega en la fase 2.
create or replace function negocio_verificacion_captura(p_business uuid, p_path text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare b businesses%rowtype;
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if p_path is null or p_path !~ ('^' || p_business::text || '/verificacion/[0-9a-f-]{36}\.(jpg|jpeg|png)$') then
    return jsonb_build_object('ok', false, 'error', 'ruta_invalida');
  end if;
  select * into b from businesses where id = p_business;
  if b.instagram is null then return jsonb_build_object('ok', false, 'error', 'falta_instagram'); end if;

  insert into business_verifications (business_id, method, token, target, evidencia_url,
                                      intentos, ultimo_intento_at, status, ultimo_error)
  values (p_business, 'social_token', b.verify_token, b.instagram, p_path, 1, now(), 'pendiente', null)
  on conflict (business_id, method) do update
    set evidencia_url = excluded.evidencia_url, target = excluded.target,
        intentos = business_verifications.intentos + 1, ultimo_intento_at = now(),
        status = 'pendiente', ultimo_error = null
    where business_verifications.status <> 'verificado';

  return jsonb_build_object('ok', true);
end $fn$;

-- ── 9. RPCs del revisor (contraseña del panel en cada llamada) ──────────────

create or replace function admin_negocios_cola(p_pass text, p_filtro text default 'pendientes')
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;

  return jsonb_build_object(
    'ok', true,
    'contadores', (select jsonb_build_object(
        'pendientes', count(*) filter (where status in ('submitted','in_review') and revision_note is null),
        'observadas', count(*) filter (where status in ('submitted','in_review') and revision_note is not null),
        'rechazadas', count(*) filter (where status = 'rejected'),
        'todas',      count(*) filter (where status <> 'draft'))
      from businesses),
    'items', coalesce((
      select jsonb_agg(fila order by orden)
      from (
        select
          case when p_filtro = 'pendientes' then extract(epoch from b.enviado_at)
               else -extract(epoch from coalesce(b.enviado_at, b.created_at)) end as orden,
          jsonb_build_object(
            'id', b.id, 'nombre', b.nombre_comercial, 'rubro', b.rubro,
            'provincia', b.provincia, 'ciudad', b.ciudad, 'tamano', b.tamano,
            'status', b.status, 'enviado_at', b.enviado_at, 'revisado_at', b.revisado_at,
            'observada', b.revision_note is not null and b.status in ('submitted','in_review'),
            'verificacion', (
              select jsonb_build_object('method', v.method, 'status', v.status, 'verified_at', v.verified_at)
              from business_verifications v where v.business_id = b.id
              order by (v.status = 'verificado') desc,
                       (v.method in ('dominio_meta','dominio_dns','dominio_archivo')) desc,
                       v.ultimo_intento_at desc nulls last
              limit 1),
            'riesgos', to_jsonb(brote_negocio_riesgos(b.id))) as fila
        from businesses b
        where case p_filtro
                when 'pendientes' then b.status in ('submitted','in_review') and b.revision_note is null
                when 'observadas' then b.status in ('submitted','in_review') and b.revision_note is not null
                when 'rechazadas' then b.status = 'rejected'
                else b.status <> 'draft'
              end
        order by orden
        limit 200
      ) t), '[]'::jsonb)
  );
end $fn$;

create or replace function admin_negocio_detalle(p_pass text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  b businesses%rowtype;
  v_cola uuid[];
  v_pos int;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  select * into b from businesses where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;

  -- Abrirla la pone "en revisión": es lo que la empresa ve en su resumen.
  if b.status = 'submitted' and b.revision_note is null then
    update businesses set status = 'in_review' where id = p_id;
    b.status := 'in_review';
  end if;

  select array_agg(id order by enviado_at) into v_cola
    from businesses where status in ('submitted','in_review') and revision_note is null;
  v_pos := array_position(v_cola, p_id);

  return jsonb_build_object(
    'ok', true,
    'negocio', jsonb_build_object(
      'id', b.id, 'slug', b.slug, 'nombre_comercial', b.nombre_comercial,
      'razon_social', b.razon_social, 'cuit', b.cuit,
      'cuit_valido', case when b.cuit is null then null else brote_cuit_valido(b.cuit) end,
      'rubro', b.rubro, 'tamano', b.tamano, 'provincia', b.provincia, 'ciudad', b.ciudad,
      'descripcion', b.descripcion, 'sitio_web', b.sitio_web, 'instagram', b.instagram,
      'whatsapp', b.whatsapp, 'email_contacto', b.email_contacto,
      'status', b.status, 'tier', b.tier, 'intereses', to_jsonb(b.intereses),
      'score_ia', b.score_ia, 'informe_ia', b.informe_ia,
      'revision_note', b.revision_note, 'revisado_at', b.revisado_at,
      'enviado_at', b.enviado_at, 'created_at', b.created_at,
      'sitio_estado', b.sitio_estado, 'sitio_chequeado_at', b.sitio_chequeado_at),
    'creador', (select jsonb_build_object('display_name', p.display_name, 'username', p.username,
                                           'desde', p.created_at)
                from profiles p where p.id = b.created_by),
    'verificaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'method', v.method, 'status', v.status, 'target', v.target, 'intentos', v.intentos,
        'ultimo_error', v.ultimo_error, 'evidencia_url', v.evidencia_url,
        'verified_at', v.verified_at, 'ultimo_intento_at', v.ultimo_intento_at)
        order by v.created_at)
      from business_verifications v where v.business_id = b.id), '[]'::jsonb),
    'duplicados', brote_negocio_duplicados(b.id),
    'riesgos', to_jsonb(brote_negocio_riesgos(b.id)),
    'anterior', case when v_pos > 1 then v_cola[v_pos - 1] end,
    'siguiente', case when v_pos is not null and v_pos < cardinality(v_cola) then v_cola[v_pos + 1]
                      when v_pos is null then v_cola[1] end
  );
end $fn$;

create or replace function admin_negocio_revisar(p_pass text, p_id uuid, p_accion text, p_nota text default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  b businesses%rowtype;
  v_nota text := nullif(trim(coalesce(p_nota, '')), '');
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  if p_accion not in ('aprobar','pedir_datos','rechazar') then
    return jsonb_build_object('ok', false, 'error', 'Acción inválida');
  end if;
  select * into b from businesses where id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  if b.status not in ('submitted','in_review') then
    return jsonb_build_object('ok', false, 'error', 'Esta solicitud ya no está pendiente');
  end if;
  -- Pedir datos y rechazar sin decir qué ni por qué deja a la empresa a ciegas.
  if p_accion in ('pedir_datos','rechazar') and coalesce(char_length(v_nota), 0) < 10 then
    return jsonb_build_object('ok', false, 'error', 'Escribí en la nota qué falta o por qué');
  end if;

  update businesses set
    status = case p_accion when 'aprobar' then 'approved'::business_status
                           when 'rechazar' then 'rejected'::business_status
                           else 'submitted'::business_status end,
    tier = case when p_accion = 'aprobar' and tier < 'e1' then 'e1'::evidence_tier else tier end,
    revision_note = v_nota,
    revisado_por = auth.uid(),
    revisado_at = now(),
    ultima_revision = now()
  where id = p_id;

  if p_accion = 'aprobar' then
    perform brote_negocio_notificar(p_id, b.nombre_comercial || ' ya está en Brote',
      coalesce(v_nota, 'Aprobamos la solicitud. Ya podés entrar al espacio de tu negocio.'), '/negocio');
  elsif p_accion = 'pedir_datos' then
    perform brote_negocio_notificar(p_id, 'Nos falta un dato de ' || b.nombre_comercial,
      v_nota, '/negocio');
  else
    perform brote_negocio_notificar(p_id, 'No pudimos aprobar a ' || b.nombre_comercial,
      v_nota, '/negocio');
  end if;

  return jsonb_build_object('ok', true);
end $fn$;

-- ── 10. Privilegios de funciones ────────────────────────────────────────────
-- Los privilegios por defecto dan EXECUTE a anon: se revoca en todas.

revoke all on function unaccent_safe(text)                          from public, anon;
revoke all on function brote_verify_token()                         from public, anon, authenticated;
revoke all on function brote_cuit_valido(text)                      from public, anon;
revoke all on function brote_dominio(text)                          from public, anon;
revoke all on function brote_nombre_normalizado(text)               from public, anon;
revoke all on function brote_rubros()                               from public, anon;
revoke all on function brote_provincias()                           from public, anon;
revoke all on function brote_is_member(uuid)                        from public, anon;
revoke all on function brote_biz_role(uuid)                         from public, anon;
revoke all on function brote_can_write(uuid, text)                  from public, anon;
revoke all on function brote_storage_negocio(text, text)            from public, anon;
revoke all on function brote_slugify(text)                          from public, anon, authenticated;
revoke all on function brote_negocio_duplicados(uuid)               from public, anon, authenticated;
revoke all on function brote_negocio_riesgos(uuid)                  from public, anon, authenticated;
revoke all on function brote_negocio_notificar(uuid, text, text, text) from public, anon, authenticated;
revoke all on function brote_negocio_notificar_revisores(text, text, text) from public, anon, authenticated;
revoke all on function create_business(text, text, business_size, text, text) from public, anon;
revoke all on function my_businesses()                              from public, anon;
revoke all on function negocio_detalle(uuid)                        from public, anon;
revoke all on function negocio_guardar_alta(uuid, jsonb, int)       from public, anon;
revoke all on function negocio_enviar(uuid)                         from public, anon;
revoke all on function negocio_verificacion_preparar(uuid, verification_method) from public, anon;
revoke all on function negocio_verificacion_captura(uuid, text)     from public, anon;
revoke all on function admin_negocios_cola(text, text)              from public, anon;
revoke all on function admin_negocio_detalle(text, uuid)            from public, anon;
revoke all on function admin_negocio_revisar(text, uuid, text, text) from public, anon;

grant execute on function unaccent_safe(text)                       to authenticated;
grant execute on function brote_cuit_valido(text)                   to authenticated;
grant execute on function brote_dominio(text)                       to authenticated;
grant execute on function brote_nombre_normalizado(text)            to authenticated;
grant execute on function brote_rubros()                            to authenticated;
grant execute on function brote_provincias()                        to authenticated;
grant execute on function brote_is_member(uuid)                     to authenticated;
grant execute on function brote_biz_role(uuid)                      to authenticated;
grant execute on function brote_can_write(uuid, text)               to authenticated;
grant execute on function brote_storage_negocio(text, text)         to authenticated;
grant execute on function create_business(text, text, business_size, text, text) to authenticated;
grant execute on function my_businesses()                           to authenticated;
grant execute on function negocio_detalle(uuid)                     to authenticated;
grant execute on function negocio_guardar_alta(uuid, jsonb, int)    to authenticated;
grant execute on function negocio_enviar(uuid)                      to authenticated;
grant execute on function negocio_verificacion_preparar(uuid, verification_method) to authenticated;
grant execute on function negocio_verificacion_captura(uuid, text)  to authenticated;
grant execute on function admin_negocios_cola(text, text)           to authenticated;
grant execute on function admin_negocio_detalle(text, uuid)         to authenticated;
grant execute on function admin_negocio_revisar(text, uuid, text, text) to authenticated;

-- ── 11. Storage ─────────────────────────────────────────────────────────────
-- `listing-images` es de la fase 3 y se crea con ella.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-logos', 'business-logos', true, 1048576,
        array['image/png','image/jpeg','image/webp']),
       ('business-evidence', 'business-evidence', false, 5242880,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Evidencia: privada. Leen y suben los miembros del negocio dueño del prefijo;
-- el revisor la ve por URL firmada de 60 s desde `verify-business`.
drop policy if exists "negocios evidencia lee" on storage.objects;
create policy "negocios evidencia lee" on storage.objects for select to authenticated
  using (bucket_id = 'business-evidence' and brote_storage_negocio(name));

drop policy if exists "negocios evidencia sube" on storage.objects;
create policy "negocios evidencia sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'business-evidence' and brote_storage_negocio(name, 'editor'));

-- Logos: el bucket es público para leer; escriben owner y admin.
drop policy if exists "negocios logos sube" on storage.objects;
create policy "negocios logos sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'business-logos' and brote_storage_negocio(name, 'admin'));

drop policy if exists "negocios logos cambia" on storage.objects;
create policy "negocios logos cambia" on storage.objects for update to authenticated
  using (bucket_id = 'business-logos' and brote_storage_negocio(name, 'admin'))
  with check (bucket_id = 'business-logos' and brote_storage_negocio(name, 'admin'));

drop policy if exists "negocios logos borra" on storage.objects;
create policy "negocios logos borra" on storage.objects for delete to authenticated
  using (bucket_id = 'business-logos' and brote_storage_negocio(name, 'admin'));

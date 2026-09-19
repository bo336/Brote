-- Brote — 0107 — Negocios · Fase 3: Mercado.
--
-- Listados de productos y servicios con afirmaciones ambientales TIPIFICADAS,
-- cada una con su nivel de evidencia; el catálogo público, la salida por
-- interstitial, los reportes y la revisión (brote-negocios/fases/
-- FASE_3_MERCADO.md, 04_ESQUEMA_DB.md §4, 05_ALGORITMOS.md §3 y §4,
-- 08_LEGAL_Y_CONFIANZA.md).
--
-- LA REGLA QUE ORGANIZA TODO: ANTIHALO
--
-- El nivel es de la AFIRMACIÓN, nunca del producto ni de la empresa. Un
-- listado puede mostrar una afirmación en Nivel 3 y otra en Nivel 1 a la vez, y
-- `listings.tier_efectivo` (el máximo de las suyas) solo se usa para ORDENAR.
-- Si algún día aparece `listing.tier = business.tier`, el sistema perdió su
-- integridad.
--
-- MISMAS DECISIONES QUE 0105 Y 0106, POR LOS MISMOS MOTIVOS
--
-- 1. Escritura solo por RPC. Las policies del documento (`for all using
--    brote_is_member ... with check brote_can_write`) dejaban a un editor
--    escribir `status = 'aprobada'` y `tier = 'e3'` sobre su propia afirmación,
--    o `status = 'publicado'` sobre su listado: autoaprobación. `authenticated`
--    no tiene INSERT/UPDATE/DELETE en ninguna tabla nueva; las policies quedan
--    como matriz de acceso (03 §4.2).
-- 2. Lectura pública por columnas. RLS filtra filas, no columnas: sin grants
--    por columna, un listado publicado exponía el precio (que un teen no puede
--    ver, 08 §9), la URL de destino (que solo se entrega al pasar por el
--    interstitial, 08 §3.7), el screening de la IA y la nota del revisor.
-- 3. El revisor es la contraseña del panel (`admin_check`).
--
-- LO QUE SE CORRIGIÓ DE LA CARPETA, Y POR QUÉ
--
-- · El registro de certificadoras se VERIFICÓ contra el PDF de SENASA
--   "Entidades certificadoras habilitadas por el Senasa - Julio 2025" (el
--   vigente en su página el 2026-09-18). Argencert NO figura: queda desactivada.
--   IRAM, SG Agrovisto y Control Union SÍ figuran y faltaban. Rainforest
--   Alliance venía habilitando `organico`, pero en Argentina lo orgánico lo
--   certifica solo una entidad habilitada por SENASA (Ley 25.127): se le saca.
-- · `claims publicas` escondía toda afirmación con certificado vencido, y
--   02 §8 dice lo contrario: al vencer, baja de E3 a E2 y SIGUE a la vista. La
--   visibilidad pública es "aprobada y con nivel", no "certificado vigente".
-- · Máximo 2 seguidos de la misma empresa: `0.7^n` solo no lo garantiza cuando
--   una empresa domina el puntaje (ver `lib/mercado/ranking.ts`).
--
-- LO QUE SE AGREGA AL ESQUEMA DEL DOCUMENTO
--
-- · `listing_impresiones`: el CTR de §4.4 necesita impresiones. Una fila por
--   persona, listado y día — inflar las impresiones de un competidor para
--   bajarle el CTR cuesta una cuenta por día.
-- · `listing_clicks_mensual`: la retención de 180 días de 04 §8 con su
--   agregado mensual conservado para siempre.
-- · `listing_reports.descargo*` y `corregir_hasta`: el derecho de descargo de
--   7 días y los 30 días para corregir (08 §8).
-- · `business_claims.categoria_origen`: la alerta de halo de fase 3 §5.3 (una
--   afirmación aprobada para harina enganchada a un producto de limpieza).
-- · `businesses.nota_correccion`: la nota de corrección pública de 08 §5.2.
-- · `brote_negocios_diario()`: el job diario de 03 §6 — vencimientos de
--   certificados, niveles, puntajes, retención, y lo que la fase 2 dejó sin
--   programar: objetivos por vencer / vencidos y el decaimiento del Progreso.

-- ── 1. Enums ────────────────────────────────────────────────────────────────

do $$ begin create type listing_status as enum
  ('draft','pendiente','publicado','despublicado','rechazado','removido');
exception when duplicate_object then null; end $$;

do $$ begin create type listing_kind as enum ('producto','servicio');
exception when duplicate_object then null; end $$;

do $$ begin create type claim_status as enum
  ('borrador','pendiente','aprobada','rechazada','vencida');
exception when duplicate_object then null; end $$;

do $$ begin create type claim_kind as enum (
  'organico','reciclable','contenido_reciclado','compostable','biodegradable',
  'libre_de','no_toxico','energia_renovable','materiales_renovables',
  'reduccion_origen','recargable','huella_carbono','bienestar_animal',
  'local_estacional','comercio_justo','certificacion_tercero');
exception when duplicate_object then null; end $$;

do $$ begin create type report_reason as enum (
  'afirmacion_falsa','enlace_roto','no_es_el_producto','precio_muy_distinto','no_responde','otro');
exception when duplicate_object then null; end $$;

-- ── 2. Registro de certificaciones ──────────────────────────────────────────

create table if not exists certifications (
  slug         text primary key,
  nombre       text not null,
  emisor       text not null,
  pais         text,
  claims       claim_kind[] not null default '{}',   -- a qué afirmaciones habilita
  tiene_numero boolean not null default true,
  vence        boolean not null default true,
  url_registro text,
  nota         text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Verificado el 2026-09-18 contra el PDF de SENASA (Julio 2025). La nota de
-- cada fila dice qué se verificó y contra qué: es lo que el revisor mira antes
-- de confiar en un E3.
insert into certifications (slug, nombre, emisor, pais, claims, tiene_numero, vence, url_registro, nota, activo) values
  ('oia', 'Certificación orgánica OIA', 'Organización Internacional Agropecuaria S.A.', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 98, animal 1. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('ecocert-ar', 'Certificación orgánica Ecocert Argentina', 'Ecocert Argentina S.A.', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 96, animal 2. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('food-safety', 'Certificación orgánica Food Safety', 'Food Safety S.A.', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 104, animal 6. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('letis', 'Certificación orgánica Letis', 'Letis S.A.', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 103, animal 10. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('iram-organico', 'Certificación orgánica IRAM', 'Instituto Argentino de Normalización y Certificación (IRAM)', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 200, SIN registro animal: no certifica productos orgánicos de origen animal. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('agrovisto', 'Certificación orgánica SG Agrovisto', 'SG Agrovisto S.R.L.', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 201, animal 201. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('control-union', 'Certificación orgánica Control Union', 'Control Union Argentina S.A.', 'AR',
   '{organico}', true, true,
   'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica/entidades-certificadoras',
   'Habilitada por SENASA (Ley 25.127). Registro vegetal 202, animal 202. Verificado el 2026-09-18 contra el PDF "Julio 2025".', true),
  ('argencert', 'Certificación orgánica Argencert', 'Argencert', 'AR',
   '{organico}', true, true, null,
   'DESACTIVADA: no figura en el registro de SENASA "Julio 2025" (verificado el 2026-09-18). Un E3 con esta entidad sería una afirmación falsa hecha por Brote.', false),

  ('fsc', 'FSC', 'Forest Stewardship Council', null,
   '{materiales_renovables,certificacion_tercero}', true, true, 'https://search.fsc.org',
   'Certifica el manejo forestal o la cadena de custodia de un producto de madera o papel.', true),
  ('pefc', 'PEFC', 'PEFC International', null,
   '{materiales_renovables}', true, true, 'https://www.pefc.org/find-certified',
   'Certificación forestal.', true),
  ('grs', 'Global Recycled Standard', 'Textile Exchange', null,
   '{contenido_reciclado}', true, true, null,
   'Contenido reciclado con cadena de custodia.', true),
  ('rcs', 'Recycled Claim Standard', 'Textile Exchange', null,
   '{contenido_reciclado}', true, true, null,
   'Contenido reciclado.', true),

  ('ok-compost-industrial', 'OK Compost Industrial', 'TÜV Austria', null,
   '{compostable}', true, true, null,
   'Compostaje INDUSTRIAL: no respalda una afirmación de compostaje domiciliario.', true),
  ('ok-compost-home', 'OK Compost Home', 'TÜV Austria', null,
   '{compostable}', true, true, null,
   'Compostaje domiciliario.', true),
  ('en13432', 'EN 13432', 'Norma europea (varios organismos)', null,
   '{compostable,biodegradable}', true, true, null,
   'Norma de compostabilidad industrial de envases.', true),
  ('astm-d6400', 'ASTM D6400', 'Norma ASTM (varios organismos)', null,
   '{compostable}', true, true, null,
   'Norma de compostabilidad industrial.', true),

  ('leaping-bunny', 'Leaping Bunny', 'Cruelty Free International', null,
   '{bienestar_animal}', true, true, 'https://www.leapingbunny.org',
   'Sin testeo en animales, producto e ingredientes.', true),
  ('vegan-society', 'Vegan Trademark', 'The Vegan Society', null,
   '{bienestar_animal}', true, true, null,
   'Producto vegano.', true),

  ('fairtrade', 'Fairtrade', 'Fairtrade International', null,
   '{comercio_justo}', true, true, null, null, true),
  ('wfto', 'Garantía WFTO', 'World Fair Trade Organization', null,
   '{comercio_justo}', true, true, null, null, true),

  ('iso14001', 'ISO 14001', 'Organismos acreditados', null,
   '{certificacion_tercero}', true, true, null,
   'Certifica un SISTEMA DE GESTIÓN, no un producto. El alcance es obligatorio en el texto público.', true),
  ('sistema-b', 'Empresa B', 'Sistema B / B Lab', null,
   '{certificacion_tercero}', true, true, null,
   'Certifica la empresa, no el producto. Alcance obligatorio.', true),
  ('rainforest', 'Rainforest Alliance', 'Rainforest Alliance', null,
   '{certificacion_tercero}', true, true, null,
   'Verificar el alcance del certificado. NO habilita "orgánico": en Argentina eso solo lo certifica una entidad habilitada por SENASA.', true)
on conflict (slug) do nothing;

-- ── 3. Afirmaciones ─────────────────────────────────────────────────────────

create table if not exists business_claims (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  kind            claim_kind not null,
  alcance         text not null,          -- a qué aplica: "harina de trigo", "envase"
  -- El texto público al momento de enviarla (08 §5.2, art. 21: con qué texto
  -- exacto). Lo genera `lib/mercado/claims.ts`; no hay texto libre.
  enunciado       text not null default '',
  datos           jsonb not null default '{}',   -- campos del tipo (%, plazo, etc.)

  cert_slug       text references certifications(slug),
  cert_numero     text,
  cert_vence      date,
  evidencia_path  text,                   -- bucket business-evidence

  tier            evidence_tier not null default 'e0',
  status          claim_status  not null default 'borrador',
  observacion     text,
  categoria_origen text,                  -- la del primer listado donde se aprobó
  auto_aprobada   boolean not null default false,  -- publicación acelerada
  aviso_vence_at  timestamptz,
  revisado_por    uuid references profiles(id) on delete set null,
  revisado_at     timestamptz,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_claims_business on business_claims (business_id, status);
create index if not exists idx_claims_vence on business_claims (cert_vence)
  where cert_vence is not null and status = 'aprobada';
create index if not exists idx_claims_cert on business_claims (cert_slug) where cert_slug is not null;
create index if not exists idx_claims_revisor on business_claims (revisado_por) where revisado_por is not null;
create index if not exists idx_claims_creador on business_claims (created_by) where created_by is not null;

-- ── 4. Listados ─────────────────────────────────────────────────────────────

create table if not exists listings (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  slug              text unique not null,
  tipo              listing_kind not null default 'producto',
  titulo            text not null,
  descripcion       text not null default '',
  imagenes          text[] not null default '{}',
  categoria         text not null,
  dominios          text[] not null default '{}',
  precio_referencia numeric,
  moneda            text not null default 'ARS',
  url_destino       text not null default '',
  disponibilidad    text not null default 'online',   -- online|local|ambas
  zonas             text[] not null default '{}',     -- provincias

  status            listing_status not null default 'draft',
  score             numeric not null default 0,       -- MATERIALIZADO, 05 §4
  score_at          timestamptz,
  tier_efectivo     evidence_tier not null default 'e1',

  screening_ia      jsonb,       -- lo escribe `screen-listing`, o null sin IA
  validacion        jsonb,       -- lo que marcó el validador determinista
  observacion       text,
  acelerada         boolean not null default false,
  auditado_at       timestamptz,
  despublicado_por  text,        -- negocio|revisor|reportes|correccion
  publicado_at      timestamptz,
  enviado_at        timestamptz,
  revisado_por      uuid references profiles(id) on delete set null,
  revisado_at       timestamptz,
  link_fallos       int not null default 0,
  link_check_at     timestamptz,

  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  -- SIN trigger de touch, a propósito: `updated_at` es "cuándo cambió el
  -- contenido" y alimenta la frescura del ranking (05 §4.3). Si el recálculo
  -- diario del puntaje lo tocara, ningún listado envejecería nunca.
  updated_at        timestamptz not null default now(),
  constraint listings_disponibilidad check (disponibilidad in ('online','local','ambas'))
);
create index if not exists idx_listings_orden on listings (status, score desc, id)
  where status = 'publicado';
create index if not exists idx_listings_business on listings (business_id, status);
create index if not exists idx_listings_cat on listings (categoria) where status = 'publicado';
create index if not exists idx_listings_dominios on listings using gin (dominios);
create index if not exists idx_listings_revisor on listings (revisado_por) where revisado_por is not null;
create index if not exists idx_listings_creador on listings (created_by) where created_by is not null;
create index if not exists idx_listings_cola on listings (enviado_at) where status = 'pendiente';

-- ── 5. La regla antihalo, en SQL ────────────────────────────────────────────

create table if not exists listing_claims (
  listing_id uuid not null references listings(id)        on delete cascade,
  claim_id   uuid not null references business_claims(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, claim_id)
);
create index if not exists idx_lclaims_claim on listing_claims (claim_id);

-- Defensa en profundidad de lo que las RPC ya chequean: una afirmación solo se
-- engancha a un listado de SU empresa, y a lo sumo 5 por listado (02 §5.1).
create or replace function brote_lclaims_guard()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_l uuid; v_c uuid; n int;
begin
  select business_id into v_l from listings where id = new.listing_id;
  select business_id into v_c from business_claims where id = new.claim_id;
  if v_l is distinct from v_c then
    raise exception 'afirmacion_ajena' using errcode = 'P0001';
  end if;
  select count(*) into n from listing_claims where listing_id = new.listing_id;
  if n >= 5 then raise exception 'max_afirmaciones' using errcode = 'P0001'; end if;
  return new;
end $fn$;

drop trigger if exists trg_lclaims_guard on listing_claims;
create trigger trg_lclaims_guard before insert on listing_claims
for each row execute function brote_lclaims_guard();

-- ── 6. Clics, impresiones y reportes ────────────────────────────────────────

create table if not exists listing_clicks (
  id          bigserial primary key,
  listing_id  uuid not null references listings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  origen      text,                    -- catalogo|accion|perfil_negocio|busqueda|ficha
  ua_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_clicks_listing on listing_clicks (listing_id, created_at desc);
create index if not exists idx_clicks_business on listing_clicks (business_id, created_at desc);
create index if not exists idx_clicks_user on listing_clicks (user_id, business_id, created_at desc)
  where user_id is not null;

create table if not exists listing_clicks_mensual (
  listing_id  uuid not null references listings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  mes         date not null,
  clics       int not null default 0,
  primary key (listing_id, mes)
);
create index if not exists idx_clicks_mensual_business on listing_clicks_mensual (business_id, mes);

create table if not exists listing_impresiones (
  listing_id uuid not null references listings(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  dia        date not null default current_date,
  primary key (listing_id, user_id, dia)
);
create index if not exists idx_impresiones_user on listing_impresiones (user_id);
create index if not exists idx_impresiones_dia on listing_impresiones (dia);

create table if not exists listing_reports (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references listings(id) on delete cascade,
  business_id    uuid not null references businesses(id) on delete cascade,
  user_id        uuid references profiles(id) on delete set null,
  motivo         report_reason not null,
  detalle        text,
  estado         text not null default 'abierto',   -- abierto|confirmado|desestimado
  descargo       text,
  descargo_path  text,
  descargo_at    timestamptz,
  descargo_vence timestamptz not null default (now() + interval '7 days'),
  corregir_hasta timestamptz,
  nota           text,
  resuelto_por   uuid references profiles(id) on delete set null,
  resuelto_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint listing_reports_estado check (estado in ('abierto','confirmado','desestimado')),
  constraint listing_reports_otro check (motivo <> 'otro' or length(trim(coalesce(detalle, ''))) >= 10)
);
create index if not exists idx_reports_listing on listing_reports (listing_id, estado);
create index if not exists idx_reports_business on listing_reports (business_id, estado);
create index if not exists idx_reports_resuelto on listing_reports (resuelto_por) where resuelto_por is not null;
-- Diez reportes de la misma persona cuentan como uno: el ataque obvio queda
-- cerrado en el esquema, no en la interfaz (04 §4.5).
create unique index if not exists idx_reports_unico
  on listing_reports (listing_id, user_id) where user_id is not null;

-- ── 7. Negocio: la nota de corrección pública (08 §5.2) ────────────────────

alter table businesses add column if not exists nota_correccion text;
alter table businesses add column if not exists nota_correccion_at timestamptz;

-- ── 8. Privilegios de tabla ─────────────────────────────────────────────────

revoke all on certifications, business_claims, listings, listing_claims, listing_clicks,
              listing_clicks_mensual, listing_impresiones, listing_reports
  from anon, authenticated;

grant select on certifications to anon, authenticated;

-- Lo público de un listado. Sin precio (un teen no lo ve: se entrega por RPC
-- según la cuenta), sin URL de destino (se entrega solo al pasar por el
-- interstitial), sin screening ni notas.
grant select (id, business_id, slug, tipo, titulo, descripcion, imagenes, categoria, dominios,
              disponibilidad, zonas, status, tier_efectivo, publicado_at, updated_at)
  on listings to authenticated;

grant select (id, business_id, kind, alcance, enunciado, tier, status, cert_slug, cert_vence)
  on business_claims to authenticated;

grant select on listing_claims to authenticated;

-- `nota_correccion` es pública a propósito: es la publicidad correctiva.
grant select (nota_correccion, nota_correccion_at) on businesses to anon, authenticated;

-- ── 9. Categorías, cuentas y funciones de apoyo ─────────────────────────────

-- Las 12 de 02 §5.2. MISMO listado y orden que `lib/mercado/categorias.ts`
-- (lo comprueba un test que lee este archivo).
create or replace function brote_mercado_categorias()
returns text[] language sql immutable set search_path = public as $fn$
  select array[
    'alimentos-frescos','almacen-granel','bebidas','limpieza-hogar',
    'cuidado-personal','indumentaria','hogar-y-deco','jardin-y-huerta',
    'mascotas','movilidad','servicios-profesionales','reparacion-y-reuso'];
$fn$;

-- Lo que una cuenta `teen` no ve (08 §9: "solo categorías no sensibles").
-- Bebidas incluye alcohol; movilidad, vehículos y financiación; servicios
-- profesionales, contratación. MISMO listado que `CATEGORIAS_SENSIBLES`.
create or replace function brote_mercado_sensibles()
returns text[] language sql immutable set search_path = public as $fn$
  select array['bebidas','movilidad','servicios-profesionales'];
$fn$;

-- La cuenta de quien consulta. Sin sesión, `null`: el catálogo vive en el
-- shell autenticado y sus RPC no se le dan a anon.
create or replace function brote_mercado_cuenta()
returns text language sql stable security definer set search_path = public as $fn$
  select brote_account_type((select auth.uid()));
$fn$;

-- Si esta cuenta puede ver algo de esta categoría (08 §9). `kid`: nada.
-- Se usa en las policies Y en las RPC: se aplica en el servidor, no
-- escondiendo componentes.
create or replace function brote_mercado_puede_ver(p_categoria text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select case coalesce(brote_mercado_cuenta(), 'adult')
    when 'kid'  then false
    when 'teen' then not (p_categoria = any(brote_mercado_sensibles()))
    else true end;
$fn$;

-- El precio solo para adultos (08 §9).
create or replace function brote_mercado_ve_precios()
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce(brote_mercado_cuenta(), 'adult') = 'adult';
$fn$;

-- "Verificación fuerte" (05 §3.1): dominio por etiqueta, DNS o archivo, o
-- email del dominio. `social_token` es media; `cuit_declarado` no es nada.
create or replace function brote_verificacion_fuerte(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from business_verifications
                 where business_id = p_business and status = 'verificado'
                   and method in ('dominio_meta','dominio_dns','dominio_archivo','email_dominio'));
$fn$;

-- La fuerza para mostrar: fuerte, media o null.
create or replace function brote_verificacion_fuerza(p_business uuid)
returns text language sql stable security definer set search_path = public as $fn$
  select case
    when brote_verificacion_fuerte(p_business) then 'fuerte'
    when exists (select 1 from business_verifications
                 where business_id = p_business and status = 'verificado' and method = 'social_token') then 'media'
    else null end;
$fn$;

-- ── Puntos de enganche de la fase 4 (cobro). NO se usan todavía ─────────────
-- El plan de la empresa NO entra en el orden del catálogo, nunca (09 §2.1).
-- Solo decide cosas operativas: publicación acelerada, historial público, gracia.
create or replace function brote_negocio_plan(p_business uuid)
returns text language sql stable security definer set search_path = public as $fn$
  select 'semilla'::text;   -- fase 4: leer de business_subscriptions
$fn$;

create or replace function brote_negocio_en_gracia(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select false;             -- fase 4: suscripción en período de gracia
$fn$;

create or replace function brote_negocio_permite(p_business uuid, p_que text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select case p_que
    when 'historial_publico' then brote_negocio_plan(p_business) in ('raiz','bosque')
    else false end;
$fn$;

-- Publicación acelerada (fase 3 §6.3): después de la PRIMERA aprobación, con
-- verificación fuerte, sin reportes confirmados y con plan Raíz o Bosque.
create or replace function brote_negocio_acelerado(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select brote_verificacion_fuerte(p_business)
     and exists (select 1 from listings where business_id = p_business and revisado_at is not null
                   and status in ('publicado','despublicado') and not acelerada)
     and not exists (select 1 from listing_reports where business_id = p_business and estado = 'confirmado')
     and brote_negocio_plan(p_business) in ('raiz','bosque');
$fn$;

-- ── 10. El nivel de una afirmación (05 §3.1) ────────────────────────────────
-- Espejo de `lib/negocio/niveles.ts`. Los tres conjuntos de abajo son los de
-- `lib/mercado/claims.ts` (SIN_E1, SIN_E2, SIN_E3) y un test los compara.

create or replace function brote_claim_nivel(c business_claims)
returns evidence_tier language plpgsql stable security definer set search_path = public as $fn$
declare cert certifications%rowtype;
begin
  if c.status is distinct from 'aprobada' then return 'e0'; end if;

  -- E3: del registro, activa, con número si lo exige, vigente, y que HABILITE
  -- este tipo de afirmación (un FSC no respalda "libre de parabenos").
  if c.kind not in ('reduccion_origen','recargable') and c.cert_slug is not null then
    select * into cert from certifications where slug = c.cert_slug and activo;
    if cert.slug is not null
       and c.kind = any(cert.claims)
       and (not cert.tiene_numero or nullif(trim(coalesce(c.cert_numero, '')), '') is not null)
       and (not cert.vence or (c.cert_vence is not null and c.cert_vence >= current_date)) then
      return 'e3';
    end if;
  end if;

  -- E2: identidad FUERTE + documento revisado.
  if c.kind <> 'certificacion_tercero'
     and c.evidencia_path is not null
     and brote_verificacion_fuerte(c.business_id) then
    return 'e2';
  end if;

  -- E1: declarada y específica. `no_toxico` y `huella_carbono` no la admiten, y
  -- `certificacion_tercero` sin certificado vigente no es nada.
  if c.kind not in ('no_toxico','huella_carbono','certificacion_tercero') then
    return 'e1';
  end if;
  return 'e0';
end $fn$;

-- Largo de un array jsonb, 0 si no es un array (lo que escribe la IA no se
-- da por bien formado).
create or replace function brote_jsonb_largo(p jsonb)
returns int language sql immutable set search_path = public as $fn$
  select case when jsonb_typeof(p) = 'array' then jsonb_array_length(p) else 0 end;
$fn$;

-- ── 11. Validación dura de una afirmación ───────────────────────────────────
-- `lib/mercado/claims.ts` valida todo (schemas Zod, sustancias genéricas, pares
-- irrelevantes). Esto es la defensa de la base contra una llamada que saltee el
-- formulario: repite los rechazos que tienen consecuencia legal.

create or replace function brote_claim_error(
  p_business uuid, p_kind claim_kind, p_alcance text, d jsonb,
  p_cert_slug text, p_cert_numero text, p_cert_vence date, p_evidencia text)
returns text language plpgsql stable security definer set search_path = public as $fn$
declare cert certifications%rowtype;
begin
  if length(trim(coalesce(p_alcance, ''))) < 3 then return 'falta_alcance'; end if;
  if p_evidencia is not null
     and p_evidencia !~ ('^' || p_business::text || '/afirmaciones/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$') then
    return 'ruta_invalida';
  end if;

  if p_cert_slug is not null then
    select * into cert from certifications where slug = p_cert_slug and activo;
    if cert.slug is null then return 'cert_desconocida'; end if;
    if not (p_kind = any(cert.claims)) then return 'cert_no_habilita'; end if;
    if cert.tiene_numero and nullif(trim(coalesce(p_cert_numero, '')), '') is null then return 'falta_numero'; end if;
    if cert.vence and p_cert_vence is null then return 'falta_vencimiento'; end if;
  end if;

  case p_kind
    when 'organico' then
      if d ? 'porcentaje' and not ((d->>'porcentaje') ~ '^\d+$' and (d->>'porcentaje')::int between 1 and 100) then
        return 'porcentaje_invalido'; end if;
    when 'reciclable' then
      if length(trim(coalesce(d->>'material', ''))) < 2 then return 'falta_material'; end if;
      if coalesce(d->>'disponibilidad', '') not in
         ('recoleccion_diferenciada_amplia','puntos_verdes_ciudad','cooperativa_local','retorno_al_comercio','consultar_en_tu_zona')
      then return 'falta_disponibilidad'; end if;
    when 'contenido_reciclado' then
      if not (coalesce(d->>'porcentaje', '') ~ '^\d+$' and (d->>'porcentaje')::int between 1 and 100) then
        return 'falta_porcentaje'; end if;
    when 'compostable' then
      if coalesce(d->>'tipo_compostaje', '') not in ('domiciliario','industrial') then return 'falta_tipo_compostaje'; end if;
      if not (coalesce(d->>'plazo_meses', '') ~ '^\d+$' and (d->>'plazo_meses')::int >= 1) then return 'falta_plazo'; end if;
    when 'biodegradable' then
      if not (coalesce(d->>'plazo_meses', '') ~ '^\d+$') then return 'falta_plazo'; end if;
      if (d->>'plazo_meses')::int > 12 then return 'plazo_mayor_12'; end if;
      if (d->>'plazo_meses')::int < 1 then return 'falta_plazo'; end if;
      if length(trim(coalesce(d->>'condiciones', ''))) < 4 then return 'faltan_condiciones'; end if;
    when 'libre_de' then
      if length(trim(coalesce(d->>'sustancia', ''))) < 3 then return 'falta_sustancia'; end if;
      if coalesce(d->>'no_agregada_intencionalmente', 'false') <> 'true' then return 'falta_no_agregada'; end if;
      if length(trim(coalesce(d->>'sustituto', ''))) < 3 then return 'falta_sustituto'; end if;
    when 'no_toxico' then
      if coalesce(d->>'para_quien', '') not in ('personas','ambiente','ambos') then return 'falta_para_quien'; end if;
      if p_evidencia is null and p_cert_slug is null then return 'falta_documento'; end if;
    when 'energia_renovable' then
      if coalesce(d->>'fuente', '') not in ('solar','eolica','hidro','biomasa','mixta') then return 'falta_fuente'; end if;
      if not (coalesce(d->>'porcentaje_procesos', '') ~ '^\d+$') then return 'falta_porcentaje'; end if;
      if (d->>'porcentaje_procesos')::int < 80 or (d->>'porcentaje_procesos')::int > 100 then return 'porcentaje_menor_80'; end if;
      if coalesce(d->>'certificados', '') = 'vendidos' then return 'certificados_vendidos'; end if;
    when 'materiales_renovables' then
      if length(trim(coalesce(d->>'material', ''))) < 3 then return 'falta_material'; end if;
      if not (coalesce(d->>'porcentaje', '') ~ '^\d+$' and (d->>'porcentaje')::int between 1 and 100) then
        return 'falta_porcentaje'; end if;
      if length(trim(coalesce(d->>'por_que_renovable', ''))) < 10 then return 'falta_por_que'; end if;
    when 'reduccion_origen' then
      if length(trim(coalesce(d->>'que_se_redujo', ''))) < 3 then return 'falta_que'; end if;
      if not (coalesce(d->>'porcentaje', '') ~ '^\d+$' and (d->>'porcentaje')::int between 1 and 100) then
        return 'falta_porcentaje'; end if;
      if coalesce(d->>'comparado_con', '') not in ('producto_anterior','estandar_categoria','otro') then
        return 'falta_comparado_con'; end if;
      if d->>'comparado_con' = 'otro' and length(trim(coalesce(d->>'comparado_con_otro', ''))) < 3 then
        return 'falta_comparado_con'; end if;
    when 'recargable' then
      if length(trim(coalesce(d->>'mecanismo_recarga', ''))) < 5 then return 'falta_mecanismo'; end if;
      if length(trim(coalesce(d->>'donde_se_recarga', ''))) < 3 then return 'falta_donde'; end if;
    when 'huella_carbono' then
      if coalesce(d->>'tipo', '') not in ('medida','reducida','compensada') then return 'falta_tipo'; end if;
      if length(trim(coalesce(d->>'metodologia', ''))) < 3 then return 'falta_metodologia'; end if;
      if p_evidencia is null and p_cert_slug is null then return 'falta_documento'; end if;
      -- "Carbono neutral" sin verificación de tercero: rechazo automático, sin
      -- excepciones ni para el plan Bosque (RUBRICA §12).
      if d->>'tipo' = 'compensada' then
        if length(trim(coalesce(d->>'verificador', ''))) < 3 then return 'falta_verificador'; end if;
        if length(trim(coalesce(d->>'registro', ''))) < 3 then return 'falta_registro'; end if;
        if coalesce(d->>'no_exigido_por_ley', 'false') <> 'true' then return 'compensacion_exigida'; end if;
      end if;
    when 'bienestar_animal' then
      if coalesce(d->>'tipo', '') not in ('sin_testeo','vegano','pastoreo','libre_de_jaulas') then return 'falta_tipo'; end if;
      if d->>'tipo' = 'sin_testeo'
         and coalesce(d->>'sin_testeo_alcance', '') not in ('producto_terminado','producto_e_ingredientes') then
        return 'falta_sin_testeo_alcance'; end if;
    when 'local_estacional' then
      if length(trim(coalesce(d->>'origen', ''))) < 3 then return 'falta_origen'; end if;
      if coalesce(d->>'de_estacion', 'false') = 'true'
         and (jsonb_typeof(d->'meses') is distinct from 'array' or jsonb_array_length(d->'meses') = 0) then
        return 'faltan_meses'; end if;
    when 'comercio_justo' then
      if coalesce(d->>'tipo', '') not in ('precio_justo','cooperativa','economia_social','certificado') then return 'falta_tipo'; end if;
      if d->>'tipo' in ('cooperativa','economia_social') and length(trim(coalesce(d->>'organizacion', ''))) < 3 then
        return 'falta_organizacion'; end if;
      if d->>'tipo' = 'certificado' and p_cert_slug is null then return 'falta_certificacion'; end if;
    when 'certificacion_tercero' then
      if p_cert_slug is null then return 'falta_certificacion'; end if;
      if p_cert_vence is not null and p_cert_vence < current_date then return 'cert_vencida'; end if;
    else null;
  end case;
  return null;
end $fn$;

-- ── 12. La lista negra, en la base ──────────────────────────────────────────
-- Absolutos sin sustento y afirmaciones de salud (RUBRICA, lista negra global;
-- 08 §8.3). Mismas palabras que `LISTA_NEGRA` en `lib/mercado/claims.ts` — un
-- test lee este archivo y lo comprueba. Se busca como palabra entera, sin
-- acentos y sin mayúsculas. "Se trata de" no es "trata" (tratar una dolencia).
create or replace function brote_texto_prohibido(p text)
returns text language plpgsql immutable set search_path = public as $fn$
declare
  t text := ' ' || regexp_replace(lower(unaccent_safe(coalesce(p, ''))), '[^a-z0-9%]+', ' ', 'g') || ' ';
  termino text;
begin
  t := replace(t, ' se trata de ', ' ');
  t := replace(t, ' se trata del ', ' ');
  foreach termino in array array[
    -- absolutos
    '100% ecologico','totalmente natural','no contamina','impacto cero','completamente sustentable',
    'amigable con el planeta','el mas ecologico','producto verde','eco friendly','biodegradable al 100%',
    'carbono neutral','carbono neutro','neutro en carbono',
    -- salud (ANMAT)
    'cura','previene','trata','sana','desintoxica','detox','elimina toxinas','refuerza las defensas',
    'fortalece el sistema inmune','adelgaza','antitumoral','antiviral','sin efectos secundarios'
  ] loop
    if position(' ' || termino || ' ' in t) > 0 then return termino; end if;
  end loop;
  return null;
end $fn$;

-- ── 13. RLS ─────────────────────────────────────────────────────────────────

alter table certifications         enable row level security;
alter table business_claims        enable row level security;
alter table listings               enable row level security;
alter table listing_claims         enable row level security;
alter table listing_clicks         enable row level security;
alter table listing_clicks_mensual enable row level security;
alter table listing_impresiones    enable row level security;
alter table listing_reports        enable row level security;

drop policy if exists "certs lee" on certifications;
create policy "certs lee" on certifications for select using (activo);

-- Pública: aprobada y con nivel. Un certificado vencido NO la esconde: la baja
-- a E2 y sigue a la vista (02 §8). Menores: por la cuenta, no por la interfaz.
drop policy if exists "claims publicas" on business_claims;
create policy "claims publicas" on business_claims for select to authenticated
  using (status = 'aprobada' and tier <> 'e0' and coalesce(brote_mercado_cuenta(), 'adult') <> 'kid');

drop policy if exists "claims miembro" on business_claims;
create policy "claims miembro" on business_claims for select to authenticated
  using (brote_is_member(business_id));

drop policy if exists "listings publicos" on listings;
create policy "listings publicos" on listings for select to authenticated
  using (status = 'publicado' and brote_mercado_puede_ver(categoria));

drop policy if exists "listings miembro" on listings;
create policy "listings miembro" on listings for select to authenticated
  using (brote_is_member(business_id));

drop policy if exists "lclaims lee" on listing_claims;
create policy "lclaims lee" on listing_claims for select to authenticated
  using (exists (select 1 from listings l where l.id = listing_id
                 and ((l.status = 'publicado' and brote_mercado_puede_ver(l.categoria))
                      or brote_is_member(l.business_id))));

-- El perfil público de un negocio aprobado (0105) lo leía cualquiera, `kid`
-- incluido: 08 §9 dice "Mercado: nada" y el checklist de 08 §10 lo pide como
-- prueba. Se parte en dos: la visita anónima sigue igual (no hay cuenta de la
-- que saber la edad, y `brote_mercado_cuenta` no se le concede a `anon`), y
-- las cuentas lo ven salvo `kid`. Ninguna pantalla lee la tabla directo —todo
-- pasa por RPC—, así que esto cierra la puerta de la API sin romper nada.
drop policy if exists "businesses publicas" on businesses;
create policy "businesses publicas" on businesses for select to anon
  using (status = 'approved');

drop policy if exists "businesses publicas cuentas" on businesses;
create policy "businesses publicas cuentas" on businesses for select to authenticated
  using (status = 'approved' and coalesce(brote_mercado_cuenta(), 'adult') <> 'kid');

-- listing_clicks, listing_clicks_mensual, listing_impresiones: SIN policy de
-- select. La empresa lee agregados por RPC, nunca filas; quién hizo clic no lo
-- ve nadie (08 §7.1).

-- Reportes: se crean por RPC (motivo tipificado, `otro` con detalle). La
-- empresa ve el motivo por RPC, NUNCA quién reportó.

-- ── 14. Niveles y puntajes ──────────────────────────────────────────────────

-- Nivel de la empresa (05 §3.3, 02 §5.6).
create or replace function brote_negocio_nivel(p_business uuid)
returns evidence_tier language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; v evidence_tier := 'e1'; v_ciclos numeric; v_conf int;
begin
  select * into b from businesses where id = p_business;
  if b.id is null or b.status <> 'approved' then return 'e0'; end if;

  if brote_verificacion_fuerte(p_business)
     and exists (select 1 from business_claims where business_id = p_business
                   and status = 'aprobada' and tier in ('e2','e3')) then
    v := 'e2';
  end if;
  if exists (select 1 from business_claims where business_id = p_business
               and status = 'aprobada' and tier = 'e3') then
    v := 'e3';
  end if;

  -- E4: tiempo y evidencia. Un parcial cuenta como medio ciclo (fase 2 §6.3).
  if v = 'e3' then
    select coalesce(sum(case status when 'logrado' then 1.0 when 'logrado_parcial' then 0.5 else 0 end), 0)
      into v_ciclos from improvement_goals where business_id = p_business;
    if v_ciclos >= 2
       and not exists (select 1 from listing_reports where business_id = p_business
                         and (estado = 'abierto' or (estado = 'confirmado' and corregir_hasta > now())))
       and b.ultima_revision > now() - interval '12 months' then
      v := 'e4';
    end if;
  end if;

  -- 3 reportes confirmados en 12 meses: un escalón menos (08 §8.1).
  select count(*) into v_conf from listing_reports
   where business_id = p_business and estado = 'confirmado' and resuelto_at > now() - interval '12 months';
  if v_conf >= 3 then
    v := case v when 'e4' then 'e3'::evidence_tier when 'e3' then 'e2'::evidence_tier else 'e1'::evidence_tier end;
  end if;
  return v;
end $fn$;

-- Recalcula niveles: afirmaciones → listados → empresa (05 §3). `null` = todo.
create or replace function brote_recalcular_tiers(p_business uuid default null)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  -- Una `certificacion_tercero` vencida no tiene a qué bajar: queda `vencida`
  -- (el historial se conserva, nada se borra — 08 §5.2).
  update business_claims set status = 'vencida', updated_at = now()
   where kind = 'certificacion_tercero' and status = 'aprobada'
     and cert_vence is not null and cert_vence < current_date
     and (p_business is null or business_id = p_business);

  update business_claims c set tier = brote_claim_nivel(c)
   where (p_business is null or c.business_id = p_business)
     and c.tier is distinct from brote_claim_nivel(c);

  update listings l set tier_efectivo = coalesce((
      select max(bc.tier) from listing_claims lc join business_claims bc on bc.id = lc.claim_id
       where lc.listing_id = l.id and bc.status = 'aprobada' and bc.tier <> 'e0'), 'e1')
   where (p_business is null or l.business_id = p_business);

  update businesses b set tier = brote_negocio_nivel(b.id)
   where (p_business is null or b.id = p_business)
     and b.tier is distinct from brote_negocio_nivel(b.id);
end $fn$;

-- Mediana del CTR de una categoría, entre los listados con ≥50 impresiones.
create or replace function brote_mercado_ctr_mediana(p_categoria text)
returns numeric language sql stable security definer set search_path = public as $fn$
  with x as (
    select l.id,
           (select count(*) from listing_impresiones i where i.listing_id = l.id and i.dia > current_date - 90) as imp,
           (select count(distinct (c.user_id, c.created_at::date)) from listing_clicks c
             where c.listing_id = l.id and c.created_at > now() - interval '90 days') as clics
    from listings l where l.status = 'publicado' and l.categoria = p_categoria
  )
  select (percentile_cont(0.5) within group (order by clics::numeric / imp))::numeric from x where imp >= 50;
$fn$;

-- El puntaje MATERIALIZADO de un listado (05 §4):
--   100 × (0.40·C + 0.15·A + 0.10·S + 0.10·X) − P
-- El 0.25·F es por persona y se suma en vivo en el servidor de Next.
-- Espejo exacto de `lib/mercado/ranking.ts`.
--
-- El plan de la empresa NO entra en esta fórmula, nunca.
-- Si algún día se agrega un término de plan acá, el catálogo pierde lo único
-- que lo hace distinto de un directorio pago. Ver 09_MONETIZACION.md §2.1.
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
  select count(*) into v_imp from listing_impresiones where listing_id = l.id and dia > current_date - 90;
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

create or replace function brote_recalcular_scores(p_business uuid default null, p_listing uuid default null)
returns void language sql security definer set search_path = public as $fn$
  update listings set score = brote_listado_score(id), score_at = now()
   where status = 'publicado'
     and (p_business is null or business_id = p_business)
     and (p_listing is null or id = p_listing);
$fn$;

-- Un cierre aprobado mueve el Progreso de Mejora, que es parte de `A`, y los
-- ciclos que sostienen E4. Redefinida desde 0106 para recalcular todo.
create or replace function brote_recalcular_mejora(p_business uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update businesses set progreso_mejora = brote_progreso_mejora(p_business) where id = p_business;
  perform brote_recalcular_tiers(p_business);
  perform brote_recalcular_scores(p_business);
end $fn$;

-- Verificar el dominio puede subir afirmaciones de E1 a E2: se recalcula en el
-- momento, no al día siguiente.
create or replace function brote_verif_recalcular()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.status is distinct from old.status then
    perform brote_recalcular_tiers(new.business_id);
    perform brote_recalcular_scores(new.business_id);
  end if;
  return new;
end $fn$;

drop trigger if exists trg_verif_recalcular on business_verifications;
create trigger trg_verif_recalcular after update of status on business_verifications
for each row execute function brote_verif_recalcular();

-- ── 15. Reportes: despublicación automática (04 §4.6) ──────────────────────

create or replace function brote_report_guard()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare n int; v_titulo text;
begin
  select titulo into v_titulo from listings where id = new.listing_id;

  -- Un reporte: aviso a la empresa y al revisor. Sigue publicado.
  perform brote_negocio_notificar(new.business_id,
    'Reportaron un listado',
    format('"%s" recibió un reporte. Tenés 7 días para responder con evidencia antes de que lo revisemos.', v_titulo),
    '/negocio/listados/' || new.listing_id);
  perform brote_negocio_notificar_revisores('Reporte nuevo en el Mercado',
    format('"%s" · %s', v_titulo, new.motivo), '/panel/reportes');

  if new.motivo = 'afirmacion_falsa' then
    select count(distinct user_id) into n from listing_reports
     where listing_id = new.listing_id and motivo = 'afirmacion_falsa'
       and estado = 'abierto' and created_at > now() - interval '30 days';
    if n >= 2 then
      update listings set status = 'despublicado', despublicado_por = 'reportes',
             observacion = 'Despublicado automáticamente: dos reportes de afirmación falsa de personas distintas. Lo revisamos y te avisamos.'
       where id = new.listing_id and status = 'publicado';
      if found then
        perform brote_negocio_notificar(new.business_id, 'Sacamos un listado del Mercado',
          format('"%s" recibió dos reportes de afirmación falsa y quedó despublicado hasta que lo revisemos.', v_titulo),
          '/negocio/listados/' || new.listing_id);
        perform brote_negocio_notificar_revisores('Despublicación automática',
          format('"%s": segundo reporte de afirmación falsa.', v_titulo), '/panel/reportes');
      end if;
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists trg_report_guard on listing_reports;
create trigger trg_report_guard after insert on listing_reports
for each row execute function brote_report_guard();

-- ── 16. Slug de un listado ──────────────────────────────────────────────────

create or replace function brote_listado_slug(p_titulo text)
returns text language plpgsql stable set search_path = public as $fn$
declare v_base text; v_out text; n int := 0;
begin
  v_base := regexp_replace(lower(unaccent_safe(p_titulo)), '[^a-z0-9]+', '-', 'g');
  v_base := trim(both '-' from left(trim(both '-' from v_base), 60));
  if v_base = '' then v_base := 'listado'; end if;
  v_out := v_base;
  while exists (select 1 from listings where slug = v_out) loop
    n := n + 1; v_out := v_base || '-' || n;
  end loop;
  return v_out;
end $fn$;

-- ── 17. RPCs del negocio ────────────────────────────────────────────────────

-- Crea o edita un listado. Solo en borrador o despublicado: para editar uno
-- publicado, primero se saca del Mercado (vuelve a pasar por revisión).
create or replace function listado_guardar(p_business uuid, p_listing uuid, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype;
  v_titulo text; v_desc text; v_cat text; v_tipo text; v_dom text[]; v_url text; v_disp text; v_zonas text[];
  v_precio numeric;
begin
  if not brote_can_write(p_business, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select * into b from businesses where id = p_business;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'negocio_no_aprobado'); end if;
  if jsonb_typeof(p_datos) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;

  if p_listing is not null then
    select * into l from listings where id = p_listing and business_id = p_business for update;
    if l.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
    if l.status not in ('draft','despublicado') then
      return jsonb_build_object('ok', false, 'error', 'no_editable');
    end if;
  end if;

  v_titulo := left(trim(coalesce(p_datos->>'titulo', l.titulo, '')), 70);
  v_desc   := left(trim(coalesce(p_datos->>'descripcion', l.descripcion, '')), 2000);
  v_cat    := coalesce(p_datos->>'categoria', l.categoria);
  v_tipo   := coalesce(p_datos->>'tipo', l.tipo::text, 'producto');
  v_url    := left(trim(coalesce(p_datos->>'url_destino', l.url_destino, '')), 500);
  v_disp   := coalesce(p_datos->>'disponibilidad', l.disponibilidad, 'online');

  if length(v_titulo) < 3 then return jsonb_build_object('ok', false, 'error', 'titulo_corto'); end if;
  if v_cat is null or not (v_cat = any(brote_mercado_categorias())) then
    return jsonb_build_object('ok', false, 'error', 'categoria_invalida');
  end if;
  if v_tipo not in ('producto','servicio') then return jsonb_build_object('ok', false, 'error', 'tipo_invalido'); end if;
  if v_disp not in ('online','local','ambas') then return jsonb_build_object('ok', false, 'error', 'disponibilidad_invalida'); end if;
  if v_url <> '' and v_url !~* '^https://[^\s/]+\.[^\s/]+' then
    return jsonb_build_object('ok', false, 'error', 'url_invalida');
  end if;

  if p_datos ? 'dominios' then
    if jsonb_typeof(p_datos->'dominios') is distinct from 'array' then
      return jsonb_build_object('ok', false, 'error', 'dominios_invalidos');
    end if;
    select coalesce(array_agg(distinct x), '{}') into v_dom from jsonb_array_elements_text(p_datos->'dominios') x;
    if cardinality(v_dom) > 3 or exists (select 1 from unnest(v_dom) d where not exists (select 1 from domains where slug = d)) then
      return jsonb_build_object('ok', false, 'error', 'dominios_invalidos');
    end if;
  else
    v_dom := coalesce(l.dominios, '{}');
  end if;

  if p_datos ? 'zonas' then
    if jsonb_typeof(p_datos->'zonas') is distinct from 'array' then
      return jsonb_build_object('ok', false, 'error', 'zonas_invalidas');
    end if;
    select coalesce(array_agg(distinct left(x, 60)), '{}') into v_zonas from jsonb_array_elements_text(p_datos->'zonas') x;
    if cardinality(v_zonas) > 24 then return jsonb_build_object('ok', false, 'error', 'zonas_invalidas'); end if;
  else
    v_zonas := coalesce(l.zonas, '{}');
  end if;

  if p_datos ? 'precio_referencia' then
    if jsonb_typeof(p_datos->'precio_referencia') = 'null' then
      v_precio := null;
    elsif jsonb_typeof(p_datos->'precio_referencia') = 'number' and (p_datos->>'precio_referencia')::numeric > 0 then
      v_precio := round((p_datos->>'precio_referencia')::numeric, 2);
    else
      return jsonb_build_object('ok', false, 'error', 'precio_invalido');
    end if;
  else
    v_precio := l.precio_referencia;
  end if;

  if l.id is null then
    insert into listings (business_id, slug, tipo, titulo, descripcion, categoria, dominios,
                          precio_referencia, url_destino, disponibilidad, zonas, created_by)
    values (p_business, brote_listado_slug(v_titulo), v_tipo::listing_kind, v_titulo, v_desc, v_cat, v_dom,
            v_precio, v_url, v_disp, v_zonas, (select auth.uid()))
    returning * into l;
  else
    update listings set tipo = v_tipo::listing_kind, titulo = v_titulo, descripcion = v_desc, categoria = v_cat,
           dominios = v_dom, precio_referencia = v_precio, url_destino = v_url,
           disponibilidad = v_disp, zonas = v_zonas, updated_at = now(),
           -- El slug se fija con el título mientras nadie lo vio publicado.
           slug = case when publicado_at is null and titulo <> v_titulo then brote_listado_slug(v_titulo) else slug end
     where id = l.id returning * into l;
  end if;
  return jsonb_build_object('ok', true, 'id', l.id, 'slug', l.slug);
end $fn$;

-- Las imágenes, en orden: la primera es la principal. Máximo 4.
create or replace function listado_imagenes(p_listing uuid, p_paths text[])
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; p text;
begin
  select * into l from listings where id = p_listing;
  if l.id is null or not brote_can_write(l.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if l.status not in ('draft','despublicado') then return jsonb_build_object('ok', false, 'error', 'no_editable'); end if;
  if cardinality(coalesce(p_paths, '{}')) > 4 then return jsonb_build_object('ok', false, 'error', 'max_imagenes'); end if;
  foreach p in array coalesce(p_paths, '{}') loop
    if p !~ ('^' || l.business_id::text || '/' || l.id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
      return jsonb_build_object('ok', false, 'error', 'ruta_invalida');
    end if;
  end loop;
  update listings set imagenes = coalesce(p_paths, '{}'), updated_at = now() where id = l.id;
  return jsonb_build_object('ok', true);
end $fn$;

-- Crea o edita una afirmación. Aprobada = inmutable: para cambiarla se carga
-- otra (el historial es el activo legal, 08 §5.2).
create or replace function claim_guardar(
  p_business uuid, p_claim uuid, p_kind claim_kind, p_alcance text, p_datos jsonb,
  p_cert_slug text, p_cert_numero text, p_cert_vence date, p_evidencia text, p_enunciado text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare c business_claims%rowtype; v_err text; v_datos jsonb;
begin
  if not brote_can_write(p_business, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  v_datos := case when jsonb_typeof(p_datos) = 'object' then p_datos else '{}'::jsonb end;
  v_err := brote_claim_error(p_business, p_kind, p_alcance, v_datos,
                             nullif(p_cert_slug, ''), nullif(trim(coalesce(p_cert_numero, '')), ''),
                             p_cert_vence, nullif(p_evidencia, ''));
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;

  if p_claim is not null then
    select * into c from business_claims where id = p_claim and business_id = p_business for update;
    if c.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
    if c.status not in ('borrador','rechazada') then
      return jsonb_build_object('ok', false, 'error', 'no_editable');
    end if;
    update business_claims set kind = p_kind, alcance = left(trim(p_alcance), 160), datos = v_datos,
           cert_slug = nullif(p_cert_slug, ''), cert_numero = left(nullif(trim(coalesce(p_cert_numero, '')), ''), 80),
           cert_vence = p_cert_vence, evidencia_path = nullif(p_evidencia, ''),
           enunciado = left(coalesce(p_enunciado, ''), 400),
           status = case when status = 'rechazada' then 'borrador'::claim_status else status end,
           updated_at = now()
     where id = c.id returning * into c;
  else
    insert into business_claims (business_id, kind, alcance, datos, cert_slug, cert_numero, cert_vence,
                                 evidencia_path, enunciado, created_by)
    values (p_business, p_kind, left(trim(p_alcance), 160), v_datos, nullif(p_cert_slug, ''),
            left(nullif(trim(coalesce(p_cert_numero, '')), ''), 80), p_cert_vence, nullif(p_evidencia, ''),
            left(coalesce(p_enunciado, ''), 400), (select auth.uid()))
    returning * into c;
  end if;
  return jsonb_build_object('ok', true, 'id', c.id);
end $fn$;

-- Qué afirmaciones lleva un listado (1 a 5). Una ya aprobada se engancha sin
-- volver a revisarse (fase 3 §5.3); el revisor ve dónde está enganchada.
create or replace function listado_claims(p_listing uuid, p_claims uuid[])
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  select * into l from listings where id = p_listing;
  if l.id is null or not brote_can_write(l.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if l.status not in ('draft','despublicado') then return jsonb_build_object('ok', false, 'error', 'no_editable'); end if;
  if cardinality(coalesce(p_claims, '{}')) > 5 then return jsonb_build_object('ok', false, 'error', 'max_afirmaciones'); end if;
  if exists (select 1 from unnest(coalesce(p_claims, '{}')) x
             where not exists (select 1 from business_claims c where c.id = x and c.business_id = l.business_id
                                 and c.status in ('borrador','pendiente','aprobada','rechazada'))) then
    return jsonb_build_object('ok', false, 'error', 'afirmacion_invalida');
  end if;
  delete from listing_claims where listing_id = l.id and not (claim_id = any(coalesce(p_claims, '{}')));
  insert into listing_claims (listing_id, claim_id)
  select l.id, x from unnest(coalesce(p_claims, '{}')) x on conflict do nothing;
  update listings set updated_at = now() where id = l.id;
  return jsonb_build_object('ok', true);
end $fn$;

-- Envía un listado. El server action ya corrió el validador determinista y el
-- screening; esto vuelve a chequear lo que la base puede chequear sola, para
-- que una llamada directa no se saltee nada.
create or replace function listado_enviar(p_listing uuid, p_validacion jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; v_bad text; n int; v_auto boolean; s jsonb;
begin
  select * into l from listings where id = p_listing for update;
  if l.id is null or not brote_can_write(l.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if l.status not in ('draft','despublicado') then return jsonb_build_object('ok', false, 'error', 'no_enviable'); end if;
  if (select status from businesses where id = l.business_id) <> 'approved' then
    return jsonb_build_object('ok', false, 'error', 'negocio_no_aprobado');
  end if;

  if length(l.titulo) not between 10 and 70 then return jsonb_build_object('ok', false, 'error', 'titulo_largo'); end if;
  if length(l.descripcion) not between 80 and 2000 then return jsonb_build_object('ok', false, 'error', 'descripcion_largo'); end if;
  if cardinality(l.imagenes) not between 1 and 4 then return jsonb_build_object('ok', false, 'error', 'faltan_imagenes'); end if;
  if l.url_destino !~* '^https://[^\s/]+\.[^\s/]+' then return jsonb_build_object('ok', false, 'error', 'url_invalida'); end if;
  v_bad := coalesce(brote_texto_prohibido(l.titulo), brote_texto_prohibido(l.descripcion));
  if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'texto_prohibido', 'termino', v_bad); end if;

  select count(*) into n from listing_claims where listing_id = l.id;
  if n = 0 then return jsonb_build_object('ok', false, 'error', 'sin_afirmaciones'); end if;
  if exists (select 1 from listing_claims lc join business_claims c on c.id = lc.claim_id
             where lc.listing_id = l.id
               and (c.status = 'vencida'
                    or brote_claim_error(c.business_id, c.kind, c.alcance, c.datos, c.cert_slug,
                                         c.cert_numero, c.cert_vence, c.evidencia_path) is not null)) then
    return jsonb_build_object('ok', false, 'error', 'afirmacion_invalida');
  end if;
  -- La lista negra también mira los campos de las afirmaciones: "cura" en el
  -- alcance es tan afirmación de salud como en la descripción.
  select brote_texto_prohibido(c.alcance || ' ' || c.datos::text) into v_bad
    from listing_claims lc join business_claims c on c.id = lc.claim_id
   where lc.listing_id = l.id and brote_texto_prohibido(c.alcance || ' ' || c.datos::text) is not null
   limit 1;
  if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'texto_prohibido', 'termino', v_bad); end if;

  -- Publicación acelerada: solo si el validador y el screener NO marcan nada.
  -- Sin IA no hay screener, y "no marcó nada" no es lo mismo que "no miró":
  -- va a la cola como cualquier otro.
  s := l.screening_ia;
  v_auto := brote_negocio_acelerado(l.business_id)
        and s is not null and s->>'por' = 'ia'
        and s->>'recomendacion' = 'publicar'
        and coalesce(s->>'riesgo_greenwashing', 'alto') = 'bajo'
        and brote_jsonb_largo(s->'banderas_texto') = 0
        and jsonb_typeof(s->'afirmaciones') = 'array'
        and not exists (select 1 from jsonb_array_elements(s->'afirmaciones') a
                        where a->>'nivel_sugerido' = 'rechazar' or brote_jsonb_largo(a->'problemas') > 0)
        and brote_jsonb_largo(p_validacion->'banderas') = 0;

  update business_claims c set status = 'pendiente', updated_at = now()
   where c.id in (select claim_id from listing_claims where listing_id = l.id)
     and c.status in ('borrador','rechazada');

  if v_auto then
    update business_claims c set status = 'aprobada', auto_aprobada = true, revisado_at = now(),
           categoria_origen = coalesce(categoria_origen, l.categoria), updated_at = now()
     where c.id in (select claim_id from listing_claims where listing_id = l.id) and c.status = 'pendiente';
    update listings set status = 'publicado', acelerada = true, auditado_at = null, observacion = null,
           despublicado_por = null, validacion = p_validacion, enviado_at = now(),
           publicado_at = coalesce(publicado_at, now()), updated_at = now()
     where id = l.id;
    perform brote_recalcular_tiers(l.business_id);
    perform brote_recalcular_scores(l.business_id, l.id);
    perform brote_negocio_notificar(l.business_id, 'Listado publicado',
      format('"%s" ya está en el Mercado.', l.titulo), '/negocio/listados/' || l.id);
    return jsonb_build_object('ok', true, 'status', 'publicado');
  end if;

  update listings set status = 'pendiente', validacion = p_validacion, enviado_at = now(),
         observacion = null, updated_at = now()
   where id = l.id;
  perform brote_negocio_notificar_revisores('Listado para revisar',
    format('"%s"', l.titulo), '/panel/listados/' || l.id);
  return jsonb_build_object('ok', true, 'status', 'pendiente');
end $fn$;

-- Retira un envío (vuelve a borrador) o saca del Mercado un publicado.
create or replace function listado_retirar(p_listing uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  select * into l from listings where id = p_listing for update;
  if l.id is null or not brote_can_write(l.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if l.status = 'pendiente' then
    update listings set status = 'draft', updated_at = now() where id = l.id;
    return jsonb_build_object('ok', true, 'status', 'draft');
  elsif l.status = 'publicado' then
    update listings set status = 'despublicado', despublicado_por = 'negocio', updated_at = now() where id = l.id;
    return jsonb_build_object('ok', true, 'status', 'despublicado');
  end if;
  return jsonb_build_object('ok', false, 'error', 'no_retirable');
end $fn$;

-- El descargo de la empresa ante un reporte (08 §8.2): 7 días, con evidencia.
create or replace function listado_descargo(p_report uuid, p_texto text, p_path text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare r listing_reports%rowtype;
begin
  select * into r from listing_reports where id = p_report for update;
  if r.id is null or not brote_can_write(r.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if r.estado <> 'abierto' then return jsonb_build_object('ok', false, 'error', 'reporte_cerrado'); end if;
  if length(trim(coalesce(p_texto, ''))) < 20 then return jsonb_build_object('ok', false, 'error', 'descargo_corto'); end if;
  if p_path is not null and p_path !~ ('^' || r.business_id::text || '/reportes/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$') then
    return jsonb_build_object('ok', false, 'error', 'ruta_invalida');
  end if;
  update listing_reports set descargo = left(trim(p_texto), 2000), descargo_path = p_path, descargo_at = now()
   where id = r.id;
  perform brote_negocio_notificar_revisores('Descargo recibido',
    'Una empresa respondió un reporte con su descargo.', '/panel/reportes');
  return jsonb_build_object('ok', true);
end $fn$;

-- Los listados del negocio, para `/negocio/listados`.
create or replace function mis_listados(p_business uuid)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select case when not brote_is_member(p_business) then null else jsonb_build_object(
    'rol', brote_biz_role(p_business),
    'negocio', (select jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                  'status', b.status, 'tier', b.tier, 'sitio_web', b.sitio_web,
                  'verificacion', brote_verificacion_fuerza(b.id))
                from businesses b where b.id = p_business),
    'listados', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'tipo', l.tipo, 'categoria', l.categoria,
        'imagen', l.imagenes[1], 'status', l.status, 'tier_efectivo', l.tier_efectivo,
        'observacion', l.observacion, 'updated_at', l.updated_at, 'publicado_at', l.publicado_at,
        'afirmaciones', (select count(*) from listing_claims where listing_id = l.id),
        'reportes_abiertos', (select count(*) from listing_reports where listing_id = l.id and estado = 'abierto'),
        'clics_30d', (select count(*) from listing_clicks where listing_id = l.id and created_at > now() - interval '30 days'))
        order by l.updated_at desc)
      from listings l where l.business_id = p_business and l.status <> 'removido'), '[]'::jsonb)) end;
$fn$;

-- Una afirmación como la ve su empresa.
create or replace function brote_claim_json(c business_claims)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'id', c.id, 'kind', c.kind, 'alcance', c.alcance, 'enunciado', c.enunciado, 'datos', c.datos,
    'cert_slug', c.cert_slug, 'cert_numero', c.cert_numero, 'cert_vence', c.cert_vence,
    'cert', (select jsonb_build_object('slug', x.slug, 'nombre', x.nombre, 'emisor', x.emisor)
             from certifications x where x.slug = c.cert_slug),
    'evidencia', c.evidencia_path is not null,
    'tier', c.tier, 'status', c.status, 'observacion', c.observacion, 'updated_at', c.updated_at,
    'listados', (select count(*) from listing_claims where claim_id = c.id));
$fn$;

-- Un listado con todo, para su empresa: el formulario y la ficha de estado.
create or replace function listado_detalle(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  select * into l from listings where id = p_listing;
  if l.id is null or not brote_is_member(l.business_id) then return null; end if;
  return jsonb_build_object(
    'rol', brote_biz_role(l.business_id),
    'verificacion', brote_verificacion_fuerza(l.business_id),
    'listado', jsonb_build_object(
      'id', l.id, 'business_id', l.business_id, 'slug', l.slug, 'tipo', l.tipo, 'titulo', l.titulo,
      'descripcion', l.descripcion, 'imagenes', to_jsonb(l.imagenes), 'categoria', l.categoria,
      'dominios', to_jsonb(l.dominios), 'precio_referencia', l.precio_referencia, 'moneda', l.moneda,
      'url_destino', l.url_destino, 'disponibilidad', l.disponibilidad, 'zonas', to_jsonb(l.zonas),
      'status', l.status, 'tier_efectivo', l.tier_efectivo, 'observacion', l.observacion,
      'acelerada', l.acelerada, 'despublicado_por', l.despublicado_por,
      'publicado_at', l.publicado_at, 'enviado_at', l.enviado_at, 'updated_at', l.updated_at,
      -- Lo que la IA sugiere a la EMPRESA: `texto_sugerido` y `problemas`.
      -- Brote no reescribe el texto comercial (08 §6); la empresa decide.
      'sugerencias', case when l.screening_ia->>'por' = 'ia' then jsonb_build_object(
          'banderas_texto', l.screening_ia->'banderas_texto',
          'afirmaciones', l.screening_ia->'afirmaciones') else null end),
    'afirmaciones', coalesce((
      select jsonb_agg(brote_claim_json(c) order by lc.created_at)
      from listing_claims lc join business_claims c on c.id = lc.claim_id
      where lc.listing_id = l.id), '[]'::jsonb),
    'reportes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'motivo', r.motivo, 'detalle', r.detalle, 'estado', r.estado,
        'descargo', r.descargo, 'descargo_at', r.descargo_at, 'descargo_vence', r.descargo_vence,
        'corregir_hasta', r.corregir_hasta, 'nota', r.nota, 'created_at', r.created_at)
        order by r.created_at desc)
      from listing_reports r where r.listing_id = l.id), '[]'::jsonb));
end $fn$;

-- Todas las afirmaciones del negocio, para reutilizarlas (fase 3 §5.3).
create or replace function mis_afirmaciones(p_business uuid)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select case when not brote_is_member(p_business) then null else coalesce((
    select jsonb_agg(brote_claim_json(c) order by c.updated_at desc)
    from business_claims c where c.business_id = p_business), '[]'::jsonb) end;
$fn$;

-- ── 18. RPCs del revisor (contraseña del panel en cada llamada) ─────────────

-- Cola: `pendientes` (FIFO) o `auditoria` (publicados por la vía acelerada,
-- sin auditar).
create or replace function admin_listados_cola(p_pass text, p_modo text default 'pendientes')
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object('ok', true,
    'contadores', jsonb_build_object(
      'pendientes', (select count(*) from listings where status = 'pendiente'),
      'auditoria', (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
      'reportes', (select count(*) from listing_reports where estado = 'abierto')),
    'items', coalesce((
      select jsonb_agg(x order by x->>'enviado_at') from (
        select jsonb_build_object(
          'id', l.id, 'titulo', l.titulo, 'categoria', l.categoria, 'imagen', l.imagenes[1],
          'enviado_at', l.enviado_at, 'publicado_at', l.publicado_at,
          'negocio', jsonb_build_object('id', b.id, 'nombre', b.nombre_comercial, 'tier', b.tier,
                                        'verificacion', brote_verificacion_fuerza(b.id)),
          'afirmaciones', (select count(*) from listing_claims where listing_id = l.id),
          'ia', case when l.screening_ia->>'por' = 'ia' then jsonb_build_object(
                  'puntaje', l.screening_ia->'puntaje', 'recomendacion', l.screening_ia->'recomendacion',
                  'riesgo', l.screening_ia->'riesgo_greenwashing') else null end) as x
        from listings l join businesses b on b.id = l.business_id
        where (p_modo = 'auditoria' and l.acelerada and l.auditado_at is null and l.status = 'publicado')
           or (p_modo <> 'auditoria' and l.status = 'pendiente')
        limit 200) q), '[]'::jsonb));
end $fn$;

-- Grupos de categorías para la alerta de halo: dentro de un grupo, una
-- afirmación puede viajar; entre grupos, el revisor tiene que mirarla.
create or replace function brote_mercado_grupo(p_categoria text)
returns text language sql immutable set search_path = public as $fn$
  select case
    when p_categoria in ('alimentos-frescos','almacen-granel','bebidas') then 'alimentos'
    when p_categoria in ('limpieza-hogar','hogar-y-deco','jardin-y-huerta') then 'hogar'
    when p_categoria in ('cuidado-personal','indumentaria') then 'personal'
    else coalesce(p_categoria, '') end;
$fn$;

-- El listado completo para revisar: como lo vería un usuario, más todo lo que
-- el revisor necesita al costado.
create or replace function admin_listado_detalle(p_pass text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  select * into l from listings where id = p_id;
  if l.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  select * into b from businesses where id = l.business_id;
  return jsonb_build_object('ok', true,
    'listado', to_jsonb(l) - 'score_at',
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial, 'rubro', b.rubro,
                'tier', b.tier, 'sitio_web', b.sitio_web, 'provincia', b.provincia, 'ciudad', b.ciudad,
                'verificacion', brote_verificacion_fuerza(b.id),
                'reportes_confirmados', (select count(*) from listing_reports where business_id = b.id and estado = 'confirmado')),
    'afirmaciones', coalesce((
      select jsonb_agg(brote_claim_json(c) || jsonb_build_object(
          'evidencia_path', c.evidencia_path,
          'cert_desconocida', c.datos->>'cert_desconocida',
          'cert_url', (select url_registro from certifications where slug = c.cert_slug),
          'cert_nota', (select nota from certifications where slug = c.cert_slug),
          -- Qué nivel tendría si se aprueba hoy (la base gana siempre).
          'nivel_si_aprueba', brote_claim_nivel(jsonb_populate_record(c, '{"status":"aprobada"}'::jsonb)),
          'auto_aprobada', c.auto_aprobada,
          'categoria_origen', c.categoria_origen,
          'alerta_halo', c.categoria_origen is not null
                         and brote_mercado_grupo(c.categoria_origen) <> brote_mercado_grupo(l.categoria),
          'enganchada_en', coalesce((
            select jsonb_agg(jsonb_build_object('id', o.id, 'titulo', o.titulo, 'categoria', o.categoria, 'status', o.status))
            from listing_claims x join listings o on o.id = x.listing_id
            where x.claim_id = c.id and o.id <> l.id), '[]'::jsonb))
        order by lc.created_at)
      from listing_claims lc join business_claims c on c.id = lc.claim_id
      where lc.listing_id = l.id), '[]'::jsonb),
    'reportes', coalesce((
      select jsonb_agg(to_jsonb(r) - 'user_id' order by r.created_at desc)
      from listing_reports r where r.listing_id = l.id), '[]'::jsonb),
    'anterior', (select id from listings where status = l.status and coalesce(enviado_at, created_at) < coalesce(l.enviado_at, l.created_at)
                  order by coalesce(enviado_at, created_at) desc limit 1),
    'siguiente', (select id from listings where status = l.status and coalesce(enviado_at, created_at) > coalesce(l.enviado_at, l.created_at)
                  order by coalesce(enviado_at, created_at) limit 1));
end $fn$;

-- Publicar · pedir cambios · rechazar. `p_claims`: [{id, decision: aprobar|rechazar, nota}].
create or replace function admin_listado_revisar(p_pass text, p_id uuid, p_accion text, p_nota text, p_claims jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; d jsonb; v_aprobadas int;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_accion not in ('publicar','cambios','rechazar') then
    return jsonb_build_object('ok', false, 'error', 'accion_invalida');
  end if;
  select * into l from listings where id = p_id for update;
  if l.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if l.status <> 'pendiente' then return jsonb_build_object('ok', false, 'error', 'no_pendiente'); end if;
  if p_accion in ('cambios','rechazar') and length(trim(coalesce(p_nota, ''))) < 5 then
    return jsonb_build_object('ok', false, 'error', 'falta_nota');
  end if;

  -- Cada afirmación, por separado. Las ya aprobadas (reutilizadas) no se tocan.
  for d in select * from jsonb_array_elements(case when jsonb_typeof(p_claims) = 'array' then p_claims else '[]' end) loop
    update business_claims c
       set status = case d->>'decision' when 'aprobar' then 'aprobada'::claim_status else 'rechazada'::claim_status end,
           observacion = nullif(left(trim(coalesce(d->>'nota', '')), 500), ''),
           revisado_por = (select auth.uid()), revisado_at = now(), auto_aprobada = false,
           categoria_origen = case when d->>'decision' = 'aprobar' then coalesce(categoria_origen, l.categoria) else categoria_origen end,
           updated_at = now()
     where c.id = (d->>'id')::uuid and c.status = 'pendiente'
       and exists (select 1 from listing_claims lc where lc.listing_id = l.id and lc.claim_id = c.id)
       and d->>'decision' in ('aprobar','rechazar');
  end loop;
  perform brote_recalcular_tiers(l.business_id);

  if p_accion = 'publicar' then
    select count(*) into v_aprobadas from listing_claims lc join business_claims c on c.id = lc.claim_id
     where lc.listing_id = l.id and c.status = 'aprobada' and c.tier <> 'e0';
    if v_aprobadas = 0 then return jsonb_build_object('ok', false, 'error', 'sin_afirmaciones_aprobadas'); end if;
    if exists (select 1 from listing_claims lc join business_claims c on c.id = lc.claim_id
               where lc.listing_id = l.id and c.status = 'pendiente') then
      return jsonb_build_object('ok', false, 'error', 'afirmaciones_sin_decidir');
    end if;
    -- Las rechazadas se desenganchan: publicado, el listado muestra solo lo aprobado.
    delete from listing_claims lc using business_claims c
     where lc.listing_id = l.id and c.id = lc.claim_id and c.status = 'rechazada';
    update listings set status = 'publicado', observacion = nullif(trim(coalesce(p_nota, '')), ''),
           publicado_at = coalesce(publicado_at, now()), revisado_por = (select auth.uid()), revisado_at = now(),
           despublicado_por = null, acelerada = false, updated_at = now()
     where id = l.id;
    update businesses set ultima_revision = now() where id = l.business_id;
    perform brote_recalcular_tiers(l.business_id);
    perform brote_recalcular_scores(l.business_id);
    perform brote_negocio_notificar(l.business_id, 'Listado publicado',
      format('"%s" ya está en el Mercado.', l.titulo), '/negocio/listados/' || l.id);
  elsif p_accion = 'cambios' then
    update listings set status = 'draft', observacion = left(trim(p_nota), 1000),
           revisado_por = (select auth.uid()), revisado_at = now(), updated_at = now()
     where id = l.id;
    perform brote_negocio_notificar(l.business_id, 'Tu listado necesita cambios',
      format('"%s": %s', l.titulo, left(trim(p_nota), 200)), '/negocio/listados/' || l.id);
  else
    update listings set status = 'rechazado', observacion = left(trim(p_nota), 1000),
           revisado_por = (select auth.uid()), revisado_at = now(), updated_at = now()
     where id = l.id;
    perform brote_negocio_notificar(l.business_id, 'No publicamos tu listado',
      format('"%s": %s', l.titulo, left(trim(p_nota), 200)), '/negocio/listados/' || l.id);
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

-- "Despublicar ahora", sin confirmación en cadena (08 §5.2, art. 57).
create or replace function admin_listado_despublicar(p_pass text, p_id uuid, p_nota text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  update listings set status = 'despublicado', despublicado_por = 'revisor',
         observacion = coalesce(nullif(left(trim(coalesce(p_nota, '')), 1000), ''), 'Despublicado por el revisor.'),
         updated_at = now()
   where id = p_id and status = 'publicado' returning * into l;
  if l.id is null then return jsonb_build_object('ok', false, 'error', 'no_publicado'); end if;
  perform brote_negocio_notificar(l.business_id, 'Sacamos un listado del Mercado',
    format('"%s": %s', l.titulo, l.observacion), '/negocio/listados/' || l.id);
  return jsonb_build_object('ok', true);
end $fn$;

-- Auditoría posterior de un publicado por la vía acelerada.
create or replace function admin_listado_auditar(p_pass text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  update listings set auditado_at = now(), revisado_por = (select auth.uid()), revisado_at = now()
   where id = p_id and acelerada and auditado_at is null;
  update business_claims set auto_aprobada = false, revisado_por = (select auth.uid()), revisado_at = now()
   where auto_aprobada and id in (select claim_id from listing_claims where listing_id = p_id);
  return jsonb_build_object('ok', found);
end $fn$;

-- Desenganchar una afirmación de un listado (fase 3 §5.3).
create or replace function admin_claim_desenganchar(p_pass text, p_listing uuid, p_claim uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_business uuid; v_titulo text;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  delete from listing_claims where listing_id = p_listing and claim_id = p_claim;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_enganchada'); end if;
  select business_id, titulo into v_business, v_titulo from listings where id = p_listing;
  perform brote_recalcular_tiers(v_business);
  perform brote_recalcular_scores(v_business);
  perform brote_negocio_notificar(v_business, 'Sacamos una afirmación de un listado',
    format('Una afirmación no corresponde a "%s" y la desenganchamos.', v_titulo), '/negocio/listados/' || p_listing);
  return jsonb_build_object('ok', true);
end $fn$;

-- Nota de corrección pública en la ficha del negocio (08 §5.2). Vacía = sacarla.
create or replace function admin_nota_correccion(p_pass text, p_business uuid, p_texto text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  update businesses set nota_correccion = nullif(left(trim(coalesce(p_texto, '')), 600), ''),
         nota_correccion_at = case when nullif(trim(coalesce(p_texto, '')), '') is null then null else now() end
   where id = p_business;
  return jsonb_build_object('ok', found);
end $fn$;

-- Agregar o corregir una certificación: una decisión, no un formulario
-- (CERTIFICACIONES, regla 5). La nota dice qué se verificó y cuándo.
create or replace function admin_certificacion_guardar(
  p_pass text, p_slug text, p_nombre text, p_emisor text, p_claims claim_kind[],
  p_tiene_numero boolean, p_vence boolean, p_url text, p_nota text, p_activo boolean)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_slug !~ '^[a-z0-9][a-z0-9-]{1,40}$' or length(trim(coalesce(p_nombre, ''))) < 2
     or length(trim(coalesce(p_nota, ''))) < 10 then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;
  insert into certifications (slug, nombre, emisor, claims, tiene_numero, vence, url_registro, nota, activo)
  values (p_slug, trim(p_nombre), trim(coalesce(p_emisor, '')), coalesce(p_claims, '{}'),
          coalesce(p_tiene_numero, true), coalesce(p_vence, true), nullif(trim(coalesce(p_url, '')), ''),
          trim(p_nota), coalesce(p_activo, true))
  on conflict (slug) do update set nombre = excluded.nombre, emisor = excluded.emisor, claims = excluded.claims,
     tiene_numero = excluded.tiene_numero, vence = excluded.vence, url_registro = excluded.url_registro,
     nota = excluded.nota, activo = excluded.activo;
  perform brote_recalcular_tiers(null);
  perform brote_recalcular_scores(null);
  return jsonb_build_object('ok', true);
end $fn$;

-- Cola de reportes.
create or replace function admin_reportes_cola(p_pass text, p_estado text default 'abierto')
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object('ok', true,
    'contadores', jsonb_build_object(
      'abierto', (select count(*) from listing_reports where estado = 'abierto'),
      'confirmado', (select count(*) from listing_reports where estado = 'confirmado'),
      'desestimado', (select count(*) from listing_reports where estado = 'desestimado')),
    'items', coalesce((
      select jsonb_agg(x order by x->>'created_at') from (
        select jsonb_build_object(
          'id', r.id, 'motivo', r.motivo, 'detalle', r.detalle, 'estado', r.estado,
          'descargo', r.descargo, 'descargo_path', r.descargo_path, 'descargo_at', r.descargo_at,
          'descargo_vence', r.descargo_vence, 'corregir_hasta', r.corregir_hasta, 'nota', r.nota,
          'created_at', r.created_at, 'resuelto_at', r.resuelto_at,
          'reportante', (select coalesce(p.display_name, p.username::text) from profiles p where p.id = r.user_id),
          'reportes_del_listado', (select count(*) from listing_reports o where o.listing_id = r.listing_id),
          'listado', jsonb_build_object('id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'status', l.status,
                                        'imagen', l.imagenes[1], 'despublicado_por', l.despublicado_por),
          'negocio', jsonb_build_object('id', b.id, 'nombre', b.nombre_comercial)) as x
        from listing_reports r join listings l on l.id = r.listing_id join businesses b on b.id = r.business_id
        where r.estado = coalesce(p_estado, 'abierto')
        limit 200) q), '[]'::jsonb));
end $fn$;

-- Confirmar o desestimar. Confirmar exige que la empresa haya podido
-- responder: descargo recibido o 7 días vencidos (08 §8.2).
create or replace function admin_reporte_resolver(p_pass text, p_id uuid, p_accion text, p_nota text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare r listing_reports%rowtype; l listings%rowtype; n int;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = '42501'; end if;
  select * into r from listing_reports where id = p_id for update;
  if r.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if r.estado <> 'abierto' then return jsonb_build_object('ok', false, 'error', 'ya_resuelto'); end if;
  if p_accion not in ('confirmar','desestimar') then return jsonb_build_object('ok', false, 'error', 'accion_invalida'); end if;
  select * into l from listings where id = r.listing_id;

  if p_accion = 'confirmar' then
    if r.descargo_at is null and now() < r.descargo_vence then
      return jsonb_build_object('ok', false, 'error', 'descargo_pendiente', 'hasta', r.descargo_vence);
    end if;
    if length(trim(coalesce(p_nota, ''))) < 5 then return jsonb_build_object('ok', false, 'error', 'falta_nota'); end if;
    update listing_reports set estado = 'confirmado', nota = left(trim(p_nota), 1000),
           corregir_hasta = now() + interval '30 days', resuelto_por = (select auth.uid()), resuelto_at = now()
     where id = r.id;
    update listings set observacion = left(trim(p_nota), 1000) where id = l.id;
    perform brote_negocio_notificar(r.business_id, 'Confirmamos un reporte',
      format('"%s": %s Tenés 30 días para corregirlo.', l.titulo, left(trim(p_nota), 200)),
      '/negocio/listados/' || l.id);
  else
    update listing_reports set estado = 'desestimado', nota = nullif(left(trim(coalesce(p_nota, '')), 1000), ''),
           resuelto_por = (select auth.uid()), resuelto_at = now()
     where id = r.id;
    -- Si lo habían bajado los reportes, ya no quedan dos abiertos y ninguno se
    -- confirmó, vuelve. Uno confirmado lo deja afuera hasta que se corrija.
    if l.status = 'despublicado' and l.despublicado_por = 'reportes' then
      select count(distinct user_id) into n from listing_reports
       where listing_id = l.id and motivo = 'afirmacion_falsa' and estado = 'abierto'
         and created_at > now() - interval '30 days';
      if n < 2 and not exists (select 1 from listing_reports where listing_id = l.id and estado = 'confirmado'
                                 and corregir_hasta > now()) then
        update listings set status = 'publicado', despublicado_por = null, observacion = null, updated_at = now()
         where id = l.id;
        perform brote_negocio_notificar(r.business_id, 'Tu listado volvió al Mercado',
          format('Revisamos los reportes de "%s" y no encontramos un problema.', l.titulo),
          '/negocio/listados/' || l.id);
      end if;
    end if;
  end if;
  perform brote_recalcular_tiers(r.business_id);
  perform brote_recalcular_scores(r.business_id);
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 19. RPCs públicas (shell autenticado) ───────────────────────────────────

-- La tarjeta del catálogo. Precio solo para adultos.
create or replace function brote_listado_tarjeta(l listings, b businesses)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'tipo', l.tipo,
    'imagen', l.imagenes[1], 'categoria', l.categoria, 'dominios', to_jsonb(l.dominios),
    'precio', case when brote_mercado_ve_precios() then l.precio_referencia else null end,
    'moneda', l.moneda, 'tier', l.tier_efectivo, 'score', l.score,
    'disponibilidad', l.disponibilidad, 'zonas', to_jsonb(l.zonas),
    'tiene_precio', l.precio_referencia is not null,
    'descripcion_largo', length(l.descripcion),
    'updated_at', l.updated_at,
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                                  'logo', b.logo_url, 'tier', b.tier,
                                  'provincia', b.provincia, 'ciudad', b.ciudad));
$fn$;

-- El catálogo, paginado por cursor (nunca offset). `p_orden`: recomendados
-- (puntaje) o nivel (nivel y después puntaje). Menores: por la cuenta.
create or replace function mercado_listados(
  p_categoria text default null,
  p_dominio   text default null,
  p_tier_min  evidence_tier default 'e1',
  p_zona      text default null,
  p_modalidad text default null,         -- online | local
  p_orden     text default 'recomendados',
  p_cursor_tier evidence_tier default null,
  p_cursor_score numeric default null,
  p_cursor_id uuid default null,
  p_limit     int default 24,
  p_negocio   uuid default null)
returns setof jsonb language sql stable security definer set search_path = public as $fn$
  select brote_listado_tarjeta(l, b)
  from listings l join businesses b on b.id = l.business_id
  where l.status = 'publicado' and b.status = 'approved'
    and brote_mercado_puede_ver(l.categoria)
    and (p_negocio is null or l.business_id = p_negocio)
    and (p_categoria is null or l.categoria = p_categoria)
    and (p_dominio is null or p_dominio = any(l.dominios))
    and l.tier_efectivo >= coalesce(p_tier_min, 'e1')
    and (p_modalidad is null
         or (p_modalidad = 'online' and l.disponibilidad in ('online','ambas'))
         or (p_modalidad = 'local' and l.disponibilidad in ('local','ambas')))
    and (p_zona is null or l.disponibilidad in ('online','ambas') or p_zona = any(l.zonas) or b.provincia = p_zona)
    and (p_cursor_id is null
         or (coalesce(p_orden, 'recomendados') <> 'nivel' and (l.score, l.id) < (p_cursor_score, p_cursor_id))
         or (p_orden = 'nivel' and (l.tier_efectivo, l.score, l.id) < (p_cursor_tier, p_cursor_score, p_cursor_id)))
  order by case when p_orden = 'nivel' then l.tier_efectivo end desc nulls last, l.score desc, l.id desc
  limit least(greatest(coalesce(p_limit, 24), 1), 48);
$fn$;

-- La ficha de un listado. Sus miembros ven también lo no publicado (vista
-- previa). Cada afirmación con SU nivel: la regla antihalo hecha interfaz.
create or replace function mercado_listado(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype; v_miembro boolean;
begin
  select * into l from listings where slug = p_slug;
  if l.id is null then return null; end if;
  v_miembro := brote_is_member(l.business_id);
  if not v_miembro and (l.status <> 'publicado' or not brote_mercado_puede_ver(l.categoria)) then return null; end if;
  select * into b from businesses where id = l.business_id;
  if not v_miembro and b.status <> 'approved' then return null; end if;

  return brote_listado_tarjeta(l, b) || jsonb_build_object(
    'descripcion', l.descripcion, 'imagenes', to_jsonb(l.imagenes), 'status', l.status,
    'vista_previa', l.status <> 'publicado',
    'dominio_destino', brote_dominio(l.url_destino),
    'publicado_at', l.publicado_at,
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                                  'logo', b.logo_url, 'tier', b.tier, 'provincia', b.provincia,
                                  'ciudad', b.ciudad, 'verificacion', brote_verificacion_fuerza(b.id),
                                  'nota_correccion', b.nota_correccion),
    'afirmaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', c.id, 'kind', c.kind, 'alcance', c.alcance, 'datos', c.datos, 'tier', c.tier,
          'cert_numero', c.cert_numero, 'cert_vence', c.cert_vence,
          'cert', (select jsonb_build_object('nombre', x.nombre, 'emisor', x.emisor)
                   from certifications x where x.slug = c.cert_slug))
        order by c.tier desc, lc.created_at)
      from listing_claims lc join business_claims c on c.id = lc.claim_id
      where lc.listing_id = l.id and c.status = 'aprobada' and c.tier <> 'e0'), '[]'::jsonb),
    'ya_reportado', exists (select 1 from listing_reports where listing_id = l.id and user_id = (select auth.uid())));
end $fn$;

-- La ficha pública de un negocio.
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
                -- Fase 4: la insignia de fundador sale de la suscripción.
                'fundador', false,
                'desde', b.created_at),
    -- Fase 4: el historial público depende del plan. Acá queda el enganche.
    'mejora', case when brote_negocio_permite(b.id, 'historial_publico') then coalesce((
        select jsonb_agg(jsonb_build_object('titulo', g.titulo, 'dominio', g.dominio, 'unidad', g.unidad,
                           'linea_base', g.linea_base, 'valor_final', g.valor_final, 'cerrado_at', g.cerrado_at)
                         order by g.cerrado_at desc)
        from improvement_goals g where g.business_id = b.id and g.es_publico and g.status = 'logrado'), '[]'::jsonb)
      else '[]'::jsonb end);
end $fn$;

-- La salida, en dos tiempos. Primero lo que el interstitial muestra, SIN la
-- URL: la dirección solo se entrega cuando el clic quedó registrado.
create or replace function mercado_salida(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype;
begin
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then return null; end if;
  select * into b from businesses where id = l.business_id and status = 'approved';
  if b.id is null then return null; end if;
  return jsonb_build_object('listado', l.titulo, 'slug', l.slug, 'dominio', brote_dominio(l.url_destino),
    'comercio', b.nombre_comercial, 'logo', b.logo_url,
    -- A partir de la 3ª vez en 30 días con el mismo comercio: toast y listo.
    'vistas_30d', (select count(*) from listing_clicks
                    where user_id = (select auth.uid()) and business_id = b.id
                      and created_at > now() - interval '30 days'));
end $fn$;

-- El clic: se registra y recién ahí se entrega la dirección.
create or replace function mercado_salir(p_listing uuid, p_origen text, p_ua_hash text default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria)
     or not exists (select 1 from businesses where id = l.business_id and status = 'approved') then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  insert into listing_clicks (listing_id, business_id, user_id, origen, ua_hash)
  values (l.id, l.business_id, (select auth.uid()),
          case when p_origen in ('catalogo','accion','perfil_negocio','busqueda','ficha') then p_origen else 'ficha' end,
          left(p_ua_hash, 64));
  return jsonb_build_object('ok', true, 'url', l.url_destino, 'dominio', brote_dominio(l.url_destino));
end $fn$;

-- Reportar. Un reporte por persona y listado (índice único).
create or replace function mercado_reportar(p_listing uuid, p_motivo report_reason, p_detalle text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  if (select auth.uid()) is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  if brote_is_member(l.business_id) then return jsonb_build_object('ok', false, 'error', 'propio'); end if;
  if p_motivo = 'otro' and length(trim(coalesce(p_detalle, ''))) < 10 then
    return jsonb_build_object('ok', false, 'error', 'falta_detalle');
  end if;
  begin
    insert into listing_reports (listing_id, business_id, user_id, motivo, detalle)
    values (l.id, l.business_id, (select auth.uid()), p_motivo, nullif(left(trim(coalesce(p_detalle, '')), 1000), ''));
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'ya_reportado');
  end;
  return jsonb_build_object('ok', true);
end $fn$;

-- Impresiones: una por persona, listado y día. Para el CTR de §4.4.
create or replace function mercado_vistas(p_ids uuid[])
returns void language sql security definer set search_path = public as $fn$
  insert into listing_impresiones (listing_id, user_id, dia)
  select l.id, (select auth.uid()), current_date
  from listings l
  where (select auth.uid()) is not null
    and l.id = any((coalesce(p_ids, '{}'))[1:48]) and l.status = 'publicado'
  on conflict do nothing;
$fn$;

-- ── 20. El job diario (03 §6, 01:00 AR) ─────────────────────────────────────

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

  -- 5. Retención (04 §8): clics de 180 días con agregado mensual; impresiones de 90.
  insert into listing_clicks_mensual (listing_id, business_id, mes, clics)
  select listing_id, business_id, date_trunc('month', created_at)::date, count(*)
    from listing_clicks where created_at < now() - interval '180 days'
   group by 1, 2, 3
  on conflict (listing_id, mes) do update set clics = listing_clicks_mensual.clics + excluded.clics;
  delete from listing_clicks where created_at < now() - interval '180 days';
  delete from listing_impresiones where dia < current_date - 90;

  return jsonb_build_object('avisos_vence', v_avisos, 'objetivos_en_riesgo', v_riesgo,
                            'objetivos_vencidos', v_vencidos, 'despublicados', v_despub);
end $fn$;

select cron.unschedule('brote-negocios-diario') where exists (select 1 from cron.job where jobname = 'brote-negocios-diario');
select cron.schedule('brote-negocios-diario', '0 4 * * *', $cron$ select brote_negocios_diario(); $cron$);

-- ── 21. `mejora_estado`: los ciclos, con el parcial como medio ───────────────
-- Para que el copy de la escalera ("Faltan N ciclos para Nivel 4") diga lo
-- mismo que `brote_negocio_nivel`: "no llegaste al número pero avanzaste,
-- cuenta como medio ciclo" (fase 2 §6.3). Idéntica a 0106 salvo esa línea.

create or replace function mejora_estado(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare d improvement_dossiers%rowtype; b businesses%rowtype;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  select * into d from improvement_dossiers where business_id = p_business;

  return jsonb_build_object(
    'negocio', jsonb_build_object(
      'id', b.id, 'nombre_comercial', b.nombre_comercial, 'rubro', b.rubro, 'tamano', b.tamano,
      'ciudad', b.ciudad, 'provincia', b.provincia, 'descripcion', b.descripcion,
      'status', b.status, 'tier', b.tier, 'progreso_mejora', b.progreso_mejora),
    'rol', brote_biz_role(p_business),
    'dossier', case when d.business_id is null then null else jsonb_build_object(
      'operacion', d.operacion, 'energia', d.energia, 'residuos', d.residuos, 'agua', d.agua,
      'insumos', d.insumos, 'logistica', d.logistica, 'ya_hecho', d.ya_hecho,
      'restricciones', d.restricciones, 'completitud', d.completitud,
      'updated_at', d.updated_at) end,
    'progreso', brote_progreso_mejora(p_business),
    -- Un parcial cuenta como medio ciclo, igual que en `brote_negocio_nivel`.
    'ciclos_cerrados', (select coalesce(sum(case status when 'logrado' then 1.0 else 0.5 end), 0)
                        from improvement_goals
                        where business_id = p_business and status in ('logrado','logrado_parcial')),
    'objetivos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'version', g.version, 'parent_id', g.parent_id, 'titulo', g.titulo,
        'porque', g.porque, 'dominio', g.dominio, 'palanca_slug', g.palanca_slug,
        'metrica', g.metrica, 'unidad', g.unidad, 'linea_base', g.linea_base,
        'origen_base', g.origen_base, 'objetivo', g.objetivo, 'valor_final', g.valor_final,
        'horizonte', g.horizonte, 'ambicion', g.ambicion, 'esfuerzo_horas_mes', g.esfuerzo_horas_mes,
        'inversion', g.inversion, 'como_medir', g.como_medir, 'pasos', g.pasos,
        'pasos_hechos', g.pasos_hechos, 'evidencia_requerida', g.evidencia_requerida,
        'si_no_llegas', g.si_no_llegas, 'confianza', g.confianza, 'metrica_tipo', g.metrica_tipo,
        'metodo_tipo', g.metodo_tipo, 'alcance', g.alcance, 'es_evento_unico', g.es_evento_unico,
        'status', g.status, 'generated_by', g.generated_by, 'observacion', g.observacion,
        'motivo_descarte', g.motivo_descarte, 'inicia_at', g.inicia_at, 'vence_at', g.vence_at,
        'cerrado_at', g.cerrado_at, 'created_at', g.created_at,
        'checkins', (select count(*) from goal_checkins c where c.goal_id = g.id),
        'evidencias', (select count(*) from goal_evidence e where e.goal_id = g.id),
        -- El último valor que la empresa informó en un check-in. Es lo único
        -- real que hay para dibujar una barra de avance: sin esto, la barra
        -- sería un número inventado.
        'ultimo_valor', (select c.valor_reportado from goal_checkins c
                         where c.goal_id = g.id and c.valor_reportado is not null
                         order by c.created_at desc limit 1))
        order by g.created_at)
      from improvement_goals g
      where g.business_id = p_business and g.reemplazado_at is null), '[]'::jsonb)
  );
end $fn$;

-- ── 22. Privilegios de funciones ────────────────────────────────────────────

revoke all on function brote_mercado_categorias()                        from public, anon;
revoke all on function brote_mercado_sensibles()                         from public, anon;
revoke all on function brote_mercado_cuenta()                            from public, anon;
revoke all on function brote_mercado_puede_ver(text)                     from public, anon;
revoke all on function brote_mercado_ve_precios()                        from public, anon;
revoke all on function brote_verificacion_fuerte(uuid)                   from public, anon, authenticated;
revoke all on function brote_verificacion_fuerza(uuid)                   from public, anon, authenticated;
revoke all on function brote_negocio_plan(uuid)                          from public, anon, authenticated;
revoke all on function brote_negocio_en_gracia(uuid)                     from public, anon, authenticated;
revoke all on function brote_negocio_permite(uuid, text)                 from public, anon, authenticated;
revoke all on function brote_negocio_acelerado(uuid)                     from public, anon, authenticated;
revoke all on function brote_claim_nivel(business_claims)                from public, anon, authenticated;
revoke all on function brote_claim_error(uuid, claim_kind, text, jsonb, text, text, date, text) from public, anon, authenticated;
revoke all on function brote_texto_prohibido(text)                       from public, anon, authenticated;
revoke all on function brote_negocio_nivel(uuid)                         from public, anon, authenticated;
revoke all on function brote_recalcular_tiers(uuid)                      from public, anon, authenticated;
revoke all on function brote_mercado_ctr_mediana(text)                   from public, anon, authenticated;
revoke all on function brote_listado_score(uuid)                         from public, anon, authenticated;
revoke all on function brote_recalcular_scores(uuid, uuid)               from public, anon, authenticated;
revoke all on function brote_recalcular_mejora(uuid)                     from public, anon, authenticated;
revoke all on function brote_verif_recalcular()                          from public, anon, authenticated;
revoke all on function brote_report_guard()                              from public, anon, authenticated;
revoke all on function brote_lclaims_guard()                             from public, anon, authenticated;
revoke all on function brote_listado_slug(text)                          from public, anon, authenticated;
revoke all on function brote_claim_json(business_claims)                 from public, anon, authenticated;
revoke all on function brote_mercado_grupo(text)                         from public, anon, authenticated;
revoke all on function brote_listado_tarjeta(listings, businesses)       from public, anon, authenticated;
revoke all on function brote_jsonb_largo(jsonb)                          from public, anon, authenticated;
revoke all on function brote_negocios_diario()                           from public, anon, authenticated;

revoke all on function listado_guardar(uuid, uuid, jsonb)                from public, anon;
revoke all on function listado_imagenes(uuid, text[])                    from public, anon;
revoke all on function claim_guardar(uuid, uuid, claim_kind, text, jsonb, text, text, date, text, text) from public, anon;
revoke all on function listado_claims(uuid, uuid[])                      from public, anon;
revoke all on function listado_enviar(uuid, jsonb)                       from public, anon;
revoke all on function listado_retirar(uuid)                             from public, anon;
revoke all on function listado_descargo(uuid, text, text)                from public, anon;
revoke all on function mis_listados(uuid)                                from public, anon;
revoke all on function listado_detalle(uuid)                             from public, anon;
revoke all on function mis_afirmaciones(uuid)                            from public, anon;
revoke all on function admin_listados_cola(text, text)                   from public, anon;
revoke all on function admin_listado_detalle(text, uuid)                 from public, anon;
revoke all on function admin_listado_revisar(text, uuid, text, text, jsonb) from public, anon;
revoke all on function admin_listado_despublicar(text, uuid, text)       from public, anon;
revoke all on function admin_listado_auditar(text, uuid)                 from public, anon;
revoke all on function admin_claim_desenganchar(text, uuid, uuid)        from public, anon;
revoke all on function admin_nota_correccion(text, uuid, text)           from public, anon;
revoke all on function admin_certificacion_guardar(text, text, text, text, claim_kind[], boolean, boolean, text, text, boolean) from public, anon;
revoke all on function admin_reportes_cola(text, text)                   from public, anon;
revoke all on function admin_reporte_resolver(text, uuid, text, text)    from public, anon;
revoke all on function mercado_listados(text, text, evidence_tier, text, text, text, evidence_tier, numeric, uuid, int, uuid) from public, anon;
revoke all on function mercado_listado(text)                             from public, anon;
revoke all on function mercado_negocio(text)                             from public, anon;
revoke all on function mercado_salida(uuid)                              from public, anon;
revoke all on function mercado_salir(uuid, text, text)                   from public, anon;
revoke all on function mercado_reportar(uuid, report_reason, text)       from public, anon;
revoke all on function mercado_vistas(uuid[])                            from public, anon;

-- Las policies las evalúan con el rol de quien consulta.
grant execute on function brote_mercado_categorias()                     to authenticated;
grant execute on function brote_mercado_sensibles()                      to authenticated;
grant execute on function brote_mercado_cuenta()                         to authenticated;
grant execute on function brote_mercado_puede_ver(text)                  to authenticated;
grant execute on function brote_mercado_ve_precios()                     to authenticated;

grant execute on function listado_guardar(uuid, uuid, jsonb)             to authenticated;
grant execute on function listado_imagenes(uuid, text[])                 to authenticated;
grant execute on function claim_guardar(uuid, uuid, claim_kind, text, jsonb, text, text, date, text, text) to authenticated;
grant execute on function listado_claims(uuid, uuid[])                   to authenticated;
grant execute on function listado_enviar(uuid, jsonb)                    to authenticated;
grant execute on function listado_retirar(uuid)                          to authenticated;
grant execute on function listado_descargo(uuid, text, text)             to authenticated;
grant execute on function mis_listados(uuid)                             to authenticated;
grant execute on function listado_detalle(uuid)                          to authenticated;
grant execute on function mis_afirmaciones(uuid)                         to authenticated;
grant execute on function admin_listados_cola(text, text)                to authenticated;
grant execute on function admin_listado_detalle(text, uuid)              to authenticated;
grant execute on function admin_listado_revisar(text, uuid, text, text, jsonb) to authenticated;
grant execute on function admin_listado_despublicar(text, uuid, text)    to authenticated;
grant execute on function admin_listado_auditar(text, uuid)              to authenticated;
grant execute on function admin_claim_desenganchar(text, uuid, uuid)     to authenticated;
grant execute on function admin_nota_correccion(text, uuid, text)        to authenticated;
grant execute on function admin_certificacion_guardar(text, text, text, text, claim_kind[], boolean, boolean, text, text, boolean) to authenticated;
grant execute on function admin_reportes_cola(text, text)                to authenticated;
grant execute on function admin_reporte_resolver(text, uuid, text, text) to authenticated;
grant execute on function mercado_listados(text, text, evidence_tier, text, text, text, evidence_tier, numeric, uuid, int, uuid) to authenticated;
grant execute on function mercado_listado(text)                          to authenticated;
grant execute on function mercado_negocio(text)                          to authenticated;
grant execute on function mercado_salida(uuid)                           to authenticated;
grant execute on function mercado_salir(uuid, text, text)                to authenticated;
grant execute on function mercado_reportar(uuid, report_reason, text)    to authenticated;
grant execute on function mercado_vistas(uuid[])                         to authenticated;

-- ── 23. Storage ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Público para leer; escriben los editores del negocio dueño del prefijo
-- (`<business_id>/<listing_id>/<uuid>.jpg`).
drop policy if exists "listados imagenes sube" on storage.objects;
create policy "listados imagenes sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and brote_storage_negocio(name, 'editor'));

drop policy if exists "listados imagenes borra" on storage.objects;
create policy "listados imagenes borra" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and brote_storage_negocio(name, 'editor'));

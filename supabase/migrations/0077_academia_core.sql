-- Brote — 0077 — La Academia: El Bosque, parte 1 (esquema, RLS, cuotas).
-- Implementa ACADEMIA/design/13-data-model.md §1–§5 y §7.
--
-- NUMERACIÓN. El pack de la Academia dice "arrancá en 0038". Ese número era el
-- correcto cuando se escribió; el repo ya va por 0076, así que esta es 0077.
-- Reusar 0038 habría pisado una migración aplicada. La regla real —numeración
-- secuencial, nunca reusada— se respeta; el número literal no.
--
-- DOS ARCHIVOS. AGENT-RULES §2 pide uno por fase y permite un segundo "si la
-- fase genuinamente lo necesita". Lo necesita: el esquema y los RPC juntos son
-- ~2.000 líneas que hay que aplicar de forma atómica por un canal remoto, y una
-- aplicación gigante que falla a la mitad es exactamente el problema que la
-- idempotencia intenta evitar. Acá va el esquema; 0078 va el motor.
--
-- LA IDEA EN UNA LÍNEA. Un `hoja` no tiene contenido: nombra conceptos. La
-- sesión se compone en el servidor a pedido, a partir de plantillas por slots,
-- y la respuesta correcta NUNCA cruza el cable antes de corregir.
--
-- NADA DESTRUCTIVO. `lessons`, `lesson_steps`, `user_lessons` y sus tres RPC
-- quedan intactos: son el camino de rollback hasta que la fase 3 los retire.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · Enums
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type ac_estado_contenido as enum ('borrador','en_revision','aprobado','retirado','propuesto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ac_tipo_ejercicio as enum (
    'microlectura','dato_vivo',
    'opcion_multiple','mito_o_dato','ordenar_secuencia','clasificar_en_cestos',
    'emparejar','estimacion_numerica','ranking_impacto','elegir_la_accion',
    'cadena_causal','detectar_greenwashing','mapa_localizar','completar_frase'
  );
exception when duplicate_object then null; end $$;

-- Calculado, nunca almacenado. Existe como tipo de retorno del RPC del árbol.
do $$ begin
  create type ac_estado_gajo as enum ('latente','disponible','en_curso','frondoso','marchito');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · Currículum. Lo escriben SOLO funciones security definer.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ninguna afirmación factual existe sin una fila acá. `contenido` es el pasaje
-- que se usa para anclar; la fase 3 lo re-verifica contra la URL viva y recién
-- ahí estampa `verificado_at`. Un null ahí significa "todavía no verificado
-- contra el original", que es la verdad.
create table if not exists ac_fuentes (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  titulo        text not null,
  organizacion  text not null,
  url           text not null,
  publicado     text,
  licencia      text,
  contenido     text,
  verificado_at timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists ac_anillos (
  n              smallint primary key,
  nombre_es      text not null,
  descripcion_es text not null,
  rubrica        text not null,
  activo         boolean not null default true
);

-- Las 13 ramas son los 13 dominios de lib/domains.ts, más el tronco. No hay una
-- decimocuarta: los dominios son identidad de producto.
create table if not exists ac_ramas (
  slug       text primary key,
  es_tronco  boolean not null default false,
  nombre_es  text not null,
  bajada_es  text not null,
  sort_order smallint not null default 0
);

create table if not exists ac_gajos (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  rama_slug  text not null references ac_ramas(slug),
  anillo     smallint not null references ac_anillos(n),
  titulo_es  text not null,
  bajada_es  text not null,
  icono      text,
  age_groups text[] not null default '{kid,teen,adult}',
  sort_order smallint not null default 0,
  status     ac_estado_contenido not null default 'aprobado',
  origen     text not null default 'semilla',
  created_at timestamptz not null default now()
);

create table if not exists ac_hojas (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  gajo_id    uuid not null references ac_gajos(id) on delete cascade,
  titulo_es  text not null,
  bajada_es  text not null,
  minutos    smallint not null default 4,
  sort_order smallint not null default 0,
  age_groups text[] not null default '{kid,teen,adult}',
  status     ac_estado_contenido not null default 'aprobado',
  created_at timestamptz not null default now()
);

-- La unidad atómica. La maestría se lleva ACÁ, no por hoja.
create table if not exists ac_conceptos (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  rama_slug       text not null references ac_ramas(slug),
  titulo_es       text not null,
  enunciado_es    text not null,
  detalle_es      text,
  fuente_id       uuid references ac_fuentes(id),
  anillo          smallint not null default 1 references ac_anillos(n),
  dificultad_base real not null default 0,
  age_groups      text[] not null default '{kid,teen,adult}',
  sensible        boolean not null default false,
  status          ac_estado_contenido not null default 'aprobado',
  created_at      timestamptz not null default now()
);

create table if not exists ac_hoja_conceptos (
  hoja_id     uuid references ac_hojas(id) on delete cascade,
  concepto_id uuid references ac_conceptos(id) on delete cascade,
  primary key (hoja_id, concepto_id)
);

-- El DAG. `fuerza >= 0.8` es compuerta real; por debajo es sugerencia (línea
-- punteada en la UI de la fase 2).
create table if not exists ac_concepto_prereq (
  concepto_id uuid references ac_conceptos(id) on delete cascade,
  requiere_id uuid references ac_conceptos(id) on delete cascade,
  fuerza      real not null default 1.0,
  primary key (concepto_id, requiere_id),
  constraint ac_prereq_no_self check (concepto_id <> requiere_id)
);

-- Creencias falsas documentadas. Combustible primario del generador de
-- distractores: un distractor nacido de una creencia real es el que la gente
-- efectivamente elige, y cuando lo elige tenés diagnóstico gratis.
create table if not exists ac_misconceptions (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  concepto_id   uuid not null references ac_conceptos(id) on delete cascade,
  creencia_es   text not null,
  correccion_es text not null,
  fuente_id     uuid references ac_fuentes(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · Generación de ítems
-- ─────────────────────────────────────────────────────────────────────────────

-- La plantilla es la parte "nada hardcodeado". `slots` guarda los ejes:
-- radicales (cambian la dificultad ⇒ otro ítem) e incidentales (la misma
-- pregunta con otra ropa ⇒ un isomorfo). El rendimiento es el PRODUCTO de los
-- ejes, no la suma.
create table if not exists ac_plantillas (
  id              uuid primary key default gen_random_uuid(),
  tipo            ac_tipo_ejercicio not null,
  titulo_interno  text not null,
  enunciado_tpl   text not null,
  slots           jsonb not null default '{}'::jsonb,
  restricciones   jsonb not null default '[]'::jsonb,
  solucion_tpl    jsonb not null default '{}'::jsonb,
  distractores    jsonb not null default '{}'::jsonb,
  age_groups      text[] not null default '{kid,teen,adult}',
  anillo_min      smallint not null default 1,
  dificultad_base real not null default 0,
  fuente_id       uuid references ac_fuentes(id),
  generator_hash  text not null,
  prompt_version  text,
  version         smallint not null default 1,
  status          ac_estado_contenido not null default 'borrador',
  created_at      timestamptz not null default now(),
  unique (tipo, generator_hash)
);

-- La Q-matrix: un ítem puede actualizar varias maestrías.
create table if not exists ac_plantilla_conceptos (
  plantilla_id uuid references ac_plantillas(id) on delete cascade,
  concepto_id  uuid references ac_conceptos(id) on delete cascade,
  peso         real not null default 1.0,
  primary key (plantilla_id, concepto_id)
);

-- Ítems materializados: el resultado del ensamblado (plantilla × valores de
-- slot). `seed` identifica la combinación, así que (plantilla_id, seed)
-- reconstruye exactamente lo que la persona vio, y `ac_entregas` guarda los dos.
--
-- `solucion` NUNCA puede ser legible por `authenticated`. Se hace cumplir con
-- RLS sin política permisiva MÁS un revoke explícito de la tabla entera. Si
-- PostgREST llega a `solucion`, toda la sección es tramposa con un solo curl.
--
-- COLUMNAS AGREGADAS AL CONTRATO, a propósito:
--   `slot_valores`  los valores de slot con los que se ensambló. Es lo que
--                   permite al compositor elegir el isomorfo que le habla a
--                   ESTA persona (su contexto, su ciudad) — el requisito de
--                   "no es la misma sección para todo el mundo" vive acá.
--   `age_groups`    heredado de la plantilla, pero estrechable por variante:
--                   un slot puede introducir un ejemplo que no es apto kid.
--   `anillo_min`    heredado, para filtrar sin joinear la plantilla.
create table if not exists ac_items (
  id              uuid primary key default gen_random_uuid(),
  plantilla_id    uuid not null references ac_plantillas(id) on delete cascade,
  seed            bigint not null,
  payload_publico jsonb not null,
  solucion        jsonb not null,
  slot_valores    jsonb not null default '{}'::jsonb,
  age_groups      text[] not null default '{kid,teen,adult}',
  anillo_min      smallint not null default 1,
  dificultad      real not null default 0,
  discriminacion  real not null default 1.0,
  veces_servido   int not null default 0,
  veces_correcto  int not null default 0,
  status          ac_estado_contenido not null default 'borrador',
  revisado_por    text,
  revisado_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (plantilla_id, seed)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · Estado del que aprende
-- ─────────────────────────────────────────────────────────────────────────────

-- Dos números por (persona, concepto), y nada más. `half_life` en días.
-- Al leer: R = 2 ^ (−días_desde_last_seen / half_life); fuerza = mastery · R.
create table if not exists ac_user_concepto (
  user_id     uuid not null references profiles(id) on delete cascade,
  concepto_id uuid not null references ac_conceptos(id) on delete cascade,
  mastery_ema real not null default 0,
  half_life   real not null default 1.0,
  vistas      int not null default 0,
  aciertos    int not null default 0,
  last_seen   timestamptz,
  primary key (user_id, concepto_id)
);

-- Elo por rama, nunca global: un solo número para "la persona" no sirve para
-- seleccionar ítems.
create table if not exists ac_user_rama (
  user_id    uuid not null references profiles(id) on delete cascade,
  rama_slug  text not null references ac_ramas(slug),
  theta      real not null default 0,
  respuestas int not null default 0,
  primary key (user_id, rama_slug)
);

create table if not exists ac_user_hoja (
  user_id      uuid not null references profiles(id) on delete cascade,
  hoja_id      uuid not null references ac_hojas(id) on delete cascade,
  mejor_score  smallint not null default 0,
  intentos     smallint not null default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, hoja_id)
);

create table if not exists ac_user_anillo (
  user_id    uuid not null references profiles(id) on delete cascade,
  anillo     smallint not null references ac_anillos(n),
  abierto_at timestamptz not null default now(),
  cerrado_at timestamptz,
  primary key (user_id, anillo)
);

-- Semillas de la Academia otorgadas por hito, para que "una sola vez, jamás dos"
-- sea una restricción de la base y no una promesa del código.
create table if not exists ac_user_premios (
  user_id    uuid not null references profiles(id) on delete cascade,
  clave      text not null,          -- 'hoja:<uuid>' | 'gajo:<uuid>:<anillo>' | 'rama:<slug>:<anillo>' | 'riego:<uuid>'
  otorgado_at timestamptz not null default now(),
  semillas   smallint not null default 0,
  primary key (user_id, clave)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · Sesión y entrega — la columna vertebral anti-trampa
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ac_sesiones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  hoja_id       uuid references ac_hojas(id),      -- null ⇒ riego
  tipo          text not null default 'hoja',
  pasos         smallint not null,
  correctas     smallint not null default 0,
  respondidas   smallint not null default 0,
  savia_gastada smallint not null default 0,
  banderas      smallint not null default 0,
  started_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '45 minutes',
  finished_at   timestamptz,
  abandonada_at timestamptz,
  constraint ac_sesiones_tipo check (tipo in ('hoja','riego'))
);

-- ESTE es el registro de respuestas del que depende toda mejora futura del
-- scheduler y de la dificultad. Se escribe completo desde el día uno porque
-- nada de eso se puede recuperar después si falta.
--
-- `perm` es la permutación aplicada, por entrega, a la colección de tokens que
-- porta la respuesta (opciones, fragmentos, fichas, columna derecha, spans…).
-- El cliente ve `t1..tn` en el orden mostrado; `perm[k]` es el índice 1-based
-- del token original que quedó en la posición k. Los ids del ítem nunca salen:
-- si salieran, quien ya vio el ítem sabría la respuesta de memoria por el id.
create table if not exists ac_entregas (
  id           uuid primary key default gen_random_uuid(),
  sesion_id    uuid not null references ac_sesiones(id) on delete cascade,
  orden        smallint not null,
  item_id      uuid references ac_items(id),
  plantilla_id uuid not null references ac_plantillas(id),
  seed         bigint not null,
  perm         smallint[] not null default '{}',
  dificultad   real not null,
  theta_previo real not null,
  issued_at    timestamptz not null default now(),
  answered_at  timestamptz,
  elegido      jsonb,
  correcto     boolean,
  parcial      real,
  latency_ms   int,
  requeue      boolean not null default false,
  unique (sesion_id, orden)
);

create table if not exists ac_uso_diario (
  user_id     uuid not null references profiles(id) on delete cascade,
  dia_local   date not null,
  hojas       smallint not null default 0,
  savia_extra smallint not null default 0,
  semillas    smallint not null default 0,
  primary key (user_id, dia_local)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · Índices
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists ac_gajos_rama_idx        on ac_gajos (rama_slug, anillo, sort_order);
create index if not exists ac_hojas_gajo_idx        on ac_hojas (gajo_id, sort_order);
create index if not exists ac_conceptos_rama_idx    on ac_conceptos (rama_slug, anillo);
create index if not exists ac_hoja_conceptos_c_idx  on ac_hoja_conceptos (concepto_id);
create index if not exists ac_prereq_requiere_idx   on ac_concepto_prereq (requiere_id);
create index if not exists ac_misconceptions_c_idx  on ac_misconceptions (concepto_id);
create index if not exists ac_pc_concepto_idx       on ac_plantilla_conceptos (concepto_id, peso desc);
create index if not exists ac_items_plantilla_idx   on ac_items (plantilla_id) where status = 'aprobado';
create index if not exists ac_items_dificultad_idx  on ac_items (dificultad) where status = 'aprobado';
create index if not exists ac_user_concepto_seen_idx on ac_user_concepto (user_id, last_seen);
create index if not exists ac_sesiones_user_idx     on ac_sesiones (user_id, started_at desc);
create index if not exists ac_entregas_pendientes_idx on ac_entregas (sesion_id) where answered_at is null;
create index if not exists ac_entregas_item_idx     on ac_entregas (item_id, issued_at desc);
create index if not exists ac_user_hoja_user_idx    on ac_user_hoja (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · Trigger: el DAG no puede tener ciclos
--
-- Un currículum cíclico deja a la gente encerrada para siempre y es muy difícil
-- de depurar después. Se rechaza en el INSERT, que es el único momento en que
-- alguien está mirando.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_prereq_sin_ciclos()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_c uuid := new.concepto_id; v_r uuid := new.requiere_id;
begin
  -- Arista nueva: C requiere R. Hay ciclo si R ya requiere (transitivamente) C.
  if exists (
    with recursive baja as (
      select v_r as id, 1 as prof
      union all
      select p.requiere_id, b.prof + 1
      from ac_concepto_prereq p join baja b on p.concepto_id = b.id
      where b.prof < 64
    )
    select 1 from baja where id = v_c
  ) then
    raise exception 'Ciclo de prerrequisitos: % ya depende de %', v_r, v_c
      using errcode = 'P0001';
  end if;
  return new;
end $fn$;

drop trigger if exists ac_prereq_sin_ciclos_trg on ac_concepto_prereq;
create trigger ac_prereq_sin_ciclos_trg
  before insert or update on ac_concepto_prereq
  for each row execute function ac_prereq_sin_ciclos();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · RLS
--
-- Contenido: solo lectura, solo `aprobado`, filtrado por edad. Sin política de
-- escritura de ningún tipo — lo escriben las funciones definer y nadie más.
-- Estado de la persona: lectura propia, sin política de escritura.
-- Plantillas, ítems y misconceptions: RLS sin ninguna política MÁS revoke de
-- la tabla. Inalcanzables por PostgREST, punto.
-- ─────────────────────────────────────────────────────────────────────────────

alter table ac_fuentes            enable row level security;
alter table ac_anillos            enable row level security;
alter table ac_ramas              enable row level security;
alter table ac_gajos              enable row level security;
alter table ac_hojas              enable row level security;
alter table ac_conceptos          enable row level security;
alter table ac_hoja_conceptos     enable row level security;
alter table ac_concepto_prereq    enable row level security;
alter table ac_misconceptions     enable row level security;
alter table ac_plantillas         enable row level security;
alter table ac_plantilla_conceptos enable row level security;
alter table ac_items              enable row level security;
alter table ac_user_concepto      enable row level security;
alter table ac_user_rama          enable row level security;
alter table ac_user_hoja          enable row level security;
alter table ac_user_anillo        enable row level security;
alter table ac_user_premios       enable row level security;
alter table ac_sesiones           enable row level security;
alter table ac_entregas           enable row level security;
alter table ac_uso_diario         enable row level security;

-- 8.a Catálogo legible
drop policy if exists ac_fuentes_read on ac_fuentes;
create policy ac_fuentes_read on ac_fuentes for select to authenticated using (true);

drop policy if exists ac_anillos_read on ac_anillos;
create policy ac_anillos_read on ac_anillos for select to authenticated using (activo);

drop policy if exists ac_ramas_read on ac_ramas;
create policy ac_ramas_read on ac_ramas for select to authenticated using (true);

drop policy if exists ac_gajos_read on ac_gajos;
create policy ac_gajos_read on ac_gajos for select to authenticated
  using (status = 'aprobado' and age_groups @> array[brote_account_type((select auth.uid()))]);

drop policy if exists ac_hojas_read on ac_hojas;
create policy ac_hojas_read on ac_hojas for select to authenticated
  using (status = 'aprobado' and age_groups @> array[brote_account_type((select auth.uid()))]);

drop policy if exists ac_conceptos_read on ac_conceptos;
create policy ac_conceptos_read on ac_conceptos for select to authenticated
  using (status = 'aprobado' and age_groups @> array[brote_account_type((select auth.uid()))]);

drop policy if exists ac_hoja_conceptos_read on ac_hoja_conceptos;
create policy ac_hoja_conceptos_read on ac_hoja_conceptos for select to authenticated using (true);

drop policy if exists ac_concepto_prereq_read on ac_concepto_prereq;
create policy ac_concepto_prereq_read on ac_concepto_prereq for select to authenticated using (true);

-- 8.b Estado propio, solo lectura
drop policy if exists ac_user_concepto_read on ac_user_concepto;
create policy ac_user_concepto_read on ac_user_concepto for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_user_rama_read on ac_user_rama;
create policy ac_user_rama_read on ac_user_rama for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_user_hoja_read on ac_user_hoja;
create policy ac_user_hoja_read on ac_user_hoja for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_user_anillo_read on ac_user_anillo;
create policy ac_user_anillo_read on ac_user_anillo for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_user_premios_read on ac_user_premios;
create policy ac_user_premios_read on ac_user_premios for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_sesiones_read on ac_sesiones;
create policy ac_sesiones_read on ac_sesiones for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_uso_diario_read on ac_uso_diario;
create policy ac_uso_diario_read on ac_uso_diario for select to authenticated
  using ((select auth.uid()) = user_id);

-- `ac_entregas` NO tiene política de lectura a propósito. La fila guarda
-- `perm`, que es exactamente el mapa que un cliente necesitaría para deducir la
-- respuesta a partir de un ítem visto antes. Se lee solo desde las funciones.

-- 8.c Las tres tablas secretas: RLS sin políticas + revoke.
-- Supabase concede EXECUTE/SELECT por defecto a anon y authenticated en todo lo
-- nuevo del esquema public, así que revocar es obligatorio y no decorativo.
revoke all on table ac_plantillas          from anon, authenticated;
revoke all on table ac_plantilla_conceptos from anon, authenticated;
revoke all on table ac_items               from anon, authenticated;
revoke all on table ac_misconceptions      from anon, authenticated;
revoke all on table ac_entregas            from anon, authenticated;

-- Y el resto: sin escritura directa jamás, ni siquiera sobre el estado propio.
revoke insert, update, delete on table
  ac_fuentes, ac_anillos, ac_ramas, ac_gajos, ac_hojas, ac_conceptos,
  ac_hoja_conceptos, ac_concepto_prereq, ac_user_concepto, ac_user_rama,
  ac_user_hoja, ac_user_anillo, ac_user_premios, ac_sesiones, ac_uso_diario
  from anon, authenticated;

revoke all on table
  ac_fuentes, ac_anillos, ac_ramas, ac_gajos, ac_hojas, ac_conceptos,
  ac_hoja_conceptos, ac_concepto_prereq, ac_user_concepto, ac_user_rama,
  ac_user_hoja, ac_user_anillo, ac_user_premios, ac_sesiones, ac_uso_diario
  from anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · Ajustes. Se leen en tiempo de ejecución: cero números mágicos en los
--     cuerpos de las funciones, y cuatro perillas sin necesidad de deploy.
-- ─────────────────────────────────────────────────────────────────────────────

insert into app_settings (key, value, description) values
  ('academia_enabled', 'true'::jsonb,
   'Sección Academia (El Bosque) activa. En false, /aprender vuelve a la pantalla anterior.'),
  ('academia_savia_libre', '5'::jsonb,
   'Hojas por día para una cuenta sin Brote+. El riego no cuenta.'),
  ('academia_semillas_dia', '15'::jsonb,
   'Tope diario de semillas provenientes de la Academia.'),
  ('academia_generacion_enabled', 'false'::jsonb,
   'Pipeline de generación de contenido con Gemini. Se enciende en la fase 3.')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · Helpers chicos, compartidos por 0078.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_setting_int(p_key text, p_default int)
returns int language sql stable security definer set search_path = public as $fn$
  select coalesce((select (value #>> '{}')::int from app_settings where key = p_key), p_default);
$fn$;

create or replace function ac_setting_bool(p_key text, p_default boolean)
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((select (value #>> '{}')::boolean from app_settings where key = p_key), p_default);
$fn$;

-- La fecha local de la persona sale SIEMPRE de profiles.timezone y nunca de un
-- argumento del cliente: si el cliente pudiera elegir el día, la cuota diaria
-- se resetea cambiando el reloj del teléfono.
create or replace function ac_dia_local(p_uid uuid)
returns date language sql stable security definer set search_path = public as $fn$
  select (now() at time zone coalesce(
            (select nullif(timezone, '') from profiles where id = p_uid),
            'America/Argentina/Buenos_Aires'))::date;
$fn$;

-- Retrievability: R = 2 ^ (−días_desde_visto / half_life). Sin visto previo, 0.
-- `stable` y no `immutable`: lee now(). Marcarla immutable la haría cacheable
-- dentro de una consulta y el planificador podría congelar el instante — que es
-- justo la variable de la que depende todo el modelo de olvido.
create or replace function ac_retrievability(p_last_seen timestamptz, p_half_life real)
returns real language sql stable security definer set search_path = public as $fn$
  select case
    when p_last_seen is null then 0::real
    else least(1.0, power(2.0, -1.0 * (extract(epoch from (now() - p_last_seen)) / 86400.0)
                                 / greatest(coalesce(p_half_life, 1.0), 0.25)))::real
  end;
$fn$;

revoke all on function ac_setting_int(text,int)      from public, anon, authenticated;
revoke all on function ac_setting_bool(text,boolean) from public, anon, authenticated;
revoke all on function ac_dia_local(uuid)            from public, anon, authenticated;
revoke all on function ac_retrievability(timestamptz,real) from public, anon, authenticated;
revoke all on function ac_prereq_sin_ciclos()        from public, anon, authenticated;

comment on table ac_entregas is
  'Registro de respuestas. Toda mejora futura del scheduler y de la dificultad se recupera de acá y de ningún otro lado: por eso se escribe completo desde el día uno.';
comment on column ac_items.solucion is
  'Solo servidor. Si PostgREST puede leer esta columna, toda la Academia es tramposa con un curl.';

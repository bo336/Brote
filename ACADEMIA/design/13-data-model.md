# 13 — Data model

> The schema contract. All tables are prefixed `ac_` (academia) so they never collide with existing ones. **RLS on every table.** Written for Postgres 17 on Supabase, project `Brote-SP` (`swdwulouasdnyorfhrjt`).

Existing objects reused, never reimplemented: `profiles`, `domains`, `activities`, `semilla_ledger`, `app_settings`, `brote_is_pro()`, `brote_grant_semillas()`, `brote_account_type()`, `brote_award_achievements()`, `daily_maintenance()`.

---

## 1. Enums

```sql
create type ac_estado_contenido as enum ('borrador','en_revision','aprobado','retirado','propuesto');
create type ac_tipo_ejercicio  as enum (
  'microlectura','dato_vivo',
  'opcion_multiple','mito_o_dato','ordenar_secuencia','clasificar_en_cestos',
  'emparejar','estimacion_numerica','ranking_impacto','elegir_la_accion',
  'cadena_causal','detectar_greenwashing','mapa_localizar','completar_frase'
);
create type ac_estado_gajo as enum ('latente','disponible','en_curso','frondoso','marchito');
```

`ac_estado_gajo` is computed, not stored — it exists as a return type for the tree RPC.

---

## 2. Curriculum tables (content — written only by `security definer` functions)

```sql
-- Sources. Nothing factual exists without one.
create table ac_fuentes (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  titulo        text not null,
  organizacion  text not null,          -- 'IUCN', 'Ministerio de Ambiente', 'Our World in Data'
  url           text not null,
  publicado     text,                   -- '2025' or '2024-06'
  licencia      text,
  contenido     text,                   -- the retrieved passage(s) used for grounding
  verificado_at timestamptz,
  created_at    timestamptz not null default now()
);

-- Growth rings.
create table ac_anillos (
  n             smallint primary key,   -- 1, 2, 3, ...
  nombre_es     text not null,          -- 'Reconocer', 'Explicar', 'Decidir', ...
  descripcion_es text not null,
  rubrica       text not null,          -- prompt fragment describing this ring's cognitive level
  activo        boolean not null default true
);

-- Branches = the 13 existing domains + the trunk. No new colour vocabulary.
create table ac_ramas (
  slug          text primary key,       -- FK-in-spirit to domains.slug; 'tronco' is the exception
  es_tronco     boolean not null default false,
  nombre_es     text not null,
  bajada_es     text not null,
  sort_order    smallint not null default 0
);

-- Sub-branches.
create table ac_gajos (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  rama_slug     text not null references ac_ramas(slug),
  anillo        smallint not null references ac_anillos(n),
  titulo_es     text not null,
  bajada_es     text not null,
  icono         text,                   -- lucide icon name, never an emoji
  age_groups    text[] not null default '{kid,teen,adult}',
  sort_order    smallint not null default 0,
  status        ac_estado_contenido not null default 'aprobado',
  origen        text not null default 'semilla',   -- 'semilla' | 'pipeline'
  created_at    timestamptz not null default now()
);

-- Leaves = lesson nodes. A hoja has NO fixed content; it names conceptos.
create table ac_hojas (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  gajo_id       uuid not null references ac_gajos(id) on delete cascade,
  titulo_es     text not null,
  bajada_es     text not null,
  minutos       smallint not null default 4,
  sort_order    smallint not null default 0,
  age_groups    text[] not null default '{kid,teen,adult}',
  status        ac_estado_contenido not null default 'aprobado',
  created_at    timestamptz not null default now()
);

-- Atomic knowledge components. Mastery is tracked HERE.
create table ac_conceptos (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,        -- 'agua.huella_virtual'
  rama_slug       text not null references ac_ramas(slug),
  titulo_es       text not null,
  enunciado_es    text not null,               -- the one-sentence thing to be learned
  detalle_es      text,
  fuente_id       uuid references ac_fuentes(id),
  anillo          smallint not null default 1 references ac_anillos(n),
  dificultad_base real not null default 0,     -- logit scale
  age_groups      text[] not null default '{kid,teen,adult}',
  sensible        boolean not null default false,  -- crueldad, muerte, catástrofe
  status          ac_estado_contenido not null default 'aprobado',
  created_at      timestamptz not null default now()
);

-- Which hoja teaches which conceptos.
create table ac_hoja_conceptos (
  hoja_id     uuid references ac_hojas(id) on delete cascade,
  concepto_id uuid references ac_conceptos(id) on delete cascade,
  primary key (hoja_id, concepto_id)
);

-- The prerequisite DAG.
create table ac_concepto_prereq (
  concepto_id uuid references ac_conceptos(id) on delete cascade,
  requiere_id uuid references ac_conceptos(id) on delete cascade,
  fuerza      real not null default 1.0,       -- >=0.8 hard gate, <0.8 suggestion
  primary key (concepto_id, requiere_id),
  check (concepto_id <> requiere_id)
);

-- Documented false beliefs. The distractor engine's primary fuel.
create table ac_misconceptions (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,            -- 'residuos.reciclar_resuelve'
  concepto_id uuid not null references ac_conceptos(id) on delete cascade,
  creencia_es text not null,                   -- the false belief, stated plainly
  correccion_es text not null,
  fuente_id   uuid references ac_fuentes(id)
);
```

A trigger on `ac_concepto_prereq` must reject cycles (recursive check on insert/update). A cyclic curriculum locks users out permanently and is very hard to debug later.

---

## 3. Item generation tables

```sql
-- The template. This is the "not hardcoded" part.
create table ac_plantillas (
  id              uuid primary key default gen_random_uuid(),
  tipo            ac_tipo_ejercicio not null,
  titulo_interno  text not null,
  enunciado_tpl   text not null,        -- 'Cuánta agua ... {{alimento}}?'
  slots           jsonb not null,       -- {"alimento":{"tipo":"enum","valores":[...],"radical":false}}
  restricciones   jsonb not null default '[]',   -- ["a < b"]
  solucion_tpl    jsonb not null,       -- how to compute the key from slot values
  distractores    jsonb not null,       -- {"estrategia":"misconception"|"perturbacion"|"vecinos", ...}
  age_groups      text[] not null default '{kid,teen,adult}',
  anillo_min      smallint not null default 1,
  dificultad_base real not null default 0,
  fuente_id       uuid references ac_fuentes(id),
  generator_hash  text not null,        -- sha256 of tpl+slots+restricciones; dedupe key
  prompt_version  text,                 -- which pipeline prompt produced it, if any
  status          ac_estado_contenido not null default 'borrador',
  created_at      timestamptz not null default now(),
  unique (tipo, generator_hash)
);

create table ac_plantilla_conceptos (       -- the Q-matrix
  plantilla_id uuid references ac_plantillas(id) on delete cascade,
  concepto_id  uuid references ac_conceptos(id) on delete cascade,
  peso         real not null default 1.0,   -- 1.0 primary, 0.3 incidental
  primary key (plantilla_id, concepto_id)
);

-- Materialised items. Only needed where the stem was LLM-written and reviewed.
-- Pure template items may live only as (plantilla_id, seed) in ac_entregas.
create table ac_items (
  id              uuid primary key default gen_random_uuid(),
  plantilla_id    uuid not null references ac_plantillas(id) on delete cascade,
  seed            bigint not null,
  payload_publico jsonb not null,       -- NO answer, ever
  solucion        jsonb not null,       -- clave + explicacion + por_opcion; server only
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
```

> **`ac_items.solucion` must never be selectable by `authenticated`.** Enforce with column-level `revoke` plus RLS that denies all direct select on `ac_items`; the only reader is a `security definer` function. If PostgREST can reach `solucion`, the entire section is cheatable in one `curl`.

---

## 4. Learner state

```sql
create table ac_user_concepto (
  user_id      uuid not null references profiles(id) on delete cascade,
  concepto_id  uuid not null references ac_conceptos(id) on delete cascade,
  mastery_ema  real not null default 0,      -- 0..1
  half_life    real not null default 1.0,    -- days
  vistas       int not null default 0,
  aciertos     int not null default 0,
  last_seen    timestamptz,
  primary key (user_id, concepto_id)
);

create table ac_user_rama (                   -- Elo ability, per branch
  user_id    uuid not null references profiles(id) on delete cascade,
  rama_slug  text not null references ac_ramas(slug),
  theta      real not null default 0,
  respuestas int not null default 0,
  primary key (user_id, rama_slug)
);

create table ac_user_hoja (
  user_id      uuid not null references profiles(id) on delete cascade,
  hoja_id      uuid not null references ac_hojas(id) on delete cascade,
  mejor_score  smallint not null default 0,
  intentos     smallint not null default 0,
  completed_at timestamptz,                   -- first clear ⇒ semillas
  updated_at   timestamptz not null default now(),
  primary key (user_id, hoja_id)
);

create table ac_user_anillo (
  user_id  uuid not null references profiles(id) on delete cascade,
  anillo   smallint not null references ac_anillos(n),
  abierto_at timestamptz not null default now(),
  cerrado_at timestamptz,
  primary key (user_id, anillo)
);
```

**Mastery update**, applied inside `academia_answer`:

```
α = 0.30
mastery_ema ← mastery_ema + α · (correcto − mastery_ema)
half_life   ← least(greatest(half_life * (correcto ? 2.2 : 0.45), 0.25), 365)
last_seen   ← now()
```

**Retrievability**, computed on read: `R = 2 ^ ( −(now − last_seen)/86400 / half_life )`, and displayed strength `fuerza = mastery_ema * R`.

**Elo update**, per answer, with a guessing floor for k-option items and a decaying K:

```
P     = 1/k + (1 − 1/k) · 1/(1 + exp(−(theta − b)))     -- k = option count, 1 for open types
K     = 1.0 / (1 + 0.05 · respuestas)
theta ← theta + K · (correcto − P)
b     ← b     + 0.6·K · (P − correcto)                  -- item difficulty drifts the other way
```

---

## 5. Session & delivery (the anti-cheat spine)

```sql
create table ac_sesiones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  hoja_id      uuid references ac_hojas(id),           -- null ⇒ riego (review) session
  tipo         text not null default 'hoja',           -- 'hoja' | 'riego'
  pasos        smallint not null,
  correctas    smallint not null default 0,
  respondidas  smallint not null default 0,
  savia_gastada smallint not null default 0,
  banderas     smallint not null default 0,            -- timing / anomaly flags
  started_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '45 minutes',
  finished_at  timestamptz
);

create table ac_entregas (
  id            uuid primary key default gen_random_uuid(),
  sesion_id     uuid not null references ac_sesiones(id) on delete cascade,
  orden         smallint not null,
  item_id       uuid references ac_items(id),
  plantilla_id  uuid not null references ac_plantillas(id),
  seed          bigint not null,
  perm          smallint[] not null default '{}',      -- server-side option shuffle map
  dificultad    real not null,
  theta_previo  real not null,
  issued_at     timestamptz not null default now(),
  answered_at   timestamptz,
  elegido       jsonb,
  correcto      boolean,
  parcial       real,
  latency_ms    int,
  unique (sesion_id, orden)
);

create index on ac_entregas (sesion_id) where answered_at is null;

create table ac_uso_diario (
  user_id     uuid not null references profiles(id) on delete cascade,
  dia_local   date not null,
  hojas       smallint not null default 0,
  savia_extra smallint not null default 0,      -- earned via actions / rewarded video
  semillas    smallint not null default 0,      -- academia-sourced, for the daily cap
  primary key (user_id, dia_local)
);
```

`ac_entregas` **is** the response log described in `10-el-bosque.md` §5. Retain it. Every scheduler and difficulty improvement in Phase 3 and beyond is recoverable from it and from nothing else. Add a retention job only when it exceeds tens of millions of rows.

---

## 6. RPCs (the entire public surface)

| Function | Args | Returns | Notes |
|---|---|---|---|
| `academia_arbol()` | — | jsonb | The whole tree for this user: ramas, gajos with computed `ac_estado_gajo`, per-gajo progress, current anillo, savia remaining, counts. One round trip — the `/aprender` screen makes exactly one call. |
| `academia_gajo(p_slug)` | text | jsonb | Hojas in a gajo with per-hoja state and the conceptos they teach with `fuerza`. |
| `academia_start_session(p_hoja_id, p_tipo)` | uuid, text | jsonb | Checks savia (unless `brote_is_pro`), consumes it, composes the session, writes `ac_sesiones` + `ac_entregas`, returns steps **without answers**. |
| `academia_answer(p_entrega_id, p_respuesta)` | uuid, jsonb | jsonb | Grades one delivery atomically and single-use. Updates mastery + Elo. Returns correctness, explanation, source, key, new `fuerza`. |
| `academia_finish_session(p_sesion_id)` | uuid | jsonb | Verifies all deliveries answered, computes score, awards XP + semillas (capped), updates `ac_user_hoja`, calls `brote_award_achievements`, keeps the streak, returns the results payload + the suggested action. |
| `academia_riego()` | — | jsonb | Starts a free review session over the most-decayed conceptos across all ramas. |
| `academia_accion_sugerida(p_hoja_id)` | uuid | jsonb | The action hook: one eligible `activities` row matched on domain + conceptos, respecting `age_groups`, `min_rank_slug`, `repeat_cooldown_hours`. Returns null rather than a bad match. |
| `academia_estado()` | — | jsonb | Savia, streak, semillas today, next reset time. Cheap; polled by the header. |
| `academia_admin_*` | p_pass text, … | jsonb | Phase 3 review queue, mirroring the existing `admin_*` password pattern. |

All are `security definer`, `set search_path = public`, revoked from `public`/`anon`, granted to `authenticated`.

---

## 7. RLS policy shape

```sql
alter table ac_conceptos enable row level security;
drop policy if exists ac_conceptos_read on ac_conceptos;
create policy ac_conceptos_read on ac_conceptos
  for select to authenticated
  using (status = 'aprobado' and age_groups @> array[brote_account_type((select auth.uid()))]);
```

- Content tables (`ac_fuentes`, `ac_ramas`, `ac_anillos`, `ac_gajos`, `ac_hojas`, `ac_conceptos`, `ac_hoja_conceptos`, `ac_concepto_prereq`): **select only**, `status = 'aprobado'`, age-filtered. No insert/update/delete policy at all.
- `ac_plantillas`, `ac_items`, `ac_misconceptions`: **no policy whatsoever** — unreachable through PostgREST. Only `security definer` functions read them.
- User tables (`ac_user_*`, `ac_sesiones`, `ac_entregas`, `ac_uso_diario`): select where `(select auth.uid()) = user_id`. **No insert or update policy** — writes only through the RPCs.

---

## 8. Migration & rollback

- Phase 1 = `0038_academia_core.sql`. Phase 2 = `0039_academia_experience.sql`. Phase 3 = `0040_academia_engine.sql`.
- The old `lessons` / `lesson_steps` / `user_lessons` tables and their three RPCs **stay untouched** through Phases 1–2. Phase 1 additionally migrates the 10 existing lessons' content into `ac_conceptos` + `ac_plantillas` (hand-mapped, ~47 steps) so nothing authored is lost.
- `app_settings` gains: `academia_enabled` (bool, default true), `academia_savia_libre` (int, 5), `academia_semillas_dia` (int, 15), `academia_generacion_enabled` (bool, false until Phase 3). Read them at runtime — no magic numbers in code.
- Rollback path: set `academia_enabled = false`; `/aprender` falls back to the legacy `learning_path()` screen, which is still on disk. Phase 3 removes the legacy path only after the new one has been live and clean.

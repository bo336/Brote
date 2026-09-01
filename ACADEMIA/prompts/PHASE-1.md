# PHASE 1 — Fundaciones

**Paste everything below the line into the coding agent as the first message. Nothing else.**

---

You are rebuilding the **Academia** section of the Brote app (route `/aprender`). The current implementation is a placeholder: 10 hand-written lessons that end, never adapt, never come back, and never connect to the action catalogue. It is being replaced entirely by a system called **El Bosque** — a living knowledge tree with growth rings, per-concept mastery with decay, and exercises generated from templates rather than written one by one.

The complete design lives in the `ACADEMIA/` folder at the repo root. **Read it before writing any code.**

## Read first, in this order — all of it, no skimming

1. `ACADEMIA/AGENT-RULES.md` — binding rules for all three phases. Read twice.
2. `ACADEMIA/design/10-el-bosque.md` — the system
3. `ACADEMIA/design/13-data-model.md` — the schema contract you are implementing
4. `ACADEMIA/design/11-exercise-types.md` — the 12 graded types + 2 presentation types
5. `ACADEMIA/design/12-economy-savia-semillas.md` — savia limits, semillas rewards
6. `ACADEMIA/design/14-generation-pipeline.md` — §8 only for this phase
7. `ACADEMIA/research/03-environmental-curriculum.md` — **this is your content source. Do not write curriculum from memory.**
8. `ACADEMIA/ACCEPTANCE.md` — Phase 1 section. You will be graded on it.

Then, for context only (do not modify): `supabase/migrations/0033_learning.sql`, `supabase/migrations/0026_plans_subscriptions.sql`, `supabase/migrations/0037_*.sql`, `scripts/gen-seed.mjs`, `lib/domains.ts`, `lib/ranks.ts`, `lib/points.ts`, `lib/supabase/*`.

## What Phase 1 is

**The engine and the content, with no new UI.** At the end of this phase the database can compose a personalised, adaptive, server-graded session and award savia-limited semillas — but `/aprender` still renders the old screen. That is intentional: Phase 2 is the UI. Do not start the UI. Do not half-build it.

## Build in this order

### 1 · Migration `supabase/migrations/0038_academia_core.sql`

Implement `ACADEMIA/design/13-data-model.md` §1–§7 exactly: enums, all curriculum tables, generation tables, learner-state tables, session/delivery tables, `ac_uso_diario`, RLS on every table, and all RPCs listed in §6 except the `academia_admin_*` family (Phase 3).

Non-negotiable details:

- Idempotent and re-runnable throughout (`if not exists`, `create or replace`, `drop policy if exists` before `create policy`).
- Every function `security definer`, `set search_path = public`, `revoke execute from public, anon`, `grant execute to authenticated`.
- **`ac_items.solucion` and `ac_plantillas` must be unreachable through PostgREST.** RLS with no permissive policy, plus explicit `revoke all on table ... from anon, authenticated`. Verify this by attempting a select as an anon key and confirming it fails. If a client can read `solucion`, the whole section is cheatable and the phase has failed.
- A trigger on `ac_concepto_prereq` that rejects cycles.
- `ac_uso_diario` quota consumed with the single atomic `on conflict … do update … where` statement from `12-economy-savia-semillas.md` §1. No read-then-write. Local date derived from `profiles.timezone`, never from a client argument.
- New `app_settings` rows: `academia_enabled` (true), `academia_savia_libre` (5), `academia_semillas_dia` (15), `academia_generacion_enabled` (false). Read them at runtime — no magic numbers in function bodies.
- **Do not touch** `lessons`, `lesson_steps`, `user_lessons`, `learning_path()`, `lesson_detail()`, `complete_lesson()`. They are the rollback path.

Apply the migration to the live project (`swdwulouasdnyorfhrjt`) **and** commit the identical file. Then run `npm run gen:types` and commit `lib/supabase/database.types.ts`.

### 2 · The session composer, inside `academia_start_session`

This is the intellectual core of the phase. Implement `10-el-bosque.md` §4 precisely:

- Target 7–12 steps. One `microlectura` opener only if the session introduces an unseen concepto.
- Mix ≈45% new conceptos / ≈30% due review (`R < 0.9`, most-forgotten first) / ≈25% weak points (mastery 0.3–0.7). Fall back gracefully when a slice is empty — a new user has no reviews, and the session must still be full.
- Difficulty targeting: Elo `theta` per `(user, rama)`, target `P* = 0.82`, rank candidates by `−|b − b*|`, take the top 8, pick one **at random among them** (randomesque exposure control). Do not always pick the single best — the pool will collapse.
- Ordering constraints, all enforced: never two consecutive items from the same plantilla; never more than two consecutive from the same concepto; open ~10 difficulty points easier than target; close on a likely-correct item.
- Personalisation from `profiles`: `interests`, `context` (`balcon`/`jardin`/`auto`/`bici`/`mascota`/`compra`), `account_type`, `city`, `neighborhood`, and `user_domain_points`. These choose the **incidental slot values** in the template, so two users get different wording for the same concepto. Implement this — it is the "not the same section for everybody" requirement and it is the whole point.
- Exclusion: never serve an item the user saw in the last 14 days, and never two siblings from the same plantilla inside one session.
- Write one `ac_entregas` row per step with `perm` (the server-side option shuffle), `dificultad`, and `theta_previo`. **Return payloads with no answers.**

### 3 · `academia_answer` and `academia_finish_session`

- `academia_answer` grades **one** delivery, atomically and single-use: `update ac_entregas set answered_at = now() … where id = $1 and answered_at is null` in the same transaction as the grade. Un-permute the option ids with `perm`. Support every one of the 12 graded types including partial credit (Kendall distance for sequences, per-item ≥80% for classification, tolerance bands for `estimacion_numerica`). Update `ac_user_concepto` mastery/half-life and `ac_user_rama` Elo with the exact formulas in `13-data-model.md` §4. Return correctness, explanation, source, key, and new `fuerza`.
- Timing: grading before 600 ms after `issued_at` increments `ac_sesiones.banderas`; three flags → the session awards XP but silently no semillas. Never surface an accusation.
- `academia_finish_session` verifies every delivery was graded, computes the score, awards XP and semillas per `12-economy-savia-semillas.md` §2 (first-clear only, daily cap enforced inside the transaction, all grants through `brote_grant_semillas(uid, n, 'academia', ref, note)`), updates `ac_user_hoja`, calls `brote_award_achievements`, keeps the daily streak alive, and returns the results payload including `academia_accion_sugerida`.
- `academia_accion_sugerida` matches a real row in `activities` on `domain_slug` + the conceptos taught, respecting `age_groups`, `min_rank_slug` and `repeat_cooldown_hours`. **Return null rather than a bad match.** Never fabricate an action.

### 4 · Seed content — `scripts/gen-academia-seed.mjs` → `supabase/seed-academia.sql`

Match the existing `scripts/gen-seed.mjs` convention (a Node script that emits SQL, committed alongside its output).

From `ACADEMIA/research/03-environmental-curriculum.md`, seed:

- **`ac_fuentes`** — every source in §4 with organisation, URL, and the grounding passage where available.
- **`ac_anillos`** — rings 1–4 with the cognitive rubrics from `10-el-bosque.md` §2.
- **`ac_ramas`** — `tronco` plus the 13 domains from `lib/domains.ts`. Use the existing slugs and colours exactly; do not invent a fourteenth.
- **`ac_gajos`** — 5 trunk gajos plus 4–6 per rama at anillo 1, and 3–4 per rama at anillo 2. `animales` gets the most, per the brief.
- **`ac_conceptos`** — **at least 450**, from §2 of the research, ordered beginner→advanced, each with `fuente_id`, `anillo`, `age_groups`, and `sensible` set correctly. The `animales` branch is the flagship: taxonomy, trophic webs, keystone species, habitat fragmentation, endemism, invasives, IUCN categories, urban fauna, pollinators, responsible pet ownership, the five freedoms, what to do with an injured animal, plus the Argentine ecoregions and emblematic species from §3.
- **`ac_concepto_prereq`** — a real DAG, not a chain. Hard edges (`fuerza ≥ 0.8`) only where genuinely required.
- **`ac_hojas`** + `ac_hoja_conceptos` — 4–8 hojas per gajo, each naming 2–4 conceptos.
- **`ac_misconceptions`** — every entry in §5 of the research (30+), with its correction and source.
- **`ac_plantillas`** — **at least 3 per exercise type**, hand-written, with real slots, real constraints and real distractor rules, covering enough conceptos that all 12 graded types can appear in a live session on day one. This is the proof that the abstraction works; if a type cannot be expressed as a template, say so in `CONTINUE.md` rather than hardcoding items.
- Enough `ac_items` (materialised or seed-derived) that a session can be composed for any anillo-1 gajo.

Every seeded fact carries a `fuente_id`. Anything you cannot source, drop.

### 5 · Migrate the existing content

Map the 10 current lessons / 47 steps in `lessons` + `lesson_steps` into `ac_conceptos` and `ac_plantillas` so nothing authored is lost. Their quiz questions become `opcion_multiple` plantillas; their true/false steps become `mito_o_dato`; their info cards become `microlectura`. Record the mapping in `CONTINUE.md`.

### 6 · Thin client layer, no screens

- `lib/api/academia.ts` — typed wrappers over every RPC, matching the existing `lib/api/aprender.ts` style.
- `lib/academia/schemas.ts` — Zod schemas for every `payload_publico` and every grading response, one per `tipo`.
- `lib/academia/types.ts` — shared types.
- **No components. No pages. No route changes.** `/aprender` still renders the legacy screen at the end of this phase.

### 7 · Verify against the live database

For a real signed-in user, inside a transaction you roll back:

- `academia_arbol()` returns the tree with correct gajo states.
- `academia_start_session()` consumes exactly 1 savia, returns 7–12 steps, and **no returned field contains the answer** — grep the JSON for the key and confirm it is absent.
- A sixth session in the same day is refused for a free user and allowed for one where `brote_is_pro` is true.
- `academia_answer()` grades correctly for all 12 types, cannot be replayed, and moves mastery and Elo in the right direction.
- `academia_finish_session()` awards semillas once, never twice, and respects the daily cap.
- Anon key cannot read `ac_items` or `ac_plantillas`.

Roll back. Leave no test rows.

## Definition of done

```
npm run typecheck   → 0 errors
npm run lint        → 0 errors
npm run build       → clean
```

Plus: the Phase 1 section of `ACADEMIA/ACCEPTANCE.md` walked line by line with an explicit pass/fail, and `CONTINUE.md` updated with what is done, the exact next task, every decision taken, and every deviation with its reason.

Do not ask me questions. Where something is genuinely ambiguous, take the option the design docs recommend, write it down under "Decisions" in `CONTINUE.md`, and keep going.

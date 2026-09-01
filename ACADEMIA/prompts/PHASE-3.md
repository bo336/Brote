# PHASE 3 — El motor infinito

**Paste everything below the line as your third and final message to the same agent. Nothing else.**

---

Phases 1 and 2 are done: the schema, composer and grader are live, and the whole Academia UI ships. What exists now is finite — a good tree with a hand-authored seed. **Phase 3 makes it infinite, adaptive and operable**, then closes the section out.

This is the last phase. Nothing is deferred past it. Anything you cannot finish must be either cut cleanly (feature-flagged off, no dead code) or completed — never left half-wired.

## Read first

1. `ACADEMIA/AGENT-RULES.md` — §2 (database), §3 (security), §4 (content integrity) govern this phase
2. `ACADEMIA/design/14-generation-pipeline.md` — the spec you are implementing, end to end
3. `ACADEMIA/design/10-el-bosque.md` §5 (mastery decay) and §8 (how it stays infinite)
4. `ACADEMIA/research/02-exercise-engine.md` — §2.4 (quality control), §4 (adaptivity), §6 (pipeline ops)
5. `ACADEMIA/ACCEPTANCE.md` — Phase 3 section
6. Your `CONTINUE.md` from Phases 1–2

Study, and extend rather than duplicate: `supabase/functions/_shared/gemini.ts`, `supabase/functions/recommend-activities/`, `supabase/functions/refresh-news/`, the `daily_maintenance()` function in `0013_daily_maintenance.sql`, and the admin console at `app/(app)/panel/` with its `admin_*` password-gated RPC pattern.

## Build in this order

### 1 · Migration `supabase/migrations/0040_academia_engine.sql`

- `ac_generacion_solicitudes` (the batch queue: idempotency key unique-indexed, `prompt_version`, `model_version`, status, raw response, cost), `ac_generacion_presupuesto` (monthly cap, spent, checked before submit), and `ac_revision_cola` (the review queue with reason codes).
- `academia_admin_cola(p_pass, …)`, `academia_admin_revisar(p_pass, p_item_id, p_accion, p_motivo)`, `academia_admin_metricas(p_pass)` — mirroring the existing `admin_*` password pattern exactly, not a new auth scheme.
- `academia_pool_hambriento()` — the pool-floor query from `14-generation-pipeline.md` §2, ordered by how many users are within two prerequisite hops.
- `academia_cribado_psicometrico()` — the nightly auto-retire pass from §5 gate 8.
- `pgvector` enabled and an `embedding vector(768)` column on `ac_items` for dedupe. Remember `<=>` is cosine **distance**; similarity is `1 - (a <=> b)`.
- Flip `app_settings.academia_generacion_enabled` handling on (the value itself stays `false` until you have verified a batch end to end).

Same rules: idempotent, RLS, `security definer`, applied **and** committed, then `npm run gen:types`.

### 2 · Edge function `supabase/functions/academia-generate/`

Implement `14-generation-pipeline.md` §3–§5 in full.

- Extend `_shared/gemini.ts` with a **batch** submit/poll pair. Do not write a second Gemini client. Batch, not interactive: the pipeline is never latency-sensitive and batch costs roughly half.
- A versioned prompt registry, one fragment per `tipo`, under `prompts/`. Every generated row stores the `prompt_version` that made it — when a batch turns out bad you must be able to say which prompt made it.
- Prompt structure exactly as specified: rol → concepto → **fuentes** → **misconceptions as the distractor source** → kNN-retrieved exemplars → task with the radicals to vary → response schema. Shallow schema; re-validate with Zod on receipt.
- The full gate chain, in order and all of it: JSON schema → Zod → deterministic checks → **grounding substring check** → embedding dedupe at 0.93 → LLM judge (separate call, different prompt) → review queue.
- The grounding check is the one that matters: every `afirmacion.cita` must be a **literal substring** of `ac_fuentes.contenido` for the cited source. Reject the whole item on any failure. Do not "fix" a failing citation — reject it.
- Retry ladder capped at 2 (schema violation → repair prompt with the validator error → full regenerate at +0.2 temperature → dead-letter with the raw response stored). Idempotency key on every request so blind retries are no-ops.
- Budget check before submit; log `tokens_in`, `tokens_out`, `cost_cents` per request. When the cap is hit, generation **stops and logs** — it never lowers a gate to keep running.
- Graceful degradation throughout: if Gemini is unavailable the app must behave exactly as it does today. The pipeline is an enhancement, never a dependency.

Deploy it. Verify one real batch end to end: submit → poll → ingest → gates → review queue. Then leave `academia_generacion_enabled` on only if that run was clean.

### 3 · Review queue in `/panel`

Extend the existing admin console. Reviewer sees the rendered item exactly as a user would, its sources, its judge scores, and its provenance. Three actions: **approve · edit · reject with a reason code**. Reason codes are the training data for the next prompt revision — store them, and surface their distribution in `academia_admin_metricas`.

Mandatory routing to human review, no exceptions: everything the judge flagged, a random 5% audit, every item touching a `sensible` concepto, **every `kid`-eligible item**, and **every `propuesto` gajo or concepto**. Never auto-approve into `kid` content.

### 4 · Anillo expansion — growing the curriculum

Per `14-generation-pipeline.md` §6. When a user closes anillo *n* and their strongest ramas are thin at *n+1*, enqueue a curriculum proposal: 3 gajos, each with 4–6 conceptos, prerequisites drawn **only from existing concepto slugs**, plus 2 plantilla sketches per concepto.

Everything lands `status = 'propuesto'` and is invisible to users until a human approves it in `/panel`. Guard rails, all enforced in SQL not in the prompt: acyclicity, an anillo ceiling (configurable, start at 6), rejection of any prerequisite naming a slug that does not exist, and **no new ramas ever** — the 13 domains are product identity, not generated content.

Also ship the user-facing side: the anillo-unlock ceremony (reuse `stores/rewards` — do not build a second overlay system), and the tree visibly gaining a ring.

### 5 · Adaptivity and decay, finished

- Wire the nightly mastery decay so `frondoso` gajos actually become `marchito`. Hook it into `daily_maintenance()` — do not add a second scheduler.
- Calibrate: check the live distribution of first-try correctness. Target median **0.78–0.86**. If it sits outside that band, adjust `P*` or the plantilla `dificultad_base` seeds and say so in `CONTINUE.md` with the before/after numbers.
- Seed each new item's difficulty from its plantilla family mean with a small residual, shrinking toward the family until it has ~100 responses. A brand-new item must never be served as if it were calibrated.
- Optional if time allows, cut cleanly if not: Thompson sampling over `(concepto, tipo)` to learn which exercise type teaches each concepto best, with decayed posteriors and pooling across users.

### 6 · Notifications, analytics, ops

- One push per day maximum, respecting `notification_prefs` and the existing `send-push` function: either "tu bosque tiene N gajos para regar" or the streak-at-risk nudge — **never both**, and never a third.
- Admin metrics: sessions/day, median first-try correctness, savia exhaustion rate, semillas granted vs cap, action-hook tap rate, pool health per `(concepto, tipo)`, generation cost this month, review queue depth and age.
- Kill switches that work without a deploy: `academia_enabled`, `academia_generacion_enabled`, `academia_savia_libre`, `academia_semillas_dia`, all in `app_settings` and all editable from `/panel`.
- Retire the legacy learning path: drop nothing, but mark `lessons`, `lesson_steps`, `user_lessons` and their three RPCs as deprecated in a comment, remove the fallback branch from the UI, and note the eventual drop as an owner action item. **Do not drop tables that hold user rows.**

### 7 · Close out

- Update `README.md` (the "What's inside" bullet describing Aprendé) and `docs/MONETIZACION.md` (savia + Brote+).
- Append the Academia entry to `BROTE_DESIGN_SYSTEM.md` `## Rollout`.
- Write `docs/ACADEMIA.md`: how the tree, the composer, the scheduler and the pipeline actually work, for the next person. Include the tuning constants and where they live.
- `CONTINUE.md`: mark the Academia complete, list every owner action item (Gemini budget, review cadence, the eventual legacy-table drop), and record every calibration number you measured.

## Definition of done

```
npm run typecheck   → 0 errors
npm run lint        → 0 errors
npm run build       → clean
```

Plus, all verified against the live database and stated explicitly:

- One real generation batch has gone submit → gates → review → approved → served in a session.
- An item with a fabricated citation is **rejected** by the grounding gate. Prove it with a deliberate test case.
- The anon key still cannot read `ac_items.solucion` or `ac_plantillas`.
- Mastery decay actually wilts a gajo overnight.
- Median first-try correctness measured and inside the band, or explained.
- The Phase 3 section of `ACADEMIA/ACCEPTANCE.md` walked line by line with explicit pass/fail.

Do not ask me questions. Take the documented default, log it, finish.

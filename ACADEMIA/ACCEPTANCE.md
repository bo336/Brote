# ACCEPTANCE — walk this literally at the end of every phase

State **pass** or **fail** for every line. A phase with any `fail` is not done. Do not mark a line pass because "it mostly works".

---

## Universal (all three phases)

- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → clean production build
- [ ] Every new migration is committed in `supabase/migrations/` **and** applied to `swdwulouasdnyorfhrjt`, and the two are byte-identical
- [ ] Every new migration is re-runnable without error
- [ ] No `drop table`, `truncate`, or destructive `update`/`delete` was run against existing data
- [ ] RLS enabled on every new table, with `(select auth.uid())` inside policies
- [ ] Every new function is `security definer`, `set search_path = public`, revoked from `public`/`anon`, granted to `authenticated`
- [ ] `npm run gen:types` run and `lib/supabase/database.types.ts` committed
- [ ] No new dependency added to `package.json`
- [ ] No file outside the scope list in `AGENT-RULES.md` §1 was modified
- [ ] `lessons` / `lesson_steps` / `user_lessons` and their three RPCs still exist and still work
- [ ] No secret appears anywhere in client code or in the repo
- [ ] Every user-facing string is rioplatense Spanish with voseo, in Pip's voice
- [ ] No forbidden term appears anywhere: *lingot*, *legendary*, *Super*, *Max*, *Duo*, any `-lingo`, any owl, hearts/lives, any competitor's league-tier names
- [ ] No emoji is used as a functional icon (emoji inside Pip's copy is fine)
- [ ] `BRAND` constants used — no hardcoded `"Brote"` or `"Pip"`
- [ ] `CONTINUE.md` updated: progress ticked, exact next task written, decisions and deviations logged

---

## Phase 1 — Fundaciones

**Schema**
- [ ] All tables from `13-data-model.md` §2–§5 exist with the specified columns and types
- [ ] `ac_concepto_prereq` rejects a cycle (test it with a deliberate cyclic insert)
- [ ] `app_settings` has `academia_enabled`, `academia_savia_libre`, `academia_semillas_dia`, `academia_generacion_enabled`, and the code reads them rather than hardcoding

**Security — the section fails without these**
- [ ] With an anon key, `select * from ac_items` fails
- [ ] With an authenticated key, `select solucion from ac_items` fails
- [ ] With an authenticated key, `select * from ac_plantillas` fails
- [ ] The JSON returned by `academia_start_session` contains **no** answer key, correct index, explanation, or source — grep it and confirm
- [ ] A delivery cannot be graded twice (second call returns an error, not a second award)
- [ ] A delivery cannot be graded after `expires_at`
- [ ] Grading under 600 ms increments `banderas`; three flags suppress semillas silently

**Composer**
- [ ] A session returns 7–12 steps
- [ ] A brand-new user with no history still gets a full session (empty review/weak slices degrade gracefully)
- [ ] Two different users with different `context`/`interests`/`city` get materially different sessions for the same hoja
- [ ] The same user opening the same hoja twice gets different items
- [ ] No two consecutive steps share a plantilla; no more than two consecutive share a concepto
- [ ] An item served in the last 14 days is not served again
- [ ] Candidate selection uses top-8-then-random, not always-the-best

**Grading and state**
- [ ] All 12 graded types grade correctly, including partial credit for `ordenar_secuencia`, `clasificar_en_cestos`, `detectar_greenwashing`, `estimacion_numerica`
- [ ] `ac_user_concepto.mastery_ema` and `half_life` move per the specified formulas
- [ ] `ac_user_rama.theta` moves per the specified Elo update, with the guessing floor applied for k-option items
- [ ] Every answer writes a complete `ac_entregas` row including `latency_ms`, `theta_previo`, `dificultad`

**Economy**
- [ ] A free user's 6th hoja of the day is refused; a `brote_is_pro` user's is not
- [ ] Savia is consumed at session **start**, not finish
- [ ] A session abandoned in <60 s with zero answers refunds the savia
- [ ] A `riego` session costs 0 savia
- [ ] A wrong answer costs 0 savia
- [ ] Semillas granted only on first clear at ≥70%, once, ever
- [ ] The 15/day academia semilla cap is enforced inside the grant transaction
- [ ] Every semilla grant goes through `brote_grant_semillas` and appears in `semilla_ledger` with `source = 'academia'`
- [ ] The local date comes from `profiles.timezone`, never from a client argument

**Content**
- [ ] ≥450 conceptos seeded, each with a `fuente_id`
- [ ] ≥30 rows in `ac_misconceptions`, each with a correction and a source
- [ ] Every source in the curriculum research §4 is present in `ac_fuentes`
- [ ] ≥3 plantillas per exercise type, all 12 graded types usable in a live session today
- [ ] `animales` is the deepest branch, with the Argentine ecoregions and emblematic species present
- [ ] Every `sensible` concepto is `{teen,adult}` only; no `kid` content uses doom framing
- [ ] The 10 legacy lessons / 47 steps are mapped into the new model, and the mapping is recorded

**Action hook**
- [ ] `academia_accion_sugerida` returns a real, eligible `activities` row
- [ ] It returns `null` rather than an ineligible or already-cooling-down action

---

## Phase 2 — La experiencia

**El Bosque**
- [ ] `/aprender` makes exactly one RPC call
- [ ] The tree is drawn SVG — not a column of circles, not WebGL
- [ ] All five gajo states render distinctly and correctly
- [ ] 60 fps scroll/zoom on a mid-range Android; under ~400 SVG nodes
- [ ] Domain colours from `lib/domains.ts`, never substituted by the brand gradient
- [ ] Exactly one brand-gradient moment on the screen
- [ ] The dark stat strip shows only real, `<CountUp>`-animated numbers
- [ ] `latente` gajos name the missing prerequisite
- [ ] Failure/empty renders `<EmptyState>` + Pip + retry, never a blank or a raw error

**Player**
- [ ] `<ProgressBar>` receives `0..1` and moves correctly through the session
- [ ] Feedback slides up over the exercise; the exercise stays visible
- [ ] The source chip appears on every graded step and opens its URL
- [ ] Wrong answers: no shake, no red flash, no failure sound
- [ ] Wrong answers re-queue once at the end of the session
- [ ] Pip appears exactly three times, no more
- [ ] Closing mid-session confirms, and refunds savia when eligible
- [ ] No answer is ever present in client state before grading

**Exercise types**
- [ ] All 12 graded types + 2 presentation types have a renderer and were played end to end against the live DB
- [ ] No drag-and-drop library was added
- [ ] Every drag type is fully operable by tap-to-select→tap-to-place
- [ ] Every exercise is fully operable by keyboard, with a Spanish live region announcing state changes
- [ ] `EstimacionNumerica` uses a real range input with Spanish `aria-valuetext`, and reveals the true value against the guess
- [ ] `MapaLocalizar` has a named-region multiple-choice alternative
- [ ] `RankingImpacto` reveals real numbers with sources after answering

**Results and economy UI**
- [ ] Results order matches `15-ui-motion.md` §3
- [ ] The action hook has primary-CTA weight and links to a real `/acciones/[slug]`
- [ ] Savia meter present for free users, replaced by a `Brote+` chip for subscribers
- [ ] The savia-empty state offers free `regar` first, an action second, Brote+ as one calm line third
- [ ] No interstitial, no second upsell surface, no ad path for `account_type = 'kid'`
- [ ] Academia activity keeps the streak alive and counts toward the weekly league, via the existing paths

**Craft**
- [ ] Hairline dividers for list-like content; `<Card>` only for genuinely distinct objects
- [ ] `<Reveal>` on sections and list items; `<CountUp>` on every real number
- [ ] `<Skeleton>` for every loading state; zero bare spinners
- [ ] Every interactive element has hover and press states; nothing snaps
- [ ] `prefers-reduced-motion` honoured on every animation
- [ ] AA contrast, visible focus rings, tap targets ≥44 px
- [ ] Usable one-handed at 375 px width
- [ ] Bottom tab bar still has exactly five tabs
- [ ] `messages/es.json` and `messages/en.json` structurally in sync
- [ ] A new entry appended to `BROTE_DESIGN_SYSTEM.md` `## Rollout`

---

## Phase 3 — El motor infinito

**Pipeline**
- [ ] One real batch completed submit → poll → ingest → gates → review → approved → served in a live session
- [ ] Generation is batch, never on the request path
- [ ] A deliberately fabricated citation is **rejected** by the grounding substring gate (demonstrate it)
- [ ] Dedupe rejects a near-duplicate at cosine similarity > 0.93
- [ ] The LLM judge runs as a separate call with a different prompt
- [ ] Idempotency key is unique-indexed; a blind re-run of a batch is a no-op
- [ ] Retry ladder caps at 2, then dead-letters with the raw response stored
- [ ] Budget cap is checked before submit and stops generation when hit
- [ ] `prompt_version` and `model_version` stored on every generated row
- [ ] With Gemini unavailable, the app behaves exactly as it did in Phase 2

**Review**
- [ ] `/panel` renders items exactly as a user would see them, with sources, judge scores and provenance
- [ ] Approve / edit / reject-with-reason-code all work; reason-code distribution is visible in metrics
- [ ] Judge-flagged, 5% audit, `sensible`, `kid`-eligible, and all `propuesto` rows are routed to a human
- [ ] Nothing auto-approves into `kid` content

**Infinity**
- [ ] Closing an anillo enqueues a curriculum proposal
- [ ] Proposals land `status = 'propuesto'` and are invisible to users
- [ ] A proposal naming a non-existent prerequisite slug is rejected in SQL
- [ ] Acyclicity and the anillo ceiling are enforced in SQL, not in the prompt
- [ ] No proposal can create a new rama
- [ ] The anillo-unlock ceremony reuses `stores/rewards`, not a second overlay system

**Adaptivity**
- [ ] Nightly decay runs inside `daily_maintenance()`; a `frondoso` gajo actually wilts
- [ ] Median first-try correctness measured against the live DB and inside 0.78–0.86, or the deviation is explained with numbers
- [ ] New items inherit their plantilla family's difficulty and shrink toward it until ~100 responses
- [ ] `academia_cribado_psicometrico()` retires (never deletes) uninformative items

**Ops**
- [ ] At most one Academia push per day, respecting `notification_prefs`
- [ ] All four kill switches work from `/panel` without a deploy
- [ ] Admin metrics cover sessions, correctness, savia exhaustion, semillas vs cap, action-hook taps, pool health, generation cost, queue depth
- [ ] Legacy learning tables are marked deprecated but **not dropped**
- [ ] `docs/ACADEMIA.md` written, with the tuning constants and where they live
- [ ] `README.md` and `docs/MONETIZACION.md` updated
- [ ] `CONTINUE.md` closes the Academia out with every owner action item listed

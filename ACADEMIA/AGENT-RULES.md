# AGENT RULES — binding for every phase

You are working inside the **Brote** repository (Next.js 14 App Router · TypeScript strict · Tailwind · Supabase · Vercel). You are rebuilding the **Academia** section (route `/aprender`, currently a placeholder). These rules apply to all three phases. Violating one is a failed phase, even if the feature "works".

---

## 0. Read before you write

Before the first line of code in every phase, read **in full**:

1. `ACADEMIA/README.md`
2. `ACADEMIA/design/10-el-bosque.md` — the system
3. `ACADEMIA/design/11-exercise-types.md` — the exercise taxonomy
4. `ACADEMIA/design/12-economy-savia-semillas.md` — limits and rewards
5. `ACADEMIA/design/13-data-model.md` — the schema contract
6. `ACADEMIA/design/14-generation-pipeline.md` — how content is produced
7. `ACADEMIA/design/15-ui-motion.md` — how it must look and move
8. `BROTE_DESIGN_SYSTEM.md` (repo root) — **binding** visual identity
9. `ACADEMIA/ACCEPTANCE.md` — the checklist you will be graded against
10. The phase prompt you were given.

Also skim, for context, without changing them: `lib/domains.ts`, `lib/ranks.ts`, `lib/points.ts`, `lib/brand.ts`, `lib/supabase/*`, `components/ui/*`, `supabase/migrations/0026_plans_subscriptions.sql`, `supabase/migrations/0033_learning.sql`.

If a design doc and this file disagree, **this file wins**. If this file and `BROTE_DESIGN_SYSTEM.md` disagree on visuals, **`BROTE_DESIGN_SYSTEM.md` wins**.

---

## 1. Scope discipline

- Touch only: `app/(app)/aprender/**`, `components/academia/**`, `lib/api/academia.ts`, `lib/academia/**`, `supabase/migrations/**` (new files only), `supabase/functions/academia-*/**`, `scripts/gen-academia-seed.mjs`, `messages/es.json`, `messages/en.json`, `components/nav/nav-items.ts`, `app/(app)/panel/**` (phase 3 only), `CONTINUE.md`, `BROTE_DESIGN_SYSTEM.md` (Rollout section only).
- **Do not** refactor unrelated screens, rename existing files, reformat files you did not otherwise change, or "improve" `Mundo`, `Acciones`, `Ranking`, `Explorar`, `Perfil`.
- **Do not** delete `lessons`, `lesson_steps`, `user_lessons`, `learning_path()`, `lesson_detail()` or `complete_lesson()` before Phase 3 explicitly retires them. They stay as a rollback path.
- **Do not** add heavy dependencies. Everything can be built with what is already in `package.json` (`framer-motion`, `@tanstack/react-query`, `zustand`, `zod`, `lucide-react`, `react-leaflet`, `recharts`). No drag-and-drop library, no state machine library, no chart library beyond `recharts`, no animation library beyond `framer-motion`. If you believe a dependency is unavoidable, do not install it — document the need in `CONTINUE.md` and implement the fallback.

## 2. Database

- Migrations continue the existing numbering: Phase 1 starts at **`0038_`**. One migration file per phase, named `0038_academia_core.sql`, `0039_academia_experience.sql`, `0040_academia_engine.sql`. Add extra numbered files only if a phase genuinely needs a second one.
- You have permission to apply migrations directly to the live Supabase project (`Brote-SP`, ref `swdwulouasdnyorfhrjt`). **You must still write the identical `.sql` file into `supabase/migrations/`.** A migration applied but not committed is a bug.
- Every migration must be **idempotent and re-runnable**: `create table if not exists`, `create or replace function`, `drop policy if exists` before `create policy`, `alter table ... add column if not exists`.
- **Never** run `drop table`, `truncate`, or a destructive `update`/`delete` against existing data. The project has real user rows.
- **RLS on every new table, no exceptions.** Read policies use `(select auth.uid()) = user_id` (the `select` wrapper is required for planner caching). Content tables (`ac_*` catalogue tables) are readable by `authenticated` when `status = 'aprobado'` and writable by **nobody** through PostgREST — only `security definer` functions write them.
- Every function: `language plpgsql|sql`, `security definer`, `set search_path = public`, then `revoke execute ... from public, anon;` + `grant execute ... to authenticated;`.
- Money/currency/points are **never** computed on the client. All awards go through server functions.
- Reuse, do not reimplement: `brote_is_pro(uuid)`, `brote_grant_semillas(uuid,int,text,text,text)`, `brote_get_rank(bigint)`, `brote_award_achievements(uuid)`, `brote_account_type(uuid)`, `brote_week_start()`, `daily_maintenance()`.
- After any schema change run `npm run gen:types` and commit `lib/supabase/database.types.ts`.

## 3. Security — the answer never reaches the client

This is the single most important engineering rule of the section.

- The payload that renders an exercise **must not contain the correct answer, the answer index, the explanation, or any field from which the answer is derivable** (including option ordering that correlates with correctness, or option arrays where the key is always longest).
- Options are shuffled **server-side, per delivery**, and identified by opaque per-delivery ids. The grading RPC receives the opaque id, not the content.
- A delivery row is created server-side, is **single-use** (`update ... where answered_at is null` in the same transaction as the grade), and expires.
- Explanations and sources are returned by the **grading** response, never by the delivery response.
- Timing: reject grading before 600 ms after issue and after the session expiry; flag, do not hard-block, unusually fast users.
- No secrets in client code, ever. `GEMINI_API_KEY` lives only in Supabase function secrets. `service_role` key never leaves server context.

## 4. Content integrity

- **Never invent a fact, a number, a species status, or a law.** Every `concepto` and every generated `item` must carry a `fuente_id` pointing at a row in `ac_fuentes`, and generated content must quote a literal substring of its source. Items that fail the substring check are rejected, not fixed by hand-waving.
- Seed content comes from `ACADEMIA/research/03-environmental-curriculum.md`. Use it. Do not paraphrase from memory.
- Age gating is mandatory: every `concepto`, `gajo` and `item` carries `age_groups text[]`, and every query filters by `brote_account_type(auth.uid())`. Topics flagged sensitive in the curriculum research (animal cruelty, species death, disaster imagery, climate doom framing) are `{teen,adult}` only, and all `kid` content uses agency-and-hope framing.
- No misinformation-by-omission: an item whose correct answer depends on a contested or outdated figure gets retired, not shipped.

## 5. Originality and IP — read this twice

The section is *inspired by* habit-forming learning apps. Mechanics are free to use; expression is not. See `ACADEMIA/research/01-duolingo-mechanics-and-ip.md`.

**Allowed** (unprotectable systems): a progression path, streaks, XP, a soft currency, a daily limiter, leagues, spaced repetition, mastery gates, mistake re-queue, difficulty targeting, prerequisite graphs.

**Forbidden**:
- Any owl, any green cartoon bird, anything resembling another app's mascot. Brote already has **Pip** — use `components/pip/Pip.tsx` and nothing else.
- The words *lingot*, *streak freeze* verbatim in English, *legendary*, *Super*, *Max*, *Duo*, any name ending in *-lingo*, or any competitor's league-tier names in their order.
- Hearts / lives / a life meter that drains on **wrong answers**. Brote's limiter is **Savia**, consumed per lesson started, never per mistake. This is both an originality and a pedagogy rule.
- Copying any competitor's copy, error strings, celebration text, sound design, colour values, button geometry, or node-path artwork.
- Scraping any third-party learning app for content.

Every user-facing string in this section must be **written fresh**, in **rioplatense Spanish with voseo** ("sumá", "elegí", "probá", "acordate"), in Brote's established Pip voice: warm, concrete, no lecturing, no eco-guilt, no doom.

## 6. Frontend rules

- `BROTE_DESIGN_SYSTEM.md` ("Bitácora Viva") is binding. In particular: one brand-gradient moment per screen; hairline dividers over boxed cards for list-like content; `<Reveal>` on sections and list items; `<CountUp>` on every real stat; skeletons, never bare spinners; every interactive element has a hover and a press state; `layoutId` springs for sliding indicators; **no emoji as a functional icon** — `lucide-react` only (emoji in Pip's copy is fine and expected).
- Reuse existing primitives: `components/ui/{button,card,progress,skeleton,reveal,count-up,chip-rail,tabs,sheet,toast,empty-state,pill,section,link-row}`. Do not re-create them.
- Mobile-first. The bottom tab bar keeps **exactly five tabs** — do not add a sixth. `/aprender` stays in `SECONDARY_NAV` plus an entry point from the home screen.
- Accessibility is not optional: every exercise must be completable with keyboard and screen reader. Drag interactions **must** have a tap-to-select / tap-to-place fallback and proper `aria` roles. Respect `prefers-reduced-motion`. AA contrast. Focus rings.
- Never hardcode `"Brote"` or `"Pip"` — use `BRAND` from `lib/brand.ts`.
- All strings that appear in the UI chrome go through `next-intl` (`messages/es.json`, with `en.json` kept structurally in sync even if the English is a rough pass). **Content** (concepts, items, explanations) lives in the database, not in message files.
- Domain colours come from `lib/domains.ts` and are identity — never substitute the brand gradient for a domain colour.

## 7. Quality gates — a phase is not done until all pass

```
npm run typecheck     # zero errors
npm run lint          # zero errors
npm run build         # clean production build
```

Plus, at the end of every phase:

- Walk the acceptance checklist in `ACADEMIA/ACCEPTANCE.md` for that phase and state pass/fail per line.
- Verify against the live DB that every new RPC returns sane data for a real signed-in user (use a transaction you roll back — never leave test rows).
- Update `CONTINUE.md`: tick what is done, write the exact next task, log every decision and every deviation with its reason.
- Do **not** claim a phase complete with a failing build, a `TODO` in a shipped code path, or a stubbed RPC.

## 8. Working style

- Do not ask questions mid-run. Where a decision is genuinely open, take the option the design docs recommend, note it under "Decisions" in `CONTINUE.md`, and keep going.
- Build in the order the phase prompt lists. Ship each step working before starting the next.
- Prefer many small, well-named files over a few large ones. One exercise renderer per file.
- Comment the *why*, not the *what*, matching the existing codebase's commenting style — the repo's comments explain trade-offs and past bugs, and yours should too.
- If you find a bug in existing code while working, do not silently fix it outside your scope. Note it in `CONTINUE.md` under "Owner action items".

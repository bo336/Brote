# CONTINUE.md — Brote build progress & resume point

> **Purpose:** This is the persistent build journal for the Brote project. If a build session hits a context/output limit, the working session MUST update this file before stopping. A fresh session reads **`BUILD_SPEC.md` + this file** and resumes with zero lost context. Keep this file accurate and terse.

---

## HOW TO USE THIS FILE (read first, every session)

1. Read `BUILD_SPEC.md` fully (it is the source of truth for *what* to build).
2. Read this file to learn *where we are*.
3. Find the first unchecked item in "Build progress" → that's your resume point.
4. Build forward in the order defined in BUILD_SPEC §18.
5. **Before you stop (limit reached or natural pause):**
   - Tick completed checkboxes below.
   - Fill in "▶ NEXT EXACT TASK" with the precise next sub-task.
   - Log anything important in "Decisions & assumptions" and "Owner action items".
   - Note any deviations from the spec and why.
6. Never delete history here — append. This file is the memory.

---

## ▶ NEXT EXACT TASK
*(The very next thing to do. Update this every session.)*

> **START HERE:** Nothing built yet. Begin at BUILD_SPEC §18 step 1 — scaffold Next.js 14 (App Router) + TypeScript (strict) + Tailwind with the design tokens from §2, create `lib/brand.ts`, set up `next-intl` (es active, en scaffolded), the authenticated app shell with the bottom tab bar, and the core `components/ui/` primitives + theme (light/dark). Get the project to a clean `npm run dev` with an on-brand empty shell before moving to Supabase wiring (step 2).

---

## BUILD PROGRESS (mirrors BUILD_SPEC §18)

- [ ] **1. Scaffold** — Next/TS/Tailwind, tokens (§2), brand.ts, i18n, app shell, bottom nav, theme, core ui/ components.
- [ ] **2. Supabase wiring** — client/server helpers, auth (Google + magic link), profiles trigger, protected routes, generated DB types.
- [ ] **3. Schema & RLS & seed** — all migrations (§4: enums, tables, indexes, views, RPCs incl. `complete_activity`), then `seed.sql` (§14: ranks, 13 domains, 153 activities, titles, badges, challenges, projects, news feeds, Pip copy).
- [ ] **4. Core loop** — Hoy + Daily Set + `complete_activity` + points/streak/rank update + reward animations; onboarding (ends on first daily action).
- [ ] **5. Ranks/points/titles/badges** — server awards + client display + rank-up overlay.
- [ ] **6. Activity Catalog** — list + detail + completion + content-based "Para Vos".
- [ ] **7. Tu Mundo (3D)** — MundoCanvas, mundo_state mapping (§9), growth on rank/streak, Pip, lazy + low-detail fallback.
- [ ] **8. Explorar** — Proyectos (CRUD/join/upvote/map/rank-gate) + Novedades (after news fn).
- [ ] **9. Ranking** — global/domain/neighborhood/friends + weekly + histórico.
- [ ] **10. Perfil** — rank ring, impact/handprint + globe, logros, stats, objetivos, ajustes.
- [ ] **11. AI Edge Functions** — verify-completion, recommend-activities, refresh-news (caching + fallbacks, §10).
- [ ] **12. Scheduled jobs** — daily-maintenance (streak/freeze, challenge rotation, weekly featured, goal rollover) + news/recs via pg_cron; vercel.json fallback (§13).
- [ ] **13. PWA** — manifest, icons, service worker/offline, prominent install button + /instalar, Web Push (§12).
- [ ] **14. Notifications** — center + push triggers wired to events/jobs.
- [ ] **15. Polish** — reduced-motion, a11y, skeletons, empty/error states (Pip voice), perf pass, responsive desktop, SEO/OG, README + setup-guide.html.
- [ ] **16. Acceptance pass** — verify every box in BUILD_SPEC §19; clean `npm run build`.

---

## SUB-TASK SCRATCHPAD
*(Optional finer-grained tracking for the current step — e.g., which of the 153 activities are seeded, which screens are done. Update freely.)*

- (none yet)

---

## DECISIONS & ASSUMPTIONS
*(Record every non-obvious choice so future sessions stay consistent. Examples: exact library versions chosen, how mundo_state is shaped, naming, any spec ambiguity resolved.)*

- Working app name is **"Brote"** (will change later) — all references go through `lib/brand.ts`.
- Locale: **es** active (Argentine voseo), **en** scaffolded only.
- Timezone for all daily logic: **America/Argentina/Buenos_Aires** (per-user tz column exists for future).
- One point system only (Puntos/XP). No spendable currency, no payments, no crypto.
- (add more as you build…)

---

## OWNER ACTION ITEMS (feed these into setup-guide.html)
*(Anything the owner must do in a dashboard / outside the code. Keep this list synced with setup-guide.html so the human is never blocked.)*

- Create Supabase project; enable Google OAuth provider; set redirect URLs.
- Create Vercel project; import the GitHub repo; add env vars.
- Get a free Google Gemini API key (Google AI Studio) and add as a Supabase function secret.
- Generate VAPID keys for Web Push (the build will provide the command/output) and add to env/secrets.
- Configure Supabase Storage buckets (verifications, projects, avatars) — the migration creates them, but confirm public/private settings.
- (add more as discovered…)

---

## DEVIATIONS FROM SPEC
*(If you had to diverge from BUILD_SPEC, log what and why here so it's intentional and traceable.)*

- (none yet)

---

## KNOWN ISSUES / TODO FOLLOW-UPS
*(Bugs, shortcuts taken, things to revisit. Don't lose these.)*

- (none yet)

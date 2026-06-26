# 🌱 Brote — *Hacé crecer tu mundo*

Brote is an installable, mobile-first **PWA** that turns everyday environmental
and animal-care action into a daily habit through a gamified, socially
competitive, AI-personalized experience. Built to run **entirely on free tiers**
(Vercel + Supabase + Google Gemini).

> The name **Brote** is a working name — it lives in [`lib/brand.ts`](lib/brand.ts)
> so renaming the whole app is a one-line change.

## ✨ What's inside

- **Two action systems** — quick **Acciones Diarias** (the Duolingo-style daily
  streak session) and the **Catálogo** of 150+ bigger actions (some AI photo-verified).
- **Tu Mundo** — a living low-poly 3D world (`@react-three/fiber`) that grows
  with your rank/streak, with the mascot **Pip**.
- **Progression** — 11 ranks × 5 divisions, titles, badges, points (one XP currency).
- **Social** — global / neighborhood / friends / per-domain leaderboards, community
  projects with a Leaflet/OSM map, news.
- **AI (server-side, cached, graceful fallbacks)** — Gemini photo verification,
  personalized recommendations, and Spanish news summaries.
- **Spanish-first** (Argentine voseo), English-ready via `next-intl`.

## 🧱 Stack

Next.js 14 (App Router, TS strict) · Tailwind · Radix · Framer Motion ·
three / react-three-fiber · TanStack Query · Zustand · next-intl · Supabase
(Postgres + Auth + Storage + Edge Functions + Realtime + pg_cron) ·
Google Gemini · @serwist/next (PWA).

## 🚀 Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values (see setup-guide.html)
npm run dev                  # http://localhost:3000
```

Useful scripts:

| script | what |
|---|---|
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run gen:types` | regenerate `lib/supabase/database.types.ts` from the live DB |
| `npm run vapid` | generate Web Push VAPID keys |
| `node scripts/gen-seed.mjs` | regenerate `supabase/seed.sql` |
| `node scripts/gen-icons.mjs` | regenerate the PWA icon set |

## 🗄️ Database

All schema lives in [`supabase/migrations/`](supabase/migrations) (enums, tables,
RLS on every table, RPCs incl. the transactional `complete_activity`, leaderboards,
storage, cron). Seed data in [`supabase/seed.sql`](supabase/seed.sql). Edge
Functions in [`supabase/functions/`](supabase/functions).

The migrations are already applied to the project and the seed is loaded. To
re-apply on a fresh project, run them in order (Supabase CLI `db push`, or paste
each into the SQL editor), then `supabase/seed.sql`.

## 📦 Deploy

1. Push to GitHub.
2. Import the repo on **Vercel**, add the env vars from `.env.example`, deploy.
3. Complete the dashboard steps in **[`setup-guide.html`](setup-guide.html)**
   (Google OAuth, Gemini key, VAPID keys, Vercel/Supabase secrets).

Everything runs on free tiers; launch on the free `*.vercel.app` subdomain.

## 📁 Structure

See [`BUILD_SPEC_1.md`](BUILD_SPEC_1.md) §16 for the full map. Highlights:
`app/(app)/` (the authenticated shell + screens), `app/(auth)/`,
`components/` (`ui/`, `mundo/`, `rewards/`, `pip/`, …), `lib/` (`brand`, `ranks`,
`points`, `mundo`, `recommendations`, `supabase/`, `api/`), `stores/` (Zustand),
`messages/` (i18n).

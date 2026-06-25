# BUILD_SPEC.md — "Brote" — Master Build Specification

> **For: Claude Code.** This document is the complete, authoritative specification for building the **Brote** application end to end. Build the entire application described here. Do not ship a reduced "v1" — every section, system, and detail below is in scope. When you reach a context/output limit, update `CONTINUE.md` (checklist + exact resume point) before stopping, then a fresh session resumes from there. Prefer complete, working, ready-to-run files over snippets. Explain root causes when you hit problems. Do not introduce paid services anywhere — every dependency and hosted service must have a usable free tier.

---

## 0. PROJECT OVERVIEW & NON-NEGOTIABLES

### 0.1 What Brote is
**Brote** ("sprout" in Spanish) is an installable mobile-first PWA that turns everyday environmental and animal-care action into a daily habit through a gamified, socially-competitive, AI-personalized experience. The emotional core is **growth**: as the user acts in the real world, a living 3D world ("Tu Mundo") and a sprout companion ("Pip") visibly grow, the user climbs an extensive rank ladder, and they compete on local and global leaderboards.

The product is built on two distinct action systems (this distinction is fundamental and appears throughout the spec):

1. **Acciones Diarias (Daily Streak Actions)** — small, quick, repeatable, honor-based micro-actions done as part of a daily routine (shorter shower, reuse shower water for plants, walk instead of drive, meatless meal, turn off tap while brushing). These are the **Duolingo-style daily session**. They are worth smaller point values (50–200), reset visually every day at 00:00, and are the **only** thing that maintains the streak. They must be genuinely easy and routine — never things like "buy secondhand clothing" or "replace bulbs with LEDs."
2. **Catálogo de Acciones (Activity Catalog)** — the large 150+ catalog of bigger, higher-impact, often one-time or weekly actions (install a rain barrel, switch to a renewable tariff, plant a native tree, organize a clean-up). Worth larger point values (300–3000), some requiring photo/AI verification, feeding the leaderboards and titles. 1–2 new activities are surfaced/added each week to keep challenges fresh. These do **not** affect the streak.

### 0.2 The product philosophy (drives every design decision)
These principles come from the research phase and override convenience when they conflict:

- **Points are informational feedback, never payment.** (Avoids the "overjustification effect" — extrinsic rewards crowding out intrinsic motivation.) There is exactly **one** point system (Puntos / XP). There is **no spendable currency, no cash value, no crypto.** Rewards are status, identity, world-growth, and titles.
- **Identity and belonging over mechanics.** The rank ladder, titles, the user's living world, and local competition matter more than raw points.
- **Local-first social proof.** Neighborhood and friend leaderboards and community projects manufacture the density that makes the game meaningful. Buenos Aires is the launch market.
- **Impact honesty.** Point values are weighted by genuine environmental impact (diet, transport, energy actions carry real weight; many "feel-good" actions are intentionally lower-impact but valuable for engagement). Never overstate impact.
- **"Handprint," not guilt.** Frame everything as positive impact the user *creates and grows*, not a footprint to feel guilty about.
- **Friendly, daily, attractive.** The app must feel warm, alive, and rewarding from the first open. It must earn a place in the user's daily routine and make them want to return and invite others.

### 0.3 Hard constraints
- **Zero cost to the owner.** Free tiers only: Vercel (hosting), Supabase (DB/auth/storage/edge/cron), Google Gemini (AI, free tier). Launch on the free `*.vercel.app` subdomain. No custom domain, no paid APIs, no Apple Developer account.
- **PWA, not native.** One codebase, installs to the home screen, push notifications, offline shell.
- **Spanish-first, English-ready.** All user-facing copy is Spanish (Argentine "vos" register where natural, e.g., "Hacé", "Sumá"). All strings live in i18n locale files so English can be added later by translating one set of files. Default and only active locale at launch: `es`. Scaffolding for `en` must exist.
- **Mobile-first.** Designed for a phone first (bottom tab navigation, thumb-reachable). Must also work responsively on desktop web (where the install button is prominent).
- **Owner prefers visual tools and avoids the terminal.** Claude Code does all CLI work; the owner only performs the dashboard/account steps documented in `setup-guide.html`. Make those steps minimal and click-based.

### 0.4 Definition of done (high level — full acceptance criteria in §19)
A new user can: open the web app → see a prominent install button → install the PWA → onboard (pick interests/neighborhood) → land on a "Hoy" home screen with a living 3D world → complete daily streak actions and watch a streak build → browse and complete catalog activities (some AI-verified by photo) → earn points, climb through 10+ ranks with sub-divisions, unlock titles → see news and community projects → join/create a project → appear on local/global/domain leaderboards → set personal goals → receive push notifications. Daily streak actions reset at 00:00 America/Argentina/Buenos_Aires; missed days break the streak (unless a streak freeze is held); a new daily challenge rotates in daily; 1–2 new catalog activities surface weekly. All AI runs server-side with caching and graceful fallback.

---

## 1. TECH STACK & DEPENDENCIES

Use these exact technologies and approximate versions (use the latest stable compatible release at build time; pin in `package.json`).

### 1.1 Core
- **Framework:** Next.js 14+ (App Router) + TypeScript (strict mode).
- **Styling:** Tailwind CSS 3.4+ with a custom design-token config (§2). `tailwindcss-animate` plugin.
- **UI primitives:** Radix UI primitives (free, unstyled, accessible) for dialogs, popovers, tabs, toasts, sheets. Build styled components on top.
- **Animation:** Framer Motion (micro-interactions, transitions, reward animations).
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`. Use lazy loading and dynamic import (`next/dynamic`, `ssr:false`) for all 3D so it never blocks first paint.
- **Icons:** `lucide-react` for UI icons. For activity/domain icons use a custom illustrated set (see §2.6) — Claude Code generates inline SVGs in the brand style; do **not** depend on a paid icon pack.
- **State:** TanStack Query (React Query) v5 for all server state (caching, mutations, optimistic updates). Zustand for local/UI state (onboarding, 3D world view state, toasts queue).
- **Forms/validation:** React Hook Form + Zod. Zod also validates all API inputs and Gemini JSON outputs.
- **Dates/time:** `date-fns` + `date-fns-tz` (timezone-correct daily logic).
- **i18n:** `next-intl` (App Router compatible). Locale files in `/messages/es.json` and `/messages/en.json`.
- **Charts:** `recharts` for impact/stat charts (free).
- **PWA:** custom service worker via `@serwist/next` (modern, maintained `next-pwa` successor) OR `next-pwa` if simpler; plus a hand-authored `manifest.webmanifest`. Implement the install prompt manually (§12).

### 1.2 Backend / platform
- **Supabase:** Postgres database, Auth (Google OAuth + email magic link), Storage (verification photos, project images, avatars), Edge Functions (Deno — for Gemini calls and scheduled jobs), Realtime (live leaderboard + notifications), and **pg_cron + pg_net** for scheduled jobs.
- **AI:** Google Gemini via REST (`@google/generative-ai` SDK in Edge Functions). Use `gemini-1.5-flash` (fast, free-tier friendly, supports vision) for verification, recommendations, and news. Never expose the key client-side.
- **Hosting:** Vercel (free Hobby tier). Vercel Cron may be used as a backup scheduler, but prefer Supabase pg_cron to keep scheduling co-located with the DB.

### 1.3 Dev tooling
- ESLint + Prettier (config included). Husky pre-commit optional (skip if it complicates zero-friction). `.env.local` for secrets, `.env.example` committed. TypeScript path aliases (`@/...`).

### 1.4 Explicit "do not"
- Do **not** use `localStorage`/`sessionStorage` for anything security- or sync-relevant (use Supabase + cookies). Light non-critical UI prefs in `localStorage` are fine.
- Do **not** add Stripe/MercadoPago/payments. Scaffold the data model for premium/sponsors (§16) but wire **no** checkout.
- Do **not** call Gemini from the client.
- Do **not** hardcode secrets. All keys via env vars.

---

## 2. BRAND IDENTITY & DESIGN SYSTEM

> The brand name **"Brote"** is a working name and will change later. Centralize it: put the app name, tagline, and mascot name in `/lib/brand.ts` as constants and reference them everywhere (never hardcode "Brote" in components) so a future rename is a one-line change.

### 2.1 Brand concept
- **Name:** Brote (sprout / new growth).
- **Tagline (es):** "Hacé crecer tu mundo." (Make your world grow.)
- **Mascot:** **Pip** — a small, friendly, slightly glowing seed-sprout creature with one expressive leaf and large warm eyes. Pip lives inside the user's 3D world ("Tu Mundo"), reacts to actions (celebrates completions, looks sleepy at night, droops gently if a streak is at risk), and visually evolves as the user ranks up. Pip is the emotional anchor and the source of nudges/empty-state voice. Gender-neutral.
- **Personality/voice:** warm, encouraging, a little playful, never preachy or guilt-tripping, never corporate. Celebrates effort. Speaks Argentine Spanish ("¡Buenísimo!", "Dale", "Sumá puntos", "Hacé"). Pip is a companion, not a teacher.

### 2.2 The "one identity, wide variety" system
Everything shares one design language (type, spacing, components, motion, the sprout/growth motif), but **each environmental domain owns a distinct accent color**. This gives cohesion plus the colorful variety requested. Domain colors are used for that domain's icon, leaderboard, category headers, progress, and accents — never for global chrome.

### 2.3 Color tokens
Define as CSS variables (in `globals.css`) and mirror in `tailwind.config.ts`. Provide **light and dark themes** (dark is the default for the immersive home/3D screens; respect system preference + a manual toggle).

**Core brand**
- `--brote-green` `#1FB57A` (primary — fresh living green; primary buttons, brand, active states)
- `--brote-green-deep` `#0E7A52` (pressed/hover, deep accents)
- `--brote-ink` `#0C1A13` (near-black forest green — dark theme base background, primary text on light)
- `--brote-ink-soft` `#16261D` (dark theme elevated surfaces/cards)
- `--brote-cream` `#F7F5EF` (light theme base background)
- `--brote-cream-soft` `#FFFFFF` (light theme cards)
- `--brote-sun` `#FFB23E` (warm amber — the "reward/energy" accent: points, streak flame, XP, celebrations)
- `--brote-coral` `#FF6B5E` (alerts/streak-at-risk, secondary energy)

**Domain accents** (each domain = one color; see §3.4 for the domain list)
- Residuos / Waste & Circularity: `#C2703D` (terracotta)
- Agua / Water: `#2DB4D4` (clear water cyan)
- Energía / Home Energy & CO₂: `#F4A62A` (amber-gold)
- Movilidad / Transport: `#5B6CF0` (indigo)
- Plantas / Plants & Greening: `#3CB371` (leaf green)
- Animales / Animals & Wildlife: `#E8638C` (warm pink)
- Alimentación / Food & Diet: `#9CC93B` (fresh lime)
- Consumo / Consumption & Shopping: `#B07CD6` (violet)
- Digital / Tech & Digital Carbon: `#3DC1C1` (teal)
- Comunidad / Community Action: `#FF8A3D` (warm orange)
- Agua Azul / Water Bodies & Oceans: `#1E88A8` (deep ocean)
- Aire y Suelo / Air, Soil & Land: `#A38B6D` (warm earth)
- Ciencia Ciudadana / Citizen Science: `#6FBF73` (sage green)

**Neutrals / utility:** a warm grey ramp `--grey-50…900` (slightly green-tinted, not pure grey). Success uses `--brote-green`, warning `--brote-sun`, danger `--brote-coral`. Provide sufficient contrast (WCAG AA) for text in both themes.

### 2.4 Typography
Free Google Fonts, paired deliberately (not a default stack):
- **Display / headings:** **"Bricolage Grotesque"** — characterful, friendly-but-modern geometric grotesque with personality; use for screen titles, rank names, big numbers, celebratory moments. Variable weight; use 600–800 for headings.
- **Body / UI:** **"Inter"** — clean, legible at small sizes, excellent for dense UI, buttons, lists.
- **Numerals / data accent:** Use Inter's tabular figures (`font-variant-numeric: tabular-nums`) for point counters and leaderboards so digits align. For the big celebratory point bursts, use Bricolage Grotesque weight 800.

Type scale (mobile-first, rem): display-xl 2.5/display-l 2.0/h1 1.6/h2 1.3/h3 1.1/body 1.0/small 0.875/caption 0.75. Generous line-height on body (1.5), tight on display (1.05). Sentence case everywhere (never ALL CAPS except tiny eyebrow labels with letter-spacing).

### 2.5 Layout, spacing, shape, motion
- **Spacing scale:** 4-based (4/8/12/16/20/24/32/40/48/64). Comfortable padding; mobile screens use 16–20px gutters.
- **Radius:** generous, friendly — cards `20px`, buttons `14px`, pills/chips `999px`, sheets `24px` top corners. The rounded language reinforces "friendly."
- **Elevation:** soft, layered shadows with a subtle green tint in light mode; in dark mode use elevation via lighter surfaces + subtle inner glow, not harsh shadows.
- **Motion (Framer Motion):** spring-based, lively but not jittery. Standard transition ~220ms ease-out. Reward moments (completion, level-up) get orchestrated sequences: point number counts up, a particle/leaf burst, Pip reacts, world element grows. Respect `prefers-reduced-motion` (replace big animations with simple fades; never disable functionality).
- **Signature element:** **"Tu Mundo"** — the living 3D world at the top of Home is the one bold, memorable centerpiece (§9). Everything else stays calm and disciplined around it.

### 2.6 Iconography & illustration
- **UI icons:** lucide-react.
- **Domain & activity icons:** a cohesive **illustrated** set (rounded, slightly dimensional, on-brand). Claude Code authors these as inline/optimized SVG components in `/components/icons/activities/`, sharing a consistent stroke weight, corner radius, and a 2-tone fill using the domain accent + a neutral. Aim for warmth and a hand-crafted-but-modern feel. Each of the 150+ activities references a domain icon at minimum; high-traffic activities get a bespoke icon.
- **Realism where it counts:** activity cards and reward moments may use richer, more dimensional illustration; the 3D world uses stylized-realistic (low-poly with good lighting/materials), not flat. Keep photoreal out (too heavy for a free mobile stack) — the bar is "beautiful, tactile, cohesive," not "photographic."

### 2.7 Component library (build these as reusable components)
Buttons (primary/secondary/ghost/danger, with loading + haptic), Cards, Pills/Chips (domain-colored), the **PointsBadge** (amber, animated count), **StreakFlame** (animated, intensity scales with streak length), **RankBadge** (shows rank + division + progress ring), **ProgressRing** and **ProgressBar**, **ActivityCard** (catalog), **DailyActionRow** (checkable, with the 00:00 reset behavior), BottomTabBar, TopBar, Sheet/Modal/Toast, Avatar, **LeaderboardRow**, **NewsCard**, **ProjectCard**, EmptyState (always in Pip's voice), Skeleton loaders, the **InstallButton/InstallBanner** (§12), and the **MundoCanvas** (3D, §9). All themed via tokens, all responsive, all accessible (focus states, ARIA, keyboard).

---

## 3. INFORMATION ARCHITECTURE & NAVIGATION

### 3.1 Primary navigation (mobile = bottom tab bar; desktop = left sidebar)
Five top-level destinations, thumb-reachable, with the center tab elevated:

1. **Hoy** (Home/Today) — `/` — the daily hub + Tu Mundo + daily streak session. Default landing.
2. **Acciones** (Activity Catalog) — `/acciones` — the 150+ catalog + personalized "Para Vos" feed.
3. **Explorar** (Explore) — `/explorar` — two sub-tabs: **Novedades** (news) and **Proyectos** (community projects).
4. **Ranking** (Leaderboards) — `/ranking` — global / domain / local / friends leaderboards + your standing.
5. **Perfil** (Profile) — `/perfil` — rank, titles, badges, impact, your Mundo detail, your projects, goals, settings.

The center tab (Acciones) can be visually elevated as the primary action. Use clear active states in the domain-neutral brand green.

### 3.2 Secondary routes
- `/onboarding` (multi-step, post-signup, pre-home)
- `/acciones/[slug]` (activity detail + complete/verify flow)
- `/explorar/proyectos/[id]` (project detail + join)
- `/explorar/proyectos/nuevo` (create project — gated by min rank, see §8)
- `/explorar/novedades/[id]` (full news item)
- `/perfil/[username]` (public profile of another user)
- `/perfil/objetivos` (goals manager)
- `/perfil/logros` (titles & badges gallery)
- `/perfil/ajustes` (settings: language, notifications, theme, account, privacy)
- `/ranking/[domain]` (per-domain leaderboard)
- `/auth/...` (login, callback, magic-link)
- `/instalar` (a friendly page explaining/triggering PWA install, linked from the install banner on unsupported browsers)

### 3.3 Global UI elements
- **Top bar (contextual):** current screen title, the user's compact RankBadge + point total (always visible — reinforces progression), a notifications bell (with unread dot), streak flame with current count.
- **Install banner/button:** prominently visible on web until installed (§12).
- **Toasts:** for point awards, level-ups (full-screen celebration overlay for rank-ups), errors, and verification results.
- **Pip nudges:** contextual companion messages (home greeting, streak-at-risk warning, suggestions).

### 3.4 The 13 domains (canonical list — used for catalog, leaderboards, titles, colors)
Store in DB `domains` table and `/lib/domains.ts`. Each has: slug, name_es, name_en, color, icon, description.

| slug | name_es | color |
|---|---|---|
| residuos | Residuos y Reciclaje | #C2703D |
| agua | Agua | #2DB4D4 |
| energia | Energía y CO₂ | #F4A62A |
| movilidad | Movilidad | #5B6CF0 |
| plantas | Plantas y Verde Urbano | #3CB371 |
| animales | Animales y Vida Silvestre | #E8638C |
| alimentacion | Alimentación | #9CC93B |
| consumo | Consumo Responsable | #B07CD6 |
| digital | Digital y Tecnología | #3DC1C1 |
| comunidad | Comunidad | #FF8A3D |
| agua_azul | Océanos y Ríos | #1E88A8 |
| aire_suelo | Aire y Suelo | #A38B6D |
| ciencia | Ciencia Ciudadana | #6FBF73 |

---

## 4. DATABASE SCHEMA (Supabase / Postgres)

> Implement as ordered SQL migrations in `/supabase/migrations/`. Enable RLS on **every** table. Use `auth.uid()` in policies. Add indexes on all foreign keys and on columns used in leaderboards/filters (`total_xp`, `domain`, `completed_at`, `date`). Use `uuid` PKs (`gen_random_uuid()`), `timestamptz` for times, and `jsonb` where noted. Create updated_at triggers.

### 4.1 Enums
```sql
create type activity_type as enum ('daily', 'catalog');
create type effort_level as enum ('easy', 'medium', 'hard');
create type impact_level as enum ('low', 'medium', 'high');
create type verification_type as enum ('honor', 'photo_ai', 'photo_peer', 'geo');
create type frequency_type as enum ('one_time', 'daily', 'weekly', 'recurring');
create type completion_status as enum ('honor', 'pending', 'verified', 'rejected');
create type project_status as enum ('proposed', 'active', 'completed', 'cancelled');
create type project_member_status as enum ('joined', 'interested', 'organizer', 'left');
create type challenge_type as enum ('daily', 'weekly', 'seasonal');
create type goal_period as enum ('weekly', 'monthly');
create type notif_type as enum ('points','rank_up','title','streak_risk','streak_lost','challenge','project','friend','news','system');
```

### 4.2 Tables (essential columns; add sensible extras)

**profiles** (1:1 with auth.users; row created via trigger on signup)
- `id uuid pk references auth.users on delete cascade`
- `username text unique` (lowercase, validated), `display_name text`
- `avatar_url text`, `bio text`
- `city text default 'Buenos Aires'`, `neighborhood text` (barrio — used for local leaderboard)
- `language text default 'es'`
- `timezone text default 'America/Argentina/Buenos_Aires'`
- `total_xp bigint default 0` (drives rank; **never decreases**)
- `current_rank_slug text default 'semilla'`, `current_division int default 1`
- `current_streak int default 0`, `longest_streak int default 0`
- `last_streak_date date` (last day a daily action counted toward streak)
- `streak_freezes int default 0` (held freezes)
- `equipped_title_id uuid references titles(id)`
- `mundo_state jsonb default '{}'` (denormalized world render state, see §9.5)
- `interests text[] default '{}'` (domain slugs chosen at onboarding + inferred)
- `onboarding_completed bool default false`
- `notification_prefs jsonb default '{"push":true,"streak":true,"challenges":true,"projects":true,"news":false}'`
- `created_at timestamptz default now()`, `updated_at timestamptz`
- RLS: public read of safe columns (username, display_name, avatar, rank, total_xp, neighborhood, equipped_title) for leaderboards/profiles; full read/write only by owner. (Use a public view `public_profiles` exposing only safe columns, or column-level policies.)

**domains** — reference (slug pk, name_es, name_en, color, icon, description_es, description_en, sort_order). Public read.

**activities** — the full catalog AND daily actions (`type` distinguishes them)
- `id uuid pk`, `slug text unique`
- `type activity_type` ('daily' = streak action; 'catalog' = big list)
- `domain_slug text references domains(slug)`
- `title_es text`, `title_en text`, `short_es text`, `short_en text`, `description_es text`, `description_en text`, `instructions_es text`, `instructions_en text`
- `effort effort_level`, `impact impact_level`
- `verification verification_type default 'honor'`
- `base_points int` (see §6 for values)
- `frequency frequency_type`
- `icon text` (icon key)
- `min_rank_slug text default 'semilla'` (gating; see §5)
- `is_featured bool default false`, `featured_week date` (for "new this week")
- `impact_equivalency_es text` (e.g., "Ahorrás ~50 L de agua") , `impact_equivalency_en text`
- `repeat_cooldown_hours int default 0` (catalog one-time = large/null; daily = 24h handled by date scoping)
- `active bool default true`, `sort_order int`
- `created_at timestamptz`
- Public read (where active). Admin-only write (service role / seed).

**activity_completions**
- `id uuid pk`, `user_id uuid references profiles(id) on delete cascade`
- `activity_id uuid references activities(id)`
- `activity_type activity_type` (denormalized for fast queries), `domain_slug text` (denormalized)
- `completed_at timestamptz default now()`
- `local_date date` (the user-local calendar date — critical for daily reset & streak; computed in the user's tz at insert)
- `points_awarded int`
- `status completion_status default 'honor'`
- `photo_url text` (Supabase Storage path, nullable)
- `ai_result jsonb` (Gemini verification output, nullable)
- `note text` (optional user note, e.g., the "small note" the owner mentioned — low priority but supported)
- `counts_for_streak bool default false` (true only for daily actions)
- unique partial index: for `type='daily'`, one completion per (`user_id`,`activity_id`,`local_date`) to prevent double-logging a daily action in the same day.
- RLS: owner read/write; public read of minimal aggregate via views only.

**user_domain_points** (aggregate for domain leaderboards & domain titles)
- `user_id uuid`, `domain_slug text`, `points bigint default 0`, pk(`user_id`,`domain_slug`). Updated by trigger/RPC on each completion. RLS: public read.

**ranks** — reference (slug pk, name_es, name_en, tier int unique 1..11, xp_threshold bigint [XP to ENTER rank], divisions int default 5, color, icon, unlock_description_es). Public read. (Values in §5.)

**titles** — (id pk, slug, name_es, name_en, domain_slug nullable, requirement_type text ['domain_points'|'rank'|'activity_count'|'streak'|'special'], requirement_value bigint, requirement_domain text nullable, rarity text ['common'|'rare'|'epic'|'legendary'], icon, description_es). Public read.

**user_titles** — (user_id, title_id, earned_at, pk(user_id,title_id)). Public read; insert by system.

**badges** + **user_badges** — same shape as titles/user_titles; badges are achievement medals (e.g., "Primera acción", "Racha de 30 días", "10 árboles plantados").

**challenges** — (id pk, type challenge_type, title_es, title_en, description_es, description_en, domain_slug nullable, target_metric text, target_value int, reward_points int, min_rank_slug default 'semilla', starts_at timestamptz, ends_at timestamptz, sponsor_name text nullable, sponsor_logo text nullable, active bool). Public read.

**user_challenges** — (user_id, challenge_id, progress int default 0, completed bool default false, completed_at, pk(user_id,challenge_id)). Owner read/write.

**goals** — (id pk, user_id, title_es text, metric text ['xp'|'completions'|'domain_points'|'streak_days'|'daily_actions'], domain_slug nullable, target_value int, period goal_period, starts_at date, ends_at date, progress int default 0, is_custom bool default true, completed bool default false). Owner read/write.

**projects** (community)
- `id uuid pk`, `creator_id uuid references profiles(id)`
- `title text`, `description text`, `type text` (e.g., 'limpieza','plantacion','educacion','reciclaje','otro')
- `domain_slug text`
- `image_url text`
- `neighborhood text`, `city text default 'Buenos Aires'`, `lat double precision`, `lng double precision`, `location_text text`
- `event_date timestamptz` (nullable for open-ended)
- `status project_status default 'proposed'`
- `min_rank_slug text default 'semilla'` (some projects gated; see §8)
- `max_participants int` (nullable)
- `reward_points int default 0` (points for verified participation)
- `upvotes int default 0`
- `created_at timestamptz`
- RLS: public read; creator can update/cancel; authenticated users can create **only if** their rank ≥ a configurable threshold (enforce in RPC, not just client).

**project_participants** — (project_id, user_id, status project_member_status, joined_at, pk(project_id,user_id)). Public read; owner write.

**project_upvotes** — (project_id, user_id, pk). For dedup. Public read; owner write. Trigger maintains `projects.upvotes`.

**news** (AI-summarized cache)
- `id uuid pk`, `source text`, `source_url text unique`, `original_title text`
- `title_es text`, `summary_es text`, `title_en text`, `summary_en text`
- `image_url text`, `domain_tags text[]`
- `interest_score int` (0–100, AI-scored "how interesting/relevant"), `published_at timestamptz`, `fetched_at timestamptz default now()`
- `active bool default true`
- Public read. Populated by scheduled Edge Function (§10.3).

**friendships** — (user_id, friend_id, status text ['pending','accepted','blocked'], created_at, pk(user_id,friend_id)). For friend leaderboards. Owner-scoped RLS. Provide an RPC to fetch a friend leaderboard.

**notifications** — (id pk, user_id, type notif_type, title_es text, body_es text, data jsonb, read bool default false, created_at). Owner read/write. Realtime-enabled.

**app_state / config** — (key text pk, value jsonb). For things like the current daily challenge id, the weekly featured activity rotation pointer, feature flags, premium/sponsor flags (scaffolded, off). Public read for non-sensitive keys.

**push_subscriptions** — (id pk, user_id, endpoint text, p256dh text, auth text, created_at). For Web Push (§12.4). Owner-scoped.

### 4.3 Views & RPCs (Postgres functions)
- `public_profiles` view — safe columns only.
- `global_leaderboard` — top N by `total_xp` with rank/title joined (use a view or paginated RPC; for scale, an indexed query on `total_xp desc`).
- `domain_leaderboard(domain_slug, limit, offset)` — from `user_domain_points`.
- `neighborhood_leaderboard(neighborhood, limit)` — `total_xp` filtered by neighborhood.
- `friend_leaderboard(user_id)` — joins accepted friendships.
- **`complete_activity(activity_id, photo_url, note)`** — the core transactional RPC: validates eligibility (active, min_rank met, daily cooldown via unique index, catalog cooldown), computes points (base + bonuses, §6), inserts completion, updates `profiles.total_xp` and `user_domain_points`, updates streak if daily (§13.2 logic, but immediate same-day continuation handled here), checks/awards rank-ups, titles, badges, and challenge progress, writes notifications, returns a result payload `{points_awarded, new_total, rank_up?, new_titles[], new_badges[], streak, mundo_delta}` so the client can animate. **All point/rank/streak mutations happen server-side here** — never trust the client.
- `use_streak_freeze(user_id)` — consumes a freeze.
- `upvote_project(project_id)`, `join_project(project_id)`, `create_project(...)` (enforces rank gate).
- `award_verified(completion_id, ai_result)` — called by the verification Edge Function to flip a pending photo_ai completion to verified/rejected and grant/withhold the verification bonus + notify.

Keep business logic in these RPCs so the client stays thin and rules can't be bypassed.

---

## 5. THE RANK SYSTEM (11 ranks × 5 divisions = 55 progression steps)

The rank ladder is themed on growth from a seed to a living planet. **11 ranks**, each with **5 internal divisions** (V is highest within a rank, i.e., the user climbs Semilla I → II → III → IV → V → then promotes to Brote I…). Display format: "**Brote III**". XP only ever increases, so rank never drops.

### 5.1 Rank definitions
`xp_threshold` = cumulative XP required to ENTER the rank (reach division I). Divisions split the span to the next rank into 5 equal-ish steps (compute programmatically; see §5.2).

| tier | slug | name_es | enter at XP | color | unlocks |
|---|---|---|---|---|---|
| 1 | semilla | Semilla | 0 | #A38B6D | starter world (bare soil + Pip) |
| 2 | brote | Brote | 1,000 | #9CC93B | first grass + a sprout in Tu Mundo; first title slot |
| 3 | plantula | Plántula | 3,000 | #6FBF73 | flowers appear; can create community projects |
| 4 | retono | Retoño | 7,000 | #3CB371 | first small tree; unlock friend leaderboard features |
| 5 | arbusto | Arbusto | 15,000 | #1FB57A | shrubs + first animal (bird) visits Tu Mundo |
| 6 | arbol | Árbol | 30,000 | #0E7A52 | a full tree; access to tier-gated challenges (rank ≥6) |
| 7 | bosque | Bosque | 60,000 | #2DB4D4 | a small grove + pond + more wildlife |
| 8 | guardian | Guardián | 120,000 | #1E88A8 | "Guardián" cosmetic aura for Pip; gated projects (rank ≥8) |
| 9 | ecosistema | Ecosistema | 250,000 | #5B6CF0 | rich biome (multiple animals, water, structures) |
| 10 | planeta | Planeta | 500,000 | #B07CD6 | Tu Mundo becomes a small living planet (globe view) |
| 11 | gaia | Gaia (Leyenda) | 1,000,000 | #FFB23E | legendary status, golden world, exclusive legendary title |

### 5.2 Division math (implement in `/lib/ranks.ts`)
For a rank with span `[enter, nextEnter)`, division boundaries are at:
`enter + floor((nextEnter - enter) * d / 5)` for d in 0..4 (division 1 starts at d=0).
For Gaia (no next rank), divisions every +250,000 XP beyond 1,000,000 (cosmetic only).
Expose helpers: `getRank(totalXp) -> {rankSlug, division, xpIntoDivision, xpForDivision, xpIntoRank, progressToNextRankPct, nextRankSlug}`. The server `complete_activity` RPC recomputes rank/division on every XP change and emits `rank_up` when the rank slug changes (division-ups also notify, more quietly).

### 5.3 Rank-up experience
- **Division-up:** subtle toast + Pip cheer + small world growth increment + progress ring fills.
- **Rank-up (new rank):** full-screen celebration overlay — Pip evolves, Tu Mundo visibly transforms (new element appears, see §9.4), the new rank name animates in (Bricolage Grotesque 800), confetti/leaf particles, "¡Subiste a [Rank]!", lists any unlocks (new features, projects access). Push notification if app backgrounded.
- Always show, in the top bar and profile, the current rank, division, and a progress ring to the next division/rank.

---

## 6. POINTS / XP SYSTEM

One currency: **Puntos (XP)**. Big, legible numbers (no 1/2/3). `total_xp` drives rank; `user_domain_points` drives domain leaderboards/titles. **All awards computed server-side in `complete_activity`.**

### 6.1 Base point values
**Daily Streak Actions (`type='daily'`)** — small, by effort:
- Easy daily: **50**
- Medium daily: **100**
- Hard-ish daily (still routine): **150–200**

**Catalog Actions (`type='catalog'`)** — larger, by effort × impact × verification:
- Easy / Low impact: **300**
- Easy / Medium impact: **500**
- Medium / Medium impact: **750**
- Medium / High impact: **1,000**
- Hard / Medium impact: **1,500**
- Hard / High impact: **2,000**
- Exceptional / High impact + verified (e.g., solar install, car-free week, renewable tariff): **2,500–3,000**

Set each activity's `base_points` explicitly in the seed (§14) using this grid; don't compute at runtime (lets you tune individual activities).

### 6.2 Bonuses & multipliers (applied in `complete_activity`)
- **Verification bonus:** photo_ai or peer-verified completions grant **+25%** of base (rounded to nearest 10) when status becomes `verified`. Awarded on verification success (not at submission for pending photo_ai actions — see §11.3).
- **Streak multiplier (daily actions only):** the day's daily-action points get a small multiplier by current streak length: 0–6 days ×1.0, 7–29 ×1.1, 30–99 ×1.2, 100+ ×1.3. Keep modest (informational reward, not runaway inflation).
- **First-time bonus:** the first time a user ever completes a given catalog activity: **+100** flat ("Nueva acción desbloqueada"). Repeats of recurring activities don't get it again.
- **Daily session completion bonus:** completing **all** of the day's suggested daily actions (the daily set, see §7.2 home) grants **+200** and a badge-style flair.
- **Weekly challenge / featured completion:** per challenge `reward_points`.
- **Project participation (verified):** per project `reward_points`.

### 6.3 Anti-inflation / integrity
- Daily actions: capped by the unique (user,activity,date) index — each daily action counts once per day.
- Catalog one-time actions: `repeat_cooldown_hours` large or enforced "once ever" via existence check in RPC; recurring catalog actions have a sensible cooldown (e.g., weekly) enforced server-side.
- No negative points ever. No spending. No trading.
- Domain points mirror the same awarded value into `user_domain_points[domain]`.

---

## 7. TITLES, BADGES & THE DAILY SET

### 7.1 Titles (equip one; flavor identity, separate from rank)
Earned automatically when requirements are met; user equips one as their public flavor title (shown by name on profile & leaderboards). Examples to seed (provide ~30–40):
- **Domain mastery (per domain, by `user_domain_points`):** thresholds at 2,000 / 10,000 / 30,000 domain points → e.g. Agua: "Cuidador del Agua" → "Guardián del Agua" → "Maestro del Agua". Residuos: "Reciclador" → "Héroe Cero Residuos" → "Campeón Circular". Animales: "Amigo de los Animales" → "Protector de la Fauna" → "Guardián Silvestre". Plantas: "Jardinero" → "Sembrador" → "Maestro Verde". Movilidad: "Pedaleador" → "Viajero Limpio" → "Maestro de la Movilidad". Energía: "Ahorrador" → "Eficiente" → "Maestro de la Energía". Alimentación: "Cocina Consciente" → "Plant-Forward" → "Maestro de la Alimentación". (Cover all 13 domains.)
- **Rank-based:** "Recién Brotado" (reach Brote), "Raíces Firmes" (Árbol), "Guardián del Planeta" (Planeta), "Leyenda Viva" (Gaia — legendary).
- **Behavior-based:** "Madrugador" (10 daily actions before 9am), "Imparable" (30-day streak), "Centenario" (100-day streak), "Constructor de Comunidad" (create a project that reaches 10 participants), "Verificado" (10 AI-verified actions).

### 7.2 Badges (medals, not equipped — a collection wall)
Seed ~25: "Primera Acción", "Primer Árbol", "Primera Semana" (7-day streak), "Mes Verde" (30-day), "100 Acciones", "Primer Proyecto", "Reciclador x50", "Polinizador" (install bug hotel / plant for pollinators), "Limpieza Costera", "Cazador de Ciencia" (10 citizen-science logs), "Todo en un Día" (complete full daily set), etc. Each badge: icon, name_es, description_es, rarity. Show locked badges as silhouettes with hint text to drive completion.

### 7.3 The "Daily Set" (the Duolingo-style session — core of Home)
Every day, the app presents a **curated set of daily streak actions** (default 4–6) on Hoy. Composition:
- Personalized by the recommendation engine (§10.2) from the user's interests, what they haven't done recently, and domain variety.
- Always includes a mix so it never feels repetitive (e.g., one water, one transport/movement, one food, one wildcard).
- Completing **any** one daily action maintains the streak for the day; completing **all** grants the session bonus (§6.2).
- The set is generated at the day boundary (00:00 BA time) by a scheduled job or lazily on first open of the new local day, and stored per user/day so it's stable through the day.
- Below the set, a "más acciones diarias" expander reveals the full daily-action pool so motivated users can do extra (each still capped once/day).

This is the **natural, close-to-the-user, routine** surface. Keep it fast: open app → see today's set → tap to complete → satisfying feedback → streak ticks. The whole loop should take seconds.

---

## 8. FEATURE SPECIFICATIONS (screen by screen)

### 8.1 Authentication & account
- Supabase Auth: **Google OAuth** + **email magic link** (both free). No passwords.
- On first sign-in, a Postgres trigger creates the `profiles` row; the app routes to `/onboarding` if `onboarding_completed=false`.
- Session via Supabase SSR helpers (cookies). Protect app routes; `/`, public profiles, and leaderboards can render limited public data unauthenticated but prompt sign-in to act.
- Settings → account: sign out, delete account (cascade), export my data (simple JSON of own rows — privacy-friendly).

### 8.2 Onboarding (`/onboarding`, multi-step, delightful)
Steps (each a full-screen card with Pip guiding, progress dots, smooth transitions):
1. **Welcome** — Pip introduces Brote and the tagline; "Empezá" CTA.
2. **Pick your name & barrio** — display name + neighborhood (autocomplete common CABA/GBA barrios; free text allowed) for local leaderboard.
3. **Pick interests** — choose 3+ domains from the 13 (colorful chips). Seeds `interests`, drives recommendations.
4. **Quick context (optional, powers AI personalization)** — light multi-select: "¿Tenés…?" balcón/jardín/auto/bici/mascota; "¿Comés carne?" never/sometimes/often. Stored in profile `interests`/a `context` jsonb. Skippable.
5. **Meet Tu Mundo** — show the starter 3D world (Semilla state) with Pip; explain it grows as they act.
6. **Your first daily action** — present one ultra-easy daily action; on completion, fire the full reward animation (points, streak=1, Pip cheer) so the user feels the core loop before finishing onboarding. Sets `onboarding_completed=true`, routes to Hoy.
Allow install prompt surfacing during/after onboarding (§12).

### 8.3 Hoy / Home (`/`) — the daily hub
Top to bottom:
1. **Tu Mundo** (the 3D centerpiece, §9) — hero, ~40–50% of first viewport. Day/night reflects real time. Tap to enter full world view. Pip greets by name with a contextual line (streak status, encouragement).
2. **Streak + status strip** — animated StreakFlame with current count; "racha" label; if streak at risk (no daily action done today and it's late), Pip warns and offers info on streak freeze. Compact RankBadge + points (also in top bar).
3. **El Set de Hoy** (the Daily Set, §7.3) — the day's 4–6 daily actions as checkable `DailyActionRow`s. Each: icon (domain-colored), title, point value (e.g., "+100"), check affordance. Tap → instant optimistic check → reward animation → streak/points update via `complete_activity`. Completed rows show done state and persist until 00:00 reset. Progress indicator "3/5 hechas hoy". On completing all: session bonus celebration + badge check.
4. **Reto del día** (daily challenge) — the rotating daily challenge card (from `challenges` type='daily') with progress and reward.
5. **Para Vos (peek)** — 2–3 recommended catalog actions (link to Acciones) to pull users toward bigger actions.
6. **Quick impact** — a small live "tu impacto" summary (e.g., handprint metrics: liters saved, kg diverted, trees, etc., approximate) with a link to full impact on Profile.
Everything above the fold should make returning feel rewarding within seconds.

### 8.4 Acciones / Activity Catalog (`/acciones`)
- **Top: "Para Vos" feed** — the personalized, algorithmic ranking of catalog activities (§10.2), horizontally or as a prioritized list. This is the "media-algorithm" surface for big actions. Labeled, with a subtle "recomendado para vos" tag and reasons ("porque te interesan los animales").
- **Nuevas esta semana** — the 1–2 freshly surfaced activities (`is_featured`, current `featured_week`) highlighted with a "Nuevo" ribbon.
- **Browse by domain** — 13 domain sections (colored), each expandable, showing `ActivityCard`s. Filters: domain, effort, impact, verification (honor/photo), "puedo hacer ahora" (no rank lock), completed/not. Search.
- **ActivityCard:** illustrated icon, title, short desc, domain chip, point value (big amber), effort & impact badges, a verification badge if photo required, and a lock badge + "Desbloqueás en [Rank]" if `min_rank` not met. Tap → detail.
- **Activity detail (`/acciones/[slug]`):** full illustration/3D-ish header, description, step-by-step instructions, impact equivalency, points, verification requirements. Primary CTA "Marcar como hecha" (honor) or "Subir foto y verificar" (photo_ai). Completion runs `complete_activity`; photo flow in §11. Shows your completion history for recurring ones and cooldown state. Tier-locked actions show what's needed to unlock.

### 8.5 Explorar (`/explorar`) — two sub-tabs
**A) Novedades (News dashboard)**
- Feed of `NewsCard`s from the AI-summarized `news` table, sorted by a blend of `interest_score`, recency, and match to the user's interest domains (personalized order).
- Each card: image, punchy Spanish AI title + 1–2 line summary, source attribution + domain tag(s), published time, "leer más" → `/explorar/novedades/[id]` (full summary + outbound link to source; **link out — do not reproduce full article text**, only the AI summary + attribution).
- Filter chips by domain. Pull-to-refresh. Content must be **interesting**: the AI scoring + curation (§10.3) prioritizes engaging, relevant, recent items (innovations, wins, local Argentina/LatAm news when available) over dry press releases.

**B) Proyectos (Community projects dashboard)**
- Feed of `ProjectCard`s: image, title, type, domain chip, neighborhood + distance (if geo), date, participant count / max, upvotes, status, and a rank-lock badge if `min_rank` gating applies.
- Sort/filter: cerca tuyo (by neighborhood), próximos (by date), populares (upvotes), por dominio, abiertos.
- **Project detail (`/explorar/proyectos/[id]`):** full description, map (use a free map: Leaflet + OpenStreetMap tiles — no paid key), date, organizer profile, participant list/avatars, upvote button, **"Sumarme"** (join → `join_project`) / "Me interesa". Verified participation can grant `reward_points` (organizer or geo/photo confirmation — keep simple: organizer marks attendees, or honor + optional photo).
- **Create project (`/explorar/proyectos/nuevo`):** gated — only users at rank ≥ **Plántula** (tier 3) may create (enforced server-side in `create_project`). Form: title, description, type, domain, neighborhood/location (map picker), date, max participants, optional image (Storage upload), optional `min_rank` to set a tier-gated project (the owner's requested "challenges/projects only for tier ≥ X"). Creating costs nothing; rewards community-building (badge/title).
- **Tier-gated projects/challenges:** projects (and certain challenges) may set `min_rank_slug`; users below see them but cannot join, with "Disponible desde [Rank]" — a motivation hook to climb.

### 8.6 Ranking / Leaderboards (`/ranking`)
- Tabs/segments: **Global**, **Mi Barrio** (neighborhood), **Amigos** (friends), and **Por Dominio** (13 domain leaderboards, color-coded).
- Each: ranked list (`LeaderboardRow`: position, avatar, display_name, equipped title, rank badge, point total — tabular numerals), with the current user's row pinned/sticky and highlighted, plus their position if outside the visible top.
- Period toggle where useful: "Histórico" (all-time by total_xp) and "Esta semana" (weekly XP via a weekly snapshot table or computed from completions in the last 7 days — implement weekly via summing completions `local_date` in range).
- Realtime-ish updates (Supabase Realtime or periodic refetch) so positions feel alive.
- Friends: add by username; `friendships` flow; the friend leaderboard is a strong retention/virality driver — surface "invitá amigos" CTAs here (deep link / share, §12.3).

### 8.7 Perfil (`/perfil` and public `/perfil/[username]`)
- **Header:** avatar, display_name, @username, barrio, equipped title, big RankBadge (rank + division + progress ring to next), total points.
- **Tu Mundo (detail):** larger interactive 3D world view (§9) with current state and "what unlocks next."
- **Impacto (handprint):** the user's cumulative positive impact — animated stats and `recharts` visuals (approx liters saved, kg waste diverted, meatless meals, trees/plants, km not driven, animals/pollinators helped). A rotating 3D **impact globe** accent. Frame positively ("Tu huella positiva").
- **Logros (`/perfil/logros`):** titles gallery (equip toggle) + badges wall (earned vs locked silhouettes with hints).
- **Estadísticas:** streak (current/longest), domain points breakdown (radar/bar), activity history, completions count.
- **Mis Proyectos:** created + joined projects.
- **Objetivos (`/perfil/objetivos`):** see §8.8.
- **Ajustes (`/perfil/ajustes`):** language (es/en — en may show "próximamente" if not yet translated, but the switch exists), theme (light/dark/system), notification prefs (maps to `notification_prefs`), manage push permission, account (sign out, delete, export), privacy (what's public), about/credits.
- Public profiles show safe columns only.

### 8.8 Objetivos / Personal Goals (`/perfil/objetivos`)
- Users set **customizable weekly or monthly goals** (the requested feature). Create a goal: pick metric (total puntos, cantidad de acciones, puntos en un dominio, días de racha, acciones diarias completadas), target value, period (semanal/mensual). Optionally pick from **suggested goals** (AI/template, e.g., "Hacé 5 acciones de Agua esta semana", "Mantené 7 días de racha").
- Progress bars update from live data; completion grants `reward_points` + a celebratory moment + optional badge. Period rollover handled by the scheduled job (§13): expire/reset, archive results, optionally auto-renew recurring goals.

### 8.9 Challenges (surfaced on Hoy + a section in Acciones/Explorar)
- **Daily challenge** (rotates 00:00) — on Hoy.
- **Weekly challenges** (rotate weekly) — themed, sometimes domain-specific, sometimes sponsor-brandable (sponsor fields scaffolded, none active). Progress tracked in `user_challenges`.
- **Seasonal/special challenges** — e.g., "Semana del Agua", a "Bioblitz" citizen-science weekend. Some `min_rank`-gated (rank ≥ Árbol) per the owner's request.
- Challenge cards show progress, time remaining, reward, and any rank gate.

### 8.10 Notifications (in-app + push)
- In-app notifications center (bell in top bar) backed by `notifications`, Realtime-updated, unread badge.
- Push (§12.4) for: streak at risk (evening reminder if no daily action yet), streak milestone, rank-up, new title/badge, challenge ending soon, project you joined updates, weekly "tu set te espera" nudge. All respect `notification_prefs` and OS permission.

---

## 9. "TU MUNDO" — THE LIVING 3D WORLD (signature feature)

The single bold, memorable element. A stylized-realistic, low-poly 3D diorama that the user grows by acting in the real world. It must be **beautiful but performant on mid-range phones**.

### 9.1 Tech & performance
- `@react-three/fiber` + `@react-three/drei`, loaded via `next/dynamic({ssr:false})` and React `Suspense` with a branded skeleton (a flat illustrated preview of the world so there's no blank gap while the canvas loads).
- **Low-poly stylized** geometry with good lighting (soft directional + ambient + a warm rim light), gentle bloom (drei `<EnvironmenthP>`/postprocessing kept light). Baked-feel materials; avoid heavy realtime shadows on mobile (use a single soft contact shadow / `<ContactShadows>` or a baked shadow plane).
- **Performance budget:** target 60fps on mid phones, acceptable ≥30fps. Use instanced meshes for repeated elements (grass, trees), low draw calls, compressed/simple geometry, frustum culling, `dpr={[1,2]}` clamp, and pause/throttle the render loop when the canvas is offscreen or the tab is hidden (drei `useFrame` gating, `frameloop="demand"` where possible). Provide a **low-detail mode** auto-enabled on low-end devices (detect via hardware concurrency / a quick perf probe) and a manual toggle in settings; low mode swaps the 3D for a still rendered illustration of the same world state.
- Assets: procedurally/code-built primitives where possible (cones+cylinders for trees, etc.) to avoid paid 3D models; if model files are used they must be free/CC0 (e.g., Quaternius/Kenney CC0 low-poly nature packs) and listed in credits. Keep total asset weight small and lazy-loaded.

### 9.2 What the world is
A small floating island / plot that starts barren and fills with life as the user ranks up and acts:
- **Terrain** (soil → grass → lush ground), **flora** (sprout → flowers → shrubs → trees → grove), **water** (none → small puddle → pond), **fauna** (none → a bird → butterflies → more animals), **structures** (none → a small bench/feeder/garden bed at higher ranks), **sky/weather** (day-night cycle tied to real local time; subtle weather mood).
- **Pip** the mascot lives here: idles, wanders, reacts to interactions and completions, evolves cosmetically by rank, looks sleepy at night, looks worried if streak is at risk.

### 9.3 How it grows (mapping to progress)
- **Rank** drives the *structural tier* of the world (which big elements exist). Each rank-up adds a defined element (see §5.1 unlocks): Brote→first grass+sprout, Plántula→flowers, Retoño→first tree, Arbusto→shrubs+bird, Árbol→full tree, Bosque→grove+pond, Guardián→Pip aura, Ecosistema→rich biome, Planeta→globe form, Gaia→golden world.
- **Recent activity & streak** drive *liveliness*: a longer streak = lusher/brighter world, more butterflies/animation; a broken streak gently dims it (recoverable — never punitively "kills" the world). Completing actions triggers immediate small growth/particle moments.
- **Domain balance** can theme micro-details (lots of water actions → a nicer pond; lots of plant actions → more flowers) — optional flavor from `user_domain_points`.

### 9.4 Interactions
- Tap Pip → a reaction + a Pip line (rotating tips/encouragement).
- Tap world elements → small info popcards ("Este árbol creció con tus 12 acciones de Plantas").
- Completing an action from Home/Catalog → camera nudges to the relevant element growing + particle burst.
- Full-screen world view (from Hoy hero or Profile) with gentle orbit (constrained), and a "próximo desbloqueo" panel showing what the next rank/division adds.

### 9.5 State model
- `profiles.mundo_state jsonb` stores the derived render config: `{ rankTier, structuralElements:[...], liveliness:0–1, palette, unlockedCosmetics:[...], pipStage, lastComputed }`. Recompute on rank/streak/domain changes (in `complete_activity` and the daily streak job) so the client just reads and renders deterministically. Keep the mapping logic in `/lib/mundo.ts` shared by server (to write state) and client (to render).
- The render is deterministic from `mundo_state` so it's identical across devices and cheap to load.

### 9.6 Other 3D / interactive accents (tasteful, not everywhere)
- **Impact globe** on Profile/Impacto (a small rotating stylized Earth showing the user's contributions as glowing points/markers).
- **Reward particles** (leaves, sparkles) on completions/level-ups (can be 2D Framer Motion/canvas for cheapness — reserve real 3D for Tu Mundo + globe).
- **Animated reactive icons** and parallax on cards. Keep the rest of the UI clean so the 3D world remains the star.

---

## 10. AI INTEGRATION (Google Gemini — free tier, server-side only)

Use `gemini-1.5-flash`. **All** calls run in Supabase Edge Functions (or Vercel serverless) with the key in env. Every AI feature must **cache aggressively** and **degrade gracefully** to a rule-based fallback when the free quota is hit or the call fails — the app must never break because AI is unavailable.

### 10.1 Photo verification (vision) — only for complex/unusual tasks
- Triggered only for catalog activities with `verification='photo_ai'` (a curated minority — unusual/high-value actions where a photo is meaningful and not trivially faked; see §11.1 for which). Everyday/daily actions stay honor-based.
- Flow (§11.3): client uploads photo to Storage → calls Edge Function `verify-completion` with the storage path + activity context → function sends the image + a structured prompt to Gemini asking for a JSON verdict: `{plausible: boolean, confidence: 0-1, matches_activity: boolean, looks_authentic: boolean, reasoning: string, flags: string[]}` → validate with Zod → call `award_verified` RPC to set status verified/rejected, grant the +25% bonus on success, and notify the user.
- Prompt must instruct: judge whether the image plausibly shows the claimed real-world action; flag obvious stock/AI-generated/duplicate/irrelevant images; be lenient on honest attempts, strict on clearly fake. Keep it cheap (one image, flash model). Store `ai_result`.
- Fallback if quota/error: mark `pending` and either auto-approve after a delay with a "verificación manual pendiente" note, or grant honor-level (no bonus) — choose auto-approve-without-bonus to avoid blocking users, and log for later review.

### 10.2 Personalized activity recommendations ("Para Vos" / media algorithm)
Hybrid, cheap, and resilient:
- **Content-based core (SQL/TS, always on, no AI needed):** score each catalog activity for the user from: interest-domain match, domain variety/balance (boost under-explored domains), novelty (not recently completed), effort fit (mix easy wins + stretch), impact, rank-eligibility, and freshness (featured). This guarantees a good feed with zero AI cost.
- **Collaborative signal (as data grows):** "users like you also did X" via simple co-occurrence from `activity_completions` (precomputed periodically). Optional/secondary.
- **Gemini layer (cold-start + reasoning, cached):** on onboarding completion and then refreshed e.g. daily (a scheduled job, not per page load), call Edge Function `recommend-activities` with the user's profile/context/interests/recent history → Gemini returns a ranked shortlist of activity slugs **from the provided catalog list** + a one-line Spanish reason each ("porque tenés balcón y te interesan las plantas"). Validate slugs against the real catalog (ignore hallucinated slugs). Store the result + reasons in a cache table/`app_state` keyed by user with a TTL. The feed = cached AI order blended with the content-based score; if no cache/quota, use content-based only.
- The "reason" strings power the friendly "recomendado porque…" labels. Never let AICall block render — read cache, refresh in background.

### 10.3 News summarization & curation (scheduled, shared across all users)
- A scheduled Edge Function `refresh-news` (e.g., every 6–12h) fetches from a curated list of **free RSS/Atom feeds** of reputable environmental/science sources (see §14.5 for the seed list; include some Spanish/LatAm sources). For each new item (dedup by `source_url`): send title + excerpt to Gemini → return `{title_es, summary_es (1–2 lively sentences, no copyright reproduction — original summary), domain_tags[], interest_score 0-100}` → upsert into `news`. (Also produce `title_en/summary_en` if cheap; otherwise leave null until English launch.)
- Curation: keep top items by `interest_score` + recency; expire old ones (`active=false`). This is shared content (one fetch serves all users), so it's quota-light. Fallback if quota: store raw title + source with a neutral tag and `interest_score` from a simple heuristic (keyword/recency), so the news feed still populates.
- **Copyright:** store and show only AI-generated original summaries + title + source attribution + outbound link. Never store or display full article text.

### 10.4 Quota & cost safety
- Centralize a `geminiCall()` helper with: timeout, retry-once, structured-JSON parsing (strip code fences), Zod validation, and a quota/error catch that returns a typed `fallback` signal. Track call counts in `app_state` to stay within free limits; throttle non-critical (recommendations/news) before critical (verification). Document the free-tier limits in code comments and in `setup-guide.html`.

---

## 11. VERIFICATION SYSTEM (honor-first, graduated)

### 11.1 Tiers of verification (assign per activity in the seed)
- **Honor (default, the vast majority):** all daily actions + most catalog actions. One tap "Marcar como hecha." Instant points. Trust-based.
- **Photo + AI (`photo_ai`) — only complex/unusual catalog actions:** a curated subset where a photo is meaningful (e.g., installed a rain barrel, built a bug hotel/bee house, planted a native tree, set up a compost system, organized/attended a clean-up with collected waste, rooftop solar, home insulation). These grant a verification bonus and count toward "Verificado" title/badges. Keep this list intentionally small so friction is rare.
- **Photo + Peer (`photo_peer`) / Geo — reserved for top tiers/titles & some projects:** to *reach the highest ranks/titles or join gated projects*, require stronger proof (peer/community confirmation à la iNaturalist consensus, or geolocation for location-based actions like clean-ups). Implement the data model + a simple peer-confirm UI (other users can confirm a submitted photo) and a geo check (capture lat/lng/timestamp); full consensus weighting can be simple (e.g., 2 confirmations = verified).

### 11.2 Trust score (lightweight anti-gaming)
- Maintain a per-user trust signal (derived from honest history, verification successes, and anomaly flags). Honest, consistent users sail through; accounts with anomalies (duplicate photos, impossible frequencies, rejected verifications) get more checks. Keep it invisible and non-punitive for normal users. Cap the value/scarcity of rewards at low tiers so cheating isn't worth it (it isn't — points have no cash value), which is the cheapest anti-fraud of all.

### 11.3 Photo completion flow (UX)
1. On a `photo_ai` activity detail, CTA "Subir foto y verificar."
2. Capture/upload (camera or gallery) → compress client-side → upload to Supabase Storage (`verifications/{user}/{uuid}`).
3. Call `complete_activity` with `status='pending'`, photo path, **no bonus yet**; show "Verificando… (unos segundos)" with Pip.
4. Edge Function `verify-completion` runs Gemini (§10.1) → `award_verified` flips to `verified` (grant base + bonus + first-time/streak as applicable) or `rejected` (no points; friendly explanation + allow retry). Notify + animate result.
5. If AI unavailable: auto-approve at honor level (base points, no bonus) after a short wait, flagged for optional later review — never leave the user stuck.

### 11.4 Top-tier/title gating
- Reaching the top ranks (e.g., Guardián+) and certain prestige titles requires a minimum number of **verified** actions (so elite status is credible). Surface this in Profile ("Para Guardián necesitás 10 acciones verificadas"). Entry-level remains fully open and frictionless.

---

## 12. PWA: INSTALL, OFFLINE, PUSH

### 12.1 Manifest & icons
- `manifest.webmanifest`: name "Brote", short_name "Brote", description, theme_color `#0C1A13`, background_color `#0C1A13`, display `standalone`, orientation `portrait`, start_url `/?source=pwa`, scope `/`, categories, lang `es`. Full icon set (maskable + any-purpose): 192, 256, 384, 512 PNGs + a maskable 512 + apple-touch-icon. Provide a monochrome icon for notification badges. Claude Code generates brand-consistent icons (sprout motif on the brote-ink background).
- iOS PWA meta tags (`apple-mobile-web-app-capable`, status bar style, apple-touch-icon, splash screens).

### 12.2 Service worker / offline
- Via `@serwist/next` (or `next-pwa`): precache the app shell, fonts, icons, and core static assets; runtime cache strategies — network-first for API/data, stale-while-revalidate for images/news, cache-first for static. Offline fallback page (Pip: "Sin conexión — tus acciones se guardan y sincronizan al volver"). Queue offline completions (background sync) and replay when online (since `complete_activity` is idempotent enough via the daily unique index; for catalog, guard duplicates).

### 12.3 The prominent install button (explicit requirement)
- Capture `beforeinstallprompt` (Chromium) → store the event → show a **highly visible install banner/button** in the web UI: a sticky top or bottom bar + a button in the top bar/home: "📲 Instalá Brote — usala como app". Tapping calls `prompt()`. 
- **Detection to hide it:** if `window.matchMedia('(display-mode: standalone)').matches` or `navigator.standalone` (iOS) or the app was launched with `?source=pwa`, the user already installed → **hide all install CTAs**. Persist a dismissed/installed flag.
- **iOS / unsupported browsers** (no `beforeinstallprompt`): the button routes to `/instalar`, a friendly page with step-by-step "Agregar a inicio" instructions (Safari share → Añadir a pantalla de inicio), with screenshots/illustrations and Pip guiding. Detect iOS Safari to show the right instructions.
- Keep the CTA visible across the web experience until installed (per the owner's request), but never naggy once dismissed in-session (re-surface gently on later visits if still not installed).

### 12.4 Push notifications (free via Web Push / VAPID)
- Use the Web Push API with **VAPID keys** (free — generate with `web-push`; store public key in env, private in Edge Function env). On permission grant, save the subscription to `push_subscriptions`. (FCM not required; standard Web Push works on Android/Chromium and on iOS 16.4+ installed PWAs.)
- A `send-push` Edge Function sends notifications for the triggers in §8.10, driven by the scheduled jobs (streak reminders) and event triggers (rank-up, project updates). Respect `notification_prefs` + permission. Include a small icon/badge and deep link into the relevant screen.
- iOS caveat: push only works when installed to home screen (iOS 16.4+) — surface this in the install flow.

---

## 13. SCHEDULED JOBS & DAILY LOGIC (the "every 00:00" behaviors)

Use **Supabase pg_cron + pg_net** (call Edge Functions on schedule) for these. All day math in **America/Argentina/Buenos_Aires** for v1 (store per-user tz now; switch to per-user computation later — keep the tz column and helpers ready).

### 13.1 Daily reset of the Daily Set (00:00 BA)
- Daily streak actions are **date-scoped**: the Daily Set and the "done" checkmarks are queried against `local_date = today`. At 00:00 a new day begins, so the previous day's checks naturally clear and a fresh Daily Set is generated. Implement generation either by a 00:00 job that precomputes each active user's set, or lazily on first open of a new local day (store the generated set per user/day in a `daily_sets` table or in `app_state`/cache). Lazy generation is cheaper at scale — prefer lazy, with the job as optional warmup. **Net effect the owner asked for: daily habits auto-uncheck and refresh every day at 00:00.**

### 13.2 Streak maintenance (daily job, runs just after 00:00 BA)
For each user: look at whether they completed ≥1 daily action on the **previous** local day.
- If yes → streak already incremented when they acted (handled in `complete_activity`: if `last_streak_date` was yesterday, today's first daily action sets streak+1 and updates `last_streak_date=today`; if it was already today, no double count; if it was older than yesterday, the streak had been reset).
- The nightly job's role: detect users whose `last_streak_date` is **before** yesterday (i.e., they missed a full day) and, if they hold a **streak freeze**, consume one and keep the streak (set `last_streak_date` to yesterday so today can continue); otherwise **reset** `current_streak=0`, send a gentle "perdiste la racha" notification, and recompute `mundo_state` liveliness (dim, not destroy). Update `longest_streak`.
- Streak freezes: granted occasionally (e.g., at certain rank-ups or as a goal reward); `use_streak_freeze` consumes. Surface "tenés X protectores de racha."

### 13.3 Daily challenge rotation (00:00 BA)
- A job selects/sets the active daily challenge (`challenges` type='daily') in `app_state.current_daily_challenge` from a pool, avoiding immediate repeats. Reset/initialize `user_challenges` progress lazily on first interaction.

### 13.4 Weekly featured activities (weekly, e.g., Monday 00:00)
- A job flips `is_featured`/`featured_week` to surface **1–2 new catalog activities** that week ("Nuevas esta semana"). Maintain a rotation pointer in `app_state` so it cycles through the catalog over time and can introduce genuinely new activities the owner adds later. This satisfies "adding one or two per week to keep challenges fresh."

### 13.5 Weekly leaderboard snapshot (weekly)
- Snapshot weekly XP (sum of completions in the week) into a `weekly_scores` table for the "Esta semana" leaderboard and weekly recap notifications. Optionally award badges to weekly top performers.

### 13.6 Goal period rollover (daily check)
- Expire goals past `ends_at`: mark completed/failed, archive, grant rewards for completed ones, and auto-renew recurring ones for the next period.

### 13.7 News refresh (every 6–12h)
- Run `refresh-news` (§10.3).

### 13.8 Recommendation refresh (daily)
- Refresh the cached Gemini recommendations per active user (throttled, quota-aware) so "Para Vos" stays fresh without per-load AI calls.

> Document every cron schedule in `/supabase/migrations/*_cron.sql` with comments, and provide an idempotent re-run. Provide a Vercel Cron fallback config (`vercel.json`) for the news/recommendation/streak jobs in case pg_cron isn't desired, but pg_cron is the primary.

---

## 14. SEED DATA (build all of this into `/supabase/seed.sql` + migrations)

> Seed every item below. Format per activity: **Título ES | effort | impact | verification | base_points | frequency**. English titles: generate `title_en` by translating (or leave null for now — `es` is the active locale). Provide a `short_es`, `description_es`, `instructions_es`, and `impact_equivalency_es` for each (Claude Code writes warm, concise Spanish copy in Pip's brand voice — 1 line short, 2–4 line description, 2–4 step instructions). Assign `icon` to the domain icon (bespoke icons for high-traffic items). Point values follow the §6 grid; tune as written.

### 14.1 DAILY STREAK ACTIONS — `type='daily'`, `frequency='daily'`, `verification='honor'` (repeatable once/day; the Daily Set draws from this pool)

**Agua**
1. Ducha corta (≤5 min) | easy | low | honor | 50 | daily
2. Reutilizá el agua para regar las plantas (balde en la ducha/cocina) | easy | medium | honor | 100 | daily
3. Cerrá la canilla mientras te cepillás o enjabonás | easy | low | honor | 50 | daily
4. Lavá los platos con la canilla cerrada | easy | low | honor | 50 | daily
5. Poné el lavarropas/lavavajillas solo cuando esté lleno | easy | low | honor | 50 | daily

**Movilidad**
6. Caminá un trayecto en vez de ir en auto | medium | high | honor | 150 | daily
7. Andá en bici a algún lado hoy | medium | high | honor | 150 | daily
8. Usá transporte público hoy | easy | high | honor | 100 | daily
9. Subí por la escalera en vez del ascensor | easy | low | honor | 50 | daily

**Energía**
10. Colgá la ropa al aire en vez de usar secadora | easy | medium | honor | 100 | daily
11. Desenchufá los aparatos que no estás usando | easy | low | honor | 50 | daily
12. Lavá la ropa con agua fría | easy | medium | honor | 100 | daily
13. Apagá las luces de los ambientes vacíos | easy | low | honor | 50 | daily
14. Bajá un poco la calefacción o el aire | easy | medium | honor | 100 | daily
15. Cociná con tapa y aprovechá el calor | easy | low | honor | 50 | daily

**Alimentación**
16. Comé una comida sin carne hoy | easy | high | honor | 150 | daily
17. Aprovechá las sobras (día sin desperdicio) | easy | medium | honor | 100 | daily
18. Tomá agua de la canilla en vez de embotellada | easy | low | honor | 50 | daily
19. Reducí los lácteos hoy | medium | medium | honor | 100 | daily

**Residuos**
20. Separá bien tus residuos hoy | easy | low | honor | 50 | daily
21. Llevá tu botella reutilizable | easy | low | honor | 50 | daily
22. Llevá tus bolsas reutilizables a comprar | easy | low | honor | 50 | daily
23. Evitá un plástico de un solo uso hoy | easy | low | honor | 50 | daily
24. Compostá tus restos de comida | medium | medium | honor | 100 | daily
25. Usá tu vaso o termo reutilizable | easy | low | honor | 50 | daily
26. Reutilizá un frasco o envase | easy | low | honor | 50 | daily

**Plantas / Animales / Comunidad / Digital**
27. Regá tus plantas al amanecer o atardecer | easy | low | honor | 50 | daily
28. Dejá agua para las aves o animales hoy | easy | low | honor | 50 | daily
29. Recogé un poco de basura que viste en la calle | easy | low | honor | 50 | daily
30. Borrá mails y archivos viejos que no usás | easy | low | honor | 50 | daily
31. Bajá la resolución del streaming | easy | low | honor | 50 | daily
32. Sacá a pasear / disfrutá afuera sin generar residuos | easy | low | honor | 50 | daily

### 14.2 ACTIVITY CATALOG — `type='catalog'` (the big 150+). Default `verification='honor'` unless marked **[FOTO-IA]** (`verification='photo_ai'`). `frequency` noted; one_time unless stated.

**A — Residuos y Reciclaje (residuos)**
1. Armá una estación de separación de residuos en casa | easy | low | honor | 300 | one_time
2. Empezá a compostar en casa | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
3. Armá una compostera con lombrices (vermicompost) | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
4. Pasá una semana de residuo cero (registralo) | hard | medium | honor | 1500 | weekly
5. Hacé una auditoría de tu basura | medium | low | honor | 500 | one_time
6. Llevá tus residuos electrónicos a un punto certificado | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
7. Llevá pilas/baterías a un punto de recolección | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
8. Cambiá a jabón/champú en barra (sin botella plástica) | easy | low | honor | 300 | one_time
9. Pasate a facturación digital / cancelá correo en papel | easy | low | honor | 300 | one_time
10. Repará algo en vez de tirarlo | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
11. Organizá o participá de un intercambio de ropa | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
12. Doná cosas que ya no usás en vez de tirarlas | easy | low | honor | 300 | recurring
13. Comprá a granel o en estaciones de recarga | medium | medium | honor | 500 | weekly
14. Reciclá correctamente el aceite de cocina usado | medium | medium | honor | 500 | recurring
15. Comprá productos con contenido reciclado | easy | low | honor | 300 | recurring
16. Evitá la moda rápida toda una temporada | hard | medium | honor | 1500 | recurring

**B — Agua (agua)**
17. Instalá un cabezal de ducha de bajo caudal / aireadores | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
18. Arreglá una canilla o inodoro que pierde | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
19. Instalá un sistema de recolección de agua de lluvia | medium | medium | photo_ai | 1000 | one_time **[FOTO-IA]**
20. Reutilizá aguas grises para el jardín | medium | medium | honor | 750 | recurring
21. Instalá inodoro de doble descarga o reductor en la cisterna | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
22. Elegí plantas nativas resistentes a la sequía | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
23. Reportá una pérdida de agua en la vía pública | easy | medium | honor | 500 | one_time

**C — Energía y CO₂ (energia)**
24. Cambiate a una tarifa de energía renovable | easy | high | photo_ai | 1000 | one_time **[FOTO-IA]**
25. Cambiá todas las lámparas a LED | easy | medium | photo_ai | 500 | one_time **[FOTO-IA]**
26. Mejorá la aislación / burletes de tu casa | hard | high | photo_ai | 2000 | one_time **[FOTO-IA]**
27. Instalá un termostato inteligente | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
28. Instalá paneles solares en el techo | hard | high | photo_ai | 3000 | one_time **[FOTO-IA]**
29. Reemplazá un electrodoméstico por uno eficiente (etiqueta A) | hard | medium | photo_ai | 1500 | one_time **[FOTO-IA]**
30. Hacé una auditoría energética de tu casa | medium | medium | honor | 750 | one_time
31. Cambiá a una bomba de calor | hard | high | photo_ai | 3000 | one_time **[FOTO-IA]**
32. Usá regletas inteligentes para cortar el consumo fantasma | easy | low | photo_ai | 500 | one_time **[FOTO-IA]**
33. Ajustá el termotanque a una temperatura eficiente | easy | low | honor | 300 | one_time

**D — Movilidad (movilidad)**
34. Pasá una semana sin auto | hard | high | honor | 2000 | weekly
35. Evitá un vuelo de corta distancia (elegí tren/bus) | hard | high | honor | 2000 | one_time
36. Cambiate a un auto eléctrico o e-bike | hard | high | photo_ai | 3000 | one_time **[FOTO-IA]**
37. Mantené la presión de los neumáticos para ahorrar combustible | easy | low | honor | 300 | recurring
38. Trabajá desde casa y reducí días de viaje | easy | medium | honor | 500 | recurring
39. Sumate a un esquema de bicis compartidas | easy | medium | honor | 500 | recurring
40. Organizá un grupo de auto compartido | medium | medium | honor | 750 | recurring
41. Hacé el compromiso de un año sin volar | hard | high | honor | 2000 | recurring

**E — Plantas y Verde Urbano (plantas)**
42. Plantá un árbol nativo | medium | medium | photo_ai | 1000 | one_time **[FOTO-IA]**
43. Empezá una huerta en el balcón o ventana | easy | low | photo_ai | 500 | one_time **[FOTO-IA]**
44. Cultivá tus propias verduras o hierbas | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
45. Plantá flores nativas para polinizadores | easy | medium | photo_ai | 500 | one_time **[FOTO-IA]**
46. Sumate a una huerta comunitaria | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
47. Convertí parte del césped en plantas nativas / bajo consumo | hard | medium | photo_ai | 1500 | one_time **[FOTO-IA]**
48. Dejá un sector sin cortar para la biodiversidad | easy | low | honor | 300 | recurring
49. Hacé "bombas de semillas" para espacios descuidados | medium | low | honor | 500 | recurring
50. Cubrí los canteros con mantillo para retener humedad | easy | low | honor | 300 | recurring
51. Sumate a una jornada de plantación de árboles | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**

**F — Animales y Vida Silvestre (animales)**
52. Construí un hotel de insectos o casa para abejas | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
53. Poné un comedero o bebedero para aves | easy | low | photo_ai | 500 | recurring **[FOTO-IA]**
54. Dejá un paso/corredor para fauna en tu jardín | medium | medium | honor | 750 | one_time
55. Evitá pesticidas y herbicidas en tu jardín | easy | medium | honor | 500 | recurring
56. Creá un pequeño estanque para anfibios | hard | medium | photo_ai | 1500 | one_time **[FOTO-IA]**
57. Adoptá (no compres) una mascota de un refugio | medium | medium | photo_ai | 1000 | one_time **[FOTO-IA]**
58. Hacé de hogar de tránsito para animales de refugio | hard | medium | photo_ai | 1500 | recurring **[FOTO-IA]**
59. Hacé voluntariado en un refugio o santuario | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
60. Mantené a los gatos adentro para proteger a las aves | easy | medium | honor | 500 | recurring
61. Poné calcomanías anti-choque para aves en las ventanas | easy | low | photo_ai | 300 | one_time **[FOTO-IA]**
62. Elegí pescado/marisco de origen sustentable | easy | medium | honor | 500 | recurring
63. Sacá especies invasoras de tu zona | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
64. Reportá fauna herida a un centro de rescate | easy | medium | honor | 500 | one_time
65. Evitá productos con aceite de palma no sustentable | medium | medium | honor | 750 | recurring
66. Plantá especies hospederas para mariposas | easy | medium | photo_ai | 500 | one_time **[FOTO-IA]**

**G — Alimentación (alimentacion)**
67. Hacé un "Lunes sin carne" cada semana | easy | high | honor | 500 | weekly
68. Pasá una semana 100% a base de plantas | hard | high | honor | 1500 | weekly
69. Comprá productos locales y de estación | easy | medium | honor | 500 | weekly
70. Comprá en una feria/mercado de productores | easy | low | honor | 300 | weekly
71. Planificá tus comidas para no comprar de más | medium | medium | honor | 750 | weekly
72. Rescatá comida excedente (apps tipo "última hora") | easy | medium | honor | 500 | recurring
73. Cultivá hierbas para reemplazar las envasadas | easy | low | photo_ai | 300 | one_time **[FOTO-IA]**
74. Llevá un diario de desperdicio de comida una semana | medium | medium | honor | 750 | weekly

**H — Consumo Responsable (consumo)**
75. Comprá ropa de segunda mano / vintage | easy | medium | honor | 500 | recurring
76. Repará tu ropa (zurcido visible) | medium | low | photo_ai | 500 | recurring **[FOTO-IA]**
77. Hacé un mes sin compras innecesarias | hard | medium | honor | 1500 | recurring
78. Pedí prestado o alquilá en vez de comprar (herramientas, ropa formal) | medium | low | honor | 500 | recurring
79. Comprá a marcas certificadas sustentables / B-Corp | easy | low | honor | 300 | recurring
80. Elegí productos con mínimo packaging | easy | low | honor | 300 | recurring
81. Ordená y revendé/doná lo que no usás (economía circular) | medium | low | honor | 500 | recurring
82. Usá una biblioteca (libros, herramientas, "biblioteca de cosas") | easy | low | honor | 300 | recurring
83. Comprá electrónica reacondicionada | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
84. Cambiá a productos recargables del hogar | easy | low | honor | 300 | recurring

**I — Digital y Tecnología (digital)**
85. Limpiá tu nube y borrá archivos/mails viejos | easy | low | honor | 300 | recurring
86. Alargá la vida de tu celular (un año más) | easy | medium | honor | 500 | one_time
87. Activá los modos de ahorro de energía en tus dispositivos | easy | low | photo_ai | 300 | one_time **[FOTO-IA]**
88. Desuscribite de newsletters y mails que no leés | easy | low | honor | 300 | one_time
89. Reciclá tus dispositivos viejos responsablemente | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**

**J — Comunidad (comunidad)**
90. Organizá o sumate a una jornada de limpieza del barrio | medium | medium | photo_ai | 1000 | recurring **[FOTO-IA]**
91. Creá o sumate a un grupo ambiental local | hard | high | honor | 2000 | recurring
92. Escribí a un representante local por un tema ambiental | medium | medium | honor | 750 | one_time
93. Dictá un taller o charla ambiental (escuela/club) | hard | medium | photo_ai | 1500 | recurring **[FOTO-IA]**
94. Organizá un "café de reparación" comunitario | hard | medium | photo_ai | 1500 | recurring **[FOTO-IA]**
95. Armá una biblioteca de herramientas o de semillas | hard | medium | photo_ai | 1500 | one_time **[FOTO-IA]**
96. Lanzá un reto de barrio contra barrio | medium | high | honor | 1000 | recurring
97. Hacé voluntariado en restauración de hábitats | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
98. Juntá firmas por ciclovías o espacios verdes | medium | medium | honor | 750 | one_time
99. Sé mentor/a de alguien nuevo en la plataforma | easy | low | honor | 300 | recurring
100. Coordiná un grupo de auto compartido en el trabajo/escuela | medium | medium | honor | 750 | recurring

**K — Océanos y Ríos (agua_azul)**
101. Participá de una limpieza de costa/río/lago (registrá lo juntado) | medium | medium | photo_ai | 1000 | recurring **[FOTO-IA]**
102. Adoptá una boca de tormenta (mantenela despejada) | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
103. Evitá microplásticos (bolsa para microfibras al lavar) | easy | medium | photo_ai | 500 | one_time **[FOTO-IA]**
104. Usá protector solar amigable con los arrecifes | easy | low | honor | 300 | recurring
105. Sumate a un programa de monitoreo de cuencas | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
106. Desechá medicamentos correctamente (no por el desagüe) | easy | medium | honor | 500 | recurring

**L — Aire y Suelo (aire_suelo)**
107. Evitá quemar residuos al aire libre | easy | medium | honor | 500 | recurring
108. Usá cortadora manual o eléctrica en vez de a nafta | medium | low | photo_ai | 500 | recurring **[FOTO-IA]**
109. Mejorá la salud del suelo (cobertura, sin labranza) | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
110. Evitá compost a base de turba | easy | medium | honor | 500 | one_time
111. Plantá para dar sombra y enfriar la ciudad | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**
112. Reducí el uso de leña / usá cocinas más limpias | medium | medium | honor | 750 | recurring
113. Armá un cantero alimentado con compost | medium | medium | photo_ai | 750 | one_time **[FOTO-IA]**

**M — Ciencia Ciudadana (ciencia)**
114. Registrá una observación de biodiversidad (estilo iNaturalist) | easy | medium | photo_ai | 500 | recurring **[FOTO-IA]**
115. Hacé un conteo de aves (estilo eBird) | easy | medium | photo_ai | 500 | recurring **[FOTO-IA]**
116. Reportá mediciones de calidad de aire/contaminación | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
117. Subí un geo-tag de basura encontrada (estilo Litterati) | easy | low | photo_ai | 300 | recurring **[FOTO-IA]**
118. Participá de un "bioblitz" / Desafío Naturaleza Urbana | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
119. Monitoreá una población local de polinizadores | medium | medium | photo_ai | 750 | recurring **[FOTO-IA]**
120. Fotografiá fenología (primera floración, migración) | easy | medium | photo_ai | 500 | recurring **[FOTO-IA]**
121. Reportá avistajes de especies invasoras | easy | medium | photo_ai | 500 | recurring **[FOTO-IA]**

> The above is **121 catalog activities**; combined with the **32 daily actions = 153 total**, exceeding the 150 target. Claude Code may add a handful more per domain to enrich (keep the field discipline). Maintain a `pool` of additional/seasonal activities to feed the "1–2 new per week" rotation (§13.4) — seed ~15 extra `active=false` catalog activities reserved for weekly release so the app keeps introducing new challenges out of the box.

### 14.3 Ranks — seed the 11 ranks from §5.1 (slug, names, tier, xp_threshold, color, unlock_description_es). Divisions computed in code.

### 14.4 Titles & badges — seed ~35 titles (§7.1, all 13 domains' 3-tier mastery + rank-based + behavior-based) and ~25 badges (§7.2). Provide name_es, description_es, icon, rarity, and requirement fields.

### 14.5 News sources (RSS/Atom — free; `refresh-news` pulls these)
Seed a configurable list (store in `app_state.news_feeds`), e.g.: Mongabay (and Mongabay Latam), Grist, Yale e360, The Guardian Environment, UN Environment news, National Geographic Environment, plus Spanish/LatAm where available (e.g., Agencia Tierra Viva, Infobae/Clarín secciones ambiente if RSS exists). Make the list editable. Respect each feed's terms; only summarize + link out.

### 14.6 Sample challenges & projects (so the app isn't empty on first run)
- Seed ~10 daily challenges (pool), ~6 weekly challenges (incl. one domain-specific and one `min_rank='arbol'` gated), and ~2 seasonal (e.g., "Semana del Agua", "Bioblitz de Primavera").
- Seed ~4 example community projects in CABA neighborhoods (a Palermo park clean-up, a Caballito tree-planting, a building recycling drive, a coastal Costanera cleanup) with realistic fields, one `min_rank='plantula'` gated, so the Proyectos feed demonstrates the feature.

### 14.7 Onboarding/Pip copy & impact-equivalency tables
Seed Pip's nudge lines (a rotating pool, Spanish), empty-state copy, and the impact-equivalency reference (per-activity approximate savings used for the handprint stats — keep approximations clearly framed as estimates).

---

## 15. INTERNATIONALIZATION (Spanish now, English-ready)

- `next-intl` with `/messages/es.json` (complete) and `/messages/en.json` (scaffolded — keys present, values may mirror ES or be marked for translation). **No user-facing string is hardcoded in components** — all via `t('key')`. DB content has `_es`/`_en` columns; the app reads the column matching `profiles.language` (fallback `_es`).
- Locale switch in settings updates `profiles.language`; default `es`. Argentine register for ES copy (voseo: "Hacé", "Sumá", "Tenés", "Querés"). Dates/numbers localized via `date-fns` locale `es`.
- Keep the English switch visible but it may show a "Próximamente en inglés" note for any not-yet-translated DB content. The point: future English = translate the JSON + fill `_en` columns, no refactor.

---

## 16. FILE / FOLDER STRUCTURE (Next.js App Router)

```
/ (repo root)
├─ app/
│  ├─ (auth)/auth/...                # login, callback, magic-link
│  ├─ (app)/                         # authenticated shell w/ bottom nav
│  │  ├─ page.tsx                    # Hoy / Home
│  │  ├─ acciones/page.tsx           # catalog + Para Vos
│  │  ├─ acciones/[slug]/page.tsx
│  │  ├─ explorar/page.tsx           # Novedades + Proyectos tabs
│  │  ├─ explorar/proyectos/[id]/page.tsx
│  │  ├─ explorar/proyectos/nuevo/page.tsx
│  │  ├─ explorar/novedades/[id]/page.tsx
│  │  ├─ ranking/page.tsx
│  │  ├─ ranking/[domain]/page.tsx
│  │  ├─ perfil/page.tsx
│  │  ├─ perfil/[username]/page.tsx
│  │  ├─ perfil/objetivos/page.tsx
│  │  ├─ perfil/logros/page.tsx
│  │  └─ perfil/ajustes/page.tsx
│  ├─ onboarding/page.tsx
│  ├─ instalar/page.tsx              # iOS/manual install guide
│  ├─ api/                           # route handlers (thin; prefer Supabase RPC/Edge)
│  ├─ layout.tsx, globals.css, manifest.webmanifest, robots, sitemap
├─ components/
│  ├─ ui/                            # buttons, cards, sheet, toast, etc.
│  ├─ icons/activities/              # illustrated SVG activity/domain icons
│  ├─ mundo/                         # MundoCanvas + 3D pieces (lazy)
│  ├─ home/, acciones/, explorar/, ranking/, perfil/, onboarding/
│  ├─ rewards/                       # point burst, rank-up overlay, particles
│  └─ pwa/InstallBanner.tsx, PushManager.tsx
├─ lib/
│  ├─ brand.ts                       # name, tagline, mascot — single source for rename
│  ├─ domains.ts, ranks.ts, points.ts, titles.ts, mundo.ts
│  ├─ supabase/ (client, server, middleware, types generated)
│  ├─ gemini.ts                      # client wrapper used by Edge fns (shared types)
│  ├─ recommendations.ts             # content-based scorer (client/server)
│  ├─ i18n/ (next-intl config)
│  └─ utils/ (dates-tz, format, haptics, image-compress)
├─ stores/ (zustand)
├─ messages/ es.json, en.json
├─ supabase/
│  ├─ migrations/*.sql               # schema, RLS, RPCs, cron
│  ├─ seed.sql                       # all §14 seed data
│  └─ functions/                     # Edge Functions (Deno)
│     ├─ verify-completion/
│     ├─ recommend-activities/
│     ├─ refresh-news/
│     ├─ send-push/
│     └─ daily-maintenance/          # streak/goals/challenge rotation/featured
├─ public/ (icons, splash, og image, static illustrations, world skeleton)
├─ types/
├─ .env.example, vercel.json (cron fallback), package.json, tailwind.config.ts, next.config.js
├─ README.md (run/deploy), CONTINUE.md (build progress), setup-guide.html
```

---

## 17. ENVIRONMENT VARIABLES (`.env.example` — document each in README + setup-guide.html)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server/edge only — never client
GEMINI_API_KEY=                     # edge functions only
NEXT_PUBLIC_VAPID_PUBLIC_KEY=       # web push public
VAPID_PRIVATE_KEY=                  # web push private (edge only)
VAPID_SUBJECT=mailto:owner@example.com
NEXT_PUBLIC_APP_URL=                # the vercel.app URL
NEXT_PUBLIC_APP_TZ=America/Argentina/Buenos_Aires
```
Edge Functions get `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_*` via Supabase function secrets.

---

## 18. BUILD EXECUTION ORDER (follow this sequence; check items into CONTINUE.md as done)

1. **Scaffold:** Next.js + TS + Tailwind + tokens (§2) + brand.ts + i18n + base layout + bottom nav + theme. Establish the design system & core `ui/` components first so everything looks on-brand from the start.
2. **Supabase project wiring:** client/server helpers, auth (Google + magic link), profiles trigger, middleware-protected routes. Generate DB types.
3. **Schema & RLS:** all migrations (§4), enums, tables, indexes, views, RPCs (`complete_activity` etc.), then `seed.sql` (§14 — ranks, domains, all 153 activities, titles, badges, challenges, projects, news feeds, Pip copy).
4. **Core loop first (most important):** Hoy screen → Daily Set → `complete_activity` → points/streak/rank update → reward animations. Make the central loop feel great before breadth. Then onboarding (ends by completing first daily action).
5. **Ranks/points/titles/badges** end-to-end (server awards + client display + rank-up overlay).
6. **Activity Catalog** + detail + completion + **content-based "Para Vos"** (AI layer can come right after).
7. **Tu Mundo (3D)** — MundoCanvas, state mapping (§9), growth on rank/streak, Pip. Lazy-loaded with skeleton + low-detail fallback.
8. **Explorar:** Proyectos (CRUD, join, upvote, map, rank-gating) + Novedades (after news Edge fn).
9. **Ranking:** global/domain/neighborhood/friends + weekly.
10. **Perfil:** rank, impact (handprint + globe), logros, stats, objetivos (goals), ajustes.
11. **AI Edge Functions:** `verify-completion` (photo flow), `recommend-activities`, `refresh-news`, with caching + fallbacks (§10).
12. **Scheduled jobs (§13):** `daily-maintenance` (streak reset/freeze, challenge rotation, weekly featured, goal rollover) + news/recs refresh via pg_cron; vercel.json fallback.
13. **PWA:** manifest, icons, service worker/offline, **prominent install button** + `/instalar`, Web Push (`send-push` + PushManager) (§12).
14. **Notifications** center + push triggers wired to events/jobs.
15. **Polish:** reduced-motion, a11y/focus, skeletons, empty states (Pip voice), error states, performance pass (3D budget, image compression, query caching), responsive desktop, SEO/OG, README + setup-guide.html finalize.
16. **Acceptance pass** against §19; fix gaps; ensure one clean `npm run build`.

If a context limit is hit at any step: write current status, the exact next sub-task, and any decisions/assumptions into **CONTINUE.md**, then stop. A new session reads CONTINUE.md + this spec and resumes.

---

## 19. ACCEPTANCE CRITERIA (definition of done — verify each)

**Core loop & gamification**
- [ ] New user can sign in (Google or magic link), onboard, and complete a first daily action with full reward animation.
- [ ] Daily Set shows 4–6 personalized daily actions; completing any maintains the streak; completing all grants the +200 session bonus + badge.
- [ ] Daily actions visually reset at 00:00 BA; missing a day breaks the streak unless a freeze is held; streak multiplier applies per §6.2.
- [ ] Catalog (153 activities) browsable by 13 domains with filters/search; completion awards big points; recurring cooldowns + one-time guards enforced **server-side**.
- [ ] 11 ranks × 5 divisions work; XP only increases; division-up and rank-up celebrations fire; top tiers require verified actions.
- [ ] Titles (auto-earned, equippable) and badges (collection wall, locked silhouettes) function across all 13 domains.
- [ ] Points use big numbers (50–3000) exactly per §6; all awards computed in `complete_activity` (client cannot forge).

**AI**
- [ ] Photo verification works on `photo_ai` activities via Gemini, grants +25% on success, friendly reject + retry, **graceful fallback** when quota/down (auto-approve at honor level, no bonus).
- [ ] "Para Vos" feed personalizes (content-based always works; Gemini layer cached + blended; no per-load AI blocking).
- [ ] News feed populates from RSS, AI-summarized in Spanish, interest-scored, personalized order, links out (no full-text reproduction), with heuristic fallback.

**Sections**
- [ ] Proyectos: create (rank ≥ Plántula, enforced server-side), join, upvote, map (Leaflet/OSM), neighborhood filter, rank-gated projects; example projects seeded.
- [ ] Ranking: global / Mi Barrio / Amigos / por dominio, with the user pinned, weekly + histórico, live-ish updates.
- [ ] Perfil: rank+division ring, impact/handprint stats + 3D globe, logros, stats, objetivos (custom weekly/monthly goals with rollover), ajustes (language, theme, notifications, account, privacy).
- [ ] Challenges: daily rotates 00:00, weekly rotate, seasonal + rank-gated ones exist.

**Tu Mundo (3D)**
- [ ] Living 3D world renders, grows with rank/streak/domain, day-night by real time, Pip reacts; lazy-loaded with branded skeleton; low-detail fallback on weak devices; respects reduced-motion; meets the perf budget.
- [ ] Impact globe on Profile.

**PWA & platform**
- [ ] Installable; **prominent install button shows on web until installed**, hides when standalone; iOS `/instalar` guide; works offline (shell + queued completions); Web Push works (installed PWA), respecting prefs.
- [ ] Spanish throughout (voseo), English scaffolding present, no hardcoded strings.
- [ ] Everything runs on free tiers; `.env.example` complete; `setup-guide.html` accurate; `npm run build` passes; deploys to Vercel.

**Quality floor**
- [ ] Mobile-first, responsive to desktop; AA contrast; visible focus; keyboard usable; skeletons + Pip-voice empty/error states; no console errors; RLS on every table; no secrets in client.

---

## 20. WHEN YOU HIT A LIMIT → CONTINUE.md

This is a large build. Do **not** silently stop. Before ending any session, update `CONTINUE.md` with: (a) a checklist of §18 steps marked done/in-progress/todo, (b) the exact next sub-task, (c) any decisions, assumptions, or deviations made, (d) anything the owner must do in a dashboard (so it can be added to setup-guide.html). A fresh session must be able to resume purely from this spec + CONTINUE.md with no lost context. Keep building until the entire app in this spec is complete.

**Build the whole thing. Make it feel alive, friendly, and worth opening every day.**

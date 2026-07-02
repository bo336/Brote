# BROTE — MASTER IMPROVEMENT PLAN

> **HOW TO USE THIS FILE (for Claude):** This is the durable source of truth across context cuts.
> On "continue": read this file, find `## CURRENT STATE`, resume the first unchecked item.
> Update `## CURRENT STATE` + checkboxes after every work block. Commit this file with each push.

## CURRENT STATE
- **Phase:** F1 (quick fixes) — in progress
- **Last done:** Plan written. Live migration 0007 applied (challenge progress in complete_activity + trust model + food reframe). Client wired: types + rewards use server `mundo`/`completions_count`, challenge-complete toasts, reto card refetches. Typecheck clean.
- **Next up:** F1.1 cities UI (lib/data/cities.ts + onboarding + ranking + profile), F1.4 per-completion micro-growth in MundoCanvas, F1.5 ranks screen, F1.6b remove photo UI, F1.7 repo SQL parity, F1.8 deploy+smoke.
- **Live Supabase project:** `swdwulouasdnyorfhrjt` (São Paulo). Old paused project: `abnnjszxlwovpnazmbnu` (backup, deletable once stable).
- **Production:** brote-ft7m.vercel.app (project `prj_ujIZO3VvB6R2IJDYDeEtu7Cho17h`, team `team_BfV3hLZxz7SxTBnQ5AASFqxA`). Merge branch → main → auto-deploy.

---

## A. ANALYSIS (done 2026-07-01)

### What works
Auth (fixed), core loop (complete_activity RPC awards XP/streak/titles/badges), daily set generation, leaderboards, projects, news schema, PWA, i18n, 3D world renders.

### Confirmed bugs / gaps
1. **Reto del día never progresses** — `complete_activity` never writes `user_challenges`. Nothing increments progress. → F1.3
2. **World appears static** — structure only changes at rank-tier thresholds (tier 2 = 1000 XP ≈ 10-20 tasks). Per-task visual change: none. `rewards.ts` does patch mundoState optimistically but structure is tier-gated so nothing visibly grows. → F1.4 (quick) + F2 (real fix)
3. **3D quality** — `MundoCanvas.tsx` is procedural primitives (cones/cylinders, flatShading). No models, no wind, no fire, static. → F3
4. **Neighborhood-centric** UX (16 files reference neighborhood/barrio; `lib/data/barrios.ts` is CABA-only) — user wants cities + "Otra". → F1.1
5. **Anti-meat framing** in ~8 food activities + 2 challenges ("sin carne", "a base de plantas", "reducí lácteos") — reframe to seasonal/local/artisanal/anti-ultra-processed/anti-waste. → F1.2
6. **Photo verification** adds friction; user wants trust-based. → F1.6
7. **News pipeline dependency**: pg_cron `brote-refresh-news` calls the edge function with a Vault secret `service_role_key` that was NEVER SET on the new project → news never refresh. Vercel cron fallback exists (`/api/cron/*`) — verify auth + wire properly. → F6.2
8. **Ranks are opaque** — no screen lists all 11 tiers/thresholds. → F1.5
9. Streak day-over-day + freeze logic exists in `daily_maintenance()` (pg_cron 03:05 UTC daily) — needs a live QA pass. → F6.1
10. `recommend-activities` edge function exists but is never called from the client — dormant AI. → F4

---

## B. PRODUCT DECISIONS (recommendations — confirm or override)

### B1. 3D pipeline (USER DECISION NEEDED — pick one, then F3 unblocks)
The current world is code-drawn primitives. To get "realistic & beautiful" we load real 3D models (GLB) instead:
- **Option A (recommended): AI-generated models.** Meshy.ai or Tripo3D (free tiers) — you type prompts (I'll write them all: "stylized low-poly jacaranda tree, vibrant, game asset"…), download GLB, drop in `public/models/`. I handle compression (gltf-transform/meshopt), loading (drei `useGLTF`), and ALL animation in code. Best quality/effort ratio, consistent style via shared prompt suffix.
- **Option B: free CC0 packs** (Quaternius Ultimate Nature, Kenney, Poly Pizza). Zero cost, instant, proven style; slightly less unique.
- **Option C: buy assets** (Sketchfab/CGTrader, ~$5-30/pack). Highest polish.
Either way, I code: wind-sway vertex shader on foliage, GPU-particle fire with flickering point light, birds on bezier flight paths, butterflies, animated water, drifting clouds, soft day/night tint by local hour, growth "pop" animation when an element appears.

### B2. Mundo Infinito (the differentiator) — design
- Every completion = **+1 visible element** placed deterministically on the island (flower→bush→rock→tree stages), seeded by completion index. The world grows EVERY task, instantly.
- Worlds are **biomes**: 1 Pradera → 2 Bosque → 3 Costa → 4 Desierto Florecido → 5 Selva Nublada → 6 Tundra Aurora → … procedural themes after 6 (palette+params generated from index → truly infinite).
- A world **completes** when its growth bar fills (cost grows ~1.6× per world; world 1 ≈ 40 completions, world 5 ≈ 260…). Ceremony: "Semilla Estelar" → next biome unlocks. Previous worlds remain visitable as an **archipelago** (horizontal swipe).
- Rank/tier still gates cosmetics + Pip evolution; growth is completion-driven so dailies always matter.
- Storage: extend `profiles.mundo_state` jsonb (`worldIndex`, `worldGrowth`, `worldsCompleted[]`) — no table change; computed server-side in `complete_activity`.

### B3. AI layer ("dejalo brillar")
- **Pip Chat** — floating Pip on every screen opens a chat: eco-coach with the user's real context (rank, streak, world, city, interests). Gemini via new edge function `pip-chat`, streaming. THE wow feature for non-AI users.
- **Recap semanal narrado** — AI writes "la historia de tu mundo esta semana" (notification + profile card).
- **Surfaced recommendations** — wire existing `recommend-activities` into Acciones ("Pip te recomienda: … porque tenés balcón").
- **AI onboarding touch** — after interests, Pip writes a 2-line personal welcome.

### B4. Monetization (no ads — they'd poison an eco brand)
- **Freemium "Brote+"** (~USD 3/mo via MercadoPago for AR + LemonSqueezy global): exclusive biome skins, 2× streak freezes/mo, advanced stats, Pip chat priority, early sponsor challenges. Core loop stays 100% free.
- **Semillas** (soft currency) earned by challenges/goals → cosmetic shop (world decorations). Purchasable top-ups later.
- **Sponsored challenges** (schema ready: `sponsor_name/logo`) — local brands sponsor retos; B2B revenue without ads.
- Implementation in F5 (payments need your MercadoPago/LS account — I'll ask then).

---

## C. EXECUTION PHASES

### F1 — Quick wins & fixes (NOW)
- [x] F1.0 Plan written + committed
- [x] F1.3a DB: `complete_activity` v2 — updates `user_challenges` progress (daily/weekly/seasonal by target_metric), awards challenge rewards + notification, returns `mundo`, `completions_count`, `challenges_completed` (live migration 0007)
- [x] F1.6a DB: all `photo_ai` activities → `honor` (trust model), UI photo flow removal pending (F1.6b)
- [x] F1.2a DB: food activities + challenges reframed to seasonal/local/artisanal (live)
- [x] F1.3b Client: `CompleteActivityResult` type + `celebrateCompletion` uses server `mundo` + challenge-complete toast; reto del día card refetches
- [ ] F1.1 Cities: `lib/data/cities.ts` (AR provinces + main cities + "Otra…" free text); onboarding step swap; profile/settings; ranking tab "Ciudad" (new `city_leaderboard` RPC); projects filter. Keep `neighborhood` column but stop surfacing it.
- [ ] F1.4 World v1.5: per-completion micro-growth rendered from `completions_count` (deterministic scatter) so EVERY task visibly adds something (bridge until F2)
- [ ] F1.5 Ranks screen: full tier list (11 ranks, thresholds, "estás acá", what unlocks) — from /perfil and /ranking
- [ ] F1.6b Remove photo UI from activity detail (`[slug]/page.tsx`), keep infra dormant
- [ ] F1.7 Repo parity: mirror live SQL changes into `supabase/migrations/` + seed
- [ ] F1.8 Commit + merge + deploy + smoke test

### F2 — Mundo Infinito v2
- [ ] F2.1 `lib/mundo.ts` v2 model (worldIndex/growth/biomes, procedural themes, growth costs)
- [ ] F2.2 DB: `complete_activity` computes world growth + world-complete ceremony event; migration for recompute of existing users
- [ ] F2.3 Mundo UI: growth bar, biome themes, archipelago swipe between completed worlds, Semilla Estelar ceremony (confetti + modal)
- [ ] F2.4 Home hero: "tu mundo creció" micro-feedback per completion (element pop-in animation)

### F3 — 3D & animation overhaul (BLOCKED ON: user picks B1 option / provides GLBs)
- [ ] F3.1 Asset list + prompts doc (`docs/3D_ASSETS.md`): every model needed (trees ×3 stages, flowers ×4, bushes, rocks, pond, bird, butterfly, Pip stages, fire/fogata, per-biome sets)
- [ ] F3.2 GLB pipeline: `public/models/`, gltf-transform compression script, drei useGLTF + suspense fallbacks
- [ ] F3.3 Animations: wind vertex shader (foliage), particle fire + flicker light, bird flight paths, butterflies, water shader, clouds, day/night tint, growth pop-in
- [ ] F3.4 Performance: instancing for repeated elements, `dpr` clamp, visibility pause, mobile budget < 60k tris

### F4 — AI layer
- [ ] F4.1 `pip-chat` edge function (Gemini streaming, user context injection, rate limit via app_state)
- [ ] F4.2 Pip floating button + chat sheet UI (all app screens)
- [ ] F4.3 Wire recommend-activities into Acciones (reasons visible) + cron to refresh weekly
- [ ] F4.4 Weekly AI recap (cron → notification + profile card)
- [ ] F4.5 GEMINI_API_KEY: set as edge function secret (USER: get free key at aistudio.google.com)

### F5 — Engagement & monetization
- [ ] F5.1 Semillas currency (earn via challenges/goals) + cosmetics shop (world decorations)
- [ ] F5.2 Brote+ plan gate + paywall screens (payment provider on user's signal)
- [ ] F5.3 Sponsored challenge admin surface (app_state-driven)
- [ ] F5.4 Re-engagement push: streak-risk evening reminder (extend daily_maintenance), weekly recap push
- [ ] F5.5 Referrals: invite link → both get Semillas

### F6 — Full QA sweep (after each phase, deep at the end)
- [ ] F6.1 Streak: simulate day-over-day (SQL time travel on a test user): grows daily, freeze consumes, breaks without freeze
- [ ] F6.2 News: set Vault `service_role_key` OR rewire cron; confirm items appear + rotate; Vercel cron auth
- [ ] F6.3 Every screen click-through (all buttons/links), mobile viewport, dark mode
- [ ] F6.4 Challenge/goal/title/badge award paths; leaderboards; project join/upvote
- [ ] F6.5 Lighthouse + bundle budget; Supabase advisors re-run
- [ ] F6.6 Delete old paused Supabase project once stable

### F7 — Autonomy explainer
- [ ] `OPERACIONES.html` (single file, styled, in repo root + served at /operaciones): how everything self-runs — daily maintenance, challenge rotation, featured rotation, news refresh, AI limits & fallbacks, infinite content guarantees (procedural worlds, activity cooldowns, recurring challenges), what (little) ever needs the owner, and monitoring pointers.

---

## D. WHAT I NEED FROM YOU (as we reach each point)
1. **NOW (F3):** pick 3D option A/B/C (§B1). If A: create Meshy/Tripo account; I hand you prompts, you hand me GLBs (or a link).
2. **F4:** Gemini API key (free, aistudio.google.com) → I'll tell you where to paste it (Supabase edge function secrets).
3. **F6.2:** 1-min Vault secret setup for news cron (I'll give exact SQL/dashboard steps) — or I rewire it keyless.
4. **F5.2:** MercadoPago / LemonSqueezy account when we do payments.

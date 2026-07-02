# BROTE — MASTER IMPROVEMENT PLAN

> **HOW TO USE THIS FILE (for Claude):** This is the durable source of truth across context cuts.
> On "continue": read this file, find `## CURRENT STATE`, resume the first unchecked item.
> Update `## CURRENT STATE` + checkboxes after every work block. Commit this file with each push.

## CURRENT STATE
- **Phase:** F1+F1.9+F2+F3 DONE, F4 core DONE (Pip Chat live w/ fallback) → next: F4.4 recap, F5, F6 QA, F7
- **Last done:** Algorithms pass (live 0010 = repo 0019) + Pip Chat shipped: pip-chat edge function deployed (context-aware Gemini persona, 30/day limit, graceful fallbacks) + floating chat UI in app shell. Build clean.
- **Next up (in order):** (1) F4.4 weekly AI recap (extend a cron → notification). (2) F5 engagement/monetization (Semillas + Brote+ paywall design; needs payment provider decision). (3) F6 QA sweep: visual canvas check w/ test account (preview browser), streak time-travel SQL test, news pipeline (Vault `service_role_key` OR keyless rewire — news table is EMPTY until fixed), mobile perf, click-through, advisors re-run, delete old paused project. (4) F7 OPERACIONES.html.
- **USER ACTIONS PENDING:** GEMINI_API_KEY secret (F4.5) → Pip Chat lights up; merge branch → deploy.
- **Leftovers noted:** projects create form still uses BARRIOS list (fine — physical meetups); `lib/data/barrios.ts` kept only for that. lib/api/catalog.ts uploadVerificationPhoto/triggerVerification now unused (dormant infra, remove in F6 cleanup). Canvas not yet visually verified in browser (F6.3 with test account).
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

### B1. 3D pipeline — DECIDED (user, 2026-07-01): pure three.js, procedural, EXCEPTIONAL
No external models. We craft everything in code at professional quality (Monument Valley / Alto's Odyssey lane):
- **Geometry:** layered procedural trees (trunk lathe + 3-5 foliage blobs w/ vertex jitter), petal-built flowers, rocks from displaced icosahedrons, instanced grass w/ curved blades — NOT bare cones.
- **Materials/light:** gradient sky dome, hemisphere + key light w/ soft shadows, ACES tone mapping, subtle rim, per-biome palettes with HSL variance per instance.
- **Motion:** wind vertex shader (foliage + grass sway, gusts), GPU fire particles + flickering light, birds on bezier paths, butterflies, pond water shader (fresnel + moving normals), drifting clouds, fireflies at night, day/night tint from local hour, element "pop-in" spring on growth.
- **Perf:** InstancedMesh everywhere, dpr clamp [1,2], demand frameloop when idle option, <60k tris mobile budget.
(original options A/B/C discarded)
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
- [x] F1.1 Cities: `lib/data/cities.ts` + onboarding select+Otra; `city_leaderboard` RPC (live 0008); ranking "Mi ciudad" tab; profile pages show city; compra question replaces diet. (Settings city editor pending — settings has no location field.)
- [ ] F1.4 World v1.5: per-completion micro-growth rendered from `completions_count` (deterministic scatter) so EVERY task visibly adds something (bridge until F2)
- [x] F1.5 Ranks screen: /perfil/rangos (full ladder, thresholds, unlocks, progress, "estás acá") linked from profile
- [x] F1.6b Photo UI removed (activity detail + ActivityCard pill); infra dormant
- [x] F1.7 Repo parity: supabase/migrations/0018 mirrors live 0007-0009
- [x] F1.x Settings "Tu perfil": display name + city (select + Otra) editor
- [ ] F1.8 Merge → deploy → smoke test (pending user merge)

### F1.9 — Algorithms deep-pass — DONE (live migration 0010 = repo 0019)
- [x] A1 News scoring v2: quality × exp recency decay (48h half-life, floor 0.05) × graded interest affinity, then greedy source-diversity re-rank (0.7^picks penalty per source).
- [x] A2 ensure_daily_set v2: anti-repetition (last 3 days of sets), one per domain, ≥3 easy of 5 guaranteed, interest-weighted, seeded-stable per day.
- [x] A3 "Para vos" v2: personal-context signals (balcón/jardín/bici/auto/mascota/compra-local → slug keywords + personalized reasons) + effort ramp by rank tier (newbies easy, veterans stretch). profile.context now loaded in getSessionData.
- [x] A4 **CRITICAL FIX** rolling challenge windows: seeded challenges had fixed ends_at → ALL progress silently stopped once expired. daily_maintenance now refreshes windows (daily=24h each run, weekly=Mondays or self-heal, seasonal=regenerate 21d when expired) + resets user_challenges per window (repeatable). Expired windows revived immediately; verified all 18 alive.

### F2 — Mundo Infinito v2
- [x] F2.1 `lib/mundo.ts` v2 model: worldGoal (40×1.55^n), worldProgressFromCompletions (pure fn of lifetime completions — stateless/corruption-proof), 6 hand-designed biomes + procedural themes beyond (biomeFor), MundoState extended (completions/worldIndex/worldGrowth/worldGoal), parseMundoState back-compat
- [x] F2.2 DB (live 0009): brote_world_goal/brote_world_progress/brote_mundo_for(uid); brote_compute_mundo 4-arg; complete_activity v3 detects world completion → notification + `world_completed` in payload; complete_goal/auto_approve/daily_maintenance recompute via brote_mundo_for; all profiles backfilled. Verified: w(40)=world2, w(500)=world5 153/231; SQL==TS math.
- [x] F2.3 Mundo UI: growth bar + biome chip overlay, biome themes, world-complete full-screen ceremony (archipelago swipe between completed worlds → deferred to F5 polish)
- [x] F2.4 Home hero: per-completion element pop-in (damped-spring PopIn on newest spiral element)

### F3 — 3D & animation overhaul (pure procedural three.js — DONE, polish ongoing)
- [x] F3.3 Animations: wind vertex shader (instanced grass), swaying trees/flowers, layered flickering campfire + point light, flap-winged birds, butterflies, pond ripple shader + lilies, drifting clouds, fireflies (night), day/night lighting, growth pop-in, blinking squash-stretch Pip
- [x] F3.x Terrain/dressing: organic displaced island + floating root-rocks, palms/dunes/snow per biome, ACES tone mapping, biome-tinted hemisphere
- [ ] F3.4 Performance pass (F6): instanced flowers/bushes if needed, visibility pause, mobile fps check

### F4 — AI layer
- [x] F4.1 `pip-chat` edge function DEPLOYED (Gemini 1.5-flash, full user-context persona in rioplatense, 30 msg/day rate limit via app_state, playful fallbacks when no key/error — never breaks). Repo mirror in supabase/functions/pip-chat.
- [x] F4.2 PipChat UI: floating Pip FAB (bottom-right, above tab bar) → chat sheet with suggestion chips, typing dots, message bubbles; mounted in (app) layout.
- [x] F4.3 recommend-activities already blended into Acciones scoring (pre-existing wiring confirmed + reasons surface).
- [ ] F4.4 Weekly AI recap (cron → notification + profile card)
- [ ] F4.5 **USER ACTION**: GEMINI_API_KEY → Supabase dashboard → Edge Functions → Secrets → add `GEMINI_API_KEY` (free key from aistudio.google.com). Until then Pip answers with canned fallbacks.

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

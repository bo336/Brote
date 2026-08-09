# BROTE — MASTER IMPROVEMENT PLAN

> **HOW TO USE THIS FILE (for Claude):** This is the durable source of truth across context cuts.
> On "continue": read this file, find `## CURRENT STATE`, resume the first unchecked item.
> Update `## CURRENT STATE` + checkboxes after every work block. Commit this file with each push.

## CURRENT STATE
- **Phase:** F1-F4 DONE, F6 server-side QA DONE, F7 DONE → remaining: F5 (needs payment provider decision), F6.3 visual click-through, F2.3 archipelago polish, F4.4-AI upgrade of recap
- **Last done (this block):** NEWS FIXED + FLOWING (12 articles live; cron rewired keyless w/ anon JWT — the Vault secret dependency is gone; push trigger too; live 0011 = repo 0020). Weekly recap cron (Mondays 10:00 AR, template-based, zero AI deps). Streak time-travel QA on live logic PASSED (T1 first daily → streak 1; T2 next-day → 2; T3 freeze consumed, streak survives; T4 no freeze → reset; correct notifications; challenge completions fired end-to-end; synthetic user cleaned up). RLS perf hardening (live 0012 = repo 0021): (select auth.uid()) once-per-query + deduped SELECT policies — advisors now clean of actionable items. OPERACIONES.html written (repo root, styled, Spanish): crons, infinite-content guarantees, AI fallbacks, owner actions, monitoring, costs.
- **Remaining backlog:** F5 Semillas+Brote+ (blocked on payment provider choice: MercadoPago vs LemonSqueezy — ask user), F6.3 browser click-through + visual canvas check (test account via preview), F6.6 delete old paused Supabase project when confident, F2.3 archipelago swipe, F4.4 upgrade recap to AI-written when GEMINI_API_KEY exists, F3.4 mobile perf pass.
- **USER ACTIONS PENDING:** (1) GEMINI_API_KEY secret → Pip Chat + AI news summaries light up. (2) merge branch → deploy. (3) Optional: VAPID keys for web push.
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
- [x] F4.4 Weekly recap (cron Mondays 10:00 AR → personal notification with real numbers; template-based so it works with zero AI deps; AI-written upgrade later)
- [ ] F4.5 **USER ACTION**: GEMINI_API_KEY → Supabase dashboard → Edge Functions → Secrets → add `GEMINI_API_KEY` (free key from aistudio.google.com). Until then Pip answers with canned fallbacks.

### F5 — Engagement & monetization
- [ ] F5.1 Semillas currency (earn via challenges/goals) + cosmetics shop (world decorations)
- [ ] F5.2 Brote+ plan gate + paywall screens (payment provider on user's signal)
- [ ] F5.3 Sponsored challenge admin surface (app_state-driven)
- [ ] F5.4 Re-engagement push: streak-risk evening reminder (extend daily_maintenance), weekly recap push
- [ ] F5.5 Referrals: invite link → both get Semillas

### F6 — Full QA sweep
- [x] F6.1 Streak time-travel test PASSED on live logic (grow, increment, freeze-consume, break; correct notifications; QA user cleaned)
- [x] F6.2 News FIXED: cron rewired keyless (anon JWT), fired now → 12 articles live; refreshes every 8h + 30-day archival; push trigger also keyless
- [ ] F6.3 Every screen click-through (browser, test account), mobile viewport, dark mode, visual canvas check
- [x] F6.4 Challenge award path verified end-to-end (QA user completed 2 retos organically during streak test)
- [x] F6.5 Advisors re-run + RLS perf hardening applied (live 0012 = repo 0021); remaining lints are INFO unused-index (no traffic yet) — normal
- [ ] F6.6 Delete old paused Supabase project once stable

### F8 — "Juego profesional" 3D v3 — SHIPPED (2026-07-02)
- [x] F8.1 Procedural texture engine (grassField/bark/foliage/rock/softDisc canvas textures, map+bump, biome-tinted)
- [x] F8.2 Atmosphere: sky-dome shader w/ sun glow, fog, sun/moon sprite, dual key+fill lights, 2048 shadows
- [x] F8.3 Terrain v3: mounds, radial lush→dirt cap, mountains w/ snow caps (world 2+/4+), blob shadows everywhere
- [x] F8.4 Water v2: glinting foam-edged pond + river + waterfall over the rim + drifting mist
- [x] F8.5 Flora v3: curved-blade clustered grass (240-460 instanced, gust shader), curved textured trunks, fluttering canopies
- [x] F8.6 Life: kayak w/ paddler on pond (world 3+); birds/butterflies/fireflies/campfire kept
- [x] F8.7 Interactivity: tap sparkles, zoom (4.2-8.5), "💧 Regar +50" in-world daily action w/ rain FX — VERIFIED end-to-end in browser (growth 20/62→21/62 live)
- [x] F8.8 Canvas sizes: home/profile 320, onboarding 280 (non-interactive)
- [x] F8.9 Visual verification loop ran: dev server + QA account (visual-qa@brote.dev / VisualQA2026!, uid …0002 — KEEP for future checks); caught+fixed a REAL shader-compile-storm freeze (customProgramCacheKey now shared: 'brote-canopy'/'brote-grass'). Full pixel screenshot pending user opening the preview window (browser pauses rendering while occluded — not an app issue).
- [x] F8.10 v4 "DIORAMA" PASS (user feedback 2026-07-03: too dark at night, sparse, small, wants photo-diorama style + free camera + fullscreen + no-points care interactions):
  island 2.4→3.4 (+45%), dense instanced CONIFER FOREST ring that densifies with world pct (4 draw calls), wooden BRIDGE over the river, grazing DEER (growth 12+/24+), drifting DUCKS, cozy CABIN at 50%, finer denser grass (620-1000 blades), trees +45% taller, Pip 0.78×, moonlit-readable NIGHT (never a black blob), free camera (pan+orbit+zoom 3.4-13 w/ damping), FULLSCREEN toggle (⛶), tilt-shift blur bands + vignette (diorama finish), CARE TOUCHES: tapping trees/bushes → hearts + care_world() RPC (live 0014 = repo 0022): +1 growth each, max 5/day, ZERO points; complete_activity folds bonus_growth into world math. Verified in browser: world renders, chip/growth/fullscreen/water present, care 21→22 growth. Dev-cache corruption (.next) diagnosed+cleared during verification (tooling, not app).
- [x] F8.11 v4.5 "no more lego" (user 2026-07-03: grass wrong, elements read as stacked blocks): grass rebuilt as alpha-textured crossed-quad TUFTS (9 painted blades each × 1150-1800 instances = continuous meadow), N8AO screen-space ambient occlusion + subtle Bloom via @react-three/postprocessing (contact darkening = cohesive scene), ROOT SKIRTS blending trunks into soil, GROUND COVER (110 pebbles + 46 moss patches instanced), sky dome 34u (covers zoom-out). Verified in browser (WebGL OK, no errors).
- [x] F8.12 v5 "foliage cards" (user 2026-07-03: conifers = straight lines, needs reference-level detail): conifer cones REPLACED by instanced leaf-cluster card clouds (26/tree × 48 trees, 1 draw call, height-graded color dark→sunlit + jitter); deciduous trees get 20-card shells over blob cores; winding DIRT PATH (cabin→centre→bridge, CatmullRom tube); props: stump, mossy fallen log, mushroom clusters, fence at cabin; ☀️/🌙 day-night preview toggle (users kept judging the world at night); preserveDrawingBuffer for capture. Verified in browser, no errors.
- [x] F8.13 v6 "el mundo crece de verdad" (user 2026-07-04): GROWING FOOTPRINT — worldSizeFactor(worldIndex,pct) 0.78→1.32 scales the actual land (island cap+side+soil, grass boundary, conifer ring, growth spiral, waterfall/bridge rim, rain, tap disc, contact shadows) so world 1 starts small and every world physically EXTENDS it; ground RELIEF (interior undulation, never flat); LIVING WATER (vertex wave trains + wandering distorted highlights + double glints on all water); SECOND LAKE world 4+; hopping RABBITS world 2+/3+; news retention answered+implemented (30d archive existed, NEW 60d hard delete via brote-news-retention cron [live + repo 0024]; math: ~36 rows/day ≈ 25MB/year — never a problem). ANALISIS.html written (repo root): market comparables, 3 revenue scenarios w/ full math, 3 growth engines, risks, 90-day plan. Verified in browser (WebGL OK, zero errors).
- [ ] F8.14 NEXT ART LEVERS: DepthOfField in fullscreen, selective photo-textured GLB heroes (cabin/bridge), per-biome prop sets, ambient audio.

### F9 — Avatares personalizados (Snapchat-style, adapted)
- [x] F9.1 **Pip personalizable** v2 (user: "Snapchat level"): now 4 DIMENSIONS — 6 palettes × 9 hats (+honguito/moño/vincha/estrella) × 4 glasses (redondos/sol/corazones) × 4 body patterns (pecas/lunares/rayitas) = 864 combos; customizer has Color/Accesorio/Anteojos/Estampa sections w/ live previews. Verified in browser. TODO: 3D Pip picks up style; Semillas-locked premium items; more dimensions (mouths/eyes/backgrounds/auras) toward F9.2 human avatars.
- [ ] F9.2 **Avatar humano por capas** (phase 2): SVG layer builder (skin/hair/eyes/outfit), shown in perfil/ranking/proyectos. No external SDK needed.

### F10 — Research-driven features (competitive synthesis: Duolingo/Forest/Finch/Strava/BeReal)
- [x] F10.1 **Ligas semanales** SHIPPED: stateless weekly_league(uid) RPC (cohorts of 20 by this-week XP; Liga Gaia→Semilla by group; zero maintenance) + "Liga" tab FIRST in /ranking (league header, my position chip, promotion top-5 green / relegation bottom-3 red zones, "(vos)" highlight). Live 0016 = repo 0023. Verified in browser with real data. NOTE: caught temp-table-in-STABLE-function bug during smoke test, fixed with pure CTEs.
- [x] F10.2 **Compartir tu mundo** SHIPPED: 📤 button on the world → captures the LIVE WebGL frame (preserveDrawingBuffer) → composes 1080×1350 branded card (world shot + "Mundo N · biome" + growth + streak + logo + URL) → Web Share API w/ download fallback.
- [x] F10.3 **Visitar mundos** SHIPPED: league rows link to /perfil/[username] ("visitar 🌍"); public profile world now non-interactive (was a bug: care/water buttons acted on YOUR profile while visiting) + 300px.
- [ ] F10.4 **Muro del proyecto** (social proof): completions feed per project + photo moments (opt-in).
- [ ] F10.5 **Metas con amigos** (Forest-style co-op): shared weekly goal, both lose progress if either misses — social accountability.

### F11 — Monetization & habit engine (docs/MONETIZACION.md + implementation)
- [x] F11.1 docs/MONETIZACION.md written (Brote+ freemium, Semillas, rewarded-only ads, sponsored B2B retos, Hook-model habit engine, metrics)
- [ ] F11.2 Semillas ledger + cosmetics shop (Pip accessories/biome skins) — spend path for F9
- [ ] F11.3 Brote+ (MercadoPago AR + LemonSqueezy global): 2× freezes, exclusive biomes/accessories, ligas premium badge, AI recaps
- [ ] F11.4 Rewarded ads ONLY (opt-in video → streak freeze / Semillas; never banners — they kill eco-brand trust)
- [ ] F11.5 Sponsored challenges B2B (schema ready: sponsor_name/logo)

### F12 — PLATAFORMA v2 — SHIPPED 2026-08-02 (live 0017-0020 = repo 0025)
- [x] F12.1 **Tipos de cuenta** kid/teen/adult: profiles.account_type/birth_year/guardian_email; age_groups[] on activities+news+challenges; 168 activities hand-tagged (53 kid-safe, 34 adult-only); enforced in ensure_daily_set, complete_activity (raises if mismatched), challenge loop, news feed, competitions; AI voice adapts per age; onboarding asks in 1 tap. `organizations` + join codes + org_leaderboard ready for schools/clubs.
- [x] F12.2 **Impacto real**: 4 impact columns seeded per activity; brote_user_impact/_since; lib/impact.ts equivalence engine; ImpactCard on Inicio; per-completion toast.
- [x] F12.3 **Puntos windowed**: lifetime XP → world/badges/ranks only; leagues + competitions score their own window; my_weekly_points().
- [x] F12.4 **Competencias**: create private/public + code, join, discover, live leaderboard (/competencias, /competencias/[id]).
- [x] F12.5 **Acciones grupales**: complete_group_action — all participants rewarded, x1.25→x3 by crew size.
- [x] F12.6 **Hábitos**: user_habits (max 5), own streak, +100 @7d / +500 @30d; HabitsCard on Inicio; "Seguir" on activity pages.
- [x] F12.7 **Eco-experto IA**: pip-chat expert mode (temp 0.4, admits uncertainty, ends with one action), header toggle, own daily cap.
- [ ] F12.8 NEXT: kid-specific news tagging (feed currently teen+adult by default — kid feed is empty until items are tagged `kid`); org UI (create/join school) — RPCs live but no screen yet; guardian consent flow; Brote+ gating of expert mode.

### F13 — MONETIZACIÓN: AdSense + Brote+ (MercadoPago)
**Hard rules that drive the design (not optional):**
1. **NEVER show ads to `kid` accounts.** COPPA/GDPR-K: child-directed traffic cannot get personalized ads, and mixing kids with ad tech is the fastest way to lose an AdSense account. Kids get zero ads, full stop. Teens get non-personalized only.
2. **Never break the core loop.** No ads on the world hero, during completions/celebrations, in onboarding, or inside the daily-set flow. Ads live in *browsing* surfaces (news, catalog, ranking) and at natural stopping points.
3. **AdSense has no true "rewarded video" for regular sites** (that's AdMob for native apps / H5 Games Ads). So the planned "watch a video for a streak freeze" must NOT be promised on AdSense — it needs Ad Manager/H5 or a native wrapper later. Documented as a future path, not shipped as a lie.
4. **Consent**: default to NON-personalized ads; only personalize after explicit opt-in. EEA traffic legally needs a certified CMP — documented for later, with a safe default now.

- [ ] F13.1 DB: `profiles.plan`/`plan_expires_at`, `subscriptions` table (provider, external ref, status, period), `brote_is_pro(uid)`, RLS.
- [ ] F13.2 Ad policy engine (`lib/ads/policy.ts`): one place deciding *whether*, *where*, and *how often* — account type, plan, onboarding state, per-session and per-placement frequency caps, personalization consent.
- [ ] F13.3 AdSense integration: script loader, `<AdSlot>` (responsive, reserves height to avoid layout shift, never renders empty), placements: in-feed news (every 4th), news article footer, ranking footer, catalog footer.
- [ ] F13.4 "Moment" interstitial: after closing the 3rd news article in a session — capped 1/session, ≥20 min apart, never on first session.
- [ ] F13.5 Consent banner (non-personalized default) + `ads.txt`.
- [ ] F13.6 MercadoPago subscriptions: create-preapproval edge function, webhook (signature-verified) → updates plan, paywall screen `/brote-plus`, manage/cancel.
- [ ] F13.7 Pro gating everywhere: no ads, plus the existing Brote+ perks.
- [ ] F13.8 `PUBLICIDAD.html`: full owner manual (AdSense setup, MercadoPago setup, every placement, caps, maintenance, payouts, how to change things).
- [ ] F13.9 Second pass: re-review placement quality, caps, policy compliance, revenue/UX balance.

### F7 — Autonomy explainer
- [x] `OPERACIONES.html` (repo root, styled, Spanish): the 3 cron jobs, why content never runs out (infinite biomes, rolling challenge windows, activity cooldowns, news rotation), AI layer + fallbacks + rate limits, the only owner actions (Gemini key, VAPID keys — both one-time), monitoring pointers, current costs ($0).

---

## D. WHAT I NEED FROM YOU (as we reach each point)
1. **NOW (F3):** pick 3D option A/B/C (§B1). If A: create Meshy/Tripo account; I hand you prompts, you hand me GLBs (or a link).
2. **F4:** Gemini API key (free, aistudio.google.com) → I'll tell you where to paste it (Supabase edge function secrets).
3. **F6.2:** 1-min Vault secret setup for news cron (I'll give exact SQL/dashboard steps) — or I rewire it keyless.
4. **F5.2:** MercadoPago / LemonSqueezy account when we do payments.

# PHASE 2 — La experiencia

**Paste everything below the line as your second message to the same agent. Nothing else.**

---

Phase 1 is done: the schema, the session composer, the grader and the seed content are live, and `lib/api/academia.ts` wraps every RPC. `/aprender` still renders the legacy screen.

**Phase 2 replaces the entire Academia UI.** At the end of this phase a user can open `/aprender`, see their tree, start a hoja, play a session of any of the 12 exercise types, get graded with sourced explanations, spend savia, earn semillas, and be handed a real action to go do. This is the phase where quality is visible, so quality is the acceptance criterion.

## Read first

1. `ACADEMIA/AGENT-RULES.md` — again, in full. §6 (frontend) and §5 (originality) govern this phase.
2. `BROTE_DESIGN_SYSTEM.md` at the repo root — **binding**. Not a suggestion, not a starting point.
3. `ACADEMIA/design/15-ui-motion.md` — the screen-by-screen spec
4. `ACADEMIA/design/11-exercise-types.md` — §3 (payload contract), §4 (feedback), §5 (accessibility)
5. `ACADEMIA/design/12-economy-savia-semillas.md` — §1 (the savia empty state) and §4 (Brote+ touch points)
6. `ACADEMIA/ACCEPTANCE.md` — Phase 2 section
7. Your own `CONTINUE.md` notes from Phase 1

Study, and reuse rather than reinvent: `components/ui/*`, `components/pip/Pip.tsx`, `components/explorar/PulseStrip.tsx`, `components/explorar/SectionTabs.tsx`, `components/rewards/*`, `lib/rewards.ts`, `stores/toast.ts`, `lib/utils/haptics.ts`.

## Build in this order

### 1 · Migration `supabase/migrations/0039_academia_experience.sql`

Only what the UI turned out to need: any missing index (`ac_entregas (sesion_id)`, `ac_user_concepto (user_id, last_seen)`), the `academia_estado()` and `academia_riego()` RPCs if Phase 1 left them thin, and the `ac_estado_gajo` computation if it needs tuning after seeing real data. Same rules as before: idempotent, RLS, `security definer`, committed **and** applied, then `npm run gen:types`.

### 2 · `/aprender` — El Bosque

Per `15-ui-motion.md` §2. The identity screen of the section.

- **Exactly one** call to `academia_arbol()`. If you need a second round trip, the RPC is wrong — fix the RPC.
- The tree is **inline SVG, drawn**, scrolling bottom-to-top, pinch/wheel zoomable. Trunk at the base, 13 ramas fanning out in their domain colours, gajos as leaf clusters on the branches. Current anillo prominent, outer rings faint.
- One `<defs>` of reusable branch/leaf paths instanced with `<use>`; cull off-screen gajos; stay under ~400 SVG nodes; 60 fps on a mid-range Android. **No WebGL** — `Mundo` owns the three.js budget and a second canvas will cost the frame budget and the battery.
- Gajo states rendered distinctly: `latente` (hairline, no fill, tooltip naming the missing prerequisite), `disponible` (outlined, pulsing tip), `en_curso` (partial fill = mean mastery), `frondoso` (full fill, leaves), `marchito` (desaturated, droop, "regar" affordance).
- Header: eyebrow, one brand-gradient hero headline, savia meter (or a `Brote+` chip when `brote_is_pro`).
- One `PulseStrip`-style dark strip with real `<CountUp>` stats: conceptos frondosos · racha de riego · anillo actual. Never an invented number.
- One primary "next" card with its reason, and — when any gajo is wilted — a hairline-divided free `regar` list.
- Empty/failure state via `<EmptyState>` + Pip + retry. Never a blank screen, never a raw error.
- Under `prefers-reduced-motion`, the tree renders statically.

### 3 · `/aprender/[rama]` and `/aprender/g/[gajo]`

Rama: the gajos of one domain across anillos, `<SectionTabs>`-style ring switching with the sliding `layoutId` indicator, hairline-divided rows (not a grid of boxed cards).

Gajo: the hojas inside, each with state and estimated minutes, plus the conceptos it teaches with their current `fuerza` as small strength meters. This screen is where a user understands *what they actually know* — treat it as an operational, dense screen per the design system, not an airy editorial one.

### 4 · The player — `/aprender/sesion/[id]`

Per `15-ui-motion.md` §3. Full-bleed; hide the top bar and the bottom tab bar.

- Progress bar takes **`0..1`** and clamps. Two callers in the current learning code passed a percentage and sat pinned at 100% from the first render. Do not repeat that bug.
- Feedback **slides up over** the exercise; the exercise stays visible so the user can see what they answered while reading why.
- The **source chip** is always present in the feedback panel and is tappable. It is the trust mechanism and the visual signature at once.
- Correct: `brote-green`, `haptic('success')`. Wrong: `brote-coral`, `haptic('light')`, **no shake, no red flash, no failure sound.** Mistakes cost nothing but a re-queue.
- Pip appears exactly three times, never more: opener (new hoja only), once after three consecutive wrong answers, and on results.
- `✕` → confirm sheet; abandoning within 60 s with zero answers refunds the savia (server-side).
- Never hold the answer in client state. Grade through `academia_answer` and render what it returns.

### 5 · Twelve exercise renderers — `components/academia/ejercicios/`

One file per type, all consuming `payload_publico` and rendering the grading response:

`OpcionMultiple` · `MitoODato` · `OrdenarSecuencia` · `ClasificarEnCestos` · `Emparejar` · `EstimacionNumerica` · `RankingImpacto` · `ElegirLaAccion` · `CadenaCausal` · `DetectarGreenwashing` · `MapaLocalizar` · `CompletarFrase` — plus the two presentation cards `Microlectura` and `DatoVivo`.

Notes that will otherwise cost you a rewrite:

- **No drag-and-drop library.** Pointer events plus framer-motion `layout`. And per `11-exercise-types.md` §5, tap-to-select→tap-to-place is a **first-class path, not a fallback**, with full keyboard operation (arrows to move focus, space to pick up and drop, escape to cancel) and a Spanish live region announcing every move. An exercise that cannot be completed by keyboard does not ship.
- `EstimacionNumerica` uses a real `<input type="range">` with `aria-valuetext` in Spanish and a log scale where the design specifies one. Reveal the true value against the user's guess on a small scale after answering — the reveal *is* the teaching.
- `MapaLocalizar` reuses the existing lazy Leaflet setup from `/explorar/proyectos/[id]`. It **must** offer a named-region multiple-choice alternative for screen readers and for reduced-data users.
- `RankingImpacto` reveals the real numbers per option after answering, with sources. This type exists to break the "all green actions are equal" misconception — the reveal is the whole point.
- `DatoVivo` uses `<CountUp>` and the dark ink strip treatment. It is the section's identity moment; give it the care it deserves.

### 6 · Results screen and the action hook

In the order given in `15-ui-motion.md` §3: Pip → score `<CountUp>` → `+XP` and `+semillas` → up to 4 reinforced-concepto chips with strength meters → **the action hook** → navigation.

The action hook comes from `academia_accion_sugerida` and links to `/acciones/[slug]`. Give it the visual weight of a primary CTA. It is the feature that makes this section belong to Brote rather than to any other learning app — do not render it as a footnote.

Reuse the existing celebration machinery (`stores/rewards`, `lib/rewards.ts`, `toast.points`) rather than inventing a second reward system.

### 7 · Savia, Brote+, streak, nav

- Savia meter in the Academia header; replaced by a small `Brote+` chip for subscribers — the absence of the meter *is* the benefit.
- Savia-empty state exactly as specified in `12-economy-savia-semillas.md` §1: countdown → free `regar` (primary) → a real action worth +1 savia (secondary) → **one calm line** about Brote+. No interstitial, no second upsell surface, no ad path for `account_type = 'kid'`.
- Add "Savia ilimitada en la Academia" to the Brote+ benefits on `/brote-plus` and in `docs/MONETIZACION.md`.
- `/aprender/riego` as the free review entry point.
- Academia activity keeps the daily streak alive and counts toward the weekly league. Wire it through the existing paths — do not duplicate the streak logic.
- Nav: `/aprender` stays in `SECONDARY_NAV`. **The bottom tab bar keeps exactly five tabs.** Improve the home-screen entry card instead, showing savia and the next gajo.
- All chrome strings through `next-intl` (`messages/es.json`, with `en.json` structurally in sync). Content stays in the database.

### 8 · Retire the placeholder

Delete `components/aprender/LessonPlayer.tsx` and the old `/aprender` page bodies only once the new screens are working. Keep the DB tables and RPCs (`lessons`, `lesson_steps`, `user_lessons`, `learning_path()`, `lesson_detail()`, `complete_lesson()`) — Phase 3 retires those. Wire `app_settings.academia_enabled = false` to a graceful legacy fallback.

## Quality bar

"Duolingo-level" here means: nothing snaps, nothing is a bare spinner, nothing is a flat gray dashboard card, every number counts up, every list uses hairlines, every tap has feedback, and the whole thing is usable one-handed on a 375 px screen with a screen reader. Walk `15-ui-motion.md` §6 as a literal checklist before you declare done.

## Definition of done

```
npm run typecheck   → 0 errors
npm run lint        → 0 errors
npm run build       → clean
```

Plus: a real session played end-to-end against the live database for each of the 12 exercise types; the Phase 2 section of `ACADEMIA/ACCEPTANCE.md` walked line by line with explicit pass/fail; a new entry appended to the `## Rollout` section of `BROTE_DESIGN_SYSTEM.md`; and `CONTINUE.md` updated with decisions, deviations and the exact next task.

Do not ask me questions. Take the documented default, log it, keep going.

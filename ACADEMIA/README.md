# ACADEMIA — the Brote learning-section rebuild pack

Everything needed to replace the `/aprender` placeholder with **El Bosque**: a living knowledge tree with growth rings, per-concept mastery that decays, exercises generated from templates rather than authored one by one, savia-limited sessions, semilla rewards, and a hook from every lesson into a real environmental action.

**Put this folder at the repo root** (`Brote/ACADEMIA/`) before starting. The phase prompts tell the coding agent to read from these paths.

---

## How to run it — three messages, no more

| | Message | What comes out |
|---|---|---|
| **1** | Paste `prompts/PHASE-1.md` (everything below its rule line) | Schema, RPCs, session composer, grader, economy, ~450 concepts of seeded curriculum. No new UI yet. |
| **2** | Paste `prompts/PHASE-2.md` | The whole UI: the tree, the player, all 12 exercise types, results, savia, the action hook. |
| **3** | Paste `prompts/PHASE-3.md` | The Gemini generation pipeline, the review queue, ring expansion, decay, ops, docs. Done. |

Give the agent **nothing else**. The prompts are self-contained and point at the specs. If it asks a question, the answer is in one of the design docs — say so and point at the file rather than inventing a new decision, or the phases stop being reproducible.

Between phases, read `CONTINUE.md` (the agent's build journal, already a convention in this repo) and the pass/fail walk of `ACCEPTANCE.md` it produces. A phase with any `fail` is not done — do not move on.

---

## What's in here

```
ACADEMIA/
├── README.md                 ← you are here
├── AGENT-RULES.md            ← binding rules for all three phases. The agent reads this first, twice.
├── ACCEPTANCE.md             ← the pass/fail checklist per phase
│
├── research/
│   ├── 01-duolingo-mechanics-and-ip.md   how these apps work + exactly where the legal line is
│   ├── 02-exercise-engine.md             SRS, item generation, adaptivity, anti-cheat, pipeline ops
│   └── 03-environmental-curriculum.md    the content source: ~450 concepts, Argentine fauna and
│                                          ecoregions, 30+ misconceptions, authoritative sources
│
├── design/
│   ├── 10-el-bosque.md                   the system: trunk → ramas → gajos → hojas → conceptos, rings
│   ├── 11-exercise-types.md              the 12 graded + 2 presentation types, payload contract,
│   │                                      distractor cascade, accessibility
│   ├── 12-economy-savia-semillas.md      daily limits, Brote+, semilla grants, anti-abuse
│   ├── 13-data-model.md                  every table, every RPC, RLS shape, migration plan
│   ├── 14-generation-pipeline.md         batch Gemini, grounding, gate chain, ring expansion
│   └── 15-ui-motion.md                   screens, motion, copy, the non-negotiables checklist
│
└── prompts/
    ├── PHASE-1.md   Fundaciones — engine + content
    ├── PHASE-2.md   La experiencia — the UI
    └── PHASE-3.md   El motor infinito — generation, adaptivity, ops
```

---

## The five decisions everything else follows from

1. **A tree with growth rings, not a linear path.** `tronco → ramas (the 13 existing domains) → gajos → hojas → conceptos`, navigated by a prerequisite DAG. Completing the reachable tree adds an **anillo** — the same branches, deeper. That is where "infinite" comes from, and it is botanically true, which makes it Brote's and nobody else's.

2. **Exercises are templates × slots × seed, not documents.** A `plantilla` has a stem with `{{slots}}`, constraints, and a distractor rule. `seed = hash64(plantilla_id || user_id || nonce)` renders it deterministically. One authored template across five 4-value axes yields over a thousand distinct items. Two users never see the same session; the same user never sees the same item twice.

3. **Mastery decays and gajos wilt.** Per-concept `mastery_ema` + `half_life`. Knowledge you stop practising turns `marchito` on the tree, and watering it is free. Spaced repetition becomes a thing you can *see* rather than a hidden scheduler — and it maps onto Brote's existing "regá tu mundo" gesture.

4. **Savia, not hearts.** The daily limit is consumed per **lesson started** — never per mistake, and never for review. Free users get 5/day, +1 for each real action completed (max 2), +2 for one optional rewarded video; Brote+ is unlimited. Running out points you at a real environmental action before it points at the store.

5. **Every lesson ends in a real action.** The results screen links to a matching row in the existing `activities` catalogue, which runs the existing `complete_activity` RPC — real XP, real impact numbers, real world growth. **No learning app can copy this, because none of them has the other half.** It is the strongest originality argument in the design and the reason the Academia belongs inside Brote.

---

## What the agent is allowed to touch

Scope is listed in `AGENT-RULES.md` §1. In short: the `/aprender` route, `components/academia/**`, `lib/academia/**` and `lib/api/academia.ts`, new migrations from `0038_`, new `academia-*` edge functions, the seed script, the message files, `CONTINUE.md`, and (Phase 3 only) `/panel`. Nothing else.

Old tables (`lessons`, `lesson_steps`, `user_lessons`) and their three RPCs survive all three phases as a rollback path. `app_settings.academia_enabled = false` falls back to the legacy screen without a deploy.

---

## Legal position, in one paragraph

Mechanics — streaks, XP, a soft currency, a daily limiter, leagues, spaced repetition, mastery gates, prerequisite graphs — are unprotectable systems under 17 U.S.C. §102(b), and the case law is settled (*Tetris v. Xio*, *DaVinci v. ZiKo*, *Atari v. Amusement World*, *Lotus v. Borland*). Expression is not: characters, palette-plus-geometry-plus-layout as a combination, copy, sound, artwork and trademarks are all off limits, and *Spry Fox v. LOLApps* is the warning that copying a system **together with** its specific arrangement and theming is how you lose. Hence: no owl, no hearts, no `-lingo`, no borrowed copy, every string written fresh in rioplatense Spanish, and a structure (rings, wilting, action hooks) that is genuinely our own. Details and citations in `research/01-duolingo-mechanics-and-ip.md` §4; the do/don't list is `AGENT-RULES.md` §5. **This is research, not legal advice — run trademark and design-patent clearance with counsel before launch.**

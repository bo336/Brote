# 01 — How habit-forming learning apps work, and where the legal line sits

> Research brief for the Brote Academia redesign. Web research, August 2026. Sources inline and at the end.
> **Bottom line: you can copy the *system* almost entirely. You cannot copy the *look*, the *characters*, the *words*, or the *name*.**

---

## 1. Content architecture

### 1.1 The Path (2022) replaced the branching tree

Duolingo's hierarchy today: **Sections** (mapped to CEFR levels) → **Units** (~10 levels each, with a Guidebook) → **Levels** (the circular nodes: star = lesson, dumbbell = personalised practice, trophy = unit review, book = Story, headphones = Radio) → **Lessons** (up to ~17 questions).

The Path's defining property is that it **removes learner choice**. The old tree let you pick the next skill; the Path forces one next action. That is a deliberate decision-elimination move.

**Brote's divergence — and it is deliberate.** We take the opposite bet: a **prerequisite DAG with readiness states**, closer to Khan Academy's knowledge map. Reason: our content is 13 parallel domains that a user has genuine preferences among (someone who keeps a balcony garden should be able to go to `plantas`), not one language with a linear syllabus. We keep the "one obvious next thing" benefit by *recommending* a next gajo prominently, rather than by removing the alternatives.

### 1.2 How a course is actually authored — the transferable part

1. **CEFR checklists.** Experts write per-level lists of communicative goals, vocabulary and grammar targets.
2. **Pairing.** Vocabulary is deliberately paired with a grammar target so sentences are usable.
3. **Cognitive-load gating.** Roughly one new concept per sentence; everything else recycled.
4. **Volume.** ~2,000+ sentences for the first 30 skills alone; historically 9+ months per contributor-built course.
5. **Content pool → templates.** Exercises are *generated* by applying exercise-type templates to a curated pool. **This is the single most important architectural insight in the whole brief: content is data, exercise types are functions over that data.**
6. **LLM generation (2023→).** Duolingo writes structured prompts with fixed slots (answer count, character limits) and variable slots (level, grammar focus, theme, type), gets ~10 candidates in seconds, and has humans pick and edit. This is what enabled their 2025 expansion to 148 new courses.

Points 5 and 6 are precisely what `ACADEMIA/design/11-exercise-types.md` and `14-generation-pipeline.md` implement.

### 1.3 Exercise-type taxonomy (theirs)

Production/translation: free translate · word bank · sentence shuffle · complete-the-translation.
Recognition: MCQ translation · MCQ cloze · picture flashcard · read-and-respond.
Matching: tap-the-pairs · picture matching.
Listening: type-what-you-hear · MCQ transcription · tap-what-you-hear.
Speaking: ASR-scored pronunciation.
Long-form: Stories (branching dialogue) · Radio · Roleplay / Video Call (LLM, paid tier) · Adventures.

**~10 core templates cover 90% of sessions.** Each is a pure function `(content_item, distractor_pool) → exercise`.

Brote's taxonomy shares the *shape* and none of the *content*: our 12 graded types are native to environmental material (`mito_o_dato`, `ranking_impacto`, `estimacion_numerica`, `detectar_greenwashing`, `mapa_localizar`, `cadena_causal`…). None of them is a translation, a transcription, or a pronunciation exercise.

### 1.4 Session structure

Up to ~17 questions. Missed items are **re-queued to the end of the same session** and must be answered correctly before the lesson completes — a within-session Leitner box of depth 1. Cross-session, misses feed a Practice Hub (Mistakes Review, Words, Speak, Listen, Stories).

Brote copies the within-session re-queue (it is a pure mechanic and it is correct pedagogy) and replaces the Practice Hub with **riego** — free review of wilted gajos, surfaced on the tree itself rather than hidden behind a tab.

---

## 2. Progression and economy

### 2.1 Hearts → Energy, and why Brote does neither

**Hearts (2017–2025):** max 5; one regenerates every ~5 hours; refill 350–450 gems; at zero you cannot start new lessons; unlimited with the subscription.

**Energy (2025→, still A/B tested):** max 25; **every question costs 1 unit whether right or wrong**; +1/hour; correct streaks grant 1–5 bonus; 750 gems for a full refill.

The structural read: **hearts tax *errors*** — a learning-hostile penalty on the exact behaviour learning requires. **Energy taxes *volume*** — better pedagogy, but transparently monetising, and community reception has been strongly negative.

**Brote's Savia taxes neither.** It is consumed per **lesson started**, never per mistake, and **review is always free**. Running out points the user at a real environmental action (worth +1 savia) before it points at the store. See `design/12-economy-savia-semillas.md`. This is simultaneously an originality decision, a pedagogy decision and a brand decision.

### 2.2 The rest

XP (universal activity currency, feeds leagues and quests) · gems/lingots (soft currency) · streak with freezes · daily and friend quests · leagues (10 tiers, ~30 users each, weekly reset, promotion share tightening with tier) · tiered achievements · Super/Max subscription tiers.

Reported correlational retention effects: streak-freeze holders averaged 17.19 vs 11.62 days at the 7-day threshold; D1 retention 33.4% for users who earned an achievement vs 20.4% who did not.

### 2.3 The three numbers worth designing toward (Q2 2026)

- **DAU/MAU ≈ 0.42** (58.7M DAU / 140.6M MAU) — extraordinary for consumer edtech, where 0.10–0.20 is typical.
- **Free→paid ≈ 9.0%** (12.7M subscribers).
- A habit loop cheap enough that a **5-minute session counts as "done."**

Brote already has most of the retention scaffolding (streaks, freezes, leagues, world growth). The Academia's job is to add a second daily reason to open the app that is not weather-dependent or effort-dependent the way a real-world action is.

---

## 3. Learning science

### 3.1 Half-life regression — Duolingo's own published model

```
p  = 2^(−Δ / h)                    forgetting curve
ĥ  = 2^(Θ·x)                       learned half-life
p̂  = 2^(−Δ / 2^(Θ·x))
ℓ  = (p − p̂)² + α(h − ĥ)² + λ‖Θ‖²
```

Features: practice counters (`√` of total/correct/incorrect exposures) plus ~20,000 sparse lexeme-tag indicators. Trained on 12.9M sessions: MAE **0.128** vs 0.235 (Leitner), 0.445 (Pimsleur). Live A/B: **+12% daily retention activity**.

**Brote's simplification** (`design/13-data-model.md` §4) keeps the same shape — an exponential decay over a learned half-life — with a fixed multiplicative update instead of a trained model, because we have no training data on day one and the response log is designed so we can fit one later.

### 3.2 FSRS — the open state of the art

Three variables: Difficulty, Stability, Retrievability, with a **power-law** forgetting curve `R(t,S) = (1 + F·t/S)^(−w20)`. FSRS-6 uses 21 parameters and beats Anki's SM-2 on log loss in **99.6%** of ~10,000 benchmarked collections. A minimal implementation is ~100 lines.

**Recommendation for Brote:** ship the simple decay model, log everything, swap in FSRS behind the same interface once there are tens of thousands of reviews. Do not build a parameter optimiser before then.

### 3.3 Difficulty targeting — the 85% rule

**Birdbrain** is Duolingo's learner model: logistic regression in the IRT family, `P(correct)` from learner ability and exercise difficulty, updated by **one SGD step per exercise** — Elo-like. It runs at ~1 billion exercises/day and the session generator selects items by predicted success probability.

The target zone has real backing: Wilson et al. (*Nature Communications*, 2019) show learning rate is maximised at a training error rate of ~15%, i.e. **~85% correct**. Practical band: **80–85% first-try accuracy**. Above ~90% users are bored; below ~70% they churn.

Brote targets **P\* = 0.82** and measures the live median as an acceptance criterion.

### 3.4 The other levers we adopt

- **Retrieval practice / testing effect** — every node is a test, never a lecture. Their biggest pedagogical bet, and ours.
- **Interleaving** — mix types and topics rather than blocking. Highest-ROI sequencing decision available, and it costs one shuffle.
- **Desirable difficulties** — production is more durable than recognition. Our `estimacion_numerica`, `cadena_causal` and `ordenar_secuencia` are the production-side types.
- **Mastery with regression** — Khan Academy's levels can *drop*. Ours wilt. A mastery latch fills up and the app dies.

---

## 4. The IP boundary — precise, and binding

### 4.1 What is NOT protectable

**17 U.S.C. § 102(b)**: copyright extends to no "idea, procedure, process, system, method of operation, concept, principle, or discovery."

- ***Tetris Holding v. Xio Interactive***, 863 F. Supp. 2d 394 (D.N.J. 2012) — copyright does not protect "the idea of vertically falling blocks, or a player rotating those blocks to form lines and earn points." What *was* protected: the specific board dimensions, the shadow piece, the next-piece display, the landing colour change — **visual expression, not rules**.
- ***DaVinci Editrice v. ZiKo Games*** (S.D. Tex. 2016) — two card games held **mechanically identical**, and still **no infringement**: rules, roles and win conditions are unprotectable.
- ***Atari v. Amusement World***, 547 F. Supp. 222 (D. Md. 1981) — *Meteors* did not infringe *Asteroids*; the shared elements were "inevitable consequences of the idea."
- ***Lotus v. Borland***, 49 F.3d 807 (1st Cir. 1995) — a menu command hierarchy is an uncopyrightable **"method of operation."** Strong authority that functional UI conventions are free.

**Merger** removes protection where an idea has only a few possible expressions (a flame for a streak). **Scènes à faire** removes stock genre elements (an XP bar, a leaderboard, a daily-goal ring).

### 4.2 The counterexample we must respect

***Spry Fox v. LOLApps*** (W.D. Wash. 2012) — motion to dismiss **denied**. The 6×6 grid and generic match-three were filtered out, but the *specific hierarchy of transforming objects* plus the *wild-creature antagonist* plus the overall **selection and arrangement** were protectable, and re-skinning bears as yetis did not save the defendant. The court: *"a court must focus on what is similar, not what is different."*

**Translation for Brote: copying the abstract system is safe. Copying the system *plus* its specific arrangement, sequence, theming and naming is not.** This is exactly why the Academia is a ring-growing tree with wilting knowledge and an action hook, and not a linear path of circles with hearts.

### 4.3 The avoid list

- **Characters.** Duo the owl, Lily, Zari, Junior, Bea and the rest are original audiovisual works. No owl. No green cartoon bird. Brote has **Pip**; use Pip and nothing else.
- **Trade dress.** Their specific green (#58CC02 family), the rounded 3D-shadow push button, the path-node shapes and gold mastery treatment **as a combination**.
- **Copy.** Error strings, celebration copy, the passive-aggressive notification voice, Guidebook text, achievement names.
- **Sound design.** The correct/incorrect chimes and level-up fanfare — cheap to imitate accidentally, easy to prove.
- **Artwork and animation.** All of it.
- **Course content.** Every sentence and Story script is copyrighted text.
- **Trademarks.** DUOLINGO, DUO, SUPER DUOLINGO, DUOLINGO MAX, LINGOT and the owl device are a substantial registered portfolio. **Do not use "-lingo" as a suffix** — that space is actively policed (see the *Unolingo* takedown on itch.io).
- **Design patents.** USPTO guidance of 12 March 2026 broadened design-patent protection for GUIs — drawings need no longer depict a display panel, and projected/AR interfaces now qualify. Design patents cover *ornamental appearance* and, unlike copyright, have **no independent-creation defence**. Run a clearance search before finalising signature animations.

### 4.4 Trade dress in one paragraph

A Lanham Act §43(a) claim needs non-functionality + distinctiveness (product design always requires secondary meaning, *Wal-Mart v. Samara Bros.*, 529 U.S. 205 (2000)) + likelihood of confusion. Individual UI elements are functional and free; **the specific combination, arrangement and styling may not be**. The practical test: could a reasonable person, seeing your icon in a search result or your onboarding screen, believe it is theirs or an official product of theirs?

### 4.5 Scraping and child data

- *hiQ v. LinkedIn* (9th Cir. 2022): scraping **public** data does not violate the CFAA. **But** on remand LinkedIn **won on breach of contract** — the User Agreement's anti-scraping terms.
- Therefore: pulling course content from a competitor is (a) breach of terms, (b) copyright infringement on the sentences, (c) plausibly CFAA-exposed because it is behind auth. **Do not scrape. Generate and ground our own content.**
- **COPPA:** the amended Rule took effect 23 June 2025 — separate parental consent for third-party disclosure, a written retention policy, a written security programme with a designated coordinator and annual risk assessments, biometrics added to personal information. GDPR Art. 8 sets the EU digital-consent age at 13–16 by member state. Brote already has `account_type = 'kid'`; **leaderboards, friend features, push and ad paths are the high-risk surfaces**, which is why `design/12-economy-savia-semillas.md` removes the rewarded-ad route for kids entirely.

### 4.6 The practical checklist

**DO** — streaks, XP, a soft currency, a daily limiter, leagues, spaced repetition, mastery gates, mistake re-queue, ~80–85% difficulty targeting, prerequisite graphs, published algorithms (HLR, FSRS, BKT, IRT/Elo), a mascot of a different species and silhouette, every string written fresh, dated design docs proving independent creation.

**DON'T** — an owl; hearts; the word *lingot*, *legendary*, *Super*, *Max*, or any `-lingo`; competitor league-tier names in their order; their palette + button geometry + node layout together; their Story format with analogous character archetypes (the *Spry Fox* failure mode); scraping; naming a competitor in store metadata; shipping signature GUI animations without a design-patent check.

*Research, not legal advice. Get counsel to run trademark and design-patent clearance before launch.*

---

## 5. What other apps do that Duolingo does not

| App | The structural move worth taking |
|---|---|
| **Brilliant** | **Problem-first, no exposition.** Interactive manipulables instead of MCQs. (Notably, Brilliant has since adopted XP, leagues of 30, and streak charges — the economy converges.) |
| **Khan Academy** | **Explicit mastery states that regress** (Attempted → Familiar → Proficient → Mastered) and a **prerequisite knowledge map**. Duolingo has neither. **Brote takes both.** |
| **Memrise** | User-generated content and native-speaker video clips in real context. |
| **Busuu** | **Human feedback loop** — community corrections plus CEFR certificates. |
| **Elevate/Lumosity** | Per-skill score dashboards with percentile benchmarking; a 3-game daily workout with no path at all. |
| **Sololearn** | **Verifiable grading** — the compiler is the grader. Immediate, objective correctness. |

**Sustainability learning is a thin field.** Reviews of gamified climate apps find they focus on behaviour nudging rather than structured knowledge progression. **There is no Duolingo-class structured environmental curriculum with a learner model.** That is the gap Brote's Academia is walking into — and Brote is the only one of these that can close the loop from a lesson to a logged real-world action with measured impact.

**Synthesis:** Duolingo's *loop* + Brilliant's *item design* + Khan's *prerequisite graph and regressing mastery* + Sololearn's *verifiable grading* + Brote's own *action hook and wilting tree*. Structurally distinct enough to be its own product, borrowing only unprotectable systems.

---

## Sources

- Duolingo blog — [new home screen / Path](https://blog.duolingo.com/new-duolingo-home-screen-design) · [nuts and bolts of course creation](https://blog.duolingo.com/the-nuts-and-bolts-of-course-creation-at-duolingo/) · [LLM lesson generation](https://blog.duolingo.com/large-language-model-duolingo-lessons/) · [Practice Hub guide](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)
- Duoplanet — [learning path](https://duoplanet.com/duolingo-learning-path/) · [Duolingo Score](https://duoplanet.com/duolingo-score/) · [energy system](https://duoplanet.com/duolingo-energy-system/)
- Duolingo Wiki — [exercise types](https://duolingo.fandom.com/wiki/Exercise) · [hearts](https://duolingo.fandom.com/wiki/Hearts) · [energy](https://duolingo.fandom.com/wiki/Energy)
- Settles & Meeder, [*A Trainable Spaced Repetition Model for Language Learning*](https://research.duolingo.com/papers/settles.acl16.pdf) (ACL 2016) · [code](https://github.com/duolingo/halflife-regression)
- IEEE Spectrum — [How Duolingo's AI learns what you need to learn (Birdbrain)](https://spectrum.ieee.org/duolingo)
- [Duolingo Path efficacy whitepaper (2024)](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_language_read_listen_write_speak_2024.pdf)
- [Duolingo Q2 2026 shareholder letter](https://investors.duolingo.com/static-files/3c8277ee-bc94-4f5d-9b77-0db3e46f88b8)
- Deconstructor of Fun — [Duolingo Leagues](https://duolingo.deconstructoroffun.com/mechanics/leagues) · Trophy.so — [gamification case study](https://trophy.so/blog/duolingo-gamification-case-study)
- FSRS — [the algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm) · [benchmark](https://expertium.github.io/Benchmark.html) · [100-line implementation](https://borretti.me/article/implementing-fsrs-in-100-lines)
- Wilson et al., [*The Eighty Five Percent Rule for optimal learning*](https://www.nature.com/articles/s41467-019-12552-4), Nature Communications 2019
- [Khan Academy — how mastery levels work](https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work) · [Brilliant features](https://brilliant.org/help/features/)
- Case law — [Tetris v. Xio](https://en.wikipedia.org/wiki/Tetris_Holding,_LLC_v._Xio_Interactive,_Inc.) · [Spry Fox v. LOLApps](https://en.wikipedia.org/wiki/Spry_Fox,_LLC_v._Lolapps,_Inc.) · [DaVinci v. ZiKo](https://www.gamedeveloper.com/business/texas-court-affirms-game-mechanics-not-protected-under-copyright-law) · [Atari v. Amusement World](https://en.wikipedia.org/wiki/Atari_v._Amusement_World) · [Lotus v. Borland](https://www.bitlaw.com/source/cases/copyright/Lotus.html)
- [Duolingo USPTO portfolio](https://uspto.report/company/Duolingo-Inc) · [itch.io "Unolingo" takedown](https://itch.io/takedowns/2528809)
- [Morgan Lewis — USPTO expands design patent protection for GUIs (Mar 2026)](https://www.morganlewis.com/pubs/2026/03/uspto-expands-design-patent-protection-for-computer-generated-interfaces-and-icons) · [Turley Law — trade dress for digital products](https://turleylaw.com/blog/trade-dress-protection-websites-digital-products)
- [Privacy World — LinkedIn wins breach-of-contract vs hiQ](https://www.privacyworld.blog/2022/11/federal-court-rules-in-favor-of-linkedins-breach-of-contract-claim-after-six-years-of-cfaa-data-scraping-litigation/)
- COPPA — [Koley Jessen](https://www.koleyjessen.com/insights/publications/ftcs-strengthened-childrens-online-privacy-rules-now-in-effect) · [White & Case](https://www.whitecase.com/insight-alert/unpacking-ftcs-coppa-amendments-what-you-need-know)
- [Gamification to prevent climate change: review of games and apps (PubMed 34052619)](https://pubmed.ncbi.nlm.nih.gov/34052619/)

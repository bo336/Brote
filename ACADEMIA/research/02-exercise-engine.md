# 02 — Engineering an infinite, non-hardcoded exercise system

> Research brief. Target stack: Postgres (Supabase) + Next.js + Gemini used **offline in a batch pipeline, never on the request path**. Every formula here is cheap enough to run in Postgres or a route handler in single-digit milliseconds.

---

## 1. Knowledge model

### 1.1 Three layers, not one

Do not model "topics". Model three separate things, because they have different lifecycles:

| Layer | What it is | Churn |
|---|---|---|
| **KC (knowledge component)** | The atomic skill. The unit of mastery tracking. → Brote's `ac_conceptos`. | Slow |
| **Prerequisite edges** | A DAG over KCs. → `ac_concepto_prereq`. | Slow |
| **Item model (template)** | A parameterised generator emitting items for one or more KCs. → `ac_plantillas`. | Fast |

The KC ↔ item mapping is a **Q-matrix** (`ac_plantilla_conceptos`): one item can update several mastery estimates.

**The #1 modelling mistake is conflating the taxonomy with the prerequisite graph.** "Where it lives in the tree" (rama → gajo → hoja) and "what you must know first" (the DAG) are different graphs. Brote keeps them separate on purpose.

### 1.2 Computing what is unlocked

A frontier scan, not a full traversal:

```sql
select k.id
from conceptos k
left join prereq p on p.concepto_id = k.id and p.fuerza >= 0.8
left join user_kc up on up.concepto_id = p.requiere_id and up.user_id = $1
left join user_kc uk on uk.concepto_id = k.id        and uk.user_id = $1
where coalesce(uk.mastery, 0) < 0.85
group by k.id
having bool_and(p.requiere_id is null or coalesce(up.mastery, 0) >= 0.85);
```

For "everything downstream of X" use a recursive CTE with a cycle guard (Postgres 14+ has native `CYCLE ... SET ... USING`). Materialise the transitive closure only past a few thousand nodes.

### 1.3 Knowledge Space Theory, cheaply

ALEKS models ~350 concepts and enumerates only the *feasible* knowledge states, locating a learner in ~25–30 questions. Two operational ideas are worth stealing without the combinatorics:

- **Outer fringe** — KCs the learner is *ready to learn* (all prereqs met). This is the "new content" candidate set — exactly the query above.
- **Inner fringe** — the most recently added, i.e. the fragile ones. This is the "weak review" candidate set.

Approximate the state as `{kc : mastery ≥ θ}` and recompute fringes on the fly. No enumeration needed.

### 1.4 Keeping it infinite

The authoring ceiling comes from authoring *KCs*, not items. Three escapes:

1. **Combinatorial depth.** Parameterise templates across independent axes. Gierl & Lai's worked example yields **256 items from a 1-layer model and 16,384 from the n-layer variant of the same content** — yield is the product of the axes, not the sum.
2. **Taxonomy expansion.** Store the taxonomy as data and let an offline job propose child KCs for any leaf whose learners have all mastered it. Land them `status = 'propuesto'`.
3. **Difficulty extrapolation.** Above the authored ceiling, compose mastered KCs into mixed items whose Q-matrix row has 2–4 concepts. Combinatorially unbounded, and pedagogically legitimate — composition *is* interleaving.

Guard rails: enforce acyclicity with a trigger, cap depth, require human approval before a proposal becomes visible. All three are in Brote's Phase 3 spec.

---

## 2. Item generation

### 2.1 The AIG frame — the load-bearing section

Gierl & Lai's three steps:

1. **Cognitive model** — what the item taps, decomposed into sources of information, **elements** (variables) and **constraints** (which combinations are legal).
2. **Item model** — a template with a **stem**, **options** (key + distractors), and **auxiliary information**. Slots inside these are the elements.
3. **Assembly** — enumerate legal element combinations under the constraints.

The vocabulary that matters:

- **Radicals** — structural features that *change* difficulty. Vary one → a different item.
- **Incidentals** — surface features. Vary these → an **isomorph** of the same item.

Item-model similarity is measurable: 1-layer models averaged **CSI 0.74** (near-duplicates), n-layer **0.53** (genuinely diverse). Use that as the dedupe threshold benchmark.

**The psychometric caveat:** clones are not exactly equivalent — within-family parameter variance is real. **Calibrate difficulty at the template level, with a per-item residual that shrinks toward the family mean.** A brand-new item served as if calibrated is a broken difficulty estimate.

### 2.2 Materialised vs virtual items

Two strategies, and Brote wants both:

- **Materialised** (rows): required for anything with an LLM-written stem, because you must review before serving.
- **Virtual / seeded**: for pure template items, store nothing. Keep `(plantilla_id, seed)` in the delivery log and re-render deterministically with a seeded PRNG. `seed = hash64(plantilla_id || user_id || nonce)`. **This makes the pool literally infinite at zero storage cost** — the single cheapest way to satisfy "nothing hardcoded".

### 2.3 Distractor generation — the rule that decides quality

The Eedi/UMass study over 1.4K real math MCQs with ~4,000 student responses each ranked approaches: **kNN in-context learning > chain-of-thought > rule-based > fine-tuning > sampling**. The damning finding: LLM distractors scored **3.28/5 on validity but only 2.68/5 on plausibility** (humans: 3.99 / 3.72).

> **LLMs generate wrong answers, not the wrong answers students actually pick.**

So: **do not ask a model for distractors free-form.** Use a three-source cascade:

1. **Misconception rules (best).** A per-KC table of documented false beliefs; generate the distractor by *executing the buggy reasoning*. Store the `misconception_id` on the option. When a user picks it you get diagnostic data for free and the explanation can address *that specific belief*.
2. **Structured perturbation.** Numeric: ×10, ÷10, sign flip, unit confusion, off-by-one-step. Categorical: the sibling in the taxonomy.
3. **Semantic neighbours.** Embedding kNN **banded to cosine similarity ∈ [0.55, 0.85]** — closer is ambiguous, further is obviously wrong. Last resort. (`pgvector`'s `<=>` is cosine *distance*; similarity is `1 - (a <=> b)`. This footgun bites everyone once.)

Always shuffle option order **per delivery**, never per item, or key position leaks through the pool.

### 2.4 Quality control — cheapest gates first

```
generate → schema validate → deterministic checks → grounding → dedupe → LLM judge → human queue → live calibration
```

- **Deterministic** (free, catches most failures): exactly one key; options distinct after normalisation; the key is not systematically the longest; every slot filled; numeric answer recomputed by your own solver; no leaked reasoning in the stem.
- **Grounding:** require `{claim, source_id, quote}` triples and **assert the quote is a literal substring of the cited source**. That one string check kills fabricated citations outright. Highest value-per-line in the entire pipeline.
- **Dedupe:** reject above ~0.93 cosine similarity within the same KC+type.
- **LLM judge:** a *separate* call, different prompt, fixed rubric — factual correctness, single defensible answer, distractor plausibility, reading level, cultural assumptions. Return per-dimension 1–5 plus a boolean blocking flag. A published rejection rubric worth copying: *"factual inaccuracies or outdated information, ambiguous wording or more than one potentially correct option, implausible distractors or obvious cues."*
- **Human queue:** sample-review, don't review everything. Route: judge-flagged, a random 5% audit, anything sensitive, anything child-eligible, all curriculum proposals.
- **Live psychometric screening** — the only gate that sees real users. Auto-retire after ≥50 servings when: `p_correct < 0.15` or `> 0.95` (no information); discrimination `< 0.10`; any distractor chosen by 0% (dead option); median latency a wild outlier against its family.

Encouraging baseline: GPT-4o-generated MCQs were statistically indistinguishable from human-authored on difficulty (0.67 vs 0.65) and discrimination (0.29 vs 0.27), and examinees could not identify AI-authored items above chance (0.49). **The ceiling is high — if you screen.**

### 2.5 Variety without repetition

- **Per-user exclusion window** — never an item seen in the last N days or M attempts.
- **Family-level exclusion** — also exclude siblings from the same template within a session. Otherwise "variety" is four isomorphs in a row.
- **Randomesque exposure control** (Kingsbury & Zara) — compute the top-*n* (n ≈ 5–10) most suitable and pick uniformly among them. One line of code, and the standard cheap alternative to Sympson–Hetter. **This is the exposure control to ship.**
- **Progressive-restricted blend** — weight randomness high early in a session, information high late.

---

## 3. Scheduling

### 3.1 SM-2 (baseline, ~20 lines)

```
I(1)=1 · I(2)=6 · I(n)=round(I(n-1)·EF)
EF' = max(1.3, EF + (0.1 − (5−q)(0.08 + (5−q)·0.02)))
q < 3 → restart intervals, keep EF
```

Weaknesses: EF is the only memory state, intervals ignore how long ago you actually reviewed, and it cannot predict a recall probability at all — which you need for session composition.

### 3.2 FSRS (what to build eventually)

Difficulty D ∈ [1,10], Stability S (days to R = 0.9), Retrievability R, with a **power-law** curve:

```
R(t,S) = (1 + F·t/S)^(−w20)          FSRS-5 fixes: R = (1 + (19/81)·t/S)^(−0.5)
I(r)   = (S·81/19)·(r^(−2) − 1)
S0(G)  = w[G−1]        D0(G) = w4 − e^(w5(G−1)) + 1
ΔD = −w6(G−3);  D' = D + ΔD(10−D)/9;  D'' = w7·D0(4) + (1−w7)·D'
S'_success = S·(e^(w8)(11−D)·S^(−w9)·(e^(w10(1−R))−1)·w15^[G=2]·w16^[G=4] + 1)
S'_lapse   = min(w11·D^(−w12)·((S+1)^w13 − 1)·e^(w14(1−R)), S)
```

Read the success term: harder cards grow less, already-stable cards grow proportionally less (`S^−w9`), and **low R at review time grows S more** (`e^(w10(1−R))`) — the spacing effect, encoded. FSRS-6 beats SM-2 on log loss in 99.6% of ~10,000 benchmarked collections.

### 3.3 Half-life regression, approximated

Settles & Meeder learn the half-life: `p = 2^(−Δ/h)`, `ĥ = 2^(Θ·x)`, features `√(n_correct)`, `√(n_wrong)` plus sparse per-item indicators. A no-training approximation that captures most of it:

```
h = h0 · 2^( β_c·√(n_correct) − β_w·√(n_wrong) + kc_bias )
h0 = 1 day,  β_c ≈ 1.0,  β_w ≈ 0.6
```

### 3.4 The pragmatic small-app option — what Brote ships first

One float pair per (user, KC), no scheduler tables:

```
on read:    R = 2^(−days_since_seen / h);   fuerza = mastery_ema · R
on answer:  mastery_ema ← mastery_ema + α(correcto − mastery_ema)      α = 0.30
            h ← clamp(h · (correcto ? 2.2 : 0.45), 0.25, 365)
```

Review priority = `1 − R`. Leitner boxes are the discrete version. **Ship this, log everything, upgrade behind the interface later.**

---

## 4. Adaptive difficulty and session composition

### 4.1 Elo, with the two details everyone forgets

```
P     = 1/(1 + e^(−(θ − d)))
θ    ← θ + K·(correcto − P)
d    ← d + K'·(P − correcto)                 -- mirrored sign
```

**Multiple choice with k options needs a guessing floor** — without it every MCQ over-credits ability:

```
P = 1/k + (1 − 1/k)·1/(1 + e^(−(θ − d)))
```

**Dynamic K** for fast early convergence and later stability: `K(n) = a/(1 + b·n)`, `a = 1.0`, `b = 0.05`, with separate counters for learner and item.

Practical requirement: **~100 responses per item** before its difficulty is trustworthy — which is exactly why new items must inherit their template family's estimate and shrink toward it.

Store θ **per KC or per branch, never globally**. One number for "the user" is useless for selection.

*(Math Garden's high-speed high-stakes scoring folds response time in — `S = (2·correct − 1)(a·d − a·t)` — roughly doubling information per response for fluency skills. Worth adding once basic Elo is stable.)*

### 4.2 IRT and the target success rate

```
1PL:  P(θ) = 1/(1 + e^(−(θ − b)))
Info: I(θ) = a²·P(1−P),  peaks at P = 0.5
```

Information peaks at P = 0.5 — **measurement**-optimal but miserable to practise against. For *learning* you want a target success rate (0.75–0.85 depending on whose research you weight):

```
b* = θ − ln(P*/(1−P*)) / a
```

Then **rank by `−|b − b*|`, take the top 8, pick at random among them.** That is the entire selector.

Duolingo's own CAT work predicts item difficulty *a priori* from linguistic features rather than pilot testing. The transferable lesson: **predict `dificultad_base` from item features at generation time** so a brand-new item is not uncalibrated garbage.

### 4.3 Composing a session

```
due       = R < 0.90, ordered by (1 − R) desc
weak      = mastery ∈ [0.3, 0.7]
new       = outer fringe

quota     50% review · 30% weak · 20% new
if |due| > 0.6·N        → reviews first, cap new at 1
if 3 wrong in a row     → inject an item at b* − 0.8 (confidence repair)
if 5 right in a row     → raise P* by 0.05 for the next pick
```

Interleaving rules, all cheap and all mandatory: no two consecutive from the same template; no more than 2 consecutive from the same KC; shuffle rather than block. Rohrer's RCTs show interleaved practice produces large gains on **delayed** tests versus blocked, and the benefit is not limited to superficially similar problems. **Highest ROI sequencing decision available, and it costs one shuffle.**

Session length: 5–10 minutes / 10–15 items is the industry convergence point. Measure your own drop-off curve and cut one item before the cliff.

### 4.4 Bandits for exercise-type choice

Which *format* teaches a given KC best is empirical. Beta-Bernoulli Thompson sampling per `(kc, tipo)`, reward = correct on a delayed check of that KC. Two production details: **decay the posteriors** (`α ← 0.995α` nightly) so it tracks drift instead of freezing on early data, and **pool across users** with a per-user offset — per-user bandits never leave exploration.

---

## 5. Anti-cheat and limits

### 5.1 Server-authoritative delivery

1. **The answer never goes to the client.** Delivery carries stem, options (shuffled, opaque per-delivery ids) and media. Not the key, not the explanation, not `is_correct` flags.
2. **A delivery is a server-created row**, not a client claim, storing the shuffle permutation, expiry and a nonce.
3. Grading un-permutes the option id, compares to a hash, and **stamps `answered_at` in the same transaction** with `where answered_at is null` — that single statement is both the replay guard and the one-answer-per-delivery guarantee.
4. **Answer hashing:** `sha256(normalise(answer) || item_id || pepper)`. The per-item salt defeats rainbow-tabling a small answer space; the pepper lives in env.
5. **Timing:** flag (don't hard-block) below the p1 of the family's latency distribution; refuse credit past expiry. Use anomaly scores to gate leaderboards, never learning.
6. **Rate-limit the grading endpoint** — unlimited submissions against a 4-option MCQ is a 4-guess oracle. Single-use deliveries close this; belt and braces anyway.

### 5.2 Postgres daily quotas, RLS-safe and timezone-correct

Store the user's IANA timezone and compute the **local** date server-side — never `current_date`, never a client-sent date.

```sql
insert into daily_usage(user_id, local_day, n) values (uid, day, 1)
on conflict (user_id, local_day)
  do update set n = daily_usage.n + 1
  where daily_usage.n < p_limit
returning n into result;
-- result is null ⇒ the WHERE failed ⇒ over limit
```

**Check-and-increment in one atomic statement.** No read-then-write race, no advisory lock. Grant no direct write policy; all mutation through a `security definer` function. Wrap `auth.uid()` as `(select auth.uid())` inside RLS policies — Supabase explicitly recommends it, and it is worth large factors on big tables. Remember the service role key bypasses RLS entirely.

---

## 6. Generation pipeline ops

- **Batch, not interactive.** Gemini's Batch API: JSONL in, 24 h turnaround, **~50% of interactive cost**, 2GB input files, results retained 6 weeks. Content generation is never latency-sensitive, so this is free money.
- **Structured output.** Set `responseMimeType: "application/json"` plus a `responseSchema`. Keep schemas **shallow** — deep or large ones get rejected. The docs are explicit: *"while output is syntactically correct JSON, always validate values in your application."* Re-validate with Zod. Schema conformance is not semantic correctness.
- **Prompt shape that works:** role + hard constraints → KC definition and cognitive model → **kNN-retrieved gold exemplars** (the single highest-leverage element) → grounding passages with ids → the task naming which radicals to vary → the schema.
- **Idempotency key** = `sha256(model_version || prompt_version || kc || params || batch_seed)`, unique-indexed. This is what makes blind retries safe.
- **Retry ladder, capped at 2:** schema violation → repair prompt with the validator error appended → full regenerate at +0.2 temperature → dead-letter with the raw response stored. A third attempt essentially never succeeds.
- **Context-cache** the large static prefix across a batch.
- **Cost control:** a budget table with a monthly cap, decremented per batch, checked before submit. Log tokens and cost per request. Generate to a **pool floor**, not a schedule — no point manufacturing items nobody will see.
- **Versioning:** never mutate an approved template; bump the version, retire the old, leave existing items pointing at the version that made them so historical response data stays interpretable. Store `prompt_version` on every generated row.
- **Review states:** `draft → in_review → approved → live → retired`, with `rejected` carrying a **reason code**. Reason codes are the training data for the next prompt revision.
- **Source staleness:** re-verify sources older than N months; auto-retire items whose source URL 404s.

---

## 7. Build order

1. **Week 1** — KC + prereq tables, Q-matrix, templates with seeded rendering (no LLM), the decay scheduler, server-authoritative delivery, the quota RPC.
2. **Week 2** — Elo per (user, branch) + per item, `P* = 0.82` with randomesque top-8 selection, the session composer with interleaving rules.
3. **Week 3** — the batch pipeline → drafts → deterministic gates → judge → review queue. **Misconception-rule distractors before anything LLM-authored.**
4. **Later** — FSRS behind the scheduler interface, template-level calibration, Thompson sampling, parameter fitting from the log.

> **The one architectural decision to get right on day one:** log every response with enough context to recalibrate later — `(user, item, template, seed, delivery, chosen, correct, latency_ms, theta_before, b_before, issued_at, answered_at)`. Every algorithm above can be upgraded in place from that log. **Nothing can be recovered without it.**

---

## Sources

- [NCME Module 34: Automated Item Generation — Gierl & Lai](https://ncme.org/wp-content/uploads/2025/10/Module-34-Automated-Item-Generation-Gierl-Lai.pdf) · [Wikipedia: Automatic item generation](https://en.wikipedia.org/wiki/Automatic_item_generation) · [Item Cloning Variation, *Psychometrika*](https://link.springer.com/article/10.1007/s11336-016-9513-1)
- [Exploring Automated Distractor Generation for Math MCQs via LLMs (arXiv 2404.02124)](https://arxiv.org/html/2404.02124v1) · [Distractor generation: systematic review (PeerJ CS)](https://peerj.com/articles/cs-2441/)
- [Psychometric properties and detectability of GPT-4o-generated MCQs — npj Digital Medicine](https://www.nature.com/articles/s41746-025-02313-7)
- [SM-2](https://en.wikipedia.org/wiki/SM-2_(algorithm)) · [FSRS: The Algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm) · [FSRS in 100 lines](https://borretti.me/article/implementing-fsrs-in-100-lines) · [SRS benchmark](https://expertium.github.io/Benchmark.html)
- [Settles & Meeder 2016 (HLR)](https://research.duolingo.com/papers/settles.acl16.pdf) · [Settles et al. 2020, ML-driven language assessment (TACL)](https://research.duolingo.com/papers/settles.tacl20.pdf)
- [Pelánek — Elo in adaptive educational systems](https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf) · [Klinkenberg et al., Math Garden](https://www.klinkenberg.amsterdam/publication/math-garden/) · [Dynamic K (UMUAI)](https://link.springer.com/article/10.1007/s11257-025-09439-z)
- [Sympson-Hetter exposure control](https://assess.com/sympson-hetter-item-exposure-control/) · [Item exposure control in CAT (ERIC)](https://files.eric.ed.gov/fulltext/EJ1057460.pdf)
- [ALEKS: Knowledge Space Theory](https://www.aleks.com/about_aleks/knowledge_space_theory) · [Khan Academy mastery levels](https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work) · [Bayesian knowledge tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing)
- [Taylor & Rohrer — interleaved practice](http://uweb.cas.usf.edu/~drohrer/pdfs/Taylor&Rohrer2010ACP.pdf) · [Rohrer et al. 2020 RCT](https://files.eric.ed.gov/fulltext/ED611830.pdf) · [The 85% rule](https://www.nature.com/articles/s41467-019-12552-4)
- [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api) · [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [RLS performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) · [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) · [Rate limiting in Postgres](https://neon.com/guides/rate-limiting) · [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Transitive closure in PostgreSQL](https://engineering.remind.com/Transitive-Closure-In-PostgreSQL/) · [Mitigating hallucinations via domain-grounded retrieval (arXiv 2603.17872)](https://arxiv.org/html/2603.17872v1)

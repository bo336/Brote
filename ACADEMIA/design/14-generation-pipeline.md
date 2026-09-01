# 14 — The generation pipeline

> How content is produced without anyone authoring it by hand, and without ever shipping a fabricated fact. Phase 3 builds this; Phases 1–2 must not block on it.

---

## 1. Principle: generate offline, serve deterministically

**No LLM call happens on the request path. Ever.** A user opening a hoja must get a session in <300 ms, must get identical behaviour offline-ish, and must never see an unreviewed sentence.

```
                     nightly / on-demand
  pool floor check ─────────────────────► Gemini batch ──► gates ──► review ──► aprobado
        ▲                                                                          │
        │                                                                          ▼
   ac_plantillas / ac_items  ◄──────────────────────────────────────────── the pool
        │
        ▼  (request path — pure SQL, no network)
   academia_start_session  →  pick + seed + render  →  the user
```

Three things get generated, in increasing order of risk:

| What | Risk | Gate |
|---|---|---|
| **Items** from an approved `plantilla` | Low — the template already passed review | Deterministic checks + 5% audit |
| **New `plantillas`** for an existing concepto | Medium | Full gate chain + human approval |
| **New `gajos` / `conceptos`** for the next anillo | High — this is curriculum | Full chain + mandatory human approval, `status = 'propuesto'` |

---

## 2. Trigger: pool floors, not a schedule

Generating on a timer manufactures content nobody sees. Generate against demand:

```sql
-- a (concepto, tipo) pool is "hungry" when it can't sustain variety
select c.id, p.tipo, count(*) filter (where i.status = 'aprobado') as vivos
from ac_conceptos c
join ac_plantilla_conceptos pc on pc.concepto_id = c.id
join ac_plantillas p on p.id = pc.plantilla_id
left join ac_items i on i.plantilla_id = p.id
group by c.id, p.tipo
having count(*) filter (where i.status = 'aprobado') < 40;
```

Floors: **40** approved items per `(concepto, tipo)`; **≥3 distinct tipos** per concepto; **≥4 plantillas** per concepto. A concepto below any floor enters the queue, ordered by how many users are currently within two prerequisite hops of it — generate what people are about to need.

Hook the check into the existing `daily_maintenance()` SQL function (it already runs at 00:05 BA via `pg_cron`) so no new scheduler is introduced.

---

## 3. Batch, not interactive

Use the **Gemini Batch API** — 24 h turnaround, ~50% of interactive cost. Latency is irrelevant here and the savings are real. The edge function `academia-generate` submits jobs; a second invocation polls and ingests. Reuse `supabase/functions/_shared/gemini.ts` (it already handles timeout, retry-once, JSON-fence stripping and a typed `GeminiUnavailable` fallback) — extend it with a batch submit/poll pair rather than writing a second client.

Every request carries an **idempotency key**:

```
sha256(model_version || prompt_version || concepto_slug || tipo || params || batch_seed)
```
Unique-indexed. A blind re-run of a failed batch is therefore a no-op, which is the property that makes retries safe.

---

## 4. The prompt contract

Structure, in this order, every time:

```
[rol]        You write assessment items for an Argentine environmental-education app.
             Rioplatense Spanish, voseo. Never invent a fact. If the sources do not
             support an item, return fewer items rather than guessing.
[concepto]   slug, titulo, enunciado, anillo rubric, age_groups, sensible flag
[fuentes]    2-4 retrieved passages, each with {id, organizacion, texto}
[misconcep.] the ac_misconceptions rows for this concepto — USE THESE as distractors
[ejemplos]   2-3 approved items of the same tipo, retrieved by nearest neighbour
             (kNN few-shot is the single highest-leverage element in the prompt)
[tarea]      "Emit N items of tipo X. Vary these radicals: [...]. Keep every
              incidental slot filled from the provided vocabulary."
[esquema]    the response JSON schema
```

Set `responseMimeType: "application/json"` plus a `responseSchema`. Keep the schema **shallow** — arrays of flat objects, not nesting; deep schemas get rejected. And re-validate with Zod on receipt: schema conformance is not semantic correctness, and the model will happily emit a well-typed wrong answer.

Required output fields per item, non-negotiable:

```jsonc
{
  "enunciado": "...",
  "payload_publico": { ... },        // per 11-exercise-types.md §3
  "clave": ["o3"],
  "explicacion": "...",
  "por_opcion": { "o1": { "misconception_slug": "...", "nota": "..." } },
  "afirmaciones": [                  // grounding — the whole trust mechanism
    { "claim": "1 kg de carne vacuna ≈ 15.400 L de agua",
      "fuente_id": "…",
      "cita": "…literal substring of the source passage…" }
  ],
  "dificultad_estimada": 0.4,
  "age_groups": ["teen","adult"]
}
```

Prompt fragments live in a versioned registry (`supabase/functions/academia-generate/prompts/*.ts`), one per `tipo`, each stamped with a `prompt_version` that is stored on every row it produces. When a batch turns out bad you must be able to say exactly which prompt made it.

---

## 5. The gate chain — cheapest gates first

```
 1. JSON schema (Gemini-side)
 2. Zod re-validation
 3. Deterministic checks        ← catches most failures, costs nothing
 4. Grounding substring check   ← the anti-hallucination gate
 5. Dedupe by embedding
 6. LLM judge (separate call, different prompt)
 7. Human review queue
 8. Live psychometric screening ← the only gate that sees real users
```

**3 · Deterministic checks.** Exactly one key. All options distinct after normalisation (lowercase, strip accents/punctuation). The key is not systematically the longest option. Every `{{slot}}` filled. No reasoning leaked into the stem. Numeric answers recomputed by our own evaluator and compared. Reading level within band for the declared `age_groups`. No second-person scolding, no doom framing, no imperative guilt.

**4 · Grounding.** For every entry in `afirmaciones`, assert that `cita` is a **literal substring** of `ac_fuentes.contenido` for the cited `fuente_id`. Reject the whole item on any failure. This one string comparison is free and it kills fabricated citations outright — it is the highest-value gate in the chain.

**5 · Dedupe.** Reject if cosine similarity to any approved item on the same concepto+tipo exceeds **0.93**. (Use `pgvector`; remember `<=>` is cosine *distance*, so similarity is `1 - (a <=> b)`.)

**6 · LLM judge.** A separate call with a different prompt, scoring 1–5 on: factual correctness, single defensible answer, distractor plausibility, reading level, absence of regional assumptions that fail outside Buenos Aires, tone (hope-and-agency, not doom). Plus a boolean `problema_bloqueante`. Anything below 4 on factual correctness, or any blocking issue, goes to a human — never auto-approved.

**7 · Human review.** Do **not** review everything. Route to `/panel`: (a) everything the judge flagged, (b) a random 5% audit, (c) every item touching a `sensible` concepto, (d) every `kid`-eligible item, (e) all `propuesto` gajos/conceptos without exception. Reviewer actions: approve · edit · reject-with-reason-code. Reason codes are the training data for the next prompt revision — store them.

**8 · Live screening.** A nightly pass auto-retires items where, after ≥50 servings:
- `p_correct < 0.15` or `> 0.95` (carries no information),
- discrimination `< 0.10` (does not separate strong from weak learners),
- any distractor chosen by 0% of users (dead option),
- median latency is a wild outlier against its plantilla family.

Retirement is `status = 'retirado'`, never a delete. The response log keeps its meaning.

---

## 6. Anillo expansion — growing the curriculum itself

When a user closes anillo *n* (all reachable gajos `frondoso`), and fewer than *k* gajos exist at anillo *n+1* for their strongest ramas, enqueue a **curriculum proposal**:

```
[contexto]  rama, its existing gajos across all anillos, the anillo n+1 rubric,
            the concepto slugs already present (to avoid duplication),
            the ecoregion/local anchors for this rama from the curriculum research
[tarea]     Propose 3 gajos. For each: titulo, bajada, 4-6 conceptos with
            enunciado, prerequisites drawn ONLY from existing concepto slugs,
            and 2 plantilla sketches per concepto.
[esquema]   flat arrays
```

Everything lands `status = 'propuesto'`. It is invisible to users. A human approves in `/panel`, at which point the item pipeline fills it. Guard rails: enforce acyclicity, cap anillo depth at a configurable ceiling (start at 6), reject any prerequisite that names a non-existent slug, and never let a proposal introduce a new rama — the 13 domains are product identity, not generated content.

---

## 7. Cost, versioning, ops

- `ac_generacion_presupuesto`: a monthly token/credit cap, decremented per submitted batch, checked before submit. Log `tokens_in`, `tokens_out`, `cost_cents` per request. If the cap is hit, generation stops and logs — it never degrades quality to keep running.
- Context-cache the large static prefix (rubrics, exemplars, judge rubric) across a batch.
- **Never mutate an approved plantilla.** Bump `version`, mark the old one `retirado`, leave existing items pointing at the version that produced them, so historical response data stays interpretable.
- Retry ladder, capped at 2: schema violation → repair prompt with the validator error appended → full regenerate at temperature +0.2 → dead-letter with the raw response stored. A third attempt essentially never succeeds and just burns budget.
- Source staleness: re-verify `ac_fuentes` rows older than 12 months; auto-flag items whose source URL 404s; retire items whose figure has been superseded.
- Kill switch: `app_settings.academia_generacion_enabled = false` stops the whole pipeline without a deploy.

---

## 8. What Phase 1 must do instead

Phase 3 owns everything above. **Phase 1 hand-authors the seed** — that is deliberate, not a shortcut:

- ~450 conceptos, taken from `ACADEMIA/research/03-environmental-curriculum.md` §2, with the `animales` branch deepest.
- The full `ac_misconceptions` table from §5 of the same document (30+ entries with corrections).
- The `ac_fuentes` table from §4 (IUCN, IPCC AR6, IPBES, FAO, Our World in Data, Ministerio de Ambiente, SIB/APN, Aves Argentinas, Ellen MacArthur Foundation, Water Footprint Network, …).
- **At least 3 plantillas per exercise type**, hand-written, covering enough conceptos that every one of the 12 graded types can appear in a real session on day one.

That seed is what proves the abstraction works. If a human cannot express a good item as a `plantilla` + slots + distractor rule, a model will not do it better — and you will have discovered that before building a pipeline on top of a broken shape. Generate the seed with `scripts/gen-academia-seed.mjs` → `supabase/seed-academia.sql`, matching the existing `scripts/gen-seed.mjs` convention.

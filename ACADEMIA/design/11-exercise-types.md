# 11 — Exercise types (the `plantilla` taxonomy)

> **The most important spec in the pack.** The brief asks for "the structure of the exercise creation, nothing hardcoded, everything custom and generated". This file is that structure.

---

## 0. The core idea

An exercise is **not** a document. It is:

```
plantilla (template)  ×  slot values  ×  distractor strategy  ×  seed
                              ↓
                        rendered item
```

- A **`plantilla`** belongs to one `tipo` (below) and one or more `conceptos`. It owns a stem template with `{{slots}}`, a slot definition, constraints between slots, and a distractor rule.
- **Slots** are of two kinds, and the distinction is load-bearing:
  - **radicales** — change the difficulty. Vary one and you have a *different* item.
  - **incidentales** — surface flavour (region, species used as an example, whether the phrasing mentions the user's pet). Vary these and you have the *same* item wearing different clothes.
  Difficulty is calibrated **per plantilla**, and each item inherits it with a small residual. Never calibrate per item from scratch.
- **Seeded and deterministic.** `seed = hash64(plantilla_id || user_id || nonce)`. The same seed always re-renders the identical item, so you can store `(plantilla_id, seed)` instead of a row and still reconstruct exactly what the user saw. This is what makes the pool free and infinite.

Every plantilla carries: `concepto_ids[]` (the Q-matrix), `age_groups[]`, `fuente_id`, `dificultad_base` (logit scale), `anillo_min`, `status`.

---

## 1. The twelve graded types + two presentation types

Nothing in this list resembles a language-learning exercise. Each is native to environmental content, and several exist specifically to attack a documented misconception.

### Presentation (not graded, no savia cost of their own)

**`microlectura`** — the teaching beat. 40–70 words, one idea, one `destacado` line, and a visible **source chip** (`Fuente: IUCN Red List, 2025`). Never more than one per session, always first if present. Field-log styling: eyebrow + body, no centred text.

**`dato_vivo`** — one real number, rendered with `<CountUp>` in the dark "en vivo" strip treatment from `BROTE_DESIGN_SYSTEM.md`, plus its source and a one-line "qué significa". Optionally followed immediately by a graded item about it. This is the identity moment of the section — a naturalist's field measurement rendered like a market ticker.

### Graded

| # | `tipo` | What the user does | Grading | Why it exists |
|---|---|---|---|---|
| 1 | `opcion_multiple` | Pick 1 of 4 | Exact | The workhorse. Distractors come from the misconception table, never from a model's imagination. |
| 2 | `mito_o_dato` | Binary: is this claim myth or fact? | Exact | Directly consumes the 30+ misconception inventory in the curriculum research. The most on-mission type in the set. |
| 3 | `ordenar_secuencia` | Order 4–6 fragments | Exact sequence, partial credit by Kendall distance | Processes: the water cycle, a PET bottle's route, decomposition timelines, a trophic chain. |
| 4 | `clasificar_en_cestos` | Drag/tap 5–8 items into 2–4 bins | Per-item, ≥80% = correct | Recycling containers, native/exotic/invasive, IUCN categories. Teaches taxonomy by doing it. |
| 5 | `emparejar` | Match 4–5 pairs | All-or-nothing | Species ↔ ecoregion, law ↔ what it protects, material ↔ decomposition time. |
| 6 | `estimacion_numerica` | Drag a slider to estimate a quantity | Tolerance bands: ±15% = full, ±40% = partial | **Magnitude intuition.** Nobody knows a kilo of beef is ~15,000 L of virtual water. This type is where that lands. |
| 7 | `ranking_impacto` | Order 4 actions by real impact | Exact sequence, partial credit | Attacks the single biggest environmental misconception: that all green actions are equivalent. Reveals the real numbers after. |
| 8 | `elegir_la_accion` | A scenario → pick the best real action from 4 | Exact, all 4 explained with numbers | Decision-making under trade-offs. Feeds naturally into the action hook. |
| 9 | `cadena_causal` | Build a cause→effect chain from 5–7 fragments (2 are decoys) | Exact chain | UNESCO's "systems thinking" competency, made concrete. |
| 10 | `detectar_greenwashing` | Mark which parts of a product claim are unsupported | Per-span, ≥80% = correct | High-value, highly original, and directly useful in a supermarket. |
| 11 | `mapa_localizar` | Tap the right ecoregion / place on a map of Argentina | Polygon hit-test with tolerance | Uses the Leaflet setup already in the repo. Makes the content unmistakably Argentine. |
| 12 | `completar_frase` | Cloze with a 6-word bank | Exact | Cheap to generate, good for terminology, keeps sessions varied. |

**Deferred to Phase 3 or later, only if assets are license-clean:** `identificar_imagen` (identify a species/material from a photo). Requires CC-licensed imagery with attribution stored per image. Do not ship it with un-attributed images.

---

## 2. Distractor generation — the rule that decides quality

Research is unambiguous: LLMs produce *valid* wrong answers but not *plausible* ones — the wrong answers real people actually pick. So distractors come from a **three-source cascade, in this priority order**:

1. **Misconception rules (best, use whenever available).** `ac_misconceptions` holds a per-concepto list of documented false beliefs, seeded from the curriculum research (`el reciclaje resuelve el plástico`, `los autos eléctricos no contaminan`, `el ozono causa el calentamiento`, `los carpinchos son peligrosos`, …). A distractor generated this way stores its `misconception_id`. When a user picks it, the explanation addresses *that specific belief* — and you now have diagnostic data for free.
2. **Structured perturbation.** For numeric answers: ×10, ÷10, sign flip, unit confusion (L vs m³, kg vs t), off-by-one-step-in-the-process. For categorical: the sibling category in the taxonomy.
3. **Semantic neighbours.** Nearest neighbours in embedding space, **banded to cosine similarity ∈ [0.55, 0.85]** — closer is ambiguous, further is obviously wrong. Only as a last resort.

Hard constraints on every generated option set: exactly one key; options distinct after normalisation; the key must not be the longest option more often than chance; option order shuffled **per delivery**, never per item.

---

## 3. The payload contract

Two shapes per type: what the client receives to render (`payload_publico`) and what the server keeps (`solucion`). **The second never crosses the wire before grading.** See `AGENT-RULES.md` §3.

```jsonc
// ac_item.payload_publico  →  sent to the client
{
  "tipo": "opcion_multiple",
  "enunciado": "¿Cuánta agua se necesita, aproximadamente, para producir 1 kg de carne vacuna?",
  "opciones": [                       // already shuffled for THIS delivery
    { "id": "o1", "texto": "150 litros" },
    { "id": "o2", "texto": "1.500 litros" },
    { "id": "o3", "texto": "15.000 litros" },
    { "id": "o4", "texto": "150.000 litros" }
  ],
  "ayuda": null                       // optional non-revealing hint
}

// ac_item.solucion  →  server only, NEVER serialised to the client before grading
{
  "clave": ["o3"],
  "explicacion": "Cerca de 15.400 L por kg, contando el agua de la pastura...",
  "fuente_id": "…",
  "por_opcion": {
    "o1": { "misconception_id": "agua.subestima_virtual", "nota": "Esa es más o menos el agua de beber del animal, no la total." }
  }
}
```

Per-type `payload_publico` shapes (all with the same `tipo` + `enunciado` + `ayuda` envelope):

```jsonc
mito_o_dato          { "afirmacion": "..." }                          // answer: true|false
ordenar_secuencia    { "fragmentos": [{id,texto}], "consigna": "..." }
clasificar_en_cestos { "cestos": [{id,nombre,color}], "fichas": [{id,texto}] }
emparejar            { "izquierda": [{id,texto}], "derecha": [{id,texto}] }   // derecha shuffled
estimacion_numerica  { "min":0,"max":50000,"paso":100,"unidad":"L","escala":"log" }
ranking_impacto      { "opciones": [{id,texto,dominio}] }             // order = answer
elegir_la_accion     { "escenario":"...", "opciones":[{id,texto}] }
cadena_causal        { "fragmentos":[{id,texto}], "largo_cadena": 4 } // includes 2 decoys
detectar_greenwashing{ "claim":"...", "spans":[{id,texto}] }          // mark unsupported spans
mapa_localizar       { "centro":[lat,lng], "zoom":n, "capa":"ecorregiones" }
completar_frase      { "frase":"El {{0}} es ...", "banco":[{id,texto}] }
```

**Grading response** (returned by `academia_answer`, and only then):

```jsonc
{
  "correcto": true,
  "parcial": 0.0,                 // 0..1 for partial-credit types
  "explicacion": "…",
  "fuente": { "titulo": "IUCN Red List", "url": "…", "publicado": "2025" },
  "clave": ["o3"],                // now safe to reveal
  "nota_opcion": "…",             // if a misconception distractor was chosen
  "fuerza_concepto": 0.62         // new mastery, for the little strength meter
}
```

---

## 4. Feedback rules (pedagogy, not decoration)

- **Explain on right AND wrong.** The existing `LessonPlayer` already does this and its comment says why: *"the explanation is the actual content rather than a reward"*. Keep that principle — it is the best thing in the current implementation.
- **Never punish a mistake beyond the score.** No life lost, no session ended, no red screen. A wrong answer costs nothing except that the item returns at the end of the session.
- **Name the misconception.** If the user picked a known false belief, say so plainly and kindly: *"Es lo que casi todo el mundo contesta. La trampa está en que…"*.
- **Always show the source.** Every explanation carries its `fuente` chip. This is the trust mechanism and the identity moment at once.
- **Recovery beat.** Three wrong in a row → Pip appears once with a short, non-patronising line, and the composer injects an easier item. Never more than once per session.

---

## 5. Accessibility (mandatory, not phase 3)

Two of the twelve types are drag-based (`clasificar_en_cestos`, `ordenar_secuencia`, plus `emparejar` and `cadena_causal` if built as drag). Every one of them **must** ship with:

- A **tap-to-select then tap-to-place** interaction as a first-class path, not a fallback.
- Full keyboard operation: arrow keys to move focus, space to pick up, arrows to move, space to drop, escape to cancel.
- `role="listbox"`/`role="option"` or `aria-grabbed`-equivalent semantics, plus a live region announcing each move in Spanish.
- Correct behaviour under `prefers-reduced-motion` (no springy repositioning; instant, still legible).

`mapa_localizar` needs a non-map alternative for screen readers: the same question posed as a named-region multiple choice. `estimacion_numerica` uses a real `<input type="range">` with `aria-valuetext` in Spanish, so it is operable without sight of the slider.

An exercise type that cannot be completed with a keyboard does not ship.

---

## 6. Adding a thirteenth type later

The system is designed so a new type is a contained change:

1. Add the `tipo` to the `ac_tipo_ejercicio` enum/table.
2. Add a Zod schema for its `payload_publico` and `solucion` in `lib/academia/schemas.ts`.
3. Add a grader branch in the `academia_answer` SQL function (server-side, authoritative).
4. Add one renderer file in `components/academia/ejercicios/`.
5. Add the generation prompt fragment in `14-generation-pipeline.md`'s prompt registry.

Nothing else changes. If adding a type requires touching the session composer, the schema, or the player shell, the abstraction has been broken — fix the abstraction instead.

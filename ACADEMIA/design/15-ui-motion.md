# 15 — UI, motion and copy

> Subordinate to `BROTE_DESIGN_SYSTEM.md` ("Bitácora Viva"). Where they differ, that file wins. This file says how its rules apply to the Academia specifically.

---

## 1. Screens

| Route | Screen | One-line job |
|---|---|---|
| `/aprender` | **El Bosque** | Show the tree, its state, and exactly one obvious next thing to do. |
| `/aprender/[rama]` | **La rama** | The gajos of one domain, across anillos. |
| `/aprender/g/[gajo]` | **El gajo** | The hojas inside, with per-concepto strength. |
| `/aprender/sesion/[id]` | **La sesión** | Full-bleed player. No app chrome, no bottom bar. |
| `/aprender/riego` | **Riego** | The free review entry point. |

`/aprender` makes exactly **one** RPC call (`academia_arbol`). If the screen needs a second round trip, the RPC is wrong — fix the RPC, not the screen.

---

## 2. El Bosque — the identity screen

Not a column of circles with a dotted line. A **drawn tree**, rendered as inline SVG, scrolling **bottom-to-top** (you climb it), pinch/wheel zoom, gajos as forks off the ramas.

```
  header      eyebrow "Academia" · hero headline (brand gradient, the ONE per screen)
              savia meter (or Brote+ chip)
  ─────────── PulseStrip (dark ink, unconditional): conceptos frondosos · racha de
              riego · anillo actual — all <CountUp>, all real, never invented
  árbol       SVG. Trunk at the bottom, 13 ramas fanning out, gajos as leaf clusters.
              Domain colour per rama, always. Current anillo highlighted; outer rings
              drawn faint. Wilted gajos desaturated with a subtle droop.
  siguiente   ONE primary CTA card: the recommended next gajo, with its reason
              ("Seguís fuerte en Agua" / "Tenés 4 gajos para regar")
  regar       If any marchito: a hairline-divided list of them. Free. Always visible.
```

SVG rules: no per-node `<img>`; one `<defs>` of reusable leaf/branch paths, instanced with `<use>`. Keep the whole tree under ~400 SVG nodes at any zoom — cull off-screen gajos. Target 60 fps on a mid-range Android. Under `prefers-reduced-motion`, the tree renders statically with no growth animation.

**Do not** put a 3D tree here. `Mundo` owns the three.js budget; a second WebGL canvas will cost the frame budget and the battery, and the two would compete visually.

Fallback: if `academia_arbol` fails or returns empty, show `<EmptyState>` with Pip and a retry — never a blank screen, never a raw error.

---

## 3. La sesión — the player

Full-bleed. Hide the top bar and the bottom tab bar (the session is a modal context, like a checkout).

```
┌──────────────────────────────────────────────┐
│  ✕        ▓▓▓▓▓▓▓░░░░░░  4/9      ● ● ○ ○   │  ← progress + savia dots (free only)
├──────────────────────────────────────────────┤
│                                              │
│   [ the exercise — one per screen ]          │
│                                              │
├──────────────────────────────────────────────┤
│   [ feedback panel — slides up on answer ]   │
│   ✓ Correcto · explicación · Fuente: IUCN    │
├──────────────────────────────────────────────┤
│   [        Seguir  →        ]                │
└──────────────────────────────────────────────┘
```

Rules:

- **Feedback slides up over the exercise; the exercise stays visible.** The user must be able to see what they answered while reading why. Never navigate away to show feedback.
- The **source chip** is always in the feedback panel. It is the field-log signature and the trust mechanism. `Fuente: IUCN Red List · 2025` → tappable, opens the URL.
- Progress bar takes `0..1`. **`<ProgressBar>` clamps** — two callers in the current learning code passed a percentage and sat pinned at 100%. Do not repeat that bug.
- `✕` opens a confirm sheet: *"¿Salir? Perdés el progreso de esta sesión, pero no la savia."* Abandoning within 60 s with zero answers refunds the savia.
- Correct: `brote-green` fill, `haptic('success')`, 200 ms. Wrong: `brote-coral`, `haptic('light')`, **no shake, no red flash, no sound of failure.** Mistakes are the point.
- Pip appears exactly three times, never more: session opener (if the hoja is new), after three consecutive wrong answers (once), and on the results screen.

**Results screen** — in this order:

1. Pip, `mood="celebrating"` if ≥70%.
2. Score, `<CountUp>`.
3. `+XP` and `+N semillas` — semillas with the seed glyph from the existing rewards system, never an emoji.
4. **Conceptos que reforzaste** — up to 4 chips, each with a small strength meter.
5. **The action hook.** A single card, domain-coloured, linking to `/acciones/[slug]`. This is the most important element on the screen — give it the visual weight of a primary CTA, not a footnote.
6. `Seguir en el bosque` / `Otra hoja` (if savia remains).

---

## 4. Motion (per `BROTE_DESIGN_SYSTEM.md` §5 — required, not optional)

| Moment | Treatment |
|---|---|
| Tree loads | Gajos `<Reveal index={i}>`, staggered from the trunk outward |
| Gajo becomes `frondoso` | Leaves fill in with a spring `{ stiffness: 420, damping: 32 }`, ~600 ms, once |
| Gajo wilts | Slow desaturation on mount only — never a repeating animation, it reads as an error state |
| Exercise enters | Slide + fade, 200 ms, from the right |
| Feedback panel | Spring up from below, `layoutId`-free (it is a distinct element, not a moved one) |
| Option select | 120 ms colour, `active:scale-[0.97]` |
| Drag/tap-place | `layout` on the token so it glides to its bin |
| Progress bar | Width transitions, 200 ms; never jumps |
| Numbers | `<CountUp>` everywhere, always a real value |
| Savia spend | The meter drops one segment with a 200 ms drain, once, at session start |

Skeletons (`<Skeleton>`) for every loading state. Never a bare spinner. Never `display:none` toggles for anything the user can see.

---

## 5. Copy

Rioplatense Spanish, voseo, Pip's voice. Warm, concrete, brief, never lecturing, never guilt-tripping. Reference lines — write more in this register, do not reuse these verbatim as the only copy:

| Context | Line |
|---|---|
| Bosque hero | *Tu bosque de conocimiento* |
| Bosque bajada | *Cada hoja que aprendés queda viva mientras la riegues.* |
| Wilted gajo | *Se está secando. Un riego rápido y vuelve.* |
| Savia empty | *Se te terminó la savia por hoy. Vuelve a la medianoche.* |
| Savia empty, reassurance | *Regar lo que ya sabés no cuesta savia.* |
| Wrong answer, common misconception | *Es lo que contesta casi todo el mundo. La trampa está acá:* |
| Three wrong in a row | *Tranqui. Esta parte es difícil de verdad — vamos más despacio.* |
| Results, action hook | *Ahora hacelo.* |
| Anillo unlocked | *Tu árbol sumó un anillo. Las mismas ramas, más adentro.* |
| Brote+ (only line) | *Con Brote+ la savia no se te termina nunca.* |

Forbidden in copy: doom framing, eco-guilt, "deberías", scolding, exclamation stacking, any competitor's terminology, emoji standing in for a control. Emoji inside Pip's dialogue and celebration toasts is established Brote voice and stays.

**Numbers always carry their unit and their source.** *"15.400 L"* alone is a claim; *"≈15.400 L · Water Footprint Network"* is a field note. The second is the product.

---

## 6. Non-negotiables checklist

- [ ] One brand-gradient moment per screen. Not two.
- [ ] Domain colours never substituted by the gradient.
- [ ] Hairline dividers for list-like content; `<Card>` only for genuinely distinct objects.
- [ ] `<Reveal>` on sections and list items; `<CountUp>` on every real number.
- [ ] Every interactive element has hover **and** press states.
- [ ] `lucide-react` for every functional icon. Zero emoji as controls.
- [ ] `<Skeleton>` for every loading state.
- [ ] Every exercise completable by keyboard, with an announced live region.
- [ ] `prefers-reduced-motion` honoured everywhere.
- [ ] AA contrast, visible focus rings, tap targets ≥44 px.
- [ ] Bottom tab bar still has exactly five tabs.
- [ ] Strings via `next-intl`; `BRAND` constants for app/mascot names.
- [ ] Nothing invented: every stat on screen traces to real data.

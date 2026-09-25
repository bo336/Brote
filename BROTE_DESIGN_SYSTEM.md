# Brote Design System — "Bitácora Viva" (Living Field Log)

> **Binding reference.** When touching any screen, follow this instead of defaulting to generic
> card-in-a-box mobile-app patterns. This file is the durable source of truth for Brote's visual
> identity — it does not need to be re-uploaded or re-explained in a future session. If a rule
> genuinely conflicts with a specific screen, say so in the commit message rather than silently
> reverting to a plain style.
>
> Applied incrementally, screen by screen, starting with Explorar (2026-08-12). Screens not yet
> restyled still use the old flat card look — don't assume the whole app matches this file until
> its `## Rollout` section says so.

## 0. What this identity actually is

Brote is not a dashboard and not a cartoon garden app. It's an **environmental field log with the
quiet confidence of a financial terminal** — naturalist observation (real numbers, real domains,
real timestamps) rendered with editorial polish (big honest headlines, hairline dividers, a single
disciplined brand gradient) plus one deliberately unexpected borrow: **live tabular counters and a
pulsing "en vivo" dot**, the visual language of a trading terminal, applied to environmental news
instead of stock tickers. Nobody expects that combination in a gamified eco app — that's the point.

**Never**: emoji standing in for a functional icon (a button, a nav item, a status) — use
`lucide-react`. Emoji as warm voice *in copy* (Pip's dialogue, celebration toasts, notification
text) stays — that's established Brote voice, not something this file overrides. Also never: flat
gray dashboard-template backgrounds, uniform radius-everywhere sameness, static cards with no hover
state, invented stats (a "reading time" or number not backed by real data), walls of unstyled
paragraph text.

---

## 1. Color

One brand gradient, used sparingly — canopy green to dawn amber, always the same direction:

```
--brand-gradient: linear-gradient(115deg, #0E7A52 0%, #1FB57A 45%, #FFB23E 100%);
```

**Rule**: the gradient appears ONLY on hero headlines (one per screen, the featured/most-important
item), key stat numbers, and the primary CTA. Everywhere else is flat color. This is what makes the
gradient moments feel earned instead of noisy — if everything is gradient, nothing is.

**Rule**: alternate section backgrounds for rhythm on any screen with real length — canvas (cream/
ink per theme) → a fixed dark-ink strip → canvas again. The dark strip (`bg-brote-ink
text-brote-cream`, unconditional — not theme-swapped) is where the "live terminal" stat strip lives
(see `<PulseStrip>`). Don't use it more than once per screen or it stops reading as a break.

**Domain colors stay identity, not decoration** — each of the 13 domains (`lib/domains.ts`) keeps
its fixed hex everywhere: tags, dots, chip fills, chart accents. Never substitute the brand gradient
or a random color for a domain's own color.

---

## 2. Typography

`Bricolage Grotesque` (display, `--font-display`) for anything with personality — headlines, stat
numbers, card titles. `Inter` (body, `--font-sans`) for everything read at length.

```
text-hero    clamp(2.1rem, 5.2vw, 3.4rem)   — the ONE featured headline per screen
text-display-xl / display-l                  — page-level headings
text-h1 / h2 / h3                             — section and card headings
text-body / small / caption                   — content and metadata
```

**Micro-label rule**: small uppercase tracked labels (`text-[11px] font-semibold uppercase
tracking-[0.1em]`) sit above headlines as eyebrows — a domain name, a relative timestamp, a status.
Every hero and every list-row group gets one; it's how the density stays readable without borders
around everything.

**Never** center body paragraphs. Never leave dynamic AI-generated text (news titles, summaries)
unstyled default black-on-white — it always carries at minimum the eyebrow + weight treatment above.

---

## 3. Layout

**Divider-first, not box-first.** Lists of similar items (news briefing, settings groups, a table of
rows) use `divide-y divide-border` with generous row padding, NOT each row wrapped in its own
bordered card. Reserve actual `<Card>` (radius + shadow) for things that are genuinely one distinct
object — a project, a stat block, the featured hero.

**Asymmetric over symmetric.** A big featured item followed by a calmer list (as in Explorar) beats
a uniform grid of same-sized cards. When a grid is unavoidable, let one item be visually dominant.

**Operational screens stay dense.** Rankings, catalogs, and tables should NOT try to be airy like an
editorial hero — borrow the hairline-divider and hover-reveal patterns at tight row padding
(`py-2`–`py-3`) instead of card padding.

---

## 4. Shape

```
radius-sm (inputs, tags) · radius-card 20px (cards, hero media) · radius-pill (primary CTA, chips)
```

Pills for primary actions and filter chips; rounded-card rectangles for secondary buttons and
containers — mixed by hierarchy, not uniform.

**One signature angular cut per page, maximum.** `.leaf-clip` (defined in `app/globals.css`) notches
one corner of the single hero media element — used once, never on every image. It is Brote's
version of the "one clipped photo" signature move; don't reuse it as a generic rounding replacement.

---

## 5. Motion — required, not optional

```
duration-fast   120ms   hover color/opacity
duration-base   200ms   transforms, expand/collapse
duration-slow   400ms   section reveals
ease-spring     framer's { type: 'spring', stiffness: 420, damping: 32-34 }   for sliding chips/tabs
```

Every interactive element transitions — nothing snaps. Concretely, on any screen you touch:

1. **Hover on every clickable** — color shift, an underline that draws in from 0 width (see
   `NewsBriefingRow`'s title treatment — a `bg-size` trick, not `text-decoration`), or
   `translateY(-2px)` + shadow escalation.
2. **Scroll reveals** — wrap sections/list items in `<Reveal index={i}>`
   (`components/ui/reveal.tsx`); it fades + rises on first scroll into view, staggered ~60ms per
   index automatically.
3. **Count-up numbers** — any real stat (today's story count, a total, a score) uses `<CountUp>`
   (`components/ui/count-up.tsx`), never a static digit. Only ever pass a real, current value.
4. **Sliding tab/chip underline or fill** — `<SectionTabs>` for primary section switches,
   `<ChipRail>` for filters — both use a `layoutId`-based framer-motion spring so the active
   indicator glides between positions instead of repainting.
5. **Skeleton shimmer** — `<Skeleton>` (already shimmer-animated) for any loading list/card, never a
   bare spinner for content.
6. **Press feedback** — primary buttons scale down slightly on press (`active:scale-[0.97]`,
   already in `<Button>`).

**Never**: `transition: none`, instant `display:none`/`display:block` toggles for anything
user-visible, elements that only change on `:active`.

---

## 6. Reusable primitives (already built — use these, don't reinvent)

| Component | Path | Use for |
|---|---|---|
| `<Reveal>` | `components/ui/reveal.tsx` | Scroll-in fade+rise, any section or list item |
| `<CountUp>` | `components/ui/count-up.tsx` | Any real numeric stat |
| `<ChipRail>` | `components/ui/chip-rail.tsx` | Filter/sort chip rows with a sliding active pill |
| `<SectionTabs>` | `components/explorar/SectionTabs.tsx` | Big text tabs w/ sliding underline (promote to `components/ui/` if a second screen needs it) |
| `<PulseStrip>` | `components/explorar/PulseStrip.tsx` | The dark "live terminal" stat break — reuse the pattern, not necessarily this exact component, on other data-rich screens |
| `.leaf-clip` | `app/globals.css` | The one angular hero-media cut per page |
| `bg-brand-gradient`, `bg-ink-scrim` | `tailwind.config.ts` | Hero headline gradient text, image-to-dark scrim |

---

## 7. Anti-patterns

- No generic `#F3F4F6`-style flat gray dashboard background.
- No uniform radius-everywhere sameness — mix per §4.
- No wrapping every grouped element in its own bordered `<div>` — hairlines where §3 says hairlines.
- No instant state changes.
- No emoji as a functional icon/control (emoji in copy/voice is fine and expected).
- No fabricated stats — every count-up, every "trending" label, every number must trace to real
  data (see how `PulseStrip`'s trending domain is computed from the actual fetched list, not
  invented).
- No unstyled default `<table>` — style header rows, hover rows, sortable indicators when tables
  appear.

---

## Rollout

- **Explorar** (Novedades + Proyectos) — 2026-08-12. Featured-hero + hairline briefing river for
  news, `<PulseStrip>` live stat break, `<SectionTabs>`/`<ChipRail>` navigation.
- **Everything else** — 2026-08-21. Login, Inicio, Acciones (+ detail), Ranking, Perfil (+ header
  and sub-nav), Competencias, Aprendé, Brote+, Notificaciones, onboarding, `/panel`, and the app
  shell (top bar + bottom tab bar). Applied as refinement, not replacement: same palette, same
  layouts, corrected details.
- **La Plaza** (feed, perfiles, moderación) — 2026-08-29. The whole social surface: ranked feed with
  the never-empty ladder, public profiles on shared `ProfileHeader`/`ProfileStats`/`ProfileTabs`,
  thread permalinks with OG cards, search, social notifications, the moderation queue in `/panel`,
  and the community rules page. One new layout rule: `data-shell="wide"` widens the app shell for
  `/feed` only (see the `main:has(...)` rule in `globals.css`) so the Plaza can have a right rail on
  a large screen — it is the only screen that earns a second column.
- **La Academia** (El Bosque) — 2026-09-02. The learning section, rebuilt from the ground up:
  a drawn SVG forest at `/aprender`, branch and gajo screens, a full-bleed session player, and
  fourteen exercise renderers. Notes for anyone extending it:
  - The forest is **inline SVG with one `<use>` per gajo** — 135 nodes for the whole 14-branch,
    105-gajo tree, off-screen gajos culled on scroll. Native scrolling, custom zoom. No WebGL,
    no canvas, no tree library.
  - **`data-shell="wide"` gains a second user**: `/aprender`. The forest needs the width for the
    same reason the Plaza does.
  - The player escapes the shell with `fixed inset-0 z-[45]` — above the bottom tab bar (`z-40`),
    below `<Sheet>` (`z-50`). A session is one thing at a time.
  - **No drag-and-drop library.** Every "drag" type is tap-to-select → tap-to-place, which is the
    primary path and not a fallback: it is what makes them keyboard- and screen-reader-operable.
    Pointer events plus framer-motion `layout` do the rest.
  - Domain colours come from `lib/domains.ts` for branches, gajos and accents. The brand gradient
    appears **once**, on the `/aprender` headline.
  - **Phase 3 (2026-09-03)** added the content pipeline behind it. Two notes that
    matter for the UI: the review queue in `/panel` renders each generated item
    with the **same `<Ejercicio>` component players get**, because reviewing an
    exercise by reading its JSON is how broken exercises get approved; and the
    ring-unlock ceremony goes through the existing `stores/rewards` queue as a
    new `anilloUp` event rather than a second overlay system.
  - Any `app_settings` row that is a boolean or a number renders itself in
    `/panel` with no screen change. Four kill switches ride on that:
    `academia_enabled`, `academia_generacion_enabled`, `academia_savia_libre`,
    `academia_semillas_dia`.
- **La Academia** (El Árbol) — 2026-09-24. Replaces the forest at `/aprender` with one broad,
  deciduous tree (an ombú, not a pine): trunk → 13 coloured branches → 81 units → sessions. The
  player, results and review screens were rebuilt around a written curriculum (see
  `docs/ACADEMIA.md`). Notes for anyone extending it:
  - **The tree is big on purpose, and drawn from pure geometry.** `lib/academia/geometria.ts`
    places trunk, branches, unit pills and session leaves with no React or DOM; `<Arbol>` only
    paints. Units are **pills** (`PILDORA`, 214×68) in the branch colour, locked units carry a
    padlock and a muted fill, trunk units sit on the trunk itself. Basic and intermediate units
    live inside the canopy; advanced ones poke out above it on thin tendrils — the shape says
    what is left to grow. Completing a unit grows its branch: `recienCompletas` sprouts it once, and never under reduced motion.
  - **Native scroll, custom zoom, zero re-renders while panning.** About a thousand static SVG
    nodes, `overflow: auto`, zoom anchored to the pointer, "Ver el árbol entero" and "Ir a mi
    próxima sesión" buttons. It opens framed on the next session, not on the whole tree.
  - **One tab stop** (roving tabindex + arrow keys), and `<ListaRamas>` right under it is the full
    non-drawn alternative: same state, same progress, hairline rows.
  - Text on a branch colour picks ink by WCAG relative luminance (`tintaSobre`), never by hand.
  - `data-shell="wide"` and the player's `fixed inset-0 z-[45]` carry over unchanged.
  - **Sources left the lesson.** No correction, card or result screen shows a source any more;
    they live on `/legal/fuentes`, reachable only from Ajustes and the legal footer, under a
    notice that an AI model selected and organised them. `<FuenteChip>` is gone.
  - Feedback stays calm: green when right, coral when not, the explanation in both cases, no
    shake, no red wash, no sound. Pip appears three times per session at most.

- **El Mercado v2** — 2026-09-24. The marketplace rebuilt around browsing: a home of shelves, search
  with facets, a two-column product page, public store pages, saved items, and an open seller
  onboarding (`/negocio/alta`). Notes for anyone extending it:
  - **Products first on a phone.** Search box, category rail and the first shelf fit in the first
    740 px; the "what is this" explanation is folded into one line. The first version put the
    explanation and filters on top and every product fell below the fold.
  - **Shelves are native horizontal scrollers** (`<Estante>`): `snap-x snap-mandatory` **plus
    `scroll-px-4`** — without scroll-padding the snap pulls the first card flush to the screen edge
    while the headings keep their 16 px gutter. Cards are 44% of the width on a phone so the next one
    always peeks.
  - **The card** (`<TarjetaListado>`): square photo, heart top-right, price with "precio de
    referencia" under it and the old one struck through when it dropped, "Bajó" chip, delivery tags,
    and the level seal only when the product carries a claim. In a card the seal reads just "Nivel 2"
    (the full phrase is the `title`); the full phrase broke into two lines at 390 px.
  - **A button never lives inside a card link.** The follow button on a store card is a sibling,
    absolutely placed over the photo strip.
  - **Server components build button-shaped links with `buttonVariants()` from
    `components/ui/button-variants.ts`**, never from `button.tsx` (a `'use client'` module: on the
    server its exports are references, and calling one crashes the page).
    `lib/mercado/__tests__/servidor-cliente.test.ts` enforces it repo-wide.
  - **`cn()` knows the type scale.** `text-caption`, `text-small`, `text-h1`… are registered in
    `extendTailwindMerge`; before, a colour class after them silently dropped the size.
  - **Forms:** every `<fieldset>` that holds flexible inputs gets `min-w-0` (its UA default is
    `min-width: min-content`, which pushed the price filter out of the sidebar).
  - The mobile CTA bar on the product page is solid primary, one line, above the tab bar
    (`bottom-[calc(4.4rem+env(safe-area-inset-bottom))]`); white on the brand gradient's yellow end
    did not pass contrast.

### Primitives added in the Academia pass

The Bosque-era rows are kept for history; the ones marked *removed* no longer exist since the
Árbol (2026-09-24). The old exercise renderers still live in `components/panel/academia-legado/`
because the `/panel` review queue renders generated items with them.

| Component | Path | What it is |
|---|---|---|
| `<Arbol>` | `components/academia/Arbol.tsx` + `lib/academia/geometria.ts` | The drawn tree. Pure-geometry layout, native scroll, pointer-anchored zoom, one tab stop. |
| `<ListaRamas>` | `components/academia/ListaRamas.tsx` | The tree as a list — the complete alternative for screen readers, keyboard and anyone who prefers rows. |
| `<HojaUnidad>` | `components/academia/HojaUnidad.tsx` | The sheet a unit opens without leaving the tree. A locked unit opens too and says exactly what unlocks it. |
| `<TarjetaSeguir>` | `components/academia/TarjetaSeguir.tsx` | "Seguí donde quedaste": the next session and the server's reason for it. |
| `<TiraArbol>` | `components/academia/TiraArbol.tsx` | The dark ink band with this person's real numbers; a column with no data is not drawn. |
| `<Retroalimentacion>` | `components/academia/Retroalimentacion.tsx` | The correction panel. Calm on purpose; no sources. |
| `<Ficha>` / `<Ranura>` | `components/academia/pasos/piezas.tsx` | The two shapes every exercise is built from: a thing you pick and a place it goes. Both real `<button>`s, both ≥44 px. |
| `useReportar` | idem | Reports an answer upward without depending on the parent memoising its callback. |
| `useAnuncio` | idem | The Spanish live region every placement and removal is announced through. |
| `<Enunciado>` / `<Adjuntos>` / `<Grafico>` | idem | Prompt, attached context, and the bar chart or table a calculation is read from. |
| `<PasoVista>` | `components/academia/pasos/index.tsx` | Fourteen step types, no `default`: a type without a renderer fails the build. |
| `<SaviaMedidor>` | `components/academia/SaviaMedidor.tsx` | The daily limit, or a Brote+ chip in its place — the absence of the meter *is* the benefit. |
| ~~`<ArbolBosque>`~~ | *removed* | The Bosque's drawn forest. |
| ~~`<FuerzaMedidor>`~~ | *removed* | Per-concept strength meter; the Árbol shows unit progress instead. |
| ~~`<FuenteChip>`~~ | *removed* | Sources no longer appear inside a lesson. |

### Primitives added in the Plaza pass

| Component | Path | What it is |
|---|---|---|
| `<PipAvatar>` | `components/pip/PipAvatar.tsx` | The identity everywhere: photo → Pip → neutral Pip, with a rank ring. Wraps `Pip` without touching it. |
| `<FollowButton>` | `components/social/FollowButton.tsx` | Four states — Seguir · Solicitado · Siguiendo · Dejar de seguir. Optimistic, rolls back on refusal. |
| `<AccountRow>` / `<AccountListPage>` | `components/social/` | One person in a list; the followers/following pages are the same component twice. |
| `<LadderCards>` | `components/feed/LadderCards.tsx` | The tail of the feed: people, projects, actions, a lesson — each with its own section eyebrow. |
| `<ChipRail>` filters | reused | Now also the notification filter and the moderation queue status. |

### Shared primitives added in that pass

| Component | Path | Replaces |
|---|---|---|
| `<Input>` `<Textarea>` `<Select>` `<Field>` | `components/ui/input.tsx` | The same input hand-written in 11 files with 6 different results |
| `<LinkRow>` | `components/ui/link-row.tsx` | The icon+title+chevron nav row, duplicated per screen |
| `<Card interactive>` / `<Eyebrow>` | `components/ui/card.tsx` | Per-screen ad-hoc hover treatments |
| `.eyebrow` `.link-underline` `.press` `.divide-hairline` | `app/globals.css` | Retyped 4-class utility strings |
| `shadow-soft` / `soft-lg` / `lift` / `crisp` | `tailwind.config.ts` | Single-cast shadows (now layered) |

`SectionHeader` takes an `eyebrow` prop — use it, per §2's micro-label rule.

### Things that turned out to be bugs, not style

Worth knowing about because each was invisible until something was looked at closely:

- `bg-brote-aqua` was referenced in two components but never defined in the palette, so PipChat's
  Eco-Experto toggle had **no visible active state** and the home news tile rendered transparent.
- `<ProgressBar>` takes `0..1` and clamps. Two callers in the learning section passed a
  **percentage**, so both bars sat at 100% from the first render.
- Notificaciones had a "marcar todas como leídas" button hardcoded `disabled`.
- A stale `create_project` overload made PostgREST refuse the call for any caller that omitted the
  contact arguments.

If a control looks styled but never responds, check whether the class or column it depends on
actually exists before restyling it.

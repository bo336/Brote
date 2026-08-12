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

Screens restyled to this system so far:

- **Explorar** (Novedades + Proyectos) — 2026-08-12. Featured-hero + hairline briefing river for
  news, `<PulseStrip>` live stat break, `<SectionTabs>`/`<ChipRail>` navigation.

Everything else (Inicio/world, Ranking, Acciones, Perfil, onboarding) is still on the earlier flat
card look and is next in line, screen by screen, per user direction — don't assume it already
matches this file.

/**
 * La Bitácora — the census, and what completing part of it means.
 *
 * "The product's own tagline is *Bitácora viva*. This is that, literally"
 * (`11-GAME-LOOP.md` §3.3). Every species logged carries where and when it was
 * first seen; a completed region pays a cosmetic and a page; a completed domain
 * set surfaces **one** real-action suggestion, once.
 *
 * All of that is decisions, so all of it is here rather than in a component.
 * The sheet that draws it is `hud/BitacoraSheet.tsx`.
 */
import { SPECIES, SPECIES_BY_SLUG } from './species';
import { cumulativeState } from './progression';
import { REGION_IDS } from './types';
import type { DomainSlug } from '../domains';
import type { JournalEntry, RegionId, SpeciesRow } from './types';

/** One line of the Bitácora: a species, and whether it has been seen. */
export interface JournalLine {
  species: SpeciesRow;
  entry: JournalEntry | null;
  /**
   * Unseen species are shown as a silhouette with their region and time of day
   * — never hidden entirely. A blank is a wall; a silhouette is an invitation,
   * and it is the whole reason a census is worth walking around for.
   */
  seen: boolean;
}

export interface RegionPage {
  region: RegionId;
  lines: JournalLine[];
  seen: number;
  total: number;
  complete: boolean;
}

/**
 * The Bitácora as it stands, region by region.
 *
 * **Bounded by tier.** A player at tier 3 sees the species of tiers 1-3 and no
 * others: the catalogue is "refreshed at each tier, which is what makes an
 * unlock read as new *content* rather than a new texture" (§3.3). Showing the
 * whole 64 from day one would turn that into a long list of locks.
 */
export function pagesFor(tier: number, journal: readonly JournalEntry[]): RegionPage[] {
  const seenBySlug = new Map(journal.map((e) => [e.species_slug, e]));
  const reachable = new Set(cumulativeState(tier).species);

  const byRegion = new Map<RegionId, JournalLine[]>();
  for (const species of SPECIES) {
    if (!reachable.has(species.slug)) continue;
    const entry = seenBySlug.get(species.slug) ?? null;
    const line: JournalLine = { species, entry, seen: entry !== null };
    const list = byRegion.get(species.region);
    if (list) list.push(line);
    else byRegion.set(species.region, [line]);
  }

  const pages: RegionPage[] = [];
  for (const [region, lines] of byRegion) {
    const seen = lines.filter((l) => l.seen).length;
    pages.push({ region, lines, seen, total: lines.length, complete: seen === lines.length });
  }
  // Region order follows the ladder, so the page you are working on is near the
  // end rather than wherever a Map happened to put it.
  const order = REGION_IDS as readonly RegionId[];
  pages.sort((a, b) => order.indexOf(a.region) - order.indexOf(b.region));
  return pages;
}

/** How much of the reachable catalogue has been logged, 0..1. */
export function progressFor(tier: number, journal: readonly JournalEntry[]): { seen: number; total: number } {
  const reachable = cumulativeState(tier).species;
  const seen = new Set(journal.map((e) => e.species_slug));
  return { seen: reachable.filter((s) => seen.has(s)).length, total: reachable.length };
}

/**
 * Which domains the player has now completed the set for.
 *
 * The app seam (§3.3, and §5 pillar 3): completing a domain's species set
 * surfaces **one** matching real-action suggestion — once, non-modal,
 * dismissible, never repeated. This says which; `dismissed` is what makes
 * "never repeated" true, and it is the caller's to persist.
 *
 * **Bounded by tier, like the pages.** A domain whose remaining species are all
 * above the player's tier is not complete — it is unfinished, and telling
 * somebody they finished something they cannot yet finish is a lie that costs
 * the seam its credibility.
 */
export function completedDomains(
  tier: number,
  journal: readonly JournalEntry[],
  dismissed: readonly string[] = [],
): DomainSlug[] {
  const reachable = new Set(cumulativeState(tier).species);
  const seen = new Set(journal.map((e) => e.species_slug));
  const gone = new Set(dismissed);

  const total = new Map<DomainSlug, number>();
  const logged = new Map<DomainSlug, number>();
  for (const species of SPECIES) {
    if (!reachable.has(species.slug)) continue;
    const d = species.domain_slug;
    total.set(d, (total.get(d) ?? 0) + 1);
    if (seen.has(species.slug)) logged.set(d, (logged.get(d) ?? 0) + 1);
  }

  const out: DomainSlug[] = [];
  for (const [domain, n] of total) {
    if (n > 0 && logged.get(domain) === n && !gone.has(domain)) out.push(domain);
  }
  return out;
}

/**
 * The one suggestion a completed domain earns, or null.
 *
 * **One at a time, never a queue.** Somebody who logs their last three species
 * in a row should get one nudge, not three stacked on top of each other — and
 * the one they get is the earliest, because that is the set they finished
 * first.
 */
export function suggestionFor(
  tier: number,
  journal: readonly JournalEntry[],
  dismissed: readonly string[] = [],
): DomainSlug | null {
  return completedDomains(tier, journal, dismissed)[0] ?? null;
}

/** A species by slug, for a sighting that needs its name and blurb. */
export function speciesFor(slug: string): SpeciesRow | undefined {
  return SPECIES_BY_SLUG.get(slug);
}

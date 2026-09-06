/**
 * Which scatter point becomes what.
 *
 * The layout produces one deterministic pool of points, each with a stable
 * `roll`. Turning that pool into "these are grass, those are trees, this
 * handful is rock on the mountain" is arithmetic over the roll — no geometry,
 * no three.js, no React — so it lives here rather than inside the component
 * that fills the instance pools (`01-RULES.md` §3.2; `Vegetation.tsx` had grown
 * past 400 lines and this was the seam).
 *
 * Everything here is a **filter over the same array**, never a shuffle. Two
 * properties depend on that and both are load-bearing:
 *
 *  - A point keeps its identity. Changing the tier, the biome or the season
 *    re-runs the filters and the grass that was already there stays where it
 *    was.
 *  - `resize` on a pool takes a **prefix**, so order is what decides what
 *    survives on a low-end device.
 */
import { LAYOUT } from './config';
import { REGION_CHARACTER } from './regions';
import type { ScatterPoint } from './layout';

/** Which kinds compete for the pool, and how much of it each gets. */
export type BandKey = 'sprouts' | 'grass' | 'flowers' | 'trees' | 'rocks';
/** The character keys a region uses to want more or less of something. */
export type CharacterKey = 'grass' | 'flowers' | 'rocks' | 'trees';

/**
 * One contiguous band of the roll per kind, sized to the T3 budget.
 *
 * Cumulative on purpose: adding a band never moves the points already assigned
 * to another one, so a new kind of plant does not rearrange somebody's meadow.
 */
export const BANDS: Record<BandKey, readonly [number, number]> = {
  sprouts: [0, LAYOUT.shareSprouts],
  grass: [LAYOUT.shareSprouts, LAYOUT.shareSprouts + LAYOUT.shareGrass],
  flowers: [
    LAYOUT.shareSprouts + LAYOUT.shareGrass,
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers,
  ],
  trees: [
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers,
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers + LAYOUT.shareTrees,
  ],
  rocks: [
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers + LAYOUT.shareTrees,
    1,
  ],
};

/** One variant's slice of a band, so three variants split it evenly. */
export function pick(
  points: readonly ScatterPoint[],
  band: readonly [number, number],
  variant: number,
  variants: number,
): ScatterPoint[] {
  const width = (band[1] - band[0]) / variants;
  const from = band[0] + variant * width;
  const to = from + width;
  return points.filter((p) => p.roll >= from && p.roll < to);
}

/**
 * Keep a point with probability `density` — deterministically, from the point
 * itself. A biome that grows less grass grows less of the *same* grass, not a
 * different random subset every time the scene rebuilds.
 */
export function thin(list: readonly ScatterPoint[], density: number): ScatterPoint[] {
  return density >= 1 ? [...list] : list.filter((p) => ((p.roll * 977) % 1) < density);
}

/** The share of a band a region actually wants, from its own character. */
export function forRegion(list: readonly ScatterPoint[], key: CharacterKey): ScatterPoint[] {
  return list.filter((p) => ((p.roll * 331) % 1) < Math.min(1, REGION_CHARACTER[p.region][key]));
}

/**
 * Rock on the mountain, interleaved rather than appended.
 *
 * `resize` trims a pool to a **prefix** of what was placed, so anything at the
 * back of the list vanishes first. Every steep point comes from El Monte and La
 * Cumbre and they all sit at the end of the scatter array, so appending them
 * would leave the mountain bare on exactly the devices most likely to be
 * looking at it. One steep for every three flat keeps both in any prefix.
 */
export function interleaveSteep(list: readonly ScatterPoint[]): ScatterPoint[] {
  const steep = list.filter((p) => p.steep);
  const flat = list.filter((p) => !p.steep);
  if (steep.length === 0) return flat;
  const out: ScatterPoint[] = [];
  let si = 0;
  for (let i = 0; i < flat.length; i++) {
    out.push(flat[i]!);
    if (i % 3 === 2 && si < steep.length) out.push(steep[si++]!);
  }
  for (; si < steep.length; si++) out.push(steep[si]!);
  return out;
}

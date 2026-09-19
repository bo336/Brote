/**
 * The region table: where the nine regions are, and where their traversal
 * caches sit inside them.
 *
 * Data, not generation — `layout.ts` reads it. It is split out because the two
 * together no longer fit in 400 lines (`01-RULES.md` §3.2), and because this
 * half is the part a designer edits.
 *
 * **Every position here is fixed from day one.** A region's distance is measured
 * against the radius of the tier that unlocks it, never the island's current
 * radius, so El Jardín has the same coordinates at tier 2 and at tier 9 — the
 * island grows to reveal it rather than shuffling everything that was already
 * there (`08-WORLD-AND-PROGRESSION.md` §1).
 */
import { LAYOUT } from './config';
import { islandRadius, tierForRegion } from './progression';
import type { RegionId, VerbId } from './types';

/** Where a region sits, in fractions of the island radius. Constant for everyone. */
export interface RegionSpec {
  /** Direction from the island centre, radians. */
  angle: number;
  /** Distance from centre as a fraction of R. */
  dist: number;
  /** Influence radius as a fraction of R. */
  radiusFrac: number;
}

export const REGION_SPECS: Record<RegionId, RegionSpec> = {
  claro: { angle: 0, dist: 0, radiusFrac: LAYOUT.claroRadiusFrac }, // always the spawn
  pradera: { angle: 0.35, dist: 0.52, radiusFrac: LAYOUT.regionRadiusFrac },
  jardin: { angle: 2.05, dist: 0.5, radiusFrac: LAYOUT.regionRadiusFrac },
  arboleda: { angle: 3.6, dist: 0.55, radiusFrac: LAYOUT.regionRadiusFrac },
  rio: { angle: 1.15, dist: 0.66, radiusFrac: LAYOUT.regionRadiusFrac },
  monte: { angle: -1.75, dist: 0.6, radiusFrac: LAYOUT.regionRadiusFrac },
  cumbre: { angle: -1.75, dist: 0.72, radiusFrac: LAYOUT.regionRadiusFrac * 0.7 },
  islote: { angle: 0.9, dist: LAYOUT.isletDistanceFrac, radiusFrac: LAYOUT.regionRadiusFrac * 0.6 },
  monumento: { angle: -1.75, dist: 0.72, radiusFrac: LAYOUT.regionRadiusFrac * 0.35 },
};

/**
 * A region's centre in world units — **fixed from day one**.
 *
 * The distance is measured against the radius of the tier that UNLOCKS the
 * region, not the island's current radius. That is what makes "the island's full
 * extent exists in the data from day one" true (`08-WORLD-AND-PROGRESSION.md`
 * §1): El Jardín sits at the same coordinates whether you are tier 2 or tier 9,
 * so growing the island reveals it rather than moving everything that was
 * already there.
 *
 * Before its tier, a region's centre is simply outside the coastline — which is
 * exactly where the ghosted silhouette belongs.
 */
export function regionCentre(id: RegionId): [number, number] {
  const spec = REGION_SPECS[id];
  const r = islandRadius(tierForRegion(id)) * spec.dist;
  return [Math.cos(spec.angle) * r, Math.sin(spec.angle) * r];
}

/** A region's influence radius, on the same fixed scale as its centre. */
export function regionRadius(id: RegionId): number {
  return REGION_SPECS[id].radiusFrac * islandRadius(tierForRegion(id));
}

/**
 * The traversal caches, **placed by hand** (`11-GAME-LOOP.md` §3.2).
 *
 * Six to ten per region, each `[distance as a fraction of the region radius,
 * angle offset in radians, the verb that reaches it]`. Authored rather than
 * scattered, because "how do I get up there" is a designed question and a
 * random point on a hillside is not one.
 */
export const CACHE_SPOTS: Record<RegionId, [number, number, VerbId][]> = {
  claro: [
    [0.5, 0.4, 'walk'], [0.8, 1.9, 'walk'], [0.65, 3.1, 'walk'],
    [0.9, 4.3, 'walk'], [0.45, 5.4, 'walk'], [0.75, 2.6, 'walk'],
  ],
  pradera: [
    [0.6, 0.2, 'walk'], [0.85, 1.4, 'walk'], [0.7, 2.7, 'walk'],
    [0.95, 3.8, 'walk'], [0.5, 5.0, 'walk'], [0.8, 6.0, 'walk'], [0.4, 4.5, 'walk'],
  ],
  jardin: [
    [0.55, 0.7, 'walk'], [0.9, 2.1, 'walk'], [0.7, 3.4, 'walk'],
    [0.45, 4.6, 'walk'], [0.85, 5.7, 'walk'], [0.6, 1.2, 'walk'],
  ],
  arboleda: [
    [0.5, 0.3, 'climb'], [0.8, 1.6, 'climb'], [0.65, 2.9, 'walk'],
    [0.95, 4.1, 'glide'], [0.4, 5.2, 'walk'], [0.75, 0.9, 'glide'], [0.55, 3.7, 'climb'],
  ],
  rio: [
    [0.6, 0.5, 'swim'], [0.85, 1.8, 'swim'], [0.45, 3.0, 'walk'],
    [0.9, 4.2, 'swim'], [0.7, 5.3, 'walk'], [0.5, 2.2, 'swim'],
  ],
  monte: [
    [0.55, 0.6, 'scale'], [0.8, 2.0, 'scale'], [0.7, 3.3, 'cave'],
    [0.95, 4.5, 'scale'], [0.45, 5.6, 'walk'], [0.85, 1.1, 'scale'], [0.6, 2.8, 'cave'],
  ],
  cumbre: [
    [0.5, 0.8, 'track'], [0.85, 2.3, 'scale'], [0.7, 3.6, 'track'],
    [0.4, 4.8, 'track'], [0.9, 5.9, 'scale'], [0.6, 1.5, 'track'],
  ],
  islote: [
    [0.5, 0.4, 'sail'], [0.8, 1.7, 'walk'], [0.65, 3.2, 'swim'],
    [0.9, 4.4, 'walk'], [0.45, 5.5, 'sail'], [0.7, 2.5, 'walk'],
  ],
  monumento: [
    [0.6, 0.5, 'scale'], [0.8, 2.4, 'scale'], [0.5, 3.9, 'observe'],
    [0.9, 5.1, 'scale'], [0.45, 1.3, 'observe'], [0.75, 4.7, 'scale'],
  ],
};

/**
 * Each region's own composition. **Different terrain character, a different
 * dominant value, a different silhouette** — not the same field with different
 * props on it (`phases/PHASE-3` §1).
 *
 * The multipliers ride on top of the biome mix and the tier's counts, so a
 * desert Arboleda is still sparser than a selva Arboleda, and both still read
 * as La Arboleda.
 */
export interface RegionCharacter {
  grass: number;
  flowers: number;
  rocks: number;
  trees: number;
  /** Bare ground shows through here; 0 is fully covered, 1 is swept earth. */
  bareness: number;
}

export const REGION_CHARACTER: Record<RegionId, RegionCharacter> = {
  // Bare warm earth, one worn path. The starting clearing is deliberately empty.
  claro: { grass: 0.25, flowers: 0.1, rocks: 0.6, trees: 0, bareness: 0.8 },
  // Rolling grass and wind. The open, gentle one.
  pradera: { grass: 1.4, flowers: 0.5, rocks: 0.5, trees: 0.15, bareness: 0.05 },
  // The "pretty" region: flowers first, everything else second.
  jardin: { grass: 1, flowers: 2.2, rocks: 0.3, trees: 0.3, bareness: 0 },
  // Canopy. Grass thins under the shade, which is what makes shade read.
  arboleda: { grass: 0.6, flowers: 0.4, rocks: 0.5, trees: 2.4, bareness: 0.15 },
  // Reeds and damp ground; the water does the composition.
  rio: { grass: 1.1, flowers: 0.6, rocks: 0.9, trees: 0.6, bareness: 0.1 },
  // Rock, and very little that is not rock.
  monte: { grass: 0.3, flowers: 0.15, rocks: 2.6, trees: 0.25, bareness: 0.55 },
  // Above the tree line. Nothing grows tall this high up.
  cumbre: { grass: 0.1, flowers: 0.1, rocks: 1.8, trees: 0, bareness: 0.7 },
  // Salt-tolerant scrub on sand.
  islote: { grass: 0.5, flowers: 0.3, rocks: 1.2, trees: 0.2, bareness: 0.4 },
  // The summit around the monument stays clear, so the marker reads.
  monumento: { grass: 0.15, flowers: 0.2, rocks: 1, trees: 0, bareness: 0.6 },
};

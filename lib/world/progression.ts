/**
 * The unlock ladder — the table the whole game hangs from.
 *
 * Source of truth: `08-WORLD-AND-PROGRESSION.md` §3, cross-checked against the
 * `ranks` table and `TIER_ELEMENTS` in `lib/mundo.ts`. That table has been
 * computed, mirrored in Postgres and persisted per user since day one, and the
 * renderer never read it (`02-AUDIT.md` §4). This is where that stops.
 *
 * Every tier delivers **structure + a verb + something to collect**. The verb
 * column is the pillar that keeps tiers 6-11 alive: scenery alone stops
 * mattering by tier 4.
 */
import { ISLAND_RADIUS_BY_TIER } from './config';
import { SPECIES } from './species';
import type { FeatureId, PropId, RegionId, SpeciesId, TierUnlock, VerbId, WorldConfig } from './types';

export const MIN_TIER = 1;
export const MAX_TIER = 11;

/** Placeable props by the tier that unlocks them (`14-CONTENT.md` §3). */
const PROPS_BY_TIER: Record<number, PropId[]> = {
  1: ['mundo_comedero', 'mundo_banco', 'mundo_hamaca'],
  2: ['mundo_colmena', 'mundo_farolitos', 'mundo_arco'],
  3: ['mundo_huerta', 'mundo_totem', 'mundo_carpa'],
  4: ['mundo_molino'],
};

/** Species are keyed off their own `min_tier`, so the two can never drift. */
function speciesForTier(tier: number): SpeciesId[] {
  return SPECIES.filter((s) => s.min_tier === tier).map((s) => s.slug);
}

interface LadderRow {
  regions: RegionId[];
  features: FeatureId[];
  verbs: VerbId[];
}

/** The ladder itself. Regions, features and verbs newly granted AT each tier. */
const LADDER: Record<number, LadderRow> = {
  // Semilla — El Claro. Bare warm earth, one worn path, the stone seed-spot.
  1: { regions: ['claro'], features: ['mojon'], verbs: ['walk', 'plant'] },
  // Brote — La Pradera. Grass, wind, first sprouts, a puddle.
  2: { regions: ['pradera'], features: ['puddle'], verbs: ['water'] },
  // Plántula — El Jardín. Flowers, butterflies, a bench, the compost heap.
  3: { regions: ['jardin'], features: ['bench', 'compost'], verbs: ['log'] },
  // Retoño — La Arboleda begins: the first tree and a low rock ledge.
  4: { regions: ['arboleda'], features: [], verbs: ['climb'] },
  // Arbusto — shrubs, berry bushes, the first nest, undergrowth.
  5: { regions: [], features: ['nest'], verbs: ['forage'] },
  // Árbol — full canopy, a treehouse platform in the big tree, a hammock.
  6: { regions: [], features: ['treehouse', 'hammock'], verbs: ['glide', 'rest'] },
  // Bosque — El Río y la Laguna. Water cuts the island.
  7: { regions: ['rio'], features: ['river', 'pond', 'bridge', 'waterfall'], verbs: ['swim', 'fish'] },
  // Guardián — El Monte rises to the north. Cliffs, ledges, a cave mouth.
  8: { regions: ['monte'], features: ['mountain', 'cave'], verbs: ['scale', 'cave'] },
  // Ecosistema — La Cumbre Nevada. Snow line, cold fauna, seasons rotate.
  9: { regions: ['cumbre'], features: ['snow'], verbs: ['track'] },
  // Planeta — El Islote across the water. A boat, a telescope at the summit.
  10: { regions: ['islote'], features: ['islet', 'boat', 'telescope', 'aurora'], verbs: ['sail', 'observe'] },
  // Gaia — El Monumento at the summit. Golden light, everything at full bloom.
  11: { regions: ['monumento'], features: ['monument'], verbs: ['mentor'] },
};

/** Clamp any incoming tier — `rankTier` is 1..11 but never trust the wire. */
export function clampTier(tier: number): number {
  if (!Number.isFinite(tier)) return MIN_TIER;
  return Math.min(MAX_TIER, Math.max(MIN_TIER, Math.floor(tier)));
}

/** What arrives AT this tier — the delta, which is what the ceremony animates. */
export function unlocksFor(tier: number): TierUnlock {
  const t = clampTier(tier);
  const row = LADDER[t]!;
  return {
    tier: t,
    regions: [...row.regions],
    features: [...row.features],
    verbs: [...row.verbs],
    species: speciesForTier(t),
    props: [...(PROPS_BY_TIER[t] ?? [])],
    copyKey: `mundo.tierup.t${t}`,
  };
}

/** Island radius in metres. Growth is by adding regions, never by scaling a disc. */
export function islandRadius(tier: number): number {
  return ISLAND_RADIUS_BY_TIER[clampTier(tier) - 1]!;
}

/**
 * Everything at or below a tier. Together with `(userId, seed)` this is the ONLY
 * input to world generation — which is what makes progression testable without
 * a renderer.
 */
export function cumulativeState(tier: number): WorldConfig {
  const t = clampTier(tier);
  const regions: RegionId[] = [];
  const features: FeatureId[] = [];
  const verbs: VerbId[] = [];
  const species: SpeciesId[] = [];
  const props: PropId[] = [];
  for (let i = MIN_TIER; i <= t; i++) {
    const u = unlocksFor(i);
    regions.push(...u.regions);
    features.push(...u.features);
    verbs.push(...u.verbs);
    species.push(...u.species);
    props.push(...u.props);
  }
  return { tier: t, radius: islandRadius(t), regions, features, verbs, species, props };
}

/** The verbs the player holds at a tier. */
export function verbsFor(tier: number): VerbId[] {
  return cumulativeState(tier).verbs;
}

/** Is this region walkable yet? Locked ones sit behind the mist wall. */
export function regionUnlocked(region: RegionId, tier: number): boolean {
  return cumulativeState(tier).regions.includes(region);
}

/** Is this feature present yet? */
export function featureUnlocked(feature: FeatureId, tier: number): boolean {
  return cumulativeState(tier).features.includes(feature);
}

/** Is this verb usable yet? A locked verb gives a soft barrier and a hint. */
export function verbUnlocked(verb: VerbId, tier: number): boolean {
  return cumulativeState(tier).verbs.includes(verb);
}

/** The tier that first grants a region, for the ghosted silhouette's label. */
export function tierForRegion(region: RegionId): number {
  for (let t = MIN_TIER; t <= MAX_TIER; t++) {
    if (LADDER[t]!.regions.includes(region)) return t;
  }
  return MAX_TIER;
}

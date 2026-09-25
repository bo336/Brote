/**
 * The island's blocks: parcels (`docs/MUNDO_JUEGO.md` §3.3).
 *
 * Seeds on a jittered grid over the whole reachable sea, each one kept only if
 * it is land **at tier 11** — features only ever add, so ground that the river
 * or the lagoon will one day take is never offered as a parcel you could lose.
 * Each parcel is discovered at the first tier its seed is land, which is what
 * makes a rank-up reveal new blocks without moving the ones you already have.
 *
 * Borders are Voronoi with a little noise, so a restored parcel reads as a
 * patch of meadow and not as a hexagon.
 *
 * Deterministic from the island's seed; `Math.random()` never appears.
 */
import { fbm, isPlantable, isRockable, type WorldLayout } from '../terrain';
import { regionAt, terrainForTier, type RegionAnchor } from '../layout';
import { regionCentre, regionRadius, REGION_SPECS } from '../regions';
import { cumulativeState, MAX_TIER } from '../progression';
import { hashInt, mulberry32 } from '../rng';
import type { RegionId } from '../types';
import { PARCEL } from './config';
import { PARCEL_TYPES } from './plants';
import type { ParcelState } from './types';

export interface ParcelSpec {
  id: string;
  /** Grid cell. */
  i: number;
  j: number;
  /** The seed point — the parcel's centre, and where its marker stands. */
  x: number;
  z: number;
  /** The rank tier whose island first contains it. */
  tier: number;
  /** Ground only rock belongs on (the mountain); restored with stone, not compost. */
  steep: boolean;
  /** Where its litter lies while it is wild. */
  litter: [number, number][];
  /** Where its invasive stands, if it has one. */
  invasive: [number, number] | null;
}

export interface ParcelField {
  seed: number;
  parcels: ParcelSpec[];
  byId: ReadonlyMap<string, ParcelSpec>;
  /** Grid lookup: cell key → parcel, for the nearest-seed search. */
  grid: ReadonlyMap<number, ParcelSpec>;
}

const cellKey = (i: number, j: number) => (i + 64) * 256 + (j + 64);

function anchorsAt(tier: number): RegionAnchor[] {
  const cfg = cumulativeState(tier);
  return (Object.keys(REGION_SPECS) as RegionId[]).map((id) => {
    const [x, z] = regionCentre(id);
    return { id, x, z, radius: regionRadius(id), unlocked: cfg.regions.includes(id) };
  });
}

const ANCHORS: RegionAnchor[][] = [];
function anchorsFor(tier: number): RegionAnchor[] {
  const t = Math.min(MAX_TIER, Math.max(1, Math.floor(tier)));
  return (ANCHORS[t] ??= anchorsAt(t));
}

function isLand(x: number, z: number, L: WorldLayout): boolean {
  return isPlantable(x, z, L) || isRockable(x, z, L);
}

/** Build every parcel of an island. Pure; ~10 ms. */
export function buildParcels(seed: number): ParcelField {
  const S = PARCEL.spacingM;
  const n = Math.floor(PARCEL.extentM / S);
  const terrains: WorldLayout[] = [];
  for (let t = 1; t <= MAX_TIER; t++) terrains[t] = terrainForTier(seed, t);
  const final = terrains[MAX_TIER]!;

  const parcels: ParcelSpec[] = [];
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const rng = mulberry32(hashInt(`parcel:${seed}:${i}:${j}`));
      const x = i * S + (rng() * 2 - 1) * PARCEL.jitter * S;
      const z = j * S + (rng() * 2 - 1) * PARCEL.jitter * S;
      if (!isLand(x, z, final)) continue;
      let tier = 0;
      for (let t = 1; t <= MAX_TIER; t++) {
        if (isLand(x, z, terrains[t]!)) {
          tier = t;
          break;
        }
      }
      if (!tier) continue;
      const steep = !isPlantable(x, z, final);
      // Litter: a few pieces around the centre, on ground the parcel's own tier has.
      const L = terrains[tier]!;
      const litter: [number, number][] = [];
      const want = PARCEL.litterBase + (tier >= PARCEL.litterExtraFromTier ? 1 : 0);
      for (let k = 0; k < want * 4 && litter.length < want; k++) {
        const a = rng() * Math.PI * 2;
        const r = 1.1 + rng() * S * 0.3;
        const lx = x + Math.cos(a) * r;
        const lz = z + Math.sin(a) * r;
        if (isLand(lx, lz, L)) litter.push([lx, lz]);
      }
      let invasive: [number, number] | null = null;
      if (rng() < PARCEL.invasiveChance) {
        const a = rng() * Math.PI * 2;
        const ix = x + Math.cos(a) * 1.8;
        const iz = z + Math.sin(a) * 1.8;
        if (isLand(ix, iz, L)) invasive = [ix, iz];
      }
      parcels.push({ id: `p${i}_${j}`, i, j, x, z, tier, steep, litter, invasive });
    }
  }
  const byId = new Map(parcels.map((p) => [p.id, p]));
  const grid = new Map(parcels.map((p) => [cellKey(p.i, p.j), p]));
  return { seed, parcels, byId, grid };
}

/**
 * The parcel a point belongs to: nearest seed among the surrounding cells,
 * with the distance bent by a little noise so borders are organic. Null over
 * water and wherever no parcel was kept.
 */
export function parcelAt(field: ParcelField, x: number, z: number): ParcelSpec | null {
  const S = PARCEL.spacingM;
  const ci = Math.round(x / S);
  const cj = Math.round(z / S);
  let best: ParcelSpec | null = null;
  let bestD = Infinity;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const p = field.grid.get(cellKey(ci + di, cj + dj));
      if (!p) continue;
      const bend = (fbm(x * 0.21 + p.i * 3.1, z * 0.21 + p.j * 1.7, 2) - 0.5) * 2 * PARCEL.edgeNoiseM;
      const d = Math.hypot(p.x - x, p.z - z) + bend;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
  }
  // A point far from every seed (a cove between parcels, the open sea) belongs to none.
  return best && bestD < S * 1.05 ? best : null;
}

/** The parcels a player can work at this rank tier. */
export function parcelsAt(field: ParcelField, tier: number): ParcelSpec[] {
  return field.parcels.filter((p) => p.tier <= tier);
}

/**
 * Which region a parcel is. Once worked, it keeps the region it was worked as
 * — a restored meadow stays that meadow when a new region is discovered next
 * to it. Untouched, it follows the regions discovered so far, so La Pradera's
 * wild ground becomes pastizal the day La Pradera appears.
 */
export function parcelRegion(p: ParcelSpec, state: ParcelState | undefined, tier: number): RegionId {
  if (state?.r) return state.r;
  const region = regionAt(p.x, p.z, anchorsFor(Math.max(tier, p.tier)));
  // The mountain's wild ground is the mountain's, whatever it is nearest to.
  if (p.steep && region !== 'cumbre' && region !== 'monumento' && tier >= 8) return 'monte';
  return region;
}

/** How much a stage asks for, scaled by how deep in the ladder the region is. */
export function stageNeed(p: ParcelSpec, region: RegionId, stage: number): number {
  const t = p.tier;
  switch (stage) {
    case 0:
      return p.litter.length + (p.invasive ? 1 : 0);
    case 1:
      return PARCEL.soilBase + Math.floor((t - 1) / PARCEL.soilPerTiers);
    case 2:
      return PARCEL.plantBase + Math.floor((t - 1) / PARCEL.plantPerTiers);
    case 3:
      return PARCEL_TYPES[region].grow.water;
    case 4:
      return PARCEL.flourishSpecies;
    default:
      return 0;
  }
}

/** What stage 1→2 is fed with here. */
export function soilMaterial(region: RegionId): 'compost' | 'piedras' {
  return PARCEL_TYPES[region].soil;
}

/** A fresh, untouched parcel. */
export function wildParcel(): ParcelState {
  return { s: 0, lit: 0, inv: false, n: 0, plants: [], wet: [], at: 0 };
}

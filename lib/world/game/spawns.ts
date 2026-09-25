/**
 * What the day leaves lying around: litter the sea brings, organic piles,
 * fallen branches, loose stones. Plus each wild parcel's own litter and
 * invasive, which stay until the parcel is cleaned.
 *
 * Positions are a pure function of the island and the local date, so every
 * device shows the same things in the same places, and what you picked stays
 * picked (`TodayState.picked`) until tomorrow brings a new set.
 *
 * The sea bringing litter every day is on purpose: it is true of real coasts,
 * and it is the lesson — the beach does not stay clean because you cleaned it
 * once; it stays clean because less goes into the water upstream.
 */
import { isPlantable, isRockable, isWater, type WorldLayout } from '../terrain';
import { coastRadiusAt } from '../layout';
import { hashInt, mulberry32 } from '../rng';
import { SPAWNS } from './config';
import { WASTE, WASTE_KINDS } from './materials';
import type { ParcelSpec } from './parcels';
import type { ParcelState, WasteKind } from './types';

export type SpawnKind = 'residuos' | 'hojas' | 'ramas' | 'piedras';

export interface Spawn {
  id: string;
  kind: SpawnKind;
  waste?: WasteKind;
  x: number;
  z: number;
  /** Parcel litter belongs to its parcel; daily spawns to nobody. */
  parcel?: string;
  /** Index inside the parcel's litter, for its bitmask. */
  index?: number;
}

/** A litter kind, weighted by how often each washes up. */
export function pickWaste(rng: () => number): WasteKind {
  let total = 0;
  for (const k of WASTE_KINDS) total += WASTE[k].weight;
  let r = rng() * total;
  for (const k of WASTE_KINDS) {
    r -= WASTE[k].weight;
    if (r <= 0) return k;
  }
  return 'botella';
}

interface SpawnInput {
  seed: number;
  day: string;
  tier: number;
  terrain: WorldLayout;
  coastline: Float32Array;
  /** Places the day must leave clear: stations, the Ceibo, structures. */
  keepClear?: readonly { x: number; z: number; r: number }[];
}

/** Today's spawns. Deterministic from `(seed, day)`. */
export function dailySpawns(input: SpawnInput): Spawn[] {
  const { seed, day, tier, terrain, coastline } = input;
  const rng = mulberry32(hashInt(`spawns:${seed}:${day}`));
  const out: Spawn[] = [];
  const minSq = SPAWNS.minSpacingM * SPAWNS.minSpacingM;
  const clear = input.keepClear ?? [];
  const ok = (x: number, z: number) => {
    for (const c of clear) if ((c.x - x) ** 2 + (c.z - z) ** 2 < c.r * c.r) return false;
    for (const s of out) if ((s.x - x) ** 2 + (s.z - z) ** 2 < minSq) return false;
    return true;
  };
  // A bigger island spreads a little more around, never enough to become a chore.
  const grow = 1 + 0.06 * (Math.min(11, tier) - 1);

  // Litter on the beach: just inside the coastline, where the sand is.
  const litter = Math.round(SPAWNS.beachLitter * grow);
  for (let k = 0, tries = 0; k < litter && tries < litter * 12; tries++) {
    const a = rng() * Math.PI * 2;
    const r = coastRadiusAt(coastline, a) - 0.8 - rng() * 2.2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (isWater(x, z, terrain) || !ok(x, z)) continue;
    out.push({ id: `${day}:r:${k}`, kind: 'residuos', waste: pickWaste(rng), x, z });
    k++;
  }

  const scatter = (kind: SpawnKind, count: number, tag: string, ground: (x: number, z: number) => boolean) => {
    const R = terrain.R;
    for (let k = 0, tries = 0; k < count && tries < count * 20; tries++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * R * 0.92;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!ground(x, z) || !ok(x, z)) continue;
      out.push({ id: `${day}:${tag}:${k}`, kind, x, z });
      k++;
    }
  };
  scatter('hojas', Math.round(SPAWNS.leafPiles * grow), 'h', (x, z) => isPlantable(x, z, terrain));
  scatter('ramas', Math.round(SPAWNS.branches * grow), 'b', (x, z) => isPlantable(x, z, terrain));
  scatter('piedras', Math.round(SPAWNS.stones * grow), 's', (x, z) => isRockable(x, z, terrain));
  return out;
}

/**
 * A wild parcel's own litter, still lying where it was. Its kind is fixed per
 * piece, so the same bottle is the same bottle on every device.
 */
export function parcelLitter(p: ParcelSpec, state: ParcelState | undefined): Spawn[] {
  if (state && state.s > 0) return [];
  const out: Spawn[] = [];
  const rng = mulberry32(hashInt(`litter:${p.id}`));
  p.litter.forEach(([x, z], index) => {
    const waste = pickWaste(rng);
    if (state && state.lit & (1 << index)) return;
    out.push({ id: `${p.id}:l:${index}`, kind: 'residuos', waste, x, z, parcel: p.id, index });
  });
  return out;
}

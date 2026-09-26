/**
 * The restoration map — how the game's parcels show on the ground and in the
 * grass (`docs/MUNDO_JUEGO.md` §3.3).
 *
 * One RGBA texture over the same square the grass mask covers, one texel per
 * heightfield cell:
 *
 *   R  vitality      0 wild … 1 flourishing. Drives dry straw ↔ living green.
 *   G  cover         how much of the grass potential grows here. Wild ground is
 *                    sparse and dry; a restored meadow is full.
 *   B  soil          freshly composted earth, dark and rich (suelo vivo, plantada).
 *   A  tall          pastizal and humedal grow tall when alive.
 *
 * Outside every parcel (paths, beaches, the seams between cells) the map says
 * what the region always said, so nothing there changes with play.
 *
 * Which parcel owns each texel is computed once (`owner`); after that, a stage
 * change repaints only that parcel's texels, and the upload is one small texture.
 */
import * as THREE from 'three';

import type { IslandLayout } from '@/lib/world/layout';
import { regionAt } from '@/lib/world/layout';
import { parcelAt, type ParcelField, type ParcelSpec } from '@/lib/world/game/parcels';
import { REGION_CHARACTER } from '@/lib/world/regions';
import type { RegionId } from '@/lib/world/types';
import type { Heightfield } from '@/lib/world/terrain';

export interface RestorationMap {
  tex: THREE.DataTexture;
  data: Uint8Array;
  res: number;
  step: number;
  extent: number;
  /** Texel → index into `parcels`, or -1. */
  owner: Int16Array;
  parcels: ParcelSpec[];
  /** Texel lists per parcel, for partial repaints. */
  texels: number[][];
}

export interface ParcelLook {
  stage: number;
  region: RegionId;
  stars: number;
}

/** How full each type's grass is when alive (relative to the ground's potential). */
const COVER: Record<RegionId, number> = {
  claro: 0.8, pradera: 1, jardin: 0.7, arboleda: 0.55, rio: 0.85, monte: 0.4, cumbre: 0.3, islote: 0.45, monumento: 0.35,
};
const TALL: Partial<Record<RegionId, number>> = { pradera: 1, rio: 0.8, islote: 0.5, claro: 0.3 };

/** Vitality, cover and soil for a stage. Wild ground keeps a little dry grass. */
function lookFor(l: ParcelLook): [number, number, number, number] {
  const full = COVER[l.region];
  switch (l.stage) {
    case 0: return [0, 0.3, 0, 0];
    case 1: return [0.12, 0.16, 0.15, 0];
    case 2: return [0.25, 0.08, 1, 0];
    case 3: return [0.5, 0.3, 0.75, 0];
    case 4: return [0.88, full, 0.25, (TALL[l.region] ?? 0) * 0.8];
    default: return [1, Math.min(1, full * (1.08 + l.stars * 0.04)), 0.2, TALL[l.region] ?? 0];
  }
}

/** Outside parcels, the region's own character, as before the game existed. */
function outsideLook(region: RegionId): [number, number, number, number] {
  const c = REGION_CHARACTER[region];
  return [1, Math.min(1, c.grass / 1.2), 0, region === 'pradera' ? 0.4 : 0];
}

export function buildRestorationMap(
  field: ParcelField, parcels: ParcelSpec[], hf: Heightfield, layout: IslandLayout,
): RestorationMap {
  const { res, step, extent } = hf;
  const data = new Uint8Array(res * res * 4);
  const owner = new Int16Array(res * res).fill(-1);
  const index = new Map(parcels.map((p, i) => [p.id, i]));
  const texels: number[][] = parcels.map(() => []);
  for (let iz = 0; iz < res; iz++) {
    const z = -extent + iz * step;
    for (let ix = 0; ix < res; ix++) {
      const x = -extent + ix * step;
      const t = iz * res + ix;
      const p = parcelAt(field, x, z);
      const i = p ? index.get(p.id) : undefined;
      if (i !== undefined) {
        owner[t] = i;
        texels[i]!.push(t);
      } else {
        const [r, g, b, a] = outsideLook(regionAt(x, z, layout.regions));
        data[t * 4] = r * 255;
        data[t * 4 + 1] = g * 255;
        data[t * 4 + 2] = b * 255;
        data[t * 4 + 3] = a * 255;
      }
    }
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return { tex, data, res, step, extent, owner, parcels, texels };
}

/** Paint one parcel's texels. `blend` 0..1 eases from the previous look for the growth wave. */
export function paintParcel(map: RestorationMap, i: number, look: ParcelLook): void {
  const [r, g, b, a] = lookFor(look);
  for (const t of map.texels[i] ?? []) {
    map.data[t * 4] = r * 255;
    map.data[t * 4 + 1] = g * 255;
    map.data[t * 4 + 2] = b * 255;
    map.data[t * 4 + 3] = a * 255;
  }
}

/**
 * The growth wave: paint a parcel's new look outward from its centre over
 * `progress` 0..1, so a stage change spreads across the block instead of
 * switching. Texels beyond the front keep what they had.
 */
export function paintWave(map: RestorationMap, i: number, from: ParcelLook, to: ParcelLook, progress: number): void {
  const p = map.parcels[i];
  if (!p) return;
  const a = lookFor(from);
  const b = lookFor(to);
  const reach = 7.5 * Math.min(1, Math.max(0, progress)) * 1.25;
  for (const t of map.texels[i] ?? []) {
    const x = -map.extent + (t % map.res) * map.step;
    const z = -map.extent + Math.floor(t / map.res) * map.step;
    const d = Math.hypot(x - p.x, z - p.z);
    const k = Math.min(1, Math.max(0, (reach - d) / 1.4));
    for (let c = 0; c < 4; c++) map.data[t * 4 + c] = (a[c]! + (b[c]! - a[c]!) * k) * 255;
  }
}

export function commitRestoration(map: RestorationMap): void {
  map.tex.needsUpdate = true;
}

/** A 1×1 "everything as it always was" map, for worlds without a game (visits of old saves). */
let neutral: THREE.DataTexture | null = null;
export function neutralRestoration(): THREE.DataTexture {
  if (neutral) return neutral;
  neutral = new THREE.DataTexture(new Uint8Array([255, 255, 0, 0]), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  neutral.needsUpdate = true;
  return neutral;
}

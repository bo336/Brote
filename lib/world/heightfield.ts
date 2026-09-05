/**
 * The baked heightfield — the half of the terrain engine the game actually
 * touches at runtime.
 *
 * Split from `terrain.ts` for the 400-line rule (`01-RULES.md` §3.2), and the
 * seam is a real one: everything in `terrain.ts` answers "what is the ground
 * like at this point", evaluating noise; everything here answers "what did we
 * bake", reading a `Float32Array`. **Nothing in the game may call
 * `terrainHeight()` per frame** — it calls `sampleHeight` instead, and that
 * distinction is now a file boundary rather than a comment.
 *
 * `terrain.ts` re-exports all of this, so no caller has to know it moved.
 */
import { TERRAIN } from './config';
import { terrainHeight, type WorldLayout } from './terrain';

/**
 * A square grid of heights covering `[-extent, +extent]` on both axes.
 * `res × res` samples, row-major, `z` slowest. One `Float32Array`, no objects.
 */
export interface Heightfield {
  res: number;
  /** Half-width of the covered square, in metres. */
  extent: number;
  /** Metres between adjacent samples. */
  step: number;
  data: Float32Array;
}

/**
 * The resolution to bake an island at.
 *
 * A fixed grid count would give a tier-1 island a 0.2 m step and a tier-11
 * island a 1 m one — the same number of samples spread over eleven times the
 * area. This targets a constant **step size** instead, clamped at both ends so a
 * small island is not over-sampled and the largest one still bakes inside
 * `TERRAIN.bakeBudgetMs` on a cheap phone.
 */
export function bakeResolutionFor(layout: WorldLayout): number {
  const span = fieldExtent(layout) * 2;
  const res = Math.ceil(span / TERRAIN.bakeStepM) + 1;
  return Math.min(TERRAIN.bakeResolutionMax, Math.max(TERRAIN.bakeResolutionMin, res));
}

/** How far the field has to reach: the island, its margin, and El Islote. */
function fieldExtent(layout: WorldLayout): number {
  let extent = layout.R * (1 + TERRAIN.plantableMargin);
  if (layout.islet) {
    extent = Math.max(extent, Math.hypot(layout.islet.x, layout.islet.z) + layout.islet.r * 1.3);
  }
  return extent;
}

/**
 * Bake the height function once. This is the whole point of the port: the ONLY
 * place `terrainHeight` runs at scale, behind the loading state, never during
 * interaction. Cost is `res²` evaluations — see `TERRAIN.bakeBudgetMs`.
 */
export function bakeHeightfield(layout: WorldLayout, res: number): Heightfield {
  const n = Math.max(2, Math.floor(res));
  const extent = fieldExtent(layout);
  const step = (extent * 2) / (n - 1);
  const data = new Float32Array(n * n);
  for (let iz = 0; iz < n; iz++) {
    const z = -extent + iz * step;
    const row = iz * n;
    for (let ix = 0; ix < n; ix++) {
      data[row + ix] = terrainHeight(-extent + ix * step, z, layout);
    }
  }
  return { res: n, extent, step, data };
}

/** Bilinear height lookup. This is what the character controller calls. */
export function sampleHeight(hf: Heightfield, x: number, z: number): number {
  const { res, extent, step, data } = hf;
  const gx = (x + extent) / step;
  const gz = (z + extent) / step;
  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  // Clamp to the last full cell so the interpolation always has four corners.
  const cx = ix < 0 ? 0 : ix > res - 2 ? res - 2 : ix;
  const cz = iz < 0 ? 0 : iz > res - 2 ? res - 2 : iz;
  const fx = gx - cx < 0 ? 0 : gx - cx > 1 ? 1 : gx - cx;
  const fz = gz - cz < 0 ? 0 : gz - cz > 1 ? 1 : gz - cz;
  const r0 = cz * res + cx;
  const r1 = r0 + res;
  const h00 = data[r0]!;
  const h10 = data[r0 + 1]!;
  const h01 = data[r1]!;
  const h11 = data[r1 + 1]!;
  const top = h00 + (h10 - h00) * fx;
  const bot = h01 + (h11 - h01) * fx;
  return top + (bot - top) * fz;
}

/** Normal from the baked field, by central difference on one cell. */
export function sampleNormal(hf: Heightfield, x: number, z: number): [number, number, number] {
  const e = hf.step;
  const nx = sampleHeight(hf, x - e, z) - sampleHeight(hf, x + e, z);
  const nz = sampleHeight(hf, x, z - e) - sampleHeight(hf, x, z + e);
  const ny = 2 * e;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

/** Slope from the baked field. 0 flat → 1 vertical. */
export function sampleSlope(hf: Heightfield, x: number, z: number): number {
  const n = sampleNormal(hf, x, z);
  return Math.max(0, Math.min(1, 1 - n[1]));
}

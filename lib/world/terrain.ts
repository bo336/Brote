/**
 * The terrain engine, ported from `lib/mundo/terrain.ts`.
 *
 * ONE height function drives everything: the ground mesh, where water sits, and
 * where every tree, rock and animal is placed. That shared source of truth is
 * what turns a pile of shapes on a disc into a real miniature landscape.
 *
 * The maths is unchanged (`02-AUDIT.md` §8 — it was the strongest engineering in
 * the old feature). What changed is the CALL FREQUENCY: the old `Ground` ran
 * `terrainHeight` + `slopeAt` over a 132² grid on every re-render, hundreds of
 * thousands of noise evaluations synchronously, which is why tapping the world
 * froze it. Now it is baked ONCE into a `Float32Array` and sampled bilinearly.
 * **Nothing in the game may call `terrainHeight()` per frame again.**
 */
import { TERRAIN, WATER_LEVEL } from './config';

export { WATER_LEVEL };

// ── Deterministic noise ─────────────────────────────────────────────────────

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const ux = smooth(fx);
  const uz = smooth(fz);
  return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
}

/** Fractal noise in [0,1]. */
export function fbm(x: number, z: number, octaves = 4): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

// ── World layout ────────────────────────────────────────────────────────────

export interface LakeSpec {
  x: number;
  z: number;
  /** Radius of the water surface. */
  r: number;
  /** How deep the basin is carved below water level. */
  depth: number;
}

export interface RiverSpec {
  from: [number, number];
  to: [number, number];
  width: number;
}

export interface MountainSpec {
  x: number;
  z: number;
  r: number;
  h: number;
}

export interface WorldLayout {
  /** Island radius (land ends here, then the cliff drops). */
  R: number;
  lakes: LakeSpec[];
  rivers: RiverSpec[];
  mountains: MountainSpec[];
  /** Seed so two worlds with the same index look identical everywhere. */
  seed: number;
}

/**
 * Build the layout for a world. Lakes, rivers and mountains appear as the world
 * grows, and their positions are deterministic per world index.
 */
export function makeLayout(worldIndex: number, R: number, hasPond: boolean): WorldLayout {
  const seed = worldIndex * 7919;
  const lakes: LakeSpec[] = [];
  const rivers: RiverSpec[] = [];
  const mountains: MountainSpec[] = [];

  // Main lake sits off-centre, scaled to the island.
  if (hasPond) {
    const lx = R * 0.46;
    const lz = -R * 0.36;
    const lr = R * 0.26;
    lakes.push({ x: lx, z: lz, r: lr, depth: 0.34 });

    // River runs from the lake out to the rim (it becomes the waterfall).
    const dir = Math.atan2(lz, lx);
    rivers.push({
      from: [lx + Math.cos(dir) * lr * 0.75, lz + Math.sin(dir) * lr * 0.75],
      to: [Math.cos(dir) * (R + 0.25), Math.sin(dir) * (R + 0.25)],
      width: R * 0.1,
    });
  }
  // A second, smaller lake once the world is bigger.
  if (worldIndex >= 4) {
    lakes.push({ x: -R * 0.5, z: R * 0.42, r: R * 0.16, depth: 0.26 });
  }

  // Mountains rise on the far side so they frame the scene.
  if (worldIndex >= 2) mountains.push({ x: -R * 0.58, z: -R * 0.5, r: R * 0.42, h: 1.15 });
  if (worldIndex >= 4) mountains.push({ x: -R * 0.3, z: -R * 0.72, r: R * 0.3, h: 0.8 });
  if (worldIndex >= 6) mountains.push({ x: R * 0.12, z: -R * 0.78, r: R * 0.24, h: 0.6 });

  return { R, lakes, rivers, mountains, seed };
}

// ── Geometry helpers ────────────────────────────────────────────────────────

/** Distance from a point to a segment (for river carving). */
function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t;
  const cz = az + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

/** Signed progress (0..1) along a river segment — used for flow direction. */
export function riverProgress(px: number, pz: number, r: RiverSpec): number {
  const dx = r.to[0] - r.from[0];
  const dz = r.to[1] - r.from[1];
  const len2 = dx * dx + dz * dz || 1;
  return Math.max(0, Math.min(1, ((px - r.from[0]) * dx + (pz - r.from[1]) * dz) / len2));
}

// ── The height field ────────────────────────────────────────────────────────

/**
 * Ground elevation at (x, z). Above WATER_LEVEL is land; below it is lake bed.
 * Pure, but NOT cheap — call it at bake time, never per frame.
 */
export function terrainHeight(x: number, z: number, L: WorldLayout): number {
  const d = Math.hypot(x, z);
  const s = L.seed * 0.001;

  // Rolling hills — the base landscape.
  let h = 0.1 + fbm(x * 0.55 + s, z * 0.55 - s, 4) * 0.26;
  // A second, larger swell so the land reads as having regions.
  h += (fbm(x * 0.22 - s, z * 0.22 + s, 2) - 0.5) * 0.22;

  // Mountains: smooth peaks that blend into the hills.
  for (const m of L.mountains) {
    const md = Math.hypot(x - m.x, z - m.z);
    if (md < m.r) {
      const t = 1 - md / m.r;
      // pow gives a proper peak instead of a dome
      const peak = Math.pow(smooth(t), 1.6) * m.h;
      // Rocky detail on the slopes
      const rough = (fbm(x * 3.1 + s, z * 3.1 - s, 3) - 0.5) * 0.12 * smooth(t);
      h += peak + rough;
    }
  }

  // Lake basins: carve a smooth bowl, with a shoreline shelf.
  for (const lake of L.lakes) {
    const ld = Math.hypot(x - lake.x, z - lake.z);
    const outer = lake.r * 1.35; // where the bank starts
    if (ld < outer) {
      const t = 1 - ld / outer; // 0 at bank edge → 1 at centre
      const bowl = Math.pow(smooth(t), 0.85);
      h -= bowl * (lake.depth + 0.18);
      // Gentle shelf right at the waterline reads as a beach.
      if (ld > lake.r * 0.92 && ld < outer) h += 0.02;
    }
  }

  // River channels: carve a V that gets slightly deeper downstream.
  for (const r of L.rivers) {
    const rd = distToSegment(x, z, r.from[0], r.from[1], r.to[0], r.to[1]);
    const halfW = r.width * 1.5;
    if (rd < halfW) {
      const t = 1 - rd / halfW;
      h -= Math.pow(smooth(t), 0.9) * 0.3;
    }
  }

  // Coastal falloff: the last stretch before the rim eases down to the cliff.
  const coast = L.R * 0.86;
  if (d > coast) {
    const t = Math.min(1, (d - coast) / (L.R - coast));
    h = h * (1 - smooth(t) * 0.55) - smooth(t) * 0.06;
  }

  return h;
}

/** Surface normal from finite differences — used for slope-aware placement. */
export function terrainNormal(x: number, z: number, L: WorldLayout): [number, number, number] {
  const e = TERRAIN.normalEpsilon;
  const hL = terrainHeight(x - e, z, L);
  const hR = terrainHeight(x + e, z, L);
  const hD = terrainHeight(x, z - e, L);
  const hU = terrainHeight(x, z + e, L);
  const nx = hL - hR;
  const nz = hD - hU;
  const ny = 2 * e;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

/** 0 (flat) → 1 (vertical). Steep ground gets rock instead of grass or trees. */
export function slopeAt(x: number, z: number, L: WorldLayout): number {
  const n = terrainNormal(x, z, L);
  return Math.max(0, Math.min(1, 1 - n[1]));
}

/** True where a point is under water (inside a lake or a river channel). */
export function isWater(x: number, z: number, L: WorldLayout): boolean {
  return terrainHeight(x, z, L) < WATER_LEVEL;
}

/** True where something can be planted: on land, not too steep, inside the isle. */
export function isPlantable(x: number, z: number, L: WorldLayout, margin = TERRAIN.plantableMargin): boolean {
  const d = Math.hypot(x, z);
  if (d > L.R - margin) return false;
  const h = terrainHeight(x, z, L);
  if (h < WATER_LEVEL + TERRAIN.plantableMinHeight) return false; // shoreline stays clear
  if (slopeAt(x, z, L) > TERRAIN.plantableMaxSlope) return false; // cliffs stay bare
  return true;
}

/**
 * Find a plantable spot near a desired position by spiralling outward.
 * Guarantees props never end up in a lake or on a cliff.
 */
export function snapToLand(
  x: number,
  z: number,
  L: WorldLayout,
  rng: () => number,
  margin = TERRAIN.plantableMargin,
): [number, number] | null {
  if (isPlantable(x, z, L, margin)) return [x, z];
  for (let i = 1; i <= TERRAIN.snapRings; i++) {
    const step = TERRAIN.snapStep * i;
    const a = rng() * Math.PI * 2;
    for (let k = 0; k < TERRAIN.snapAnglesPerRing; k++) {
      const ang = a + (k / TERRAIN.snapAnglesPerRing) * Math.PI * 2;
      const nx = x + Math.cos(ang) * step;
      const nz = z + Math.sin(ang) * step;
      if (isPlantable(nx, nz, L, margin)) return [nx, nz];
    }
  }
  return null;
}

// ── The baked heightfield ───────────────────────────────────────────────────

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
 * Bake the height function once. This is the whole point of the port: the ONLY
 * place `terrainHeight` runs at scale, behind the loading state, never during
 * interaction. Cost is `res²` evaluations — see `TERRAIN.bakeBudgetMs`.
 */
export function bakeHeightfield(layout: WorldLayout, res: number): Heightfield {
  const n = Math.max(2, Math.floor(res));
  // The cliff and the soft coastal push-back both live just outside R, so the
  // field covers a little more than the island itself.
  const extent = layout.R * (1 + TERRAIN.plantableMargin);
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

/**
 * The worn paths between the regions.
 *
 * The playtest said "I don't know what to do or where to go". A path is the
 * oldest answer a landscape has: tierra colorada worn into the grass from El
 * Claro out to every region the tier has opened, curving the way feet curve.
 * You can see where they go from anywhere, and following one always arrives
 * somewhere.
 *
 * Pure and deterministic, like the rest of the island: the same seed lays the
 * same paths on every device. Built once per layout and cached.
 */
import { PATHS } from './config';
import type { IslandLayout } from './layout';
import { hashInt, mulberry32 } from './rng';

export interface PathSet {
  /** Segments as `[ax, az, bx, bz]`, packed. */
  segments: Float32Array;
  count: number;
}

const cache = new WeakMap<IslandLayout, PathSet>();

/** Every path on this island, from the spawn to each unlocked region. */
export function pathsFor(layout: IslandLayout): PathSet {
  const hit = cache.get(layout);
  if (hit) return hit;
  const rng = mulberry32(hashInt(`paths:${layout.seed}`));
  const [sx, sz] = layout.spawn;
  const out: number[] = [];

  for (const region of layout.regions) {
    if (!region.unlocked || region.id === 'claro') continue;
    const dx = region.x - sx;
    const dz = region.z - sz;
    const len = Math.hypot(dx, dz);
    if (len < PATHS.minLengthM) continue;
    // A gentle S: two control points pushed sideways by seeded amounts.
    const nx = -dz / len;
    const nz = dx / len;
    const b1 = (rng() - 0.5) * len * PATHS.bendFrac;
    const b2 = (rng() - 0.5) * len * PATHS.bendFrac;
    const c1x = sx + dx / 3 + nx * b1;
    const c1z = sz + dz / 3 + nz * b1;
    const c2x = sx + (dx * 2) / 3 + nx * b2;
    const c2z = sz + (dz * 2) / 3 + nz * b2;
    // Stop where the region itself takes over, so a path arrives rather than stabs.
    const end = 1 - Math.min(0.45, (region.radius * PATHS.arriveFrac) / len);
    let px = sx;
    let pz = sz;
    for (let i = 1; i <= PATHS.samples; i++) {
      const t = (i / PATHS.samples) * end;
      const u = 1 - t;
      const x = u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * region.x;
      const z = u * u * u * sz + 3 * u * u * t * c1z + 3 * u * t * t * c2z + t * t * t * region.z;
      out.push(px, pz, x, z);
      px = x;
      pz = z;
    }
  }

  const set = { segments: Float32Array.from(out), count: out.length / 4 };
  cache.set(layout, set);
  return set;
}

/**
 * How far a point is from the nearest path's centre line, in metres. Infinity
 * with no paths. `along`, when given, receives how far along that path the
 * nearest point is: 0 at the spawn, 1 where the path arrives.
 */
export function pathDistance(x: number, z: number, paths: PathSet, along?: { t: number }): number {
  const s = paths.segments;
  let best = Infinity;
  let bestI = 0;
  let bestT = 0;
  for (let i = 0; i < paths.count; i++) {
    const o = i * 4;
    const ax = s[o]!;
    const az = s[o + 1]!;
    const bx = s[o + 2]!;
    const bz = s[o + 3]!;
    const ex = bx - ax;
    const ez = bz - az;
    const l2 = ex * ex + ez * ez || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2));
    const qx = ax + ex * t - x;
    const qz = az + ez * t - z;
    const d = qx * qx + qz * qz;
    if (d < best) {
      best = d;
      bestI = i;
      bestT = t;
    }
  }
  // Every path is exactly `samples` segments, packed one path after another.
  if (along) along.t = ((bestI % PATHS.samples) + bestT) / PATHS.samples;
  return Math.sqrt(best);
}

/** How much of a path a point stands on: 1 in the worn middle, 0 off it. */
export function pathWeight(x: number, z: number, paths: PathSet): number {
  const dist = pathDistance(x, z, paths);
  const half = PATHS.widthM * 0.5;
  if (dist <= half) return 1;
  const k = Math.min(1, (dist - half) / PATHS.edgeM);
  return 1 - k * k * (3 - 2 * k);
}

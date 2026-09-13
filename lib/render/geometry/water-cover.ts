/**
 * Who draws the water where.
 *
 * The lakes' surface grids and the rivers' strips overlap where a river runs
 * into a lagoon, and exactly one of them has to draw each spot: where both did,
 * two transparent sheets stacked into a pale rectangle; where neither did, the
 * river showed squares of dry sand.
 *
 *  - Inside a lake's grid, at sea level, the lake draws.
 *  - Wherever a river runs above sea level, its strip draws.
 */
import { LAYOUT, WATER_LEVEL } from '@/lib/world/config';
import { sampleHeight, type Heightfield, type WorldLayout } from '@/lib/world/terrain';

/** How far past its radius a lake's surface grid reaches, as a multiple of it. */
export const LAKE_EXTENT = 1.45;
/** How full a river's channel runs, as a fraction of its carved depth. */
export const RIVER_FILL = 0.72;
/** The carve in `terrainHeight` reaches `width × 1.5` either side of the centre line. */
export const CARVE_HALF_WIDTH = 1.5;

/** Whether a point is inside the square a lake's surface grid covers. */
export function inLake(terrain: WorldLayout, x: number, z: number): boolean {
  for (const lake of terrain.lakes) {
    const reach = lake.r * LAKE_EXTENT;
    if (Math.abs(x - lake.x) < reach && Math.abs(z - lake.z) < reach) return true;
  }
  return false;
}

/** Whether a river runs here above sea level, so that its own strip is the surface. */
export function riverRunsAbove(terrain: WorldLayout, hf: Heightfield, x: number, z: number): boolean {
  for (const river of terrain.rivers) {
    const [ax, az] = river.from;
    const ex = river.to[0] - ax;
    const ez = river.to[1] - az;
    const l2 = ex * ex + ez * ez;
    if (l2 < 1) continue;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2));
    const cx = ax + ex * t;
    const cz = az + ez * t;
    if (Math.hypot(x - cx, z - cz) > river.width * CARVE_HALF_WIDTH) continue;
    const surface = sampleHeight(hf, cx, cz) + (river.depth ?? LAYOUT.riverDepthM) * RIVER_FILL;
    if (surface > WATER_LEVEL + 0.005) return true;
  }
  return false;
}

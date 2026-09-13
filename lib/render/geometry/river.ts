/**
 * The river's water, following its channel down the island.
 *
 * `buildWaterMeshes` fills basins — cells under the water line — which is right
 * for the puddle and the lagoon and wrong for a river. The channel is carved
 * into the ground from the mountain to the sea, most of it above sea level, so
 * it was drawn as a dry trench a metre deep across the island: one of the
 * "items misplaced" frames from the playtest. A river's surface is not level; it
 * runs downhill a little below its own banks.
 *
 * So this walks each river segment and lays a strip across the channel whose
 * surface sits a fixed fraction of the carve above the channel's floor at that
 * point, and never below the sea. Vertices outside the wetted width sit under
 * the banks, where the ground hides them, with a depth of zero — which is where
 * the shader draws the foam against the bank.
 */
import * as THREE from 'three';

import { LAYOUT, WATER_LEVEL } from '@/lib/world/config';
import { sampleHeight, type Heightfield, type WorldLayout } from '@/lib/world/terrain';
import type { WaterMesh } from './terrain';
import { CARVE_HALF_WIDTH, inLake, RIVER_FILL } from './water-cover';

/** Metres between cross-sections along the river. */
const STEP_M = 0.45;
/** Vertices across the channel. */
const ACROSS = 9;
/** Deeper than this at sea level, a lagoon or the sea already has a surface here. */
const BASIN_DEPTH_M = 0.05;

export function buildRiverMeshes(terrain: WorldLayout, hf: Heightfield): WaterMesh[] {
  const out: WaterMesh[] = [];
  for (const river of terrain.rivers) {
    const [ax, az] = river.from;
    const [bx, bz] = river.to;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 1) continue;
    const nx = -dz / len;
    const nz = dx / len;
    const half = river.width * CARVE_HALF_WIDTH;
    const depth = river.depth ?? LAYOUT.riverDepthM;
    const steps = Math.ceil(len / STEP_M);

    const positions: number[] = [];
    const depths: number[] = [];
    const indices: number[] = [];
    let maxDepth = 0;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = ax + dx * t;
      const cz = az + dz * t;
      const surface = Math.max(WATER_LEVEL, sampleHeight(hf, cx, cz) + depth * RIVER_FILL);
      for (let k = 0; k < ACROSS; k++) {
        const f = (k / (ACROSS - 1)) * 2 - 1;
        const x = cx + nx * f * half;
        const z = cz + nz * f * half;
        const d = Math.max(0, surface - sampleHeight(hf, x, z));
        maxDepth = Math.max(maxDepth, d);
        positions.push(x, surface, z);
        depths.push(d);
      }
    }
    for (let s = 0; s < steps; s++) {
      for (let k = 0; k < ACROSS - 1; k++) {
        const a = s * ACROSS + k;
        const b = a + 1;
        const c = a + ACROSS;
        const d = c + 1;
        // A quad wholly under the banks is never seen; skip it.
        if (depths[a]! + depths[b]! + depths[c]! + depths[d]! === 0) continue;
        // Where the river has reached a lagoon, the lagoon's surface already covers
        // it: two transparent sheets at one height drew a pale seam. Only inside a
        // lake's own grid, though — skipped anywhere else, nothing covered it, and
        // the low meadow river was drawn as squares of dry sand.
        const level = positions[a * 3 + 1]! <= WATER_LEVEL + 1e-4 && positions[d * 3 + 1]! <= WATER_LEVEL + 1e-4;
        if (level && depths[a]! > BASIN_DEPTH_M && depths[b]! > BASIN_DEPTH_M && depths[c]! > BASIN_DEPTH_M && depths[d]! > BASIN_DEPTH_M
          && inLake(terrain, positions[a * 3]!, positions[a * 3 + 2]!) && inLake(terrain, positions[d * 3]!, positions[d * 3 + 2]!)) continue;
        indices.push(a, c, b, b, c, d);
      }
    }
    if (indices.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    out.push({ geometry: geo, maxDepth });
  }
  return out;
}

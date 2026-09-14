/**
 * The shallows: one water surface for everywhere on the island that lies below
 * the sea but is not the sea.
 *
 * The lagoon had its own square grid and the river its own strip, and between
 * them there was nothing. At tier 7 El Río reaches the coast through flats a few
 * centimetres under the water line, and those flats showed the edges of both
 * meshes: hard-edged rectangles of water lying on the sand. This is a single
 * grid over the whole heightfield that keeps every cell with a corner under the
 * water, so the surface exists exactly where water does — the shader measures
 * true depth per pixel and discards what is dry (`materials/water.ts`).
 *
 * Three things keep their own meshes: the open sea past the coastline (the grid
 * is clamped to its inner edge, so the two meet instead of stacking), puddles
 * (their own material), and a river running above sea level (`river.ts`).
 */
import * as THREE from 'three';

import { WATER, WATER_LEVEL } from '@/lib/world/config';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { SEA_UNDERLAP, type WaterMesh } from './terrain';
import { inPuddle, riverRunsAbove } from './water-cover';

export function buildShallows(layout: IslandLayout, hf: Heightfield): WaterMesh | null {
  const terrain = layout.terrain;
  const span = hf.extent * 2;
  const n = Math.ceil(span / WATER.lakeCellM);
  const step = span / n;
  const diag = step * Math.SQRT1_2;
  const index = new Int32Array((n + 1) * (n + 1)).fill(-1);
  const positions: number[] = [];
  const depths: number[] = [];
  const indices: number[] = [];
  let maxDepth = 0;

  const seaEdge = (x: number, z: number) => coastRadiusAt(layout.coastline, Math.atan2(z, x)) - SEA_UNDERLAP;

  const vertexAt = (ix: number, iz: number): number => {
    const key = iz * (n + 1) + ix;
    const hit = index[key]!;
    if (hit >= 0) return hit;
    let x = -hf.extent + ix * step;
    let z = -hf.extent + iz * step;
    // Pulled in to the sea's inner edge, so the two surfaces meet rather than overlap.
    const r = Math.hypot(x, z);
    const edge = seaEdge(x, z);
    if (r > edge && r > 1e-6) {
      x *= edge / r;
      z *= edge / r;
    }
    const depth = Math.max(0, WATER_LEVEL - sampleHeight(hf, x, z));
    maxDepth = Math.max(maxDepth, depth);
    const id = positions.length / 3;
    positions.push(x, WATER_LEVEL, z);
    depths.push(depth);
    index[key] = id;
    return id;
  };

  for (let iz = 0; iz < n; iz++) {
    const z0 = -hf.extent + iz * step;
    for (let ix = 0; ix < n; ix++) {
      const x0 = -hf.extent + ix * step;
      const cx = x0 + step / 2;
      const cz = z0 + step / 2;
      // Wholly past the sea's inner edge: the open sea is the surface there.
      if (Math.hypot(cx, cz) - diag > seaEdge(cx, cz)) continue;
      const lowest = Math.min(
        sampleHeight(hf, x0, z0), sampleHeight(hf, x0 + step, z0),
        sampleHeight(hf, x0, z0 + step), sampleHeight(hf, x0 + step, z0 + step),
      );
      if (lowest >= WATER_LEVEL) continue;
      if (inPuddle(terrain, cx, cz) || riverRunsAbove(terrain, hf, cx, cz)) continue;
      const a = vertexAt(ix, iz);
      const b = vertexAt(ix + 1, iz);
      const c = vertexAt(ix + 1, iz + 1);
      const d = vertexAt(ix, iz + 1);
      indices.push(a, c, b, a, d, c);
    }
  }
  if (indices.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return { geometry: geo, maxDepth };
}

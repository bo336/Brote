/**
 * The heightfield as a small float texture, shared by everything that needs the
 * ground's height on the GPU: the grass roots its blades on it, and the water
 * measures its true depth against it, pixel by pixel.
 *
 * **Past the coastline it is sea floor.** The height function goes on past the
 * coast as dry land nobody draws — a few centimetres above the water, all the
 * way to El Islote. Measured against that, the open sea was "dry" and discarded
 * itself: from La Cumbre the ocean had pale holes in it the size of the island,
 * and the tier-7 river mouth opened onto a white plain. So beyond the coast (and
 * clear of El Islote) the floor falls away over the shelf to real sea depth.
 *
 * Built once per heightfield; the texture cache owns its disposal.
 */
import * as THREE from 'three';

import { WATER, WATER_LEVEL } from '@/lib/world/config';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import { getTexture } from './materials';

const cache = new WeakMap<Heightfield, THREE.DataTexture>();
let serial = 0;

export function heightTextureFor(hf: Heightfield, layout: IslandLayout): THREE.DataTexture {
  const hit = cache.get(hf);
  if (hit) return hit;
  const tex = getTexture(`height:${++serial}`, () => {
    const { res, data, step, extent } = hf;
    const islet = layout.terrain.islet;
    const floor = WATER_LEVEL - WATER.seaFloorM;
    const heights = new Uint16Array(res * res);
    for (let iz = 0; iz < res; iz++) {
      const z = -extent + iz * step;
      for (let ix = 0; ix < res; ix++) {
        const x = -extent + ix * step;
        const i = iz * res + ix;
        let h = data[i]!;
        const past = Math.hypot(x, z) - coastRadiusAt(layout.coastline, Math.atan2(z, x));
        const nearIslet = islet !== null && Math.hypot(x - islet.x, z - islet.z) < islet.r * WATER.isletShoreFrac;
        if (past > 0 && !nearIslet) {
          const k = Math.min(1, past / WATER.seaShelfM);
          const shelf = k * k * (3 - 2 * k);
          h = Math.min(h, h + (floor - h) * shelf);
        }
        heights[i] = THREE.DataUtils.toHalfFloat(h);
      }
    }
    const t = new THREE.DataTexture(heights, res, res, THREE.RedFormat, THREE.HalfFloatType);
    t.name = 'height';
    t.magFilter = t.minFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  }) as THREE.DataTexture;
  cache.set(hf, tex);
  return tex;
}

/** How a shader finds a point on it: x texels across, y metres per texel, z the extent, w 1 (0: no heightfield). */
export function heightInfo(hf: Heightfield, out: THREE.Vector4): THREE.Vector4 {
  return out.set(hf.res, hf.step, hf.extent, 1);
}

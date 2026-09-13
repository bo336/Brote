/**
 * The heightfield as a small float texture, shared by everything that needs the
 * ground's height on the GPU: the grass roots its blades on it, and the water
 * measures its true depth against it, pixel by pixel.
 *
 * Built once per heightfield; the texture cache owns its disposal.
 */
import * as THREE from 'three';

import type { Heightfield } from '@/lib/world/terrain';
import { getTexture } from './materials';

const cache = new WeakMap<Heightfield, THREE.DataTexture>();
let serial = 0;

export function heightTextureFor(hf: Heightfield): THREE.DataTexture {
  const hit = cache.get(hf);
  if (hit) return hit;
  const tex = getTexture(`height:${++serial}`, () => {
    const { res, data } = hf;
    const heights = new Uint16Array(res * res);
    for (let i = 0; i < res * res; i++) heights[i] = THREE.DataUtils.toHalfFloat(data[i]!);
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

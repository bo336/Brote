/**
 * The paths as a distance map: for every texel of the island, how far it is to
 * the nearest path's centre line.
 *
 * Painted into vertex colours, a path was as sharp as the terrain grid — a
 * blurred orange band a couple of metres wide. Distance, unlike a weight,
 * interpolates almost exactly between texels, so the ground shader can cut a
 * crisp, ragged worn edge from a small texture, and the grass can stop at the
 * very same line.
 */
import * as THREE from 'three';

import { GROUND, PATHS } from '@/lib/world/config';
import type { IslandLayout } from '@/lib/world/layout';
import { pathDistance, pathsFor, type PathSet } from '@/lib/world/paths';
import { getTexture } from '../materials';

const maps = new WeakMap<PathSet, THREE.DataTexture>();
let serial = 0;

/**
 * R: distance to the nearest path, up to `pathMapMaxM`.
 * G: how far that path still has to go — 1 for most of it, falling to 0 over the
 *    last `pathEndFrac`, so a path can thin out where it arrives instead of
 *    stopping in a rounded cap.
 */
function bakePathMap(paths: PathSet, extent: number): THREE.DataTexture {
  const res = GROUND.pathMapRes;
  const data = new Uint8Array(res * res * 2);
  const texel = (extent * 2) / res;
  const along = { t: 0 };
  for (let iz = 0; iz < res; iz++) {
    const z = -extent + (iz + 0.5) * texel;
    for (let ix = 0; ix < res; ix++) {
      const x = -extent + (ix + 0.5) * texel;
      const o = (iz * res + ix) * 2;
      data[o] = Math.round(Math.min(1, pathDistance(x, z, paths, along) / GROUND.pathMapMaxM) * 255);
      data[o + 1] = Math.round(Math.min(1, (1 - along.t) / GROUND.pathEndFrac) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RGFormat, THREE.UnsignedByteType);
  tex.name = 'pathMap';
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** This layout's path map, baked once; the texture cache owns its disposal. */
export function pathMapFor(layout: IslandLayout, extent: number): THREE.DataTexture {
  const paths = pathsFor(layout);
  const hit = maps.get(paths);
  if (hit) return hit;
  const tex = getTexture(`path-map:${++serial}`, () => bakePathMap(paths, extent)) as THREE.DataTexture;
  maps.set(paths, tex);
  return tex;
}

/** How a shader reads the map: x the island's extent, y metres at full value, z the worn half-width, w how ragged. */
export function pathInfo(extent: number, out: THREE.Vector4): THREE.Vector4 {
  return out.set(extent, GROUND.pathMapMaxM, PATHS.widthM * 0.5, GROUND.pathRaggedM);
}

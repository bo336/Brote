/**
 * The one geometry cache, with its `disposeAll()`.
 *
 * Written at the same time as the cache, not afterwards (`19-PHASES.md`). The
 * old world's geometry caches were module-level and never cleared; this one is
 * emptied from `MundoGame`'s unmount effect, and a dev assertion then checks
 * `renderer.info.memory` reads `{geometries: 0, textures: 0}`.
 */
import type * as THREE from 'three';

import { growTree, type TreeBuild, type TreeLod, type TreeSpecies } from './tree';

const cache = new Map<string, THREE.BufferGeometry>();
const treeCache = new Map<string, TreeBuild>();

/** A geometry built once per key. Every builder in the game goes through this. */
export function getGeometry(key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry {
  const hit = cache.get(key);
  if (hit) return hit;
  const geo = build();
  cache.set(key, geo);
  return geo;
}

/** A baked tree variant. Variants are few and instanced — this is the whole budget. */
export function getTree(species: TreeSpecies, variant: number, lod: TreeLod = 0): TreeBuild {
  const key = `${species}:${variant}:${lod}`;
  const hit = treeCache.get(key);
  if (hit) return hit;
  const built = growTree(species, variant * 7919 + lod, lod);
  treeCache.set(key, built);
  return built;
}

/** How many geometries are live — the perf overlay watches this against the tier. */
export function liveGeometryCount(): number {
  return cache.size + treeCache.size * 2;
}

export function disposeAll(): void {
  for (const geo of cache.values()) geo.dispose();
  for (const t of treeCache.values()) {
    t.wood.dispose();
    t.leaves.dispose();
  }
  cache.clear();
  treeCache.clear();
}

export { growTree, mergePieces } from './tree';
export type { TreeBuild, TreeLod, TreeSpecies } from './tree';

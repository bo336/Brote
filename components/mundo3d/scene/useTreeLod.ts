'use client';

import type { MutableRefObject } from 'react';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { InstancePool } from '@/lib/render/instancing';
import { TREE_LOD } from '@/lib/world/config';
import { playerTransform } from '../state/usePlayerStore';
import type { Canopy } from './useCanopyFade';

/**
 * **Trees far from Pip draw their far shape; shadows come from a lighter copy.**
 *
 * Every tree on the island was drawn at full detail and rendered into the
 * shadow map every frame — 180 of them at T3 — while the shadow map only covers
 * the square around Pip and the far trees are small in the frame. Each species
 * now has three pairs of pools:
 *
 *   near    the tier's detail, on screen, no shadow pass
 *   far     the far silhouette, on screen, no shadow pass
 *   shadow  the far silhouette, shadow pass only (`TREE_LOD.shadowLayer`), for
 *           the trees close enough to throw shade into the shadow square
 *
 * Whenever Pip has moved far enough, each tree is packed into the pairs its
 * distance asks for. Packing keeps each instance count equal to the trees
 * actually in that pair, so the GPU never transforms a hidden tree. The canopy
 * fade follows a tree into its new slot. A band of hysteresis keeps a tree on a
 * boundary from flicking between shapes as Pip walks along it. Allocates nothing.
 */
export interface TreeRecord {
  x: number;
  y: number;
  z: number;
  rot: number;
  scale: number;
  near: boolean;
  caster: boolean;
  canopy: Canopy;
}

export interface TreePair {
  wood: InstancePool;
  leaves: InstancePool;
}

export interface TreeLodSet {
  near: TreePair;
  far: TreePair;
  shadow: TreePair;
  trees: TreeRecord[];
  /** How many of `trees` the quality tier draws — a prefix, like every other pool. */
  limit: number;
}

const pairsOf = (set: TreeLodSet): TreePair[] => [set.near, set.far, set.shadow];

/** A sphere around every tree a set can ever draw, so a packed pool is never culled wrongly. */
export function boundTreeSet(set: TreeLodSet): void {
  if (set.trees.length === 0) return;
  let minX = Infinity; let minZ = Infinity; let maxX = -Infinity; let maxZ = -Infinity; let maxY = -Infinity; let minY = Infinity;
  for (const t of set.trees) {
    minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
    minZ = Math.min(minZ, t.z); maxZ = Math.max(maxZ, t.z);
    minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y + TREE_LOD.maxTreeHeightM);
  }
  const centre = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + TREE_LOD.maxCrownM;
  for (const pair of pairsOf(set)) {
    pair.wood.mesh.boundingSphere = new THREE.Sphere(centre.clone(), radius);
    pair.leaves.mesh.boundingSphere = new THREE.Sphere(centre.clone(), radius);
  }
}

/** Inside `r` switches on, past `r + hysteresis` switches off, in between keeps what it was. */
function within(current: boolean, dSq: number, r: number, force: boolean): boolean {
  if (force) return dSq < r * r;
  if (current) return dSq <= (r + TREE_LOD.hysteresisM) ** 2;
  return dSq < r * r;
}

function pack(set: TreeLodSet, px: number, pz: number, nearM: number, shadowM: number, force: boolean): void {
  let n = 0;
  let f = 0;
  let s = 0;
  const count = Math.min(set.limit, set.trees.length);
  for (let i = 0; i < count; i++) {
    const t = set.trees[i]!;
    const d = (t.x - px) ** 2 + (t.z - pz) ** 2;
    t.near = within(t.near, d, nearM, force);
    t.caster = within(t.caster, d, shadowM, force);
    const pair = t.near ? set.near : set.far;
    const slot = t.near ? n++ : f++;
    pair.wood.place(slot, t.x, t.y, t.z, t.rot, t.scale);
    pair.leaves.place(slot, t.x, t.y, t.z, t.rot, t.scale);
    pair.wood.setFade(slot, t.canopy.fade);
    pair.leaves.setFade(slot, t.canopy.fade);
    t.canopy.wood = pair.wood;
    t.canopy.leaves = pair.leaves;
    t.canopy.wi = slot;
    t.canopy.li = slot;
    if (t.caster) {
      set.shadow.wood.place(s, t.x, t.y, t.z, t.rot, t.scale);
      set.shadow.leaves.place(s, t.x, t.y, t.z, t.rot, t.scale);
      s++;
    }
  }
  const counts = [n, f, s];
  pairsOf(set).forEach((pair, k) => {
    pair.wood.mesh.count = counts[k]!;
    pair.leaves.mesh.count = counts[k]!;
    pair.wood.mesh.instanceMatrix.needsUpdate = true;
    pair.leaves.mesh.instanceMatrix.needsUpdate = true;
  });
}

/**
 * Re-pack when Pip has moved `repackM`, or when `version` changes (trees placed,
 * the tier's count changed). `nearM` keeps full detail; `shadowM` casts shade.
 */
export function useTreeLod(
  setsRef: MutableRefObject<TreeLodSet[]>,
  versionRef: MutableRefObject<number>,
  nearM: number,
  shadowM: number,
): void {
  const last = useRef({ x: Infinity, z: Infinity, version: -1 });
  useFrame(() => {
    const sets = setsRef.current;
    if (sets.length === 0) return;
    const p = playerTransform;
    const l = last.current;
    const moved = (p.x - l.x) ** 2 + (p.z - l.z) ** 2 > TREE_LOD.repackM ** 2;
    const changed = versionRef.current !== l.version;
    if (!moved && !changed) return;
    for (const set of sets) pack(set, p.x, p.z, nearM, shadowM, changed);
    l.x = p.x;
    l.z = p.z;
    l.version = versionRef.current;
  });
}

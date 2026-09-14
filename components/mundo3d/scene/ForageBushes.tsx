'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { berryBush } from '@/lib/render/geometry/berry-bush';
import { buildLeafAtlas } from '@/lib/render/geometry/leaf-atlas';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { getInteractable } from '../interaction/InteractableRegistry';
import { FORAGE_NODES } from '../verbs/register';

/**
 * The calafates you forage from, one at every forage node.
 *
 * The node's own interactable is the truth: where it is, and whether it is
 * carrying anything (`enabled`). The bush stays when it is picked — a bush that
 * vanishes is a bug, a bush with nothing on it is a reason to come back
 * (`verbs/register.ts`) — and only its berries go.
 *
 * Read from the registry twice a second rather than per frame, and by id
 * rather than by listing it, so nothing here allocates.
 */
const SCAN_EVERY_S = 0.5;

export function ForageBushes() {
  const leafMaterial = useMemo(
    () => getClayMaterial({
      vertexColors: true, wind: true, wobble: false, side: THREE.DoubleSide, alphaTest: 0.5,
      map: getTexture('leaf-atlas', buildLeafAtlas),
    }),
    [],
  );
  const woodMaterial = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);
  // Berries are waxy: lower roughness catches a highlight, which is what reads as fruit.
  const berryMaterial = useMemo(() => getClayMaterial({ vertexColors: true, wind: true, wobble: false, roughness: 0.32 }), []);
  const leafDepth = useMemo(
    () => new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: getTexture('leaf-atlas', buildLeafAtlas), alphaTest: 0.5,
    }),
    [],
  );

  const bush = useMemo(() => berryBush(7), []);
  const pools = useMemo(() => {
    const leaves = new InstancePool(bush.leaves, leafMaterial, FORAGE_NODES, { name: 'forage-leaves' });
    const wood = new InstancePool(bush.wood, woodMaterial, FORAGE_NODES, { name: 'forage-wood' });
    const berries = new InstancePool(bush.berries, berryMaterial, FORAGE_NODES, { name: 'forage-berries' });
    leaves.mesh.castShadow = true;
    leaves.mesh.receiveShadow = true;
    leaves.mesh.customDepthMaterial = leafDepth;
    wood.mesh.receiveShadow = true;
    berries.mesh.receiveShadow = true;
    for (let i = 0; i < FORAGE_NODES; i++) {
      leaves.alloc();
      wood.alloc();
      berries.alloc();
    }
    return { leaves, wood, berries, all: [leaves, wood, berries] };
  }, [bush, leafMaterial, woodMaterial, berryMaterial, leafDepth]);

  useEffect(() => () => {
    pools.all.forEach((pool) => pool.dispose());
    bush.leaves.dispose();
    bush.wood.dispose();
    bush.berries.dispose();
    leafDepth.dispose();
  }, [pools, bush, leafDepth]);

  /** What each slot showed last time: -1 nothing, 0 bare, 1 in fruit. */
  const shown = useRef(new Int8Array(FORAGE_NODES).fill(-2));
  const since = useRef(SCAN_EVERY_S);

  useFrame((_, dt) => {
    since.current += dt;
    if (since.current < SCAN_EVERY_S) return;
    since.current = 0;
    let changed = false;
    let count = 0;
    for (let i = 0; i < FORAGE_NODES; i++) {
      const node = getInteractable(`forage-${i}`);
      const state = node ? (node.enabled ? 1 : 0) : -1;
      if (node) count = i + 1;
      if (state === shown.current[i]) continue;
      shown.current[i] = state;
      changed = true;
      if (!node) {
        pools.leaves.hide(i);
        pools.wood.hide(i);
        pools.berries.hide(i);
        continue;
      }
      const [x, y, z] = node.position;
      // Turned and sized by slot, so six bushes are not one bush six times.
      const rot = i * 2.399;
      const scale = 0.9 + ((i * 0.618) % 1) * 0.35;
      pools.leaves.place(i, x, y, z, rot, scale);
      pools.wood.place(i, x, y, z, rot, scale);
      if (state === 1) pools.berries.place(i, x, y, z, rot, scale);
      else pools.berries.hide(i);
    }
    if (!changed) return;
    for (const pool of pools.all) {
      pool.resize(count);
      pool.commit();
    }
  });

  return (
    <group name="forage">
      {pools.all.map((pool) => (
        <primitive key={pool.mesh.name} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

import type * as THREE from 'three';

import { InstancePool } from '@/lib/render/instancing';
import { getTree, type TreeSpecies } from '@/lib/render/geometry';
import { TREE_LOD } from '@/lib/world/config';
import type { TreePair } from './useTreeLod';

/** One species' pools, as `useTreeLod.ts` packs them. */
export interface SpeciesPools {
  species: TreeSpecies;
  near: TreePair;
  far: TreePair;
  shadow: TreePair;
}

type PoolMaterial = ConstructorParameters<typeof InstancePool>[1];

/**
 * Three pairs of pools per species: near at the tier's detail, far at the far
 * silhouette, and a far copy that only the shadow camera sees.
 *
 * Every slot is claimed up front, because the LOD packer writes them in any
 * order. Tree shade comes only from the shadow pair, on `TREE_LOD.shadowLayer`,
 * so the trees on screen skip the shadow pass entirely.
 */
export function buildTreePools({
  species, lod, perVariant, solid, canopy, canopyDepth, track,
}: {
  species: readonly TreeSpecies[];
  lod: 0 | 1 | 2;
  perVariant: number;
  solid: PoolMaterial;
  canopy: PoolMaterial;
  canopyDepth: THREE.Material;
  track: (pool: InstancePool) => InstancePool;
}): SpeciesPools[] {
  return species.map((kind, v) => {
    const pair = (level: 0 | 1 | 2, tag: string): TreePair => {
      const built = getTree(kind, v + 1, level);
      const wood = track(new InstancePool(built.wood, solid, perVariant, { name: `wood${v}${tag}` }));
      const leaves = track(new InstancePool(built.leaves, canopy, perVariant, { name: `canopy${v}${tag}` }));
      for (let i = 0; i < perVariant; i++) {
        wood.alloc();
        leaves.alloc();
      }
      return { wood, leaves };
    };
    const shadow = pair(2, 'Shadow');
    for (const pool of [shadow.wood, shadow.leaves]) {
      pool.mesh.castShadow = true;
      pool.mesh.layers.set(TREE_LOD.shadowLayer);
    }
    shadow.leaves.mesh.customDepthMaterial = canopyDepth;
    return { species: kind, near: pair(lod, ''), far: pair(2, 'Far'), shadow };
  });
}

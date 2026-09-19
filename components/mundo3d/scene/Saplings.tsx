'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { getTree } from '@/lib/render/geometry';
import { buildLeafAtlas } from '@/lib/render/geometry/leaf-atlas';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { GUIDE } from '@/lib/world/config';
import { useSessionStore } from '../state/useSessionStore';

/**
 * What planting leaves behind: a sapling that springs up where the seed went in.
 *
 * The plant verb used to hold for 800 ms and then change nothing in the world.
 * Now there is a young ceibo there, growing in with a little overshoot, for the
 * rest of the session.
 */
function easeOutBack(k: number): number {
  const c = 1.7;
  const t = k - 1;
  return 1 + (c + 1) * t * t * t + c * t * t;
}

export function Saplings() {
  const plantings = useSessionStore((s) => s.plantings);
  const tree = useMemo(() => getTree('bush', 17, 1), []);
  const wood = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: false }), []);
  const leaves = useMemo(
    () => getClayMaterial({
      vertexColors: true, wind: true, wobble: false, side: THREE.DoubleSide, alphaTest: 0.5,
      map: getTexture('leaf-atlas', buildLeafAtlas),
    }),
    [],
  );
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    const now = performance.now();
    for (let i = 0; i < plantings.length; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const k = Math.min(1, (now - plantings[i]!.at) / GUIDE.saplingGrowMs);
      g.scale.setScalar(Math.max(0.001, easeOutBack(k)) * GUIDE.saplingScale);
    }
  });

  return (
    <group name="saplings">
      {plantings.map((p, i) => (
        <group
          key={`${p.at}-${i}`}
          position={[p.x, p.y, p.z]}
          ref={(node) => {
            refs.current[i] = node;
          }}
          scale={0.001}
        >
          <mesh geometry={tree.wood} material={wood} castShadow />
          <mesh geometry={tree.leaves} material={leaves} castShadow />
        </group>
      ))}
    </group>
  );
}

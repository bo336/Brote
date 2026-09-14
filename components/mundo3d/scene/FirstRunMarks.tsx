'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { getOverlayMaterial } from '@/lib/render/materials';
import { islandRadius } from '@/lib/world/progression';
import { plantSpot } from '@/lib/world/onboarding';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { BeatId } from '@/lib/world/onboarding';
import { CLAY } from '@/lib/render/palette';

/**
 * The two things the first session draws in the world.
 *
 * **The marked spot** — a soft ring on the ground where the seed goes. It
 * breathes, because a static circle on a static island reads as scenery and
 * this one is a place to walk to.
 *
 * **The promise** — the tier-2 coastline, ghosted, at the radius it will
 * actually have (`11-GAME-LOOP.md` §7, 2:10). Not an illustration of growth: it
 * is the same `islandRadius` the ladder uses, so what is drawn here is exactly
 * what arrives. Showing somebody a picture of a bigger island and then giving
 * them a different one is the one way to make a promise worse than no promise.
 *
 * Both ride the shared overlay material — vertex colour with alpha, unlit — so
 * neither costs a material against the budget of eight.
 */
const RING_SEGMENTS = 96;
const MARK_R = 1.5;

function ring(radius: number, width: number, hex: string, alpha: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const c = new THREE.Color(hex);
  for (let s = 0; s <= RING_SEGMENTS; s++) {
    const a = (s / RING_SEGMENTS) * Math.PI * 2;
    const x = Math.cos(a);
    const z = Math.sin(a);
    positions.push(x * (radius - width), 0, z * (radius - width));
    positions.push(x * (radius + width), 0, z * (radius + width));
    // Solid at the centre line, fading to nothing at both edges: a hard rim
    // would read as a wall, and the island is not walled.
    colors.push(c.r, c.g, c.b, alpha, c.r, c.g, c.b, 0);
    if (s < RING_SEGMENTS) {
      const i = s * 2;
      indices.push(i, i + 1, i + 3, i, i + 3, i + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geo.setIndex(indices);
  return geo;
}

export function FirstRunMarks({
  beat,
  layout,
  heightfield,
}: {
  beat: BeatId | null;
  layout: IslandLayout;
  heightfield: Heightfield;
}) {
  const material = useMemo(() => getOverlayMaterial(), []);
  const markGeo = useMemo(() => ring(MARK_R, 0.28, CLAY.leaf, 0.75), []);
  const promiseGeo = useMemo(() => ring(islandRadius(2), 0.6, CLAY.foam, 0.5), []);
  useEffect(() => () => {
    markGeo.dispose();
    promiseGeo.dispose();
  }, [markGeo, promiseGeo]);

  const mark = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = mark.current;
    if (!mesh || beat !== 'plant') return;
    const t = clock.elapsedTime;
    const s = 1 + Math.sin(t * 2) * 0.06;
    mesh.scale.set(s, 1, s);
  });

  const [px, pz] = plantSpot(layout.spawn[0], layout.spawn[1]);

  return (
    <group name="first-run">
      {beat === 'plant' && (
        <mesh
          ref={mark}
          geometry={markGeo}
          material={material}
          position={[px, sampleHeight(heightfield, px, pz) + 0.04, pz]}
        />
      )}
      {beat === 'promise' && (
        <mesh
          geometry={promiseGeo}
          material={material}
          position={[0, sampleHeight(heightfield, 0, 0) + 0.06, 0]}
        />
      )}
    </group>
  );
}

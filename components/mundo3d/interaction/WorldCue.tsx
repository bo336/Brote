'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { INTERACT } from '@/lib/world/config';
import { getOverlayMaterial } from '@/lib/render/materials';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The world-space affordance: a gently bobbing ring over the active object.
 *
 * The world cue answers **what**; the screen button answers **how**
 * (`10-CONTROLS-AND-CAMERA.md` §5.4). A world-space *button* is the mistake —
 * it is small, it moves, and it ends up under the thumb.
 *
 * Billboarded by hand rather than through a `THREE.Sprite`, because a sprite
 * needs its own `SpriteMaterial` and the budget of eight live materials has no
 * room for one.
 *
 * The bob is disabled under reduced motion, and the cue never relies on colour
 * alone: it has a distinct shape and a screen-space label beside it.
 */
const RING_RADIUS = 0.16;
const HOVER_HEIGHT = 0.75;
const RING_OPACITY = 0.9;

export function WorldCue() {
  const active = useSessionStore((s) => s.active);
  const reducedMotion = useSessionStore((s) => s.reducedMotion);
  const ref = useRef<THREE.Mesh>(null);

  // The same shared overlay material as the sky and the mist: the ring carries
  // its own colour and opacity in `attributes.color`.
  const material = useMemo(() => getOverlayMaterial(), []);
  const geometry = useMemo(() => {
    const geo = new THREE.TorusGeometry(RING_RADIUS, RING_RADIUS * 0.22, 6, 16);
    const accent = new THREE.Color(DOMAIN_COLORS.plantas);
    const count = (geo.attributes.position as THREE.BufferAttribute).count;
    const colors = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      colors[i * 4] = accent.r;
      colors[i * 4 + 1] = accent.g;
      colors[i * 4 + 2] = accent.b;
      colors[i * 4 + 3] = RING_OPACITY;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, clock }) => {
    const mesh = ref.current;
    if (!mesh || !active) return;
    const bob = reducedMotion
      ? 0
      : Math.sin(clock.elapsedTime * INTERACT.cueBobHz * Math.PI * 2) * INTERACT.cueBobAmplitudeM;
    mesh.position.set(active.position[0], active.position[1] + HOVER_HEIGHT + bob, active.position[2]);
    mesh.quaternion.copy(camera.quaternion);
  });

  if (!active) return null;
  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={4} />;
}

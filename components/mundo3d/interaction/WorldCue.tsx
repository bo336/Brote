'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { GUIDE } from '@/lib/world/config';
import { getOverlayMaterial } from '@/lib/render/materials';
import { BRAND } from '@/lib/render/palette';
import { useSessionStore } from '../state/useSessionStore';
import { labelSlots } from '../hud/labelSlots';
import { hidePin, pinToScreen } from '../scene/screenPin';

/**
 * The world-space affordance: **what** you can use. The screen button says **how**.
 *
 * A soft ring breathing around the base of the thing, and — since the
 * 2026-09-16 playtest found the floor's circles unexplained — a label over it
 * saying the key and the verb (`hud/WorldLabels.tsx`), so the ring, the label
 * and the button are visibly one thing. The bobbing drop that used to hang over
 * it said nothing the label does not say better, and it is gone.
 *
 * The ring rides the shared overlay material; colour and alpha live in the
 * vertices. Its breathing stops under reduced motion.
 */
const RING_INNER_M = 0.42;
const RING_OUTER_M = 0.52;
const RING_ALPHA = 0.55;
const RING_PULSE = 0.12;

function paint(geo: THREE.BufferGeometry, hex: string, alpha: number): THREE.BufferGeometry {
  const c = new THREE.Color(hex);
  const n = (geo.attributes.position as THREE.BufferAttribute).count;
  const colors = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b, alpha], i * 4);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  return geo;
}

export function WorldCue() {
  const active = useSessionStore((s) => s.active);
  const reducedMotion = useSessionStore((s) => s.reducedMotion);
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const material = useMemo(() => getOverlayMaterial(), []);

  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(RING_INNER_M, RING_OUTER_M, 48);
    g.rotateX(-Math.PI / 2);
    return paint(g, BRAND.green, RING_ALPHA);
  }, []);
  useEffect(() => () => { ringGeo.dispose(); hidePin(labelSlots.prompt, null, labelSlots.promptAt); }, [ringGeo]);

  useFrame(({ clock, camera, size }) => {
    if (!active || !group.current) {
      hidePin(labelSlots.prompt, null, labelSlots.promptAt);
      return;
    }
    const t = clock.elapsedTime;
    const [x, y, z] = active.position;
    group.current.position.set(x, y, z);
    if (ring.current && !reducedMotion) {
      const pulse = 1 + (Math.sin(t * 2.4) * 0.5 + 0.5) * RING_PULSE;
      ring.current.scale.set(pulse, 1, pulse);
    }
    if (labelSlots.prompt) {
      pinToScreen(labelSlots.prompt, camera, size, x, y + GUIDE.promptHeightM, z, null, labelSlots.promptSize, labelSlots.promptAt);
    }
  });

  if (!active) return null;
  return (
    // Guidance, not scenery: left out of the poster (`PosterShot.tsx`).
    <group ref={group} userData={{ posterHidden: true }}>
      <mesh ref={ring} geometry={ringGeo} material={material} position={[0, 0.04, 0]} renderOrder={4} />
    </group>
  );
}

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { INTERACT } from '@/lib/world/config';
import { getOverlayMaterial } from '@/lib/render/materials';
import { BRAND } from '@/lib/render/palette';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The world-space affordance: **what** you can use. The screen button says **how**.
 *
 * It was a camera-facing torus hung in the air — from the new, closer camera a
 * flat green donut the size of Pip's head, in front of whatever it pointed at.
 * Now it belongs to the ground and the object: a soft ring that breathes around
 * the thing's base, and a small marker bobbing over it, turning slowly, so it
 * reads from any side and never covers what it marks.
 *
 * Both ride the shared overlay material; colour and alpha live in the vertices.
 * The bob and the breathing stop under reduced motion.
 */
const RING_INNER_M = 0.42;
const RING_OUTER_M = 0.52;
const RING_ALPHA = 0.55;
const MARKER_HEIGHT_M = 1.05;
const MARKER_SPIN_HZ = 0.25;
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
  const marker = useRef<THREE.Mesh>(null);
  const material = useMemo(() => getOverlayMaterial(), []);

  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(RING_INNER_M, RING_OUTER_M, 48);
    g.rotateX(-Math.PI / 2);
    return paint(g, BRAND.green, RING_ALPHA);
  }, []);
  // A little inverted drop: a cone pointing at the thing, capped by a bead.
  const markerGeo = useMemo(() => {
    const cone = new THREE.ConeGeometry(0.085, 0.2, 16);
    cone.rotateX(Math.PI);
    const bead = new THREE.SphereGeometry(0.085, 16, 10);
    bead.translate(0, 0.1, 0);
    const merged = new THREE.BufferGeometry();
    const parts = [cone.toNonIndexed(), bead.toNonIndexed()];
    const pos = parts.flatMap((p) => Array.from((p.attributes.position as THREE.BufferAttribute).array));
    merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    parts.forEach((p) => p.dispose());
    cone.dispose();
    bead.dispose();
    return paint(merged, BRAND.sun, 0.95);
  }, []);
  useEffect(() => () => { ringGeo.dispose(); markerGeo.dispose(); }, [ringGeo, markerGeo]);

  useFrame(({ clock }) => {
    if (!active || !group.current) return;
    const t = clock.elapsedTime;
    group.current.position.set(active.position[0], active.position[1], active.position[2]);
    const bob = reducedMotion ? 0 : Math.sin(t * INTERACT.cueBobHz * Math.PI * 2) * INTERACT.cueBobAmplitudeM;
    if (marker.current) {
      marker.current.position.y = MARKER_HEIGHT_M + bob;
      if (!reducedMotion) marker.current.rotation.y = t * MARKER_SPIN_HZ * Math.PI * 2;
    }
    if (ring.current && !reducedMotion) {
      const pulse = 1 + (Math.sin(t * 2.4) * 0.5 + 0.5) * RING_PULSE;
      ring.current.scale.set(pulse, 1, pulse);
    }
  });

  if (!active) return null;
  return (
    <group ref={group}>
      <mesh ref={ring} geometry={ringGeo} material={material} position={[0, 0.04, 0]} renderOrder={4} />
      <mesh ref={marker} geometry={markerGeo} material={material} renderOrder={4} />
    </group>
  );
}

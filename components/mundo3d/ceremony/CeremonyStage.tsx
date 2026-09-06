'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { getOverlayMaterial } from '@/lib/render/materials';
import { BRAND } from '@/lib/render/palette';
import { CEREMONY } from '@/lib/world/config';
import type { Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { VerbId } from '@/lib/world/types';
import type { FollowCamera } from '../control/FollowCamera';
import type { CharacterController } from '../control/CharacterController';
import { usePlayerStore } from '../state/usePlayerStore';
import { useCeremonyRunner } from './useCeremonyRunner';

/**
 * The canvas half of the tier-up ceremony: the beat clock, and the one thing
 * the ceremony leaves behind in the world.
 *
 * The cards are HUD (`hud/TierUpOverlay.tsx`). Everything here is either time
 * or geometry.
 */
const RING_INNER = 0.55;
const RING_OUTER = 0.72;
const RING_SEGMENTS = 32;
const BEAM_HEIGHT_M = 2.2;
const BEAM_RADIUS_M = 0.06;

interface Taught {
  verb: VerbId;
  spot: [number, number, number];
}

/**
 * The world-space marker beat 5 leaves at the spot the new verb is first usable.
 *
 * `08-WORLD-AND-PROGRESSION.md` §5 beat 5: it "stays there until first use".
 * Not a quest arrow and not a HUD element — a thing standing in the world,
 * which is the only kind of guidance this game gives.
 */
function VerbMarker({ at }: { at: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const material = useMemo(() => getOverlayMaterial(), []);

  /**
   * A ring and a soft beam, both carrying colour and alpha per vertex so they
   * ride the shared overlay material rather than buying a ninth one.
   */
  const geometry = useMemo(() => {
    const ring = new THREE.RingGeometry(RING_INNER, RING_OUTER, RING_SEGMENTS);
    ring.rotateX(-Math.PI / 2);
    const beam = new THREE.CylinderGeometry(BEAM_RADIUS_M, BEAM_RADIUS_M * 2.2, BEAM_HEIGHT_M, 8, 1, true);
    beam.translate(0, BEAM_HEIGHT_M / 2, 0);
    const paint = (geo: THREE.BufferGeometry, alphaAt: (y: number) => number) => {
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const colour = new THREE.Color(BRAND.green);
      const rgba = new Float32Array(pos.count * 4);
      for (let i = 0; i < pos.count; i++) {
        rgba[i * 4] = colour.r;
        rgba[i * 4 + 1] = colour.g;
        rgba[i * 4 + 2] = colour.b;
        rgba[i * 4 + 3] = alphaAt(pos.getY(i));
      }
      geo.setAttribute('color', new THREE.BufferAttribute(rgba, 4));
      return geo;
    };
    // The beam fades out with height so it reads as light rather than as a post.
    paint(ring, () => 0.8);
    paint(beam, (y) => 0.45 * (1 - y / BEAM_HEIGHT_M));
    return { ring, beam };
  }, []);

  useEffect(
    () => () => {
      geometry.ring.dispose();
      geometry.beam.dispose();
    },
    [geometry],
  );

  // One slow breath. Never a flash, never a bounce — it has to be able to stand
  // there for a whole session without becoming something to look away from.
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y = clock.elapsedTime * 0.25;
    g.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.1) * 0.04);
  });

  return (
    <group ref={groupRef} position={at} name="verbMarker">
      <mesh geometry={geometry.ring} material={material} position={[0, 0.04, 0]} renderOrder={3} />
      <mesh geometry={geometry.beam} material={material} renderOrder={3} />
    </group>
  );
}

export function CeremonyStage({
  layout,
  heightfield,
  cameraRef,
  controller,
  reducedMotion,
  onCelebrated,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  cameraRef: React.MutableRefObject<FollowCamera | null>;
  controller: CharacterController | null;
  reducedMotion: boolean;
  onCelebrated?: (tier: number) => void;
}) {
  const [taught, setTaught] = useState<Taught | null>(null);
  const verbInUse = usePlayerStore((s) => s.verb);

  const { script, verbSpot } = useCeremonyRunner({
    layout,
    heightfield,
    cameraRef,
    controller,
    reducedMotion,
    onCelebrated,
  });

  // What the ceremony just taught, and where. Captured as the ceremony ends so
  // the marker outlives the sequence that put it there.
  const teaching = script?.verbs[0] ?? null;
  useEffect(() => {
    if (!teaching || !verbSpot) return;
    setTaught({ verb: teaching, spot: verbSpot });
  }, [teaching, verbSpot]);

  /** First use retires it — that is the whole condition (§5 beat 5). */
  useEffect(() => {
    if (taught && verbInUse === taught.verb) setTaught(null);
  }, [taught, verbInUse]);

  /**
   * A marker nobody ever walks to would otherwise stand there forever. It is a
   * pointer, not a chore, so it also retires itself after a while — the same
   * "small ceremony" length the world completion uses, which is the shortest
   * span in the spec that still reads as deliberate.
   */
  useEffect(() => {
    if (!taught) return;
    const id = window.setTimeout(() => setTaught(null), CEREMONY.worldCompleteS * 60 * 1000);
    return () => window.clearTimeout(id);
  }, [taught]);

  if (!taught) return null;
  return <VerbMarker at={taught.spot} />;
}

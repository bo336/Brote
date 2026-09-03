'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { InstancePool } from '@/lib/render/instancing';
import { rock, sprout } from '@/lib/render/geometry/scatter';
import { getClayMaterial } from '@/lib/render/materials';
import { INTERACT, PLACEMENT, VERB_TIMING } from '@/lib/world/config';
import { haptic } from '@/lib/utils/haptics';
import type { IslandLayout } from '@/lib/world/layout';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { WorldConfig } from '@/lib/world/types';
import { registerInteractable } from '../interaction/InteractableRegistry';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The two things you can do in this phase: **plant** at the stone seed-spot in
 * El Claro, and **water** at La Pradera's puddle.
 *
 * Both are purely local — no server writes until phase 4. What matters here is
 * that the loop is real: walk up, the cue appears, the button appears, you act,
 * something permanent-looking happens with a sound, a motion and a haptic
 * together (`10-CONTROLS-AND-CAMERA.md` §6). One of those alone reads as a bug.
 */
const SEED_SPOT_SCALE = 1.6;
/** How many sprouts a session can plant locally before the pool is full. */
const MAX_PLANTED = 24;

export function Props({
  heightfield,
  layout,
  config,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
}) {
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);
  const foliage = useMemo(() => getClayMaterial({ vertexColors: true, wind: true, wobble: true }), []);

  /** The seed spot: one stone, the only marked place to plant at tier 1. */
  const seedSpot = useMemo<[number, number, number]>(() => {
    const [x, z] = layout.spawn;
    // Just ahead of the spawn, so it is the first thing in frame on entry.
    const sx = x + 1.6;
    const sz = z + 0.9;
    return [sx, sampleHeight(heightfield, sx, sz), sz];
  }, [layout, heightfield]);

  const seedGeometry = useMemo(() => rock(991), []);
  useEffect(() => () => seedGeometry.dispose(), [seedGeometry]);

  const planted = useMemo(
    () => new InstancePool(sprout(17), foliage, MAX_PLANTED, { name: 'planted' }),
    [foliage],
  );
  useEffect(() => () => planted.dispose(), [planted]);
  const plantedCount = useRef(0);

  /** Plant where Pip is standing. A scale-up would be phase 3's polish. */
  const plant = useCallback(() => {
    const i = planted.alloc();
    if (i < 0) return;
    const p = playerTransform;
    const x = p.x + Math.sin(p.yaw) * 0.5;
    const z = p.z + Math.cos(p.yaw) * 0.5;
    planted.place(i, x, sampleHeight(heightfield, x, z), z, p.yaw, 1);
    planted.resize(++plantedCount.current);
    planted.commit();
    haptic('success');
  }, [planted, heightfield]);

  const water = useCallback(() => {
    // Phase 2 has no plant state to water yet; the verb exists, its feedback
    // is honest, and phase 3 gives it something to change.
    haptic('medium');
  }, []);

  const puddle = useMemo(() => layout.anchors.find((a) => a.feature === 'puddle') ?? null, [layout]);

  useEffect(() => {
    const dispose: (() => void)[] = [];
    dispose.push(
      registerInteractable({
        id: 'seed-spot',
        position: seedSpot,
        radius: INTERACT.defaultRadiusM,
        labelKey: 'mundo.verb.plant',
        verb: 'plant',
        enabled: true,
        onInteract: plant,
      }),
    );
    if (puddle && config.features.includes('puddle')) {
      dispose.push(
        registerInteractable({
          id: 'puddle',
          position: [puddle.x, sampleHeight(heightfield, puddle.x, puddle.z), puddle.z],
          radius: INTERACT.defaultRadiusM * 1.4,
          labelKey: 'mundo.verb.water',
          verb: 'water',
          enabled: true,
          onInteract: water,
        }),
      );
    }
    return () => dispose.forEach((fn) => fn());
  }, [seedSpot, puddle, config, heightfield, plant, water]);

  return (
    <group name="props">
      <mesh
        geometry={seedGeometry}
        material={solid}
        position={seedSpot}
        scale={SEED_SPOT_SCALE}
        onClick={(e) => {
          // Tapping the object works too — the one place a raycast belongs.
          e.stopPropagation();
          plant();
        }}
      />
      <primitive object={planted.mesh as THREE.Object3D} />
    </group>
  );
}

/** Prop colliders for the character controller. One entry per solid thing. */
export function propColliders(seedSpot: [number, number, number]) {
  return [{ x: seedSpot[0], z: seedSpot[2], radius: PLACEMENT.defaultFootprintM }];
}

/** Re-exported so the hold-to-plant timing has one home. */
export const PLANT_HOLD_MS = VERB_TIMING.plantHoldMs;

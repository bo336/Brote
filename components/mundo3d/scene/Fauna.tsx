'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildFauna, type FaunaKind } from '@/lib/render/geometry';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import { LIVELINESS } from '@/lib/world/config';
import { mulberry32, hashInt } from '@/lib/world/rng';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { QualityTier, WorldConfig } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The ambient life: birds over the meadow, butterflies in the garden, fish in
 * the lagoon, a fox and a deer on the high ground, a condor over the mountain.
 *
 * Two rules shape all of it:
 *
 *  - **Count comes from the tier cap and from `liveliness`** — and liveliness
 *    only ever ADDS. A player returning after two months finds their island
 *    exactly as they left it, just quieter, and it brightens within one session
 *    (`08-WORLD-AND-PROGRESSION.md` §6). Nothing here ever removes an animal
 *    because somebody was away.
 *  - **Every agent checks visibility and distance before doing any per-frame
 *    work** (`20-ACCEPTANCE.md` 3C). The old world ran a `useFrame` per bird,
 *    per butterfly, per deer and per duck, every frame, forever
 *    (`02-AUDIT.md` §6.4). This runs one loop over one array and skips anything
 *    beyond the tier's render distance.
 */
interface Agent {
  kind: FaunaKind;
  /** The pool this agent lives in, resolved once — never looked up per frame. */
  pool: InstancePool;
  slot: number;
  /** Home, and how far it wanders from it. */
  hx: number;
  hz: number;
  range: number;
  height: number;
  /** Phase and rate, so no two move together. */
  phase: number;
  speed: number;
  scale: number;
}

/** Which regions each kind lives in, and how high above the ground it sits. */
const HABITAT: Record<FaunaKind, { regions: string[]; height: number; scale: number; minTier: number }> = {
  butterfly: { regions: ['jardin', 'pradera'], height: 0.75, scale: 1, minTier: 3 },
  bird: { regions: ['pradera', 'arboleda', 'jardin'], height: 2.4, scale: 1, minTier: 2 },
  fish: { regions: ['rio'], height: -0.18, scale: 1, minTier: 7 },
  fox: { regions: ['cumbre', 'monte'], height: 0, scale: 1, minTier: 9 },
  deer: { regions: ['cumbre', 'arboleda'], height: 0, scale: 1, minTier: 9 },
  condor: { regions: ['monte', 'cumbre'], height: 9, scale: 1, minTier: 8 },
};

const KINDS = Object.keys(HABITAT) as FaunaKind[];
/** Scratch: nothing in the per-frame loop may allocate. */
const scratchMatrix = new THREE.Matrix4();
const scratchPos = new THREE.Vector3();
const scratchQuat = new THREE.Quaternion();
const scratchEuler = new THREE.Euler();
const scratchScale = new THREE.Vector3();

export function Fauna({
  heightfield,
  layout,
  config,
  tier,
  liveliness,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  tier: QualityTier;
  liveliness: number;
}) {
  // Fauna does not sway with the wind, does not take the handmade wobble and
  // does not take the vertical AO — all three are for things that stand still.
  // These are exactly Pip's options, so the two share one material and the
  // budget of eight stays at seven.
  const material = useMemo(
    () => getClayMaterial({ vertexColors: true, wind: false, wobble: false, ao: false }),
    [],
  );

  const pools = useMemo(() => {
    const max = TIERS[3].fauna;
    return KINDS.map((kind) => ({
      kind,
      pool: new InstancePool(buildFauna(kind), material, max, { name: `fauna-${kind}` }),
    }));
  }, [material]);

  /** Where each animal lives. Deterministic, like everything else on the island. */
  const agents = useMemo<Agent[]>(() => {
    const rng = mulberry32(hashInt(`fauna:${layout.seed}`));
    const out: Agent[] = [];
    for (const { kind, pool } of pools) {
      const habitat = HABITAT[kind];
      if (config.tier < habitat.minTier) continue;
      const homes = layout.regions.filter((r) => r.unlocked && habitat.regions.includes(r.id));
      if (homes.length === 0) continue;
      for (let i = 0; i < TIERS[3].fauna; i++) {
        const home = homes[i % homes.length]!;
        const a = rng() * Math.PI * 2;
        const d = home.radius * (0.2 + rng() * 0.7);
        const slot = pool.alloc();
        if (slot < 0) break;
        out.push({
          kind, pool, slot,
          hx: home.x + Math.cos(a) * d,
          hz: home.z + Math.sin(a) * d,
          range: 1.5 + rng() * 3.5,
          height: habitat.height,
          phase: rng() * Math.PI * 2,
          speed: 0.25 + rng() * 0.5,
          scale: habitat.scale * (0.85 + rng() * 0.3),
        });
      }
    }
    return out;
  }, [pools, layout, config.tier]);

  /**
   * Count. `liveliness` rides between a floor and the tier's cap, so a quiet
   * island is quieter and never emptier.
   */
  useEffect(() => {
    const warmth = Math.min(1, Math.max(0, (liveliness - LIVELINESS.min) / (LIVELINESS.max - LIVELINESS.min)));
    const share = LIVELINESS.faunaFloor + (1 - LIVELINESS.faunaFloor) * warmth;
    const perKind = Math.max(1, Math.round((TIERS[tier].fauna * share) / KINDS.length));
    for (const { pool } of pools) pool.resize(perKind);
  }, [pools, tier, liveliness]);

  useEffect(() => () => pools.forEach(({ pool }) => pool.dispose()), [pools]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = playerTransform;
    const cutoff = TIERS[tier].renderDistanceM;
    const cutoffSq = cutoff * cutoff;

    for (const agent of agents) {
      // **The visibility gate.** Beyond the tier's render distance an animal is
      // collapsed to zero scale and costs one matrix write instead of a
      // simulation step.
      const dx = agent.hx - p.x;
      const dz = agent.hz - p.z;
      if (dx * dx + dz * dz > cutoffSq) {
        agent.pool.hide(agent.slot);
        continue;
      }
      const a = agent.phase + t * agent.speed;
      const x = agent.hx + Math.cos(a) * agent.range;
      const z = agent.hz + Math.sin(a * 0.8) * agent.range;
      const ground = sampleHeight(heightfield, x, z);
      // Fliers bob; walkers follow the ground.
      const bob = agent.height > 0 ? Math.sin(a * 2.2) * 0.18 : 0;
      scratchPos.set(x, ground + agent.height + bob, z);
      scratchEuler.set(0, Math.atan2(-Math.sin(a) * agent.range, Math.cos(a * 0.8) * agent.range), 0);
      scratchQuat.setFromEuler(scratchEuler);
      scratchScale.setScalar(agent.scale);
      scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
      agent.pool.setMatrix(agent.slot, scratchMatrix);
    }
    for (const { pool } of pools) pool.mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="fauna">
      {pools.map(({ kind, pool }) => (
        <primitive key={kind} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

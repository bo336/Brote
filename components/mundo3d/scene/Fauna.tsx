'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildFauna, type FaunaKind } from '@/lib/render/geometry';
import { InstancePool } from '@/lib/render/instancing';
import type { BlobShadowPool } from '@/lib/render/shadows';
import { getClayMaterial } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import { LIVELINESS } from '@/lib/world/config';
import { mulberry32, hashInt } from '@/lib/world/rng';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { QualityTier, WorldConfig } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';
import { atLeast } from '@/lib/world/liveliness';

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
  /**
   * Blob-shadow slot, or -1. Only the walkers get one: a bird at 2.4 m is most
   * of the way through the height fade already, a condor at 9 m is past it, and
   * the fish are under the water. Grounding is for things standing on ground.
   */
  shadow: number;
}

/** Which regions each kind lives in, and how high above the ground it sits. */
/**
 * Which regions each kind lives in, how high above the ground it sits — and how
 * it moves (`materials/fauna-rig.ts`): `hz` the gait or wingbeat, `amp` how far
 * the wings or legs swing, `bank` how far a flier rolls into its turns.
 */
const HABITAT: Record<FaunaKind, {
  regions: string[]; height: number; scale: number; minTier: number; hz: number; amp: number; bank: number;
}> = {
  butterfly: { regions: ['jardin', 'pradera'], height: 0.75, scale: 1, minTier: 3, hz: 8, amp: 1.05, bank: 0 },
  bird: { regions: ['pradera', 'arboleda', 'jardin'], height: 2.4, scale: 1, minTier: 2, hz: 6.5, amp: 0.85, bank: 0.35 },
  fish: { regions: ['rio'], height: -0.18, scale: 1, minTier: 7, hz: 2.4, amp: 1, bank: 0 },
  fox: { regions: ['cumbre', 'monte'], height: 0, scale: 1, minTier: 9, hz: 2.2, amp: 0.6, bank: 0 },
  deer: { regions: ['cumbre', 'arboleda'], height: 0, scale: 1, minTier: 9, hz: 1.5, amp: 0.55, bank: 0 },
  condor: { regions: ['monte', 'cumbre'], height: 9, scale: 1, minTier: 8, hz: 0.45, amp: 0.16, bank: 0.25 },
};

const KINDS = Object.keys(HABITAT) as FaunaKind[];
/** Blob radius for a walking animal, in metres. */
const FAUNA_SHADOW = 0.26;
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
  shadows,
  demo = false,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  tier: QualityTier;
  liveliness: number;
  /** The walkers take a moving blob, so a deer stands on the hill. */
  shadows?: BlobShadowPool;
  /** One of each kind in a row by the spawn, for review — the same flag that lays the props out. */
  demo?: boolean;
}) {
  // Fauna does not sway with the wind, does not take the handmade wobble and
  // does not take the vertical AO — all three are for things that stand still.
  // These are exactly Pip's options, so the two share one material and the
  // budget of eight stays at seven.
  const material = useMemo(
    () => getClayMaterial({ vertexColors: true, wind: false, wobble: false, ao: false, fauna: true, roughness: 0.62 }),
    [],
  );

  const pools = useMemo(() => {
    const max = TIERS[3].fauna;
    return KINDS.map((kind) => {
      const pool = new InstancePool(buildFauna(kind), material, max, { name: `fauna-${kind}` });
      // Phase, rate and swing per animal, read by the rig — so no two birds beat in step.
      const gait = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
      pool.mesh.geometry.setAttribute('aGait', gait);
      return { kind, pool, gait };
    });
  }, [material]);

  /** Where each animal lives. Deterministic, like everything else on the island. */
  const agents = useMemo<Agent[]>(() => {
    const rng = mulberry32(hashInt(`fauna:${layout.seed}`));
    const out: Agent[] = [];
    /**
     * **The review lineup** (`?props=1`): one of each kind standing in a row in
     * front of the spawn, rigged and moving in place, facing it. A wandering
     * animal cannot be photographed on purpose; these can. First, so their slots
     * are always free.
     */
    if (demo) {
      const [sx, sz] = layout.spawn;
      pools.forEach(({ kind, pool, gait }, i) => {
        const slot = pool.alloc();
        if (slot < 0) return;
        gait.setXYZ(slot, 0, HABITAT[kind].hz, HABITAT[kind].amp);
        gait.needsUpdate = true;
        const lift = kind === 'condor' ? 1.7 : kind === 'bird' || kind === 'butterfly' ? 1 : kind === 'fish' ? 0.35 : 0;
        out.push({
          kind, pool, slot, shadow: -1, hx: sx + (i - 2.5) * 1.8, hz: sz + 4.5, range: 0, height: lift,
          phase: Math.PI, speed: 0, scale: 1,
        });
      });
    }
    for (const { kind, pool, gait } of pools) {
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
        gait.setXYZ(slot, rng() * Math.PI * 2, habitat.hz * (0.85 + rng() * 0.3), habitat.amp);
        gait.needsUpdate = true;
        const walks = habitat.height === 0;
        out.push({
          kind, pool, slot,
          shadow: walks && shadows ? shadows.attachPoint(FAUNA_SHADOW * habitat.scale) : -1,
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
  }, [pools, layout, config.tier, shadows, demo]);

  /**
   * Count. `liveliness` rides between a floor and the tier's cap, so a quiet
   * island is quieter and never emptier.
   */
  useEffect(() => {
    const share = atLeast(LIVELINESS.faunaFloor, liveliness);
    /**
     * **The budget is spent, not multiplied.**
     *
     * This used to be `max(1, round(fauna * share / 6))` per kind — one animal
     * minimum each, so that a species could never vanish. The effect was the
     * opposite of a budget: at T0 the tier asks for two animals and six kinds
     * each rounded up to one, so a cheap phone drew six creatures in six draw
     * calls. That alone was a quarter of T0's whole draw-call ceiling, spent on
     * four animals nobody asked for.
     *
     * Handing them out one at a time, in a fixed order, spends exactly what the
     * tier allows: at T0 two kinds get one each and the other four resize to
     * zero, which three skips entirely. At T3 everyone is well fed.
     */
    const budget = Math.max(1, Math.round(TIERS[tier].fauna * share));
    const perKind = new Array(pools.length).fill(0);
    for (let n = 0; n < budget; n++) perKind[n % pools.length]! += 1;
    pools.forEach(({ pool }, i) => pool.resize(perKind[i]!));
  }, [pools, tier, liveliness]);

  useEffect(() => () => pools.forEach(({ pool }) => pool.dispose()), [pools]);

  /** Hand the slots back, so a remount does not exhaust the moving range. */
  useEffect(
    () => () => {
      for (const agent of agents) if (agent.shadow >= 0) shadows?.detach(agent.shadow);
    },
    [agents, shadows],
  );

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
        // A hidden animal's shadow goes with it, far below the world.
        if (agent.shadow >= 0) shadows?.movePoint(agent.shadow, 0, -1000, 0);
        continue;
      }
      const a = agent.phase + t * agent.speed;
      const x = agent.hx + Math.cos(a) * agent.range;
      const z = agent.hz + Math.sin(a * 0.8) * agent.range;
      const ground = sampleHeight(heightfield, x, z);
      // Fliers bob; walkers follow the ground.
      const bob = agent.height > 0 ? Math.sin(a * 2.2) * 0.18 : 0;
      scratchPos.set(x, ground + agent.height + bob, z);
      // Facing along the path, and a flier rolls into the turn. One standing
      // still (the review lineup) faces where its phase says.
      scratchEuler.set(
        0,
        agent.range === 0 ? agent.phase : Math.atan2(-Math.sin(a) * agent.range, Math.cos(a * 0.8) * agent.range),
        agent.range === 0 ? 0 : Math.sin(a) * HABITAT[agent.kind].bank,
        'YXZ',
      );
      scratchQuat.setFromEuler(scratchEuler);
      scratchScale.setScalar(agent.scale);
      scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
      agent.pool.setMatrix(agent.slot, scratchMatrix);
      if (agent.shadow >= 0) shadows?.movePoint(agent.shadow, x, ground, z);
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

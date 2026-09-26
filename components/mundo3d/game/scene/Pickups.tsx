'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { pickupGeometry, type PickupShape } from '@/lib/render/geometry/pickups';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial } from '@/lib/render/materials';
import { toolValue } from '@/lib/world/game/materials';
import type { Spawn } from '@/lib/world/game/spawns';
import type { WasteKind } from '@/lib/world/game/types';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { haptic } from '@/lib/utils/haptics';
import { playSfx } from '../../audio/sfx';
import { playerTransform } from '../../state/usePlayerStore';
import { useSessionStore } from '../../state/useSessionStore';
import { useGameStore } from '../useGameStore';
import { pushGain } from '../gains';

/**
 * Everything lying around that you pick up by walking past it.
 *
 * **No button.** The cheapest joy in a collecting game is the run: you walk a
 * line along the beach and the things come to you, each with its little rising
 * note (*My Little Universe* does exactly this, and it is the right call for a
 * thumb on a phone). What you walk past flies into Pip and a "+1" floats up.
 *
 * One instanced pool per silhouette, sized for today's spawns plus the ones in
 * flight, so the whole beach is eight draw calls however much is on it.
 */
const SHAPES: PickupShape[] = ['botella', 'lata', 'papel', 'bolsa', 'organico', 'hojas', 'ramas', 'piedras'];
const WASTE_SHAPE: Record<WasteKind, PickupShape> = {
  botella: 'botella', lata: 'lata', vidrio: 'lata', pila: 'lata', papel: 'papel', carton: 'papel', tetra: 'papel',
  bolsa: 'bolsa', telgopor: 'bolsa', colilla: 'papel', yerba: 'organico', cascara: 'organico',
};
const FLY_S = 0.32;
const MAX_PER_SHAPE = 96;
/** One pickup at a time, a beat apart: the rising note needs room to rise. */
const PICK_EVERY_MS = 70;

function shapeOf(sp: Spawn): PickupShape {
  if (sp.kind === 'residuos') return WASTE_SHAPE[sp.waste ?? 'botella'];
  return sp.kind;
}

interface Flyer {
  shape: PickupShape;
  x: number;
  y: number;
  z: number;
  t: number;
}

const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const sc = new THREE.Vector3();

export function Pickups({
  spawns,
  heightfield,
  enabled,
}: {
  /** What is lying around right now (today's spawns and wild parcels' litter). */
  spawns: readonly Spawn[];
  heightfield: Heightfield;
  /** Off during a ceremony, a visit, placement mode. */
  enabled: boolean;
}) {
  const material = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: false }), []);
  const pools = useMemo(() => {
    const out = new Map<PickupShape, InstancePool>();
    for (const shape of SHAPES) {
      const pool = new InstancePool(pickupGeometry(shape), material, MAX_PER_SHAPE, {
        name: `pickup-${shape}`,
        disableCullingBecause: 'instances bob and fly every frame; bounds would be recomputed each frame for nothing',
      });
      pool.mesh.castShadow = true;
      pool.mesh.receiveShadow = true;
      out.set(shape, pool);
    }
    return out;
  }, [material]);
  useEffect(() => () => pools.forEach((p) => p.dispose()), [pools]);

  /** Where each spawn sits, with its ground height and a stable phase for the bob. */
  const placed = useMemo(
    () => spawns.map((sp, i) => ({
      sp, shape: shapeOf(sp), y: sampleHeight(heightfield, sp.x, sp.z), phase: (i * 2.399) % (Math.PI * 2),
    })),
    [spawns, heightfield],
  );
  const taken = useRef(new Set<string>());
  useEffect(() => {
    taken.current.clear();
  }, [spawns]);
  const flyers = useRef<Flyer[]>([]);
  const lastPick = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = playerTransform;
    const store = useGameStore.getState();
    const reach = store.state ? toolValue('guantes', store.state.tools.guantes) : 1.5;
    const canPick = enabled && useSessionStore.getState().hud === 'play';
    const now = performance.now();
    const counts = new Map<PickupShape, number>();
    for (const shape of SHAPES) counts.set(shape, 0);

    for (const item of placed) {
      if (taken.current.has(item.sp.id)) continue;
      const dx = item.sp.x - p.x;
      const dz = item.sp.z - p.z;
      const d2 = dx * dx + dz * dz;
      if (canPick && d2 < reach * reach && now - lastPick.current > PICK_EVERY_MS) {
        const events = store.dispatch({ t: 'pickup', spawn: item.sp }, [item.sp.x, item.y, item.sp.z]);
        const got = events.find((ev) => ev.type === 'pickup');
        if (got && got.type === 'pickup') {
          lastPick.current = now;
          taken.current.add(item.sp.id);
          flyers.current.push({ shape: item.shape, x: item.sp.x, y: item.y, z: item.sp.z, t: 0 });
          playSfx('pickup');
          haptic('light');
          pushGain(got.material, got.n, got.waste);
          continue;
        }
      }
      const pool = pools.get(item.shape)!;
      const i = counts.get(item.shape)!;
      if (i >= MAX_PER_SHAPE) continue;
      counts.set(item.shape, i + 1);
      // A slow bob and turn: enough to catch the eye as something to pick up,
      // never enough to look like it is floating away.
      const bob = 0.04 + Math.sin(t * 2.2 + item.phase) * 0.035;
      e.set(0, t * 0.6 + item.phase, 0);
      q.setFromEuler(e);
      v.set(item.sp.x, item.y + bob, item.sp.z);
      sc.setScalar(1);
      m.compose(v, q, sc);
      pool.setMatrix(i, m);
    }

    // What was just picked flies into Pip, shrinking, in a short arc.
    const keep: Flyer[] = [];
    for (const f of flyers.current) {
      f.t += dt / FLY_S;
      if (f.t >= 1) continue;
      keep.push(f);
      const pool = pools.get(f.shape)!;
      const i = counts.get(f.shape)!;
      if (i >= MAX_PER_SHAPE) continue;
      counts.set(f.shape, i + 1);
      const k = f.t * f.t;
      v.set(
        f.x + (p.x - f.x) * k,
        f.y + (p.y + 0.45 - f.y) * k + Math.sin(f.t * Math.PI) * 0.6,
        f.z + (p.z - f.z) * k,
      );
      e.set(f.t * 5, f.t * 7, 0);
      q.setFromEuler(e);
      sc.setScalar(1 - f.t * 0.75);
      m.compose(v, q, sc);
      pool.setMatrix(i, m);
    }
    flyers.current = keep;

    for (const [shape, pool] of pools) {
      const n = counts.get(shape)!;
      pool.mesh.count = n;
      pool.mesh.visible = n > 0;
      if (n > 0) pool.mesh.instanceMatrix.needsUpdate = true;
    }
    if (flyers.current.length > 0) state.invalidate();
  });

  return (
    <group name="pickups">
      {[...pools.values()].map((pool) => (
        <primitive key={pool.mesh.name} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

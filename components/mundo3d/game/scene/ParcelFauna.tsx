'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildFauna, type FaunaKind } from '@/lib/render/geometry';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial } from '@/lib/render/materials';
import { GAME } from '@/lib/world/game/config';
import { habitatSpot, parcelsAt } from '@/lib/world/game/parcels';
import { mulberry32 } from '@/lib/world/rng';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { playerTransform } from '../../state/usePlayerStore';
import { useGameStore } from '../useGameStore';

/**
 * The life a restored parcel brings back (`docs/MUNDO_JUEGO.md` §3.3): the
 * copy promises it — "empiezan a llegar los bichos", "la fauna se queda" — so
 * the island has to show it.
 *
 *  - A living parcel (stage 4) has two butterflies over its flowers.
 *  - A flourishing one (stage 5) has three, and whatever its habitat is for: a
 *    bird on the perch or on the nest box's stick, bees at the bee shelter, a
 *    bird drinking at the birdbath.
 *
 * The same rigged animals as the island's ambient life (`scene/Fauna.tsx`), on
 * their own copies of the geometry — the gait attribute lives on the geometry,
 * and sharing it would have the island's birds beating in step with these.
 * Only parcels near Pip animate; the rest cost nothing.
 */
interface Critter {
  kind: 'butterfly' | 'bird' | 'bee';
  slot: number;
  x: number;
  z: number;
  y: number;
  /** Orbit radius; 0 for one perched. */
  r: number;
  phase: number;
  speed: number;
  scale: number;
}

/** Where on each habitat an animal sits, metres above the ground, and what it is. */
const PERCH: Record<string, { kind: Critter['kind']; y: number; dx: number }> = {
  posadero: { kind: 'bird', y: 2.12, dx: 0.2 },
  caja_nido: { kind: 'bird', y: 1.6, dx: 0 },
  bebedero: { kind: 'bird', y: 0.6, dx: 0.28 },
  hotel_chico: { kind: 'bee', y: 1.12, dx: 0 },
  pirca: { kind: 'bird', y: 0.72, dx: 0.3 },
  refugio_ranas: { kind: 'butterfly', y: 0.6, dx: 0 },
};

const MAX = { butterfly: 96, bird: 24, bee: 24 } as const;
const GAIT: Record<Critter['kind'], [number, number]> = {
  butterfly: [8, 1.05],
  // A perched bird: a small, slow twitch of the wings, not a flight.
  bird: [1.2, 0.12],
  bee: [18, 0.8],
};
const NEAR_M = 42;

const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const sc = new THREE.Vector3();

export function ParcelFauna({ heightfield }: { heightfield: Heightfield }) {
  const field = useGameStore((s) => s.field);
  const parcels = useGameStore((s) => s.state?.parcels);
  const tier = useGameStore((s) => s.base?.tier ?? 1);

  const material = useMemo(
    () => getClayMaterial({ vertexColors: true, wind: false, wobble: false, ao: false, fauna: true, roughness: 0.62 }),
    [],
  );
  const pools = useMemo(() => {
    const make = (kind: Critter['kind'], from: FaunaKind) => {
      const geo = buildFauna(from).clone();
      const pool = new InstancePool(geo, material, MAX[kind], { name: `parcel-${kind}` });
      const gait = new THREE.InstancedBufferAttribute(new Float32Array(MAX[kind] * 3), 3);
      geo.setAttribute('aGait', gait);
      return { pool, gait, geo };
    };
    return { butterfly: make('butterfly', 'butterfly'), bird: make('bird', 'bird'), bee: make('bee', 'butterfly') };
  }, [material]);
  useEffect(() => () => {
    for (const p of Object.values(pools)) {
      p.pool.dispose();
      p.geo.dispose();
    }
  }, [pools]);

  // Who lives where: rebuilt when a parcel's stage or habitat changes.
  const key = field && parcels
    ? parcelsAt(field, tier).map((p) => {
      const ps = parcels[p.id];
      return ps && ps.s >= 4 ? `${p.id}:${ps.s}:${ps.hab ?? ''}` : '';
    }).join('|')
    : '';
  const critters = useMemo(() => {
    const out: Critter[] = [];
    if (!field || !parcels) return out;
    for (const p of Object.values(pools)) p.pool.reset();
    for (const spec of parcelsAt(field, tier)) {
      const ps = parcels[spec.id];
      if (!ps || ps.s < 4) continue;
      const rng = mulberry32((spec.i * 92821) ^ (spec.j * 68917) ^ 0x51f);
      const add = (kind: Critter['kind'], c: Omit<Critter, 'kind' | 'slot'>) => {
        const set = pools[kind];
        const slot = set.pool.alloc();
        if (slot < 0) return;
        set.gait.setXYZ(slot, rng() * Math.PI * 2, GAIT[kind][0] * (0.85 + rng() * 0.3), GAIT[kind][1]);
        set.gait.needsUpdate = true;
        out.push({ kind, slot, ...c });
      };
      const flies = ps.s >= 5 ? 3 : 2;
      for (let k = 0; k < flies; k++) {
        add('butterfly', {
          x: spec.x + (rng() - 0.5) * 2, z: spec.z + (rng() - 0.5) * 2, y: 0.55 + rng() * 0.45,
          r: 1 + rng() * 1.6, phase: rng() * Math.PI * 2, speed: 0.5 + rng() * 0.5, scale: 0.8 + rng() * 0.3,
        });
      }
      if (ps.s >= 5 && ps.hab && PERCH[ps.hab]) {
        const perch = PERCH[ps.hab]!;
        const h = habitatSpot(spec, GAME.planted.habitatM);
        const y = sampleHeight(heightfield, h.x, h.z) + perch.y;
        if (perch.kind === 'bee') {
          for (let k = 0; k < 3; k++) {
            add('bee', { x: h.x, z: h.z, y: y + (rng() - 0.5) * 0.2, r: 0.25 + rng() * 0.3, phase: rng() * 6.28, speed: 2 + rng(), scale: 0.45 });
          }
        } else {
          add(perch.kind, {
            x: h.x + Math.cos(h.rotY) * perch.dx, z: h.z - Math.sin(h.rotY) * perch.dx, y,
            r: 0, phase: h.rotY + Math.PI, speed: 0, scale: 0.8,
          });
        }
      }
    }
    for (const p of Object.values(pools)) {
      p.pool.resize(p.pool.count);
      p.pool.commit();
    }
    return out;
    // `key` is the whole dependency: it changes exactly when who-lives-where does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pools, heightfield]);

  useFrame(({ clock }) => {
    if (critters.length === 0) return;
    const t = clock.elapsedTime;
    const p = playerTransform;
    for (const c of critters) {
      const pool = pools[c.kind].pool;
      const dx = c.x - p.x;
      const dz = c.z - p.z;
      if (dx * dx + dz * dz > NEAR_M * NEAR_M) {
        pool.hide(c.slot);
        continue;
      }
      if (c.r === 0) {
        // Perched: sits, turns its head now and then (a slow sway of the whole bird).
        v.set(c.x, c.y, c.z);
        e.set(0, c.phase + Math.sin(t * 0.7 + c.x) * 0.5, 0, 'YXZ');
      } else {
        const a = c.phase + t * c.speed;
        const x = c.x + Math.cos(a) * c.r;
        const z = c.z + Math.sin(a * 1.3) * c.r * 0.8;
        v.set(x, c.y + Math.sin(a * 3.1) * 0.12, z);
        e.set(0, Math.atan2(-Math.sin(a) * c.r, Math.cos(a * 1.3) * c.r), Math.sin(a) * 0.3, 'YXZ');
      }
      q.setFromEuler(e);
      sc.setScalar(c.scale);
      m.compose(v, q, sc);
      pool.setMatrix(c.slot, m);
    }
    for (const set of Object.values(pools)) set.pool.mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="parcel-fauna">
      {Object.values(pools).map((set) => <primitive key={set.pool.mesh.name} object={set.pool.mesh} />)}
    </group>
  );
}

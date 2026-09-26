'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { getGeometry } from '@/lib/render/geometry';
import { buildLeafAtlas } from '@/lib/render/geometry/leaf-atlas';
import { plantedGeometry, plantedScale, PLANTED_PER_PARCEL, type PlantedBuild } from '@/lib/render/geometry/planted';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { GAME } from '@/lib/world/game/config';
import { parcelsAt } from '@/lib/world/game/parcels';
import { PLANTS } from '@/lib/world/game/plants';
import { mulberry32 } from '@/lib/world/rng';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { useGameStore } from '../useGameStore';

/**
 * What you planted, standing in its parcel (`lib/render/geometry/planted.ts`).
 *
 * Every species in a parcel gets its own slice of it — a sixth of the circle
 * around the stake — so six species read as six clumps and not as a salad. The
 * parcel's stage sets their size, and when it moves up they grow into the new
 * size with a little overshoot, over the same second and a half as the
 * restoration wave under them.
 *
 * One pool per species (two for trees and shrubs: wood and leaf cards), built
 * the first time that species is planted anywhere on the island.
 */
interface Slot {
  pool: InstancePool;
  leaves: InstancePool | null;
  i: number;
  j: number;
  x: number;
  y: number;
  z: number;
  rot: number;
  jitter: number;
  from: number;
  to: number;
}

interface Pools {
  solid: InstancePool;
  leaves: InstancePool | null;
  build: PlantedBuild;
}

const WIND_LOOKS = new Set(['pasto', 'flor', 'acuatica']);

function easeOutBack(k: number): number {
  const c = 1.6;
  const t = k - 1;
  return 1 + (c + 1) * t * t * t + c * t * t;
}

export function Planted({ heightfield }: { heightfield: Heightfield }) {
  const field = useGameStore((s) => s.field);
  const parcels = useGameStore((s) => s.state?.parcels);
  const tier = useGameStore((s) => s.base?.tier ?? 1);

  const materials = useMemo(() => ({
    swaying: getClayMaterial({ vertexColors: true, wind: true, wobble: false }),
    still: getClayMaterial({ vertexColors: true, wind: false, wobble: false }),
    leaves: getClayMaterial({
      vertexColors: true, wind: true, wobble: false, side: THREE.DoubleSide, alphaTest: 0.5,
      map: getTexture('leaf-atlas', buildLeafAtlas),
    }),
  }), []);

  const pools = useRef(new Map<string, Pools>());
  const group = useRef<THREE.Group>(null);
  useEffect(() => () => {
    for (const p of pools.current.values()) {
      p.solid.dispose();
      p.leaves?.dispose();
    }
    pools.current.clear();
  }, []);

  const found = useMemo(() => (field ? parcelsAt(field, tier) : []), [field, tier]);
  const maxPerSpecies = found.length;

  /** The pools for one species, made the first time it is planted. */
  const poolsFor = (id: string): Pools | null => {
    const hit = pools.current.get(id);
    if (hit) return hit;
    const def = PLANTS[id];
    if (!def || !group.current) return null;
    let build: PlantedBuild | null = null;
    const make = () => (build ??= plantedGeometry({ id, look: def.look, color: def.color }));
    const solidGeo = getGeometry(`planted:${id}:solid`, () => make().solid);
    const leavesGeo = def.look === 'arbol' || (def.look === 'arbusto' && id !== 'chaguar')
      ? getGeometry(`planted:${id}:leaves`, () => make().leaves ?? new THREE.BufferGeometry())
      : null;
    const n = maxPerSpecies * PLANTED_PER_PARCEL[def.look];
    const solid = new InstancePool(solidGeo, WIND_LOOKS.has(def.look) ? materials.swaying : materials.still, n, { name: `planted-${id}` });
    solid.mesh.castShadow = def.look === 'arbol' || def.look === 'arbusto' || def.look === 'suculenta';
    const leaves = leavesGeo ? new InstancePool(leavesGeo, materials.leaves, n, { name: `planted-${id}-leaves` }) : null;
    if (leaves) leaves.mesh.castShadow = true;
    group.current.add(solid.mesh);
    if (leaves) group.current.add(leaves.mesh);
    const out = { solid, leaves, build: build ?? { solid: solidGeo, leaves: leavesGeo, height: 1 } };
    pools.current.set(id, out);
    return out;
  };

  const slots = useRef<Slot[]>([]);
  const growingUntil = useRef(0);
  const lastStage = useRef(new Map<string, number>());

  // What stands where: rebuilt when a parcel's stage or species change.
  const key = parcels
    ? found.map((p) => {
      const ps = parcels[p.id];
      return ps && ps.s >= 3 ? `${p.id}:${ps.s}:${ps.plants.join('.')}` : '';
    }).join('|')
    : '';
  useEffect(() => {
    if (!parcels || !group.current) return;
    const now = performance.now();
    for (const p of pools.current.values()) {
      p.solid.reset();
      p.leaves?.reset();
    }
    const next: Slot[] = [];
    let grew = false;
    for (const spec of found) {
      const ps = parcels[spec.id];
      if (!ps || ps.s < 3 || ps.plants.length === 0) continue;
      const before = lastStage.current.get(spec.id);
      if (before !== undefined && before < ps.s) grew = true;
      lastStage.current.set(spec.id, ps.s);
      const species = [...new Set(ps.plants)].slice(0, 6);
      species.forEach((id, k) => {
        const def = PLANTS[id];
        const set = def ? poolsFor(id) : null;
        if (!def || !set) return;
        const rng = mulberry32((spec.i * 73856093) ^ (spec.j * 19349663) ^ (k * 83492791));
        const count = PLANTED_PER_PARCEL[def.look];
        const to = plantedScale(def.look, ps.s);
        const from = before !== undefined && before < ps.s ? plantedScale(def.look, before) : to;
        const sector = (k / 6) * Math.PI * 2 + (spec.i * 0.7 + spec.j * 1.3);
        for (let n = 0; n < count; n++) {
          const a = sector + (rng() - 0.5) * (Math.PI / 3.2);
          const r = def.look === 'arbol' ? 2.3 + rng() * 0.6 : GAME.planted.innerM + rng() * (GAME.planted.outerM - GAME.planted.innerM);
          const x = spec.x + Math.cos(a) * r;
          const z = spec.z + Math.sin(a) * r;
          const i = set.solid.alloc();
          if (i < 0) break;
          const j = set.leaves ? set.leaves.alloc() : -1;
          next.push({
            pool: set.solid, leaves: set.leaves, i, j, x, y: sampleHeight(heightfield, x, z), z,
            rot: rng() * Math.PI * 2, jitter: 0.85 + rng() * 0.3, from, to,
          });
        }
      });
    }
    slots.current = next;
    growingUntil.current = grew ? now + GAME.planted.growMs : 0;
    place(grew ? 0 : 1);
    // `found`, `heightfield` and the pools' closure are stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /** Write every slot at growth progress `k` (0 → the old size, 1 → the new). */
  const place = (k: number) => {
    const e = k >= 1 ? 1 : easeOutBack(k);
    for (const s of slots.current) {
      const scale = Math.max(0.001, (s.from + (s.to - s.from) * e) * s.jitter);
      s.pool.place(s.i, s.x, s.y, s.z, s.rot, scale);
      if (s.leaves && s.j >= 0) s.leaves.place(s.j, s.x, s.y, s.z, s.rot, scale);
    }
    for (const p of pools.current.values()) {
      p.solid.resize(p.solid.count);
      p.solid.commit();
      if (p.leaves) {
        p.leaves.resize(p.leaves.count);
        p.leaves.commit();
      }
    }
  };

  useFrame(() => {
    if (!growingUntil.current) return;
    const now = performance.now();
    const k = 1 - (growingUntil.current - now) / GAME.planted.growMs;
    if (k >= 1) {
      growingUntil.current = 0;
      place(1);
      return;
    }
    place(Math.max(0, k));
  });

  return <group ref={group} name="planted" />;
}

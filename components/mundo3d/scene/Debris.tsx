'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { buildDebris, type DebrisKind } from '@/lib/render/geometry/debris';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial } from '@/lib/render/materials';
import { MIRROR_RANGE } from '@/lib/world/config';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import { mulberry32 } from '@/lib/world/rng';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { BlobShadowPool } from '@/lib/render/shadows';

/**
 * La Costa — the beach that starts littered and gets cleaner.
 *
 * The waste channel of the impact mirror, and **the only system in the game
 * that begins in a worse state** (`13-IMPACT-MIRROR.md` §2). Everything about
 * how it behaves follows from one rule: it is never added to. `debrisCount`
 * runs `[40, 0]` against logged waste avoided, so the only direction a piece
 * ever moves is off the sand.
 *
 * The positions are fixed for the island's whole life. A piece that vanishes
 * does so because that stretch of beach got cleaned, and the ones left are in
 * the same places they always were — which is what makes returning after a
 * month read as *"la playa se está limpiando"* rather than as a beach that
 * shuffled itself while you were away.
 */
const KINDS: DebrisKind[] = [0, 1, 2];
/** How far up the beach from the waterline a piece can wash. */
const BAND_M = 1.9;
/** The blob under a piece of litter. Small: it is a bottle, not a bench. */
const DEBRIS_SHADOW = 0.07;

interface Spot {
  x: number;
  z: number;
  kind: DebrisKind;
  rot: number;
  scale: number;
}

export function Debris({
  heightfield,
  layout,
  debrisCount,
  shadows,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  /** From `mirror.debrisCount`. Only ever decreases as impact grows. */
  debrisCount: number;
  shadows?: BlobShadowPool;
}) {
  // Litter does not sway and does not take the wind. It shares the material
  // rock and wood already use, so the beach costs no material of its own.
  const material = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);

  const pools = useMemo(
    () =>
      KINDS.map((kind) => ({
        kind,
        // Sized at the dirtiest the beach can ever be, so cleaning it never
        // allocates and the count is the only thing that moves.
        pool: new InstancePool(buildDebris(kind), material, MIRROR_RANGE.debrisCount[0], {
          name: `debris${kind}`,
        }),
      })),
    [material],
  );

  /**
   * Every place a piece could be, in a fixed order.
   *
   * The list is built at the maximum and never rebuilt; `resize` takes a
   * prefix. That is what makes the disappearance monotonic: piece 39 goes
   * first, piece 0 last, and none of them ever moves.
   */
  const spots = useMemo<Spot[]>(() => {
    const rng = mulberry32(layout.seed ^ 0xc0a57a1);
    const out: Spot[] = [];
    const max = MIRROR_RANGE.debrisCount[0];
    for (let i = 0; i < max; i++) {
      const angle = rng() * Math.PI * 2;
      // Just inside the coastline, where the sand is.
      const r = coastRadiusAt(layout.coastline, angle) - rng() * BAND_M;
      out.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        kind: KINDS[i % KINDS.length]!,
        rot: rng() * Math.PI * 2,
        scale: 0.85 + rng() * 0.4,
      });
    }
    return out;
  }, [layout]);

  useEffect(() => {
    const placed: number[] = [];
    for (const { kind, pool } of pools) {
      for (const spot of spots) {
        if (spot.kind !== kind) continue;
        const i = pool.alloc();
        if (i < 0) break;
        const y = sampleHeight(heightfield, spot.x, spot.z);
        pool.place(i, spot.x, y, spot.z, spot.rot, spot.scale);
        if (shadows) {
          const slot = shadows.addStatic(heightfield, spot.x, spot.z, DEBRIS_SHADOW * spot.scale);
          if (slot >= 0) placed.push(slot);
        }
      }
      pool.commit();
    }
    return () => {
      for (const slot of placed) shadows?.releaseStatic(slot);
    };
  }, [pools, spots, heightfield, shadows]);

  /**
   * How much of the beach is still littered.
   *
   * A count, not a rebuild — the same trick the quality tiers use. Cleaning the
   * beach costs one integer per pool and drops no frame.
   */
  useEffect(() => {
    const total = Math.max(0, Math.min(MIRROR_RANGE.debrisCount[0], Math.round(debrisCount)));
    pools.forEach(({ pool }, i) => {
      // Split what remains evenly across the three shapes, so a half-clean
      // beach is not a beach of nothing but cans.
      pool.resize(Math.floor(total / KINDS.length) + (i < total % KINDS.length ? 1 : 0));
    });
  }, [pools, debrisCount]);

  useEffect(() => () => pools.forEach(({ pool }) => pool.dispose()), [pools]);

  return (
    <group name="debris">
      {pools.map(({ kind, pool }) => (
        <primitive key={kind} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

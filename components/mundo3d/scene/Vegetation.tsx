'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { InstancePool } from '@/lib/render/instancing';
import { flower, grassTuft, rock, sprout } from '@/lib/render/geometry/scatter';
import { getTree } from '@/lib/render/geometry';
import { getClayMaterial } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import { mulberry32 } from '@/lib/world/rng';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import type { IslandLayout, ScatterPoint } from '@/lib/world/layout';
import { sampleHeight, sampleSlope, type Heightfield } from '@/lib/world/terrain';
import type { QualityTier, WorldConfig } from '@/lib/world/types';

/**
 * Everything that grows, through `InstancePool` and nothing else.
 *
 * **No scene file contains a hard-coded instance count** — every number here
 * comes from `lib/render/quality.ts`, so changing tier changes `mesh.count` on
 * pools that already exist and costs nothing (`07-RENDER-ARCHITECTURE.md` §4.3).
 *
 * The pools are built at their T3 maximum and then trimmed, which is why a
 * promotion never has to allocate and a demotion never has to free.
 *
 * At tiers 1-2 there are almost no trees. That is correct: El Claro is bare
 * warm earth, and the frame still has to read as composed.
 */
const MAX_TIER: QualityTier = 3;
/** Accents for the flower mix — the one place a saturated hue belongs. */
const FLOWER_ACCENTS = [DOMAIN_COLORS.animales, DOMAIN_COLORS.energia, DOMAIN_COLORS.consumo];
/** Variants per species, so a field is not one shape repeated. */
const VARIANTS = 3;

interface PoolSet {
  grass: InstancePool[];
  flowers: InstancePool[];
  rocks: InstancePool[];
  sprouts: InstancePool;
  trees: { wood: InstancePool; leaves: InstancePool }[];
  all: InstancePool[];
}

/** Points that can carry a given kind of plant, filtered once at build time. */
function pick(points: ScatterPoint[], from: number, to: number): ScatterPoint[] {
  return points.filter((p) => p.roll >= from && p.roll < to);
}

export function Vegetation({
  heightfield,
  layout,
  config,
  tier,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  tier: QualityTier;
}) {
  // Foliage sways; rock and wood do not. Two materials, both shared, both cached.
  const foliage = useMemo(() => getClayMaterial({ vertexColors: true, wind: true, wobble: true }), []);
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);

  const pools = useMemo<PoolSet>(() => {
    const max = TIERS[MAX_TIER];
    const all: InstancePool[] = [];
    const track = <T extends InstancePool>(pool: T): T => {
      all.push(pool);
      return pool;
    };

    const grass = Array.from({ length: VARIANTS }, (_, v) =>
      track(new InstancePool(grassTuft(v + 1), foliage, Math.ceil(max.grassTufts / VARIANTS), { name: `grass${v}` })),
    );
    const flowers = FLOWER_ACCENTS.map((accent, v) =>
      track(
        new InstancePool(
          flower(v, accent),
          foliage,
          Math.ceil(max.flowers / FLOWER_ACCENTS.length),
          { name: `flower${v}` },
        ),
      ),
    );
    const rocks = Array.from({ length: VARIANTS }, (_, v) =>
      track(new InstancePool(rock(v * 31 + 7), solid, Math.ceil(max.rocks / VARIANTS), { name: `rock${v}` })),
    );
    const sprouts = track(new InstancePool(sprout(3), foliage, Math.ceil(max.flowers / 2), { name: 'sprouts' }));
    const trees = Array.from({ length: VARIANTS }, (_, v) => {
      const built = getTree(v === 0 ? 'oak' : v === 1 ? 'birch' : 'bush', v + 1, 0);
      return {
        wood: track(new InstancePool(built.wood, solid, Math.ceil(max.trees / VARIANTS), { name: `wood${v}` })),
        leaves: track(
          new InstancePool(built.leaves, foliage, Math.ceil(max.trees / VARIANTS), { name: `canopy${v}` }),
        ),
      };
    });
    return { grass, flowers, rocks, sprouts, trees, all };
  }, [foliage, solid]);

  /**
   * Place everything once, from the layout's deterministic scatter pool. Quality
   * tiers take a **prefix** of that pool, so changing quality never moves a
   * plant that was already there.
   */
  useEffect(() => {
    const rng = mulberry32(layout.seed ^ 0x9e3779b9);
    const points = layout.scatter;
    const hasGrass = config.features.includes('puddle') || config.tier >= 2;

    const place = (pool: InstancePool, list: ScatterPoint[], scale: [number, number], lift = 0) => {
      for (const p of list) {
        const i = pool.alloc();
        if (i < 0) break;
        const y = sampleHeight(heightfield, p.x, p.z) + lift;
        const s = scale[0] + (scale[1] - scale[0]) * p.roll;
        // A slight tilt into the hillside, so nothing stands plumb on a slope.
        const slope = sampleSlope(heightfield, p.x, p.z);
        pool.place(i, p.x, y, p.z, rng() * Math.PI * 2, s, slope * 0.4, 0);
      }
      pool.commit();
    };

    // Bands of the stable `roll` value decide what grows where, so the mix is
    // as deterministic as the positions.
    if (hasGrass) {
      pools.grass.forEach((pool, v) => place(pool, pick(points, v / VARIANTS, (v + 1) / VARIANTS), [0.7, 1.4]));
      place(pools.sprouts, pick(points, 0.0, 0.12), [0.8, 1.3]);
    }
    if (config.tier >= 3) {
      pools.flowers.forEach((pool, v) => place(pool, pick(points, 0.3 + v * 0.06, 0.36 + v * 0.06), [0.8, 1.4]));
    }
    pools.rocks.forEach((pool, v) => place(pool, pick(points, 0.9 + v * 0.03, 0.92 + v * 0.03), [0.6, 1.5]));
    if (config.tier >= 4) {
      pools.trees.forEach(({ wood, leaves }, v) => {
        const list = pick(points, 0.62 + v * 0.03, 0.65 + v * 0.03);
        for (const p of list) {
          const wi = wood.alloc();
          const li = leaves.alloc();
          if (wi < 0 || li < 0) break;
          const y = sampleHeight(heightfield, p.x, p.z);
          const s = 1.4 + p.roll * 1.2;
          const rot = rng() * Math.PI * 2;
          wood.place(wi, p.x, y, p.z, rot, s);
          leaves.place(li, p.x, y, p.z, rot, s);
        }
        wood.commit();
        leaves.commit();
      });
    }
  }, [pools, layout, heightfield, config]);

  /** A tier change is one integer per pool. It allocates nothing and frees nothing. */
  useEffect(() => {
    const t = TIERS[tier];
    pools.grass.forEach((pool) => pool.resize(Math.ceil(t.grassTufts / VARIANTS)));
    pools.flowers.forEach((pool) => pool.resize(Math.ceil(t.flowers / FLOWER_ACCENTS.length)));
    pools.rocks.forEach((pool) => pool.resize(Math.ceil(t.rocks / VARIANTS)));
    pools.sprouts.resize(Math.ceil(t.flowers / 2));
    pools.trees.forEach(({ wood, leaves }) => {
      const n = Math.ceil(t.trees / VARIANTS);
      wood.resize(n);
      leaves.resize(n);
    });
  }, [pools, tier]);

  useEffect(() => () => pools.all.forEach((pool) => pool.dispose()), [pools]);

  return (
    <group name="vegetation">
      {pools.all.map((pool) => (
        <primitive key={pool.mesh.name} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

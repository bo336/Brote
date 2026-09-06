'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { InstancePool } from '@/lib/render/instancing';
import type { BlobShadowPool } from '@/lib/render/shadows';
import type { PropCollider } from '../control/CharacterController';
import { flower, grassTuft, rock, sprout } from '@/lib/render/geometry/scatter';
import { getTree, type TreeSpecies } from '@/lib/render/geometry';
import { getClayMaterial } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import { LAYOUT } from '@/lib/world/config';
import { mulberry32 } from '@/lib/world/rng';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import type { IslandLayout, ScatterPoint } from '@/lib/world/layout';
import { REGION_CHARACTER } from '@/lib/world/regions';
import type { BiomeConfig } from '@/lib/world/biome';
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
/**
 * Blob footprints, as a fraction of the instance's own scale. Only things tall
 * enough to look like they are hovering get one — grass and flowers sit flush
 * on the ground and a shadow under each would be several hundred quads to say
 * nothing (`06-ART-DIRECTION.md` §7).
 */
const TREE_SHADOW = 0.42;
const ROCK_SHADOW = 0.3;
/**
 * Trunk radius, as a fraction of the tree's instance scale. Generous on
 * purpose: it is what stops Pip walking through a trunk and what keeps the
 * camera from ending up inside one, and neither wants to be pixel-accurate.
 */
const TRUNK_RADIUS = 0.22;
/**
 * …and how wide the whole tree is to the camera. The lower branches reach far
 * past the stem, so a boom that only dodges trunks still ends up inside the
 * tree. This keeps the lens out of the canopy altogether.
 */
const CROWN_RADIUS = 0.85;
/**
 * Grass instances per scatter point, and how far they spread around it.
 *
 * The scatter pool is the binding constraint on ground cover, not the tier
 * budget: `shareGrass` of 2000 points, thinned by region and biome, left about
 * a third of a tuft per square metre and the island read as bare. Growing the
 * pool is not the answer — its minimum-spacing check is O(n^2) and 2048 points
 * already cost 64 ms to lay out. A clump around each point is free by
 * comparison, and grass grows in clumps anyway.
 */
const GRASS_PER_POINT = 3;
const GRASS_CLUMP_M = 0.34;

interface PoolSet {
  grass: InstancePool[];
  flowers: InstancePool[];
  rocks: InstancePool[];
  sprouts: InstancePool;
  trees: { wood: InstancePool; leaves: InstancePool }[];
  all: InstancePool[];
}

/**
 * The pool is divided by the stable `roll` value into one contiguous band per
 * kind, sized to the T3 budget. Bands are cumulative, so adding one never moves
 * the points already assigned to another.
 */
const BANDS = {
  sprouts: [0, LAYOUT.shareSprouts],
  grass: [LAYOUT.shareSprouts, LAYOUT.shareSprouts + LAYOUT.shareGrass],
  flowers: [
    LAYOUT.shareSprouts + LAYOUT.shareGrass,
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers,
  ],
  trees: [
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers,
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers + LAYOUT.shareTrees,
  ],
  rocks: [
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers + LAYOUT.shareTrees,
    1,
  ],
} as const;

/** One variant's slice of a band, so three variants split it evenly. */
function pick(points: ScatterPoint[], band: readonly [number, number], variant: number, variants: number): ScatterPoint[] {
  const width = (band[1] - band[0]) / variants;
  const from = band[0] + variant * width;
  const to = from + width;
  return points.filter((p) => p.roll >= from && p.roll < to);
}

export function Vegetation({
  heightfield,
  layout,
  config,
  tier,
  biome,
  shadows,
  onColliders,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  tier: QualityTier;
  biome: BiomeConfig;
  /** Trees and rocks take a static blob so they sit on the ground, not over it. */
  shadows?: BlobShadowPool;
  /** Trunks, for walking around and for keeping the camera out of the wood. */
  onColliders?: (colliders: PropCollider[]) => void;
}) {
  // Foliage sways; rock and wood do not. Two materials, both shared, both cached.
  const foliage = useMemo(() => getClayMaterial({ vertexColors: true, wind: true, wobble: true }), []);
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);

  const mix = biome.mix;
  // LOD level from the tier's tree-LOD budget: 3 levels means full detail.
  const treeLods = (TIERS[tier].treeLods >= 3 ? 0 : TIERS[tier].treeLods >= 2 ? 1 : 2) as 0 | 1 | 2;

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
    // Which three shapes this biome grows, in weight order — from `kind`, never
    // from a display name (`02-AUDIT.md` §4).
    const species = (Object.entries(mix.trees) as [TreeSpecies, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, VARIANTS)
      .map(([name]) => name);
    const trees = Array.from({ length: VARIANTS }, (_, v) => {
      const built = getTree(species[v] ?? 'oak', v + 1, treeLods);
      return {
        wood: track(new InstancePool(built.wood, solid, Math.ceil(max.trees / VARIANTS), { name: `wood${v}` })),
        leaves: track(
          new InstancePool(built.leaves, foliage, Math.ceil(max.trees / VARIANTS), { name: `canopy${v}` }),
        ),
      };
    });
    return { grass, flowers, rocks, sprouts, trees, all };
  }, [foliage, solid, mix, treeLods]);

  /**
   * Place everything once, from the layout's deterministic scatter pool.
   *
   * Two multipliers ride on top of the tier's counts: the **region's character**
   * (El Claro is bare warm earth; El Jardín is flowers first; La Cumbre is above
   * the tree line) and the **biome's mix**, chosen from `biome.kind` and never
   * from a name match. That pair is what makes nine regions read as nine places
   * rather than one field with different props on it.
   *
   * Quality tiers take a **prefix** of the pool, so changing quality never moves
   * a plant that was already there.
   */
  useEffect(() => {
    const rng = mulberry32(layout.seed ^ 0x9e3779b9);
    const points = layout.scatter;
    const mix = biome.mix;
    /** Every blob this pass places, so a re-run replaces them rather than doubling. */
    const placedShadows: number[] = [];
    /** Trunk footprints, collected as the trees go down. */
    const trunks: PropCollider[] = [];

    /** Keep a point with probability `density`, deterministically per point. */
    const thin = (list: ScatterPoint[], density: number) =>
      density >= 1 ? list : list.filter((p) => ((p.roll * 977) % 1) < density);

    const place = (
      pool: InstancePool,
      list: ScatterPoint[],
      scale: [number, number],
      lift = 0,
      /** Footprint of the blob that grounds each one, or 0 for no shadow. */
      shadow = 0,
    ) => {
      for (const p of list) {
        const character = REGION_CHARACTER[p.region];
        // Bare ground shows through where the region says it should.
        if (((p.roll * 613) % 1) < character.bareness * 0.6) continue;
        const i = pool.alloc();
        if (i < 0) break;
        const y = sampleHeight(heightfield, p.x, p.z) + lift;
        const s = scale[0] + (scale[1] - scale[0]) * p.roll;
        const slope = sampleSlope(heightfield, p.x, p.z);
        pool.place(i, p.x, y, p.z, rng() * Math.PI * 2, s, slope * 0.4, 0);
        if (shadow > 0 && shadows) {
          const slot = shadows.addStatic(heightfield, p.x, p.z, shadow * s);
          if (slot >= 0) placedShadows.push(slot);
        }
      }
      pool.commit();
    };

    /**
     * Ground cover: several tufts around each scatter point rather than one on
     * it. Offsets are derived from the point's own stable roll, so the clump is
     * as deterministic as the point it grew from.
     */
    const placeClumped = (pool: InstancePool, list: ScatterPoint[], scale: [number, number]) => {
      for (const p of list) {
        const character = REGION_CHARACTER[p.region];
        if (((p.roll * 613) % 1) < character.bareness * 0.6) continue;
        const y0 = sampleHeight(heightfield, p.x, p.z);
        const slope = sampleSlope(heightfield, p.x, p.z);
        for (let k = 0; k < GRASS_PER_POINT; k++) {
          const i = pool.alloc();
          if (i < 0) return;
          // A ring around the point, rotated by the roll so no two agree.
          const a = p.roll * Math.PI * 2 + (k / GRASS_PER_POINT) * Math.PI * 2;
          const r = k === 0 ? 0 : GRASS_CLUMP_M * (0.45 + ((p.roll * 149 * (k + 1)) % 1) * 0.55);
          const x = p.x + Math.cos(a) * r;
          const z = p.z + Math.sin(a) * r;
          const s = scale[0] + (scale[1] - scale[0]) * ((p.roll * 71 * (k + 1)) % 1);
          pool.place(i, x, k === 0 ? y0 : sampleHeight(heightfield, x, z), z, rng() * Math.PI * 2, s, slope * 0.4, 0);
        }
      }
      pool.commit();
    };

    /** The share of a band a region actually wants, from its character. */
    const forRegion = (list: ScatterPoint[], key: 'grass' | 'flowers' | 'rocks' | 'trees') =>
      list.filter((p) => ((p.roll * 331) % 1) < Math.min(1, REGION_CHARACTER[p.region][key]));

    /**
     * Rock on the mountain, interleaved rather than appended.
     *
     * `resize` trims a pool to a **prefix** of what was placed, so anything at
     * the back of the list vanishes at low tiers. The steep points all come
     * from El Monte and La Cumbre and sit at the end of the scatter array, so
     * appending them would leave the mountain bare on exactly the devices most
     * likely to be looking at it. One steep for every three flat keeps both in
     * any prefix.
     */
    const interleaveSteep = (list: ScatterPoint[]) => {
      const steep = list.filter((p) => p.steep);
      const flat = list.filter((p) => !p.steep);
      if (steep.length === 0) return flat;
      const out: ScatterPoint[] = [];
      let si = 0;
      for (let i = 0; i < flat.length; i++) {
        out.push(flat[i]!);
        if (i % 3 === 2 && si < steep.length) out.push(steep[si++]!);
      }
      for (; si < steep.length; si++) out.push(steep[si]!);
      return out;
    };

    if (config.tier >= 2) {
      pools.grass.forEach((pool, v) =>
        placeClumped(
          pool,
          thin(forRegion(pick(points, BANDS.grass, v, VARIANTS), 'grass'), mix.grassDensity),
          [0.7, 1.4],
        ),
      );
      place(pools.sprouts, pick(points, BANDS.sprouts, 0, 1), [0.8, 1.3]);
    }
    if (config.tier >= 3) {
      pools.flowers.forEach((pool, v) =>
        place(
          pool,
          thin(forRegion(pick(points, BANDS.flowers, v, FLOWER_ACCENTS.length), 'flowers'), mix.flowerDensity),
          [0.8, 1.4],
        ),
      );
    }
    pools.rocks.forEach((pool, v) =>
      place(
        pool,
        interleaveSteep(thin(forRegion(pick(points, BANDS.rocks, v, VARIANTS), 'rocks'), mix.rockDensity)),
        [0.6, 1.5],
        0,
        ROCK_SHADOW,
      ),
    );
    if (config.tier >= 4) {
      pools.trees.forEach(({ wood, leaves }, v) => {
        const list = forRegion(pick(points, BANDS.trees, v, VARIANTS), 'trees');
        for (const p of list) {
          const wi = wood.alloc();
          const li = leaves.alloc();
          if (wi < 0 || li < 0) break;
          const y = sampleHeight(heightfield, p.x, p.z);
          const s = 1.4 + p.roll * 1.2;
          const rot = rng() * Math.PI * 2;
          wood.place(wi, p.x, y, p.z, rot, s);
          leaves.place(li, p.x, y, p.z, rot, s);
          if (shadows) {
            const slot = shadows.addStatic(heightfield, p.x, p.z, TREE_SHADOW * s);
            if (slot >= 0) placedShadows.push(slot);
          }
          trunks.push({
            x: p.x, z: p.z,
            radius: TRUNK_RADIUS * s,
            cameraRadius: CROWN_RADIUS * s,
          });
        }
        wood.commit();
        leaves.commit();
      });
    }

    onColliders?.(trunks);
    return () => {
      for (const slot of placedShadows) shadows?.releaseStatic(slot);
    };
  }, [pools, layout, heightfield, config, biome, shadows, onColliders]);

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

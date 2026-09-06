'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { InstancePool } from '@/lib/render/instancing';
import type { BlobShadowPool } from '@/lib/render/shadows';
import type { PropCollider } from '../control/CharacterController';
import { flower, grassTuft, rock, sprout } from '@/lib/render/geometry/scatter';
import { getTree, type TreeSpecies } from '@/lib/render/geometry';
import { getClayMaterial } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import { CAMERA, LAYOUT } from '@/lib/world/config';
import { mulberry32 } from '@/lib/world/rng';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import type { IslandLayout, ScatterPoint } from '@/lib/world/layout';
import { BANDS, forRegion, interleaveSteep, pick, thin } from '@/lib/world/bands';
import { REGION_CHARACTER } from '@/lib/world/regions';
import type { BiomeConfig } from '@/lib/world/biome';
import { sampleHeight, sampleSlope, type Heightfield } from '@/lib/world/terrain';
import type { QualityTier, WorldConfig } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';

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

/** One tree, and the two pool slots it occupies. */
interface Canopy {
  x: number;
  z: number;
  radius: number;
  wood: InstancePool;
  leaves: InstancePool;
  wi: number;
  li: number;
  fade: number;
}

interface PoolSet {
  grass: InstancePool[];
  flowers: InstancePool[];
  rocks: InstancePool[];
  sprouts: InstancePool;
  trees: { wood: InstancePool; leaves: InstancePool }[];
  all: InstancePool[];
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
  /**
   * Every tree, and how solid it currently is. Written once when the trees are
   * placed and read every frame by the fade below — never rebuilt per frame.
   */
  const canopyRef = useRef<Canopy[]>([]);
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
    /** …and where each one sits in its pool, so the fade can find it again. */
    const canopies: Canopy[] = [];

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
          canopies.push({ x: p.x, z: p.z, radius: CROWN_RADIUS * s, wood, leaves, wi, li, fade: 1 });
        }
        wood.commit();
        leaves.commit();
      });
    }

    onColliders?.(trunks);
    canopyRef.current = canopies;
    return () => {
      canopyRef.current = [];
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

  /**
   * **The dithered occluder fade** (`10-CONTROLS-AND-CAMERA.md` §4).
   *
   * A tree standing between the lens and Pip loses its alpha instead of shoving
   * the camera around. The spec asks for this *first* and for the distance
   * pull-in only as a fallback for the hard cases, because a fade is calmer than
   * a camera that lurches whenever you walk past a trunk.
   *
   * The test is the same closest-approach solve the camera uses, run on the
   * ground plane, and it allocates nothing.
   */
  useFrame(({ camera }, delta) => {
    const canopies = canopyRef.current;
    if (canopies.length === 0) return;
    const p = playerTransform;
    // The corridor from Pip to the lens, on the ground.
    let ax = camera.position.x - p.x;
    let az = camera.position.z - p.z;
    const len = Math.hypot(ax, az);
    if (len < 0.001) return;
    ax /= len;
    az /= len;
    const kIn = 1 - Math.exp(-CAMERA.fadeInLambda * delta);
    const kOut = 1 - Math.exp(-CAMERA.fadeOutLambda * delta);

    for (const c of canopies) {
      const ox = c.x - p.x;
      const oz = c.z - p.z;
      const t = ox * ax + oz * az;
      let blocking = false;
      if (t > 0 && t < len) {
        const perpX = ox - ax * t;
        const perpZ = oz - az * t;
        const r = c.radius + CAMERA.fadeMarginM;
        blocking = perpX * perpX + perpZ * perpZ < r * r;
      }
      const target = blocking ? CAMERA.fadeMin : 1;
      const k = target < c.fade ? kIn : kOut;
      const next = c.fade + (target - c.fade) * k;
      if (Math.abs(next - c.fade) < 0.001) continue;
      c.fade = next;
      c.wood.setFade(c.wi, next);
      c.leaves.setFade(c.li, next);
    }
  });

  useEffect(() => () => pools.all.forEach((pool) => pool.dispose()), [pools]);

  return (
    <group name="vegetation">
      {pools.all.map((pool) => (
        <primitive key={pool.mesh.name} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

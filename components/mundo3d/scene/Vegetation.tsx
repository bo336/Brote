'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { InstancePool } from '@/lib/render/instancing';
import type { BlobShadowPool } from '@/lib/render/shadows';
import type { PropCollider } from '../control/CharacterController';
import { useCanopyFade, type Canopy } from './useCanopyFade';
import { flower, grassTuft, rock, sprout } from '@/lib/render/geometry/scatter';
import { getTree, type TreeSpecies } from '@/lib/render/geometry';
import { buildLeafAtlas } from '@/lib/render/geometry/leaf-atlas';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { TIERS, variantsFor } from '@/lib/render/quality';
import { mulberry32 } from '@/lib/world/rng';
import { maturation, maturedScale } from '@/lib/world/growth';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import type { IslandLayout, ScatterPoint } from '@/lib/world/layout';
import { BANDS, forRegion, interleaveSteep, pick, thin } from '@/lib/world/bands';
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
/**
 * Variants per species, so a field is not one shape repeated — at the tiers
 * that can afford it. `variantsFor` explains why the low tiers get one.
 */
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

export function Vegetation({
  heightfield,
  layout,
  config,
  tier,
  biome,
  shadows,
  createdAt = 0,
  onColliders,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  tier: QualityTier;
  biome: BiomeConfig;
  /** Trees and rocks take a static blob so they sit on the ground, not over it. */
  shadows?: BlobShadowPool;
  /**
   * When the island was made, epoch ms, for idle maturation. Zero means it has
   * grown nothing on its own — which is what a world nobody owns should look
   * like, and what a missing timestamp should never be guessed past.
   */
  createdAt?: number;
  /** Trunks, for walking around and for keeping the camera out of the wood. */
  onColliders?: (colliders: PropCollider[]) => void;
}) {
  // Foliage sways; rock and wood do not. Two materials, both shared, both cached.
  const foliage = useMemo(() => getClayMaterial({ vertexColors: true, wind: true, wobble: true }), []);
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);
  /**
   * Canopies: leaf cards cut out of the painted atlas (`leaf-atlas.ts`), double
   * sided, swaying, lit as one soft crown. Their shadow needs the same cut-out,
   * or every tree throws a shadow made of squares.
   */
  const canopy = useMemo(
    () => getClayMaterial({
      vertexColors: true, wind: true, wobble: false, side: THREE.DoubleSide, alphaTest: 0.5,
      map: getTexture('leaf-atlas', buildLeafAtlas),
    }),
    [],
  );
  const canopyDepth = useMemo(
    () => new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: getTexture('leaf-atlas', buildLeafAtlas), alphaTest: 0.5,
    }),
    [],
  );
  useEffect(() => () => canopyDepth.dispose(), [canopyDepth]);

  const mix = biome.mix;
  /**
   * Every tree, and how solid it currently is. Written once when the trees are
   * placed and read every frame by the fade below — never rebuilt per frame.
   */
  const canopyRef = useRef<Canopy[]>([]);
  /**
   * **What grows is decided once, at the tier the session started on** — like
   * the ground. A demotion used to rebuild the pools with one species instead of
   * three and trim the tree count, so the jacarandás and ceibos a desktop opened
   * with were gone a few seconds later: "the best trees only appear for a second".
   * A demotion still has shadows, the lens, the grass rings and resolution to
   * give back, and none of those makes a tree vanish.
   */
  const plantTier = useRef(tier).current;
  // LOD level from the tier's tree-LOD budget: 3 levels means full detail.
  const treeLods = (TIERS[plantTier].treeLods >= 3 ? 0 : TIERS[plantTier].treeLods >= 2 ? 1 : 2) as 0 | 1 | 2;
  /**
   * One shape per kind at the low tiers, three at the high ones.
   *
   * Rebuilding the pools when this changes is the same thing `treeLods` already
   * does a line above: a tier change may not move a plant that is already
   * there, and taking a prefix of a differently-shaped pool is what keeps that
   * true — the positions come from the same scatter either way.
   */
  const variants = variantsFor(plantTier);

  const pools = useMemo<PoolSet>(() => {
    const max = TIERS[MAX_TIER];
    const all: InstancePool[] = [];
    const track = <T extends InstancePool>(pool: T): T => {
      all.push(pool);
      return pool;
    };

    const grass = Array.from({ length: variants }, (_, v) =>
      track(new InstancePool(grassTuft(v + 1), foliage, Math.ceil(max.grassTufts / variants), { name: `grass${v}` })),
    );
    /**
     * **As many flower shapes as the tier can afford, not always three.**
     *
     * `FLOWER_ACCENTS.length` was a hard-coded instance count in a scene file,
     * which is the one thing `07-RENDER-ARCHITECTURE.md` §4.3 says may not
     * exist — and it cost what a hard-coded count always costs: three pools,
     * three geometries and three draw calls at T0, where `variantsFor` had
     * already decided the answer was one.
     */
    const flowers = FLOWER_ACCENTS.slice(0, variants).map((accent, v) =>
      track(
        new InstancePool(
          flower(v, accent),
          foliage,
          Math.ceil(max.flowers / variants),
          { name: `flower${v}` },
        ),
      ),
    );
    const rocks = Array.from({ length: variants }, (_, v) =>
      track(new InstancePool(rock(v * 31 + 7), solid, Math.ceil(max.rocks / variants), { name: `rock${v}` })),
    );
    const sprouts = track(new InstancePool(sprout(3), foliage, Math.ceil(max.flowers / 2), { name: 'sprouts' }));
    // Which three shapes this biome grows, in weight order — from `kind`, never
    // from a display name (`02-AUDIT.md` §4).
    const species = (Object.entries(mix.trees) as [TreeSpecies, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, variants)
      .map(([name]) => name);
    const trees = Array.from({ length: variants }, (_, v) => {
      const built = getTree(species[v] ?? 'oak', v + 1, treeLods);
      return {
        wood: track(new InstancePool(built.wood, solid, Math.ceil(max.trees / variants), { name: `wood${v}` })),
        leaves: track(
          new InstancePool(built.leaves, canopy, Math.ceil(max.trees / variants), { name: `canopy${v}` }),
        ),
      };
    });
    // Trees and rocks cast the sun's shadow; ground cover only receives it.
    for (const pool of all) pool.mesh.receiveShadow = true;
    for (const pool of rocks) pool.mesh.castShadow = true;
    for (const { wood, leaves } of trees) {
      wood.mesh.castShadow = true;
      leaves.mesh.castShadow = true;
      leaves.mesh.customDepthMaterial = canopyDepth;
    }
    return { grass, flowers, rocks, sprouts, trees, all };
  }, [foliage, solid, canopy, canopyDepth, mix, treeLods, variants]);

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
    /**
     * How much the island has grown on its own since it was made
     * (`11-GAME-LOOP.md` §3.6). A tenth over a week: enough to notice on
     * return, never enough to move a collider or become a reason to log in.
     */
    const grown = maturation(createdAt, Date.now());

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
        const s = maturedScale(scale[0] + (scale[1] - scale[0]) * p.roll, grown);
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
          const s = maturedScale(scale[0] + (scale[1] - scale[0]) * ((p.roll * 71 * (k + 1)) % 1), grown);
          pool.place(i, x, k === 0 ? y0 : sampleHeight(heightfield, x, z), z, rng() * Math.PI * 2, s, slope * 0.4, 0);
        }
      }
      pool.commit();
    };

    if (config.tier >= 2) {
      pools.grass.forEach((pool, v) =>
        placeClumped(
          pool,
          thin(forRegion(pick(points, BANDS.grass, v, variants), 'grass'), mix.grassDensity),
          [0.7, 1.4],
        ),
      );
      place(pools.sprouts, pick(points, BANDS.sprouts, 0, 1), [0.8, 1.3]);
    }
    if (config.tier >= 3) {
      pools.flowers.forEach((pool, v) =>
        place(
          pool,
          thin(forRegion(pick(points, BANDS.flowers, v, pools.flowers.length), 'flowers'), mix.flowerDensity),
          [0.8, 1.4],
        ),
      );
    }
    pools.rocks.forEach((pool, v) =>
      place(
        pool,
        interleaveSteep(thin(forRegion(pick(points, BANDS.rocks, v, variants), 'rocks'), mix.rockDensity)),
        [0.6, 1.5],
        0,
        ROCK_SHADOW,
      ),
    );
    if (config.tier >= 4) {
      pools.trees.forEach(({ wood, leaves }, v) => {
        const list = forRegion(pick(points, BANDS.trees, v, variants), 'trees');
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
  }, [pools, layout, heightfield, config, biome, shadows, createdAt, variants, onColliders]);

  /** The counts for the session's tier: one integer per pool, set once. */
  useEffect(() => {
    const t = TIERS[plantTier];
    pools.grass.forEach((pool) => pool.resize(Math.ceil(t.grassTufts / variants)));
    pools.flowers.forEach((pool) => pool.resize(Math.ceil(t.flowers / pools.flowers.length)));
    pools.rocks.forEach((pool) => pool.resize(Math.ceil(t.rocks / variants)));
    pools.sprouts.resize(Math.ceil(t.flowers / 2));
    pools.trees.forEach(({ wood, leaves }) => {
      const n = Math.ceil(t.trees / variants);
      wood.resize(n);
      leaves.resize(n);
    });
  }, [pools, plantTier, variants]);

  useCanopyFade(canopyRef);

  useEffect(() => () => pools.all.forEach((pool) => pool.dispose()), [pools]);

  return (
    <group name="vegetation">
      {pools.all.map((pool) => (
        <primitive key={pool.mesh.name} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

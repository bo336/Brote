'use client';

import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';

import { buildGround, buildIslandBody, buildIsletGround } from '@/lib/render/geometry/terrain';
import { buildGroundDetail, type GroundDetail } from '@/lib/render/geometry/ground-detail';
import { pathInfo, pathMapFor } from '@/lib/render/geometry/path-map';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import { CLAY, type WorldPalette } from '@/lib/render/palette';
import { GROUND, WATER_LEVEL } from '@/lib/world/config';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import type { QualityTier } from '@/lib/world/types';

/**
 * The ground and the body under it.
 *
 * Both are built **once**, from the already-baked heightfield. The old world
 * rebuilt its 132² ground on every re-render because an unmemoised object
 * literal changed identity — hundreds of thousands of noise evaluations
 * synchronously, which is why tapping the world froze it (`02-AUDIT.md` §6.3).
 * Here the geometry depends only on the heightfield, the layout and the tier's
 * grid, and a re-render cannot touch any of them.
 *
 * The ground opts **out** of vertical AO: AO darkens where things meet the
 * ground, and the ground is the surface that is being met. Its occlusion is
 * already baked per vertex at generation time.
 */
export function Island({
  heightfield,
  layout,
  palette,
  tier,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  palette: WorldPalette;
  tier: QualityTier;
}) {
  // Terrain opts out of BOTH silhouette effects: the vertical AO (its occlusion
  // is already baked per vertex) and the Fresnel rim (on a floor, a rim term is
  // a wash, not an edge).
  const material = useMemo(() => {
    // `ground: true` is what lets the tier-up uplift deform this and carry
    // everything standing on it instead (`lib/render/reveal.ts`).
    const mat = getClayMaterial({ vertexColors: true, ao: false, rim: false, wobble: true, ground: true });
    // Soil grain, pebbles and litter, and their bump (`geometry/ground-detail.ts`).
    // Both maps come out of one bake; the cache owns their disposal.
    let built: GroundDetail | null = null;
    const detail = () => (built ??= buildGroundDetail());
    mat.clayUniforms.uGroundDetail!.value = getTexture('ground-detail', () => detail().albedo);
    mat.clayUniforms.uGroundNormal!.value = getTexture('ground-normal', () => detail().normal);
    return mat;
  }, []);
  const grid = TIERS[tier].terrainGrid;

  const ground = useMemo(
    () => buildGround(heightfield, layout, palette, grid),
    [heightfield, layout, palette, grid],
  );
  const body = useMemo(() => buildIslandBody(heightfield, layout), [heightfield, layout]);
  /** El Islote, when the tier has put one across the water. */
  const islet = useMemo(
    () => (layout.terrain.islet ? buildIsletGround(heightfield, layout.terrain.islet, palette) : null),
    [heightfield, layout, palette],
  );

  // The worn paths, cut by the shader from their distance map (`geometry/path-map.ts`).
  useEffect(() => {
    const u = material.clayUniforms;
    u.uPathMap!.value = pathMapFor(layout, heightfield.extent);
    pathInfo(heightfield.extent, u.uPathInfo!.value as THREE.Vector4);
    (u.uPathColor!.value as THREE.Color).set(CLAY.path);
    (u.uPathWorn!.value as THREE.Color).set(CLAY.pathWorn);
    u.uPathFloor!.value = WATER_LEVEL + GROUND.pathAboveWaterM;
  }, [material, layout, heightfield]);

  useEffect(() => () => ground.dispose(), [ground]);
  useEffect(() => () => body.dispose(), [body]);
  useEffect(() => () => islet?.dispose(), [islet]);

  return (
    <group name="island">
      <mesh geometry={ground} material={material} receiveShadow />
      <mesh geometry={body} material={material} receiveShadow />
      {islet && <mesh geometry={islet} material={material} receiveShadow />}
    </group>
  );
}

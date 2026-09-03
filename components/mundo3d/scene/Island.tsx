'use client';

import { useEffect, useMemo } from 'react';

import { buildGround, buildIslandBody } from '@/lib/render/geometry/terrain';
import { getClayMaterial } from '@/lib/render/materials';
import { TIERS } from '@/lib/render/quality';
import type { WorldPalette } from '@/lib/render/palette';
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
  const material = useMemo(
    () => getClayMaterial({ vertexColors: true, ao: false, rim: false, wobble: true }),
    [],
  );
  const grid = TIERS[tier].terrainGrid;

  const ground = useMemo(
    () => buildGround(heightfield, layout, palette, grid),
    [heightfield, layout, palette, grid],
  );
  const body = useMemo(() => buildIslandBody(heightfield, layout), [heightfield, layout]);

  useEffect(() => () => ground.dispose(), [ground]);
  useEffect(() => () => body.dispose(), [body]);

  return (
    <group name="island">
      <mesh geometry={ground} material={material} receiveShadow={false} />
      <mesh geometry={body} material={material} />
    </group>
  );
}

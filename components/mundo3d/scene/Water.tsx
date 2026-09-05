'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { buildWaterMeshes } from '@/lib/render/geometry/terrain';
import { getWaterMaterial, tickWaterMaterials } from '@/lib/render/materials';
import { setWaterTier } from '@/lib/render/materials/water';
import type { WorldPalette } from '@/lib/render/palette';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import type { QualityTier } from '@/lib/world/types';

/**
 * Water — the one reflective surface in the game, and therefore the thing the
 * eye goes to. That is deliberate (`06-ART-DIRECTION.md` §2 rule 6).
 *
 * In this phase there is one body: La Pradera's puddle. It is carved by the
 * same height function as everything else, so `isWater`, `isPlantable` and this
 * mesh all agree about where the water is without a line of special-casing.
 *
 * `flow` comes from `MirrorParams.riverFlow` — real litres not spent, made
 * visible as the speed of the surface.
 */
export function Water({
  heightfield,
  layout,
  palette,
  tier,
  flow,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  palette: WorldPalette;
  tier: QualityTier;
  flow: number;
}) {
  const meshes = useMemo(
    () => buildWaterMeshes(layout.terrain, heightfield),
    [layout, heightfield],
  );
  const depthScale = meshes.length > 0 ? meshes[0]!.maxDepth : 1;
  // Built once. A tier change retunes three uniforms rather than compiling a
  // second water shader (`07-RENDER-ARCHITECTURE.md` §4.3).
  const initialTier = useRef(tier).current;
  const material = useMemo(
    () => getWaterMaterial({ tier: initialTier, color: palette.water, depthScale }),
    [initialTier, palette.water, depthScale],
  );
  useEffect(() => setWaterTier(material, tier), [material, tier]);

  useEffect(() => () => meshes.forEach((m) => m.geometry.dispose()), [meshes]);

  useFrame(({ clock }) => tickWaterMaterials(clock.elapsedTime, flow));

  return (
    <group name="water">
      {meshes.map((m, i) => (
        <mesh key={i} geometry={m.geometry} material={material} renderOrder={2} />
      ))}
    </group>
  );
}

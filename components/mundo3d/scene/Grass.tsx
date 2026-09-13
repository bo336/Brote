'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

import { bakeGrassTextures, createGrassField, disposeGrass, setGrassTier, tickGrass } from '@/lib/render/grass';
import { currentMood, currentSun } from '@/lib/render/materials';
import type { WorldPalette } from '@/lib/render/palette';
import type { BiomeConfig } from '@/lib/world/biome';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import type { QualityTier } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';

/**
 * Long grass, everywhere it should grow, moving in the wind and parting around
 * Pip (`lib/render/grass.ts`).
 *
 * The textures are baked once per island and palette; a tier change moves two
 * uniforms and an instance count. The field follows Pip every frame.
 */
export function Grass({
  heightfield,
  layout,
  palette,
  biome,
  worldTier,
  tier,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  palette: WorldPalette;
  biome: BiomeConfig;
  worldTier: number;
  tier: QualityTier;
}) {
  const textures = useMemo(
    () => bakeGrassTextures(heightfield, layout, palette, biome, worldTier),
    [heightfield, layout, palette, biome, worldTier],
  );
  const field = useMemo(() => createGrassField(textures, heightfield), [textures, heightfield]);
  useEffect(() => () => disposeGrass(field), [field]);
  useEffect(() => setGrassTier(field, tier), [field, tier]);

  useFrame(({ clock }) => {
    const mood = currentMood();
    tickGrass(
      field,
      playerTransform,
      clock.elapsedTime,
      currentSun(),
      mood && {
        color: mood.fogColor, near: mood.fogNear, far: mood.fogFar, density: mood.fogDensity, windOn: mood.windAmp > 0,
      },
    );
  });

  return <primitive object={field.mesh} />;
}

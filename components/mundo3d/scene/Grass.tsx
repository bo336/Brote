'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

import { pathMapFor } from '@/lib/render/geometry/path-map';
import { bakeGrassTextures, createGrassSystem, disposeGrass, setGrassRestoration, setGrassTier, tickGrass } from '@/lib/render/grass';
import { neutralRestoration } from '@/lib/render/restoration';
import { useRestorationTex } from '../game/scene/Restoration';
import { currentMood, currentSun, setGroundGrass } from '@/lib/render/materials';
import type { WorldPalette } from '@/lib/render/palette';
import type { BiomeConfig } from '@/lib/world/biome';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import type { QualityTier } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';

/**
 * Long grass, everywhere it should grow, in three rings around Pip
 * (`lib/render/grass.ts`). The textures are baked once per island and palette;
 * the density mask is shared with the ground, which darkens under the blades.
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
  const pathMap = useMemo(() => pathMapFor(layout, heightfield.extent), [layout, heightfield]);
  const system = useMemo(() => createGrassSystem(textures, heightfield, pathMap), [textures, heightfield, pathMap]);
  useEffect(() => () => disposeGrass(system), [system]);
  useEffect(() => setGrassTier(system, tier), [system, tier]);
  // The game's restoration map: how much of the grass potential grows, and how alive it is.
  const rest = useRestorationTex((s) => s.tex);
  useEffect(() => setGrassRestoration(system, rest ?? neutralRestoration()), [system, rest]);
  useEffect(() => {
    setGroundGrass(textures.maskTex, heightfield.res, heightfield.step, heightfield.extent);
  }, [textures, heightfield]);

  useFrame(({ clock }) => {
    const mood = currentMood();
    tickGrass(
      system,
      playerTransform,
      clock.elapsedTime,
      currentSun(),
      mood && {
        color: mood.fogColor, near: mood.fogNear, far: mood.fogFar, density: mood.fogDensity, windOn: mood.windAmp > 0,
      },
    );
  });

  return <primitive object={system.group} />;
}

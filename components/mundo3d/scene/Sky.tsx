'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import { PRESET_LAMBDA } from '@/lib/render/lights';
import { currentSun } from '@/lib/render/materials';
import type { WorldPalette } from '@/lib/render/palette';
import { buildSky, disposeSky, paintSky, tickSky } from '@/lib/render/sky';
import type { QualityTier, TimeOfDay } from '@/lib/world/types';

/**
 * The sky dome: a gradient, a sun, clouds that drift, and stars at night — one
 * shader, no texture (`23-ART-DIRECTION-V2.md`).
 *
 * It follows the camera, so it is always exactly as far away as the horizon, and
 * it reads the sun from the same place the materials do, so the bright side of
 * the sky is always the side the shadows point away from.
 */
export function Sky({
  palette,
  timeOfDay,
}: {
  palette: WorldPalette;
  timeOfDay: TimeOfDay;
  tier: QualityTier;
}) {
  const scene = useThree((s) => s.scene);
  const sky = useMemo(() => buildSky(), []);

  useEffect(() => {
    scene.add(sky.dome);
    return () => {
      scene.remove(sky.dome);
      disposeSky(sky);
    };
  }, [scene, sky]);

  useEffect(() => {
    paintSky(sky, palette, timeOfDay);
  }, [sky, palette, timeOfDay]);

  useFrame(({ camera, clock }, delta) => {
    const sun = currentSun();
    tickSky(sky, camera.position, clock.elapsedTime, timeOfDay, 1 - Math.exp(-PRESET_LAMBDA * delta), sun.dir, sun.color);
  });

  return null;
}

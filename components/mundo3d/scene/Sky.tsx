'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import { getOverlayMaterial } from '@/lib/render/materials';
import { buildSky, buildStars, disposeSky, paintSky, setTimeOfDay, type Sky as SkyState } from '@/lib/render/sky';
import { PRESET_LAMBDA } from '@/lib/render/lights';
import { TIERS } from '@/lib/render/quality';
import type { WorldPalette } from '@/lib/render/palette';
import type { QualityTier, TimeOfDay } from '@/lib/world/types';

/**
 * The sky dome and the star field. **No skybox textures**
 * (`06-ART-DIRECTION.md` §6): one inverted sphere with a two-stop vertical
 * gradient in its vertex colours, and stars as one instanced mesh sharing the
 * same material.
 *
 * The gradient is repainted only when the palette changes; the star fade is the
 * only thing that runs per frame.
 */
export function Sky({
  palette,
  timeOfDay,
  tier,
}: {
  palette: WorldPalette;
  timeOfDay: TimeOfDay;
  tier: QualityTier;
}) {
  const scene = useThree((s) => s.scene);
  // The one flat vertex-coloured material, shared with the mist wall, the
  // ghosted silhouette and the interaction cue.
  const material = useMemo(() => getOverlayMaterial(), []);
  // Star count rides the particle budget: a T0 phone gets a quiet sky rather
  // than a slow one. It is rounded so a tier change does not rebuild the field
  // for one extra star.
  const starCount = Math.round(TIERS[tier].particles * 0.8);

  const skyState = useMemo<SkyState>(
    () => ({
      dome: buildSky(material),
      stars: buildStars(starCount, material),
      nightness: 0,
    }),
    [material, starCount],
  );
  const stateRef = useRef<SkyState>(skyState);

  useEffect(() => {
    stateRef.current = skyState;
    scene.add(skyState.dome);
    if (skyState.stars) scene.add(skyState.stars);
    return () => {
      scene.remove(skyState.dome);
      if (skyState.stars) scene.remove(skyState.stars);
      disposeSky(skyState);
    };
  }, [scene, skyState]);

  useEffect(() => {
    paintSky(skyState.dome, palette);
  }, [skyState, palette]);

  useFrame((_, delta) => {
    setTimeOfDay(stateRef.current, timeOfDay, 1 - Math.exp(-PRESET_LAMBDA * delta));
  });

  return null;
}

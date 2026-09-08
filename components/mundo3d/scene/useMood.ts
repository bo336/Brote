'use client';

import { useEffect } from 'react';

import { updateMood } from '@/lib/render/materials';
import { fogRange } from '@/lib/render/materials/clay';
import { TIERS } from '@/lib/render/quality';
import { WIND, WOBBLE } from '@/lib/world/config';
import type { MirrorParams, QualityTier } from '@/lib/world/types';
import type { WorldPalette } from '@/lib/render/palette';

/**
 * The mood: one object, ~11 uniforms, every clay material in the scene.
 *
 * Time of day, biome and the impact mirror all change how the world looks
 * without rebuilding any of it (`07-RENDER-ARCHITECTURE.md` §4.3) — a palette
 * swap is eleven numbers, not a shader compile and not a geometry rebuild.
 */
export function useMood(palette: WorldPalette, tier: QualityTier, mirror: MirrorParams): void {
  useEffect(() => {
    // `mirror.fogFar` is already in metres (45 at zero impact, 110 at full).
    // Clamp it to what the tier is willing to draw, and let the near plane fall
    // out of that — an earlier version divided by the T3 distance and fogged
    // the whole island out at 24 m.
    const { near, far } = fogRange(Math.min(TIERS[tier].renderDistanceM, mirror.fogFar));
    updateMood({
      rimColor: palette.light.rimColor,
      fogColor: palette.fog,
      fogNear: near,
      fogFar: Math.max(near + 1, far),
      fogDensity: mirror.fogDensity,
      time: 0,
      // T0 turns the handmade wobble and the wind off entirely, by amplitude
      // rather than by rebuilding anything (`06-ART-DIRECTION.md` §5).
      wobbleAmp: TIERS[tier].wobble ? WOBBLE.amp : 0,
      windAmp: TIERS[tier].wind ? WIND.amp : 0,
    });
  }, [palette, tier, mirror]);
}

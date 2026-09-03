'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import { applyLiveliness, applyPreset, buildLightRig, disposeLightRig, PRESET_LAMBDA } from '@/lib/render/lights';
import { PRESETS } from '@/lib/render/palette';
import type { TimeOfDay } from '@/lib/world/types';

/**
 * The four-light rig, cross-fading between the four authored time-of-day
 * presets over ~2 s (`06-ART-DIRECTION.md` §6).
 *
 * The fade uses the exponential form, so the two-second figure holds at 30 fps
 * and at 60 (`01-RULES.md` §3.13) — a raw per-frame constant would make the
 * same transition take twice as long on the device we actually target.
 */
export function Lights({ timeOfDay, liveliness }: { timeOfDay: TimeOfDay; liveliness: number }) {
  const scene = useThree((s) => s.scene);
  // Built once with the default preset; the first frames cross-fade it to
  // whatever the actual time of day is, which is the same path every later
  // change takes.
  const rig = useMemo(() => buildLightRig(), []);

  useEffect(() => {
    scene.add(rig.group);
    return () => {
      scene.remove(rig.group);
      disposeLightRig(rig);
    };
  }, [scene, rig]);

  useFrame((_, delta) => {
    applyPreset(rig, PRESETS[timeOfDay], 1 - Math.exp(-PRESET_LAMBDA * delta));
    // Liveliness adds warmth and only warmth. It never removes anything.
    applyLiveliness(rig, liveliness);
  });

  return null;
}

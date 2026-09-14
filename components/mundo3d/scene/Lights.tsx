'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import {
  applyLiveliness, applyPreset, buildLightRig, configureShadows, disposeLightRig, followTarget, PRESET_LAMBDA,
} from '@/lib/render/lights';
import { updateSun } from '@/lib/render/materials';
import { PRESETS } from '@/lib/render/palette';
import { TIERS } from '@/lib/render/quality';
import type { QualityTier, TimeOfDay } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The light rig, cross-fading between the four time-of-day presets, with a sun
 * that follows Pip so its shadow is sharp where the player is and costs nothing
 * where they are not.
 *
 * Every frame it also hands the sun to the materials — direction and colour —
 * so leaves and grass can glow when you look at them against it.
 */
const scratchSun = new THREE.Color();

export function Lights({
  timeOfDay,
  liveliness,
  tier,
}: {
  timeOfDay: TimeOfDay;
  liveliness: number;
  tier: QualityTier;
}) {
  const scene = useThree((s) => s.scene);
  const rig = useMemo(() => buildLightRig(), []);

  useEffect(() => {
    scene.add(rig.group);
    return () => {
      scene.remove(rig.group);
      disposeLightRig(rig);
    };
  }, [scene, rig]);

  useEffect(() => {
    const t = TIERS[tier];
    configureShadows(rig, t.realShadows, t.shadowMapSize, t.shadowExtentM);
  }, [rig, tier]);

  useFrame((_, delta) => {
    applyPreset(rig, PRESETS[timeOfDay], 1 - Math.exp(-PRESET_LAMBDA * delta));
    applyLiveliness(rig, liveliness);
    const t = TIERS[tier];
    const p = playerTransform;
    followTarget(rig, p.x, p.y, p.z, (t.shadowExtentM * 2) / t.shadowMapSize);
    // Radiance, the way the lighting model counts it: colour × intensity / π.
    scratchSun.copy(rig.key.color).multiplyScalar(rig.key.intensity / Math.PI);
    updateSun(rig.sunDir, scratchSun);
  });

  return null;
}

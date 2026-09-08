'use client';

import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';

import type { InstancePool } from '@/lib/render/instancing';
import { CAMERA } from '@/lib/world/config';
import { playerTransform } from '../state/usePlayerStore';

/** One tree, and the two pool slots it occupies. */
export interface Canopy {
  x: number;
  z: number;
  radius: number;
  wood: InstancePool;
  leaves: InstancePool;
  wi: number;
  li: number;
  fade: number;
}

/**
 * **The dithered occluder fade** (`10-CONTROLS-AND-CAMERA.md` §4).
 *
 * A tree standing between the lens and Pip loses its alpha instead of shoving
 * the camera around. The spec asks for this *first* and for the distance
 * pull-in only as a fallback for the hard cases, because a fade is calmer than
 * a camera that lurches whenever you walk past a trunk.
 *
 * The test is the same closest-approach solve the camera uses, run on the
 * ground plane, and it allocates nothing: the list is written once when the
 * trees are placed and only read here.
 */
export function useCanopyFade(canopyRef: MutableRefObject<Canopy[]>): void {
  useFrame(({ camera }, delta) => {
    const canopies = canopyRef.current;
    if (canopies.length === 0) return;
    const p = playerTransform;
    // The corridor from Pip to the lens, on the ground.
    let ax = camera.position.x - p.x;
    let az = camera.position.z - p.z;
    const len = Math.hypot(ax, az);
    if (len < 0.001) return;
    ax /= len;
    az /= len;
    const kIn = 1 - Math.exp(-CAMERA.fadeInLambda * delta);
    const kOut = 1 - Math.exp(-CAMERA.fadeOutLambda * delta);

    for (const c of canopies) {
      const ox = c.x - p.x;
      const oz = c.z - p.z;
      const t = ox * ax + oz * az;
      let blocking = false;
      if (t > 0 && t < len) {
        const perpX = ox - ax * t;
        const perpZ = oz - az * t;
        const r = c.radius + CAMERA.fadeMarginM;
        blocking = perpX * perpX + perpZ * perpZ < r * r;
      }
      const target = blocking ? CAMERA.fadeMin : 1;
      const k = target < c.fade ? kIn : kOut;
      const next = c.fade + (target - c.fade) * k;
      if (Math.abs(next - c.fade) < 0.001) continue;
      c.fade = next;
      c.wood.setFade(c.wi, next);
      c.leaves.setFade(c.li, next);
    }
  });
}

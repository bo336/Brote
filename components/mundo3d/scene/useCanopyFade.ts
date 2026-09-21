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
    const cx = camera.position.x;
    const cz = camera.position.z;
    let ax = cx - p.x;
    let az = cz - p.z;
    const len = Math.hypot(ax, az);
    if (len < 0.001) return;
    ax /= len;
    az /= len;
    const kIn = 1 - Math.exp(-CAMERA.fadeInLambda * delta);
    const kOut = 1 - Math.exp(-CAMERA.fadeOutLambda * delta);

    for (const c of canopies) {
      const next = nextFade(c.fade, blocksLens(c.x, c.z, c.radius, p.x, p.z, ax, az, len, cx, cz), kIn, kOut);
      if (next === c.fade) continue;
      c.fade = next;
      c.wood.setFade(c.wi, next);
      c.leaves.setFade(c.li, next);
    }
  });
}

/**
 * Does a thing of this reach stand in the lens's way? Either across the
 * corridor from Pip to the lens, or with the lens itself inside its reach — the
 * corridor alone missed a trunk or a tent just behind the camera, which is the
 * one that fills the frame.
 */
export function blocksLens(
  x: number, z: number, radius: number,
  px: number, pz: number, ax: number, az: number, len: number, cx: number, cz: number,
): boolean {
  const r = radius + CAMERA.fadeMarginM;
  if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
  const ox = x - px;
  const oz = z - pz;
  const t = ox * ax + oz * az;
  if (t <= 0 || t >= len) return false;
  const perpX = ox - ax * t;
  const perpZ = oz - az * t;
  return perpX * perpX + perpZ * perpZ < r * r;
}

/** One damped step toward faded or solid; returns `fade` itself once there is nothing left to move. */
export function nextFade(fade: number, blocking: boolean, kIn: number, kOut: number): number {
  const target = blocking ? CAMERA.fadeMin : 1;
  const next = fade + (target - fade) * (target < fade ? kIn : kOut);
  return Math.abs(next - fade) < 0.001 ? fade : next;
}

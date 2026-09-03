'use client';

import { useCallback, useRef } from 'react';
import type React from 'react';

import { CAMERA, JOYSTICK } from '@/lib/world/config';
import type { FollowCamera } from './FollowCamera';

/**
 * Manual camera: **a drag anywhere outside the joystick zone orbits the yaw**,
 * and a two-finger pinch adjusts distance within a clamp
 * (`10-CONTROLS-AND-CAMERA.md` §4).
 *
 * The joystick owns the bottom-left of the screen, so this deliberately ignores
 * any pointer that starts there — otherwise walking would swing the camera.
 *
 * Sensitivity is a setting, separately adjustable, because a fixed rate is an
 * accessibility failure for anyone with limited range of motion (XAG 117).
 */
const RADIANS_PER_PIXEL = 0.006;
/** Metres of dolly per pixel of pinch. */
const METRES_PER_PIXEL = 0.02;

interface DragOptions {
  cameraRef: React.MutableRefObject<FollowCamera | null>;
  sensitivity: number;
  onInput: () => void;
}

export function useCameraDrag({ cameraRef, sensitivity, onInput }: DragOptions) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinch = useRef<number | null>(null);

  const inJoystickZone = useCallback((e: React.PointerEvent) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return e.clientX < w * JOYSTICK.zoneWidthPct && e.clientY > h * (1 - JOYSTICK.zoneHeightPct);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (inJoystickZone(e)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    },
    [inJoystickZone],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const previous = pointers.current.get(e.pointerId);
      if (!previous) return;
      const camera = cameraRef.current;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!camera) return;
      onInput();

      if (pointers.current.size >= 2) {
        // Two fingers: pinch to dolly, clamped so no shot is ever too near.
        const [a, b] = Array.from(pointers.current.values());
        if (!a || !b) return;
        const spread = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch.current !== null) {
          camera.zoom((lastPinch.current - spread) * METRES_PER_PIXEL);
        }
        lastPinch.current = spread;
        return;
      }
      lastPinch.current = null;
      camera.orbit((e.clientX - previous.x) * RADIANS_PER_PIXEL * sensitivity);
    },
    [cameraRef, sensitivity, onInput],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastPinch.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

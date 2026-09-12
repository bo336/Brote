'use client';

import { useCallback, useRef } from 'react';
import type React from 'react';

import { CAMERA, JOYSTICK } from '@/lib/world/config';
import type { FollowCamera } from './FollowCamera';

/**
 * Manual camera. **A drag orbits and tilts; the wheel and a pinch zoom**
 * (`10-CONTROLS-AND-CAMERA.md` §4, and the 2026-09-12 playtest's "the angle
 * should be adjustable like the rotation").
 *
 * On a touch screen the joystick owns the bottom-left, so a finger that starts
 * there never turns the camera. A mouse has no joystick — WASD is its stick —
 * so it may drag from anywhere.
 *
 * Sensitivity is a setting, because a fixed rate is an accessibility failure for
 * anyone with limited range of motion (XAG 117).
 */
interface DragOptions {
  cameraRef: React.MutableRefObject<FollowCamera | null>;
  sensitivity: number;
  onInput: () => void;
}

export function useCameraDrag({ cameraRef, sensitivity, onInput }: DragOptions) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinch = useRef<number | null>(null);

  const inJoystickZone = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return false;
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
        const [a, b] = Array.from(pointers.current.values());
        if (!a || !b) return;
        const spread = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch.current !== null) camera.zoom((lastPinch.current - spread) * CAMERA.pinchMetresPerPx);
        lastPinch.current = spread;
        return;
      }
      lastPinch.current = null;
      camera.orbit(
        (e.clientX - previous.x) * CAMERA.dragYawPerPx * sensitivity,
        // Drag down, look down from higher up — the convention every web 3D viewer uses.
        -(e.clientY - previous.y) * CAMERA.dragPitchPerPx * sensitivity,
      );
    },
    [cameraRef, sensitivity, onInput],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastPinch.current = null;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const camera = cameraRef.current;
      if (!camera) return;
      onInput();
      camera.zoom(e.deltaY * CAMERA.wheelMetresPerPx);
    },
    [cameraRef, onInput],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onWheel };
}

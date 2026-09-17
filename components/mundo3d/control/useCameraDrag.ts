'use client';

import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

import { CAMERA, JOYSTICK } from '@/lib/world/config';
import type { FollowCamera } from './FollowCamera';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Manual camera. **A drag orbits and tilts; the wheel, a trackpad pinch, a
 * two-finger pinch, the + / − keys and the on-screen buttons zoom**
 * (`10-CONTROLS-AND-CAMERA.md` §4, and the 2026-09-16 playtest's "I would also
 * like to zoom in and out").
 *
 * On a touch screen the joystick owns the bottom-left, so a finger that starts
 * there never turns the camera. A mouse has no joystick — WASD is its stick —
 * so it may drag from anywhere, with either button.
 *
 * The wheel is listened for natively and not passively: a trackpad pinch
 * arrives as a ctrl+wheel, which the browser would otherwise turn into zooming
 * the whole page. Only a wheel over the world zooms it — a sheet's list still
 * scrolls.
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
        // Fingers apart, closer; together, farther — by the ratio, so it tracks the hand.
        if (lastPinch.current !== null && spread > 1) camera.zoomBy(lastPinch.current / spread);
        lastPinch.current = spread;
        return;
      }
      lastPinch.current = null;
      useSessionStore.getState().markControl('look');
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

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // Over the world only: a sheet's list keeps its scroll.
      if (!(e.target instanceof HTMLCanvasElement)) return;
      const camera = cameraRef.current;
      if (!camera) return;
      e.preventDefault();
      onInput();
      // Firefox reports lines, not pixels.
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      camera.zoomBy(Math.exp(px * (e.ctrlKey ? CAMERA.trackpadZoomPerPx : CAMERA.wheelZoomPerPx)));
      useSessionStore.getState().markControl('zoom');
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [cameraRef, onInput]);

  // The keys, the buttons and the settings sheet all reach the zoom through the store.
  useEffect(() => {
    const zoom = (factor: number) => {
      onInput();
      cameraRef.current?.zoomBy(factor);
      useSessionStore.getState().markControl('zoom');
    };
    useSessionStore.getState().setZoom(zoom);
    return () => useSessionStore.getState().setZoom(null);
  }, [cameraRef, onInput]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

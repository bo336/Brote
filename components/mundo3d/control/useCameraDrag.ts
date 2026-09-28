'use client';

import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

import { CAMERA, JOYSTICK } from '@/lib/world/config';
import type { FollowCamera } from './FollowCamera';
import { yieldStick } from './Joystick';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Manual camera. **A drag orbits and tilts; the wheel, a trackpad pinch, a
 * two-finger pinch, the + / − keys and the on-screen buttons zoom**
 * (`10-CONTROLS-AND-CAMERA.md` §4, and the 2026-09-16 playtest's "I would also
 * like to zoom in and out").
 *
 * On a touch screen the joystick owns the bottom-left, so a finger that starts
 * there never turns the camera — unless another finger lands with it: two
 * fingers down together are a pinch wherever they land. A mouse has no
 * joystick — WASD is its stick — so it may drag from anywhere, with either
 * button.
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

interface Finger {
  x: number;
  y: number;
  x0: number;
  y0: number;
  /** When it landed, `performance.now()`. */
  t: number;
}

export function useCameraDrag({ cameraRef, sensitivity, onInput }: DragOptions) {
  const pointers = useRef(new Map<number, Finger>());
  // Fingers the joystick took. Watched, because one of them may turn out to
  // be half of a pinch: a pinch centred on a phone puts its left finger right
  // in the stick's corner.
  const stick = useRef(new Map<number, Finger>());
  const lastPinch = useRef<number | null>(null);

  const inJoystickZone = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return false;
    const w = window.innerWidth;
    const h = window.innerHeight;
    return e.clientX < w * JOYSTICK.zoneWidthPct && e.clientY > h * (1 - JOYSTICK.zoneHeightPct);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const now = performance.now();
      const finger: Finger = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: now };
      const fresh = (f: Finger) => now - f.t < JOYSTICK.pinchWindowMs && Math.hypot(f.x - f.x0, f.y - f.y0) < JOYSTICK.pinchSlopPx;
      const zone = inJoystickZone(e);
      // Two fingers down together are a pinch wherever they land. The stick
      // lets go of its thumb before it has walked anywhere.
      const partner = e.pointerType === 'mouse'
        ? undefined
        : [...stick.current].find(([, f]) => fresh(f)) ?? (zone ? [...pointers.current].find(([, f]) => fresh(f)) : undefined);
      if (!partner) {
        (zone ? stick : pointers).current.set(e.pointerId, finger);
        return;
      }
      yieldStick();
      for (const [id, f] of stick.current) pointers.current.set(id, f);
      stick.current.clear();
      pointers.current.set(e.pointerId, finger);
      lastPinch.current = null;
    },
    [inJoystickZone],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const held = stick.current.get(e.pointerId);
      if (held) {
        held.x = e.clientX;
        held.y = e.clientY;
        return;
      }
      const finger = pointers.current.get(e.pointerId);
      if (!finger) return;
      const previous = { x: finger.x, y: finger.y };
      finger.x = e.clientX;
      finger.y = e.clientY;
      const camera = cameraRef.current;
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
    stick.current.delete(e.pointerId);
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

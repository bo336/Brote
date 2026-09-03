'use client';

import { useCallback, useRef, useState } from 'react';

import { HAPTIC_MS, JOYSTICK } from '@/lib/world/config';
import { clearStickInput, setStickInput } from './useInput';

/**
 * The floating-origin joystick. Hand-rolled, ~120 lines
 * (`18-DECISIONS.md` T8): nipplejs manipulates the DOM and fights React, and
 * ecctrl drags Rapier WASM in for a game that needs no physics.
 *
 * **Floating origin is the single highest-impact input rule.** The stick spawns
 * wherever the thumb lands inside the activation zone, which removes "find the
 * stick without looking" entirely. Nothing is drawn until you touch it.
 *
 * Pointer Events with `setPointerCapture`, tracking `pointerId`, so a second
 * finger — an interaction tap — never hijacks the stick, and capture survives
 * the thumb sliding outside the zone.
 */
interface JoystickProps {
  /** Disabled during a ceremony or while a sheet is open. */
  enabled?: boolean;
  /** Fires once when the stick crosses the run threshold. */
  onRun?: () => void;
}

interface StickState {
  pointerId: number;
  originX: number;
  originY: number;
}

export function Joystick({ enabled = true, onRun }: JoystickProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<StickState | null>(null);
  const wasRunningRef = useRef(false);
  // Only the visible knob is React state, and only while a thumb is down.
  const [visual, setVisual] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);

  const write = useCallback(
    (clientX: number, clientY: number, origin: StickState) => {
      const dx = clientX - origin.originX;
      const dy = clientY - origin.originY;
      const distance = Math.hypot(dx, dy);
      const clamped = Math.min(distance, JOYSTICK.maxRadiusPx);
      const magnitude = clamped / JOYSTICK.maxRadiusPx;

      if (magnitude < JOYSTICK.deadZone) {
        // Below the dead zone this is thumb tremor. Under 8% you get drift;
        // over 15% the first millimetre feels dead.
        setStickInput(0, 0, 0, true);
        setVisual({ x: origin.originX, y: origin.originY, dx: 0, dy: 0 });
        return;
      }

      const nx = dx / (distance || 1);
      const ny = dy / (distance || 1);
      // Screen down is world forward: the camera looks along -Z.
      setStickInput(nx, ny, magnitude, true);

      const running = magnitude >= JOYSTICK.runThreshold;
      if (running && !wasRunningRef.current) {
        onRun?.();
        // A haptic tick at the threshold is how you feel the gear change.
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(HAPTIC_MS);
          } catch {
            /* vibration is a nicety, never a requirement */
          }
        }
      }
      wasRunningRef.current = running;
      setVisual({ x: origin.originX, y: origin.originY, dx: nx * clamped, dy: ny * clamped });
    },
    [onRun],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || stateRef.current) return;
      const origin: StickState = { pointerId: e.pointerId, originX: e.clientX, originY: e.clientY };
      stateRef.current = origin;
      e.currentTarget.setPointerCapture(e.pointerId);
      write(e.clientX, e.clientY, origin);
    },
    [enabled, write],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const origin = stateRef.current;
      // Track the id: a second finger elsewhere must not move this stick.
      if (!origin || e.pointerId !== origin.pointerId) return;
      write(e.clientX, e.clientY, origin);
    },
    [write],
  );

  const release = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const origin = stateRef.current;
    if (!origin || e.pointerId !== origin.pointerId) return;
    stateRef.current = null;
    wasRunningRef.current = false;
    clearStickInput();
    // No return animation: the input damps to zero in ~150 ms and the stick
    // simply stops being drawn.
    setVisual(null);
  }, []);

  return (
    <div
      ref={zoneRef}
      className="joystick-zone absolute bottom-0 left-0 touch-none"
      style={{
        width: `${JOYSTICK.zoneWidthPct * 100}%`,
        height: `${JOYSTICK.zoneHeightPct * 100}%`,
        // The iOS home indicator sits exactly where a left thumb rests.
        paddingBottom: `max(env(safe-area-inset-bottom), ${JOYSTICK.safeAreaMinPx}px)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      aria-hidden
    >
      {visual && (
        <>
          <span
            className="pointer-events-none fixed rounded-full border border-white/40 bg-white/10"
            style={{
              width: JOYSTICK.maxRadiusPx * 2,
              height: JOYSTICK.maxRadiusPx * 2,
              left: visual.x - JOYSTICK.maxRadiusPx,
              top: visual.y - JOYSTICK.maxRadiusPx,
            }}
          />
          <span
            className="pointer-events-none fixed rounded-full bg-white/70"
            style={{
              width: JOYSTICK.maxRadiusPx * 0.75,
              height: JOYSTICK.maxRadiusPx * 0.75,
              left: visual.x + visual.dx - JOYSTICK.maxRadiusPx * 0.375,
              top: visual.y + visual.dy - JOYSTICK.maxRadiusPx * 0.375,
            }}
          />
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';

import { JOYSTICK } from '@/lib/world/config';

/**
 * One normalised movement vector, from the joystick or the keyboard.
 *
 * **One code path** (`10-CONTROLS-AND-CAMERA.md` §1): WASD and the arrow keys
 * drive the same vector the thumb does, so nothing downstream ever asks which
 * device is in use.
 *
 * Like `playerTransform`, this is a plain mutable object rather than React
 * state — it changes every frame and has exactly one reader.
 */
export interface InputVector {
  /** -1..1, screen-relative. The controller rotates it by the camera yaw. */
  x: number;
  z: number;
  /** 0..1 — how far the stick is from its origin. */
  magnitude: number;
  /** Past the run threshold. Direction-only movement, two speeds. */
  running: boolean;
  /** True while a finger or a key is actually down. */
  active: boolean;
}

/** What the controller reads. Damped, never raw. */
export const input: InputVector = { x: 0, z: 0, magnitude: 0, running: false, active: false };

/** What the joystick writes. */
const stick: InputVector = { x: 0, z: 0, magnitude: 0, running: false, active: false };
/** What the keyboard writes. */
const keys = { up: false, down: false, left: false, right: false, shift: false };

/**
 * The joystick calls this on every pointer move. `x` and `z` are already
 * dead-zoned and normalised to the stick radius by `Joystick.tsx`.
 */
export function setStickInput(x: number, z: number, magnitude: number, active: boolean): void {
  stick.x = x;
  stick.z = z;
  stick.magnitude = magnitude;
  stick.running = magnitude >= JOYSTICK.runThreshold;
  stick.active = active;
}

export function clearStickInput(): void {
  setStickInput(0, 0, 0, false);
}

/**
 * Merge and damp. **On release, input damps to zero over ~150 ms** — a hard cut
 * reads as a dropped input, and a visible stick-return animation reads as lag.
 *
 * The damping uses the exponential form, so it behaves identically at 30 fps
 * (our target device) and 60 fps (`01-RULES.md` §3.13).
 */
export function tickInput(dt: number): InputVector {
  let tx = stick.x;
  let tz = stick.z;
  let running = stick.running;
  let active = stick.active;

  if (!active) {
    const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const kz = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (kx !== 0 || kz !== 0) {
      const len = Math.hypot(kx, kz);
      tx = kx / len;
      tz = kz / len;
      running = keys.shift;
      active = true;
    }
  }

  const target = active ? 1 : 0;
  const lambda = 1000 / JOYSTICK.releaseDampMs;
  const k = 1 - Math.exp(-lambda * dt);
  input.x += (tx * target - input.x) * k;
  input.z += (tz * target - input.z) * k;
  input.magnitude = Math.min(1, Math.hypot(input.x, input.z));
  input.running = running && input.magnitude > JOYSTICK.deadZone;
  input.active = active;
  // Below the dead zone the stick is thumb tremor, not intent.
  if (input.magnitude < 0.01) {
    input.x = 0;
    input.z = 0;
    input.magnitude = 0;
  }
  return input;
}

export function resetInput(): void {
  clearStickInput();
  keys.up = keys.down = keys.left = keys.right = keys.shift = false;
  input.x = input.z = input.magnitude = 0;
  input.running = false;
  input.active = false;
}

const KEY_MAP: Record<string, keyof typeof keys> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

/** Desktop keyboard, into the same vector. `E` interacts, `Esc` exits. */
export function useKeyboardInput(opts: { onInteract?: () => void; onExit?: () => void } = {}): void {
  const { onInteract, onExit } = opts;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const mapped = KEY_MAP[e.code];
      if (mapped) {
        keys[mapped] = true;
        e.preventDefault();
        return;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
      else if (e.code === 'KeyE' || e.code === 'Space') onInteract?.();
      else if (e.code === 'Escape') onExit?.();
    };
    const up = (e: KeyboardEvent) => {
      const mapped = KEY_MAP[e.code];
      if (mapped) keys[mapped] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
    };
    // A window that loses focus mid-stride would otherwise walk forever.
    const blur = () => {
      keys.up = keys.down = keys.left = keys.right = keys.shift = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      blur();
    };
  }, [onInteract, onExit]);
}

'use client';

import { create } from 'zustand';

import type { PipCosmetics, PlayerState, VerbId } from '@/lib/world/types';
import type { PipStage } from '@/lib/mundo';

/**
 * Pip's **transform is not React state.**
 *
 * It changes every frame, and pushing it through a store would re-render the
 * tree sixty times a second. It lives here as one plain mutable object, written
 * by `CharacterController` and read by `FollowCamera`, `PipRig` and the
 * proximity scan — exactly one writer, and no subscriber.
 *
 * This is also the rule from `07-RENDER-ARCHITECTURE.md` §7: never put a
 * `THREE.Object3D`, geometry or material in React state or a store. Refs only.
 */
export interface PlayerTransform {
  x: number;
  y: number;
  z: number;
  /** Facing, radians. The controller damps toward the input direction. */
  yaw: number;
  /** Horizontal speed, m/s — the rig reads it for hop frequency and lean. */
  speed: number;
  /** Velocity, so acceleration and friction survive between frames. */
  vx: number;
  vz: number;
  grounded: boolean;
}

export const playerTransform: PlayerTransform = {
  x: 0, y: 0, z: 0, yaw: 0, speed: 0, vx: 0, vz: 0, grounded: true,
};

/** Reset before a fresh mount, so a remount never inherits a stale position. */
export function resetPlayerTransform(x = 0, y = 0, z = 0): void {
  playerTransform.x = x;
  playerTransform.y = y;
  playerTransform.z = z;
  playerTransform.yaw = 0;
  playerTransform.speed = 0;
  playerTransform.vx = 0;
  playerTransform.vz = 0;
  playerTransform.grounded = true;
}

interface PlayerStoreState {
  /** The movement state machine's current state. Low-frequency by design. */
  state: PlayerState;
  /** The verb in progress, if any. */
  verb: VerbId | null;
  cosmetics: PipCosmetics;
  stage: PipStage;
  golden: boolean;
  aura: boolean;
  semillas: number;
  setState: (state: PlayerState) => void;
  setVerb: (verb: VerbId | null) => void;
  /** Optimistic: mutate locally, fire the write, roll back on failure. */
  setCosmetics: (cosmetics: PipCosmetics) => void;
  setAppearance: (a: { stage: PipStage; golden: boolean; aura: boolean }) => void;
  addSemillas: (n: number) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  state: 'idle',
  verb: null,
  cosmetics: {},
  stage: 'seed',
  golden: false,
  aura: false,
  semillas: 0,
  setState: (state) => set({ state }),
  setVerb: (verb) => set({ verb }),
  setCosmetics: (cosmetics) => set({ cosmetics }),
  setAppearance: ({ stage, golden, aura }) => set({ stage, golden, aura }),
  addSemillas: (n) => set((s) => ({ semillas: Math.max(0, s.semillas + n) })),
}));

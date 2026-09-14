'use client';

import { haptic } from '@/lib/utils/haptics';
import type { FxKind } from '@/lib/render/fx';
import { playSfx, type SfxKind } from '../audio/sfx';
import { useSessionStore } from './useSessionStore';

/**
 * The one door for "the world noticed what you did".
 *
 * Motion, sound and haptic together, because one alone reads as a bug
 * (`10-CONTROLS-AND-CAMERA.md` §6): a burst where it happened, a card that says
 * what it was, a hop from Pip, a chime, a tap. Chores, verbs and the first
 * planting all come through here, so they cannot drift into feeling different.
 */
interface FxRequest {
  kind: FxKind;
  x: number;
  y: number;
  z: number;
}

const queue: FxRequest[] = [];
/** A burst queued faster than frames drain is dropped, never piled up. */
const MAX_QUEUED = 24;

/** Throw a burst into the world. Drained by `WorldFx` on the next frame. */
export function emitFx(kind: FxKind, x: number, y: number, z: number): void {
  if (queue.length < MAX_QUEUED) queue.push({ kind, x, y, z });
}

export function drainFx(visit: (request: FxRequest) => void): void {
  while (queue.length > 0) visit(queue.shift()!);
}

export function hasQueuedFx(): boolean {
  return queue.length > 0;
}

export interface Celebration {
  /** Copy key under `mundo` for the card's headline. */
  titleKey: string;
  /** Copy key under `mundo` for the thing, shown under the headline. */
  thingKey?: string | null;
  /** Or the thing's name as data — a species from the catalogue. Wins over `thingKey`. */
  thingText?: string;
  /** Shown as a pill when the action pays. The server still owns the balance. */
  semillas?: number;
  fx: FxKind;
  at: readonly [number, number, number];
  sound?: SfxKind;
}

export function celebrate(c: Celebration): void {
  emitFx(c.fx, c.at[0], c.at[1] + 0.25, c.at[2]);
  emitFx('sparkle', c.at[0], c.at[1] + 0.5, c.at[2]);
  const store = useSessionStore.getState();
  store.showReward({ titleKey: c.titleKey, thingKey: c.thingKey ?? null, thingText: c.thingText, semillas: c.semillas ?? 0 });
  store.bumpCelebrate();
  playSfx(c.sound ?? 'reward');
  haptic('success');
}

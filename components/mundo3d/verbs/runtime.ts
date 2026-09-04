'use client';

import { VERB_TIMING } from '@/lib/world/config';
import { VERB_TABLE } from '@/lib/world/verbs';
import type { VerbId } from '@/lib/world/types';

/**
 * The runtime for the verbs that are **an action rather than a way of moving**:
 * plantar, regar, registrar, recolectar, pescar, descansar, observar, explorar
 * la cueva, rastrear, sembrar en otro mundo.
 *
 * Each is a small state machine with real timing, because
 * `10-CONTROLS-AND-CAMERA.md` §3 is explicit that a verb which is only an
 * animation is not implemented. Planting holds for 800 ms. The census reticle
 * converges over 600 ms. Fishing casts, waits three to ten seconds, tugs, and
 * gives you a 900 ms window — miss it and the fish is gone, which is a real
 * outcome and not a punishment.
 *
 * Every completion fires **three things together** — a sound, a motion and a
 * haptic — because one alone reads as a bug (`10` §6).
 */
export type VerbPhase =
  | 'idle'
  /** Holding: `progress` runs 0 → 1 and releasing early cancels. */
  | 'holding'
  /** Waiting for the world: the fishing line is out. */
  | 'waiting'
  /** The window is open and the player has to act. */
  | 'window'
  /** Playing out the result. */
  | 'resolving';

export interface VerbActivity {
  verb: VerbId;
  phase: VerbPhase;
  /** 0..1 through the current phase. */
  progress: number;
  /** Seconds left in a timed phase. */
  remainingS: number;
  /** Set once, when the verb completes successfully. */
  completed: boolean;
  /** The interactable this activity belongs to, so a walk-away cancels it. */
  targetId: string | null;
}

export interface VerbResult {
  verb: VerbId;
  targetId: string | null;
  /** `false` when the player let go early or missed the window. */
  success: boolean;
}

/** How long each hold-to-act verb takes, in milliseconds. */
const HOLD_MS: Partial<Record<VerbId, number>> = {
  plant: VERB_TIMING.plantHoldMs,
  log: VERB_TIMING.logHoldMs,
  forage: VERB_TIMING.forageSquashMs,
  water: VERB_TIMING.forageSquashMs,
  mentor: VERB_TIMING.plantHoldMs,
  cave: VERB_TIMING.forageSquashMs,
  track: VERB_TIMING.logHoldMs,
  observe: VERB_TIMING.logHoldMs,
};

/** Deterministic-enough jitter for the fishing wait, without the world PRNG. */
function waitSeconds(seed: number): number {
  const t = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return VERB_TIMING.fishWaitMinS + t * (VERB_TIMING.fishWaitMaxS - VERB_TIMING.fishWaitMinS);
}

export class VerbRuntime {
  private activity: VerbActivity | null = null;
  private onFinish: (result: VerbResult) => void;
  private casts = 0;

  constructor(onFinish: (result: VerbResult) => void) {
    this.onFinish = onFinish;
  }

  get current(): VerbActivity | null {
    return this.activity;
  }

  /** Is a verb currently holding the character still? */
  get busy(): boolean {
    return this.activity !== null && this.activity.phase !== 'idle';
  }

  /**
   * Begin a verb. `rest` and `sail` are handled by the controller instead —
   * they change how movement works rather than pausing it.
   */
  begin(verb: VerbId, targetId: string | null): void {
    if (this.activity) return;
    if (verb === 'fish') {
      this.casts += 1;
      this.activity = {
        verb, targetId, phase: 'waiting', progress: 0,
        remainingS: waitSeconds(this.casts), completed: false,
      };
      return;
    }
    const hold = HOLD_MS[verb];
    if (hold === undefined) {
      // A verb with no hold resolves at once — `swim`, `climb`, `glide` never
      // reach here, so this is the trivial-interaction path.
      this.finish(verb, targetId, true);
      return;
    }
    this.activity = {
      verb, targetId, phase: 'holding', progress: 0, remainingS: hold / 1000, completed: false,
    };
  }

  /**
   * The player let go, or tapped during a window. For a hold this cancels;
   * during the fishing window it is the catch.
   */
  release(): void {
    const a = this.activity;
    if (!a) return;
    if (a.phase === 'window') {
      this.finish(a.verb, a.targetId, true);
      return;
    }
    if (a.phase === 'holding' && a.progress < 1) {
      // Letting go early is a cancel, not a failure. Nothing is lost.
      this.finish(a.verb, a.targetId, false);
      return;
    }
    if (a.phase === 'waiting') {
      // Reeling in before the tug: also just a cancel.
      this.finish(a.verb, a.targetId, false);
    }
  }

  /** Walking away from the target cancels whatever is in progress. */
  cancelIfTargetLost(activeTargetId: string | null): void {
    const a = this.activity;
    if (!a || a.targetId === null) return;
    if (a.targetId !== activeTargetId) this.finish(a.verb, a.targetId, false);
  }

  /** One step. Returns the pose key the rig should be in, or `null`. */
  update(dt: number): string | null {
    const a = this.activity;
    if (!a) return null;

    switch (a.phase) {
      case 'holding': {
        const hold = (HOLD_MS[a.verb] ?? VERB_TIMING.plantHoldMs) / 1000;
        a.remainingS -= dt;
        a.progress = Math.min(1, 1 - a.remainingS / hold);
        if (a.remainingS <= 0) this.finish(a.verb, a.targetId, true);
        break;
      }
      case 'waiting': {
        a.remainingS -= dt;
        if (a.remainingS <= 0) {
          // The tug. From here the player has 900 ms, and that is the whole game
          // of fishing.
          a.phase = 'window';
          a.remainingS = VERB_TIMING.fishTugWindowMs / 1000;
          a.progress = 0;
        }
        break;
      }
      case 'window': {
        a.remainingS -= dt;
        a.progress = 1 - a.remainingS / (VERB_TIMING.fishTugWindowMs / 1000);
        if (a.remainingS <= 0) this.finish(a.verb, a.targetId, false);
        break;
      }
      default:
        break;
    }
    return this.activity ? VERB_TABLE[this.activity.verb].poseKey : null;
  }

  private finish(verb: VerbId, targetId: string | null, success: boolean): void {
    this.activity = null;
    this.onFinish({ verb, targetId, success });
  }

  reset(): void {
    this.activity = null;
  }
}

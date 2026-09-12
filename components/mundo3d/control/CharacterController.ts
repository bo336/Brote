'use client';

import { MOVE } from '@/lib/world/config';
import type { IslandLayout } from '@/lib/world/layout';
import { MovementSolver, type MoveCollider, type StepInput } from '@/lib/world/movement';
import type { Heightfield } from '@/lib/world/terrain';
import type { TraversalMode } from '@/lib/world/traversal';
import { canTransition } from '@/lib/world/verbs';
import type { PlayerState, VerbId, WorldConfig } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';
import { consumeJump, tickInput } from './useInput';

/**
 * The seam between the input, the movement simulation and the store.
 *
 * Everything that decides where Pip goes lives in `lib/world/movement.ts`, pure
 * and tested on whole islands. This class reads the input, hands it to the
 * solver with the camera's yaw, and turns the result into the state machine the
 * rest of the game listens to.
 *
 * One product rule survives the move intact: **Pip never drowns, never falls
 * to their death, never gets hurt, and is never stuck.**
 */
export type PropCollider = MoveCollider;

export interface ControllerOptions {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  colliders?: PropCollider[];
}

/** What happened this step that deserves a squash, a puff of dust or a sound. */
export interface MoveEvents {
  jumped: boolean;
  landed: boolean;
  restored: boolean;
}

export class CharacterController {
  private solver: MovementSolver;
  private state: PlayerState = 'idle';
  private input: StepInput = { x: 0, z: 0, magnitude: 0, running: false, jump: false };
  readonly events: MoveEvents = { jumped: false, landed: false, restored: false };

  constructor(opts: ControllerOptions) {
    this.solver = new MovementSolver(opts.heightfield, opts.layout, opts.config.verbs);
    this.solver.colliders = opts.colliders ?? [];
  }

  setColliders(colliders: PropCollider[]): void {
    this.solver.colliders = colliders;
  }

  /** A verb, a sheet or a ceremony takes control. Movement damps out, not stops. */
  setLocked(locked: boolean): void {
    this.solver.locked = locked;
  }

  getState(): PlayerState {
    return this.state;
  }

  getMode(): TraversalMode {
    return this.solver.mode;
  }

  /** The verb the player just needed and does not have, if any. */
  takeBlocked(): VerbId | null {
    const b = this.solver.blocked;
    this.solver.blocked = null;
    return b;
  }

  boardBoat(): void {
    this.solver.boardBoat(playerTransform);
  }

  leaveBoat(): void {
    this.solver.leaveBoat();
  }

  /** One step. `cameraYaw` makes W mean "away from the lens" wherever it looks. */
  update(dt: number, cameraYaw: number): PlayerState {
    const inp = tickInput(dt);
    const i = this.input;
    i.x = inp.x;
    i.z = inp.z;
    i.magnitude = inp.magnitude;
    i.running = inp.running;
    i.jump = consumeJump();

    const p = playerTransform;
    const r = this.solver.step(p, i, cameraYaw, dt);
    this.events.jumped = r.jumped;
    this.events.landed = r.landed;
    this.events.restored = r.restored;

    let next: PlayerState;
    switch (r.mode) {
      case 'swim': next = 'swim'; break;
      case 'climb': next = 'climb'; break;
      case 'glide': next = 'glide'; break;
      case 'boat': next = 'walk'; break;
      default:
        next = this.solver.locked
          ? 'interact'
          : p.speed < 0.08
            ? 'idle'
            : inp.running && p.speed > MOVE.walkSpeed * 0.9 ? 'run' : 'walk';
    }
    // An edge the table does not declare goes through idle rather than sticking.
    if (next !== this.state) {
      if (canTransition(this.state, next)) this.state = next;
      else if (canTransition(this.state, 'idle')) this.state = 'idle';
    }
    return this.state;
  }
}

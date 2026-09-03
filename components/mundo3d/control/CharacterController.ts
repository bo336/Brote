'use client';

import { MOVE, VERB_MOTION, WATER_LEVEL } from '@/lib/world/config';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import { sampleHeight, sampleNormal, type Heightfield } from '@/lib/world/terrain';
import { canTransition } from '@/lib/world/verbs';
import type { PlayerState, VerbId, WorldConfig } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';
import { tickInput } from './useInput';

/**
 * Kinematic movement. **No physics engine** (`18-DECISIONS.md` T3).
 *
 * Walking on a heightfield needs a height lookup, a capsule-vs-sphere check
 * against a short list of props, and a slope limit. That is this file. Rapier
 * unpacks to ~10 MB of WASM for none of it.
 *
 * Two rules govern every line here:
 *
 *  - **Frame-rate independence is mandatory.** Every damping term is
 *    `1 - Math.exp(-lambda * dt)`. A raw `lerp(a, b, 0.1)` behaves differently
 *    at 30 fps (our target device) and 60 fps, and it is the classic shipped
 *    defect (`01-RULES.md` §3.13).
 *  - **No allocation in the per-frame path.** Everything below is arithmetic on
 *    numbers; there is not a single `new Vector3` in `update()`.
 */
export interface PropCollider {
  x: number;
  z: number;
  radius: number;
}

export interface ControllerOptions {
  heightfield: Heightfield;
  layout: IslandLayout;
  config: WorldConfig;
  colliders?: PropCollider[];
}

const SLOPE_LIMIT_COS = Math.cos((MOVE.slopeLimitDeg * Math.PI) / 180);
const SLOPE_WALL_COS = Math.cos((MOVE.slopeWallDeg * Math.PI) / 180);
/** Pip's own radius on the ground, for prop collision. */
const BODY_RADIUS = 0.2;
/** How deep the water has to be before it reads as swimmable rather than a puddle. */
const SWIM_DEPTH = 0.35;

export class CharacterController {
  private hf: Heightfield;
  private layout: IslandLayout;
  private config: WorldConfig;
  private colliders: PropCollider[];
  private state: PlayerState = 'idle';
  /** Set by the verb layer; movement yields while a verb owns Pip. */
  private locked = false;

  constructor(opts: ControllerOptions) {
    this.hf = opts.heightfield;
    this.layout = opts.layout;
    this.config = opts.config;
    this.colliders = opts.colliders ?? [];
  }

  setColliders(colliders: PropCollider[]): void {
    this.colliders = colliders;
  }

  /** A verb, a sheet or a ceremony takes control. Movement damps out, not stops. */
  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  getState(): PlayerState {
    return this.state;
  }

  private transition(next: PlayerState): void {
    if (this.state === next) return;
    // Illegal transitions are impossible rather than merely unlikely.
    if (!canTransition(this.state, next)) return;
    this.state = next;
  }

  /**
   * One step. `cameraYaw` rotates the screen-relative input into the world, so
   * "up" always means "away from the camera" no matter where it is looking.
   */
  update(dt: number, cameraYaw: number): PlayerState {
    const p = playerTransform;
    const inp = tickInput(dt);

    // 1. Input → a desired world direction, rotated by the camera's yaw.
    let desiredX = 0;
    let desiredZ = 0;
    const magnitude = this.locked ? 0 : inp.magnitude;
    if (magnitude > 0) {
      const cos = Math.cos(cameraYaw);
      const sin = Math.sin(cameraYaw);
      // Screen-down (+z of the stick) is away from the camera.
      const fx = inp.x;
      const fz = inp.z;
      desiredX = fx * cos - fz * sin;
      desiredZ = fx * sin + fz * cos;
      const len = Math.hypot(desiredX, desiredZ) || 1;
      desiredX /= len;
      desiredZ /= len;
    }

    const swimming = this.state === 'swim';
    const topSpeed = swimming
      ? VERB_MOTION.swimSpeed
      : inp.running
        ? MOVE.runSpeed
        : MOVE.walkSpeed;

    // 2. Accelerate toward the target velocity; fall back to friction when idle.
    const targetVX = desiredX * topSpeed * magnitude;
    const targetVZ = desiredZ * topSpeed * magnitude;
    const lambda = magnitude > 0 ? MOVE.accel / Math.max(0.001, topSpeed) : MOVE.friction;
    const k = 1 - Math.exp(-lambda * dt);
    p.vx += (targetVX - p.vx) * k;
    p.vz += (targetVZ - p.vz) * k;

    let nextX = p.x + p.vx * dt;
    let nextZ = p.z + p.vz * dt;

    // 3. Slope. Sample where we are trying to go and refuse to climb what we
    //    cannot — but zero only the up-slope component, so Pip slides along a
    //    hillside instead of sticking to it.
    const normal = sampleNormal(this.hf, nextX, nextZ);
    const up = normal[1];
    if (up < SLOPE_WALL_COS && !this.canScale()) {
      nextX = p.x;
      nextZ = p.z;
      p.vx *= 0.2;
      p.vz *= 0.2;
    } else if (up < SLOPE_LIMIT_COS) {
      const here = sampleHeight(this.hf, p.x, p.z);
      const there = sampleHeight(this.hf, nextX, nextZ);
      if (there > here) {
        // Project the motion onto the contour: keep the across-slope part.
        const gx = normal[0];
        const gz = normal[2];
        const glen = Math.hypot(gx, gz) || 1;
        const ux = gx / glen;
        const uz = gz / glen;
        const along = p.vx * -uz + p.vz * ux;
        p.vx = -uz * along;
        p.vz = ux * along;
        nextX = p.x + p.vx * dt;
        nextZ = p.z + p.vz * dt;
      }
    }

    // 4. Props: a squared-distance loop over a short list. Typically under 40
    //    in range, so this is free; resolve by pushing straight out.
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i]!;
      const dx = nextX - c.x;
      const dz = nextZ - c.z;
      const minDist = c.radius + BODY_RADIUS;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        nextX = c.x + (dx / dist) * minDist;
        nextZ = c.z + (dz / dist) * minDist;
      }
    }

    // 5. The coastline: **a soft radial push-back, not a wall** (`10` §2.7).
    const angle = Math.atan2(nextZ, nextX);
    const rim = coastRadiusAt(this.layout.coastline, angle) - MOVE.coastMarginM;
    const radius = Math.hypot(nextX, nextZ);
    if (radius > rim) {
      const push = Math.min(1, (radius - rim) / MOVE.coastMarginM);
      const inward = MOVE.coastPushback * push * dt;
      nextX -= (nextX / radius) * inward;
      nextZ -= (nextZ / radius) * inward;
      p.vx *= 1 - push * 0.5;
      p.vz *= 1 - push * 0.5;
    }

    p.x = nextX;
    p.z = nextZ;

    // 6. Ground height, sampled from the baked field — not a raycast, and never
    //    `terrainHeight()` per frame (`02-AUDIT.md` §6.3).
    const ground = sampleHeight(this.hf, p.x, p.z);
    const depth = WATER_LEVEL - ground;
    const inWater = depth > SWIM_DEPTH;
    if (inWater && this.canSwim()) {
      p.y = WATER_LEVEL - 0.12;
      p.grounded = false;
      this.transition('swim');
    } else if (inWater) {
      // The soft barrier before tier 7: Pip stops at the shore with a hint,
      // never an invisible wall, and **never drowns** (`16-UI-AUDIO-A11Y` §3).
      const shoreX = p.x - p.vx * dt * 2;
      const shoreZ = p.z - p.vz * dt * 2;
      p.x = shoreX;
      p.z = shoreZ;
      p.y = Math.max(WATER_LEVEL, sampleHeight(this.hf, shoreX, shoreZ));
      p.vx *= 0.3;
      p.vz *= 0.3;
      p.grounded = true;
      this.transition('idle');
    } else {
      p.y = ground;
      p.grounded = true;
    }

    // 7. Facing. Damped toward the direction of travel — never snapped.
    p.speed = Math.hypot(p.vx, p.vz);
    if (p.speed > 0.05) {
      const targetYaw = Math.atan2(p.vx, p.vz);
      let delta = targetYaw - p.yaw;
      // Take the short way round, so turning past ±π does not spin the long way.
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      p.yaw += delta * (1 - Math.exp(-MOVE.turnLambda * dt));
    }

    // 8. The state machine.
    if (!inWater || !this.canSwim()) {
      if (this.locked) this.transition('interact');
      else if (p.speed < 0.08) this.transition('idle');
      else if (inp.running && p.speed > MOVE.walkSpeed * 0.9) this.transition('run');
      else this.transition('walk');
    }
    return this.state;
  }

  private canSwim(): boolean {
    return this.config.verbs.includes('swim' as VerbId);
  }

  private canScale(): boolean {
    return this.config.verbs.includes('scale' as VerbId);
  }
}

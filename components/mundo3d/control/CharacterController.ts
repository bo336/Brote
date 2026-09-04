'use client';

import { MOVE, VERB_MOTION, WATER_LEVEL } from '@/lib/world/config';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import { sampleHeight, sampleNormal, type Heightfield } from '@/lib/world/terrain';
import { canTransition } from '@/lib/world/verbs';
import type { PlayerState, VerbId, WorldConfig } from '@/lib/world/types';
import {
  canGlide, isClimbable, isShallowShore, mantleTarget, stepBoat, stepGlide,
  waterDepth, wallNormal, SWIM_DEPTH_M,
  type BoatState, type GlideState, type TraversalMode, type TraversalProbe,
} from '../verbs/traversal';
import { playerTransform } from '../state/usePlayerStore';
import { tickInput } from './useInput';

/**
 * Kinematic movement, and the five verbs that take it over.
 *
 * **No physics engine** (`18-DECISIONS.md` T3): walking on a heightfield needs a
 * height lookup, a capsule-vs-sphere check and a slope limit. Rapier unpacks to
 * ~10 MB of WASM for none of it.
 *
 * Two rules govern every line:
 *  - **Frame-rate independence.** Every damping term is `1 - exp(-lambda * dt)`.
 *  - **No allocation in the per-frame path.** There is not one `new Vector3` in
 *    `update()`.
 *
 * And one product rule: **Pip never drowns, never falls, never gets hurt.** Deep
 * water before tier 7 is a soft stop at the shore, not a death; a glide always
 * ends on the ground; a climb you let go of drops you a metre.
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
/** How far Pip floats below the surface while swimming. */
const SWIM_SUBMERSION = 0.12;

export class CharacterController {
  private probe: TraversalProbe;
  private config: WorldConfig;
  private colliders: PropCollider[];
  private state: PlayerState = 'idle';
  private mode: TraversalMode = 'ground';
  private locked = false;
  private glide: GlideState = { vy: 0 };
  private boat: BoatState = { heading: 0, speed: 0 };
  /** How high Pip is on the wall while scaling, above the wall's foot. */
  private climbY = 0;
  /**
   * What just stopped Pip, if anything. A soft barrier owes the player a
   * sentence — "Todavía no sabés nadar" — rather than an invisible wall
   * (`14-CONTENT.md` §7 `mundo.locked.*`).
   */
  private blocked: VerbId | null = null;

  constructor(opts: ControllerOptions) {
    this.probe = { heightfield: opts.heightfield, layout: opts.layout };
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

  getMode(): TraversalMode {
    return this.mode;
  }

  /** The verb the player just needed and does not have, if any. */
  takeBlocked(): VerbId | null {
    const b = this.blocked;
    this.blocked = null;
    return b;
  }

  private has(verb: VerbId): boolean {
    return this.config.verbs.includes(verb);
  }

  private transition(next: PlayerState): void {
    if (this.state === next) return;
    // Illegal transitions are impossible rather than merely unlikely.
    if (!canTransition(this.state, next)) return;
    this.state = next;
  }

  /** Board the boat. Called by the `sail` verb, not by movement. */
  boardBoat(): void {
    if (!this.has('sail')) return;
    this.mode = 'boat';
    this.boat.heading = playerTransform.yaw;
    this.boat.speed = 0;
  }

  /** Step off the boat onto the nearest shore. Always possible. */
  leaveBoat(): void {
    if (this.mode !== 'boat') return;
    this.mode = 'ground';
    this.boat.speed = 0;
  }

  /**
   * One step. `cameraYaw` rotates the screen-relative input into the world, so
   * "up" always means "away from the camera" wherever it is looking.
   */
  update(dt: number, cameraYaw: number): PlayerState {
    const p = playerTransform;
    const inp = tickInput(dt);
    const magnitude = this.locked ? 0 : inp.magnitude;

    // Input → a desired world direction, rotated by the camera's yaw.
    let dirX = 0;
    let dirZ = 0;
    if (magnitude > 0) {
      const cos = Math.cos(cameraYaw);
      const sin = Math.sin(cameraYaw);
      dirX = inp.x * cos - inp.z * sin;
      dirZ = inp.x * sin + inp.z * cos;
      const len = Math.hypot(dirX, dirZ) || 1;
      dirX /= len;
      dirZ /= len;
    }

    switch (this.mode) {
      case 'boat':
        stepBoat(this.probe, this.boat, p, -inp.x, Math.max(0, -inp.z), dt);
        p.yaw = this.boat.heading;
        p.speed = this.boat.speed;
        this.transition('walk');
        return this.state;
      case 'glide':
        this.stepGliding(p, dirX, dirZ, dt);
        return this.state;
      case 'climb':
        this.stepClimbing(p, inp.z, magnitude, dt);
        return this.state;
      default:
        break;
    }

    return this.stepGrounded(p, dirX, dirZ, magnitude, inp.running, dt);
  }

  // ── Gliding ───────────────────────────────────────────────────────────────

  private stepGliding(p: typeof playerTransform, dirX: number, dirZ: number, dt: number): void {
    const landed = stepGlide(this.probe, this.glide, p, dirX, dirZ, dt);
    p.vx = dirX * VERB_MOTION.glideHorizontalSpeed;
    p.vz = dirZ * VERB_MOTION.glideHorizontalSpeed;
    p.speed = Math.hypot(p.vx, p.vz);
    if (p.speed > 0.05) p.yaw = Math.atan2(p.vx, p.vz);
    if (landed) {
      this.mode = 'ground';
      this.transition('idle');
    } else {
      this.transition('glide');
    }
  }

  // ── Scaling a wall ────────────────────────────────────────────────────────

  private stepClimbing(p: typeof playerTransform, forward: number, magnitude: number, dt: number): void {
    // Pushing up the stick climbs; pulling back lets go and drops to the ground.
    const climb = -forward * magnitude;
    this.climbY += climb * VERB_MOTION.climbSpeed * dt;
    const foot = sampleHeight(this.probe.heightfield, p.x, p.z);
    p.y = foot + Math.max(0, this.climbY);
    p.speed = Math.abs(climb) * VERB_MOTION.climbSpeed;

    // Small alternating side-shuffle, so a climb is not a straight elevator.
    const [nx, nz] = wallNormal(this.probe, p.x, p.z);
    p.yaw = Math.atan2(-nx, -nz);

    if (climb < -0.2 || this.climbY <= 0) {
      this.climbY = 0;
      this.mode = 'ground';
      this.transition('idle');
      return;
    }
    // Topping out: once the ground beside the wall is level with Pip, step off.
    const ahead = sampleHeight(this.probe.heightfield, p.x - nx * 0.6, p.z - nz * 0.6);
    if (ahead >= p.y - 0.1) {
      p.x -= nx * 0.6;
      p.z -= nz * 0.6;
      p.y = ahead;
      this.climbY = 0;
      this.mode = 'ground';
      this.transition('idle');
      return;
    }
    this.transition('climb');
  }

  // ── On the ground, in the water, or about to leave both ───────────────────

  private stepGrounded(
    p: typeof playerTransform,
    dirX: number,
    dirZ: number,
    magnitude: number,
    running: boolean,
    dt: number,
  ): PlayerState {
    const swimming = this.mode === 'swim';
    const topSpeed = swimming ? VERB_MOTION.swimSpeed : running ? MOVE.runSpeed : MOVE.walkSpeed;

    // Accelerate toward the target velocity; fall back to friction when idle.
    const targetVX = dirX * topSpeed * magnitude;
    const targetVZ = dirZ * topSpeed * magnitude;
    const lambda = magnitude > 0 ? MOVE.accel / Math.max(0.001, topSpeed) : MOVE.friction;
    const k = 1 - Math.exp(-lambda * dt);
    p.vx += (targetVX - p.vx) * k;
    p.vz += (targetVZ - p.vz) * k;

    let nextX = p.x + p.vx * dt;
    let nextZ = p.z + p.vz * dt;

    // Slope. Refuse what cannot be climbed, but zero only the up-slope part so
    // Pip slides along a hillside instead of sticking to it.
    const normal = sampleNormal(this.probe.heightfield, nextX, nextZ);
    if (normal[1] < SLOPE_WALL_COS && !swimming) {
      if (this.has('scale') && magnitude > 0.4 && isClimbable(this.probe, nextX, nextZ)) {
        // **Escalar**: press into a marked face and movement rotates onto it.
        this.mode = 'climb';
        this.climbY = 0.05;
        this.transition('climb');
        return this.state;
      }
      if (isClimbable(this.probe, nextX, nextZ)) this.blocked = 'scale';
      nextX = p.x;
      nextZ = p.z;
      p.vx *= 0.2;
      p.vz *= 0.2;
    } else if (normal[1] < SLOPE_LIMIT_COS && !swimming) {
      const here = sampleHeight(this.probe.heightfield, p.x, p.z);
      if (sampleHeight(this.probe.heightfield, nextX, nextZ) > here) {
        const glen = Math.hypot(normal[0], normal[2]) || 1;
        const ux = normal[0] / glen;
        const uz = normal[2] / glen;
        const along = p.vx * -uz + p.vz * ux;
        p.vx = -uz * along;
        p.vz = ux * along;
        nextX = p.x + p.vx * dt;
        nextZ = p.z + p.vz * dt;
      }
    }

    // Props: a squared-distance loop over a short list, resolved by projection.
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

    // The coastline: **a soft radial push-back, not a wall** (`10` §2.7).
    const angle = Math.atan2(nextZ, nextX);
    const rim = coastRadiusAt(this.probe.layout.coastline, angle) - MOVE.coastMarginM;
    const radius = Math.hypot(nextX, nextZ);
    const onIslet = this.nearIslet(nextX, nextZ);
    if (radius > rim && !swimming && !onIslet) {
      const push = Math.min(1, (radius - rim) / MOVE.coastMarginM);
      const inward = MOVE.coastPushback * push * dt;
      nextX -= (nextX / radius) * inward;
      nextZ -= (nextZ / radius) * inward;
      p.vx *= 1 - push * 0.5;
      p.vz *= 1 - push * 0.5;
    }

    p.x = nextX;
    p.z = nextZ;

    // **Trepar**: a low ledge in front auto-mantles on contact when moving.
    if (!swimming && this.has('climb') && magnitude > 0.3) {
      const top = mantleTarget(this.probe, p.x, p.z, p.yaw, p.y);
      if (top !== null) {
        p.x += Math.sin(p.yaw) * 0.45;
        p.z += Math.cos(p.yaw) * 0.45;
        p.y = top;
      }
    }

    // Water, and the two very different things it means.
    const depth = waterDepth(this.probe, p.x, p.z);
    if (depth > SWIM_DEPTH_M && this.has('swim')) {
      p.y = WATER_LEVEL - SWIM_SUBMERSION;
      p.grounded = false;
      this.mode = 'swim';
      this.transition('swim');
    } else if (depth > SWIM_DEPTH_M) {
      // The soft barrier before tier 7. Pip stops at the shore with a hint —
      // never an invisible wall, and never a drowning.
      this.blocked = 'swim';
      p.x -= p.vx * dt * 2;
      p.z -= p.vz * dt * 2;
      p.y = Math.max(WATER_LEVEL, sampleHeight(this.probe.heightfield, p.x, p.z));
      p.vx *= 0.3;
      p.vz *= 0.3;
      p.grounded = true;
      this.mode = 'ground';
      this.transition('idle');
    } else {
      if (swimming && isShallowShore(this.probe, p.x, p.z)) this.mode = 'ground';
      p.y = sampleHeight(this.probe.heightfield, p.x, p.z);
      p.grounded = true;
      if (this.mode === 'swim') this.mode = 'ground';
    }

    // **Planear**: stepping off a real drop opens the glide, if it is unlocked.
    if (this.has('glide') && this.mode === 'ground' && magnitude > 0.3) {
      const ahead = sampleHeight(
        this.probe.heightfield,
        p.x + Math.sin(p.yaw) * 0.8,
        p.z + Math.cos(p.yaw) * 0.8,
      );
      if (p.y - ahead >= VERB_MOTION.glideMinLedgeM && canGlide(this.probe, p.x, p.z, p.y)) {
        this.mode = 'glide';
        this.glide.vy = 0;
        this.transition('glide');
        return this.state;
      }
    }

    // Facing, damped toward the direction of travel — never snapped.
    p.speed = Math.hypot(p.vx, p.vz);
    if (p.speed > 0.05) {
      const targetYaw = Math.atan2(p.vx, p.vz);
      let delta = targetYaw - p.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      p.yaw += delta * (1 - Math.exp(-MOVE.turnLambda * dt));
    }

    if (this.mode === 'swim') {
      this.transition('swim');
    } else if (this.locked) {
      this.transition('interact');
    } else if (p.speed < 0.08) {
      this.transition('idle');
    } else if (running && p.speed > MOVE.walkSpeed * 0.9) {
      this.transition('run');
    } else {
      this.transition('walk');
    }
    return this.state;
  }

  /** El Islote has its own shore, and the main coastline must not push you off it. */
  private nearIslet(x: number, z: number): boolean {
    const islet = this.probe.layout.terrain.islet;
    return islet !== null && Math.hypot(x - islet.x, z - islet.z) < islet.r * 1.2;
  }
}

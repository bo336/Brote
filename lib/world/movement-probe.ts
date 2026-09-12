/**
 * What the ground and the props allow — the questions the movement solver asks.
 *
 * Split from `movement.ts` for the 400-line rule, along a real seam: everything
 * here answers "may a body be here / go there", and allocates nothing but the
 * normal `sampleNormal` returns; everything in the solver decides what the body
 * does about it.
 */
import { MOVE, WATER_LEVEL } from './config';
import type { IslandLayout } from './layout';
import { sampleHeight, sampleNormal, type Heightfield } from './terrain';
import { SWIM_DEPTH_M, type TraversalMode, type TraversalProbe } from './traversal';
import type { VerbId } from './types';

export interface Body {
  x: number; y: number; z: number;
  yaw: number; speed: number;
  vx: number; vz: number; vy: number;
  grounded: boolean; airborne: boolean;
}

export interface MoveCollider { x: number; z: number; radius: number; cameraRadius?: number }

export const BODY_RADIUS = 0.2;
export const SLOPE_LIMIT_COS = Math.cos((MOVE.slopeLimitDeg * Math.PI) / 180);
export const SLOPE_WALL_COS = Math.cos((MOVE.slopeWallDeg * Math.PI) / 180);
/** Overlap a push-out may leave behind before it counts as inside. */
export const COLLIDER_SLACK = 0.01;
export const OCTANTS = 8;
const PROBE_X = Float64Array.from({ length: OCTANTS }, (_, i) => Math.cos((i / OCTANTS) * Math.PI * 2));
const PROBE_Z = Float64Array.from({ length: OCTANTS }, (_, i) => Math.sin((i / OCTANTS) * Math.PI * 2));
/** Rings and angles the recovery searches for free ground, when the saved spot is not. */
const FREE_RINGS = 10;
const FREE_ANGLES = 12;
const FREE_STEP_M = 0.3;

export type Block = 0 | 1 | 2;
export const OPEN: Block = 0;
export const WALL: Block = 1;
export const DEEP: Block = 2;

export class GroundQueries {
  readonly probe: TraversalProbe;
  colliders: readonly MoveCollider[] = [];
  mode: TraversalMode = 'ground';
  protected verbs: readonly VerbId[];

  constructor(heightfield: Heightfield, layout: IslandLayout, verbs: readonly VerbId[]) {
    this.probe = { heightfield, layout };
    this.verbs = verbs;
  }

  has(verb: VerbId): boolean { return this.verbs.includes(verb); }

  /**
   * May a body at `(fx, fz)` step to `(x, z)`? **Downhill is always allowed**:
   * refusing steep ground in both directions is what left Pip standing on a
   * slope with every way off it refused.
   */
  protected blockAt(fx: number, fz: number, x: number, z: number, y: number, airborne: boolean): Block {
    const hf = this.probe.heightfield;
    const ground = sampleHeight(hf, x, z);
    if (this.mode !== 'swim' && !this.has('swim')) {
      const depth = WATER_LEVEL - ground;
      // Wading back toward the shore is always allowed, however you got in.
      if (depth > SWIM_DEPTH_M && depth >= WATER_LEVEL - sampleHeight(hf, fx, fz) - 1e-4) return DEEP;
    }
    if (airborne) return ground > y + MOVE.airWallM ? WALL : OPEN;
    if (ground <= sampleHeight(hf, fx, fz)) return OPEN;
    return sampleNormal(hf, x, z)[1] < SLOPE_WALL_COS ? WALL : OPEN;
  }

  protected insideCollider(x: number, z: number, slack: number): boolean {
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i]!;
      const r = c.radius + BODY_RADIUS - slack;
      if ((x - c.x) * (x - c.x) + (z - c.z) * (z - c.z) < r * r) return true;
    }
    return false;
  }

  /** Somewhere Pip could stand and be fine: dry enough, flat enough, clear of props. */
  protected standable(x: number, z: number): boolean {
    const hf = this.probe.heightfield;
    if (!this.has('swim') && WATER_LEVEL - sampleHeight(hf, x, z) > SWIM_DEPTH_M) return false;
    if (sampleNormal(hf, x, z)[1] < SLOPE_WALL_COS) return false;
    return !this.insideCollider(x, z, COLLIDER_SLACK * 2);
  }

  /** Is every way out refused? Eight short probes, each checked against ground and props. */
  protected enclosed(body: Body): boolean {
    for (let i = 0; i < OCTANTS; i++) {
      const px = body.x + PROBE_X[i]! * MOVE.trapProbeM;
      const pz = body.z + PROBE_Z[i]! * MOVE.trapProbeM;
      if (this.blockAt(body.x, body.z, px, pz, body.y, false) === OPEN && !this.insideCollider(px, pz, 0)) {
        return false;
      }
    }
    return true;
  }

  /** Spiral out from a spot to the nearest ground Pip can stand on. Rare; allocates nothing. */
  protected findFree(spot: { x: number; z: number }): void {
    for (let ring = 1; ring <= FREE_RINGS; ring++) {
      for (let k = 0; k < FREE_ANGLES; k++) {
        const a = (k / FREE_ANGLES) * Math.PI * 2 + ring;
        const x = spot.x + Math.cos(a) * ring * FREE_STEP_M;
        const z = spot.z + Math.sin(a) * ring * FREE_STEP_M;
        if (this.standable(x, z)) { spot.x = x; spot.z = z; return; }
      }
    }
  }

  protected nearIslet(x: number, z: number): boolean {
    const islet = this.probe.layout.terrain.islet;
    return islet !== null && Math.hypot(x - islet.x, z - islet.z) < islet.r * 1.2;
  }
}

export interface StepInput {
  /** Screen-relative, -1..1: `x` right, `z` down the screen (so W is `z = -1`). */
  x: number; z: number;
  magnitude: number;
  running: boolean;
  /** Jump was pressed since the last step. */
  jump: boolean;
}

export interface StepResult { mode: TraversalMode; jumped: boolean; landed: boolean; restored: boolean }

/**
 * Screen input into a world direction, **away from the camera for W**.
 *
 * The camera sits behind Pip along `-(sin yaw, cos yaw)`, so forward is
 * `(sin yaw, cos yaw)` and screen-right is `forward × up = (-cos yaw, sin yaw)`.
 * The old rotation had both terms mirrored: it agreed with this only at yaw
 * ±90°, so W walked toward the lens whenever the camera faced along the other
 * axis — and the recentre kept changing which.
 */
export function cameraRelative(ix: number, iz: number, yaw: number, out: Float64Array): void {
  const s = Math.sin(yaw);
  const c = Math.cos(yaw);
  out[0] = -c * ix - s * iz;
  out[1] = s * ix - c * iz;
}

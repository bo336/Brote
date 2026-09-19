/**
 * Pip's movement, as a pure simulation.
 *
 * It used to live inside `CharacterController`, next to the input and the store,
 * where nothing could run it but a browser. The 2026-09-12 playtest found three
 * things no screenshot shows: W walked toward the camera at most angles, some
 * spots had no way back out, and Space did nothing. All three are movement, and
 * movement that only a person can test is movement that ships broken. Here it
 * takes a body, an input and a camera yaw, and the tests drive it across whole
 * generated islands.
 *
 * No physics engine (`18-DECISIONS.md` T3), no `three`, no allocation per step,
 * and every damping term is `1 - exp(-lambda * dt)`.
 */
import { MOVE, VERB_MOTION, WATER_LEVEL } from './config';
import { coastRadiusAt, type IslandLayout } from './layout';
import {
  BODY_RADIUS, cameraRelative, COLLIDER_SLACK, DEEP, GroundQueries, OCTANTS, OPEN, SLOPE_LIMIT_COS, WALL,
  type Block, type Body, type StepInput, type StepResult,
} from './movement-probe';
import { sampleHeight, sampleNormal, type Heightfield } from './terrain';
import {
  canGlide, isClimbable, isShallowShore, mantleTarget, stepBoat, stepGlide, waterDepth, wallNormal,
  SWIM_DEPTH_M, type BoatState, type GlideState,
} from './traversal';
import type { VerbId } from './types';

export {
  BODY_RADIUS, cameraRelative, type Body, type MoveCollider, type StepInput, type StepResult,
} from './movement-probe';

const SWIM_SUBMERSION = 0.12;
/** Push-out passes against props; a gap that needs more than this is too narrow. */
const COLLIDER_PASSES = 4;

export class MovementSolver extends GroundQueries {
  locked = false;
  /** The verb the player just needed and does not have. */
  blocked: VerbId | null = null;
  private glide: GlideState = { vy: 0 };
  private boat: BoatState = { heading: 0, speed: 0 };
  private climbY = 0;
  private coyote = 0;
  private jumpBuffer = 0;
  private safe = { x: 0, y: 0, z: 0 };
  private safeT = 0;
  private trapT = 0;
  private trapX = 0;
  private trapZ = 0;
  private wanderT = 0;
  private wanderX = 0;
  private wanderZ = 0;
  private wanderMask = 0;
  private insideT = 0;
  private dir = new Float64Array(2);
  /** Reused every step: the frame path allocates nothing. */
  private result: StepResult = { mode: 'ground', jumped: false, landed: false, restored: false };

  constructor(heightfield: Heightfield, layout: IslandLayout, verbs: readonly VerbId[]) {
    super(heightfield, layout, verbs);
    const [sx, sz] = layout.spawn;
    this.safe = { x: sx, y: sampleHeight(heightfield, sx, sz), z: sz };
  }

  /** A deep copy, so a test can ask "could this body still get out?" without moving it. */
  clone(): MovementSolver {
    const c = new MovementSolver(this.probe.heightfield, this.probe.layout, this.verbs);
    Object.assign(c, this, {
      glide: { ...this.glide }, boat: { ...this.boat }, safe: { ...this.safe },
      dir: new Float64Array(2), result: { ...this.result },
    });
    return c;
  }

  boardBoat(body: Body): void {
    if (!this.has('sail')) return;
    this.mode = 'boat';
    this.boat.heading = body.yaw;
    this.boat.speed = 0;
  }

  leaveBoat(): void { if (this.mode === 'boat') this.mode = 'ground'; }

  step(body: Body, input: StepInput, cameraYaw: number, dt: number): StepResult {
    const magnitude = this.locked ? 0 : input.magnitude;
    const d = this.dir;
    d[0] = 0;
    d[1] = 0;
    if (magnitude > 0) {
      cameraRelative(input.x, input.z, cameraYaw, d);
      const len = Math.hypot(d[0], d[1]) || 1;
      d[0] /= len;
      d[1] /= len;
    }
    this.jumpBuffer = input.jump && !this.locked ? MOVE.jumpBufferS : Math.max(0, this.jumpBuffer - dt);
    const result = this.result;
    result.jumped = result.landed = result.restored = false;

    if (this.mode === 'boat') {
      stepBoat(this.probe, this.boat, body, -input.x, Math.max(0, -input.z), dt);
      body.yaw = this.boat.heading;
      body.speed = this.boat.speed;
    } else if (this.mode === 'glide') {
      const landed = stepGlide(this.probe, this.glide, body, d[0], d[1], dt);
      body.vx = d[0] * VERB_MOTION.glideHorizontalSpeed;
      body.vz = d[1] * VERB_MOTION.glideHorizontalSpeed;
      body.speed = Math.hypot(body.vx, body.vz);
      if (body.speed > 0.05) body.yaw = Math.atan2(body.vx, body.vz);
      if (landed) { this.mode = 'ground'; body.airborne = false; result.landed = true; }
    } else if (this.mode === 'climb') {
      this.stepClimb(body, input.z, magnitude, dt);
    } else {
      this.stepGround(body, d[0], d[1], magnitude, input.running, dt, result);
    }

    this.watch(body, magnitude, d[0], d[1], dt, result);
    result.mode = this.mode;
    return result;
  }

  // ── Walking, running, jumping, swimming ────────────────────────────────────

  private stepGround(
    body: Body, dirX: number, dirZ: number, magnitude: number, running: boolean, dt: number, result: StepResult,
  ): void {
    const hf = this.probe.heightfield;
    const swimming = this.mode === 'swim';
    const top = swimming ? VERB_MOTION.swimSpeed : running ? MOVE.runSpeed : MOVE.walkSpeed;

    // Velocity toward the input, with less authority in the air.
    const control = body.airborne ? MOVE.airControl : 1;
    const lambda = (magnitude > 0 ? MOVE.accel / Math.max(0.001, top) : body.airborne ? 0 : MOVE.friction) * control;
    const k = 1 - Math.exp(-lambda * dt);
    body.vx += (dirX * top * magnitude - body.vx) * k;
    body.vz += (dirZ * top * magnitude - body.vz) * k;

    // The jump: buffered before landing, forgiven just after leaving an edge.
    this.coyote = body.airborne ? Math.max(0, this.coyote - dt) : MOVE.coyoteS;
    if (!swimming && this.jumpBuffer > 0 && this.coyote > 0) {
      body.vy = MOVE.jumpSpeed;
      body.airborne = true;
      this.coyote = 0;
      this.jumpBuffer = 0;
      result.jumped = true;
    }

    // Uphill past the limit keeps only its sideways part, so a hillside is walked across.
    if (!body.airborne && !swimming && magnitude > 0) {
      const n = sampleNormal(hf, body.x, body.z);
      const g = Math.hypot(n[0], n[2]);
      if (n[1] < SLOPE_LIMIT_COS && g > 1e-6) {
        const ux = -n[0] / g;
        const uz = -n[2] / g;
        const up = body.vx * ux + body.vz * uz;
        if (up > 0) { body.vx -= ux * up; body.vz -= uz * up; }
      }
    }

    let x = body.x + body.vx * dt;
    let z = body.z + body.vz * dt;
    const block = this.blockAt(body.x, body.z, x, z, body.y, body.airborne);
    if (block !== OPEN) {
      if (block === DEEP) this.blocked = 'swim';
      if (block === WALL && !body.airborne && magnitude > 0.3 && this.tryWallVerbs(body, x, z, dirX, dirZ, magnitude)) {
        return;
      }
      this.slide(body, block, x, z, dt);
      x = body.x + body.vx * dt;
      z = body.z + body.vz * dt;
    }

    // Props and trunks: pushed out, and the push eats only the velocity into them.
    // Several passes, because two trunks closer than Pip is wide push back and
    // forth; if they never agree, the gap is too narrow and Pip stays where they were.
    for (let pass = 0; pass < COLLIDER_PASSES; pass++) {
      let pushed = false;
      for (let i = 0; i < this.colliders.length; i++) {
        const c = this.colliders[i]!;
        const dx = x - c.x;
        const dz = z - c.z;
        const min = c.radius + BODY_RADIUS;
        const sq = dx * dx + dz * dz;
        if (sq >= min * min) continue;
        const dist = Math.sqrt(sq);
        const nx = dist > 1e-4 ? dx / dist : Math.sin(body.yaw + Math.PI);
        const nz = dist > 1e-4 ? dz / dist : Math.cos(body.yaw + Math.PI);
        x = c.x + nx * min;
        z = c.z + nz * min;
        pushed = true;
        const into = body.vx * nx + body.vz * nz;
        if (into < 0) { body.vx -= nx * into; body.vz -= nz * into; }
      }
      if (!pushed) break;
    }
    if (this.insideCollider(x, z, COLLIDER_SLACK) && !this.insideCollider(body.x, body.z, COLLIDER_SLACK)) {
      x = body.x;
      z = body.z;
      body.vx = 0;
      body.vz = 0;
    }

    // The coastline: a soft radial push over the last metre, and at the sand's
    // very edge a stop. Past the coast the height function is dry land nobody
    // drew, so a push alone let a runner walk out over the sea.
    const radius = Math.hypot(x, z);
    const coast = coastRadiusAt(this.probe.layout.coastline, Math.atan2(z, x));
    const rim = coast - MOVE.coastMarginM;
    if (radius > rim && radius > 1e-3 && !this.nearIslet(x, z)) {
      const ux = x / radius;
      const uz = z / radius;
      const push = Math.min(1, (radius - rim) / MOVE.coastMarginM);
      x -= ux * MOVE.coastPushback * push * dt;
      z -= uz * MOVE.coastPushback * push * dt;
      const out = body.vx * ux + body.vz * uz;
      if (out > 0) { body.vx -= ux * out * push; body.vz -= uz * out * push; }
      const edge = coast - MOVE.coastEdgeM;
      if (Math.hypot(x, z) > edge) { x = ux * edge; z = uz * edge; }
    }
    // One more ground check after every push, so no push can shove Pip into a wall.
    if (this.blockAt(body.x, body.z, x, z, body.y, body.airborne) !== OPEN) { x = body.x; z = body.z; }
    body.x = x;
    body.z = z;

    this.stepVertical(body, magnitude, dt, result);

    body.speed = Math.hypot(body.vx, body.vz);
    if (body.speed > 0.05) {
      let delta = Math.atan2(body.vx, body.vz) - body.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      body.yaw += delta * (1 - Math.exp(-MOVE.turnLambda * dt));
    }
  }

  /** Take away only the part of the velocity the ground refused, then try each axis alone. */
  private slide(body: Body, block: Block, x: number, z: number, dt: number): void {
    const [wx, wz] = wallNormal(this.probe, x, z);
    // `wallNormal` points downhill. A wall refuses uphill; deep water refuses downhill.
    const rx = block === WALL ? -wx : wx;
    const rz = block === WALL ? -wz : wz;
    const into = body.vx * rx + body.vz * rz;
    if (into > 0) { body.vx -= rx * into; body.vz -= rz * into; }
    const sx = body.x + body.vx * dt;
    const sz = body.z + body.vz * dt;
    if (this.blockAt(body.x, body.z, sx, sz, body.y, body.airborne) === OPEN) return;
    if (this.blockAt(body.x, body.z, sx, body.z, body.y, body.airborne) === OPEN) { body.vz = 0; return; }
    if (this.blockAt(body.x, body.z, body.x, sz, body.y, body.airborne) === OPEN) { body.vx = 0; return; }
    body.vx = 0;
    body.vz = 0;
  }

  /** Pressing into a wall: mantle a ledge, or start scaling a marked face. */
  private tryWallVerbs(body: Body, x: number, z: number, dirX: number, dirZ: number, magnitude: number): boolean {
    if (this.has('scale') && magnitude > 0.4 && isClimbable(this.probe, x, z)) {
      this.mode = 'climb';
      this.climbY = 0.05;
      return true;
    }
    if (isClimbable(this.probe, x, z)) this.blocked = 'scale';
    if (!this.has('climb')) return false;
    const top = mantleTarget(this.probe, body.x, body.z, Math.atan2(dirX, dirZ), body.y);
    if (top === null) return false;
    const mx = body.x + dirX * 0.45;
    const mz = body.z + dirZ * 0.45;
    if (WATER_LEVEL - sampleHeight(this.probe.heightfield, mx, mz) > SWIM_DEPTH_M || this.insideCollider(mx, mz, 0)) {
      return false;
    }
    body.x = mx;
    body.z = mz;
    body.y = top;
    return true;
  }

  private stepVertical(body: Body, magnitude: number, dt: number, result: StepResult): void {
    const ground = this.groundAt(body.x, body.z, body.y);
    const depth = ground > sampleHeight(this.probe.heightfield, body.x, body.z) ? 0 : waterDepth(this.probe, body.x, body.z);

    if (depth > SWIM_DEPTH_M && this.has('swim') && body.y <= WATER_LEVEL + 0.05) {
      this.mode = 'swim';
      body.airborne = false;
      body.vy = 0;
      body.y = WATER_LEVEL - SWIM_SUBMERSION;
      body.grounded = false;
      return;
    }
    if (this.mode === 'swim' && isShallowShore(this.probe, body.x, body.z)) this.mode = 'ground';
    if (this.mode === 'swim') {
      body.y = WATER_LEVEL - SWIM_SUBMERSION;
      return;
    }

    if (body.airborne) {
      body.vy -= MOVE.gravity * dt;
      body.y += body.vy * dt;
      if (body.y <= ground) {
        body.y = ground;
        body.vy = 0;
        body.airborne = false;
        result.landed = true;
      } else if (this.has('glide') && body.vy < 0 && canGlide(this.probe, body.x, body.z, body.y)) {
        this.mode = 'glide';
        this.glide.vy = body.vy;
      }
    } else if (ground < body.y - MOVE.stepDownM && magnitude > 0) {
      body.airborne = true;
      body.vy = 0;
    } else {
      body.y = ground;
    }
    body.grounded = !body.airborne;
  }

  private stepClimb(body: Body, forward: number, magnitude: number, dt: number): void {
    const climb = -forward * magnitude;
    this.climbY += climb * VERB_MOTION.climbSpeed * dt;
    const foot = sampleHeight(this.probe.heightfield, body.x, body.z);
    body.y = foot + Math.max(0, this.climbY);
    body.speed = Math.abs(climb) * VERB_MOTION.climbSpeed;
    const [nx, nz] = wallNormal(this.probe, body.x, body.z);
    body.yaw = Math.atan2(-nx, -nz);
    const ahead = sampleHeight(this.probe.heightfield, body.x - nx * 0.6, body.z - nz * 0.6);
    if (climb < -0.2 || this.climbY <= 0 || this.jumpBuffer > 0) {
      this.climbY = 0;
      this.mode = 'ground';
    } else if (ahead >= body.y - 0.1) {
      body.x -= nx * 0.6;
      body.z -= nz * 0.6;
      body.y = ahead;
      this.climbY = 0;
      this.mode = 'ground';
    }
  }

  // ── Never stuck ────────────────────────────────────────────────────────────

  private watch(body: Body, magnitude: number, dirX: number, dirZ: number, dt: number, result: StepResult): void {
    if (!Number.isFinite(body.x + body.y + body.z + body.vx + body.vz + body.vy)) {
      this.restore(body, result);
      return;
    }
    // Standing inside a prop — spawned there, or wedged by a push — is never a place to stay.
    if (this.mode === 'ground' && this.insideCollider(body.x, body.z, COLLIDER_SLACK * 3)) {
      this.insideT += dt;
      if (this.insideT > MOVE.safeEveryS) { this.restore(body, result); this.insideT = 0; return; }
    } else {
      this.insideT = 0;
    }
    this.safeT -= dt;
    if (this.safeT <= 0 && this.mode === 'ground' && !body.airborne) {
      this.safeT = MOVE.safeEveryS;
      if (this.standable(body.x, body.z)) { this.safe.x = body.x; this.safe.y = body.y; this.safe.z = body.z; }
    }
    if (magnitude < 0.5 || (this.mode !== 'ground' && this.mode !== 'swim')) {
      this.trapT = 0; this.trapX = body.x; this.trapZ = body.z;
      this.wanderT = 0; this.wanderX = body.x; this.wanderZ = body.z; this.wanderMask = 0;
      return;
    }
    this.trapT += dt;
    if (this.trapT >= MOVE.trapCheckS) {
      if (Math.hypot(body.x - this.trapX, body.z - this.trapZ) < MOVE.trapProgressM && this.enclosed(body)) {
        this.restore(body, result);
      }
      this.trapT = 0; this.trapX = body.x; this.trapZ = body.z;
    }
    // Pushing several ways and getting nowhere is trapped too, whatever the probes think.
    const octant = Math.round((Math.atan2(dirZ, dirX) / (Math.PI * 2)) * OCTANTS + OCTANTS) % OCTANTS;
    this.wanderMask |= 1 << octant;
    this.wanderT += dt;
    if (this.wanderT >= MOVE.trapWanderS) {
      let spread = 0;
      for (let i = 0; i < OCTANTS; i++) spread += (this.wanderMask >> i) & 1;
      const moved = Math.hypot(body.x - this.wanderX, body.z - this.wanderZ);
      if (spread >= MOVE.trapWanderOctants && moved < MOVE.trapProgressM * 2) this.restore(body, result);
      this.wanderT = 0; this.wanderX = body.x; this.wanderZ = body.z; this.wanderMask = 0;
    }
  }

  private restore(body: Body, result: StepResult): void {
    const s = this.safe;
    // The saved spot was good when it was saved; a prop placed since may sit on it.
    if (!this.standable(s.x, s.z)) this.findFree(s);
    body.x = s.x;
    body.z = s.z;
    body.y = this.groundAt(s.x, s.z, Infinity);
    body.vx = body.vz = body.vy = body.speed = 0;
    body.airborne = false;
    body.grounded = true;
    this.mode = 'ground';
    this.trapT = this.wanderT = 0;
    this.wanderMask = 0;
    result.restored = true;
  }
}

'use client';

import * as THREE from 'three';

import { CAMERA, MOVE, PIP_HEIGHT_M, REDUCED_MOTION_DAMPING_SCALE, WATER_LEVEL } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { CameraShot } from '@/lib/render/reveal';
import type { PropCollider } from './CharacterController';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The follow camera: **an orbit around a pivot that follows Pip**, with three
 * axes the player owns.
 *
 * The 2026-09-16 playtest: "when I'm walking and moving the camera it feels too
 * bad". The old rig computed where the lens should be and let it *chase* that
 * spot in a straight line: a turn of the mouse reached the screen 27° late at
 * p95, the lens cut 10% inside its own circle mid-turn, and walking while
 * turning swung the world around Pip. Now:
 *
 *  - **The pivot** trails Pip with a little give — across the ground and,
 *    softer, up and down — so a run reads as speed and a jump never jolts.
 *  - **The lens sits exactly on its orbit** around that pivot, at the yaw, tilt
 *    and distance in force. Nothing lags the pivot, so nothing swings.
 *  - **Yaw and tilt** go where the hand puts them, smoothed over a few
 *    milliseconds — steady, never elastic. When nobody is steering, the tilt
 *    follows the zoom and the slope, and a leash turns the yaw only as far as
 *    Pip crosses the frame, so W never changes meaning under the player.
 *  - **Zoom** is a factor — a notch is the same step near and far — and eases.
 *
 * The boom ducks under hillsides and out of the wood, a cutscene hands the lens
 * back with an ease rather than a cut, and there is no head bob, shake or
 * motion blur, ever. A run widens the lens by a few degrees, except under
 * reduced motion.
 */
export interface CameraOptions {
  camera: THREE.PerspectiveCamera;
  reducedMotion?: boolean;
  /** The in-game setting; `false` disables the leash entirely (XAG 117). */
  autoRecentre?: boolean;
}

const DEG = Math.PI / 180;
const scratchTarget = new THREE.Vector3();
const scratchDesired = new THREE.Vector3();

export type { CameraShot };

export class FollowCamera {
  private camera: THREE.PerspectiveCamera;
  /** Where the lens is looking, kept for the cutscene and its hand-back. */
  private lookAt = new THREE.Vector3();
  /** What the lens orbits: Pip, followed with a little give. */
  private pivot = new THREE.Vector3();
  /** The look-ahead along Pip's travel, eased. */
  private lead = new THREE.Vector3();
  /** Radians. `yaw` is on screen; `yawGoal` is where the hand and the leash put it. */
  private yaw = 0;
  private yawGoal = 0;
  /** Degrees. The tilt actually in force. */
  private pitch: number = CAMERA.pitchDeg;
  /** Degrees the player has dragged the tilt away from the automatic one. */
  private pitchOffset = 0;
  private distance: number = CAMERA.distanceM;
  private targetDistance: number = CAMERA.distanceM;
  private floorLift = 0;
  private sinceManualS = Infinity;
  private reducedMotion: boolean;
  private autoRecentre: boolean;
  private heightfield: Heightfield | null = null;
  private occluders: readonly PropCollider[] = [];
  private clearance = 1;
  private shot: CameraShot | null = null;
  private shotYaw = 0;
  /** 1 just after a cutscene let go, easing to 0: how much of the shot's pose is left. */
  private handBack = 0;
  private handBackPos = new THREE.Vector3();
  private handBackLook = new THREE.Vector3();

  constructor(opts: CameraOptions) {
    this.camera = opts.camera;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.autoRecentre = opts.autoRecentre ?? true;
    this.camera.fov = CAMERA.fov;
    this.camera.updateProjectionMatrix();
  }

  setReducedMotion(v: boolean): void { this.reducedMotion = v; }
  setAutoRecentre(v: boolean): void { this.autoRecentre = v; }
  setTerrain(heightfield: Heightfield | null): void { this.heightfield = heightfield; }
  setOccluders(occluders: readonly PropCollider[]): void { this.occluders = occluders; }

  /** The yaw on screen, which the controller uses to rotate the input vector: W is always "into the screen". */
  getYaw(): number { return this.yaw; }

  /** Degrees, for the HUD and the tests. */
  getPitch(): number { return this.pitch; }

  /** A drag: sideways orbits, vertically tilts. Both in radians. */
  orbit(deltaYaw: number, deltaPitch = 0): void {
    this.yawGoal += deltaYaw;
    const goal = this.autoPitch() + this.pitchOffset + deltaPitch / DEG;
    const clamped = Math.min(CAMERA.pitchMaxDeg, Math.max(CAMERA.pitchMinDeg, goal));
    this.pitchOffset += clamped - (this.autoPitch() + this.pitchOffset);
    this.sinceManualS = 0;
  }

  /** Zoom by a factor — below 1 closer, above 1 farther — clamped so no shot is ever too near or too far. */
  zoomBy(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    this.targetDistance = Math.min(CAMERA.pinchMaxM, Math.max(CAMERA.pinchMinM, this.targetDistance * factor));
  }

  /** Snap behind Pip, level with the automatic tilt. Used on entry and on "recentre". */
  snap(): void {
    const p = playerTransform;
    this.yaw = this.yawGoal = p.yaw;
    this.pitchOffset = 0;
    this.distance = this.targetDistance;
    this.pitch = this.autoPitch();
    this.pivot.set(p.x, p.y, p.z);
    this.lead.set(0, 0, 0);
    this.floorLift = 0;
    this.handBack = 0;
    this.updateTargets();
    this.camera.position.copy(scratchDesired);
    this.lookAt.copy(scratchTarget);
    this.camera.lookAt(this.lookAt);
  }

  takeOver(shot: CameraShot, instant = false): void {
    this.shot = shot;
    this.shotYaw = shot.yaw;
    if (instant) {
      this.composeShot(shot);
      this.camera.position.copy(scratchDesired);
      this.lookAt.copy(scratchTarget);
      this.camera.lookAt(this.lookAt);
    }
  }

  release(): void {
    if (!this.shot) return;
    this.shot = null;
    // Ease back from wherever the shot left the lens, rather than cutting to Pip.
    this.handBack = 1;
    this.handBackPos.copy(this.camera.position);
    this.handBackLook.copy(this.lookAt);
    this.pivot.set(playerTransform.x, playerTransform.y, playerTransform.z);
  }

  get inShot(): boolean { return this.shot !== null; }

  // ── The automatic tilt ─────────────────────────────────────────────────────

  /** Zoomed in, the lens drops behind the shoulder; zoomed out, it rises over the region. */
  private autoPitch(): number {
    const t = (this.distance - CAMERA.pinchMinM) / (CAMERA.pinchMaxM - CAMERA.pinchMinM);
    const k = Math.min(1, Math.max(0, t));
    return CAMERA.pitchNearDeg + (CAMERA.pitchFarDeg - CAMERA.pitchNearDeg) * k;
  }

  /** Ground rising ahead tilts the lens up it, so a slope is climbed looking at the top. */
  private slopeTilt(): number {
    const hf = this.heightfield;
    if (!hf) return 0;
    const p = this.pivot;
    const ahead = sampleHeight(hf, p.x + Math.sin(this.yaw) * CAMERA.slopeProbeM, p.z + Math.cos(this.yaw) * CAMERA.slopeProbeM);
    const deg = Math.atan2(ahead - sampleHeight(hf, p.x, p.z), CAMERA.slopeProbeM) / DEG;
    return Math.min(CAMERA.slopePitchMaxDeg, Math.max(-CAMERA.slopePitchMaxDeg, deg * CAMERA.slopePitchGain));
  }

  // ── Occlusion ──────────────────────────────────────────────────────────────

  /** The longest boom that still clears the ground and the trunks, as a fraction of the one asked for. */
  private clearFraction(distance: number, pitchRad: number): number {
    const hf = this.heightfield;
    if (!hf) return 1;
    const p = this.pivot;
    const cosPitch = Math.cos(pitchRad) || 1;
    const dx = -Math.sin(this.yaw) * cosPitch;
    const dz = -Math.cos(this.yaw) * cosPitch;
    const dy = -Math.sin(pitchRad);
    const n = CAMERA.occlusionSamples;
    // The line of sight starts at Pip's eye, not their feet, and only the lens end
    // needs the full clearance: at a shallow tilt the first metre of boom rises
    // less than the clearance, and demanding it there collapsed the camera onto Pip.
    const eye = p.y + PIP_HEIGHT_M * CAMERA.lookHeightFrac;
    for (let i = 1; i <= n; i++) {
      const f = i / n;
      const d = distance * f;
      const ground = sampleHeight(hf, p.x + dx * d, p.z + dz * d);
      if (eye + dy * d < ground + CAMERA.occlusionClearanceM * f) {
        const safe = Math.max(CAMERA.occlusionMinM, d - CAMERA.occlusionMarginM);
        return Math.min(1, safe / Math.max(0.001, distance));
      }
    }
    // Trunks are solved, not sampled: the closest approach of the boom's ground
    // track to each circle, with the horizontal direction normalised.
    //
    // **Trunks, not crowns.** Testing the whole three-metre crown pulled the boom
    // to its 1.3 m floor anywhere near a wood — the playtest's camera parked at
    // Pip's heels, filling half the screen with him. A lens under a canopy is a
    // good shot; the canopy fade already thins the leaves between it and Pip.
    const hx = dx / cosPitch;
    const hz = dz / cosPitch;
    const reach = distance * cosPitch;
    let nearest = reach;
    for (const o of this.occluders) {
      const ox = o.x - p.x;
      const oz = o.z - p.z;
      const t = ox * hx + oz * hz;
      if (t <= 0 || t >= nearest) continue;
      const perpX = ox - hx * t;
      const perpZ = oz - hz * t;
      const r = o.radius + CAMERA.occlusionMarginM;
      if (perpX * perpX + perpZ * perpZ < r * r) nearest = t;
    }
    if (nearest < reach) {
      const safe = Math.max(CAMERA.occlusionMinM, nearest / cosPitch - CAMERA.occlusionMarginM);
      return Math.min(1, safe / Math.max(0.001, distance));
    }
    return 1;
  }

  // ── Composition ────────────────────────────────────────────────────────────

  private composeShot(shot: CameraShot): void {
    const pitch = shot.pitchDeg * DEG;
    const d = shot.distance * this.aspectCompensation();
    scratchTarget.set(shot.x, shot.y, shot.z);
    scratchDesired.set(
      shot.x - Math.sin(this.shotYaw) * d * Math.cos(pitch),
      shot.y + Math.sin(pitch) * d,
      shot.z - Math.cos(this.shotYaw) * d * Math.cos(pitch),
    );
    if (this.heightfield) {
      const floor = sampleHeight(this.heightfield, scratchDesired.x, scratchDesired.z) + CAMERA.occlusionClearanceM;
      if (scratchDesired.y < floor) scratchDesired.y = floor;
    }
  }

  /** Portrait screens see less sideways; pull back rather than narrow the lens. */
  private aspectCompensation(): number {
    return Math.min(
      CAMERA.aspectDistanceMax,
      Math.max(CAMERA.aspectDistanceMin, CAMERA.targetAspect / Math.max(0.01, this.camera.aspect)),
    );
  }

  /** The lens on its orbit around the pivot, and what it looks at. Writes the scratch vectors. */
  private updateTargets(): void {
    const pv = this.pivot;
    const distance = this.distance * this.aspectCompensation() * this.clearance;
    const pitch = this.pitch * DEG;
    scratchDesired.set(
      pv.x - Math.sin(this.yaw) * distance * Math.cos(pitch),
      pv.y - Math.sin(pitch) * distance + this.floorLift,
      pv.z - Math.cos(this.yaw) * distance * Math.cos(pitch),
    );
    const portraitLift = this.camera.aspect < 1 ? CAMERA.portraitLookLiftM : 0;
    scratchTarget.set(
      pv.x + this.lead.x,
      pv.y + PIP_HEIGHT_M * CAMERA.lookHeightFrac + portraitLift,
      pv.z + this.lead.z,
    );
  }

  update(dt: number): void {
    const p = playerTransform;
    this.sinceManualS += dt;

    if (this.shot) {
      this.shotYaw += this.shot.orbit * dt;
      this.composeShot(this.shot);
      const kShot = 1 - Math.exp(-CAMERA.posLambda * CAMERA.ceremonyLambdaScale * dt);
      this.camera.position.lerp(scratchDesired, kShot);
      this.lookAt.lerp(scratchTarget, kShot);
      this.camera.lookAt(this.lookAt);
      return;
    }

    const scale = this.reducedMotion ? REDUCED_MOTION_DAMPING_SCALE : 1;
    const ease = (lambda: number) => 1 - Math.exp(-lambda * dt);

    // Zoom first: the automatic tilt reads the distance.
    this.distance += (this.targetDistance - this.distance) * ease(CAMERA.zoomLambda);

    // The leash: turn by exactly as much as Pip crosses the frame, never more.
    if (this.autoRecentre && this.sinceManualS > CAMERA.leashDelayS && p.speed > 0.1) {
      const lateral = p.vx * -Math.cos(this.yaw) + p.vz * Math.sin(this.yaw);
      const reach = Math.max(1, this.distance * Math.cos(this.pitch * DEG));
      this.yawGoal -= (lateral / reach) * CAMERA.leashGain * scale * dt;
    }
    // The hand's turn is never slowed by reduced motion: it is the player's own input.
    this.yaw += (this.yawGoal - this.yaw) * ease(CAMERA.turnLambda);

    // The tilt: automatic from the zoom and the slope, plus what the player
    // dragged — answered at the turn's rate while they are dragging it.
    const goal = Math.min(
      CAMERA.pitchMaxDeg,
      Math.max(CAMERA.pitchMinDeg, this.autoPitch() + this.slopeTilt() + this.pitchOffset),
    );
    const steering = this.sinceManualS < CAMERA.leashDelayS;
    this.pitch += (goal - this.pitch) * ease(steering ? CAMERA.turnLambda : CAMERA.pitchLambda * scale);

    // The pivot after Pip. A jump across the island (a respawn, a region hop) is followed at once.
    const pv = this.pivot;
    if (Math.hypot(p.x - pv.x, p.z - pv.z) > CAMERA.snapPivotM) pv.set(p.x, p.y, p.z);
    const kFollow = ease(CAMERA.followLambda * scale);
    pv.x += (p.x - pv.x) * kFollow;
    pv.z += (p.z - pv.z) * kFollow;
    pv.y += (p.y - pv.y) * ease(CAMERA.followYLambda * scale);

    // The look-ahead along the direction of travel, eased so a sudden turn does not whip the frame.
    const speed = Math.hypot(p.vx, p.vz);
    const leadM = speed > 0.05 ? (Math.min(1, speed / MOVE.runSpeed) * CAMERA.lookAheadM) / speed : 0;
    const kLead = ease(CAMERA.leadLambda * scale);
    this.lead.x += (p.vx * leadM - this.lead.x) * kLead;
    this.lead.z += (p.vz * leadM - this.lead.z) * kLead;

    const boom = this.distance * this.aspectCompensation();
    const wanted = this.clearFraction(boom, this.pitch * DEG);
    const lambda = wanted < this.clearance ? CAMERA.occlusionInLambda : CAMERA.occlusionOutLambda;
    this.clearance += (wanted - this.clearance) * ease(lambda);

    // **The lens never goes under the world** — not under a summit's falling
    // slope, and not under the sea, which from below is a pale ceiling. Lifted at
    // once, let down slowly, so a bump the boom passes over is not a jolt.
    const liftBefore = this.floorLift;
    this.floorLift = 0;
    this.updateTargets();
    let need = 0;
    if (this.heightfield) {
      const floor = Math.max(sampleHeight(this.heightfield, scratchDesired.x, scratchDesired.z), WATER_LEVEL)
        + CAMERA.occlusionClearanceM;
      need = Math.max(0, floor - scratchDesired.y);
    }
    this.floorLift = need >= liftBefore ? need : liftBefore + (need - liftBefore) * ease(CAMERA.floorLiftOutLambda);
    scratchDesired.y += this.floorLift;

    // After a cutscene, what is left of its pose fades out over a moment.
    if (this.handBack > 0.001) {
      this.handBack *= Math.exp(-CAMERA.releaseLambda * dt);
      scratchDesired.lerp(this.handBackPos, this.handBack);
      scratchTarget.lerp(this.handBackLook, this.handBack);
    }

    this.camera.position.copy(scratchDesired);
    this.lookAt.copy(scratchTarget);
    this.camera.lookAt(this.lookAt);

    // A little wider at a run.
    const run = this.reducedMotion ? 0 : Math.min(1, Math.max(0, (speed - MOVE.walkSpeed) / (MOVE.runSpeed - MOVE.walkSpeed)));
    const fov = this.camera.fov + (CAMERA.fov + run * CAMERA.runFovKickDeg - this.camera.fov) * ease(CAMERA.fovLambda);
    if (Math.abs(fov - this.camera.fov) > 0.005) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
}

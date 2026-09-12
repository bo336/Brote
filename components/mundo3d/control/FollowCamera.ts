'use client';

import * as THREE from 'three';

import { CAMERA, PIP_HEIGHT_M, REDUCED_MOTION_DAMPING_SCALE, WATER_LEVEL } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { CameraShot } from '@/lib/render/reveal';
import type { PropCollider } from './CharacterController';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The follow camera: damped, never physical, and **two axes the player owns**.
 *
 * The 2026-09-12 playtest asked for "an adaptive angle, like the rotation", and
 * found W walking in directions that kept changing. Both came from the same rig:
 * a fixed pitch, and a recentre that swung the yaw behind Pip after 2.5 s — and
 * since W is relative to the yaw, every swing re-aimed every key.
 *
 * Now:
 *  - **Yaw** is dragged, and otherwise follows a **leash**: it turns only as far
 *    as Pip actually moves across the frame, so walking forward never rotates
 *    the world and holding A circles smoothly.
 *  - **Pitch** is dragged too, and otherwise adapts: low behind the shoulder
 *    when zoomed in, high over the region when zoomed out, and tilted up a
 *    slope Pip is walking up.
 *  - **Zoom** is the wheel or a pinch.
 *
 * What stays: the look-at damps faster than the body (the "attentive" trick),
 * the boom ducks under hillsides and out of the wood, and there is no head bob,
 * shake or motion blur, ever.
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
  private lookAt = new THREE.Vector3();
  private yaw = 0;
  /** Degrees. The tilt actually in force, damped toward `pitchGoal`. */
  private pitch: number = CAMERA.pitchDeg;
  /** Degrees the player has dragged the tilt away from the automatic one. */
  private pitchOffset = 0;
  private distance: number = CAMERA.distanceM;
  private targetDistance: number = CAMERA.distanceM;
  private sinceManualS = Infinity;
  private reducedMotion: boolean;
  private autoRecentre: boolean;
  private heightfield: Heightfield | null = null;
  private occluders: readonly PropCollider[] = [];
  private clearance = 1;
  private shot: CameraShot | null = null;
  private shotYaw = 0;

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

  /** The camera's yaw, which the controller uses to rotate the input vector. */
  getYaw(): number { return this.yaw; }

  /** Degrees, for the HUD and the tests. */
  getPitch(): number { return this.pitch; }

  /** A drag: sideways orbits, vertically tilts. Both in radians. */
  orbit(deltaYaw: number, deltaPitch = 0): void {
    this.yaw += deltaYaw;
    const goal = this.autoPitch() + this.pitchOffset + deltaPitch / DEG;
    const clamped = Math.min(CAMERA.pitchMaxDeg, Math.max(CAMERA.pitchMinDeg, goal));
    this.pitchOffset += clamped - (this.autoPitch() + this.pitchOffset);
    this.sinceManualS = 0;
  }

  /** Wheel or pinch, in metres, clamped so no shot is ever too near or too far. */
  zoom(delta: number): void {
    this.targetDistance = Math.min(CAMERA.pinchMaxM, Math.max(CAMERA.pinchMinM, this.targetDistance + delta));
  }

  /** Snap behind Pip, level with the automatic tilt. Used on entry and on "recentre". */
  snap(): void {
    this.yaw = playerTransform.yaw;
    this.pitchOffset = 0;
    this.pitch = this.autoPitch();
    this.distance = this.targetDistance;
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

  release(): void { this.shot = null; }

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
    const p = playerTransform;
    const ahead = sampleHeight(hf, p.x + Math.sin(this.yaw) * CAMERA.slopeProbeM, p.z + Math.cos(this.yaw) * CAMERA.slopeProbeM);
    const deg = Math.atan2(ahead - sampleHeight(hf, p.x, p.z), CAMERA.slopeProbeM) / DEG;
    return Math.min(CAMERA.slopePitchMaxDeg, Math.max(-CAMERA.slopePitchMaxDeg, deg * CAMERA.slopePitchGain));
  }

  // ── Occlusion ──────────────────────────────────────────────────────────────

  /** The longest boom that still clears the ground and the trunks, as a fraction of the one asked for. */
  private clearFraction(distance: number, pitchRad: number): number {
    const hf = this.heightfield;
    if (!hf) return 1;
    const p = playerTransform;
    const cosPitch = Math.cos(pitchRad) || 1;
    const dx = -Math.sin(this.yaw) * cosPitch;
    const dz = -Math.cos(this.yaw) * cosPitch;
    const dy = -Math.sin(pitchRad);
    const n = CAMERA.occlusionSamples;
    for (let i = 1; i <= n; i++) {
      const d = (distance * i) / n;
      const ground = sampleHeight(hf, p.x + dx * d, p.z + dz * d);
      if (p.y + dy * d < ground + CAMERA.occlusionClearanceM) {
        const safe = Math.max(CAMERA.occlusionMinM, d - CAMERA.occlusionMarginM);
        return Math.min(1, safe / Math.max(0.001, distance));
      }
    }
    // Trunks are solved, not sampled: the closest approach of the boom's ground
    // track to each circle, with the horizontal direction normalised.
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
      const r = o.cameraRadius ?? o.radius;
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

  private updateTargets(): void {
    const p = playerTransform;
    const distance = this.distance * this.aspectCompensation() * this.clearance;
    const pitch = this.pitch * DEG;
    scratchDesired.set(
      p.x - Math.sin(this.yaw) * distance * Math.cos(pitch),
      p.y - Math.sin(pitch) * distance,
      p.z - Math.cos(this.yaw) * distance * Math.cos(pitch),
    );
    // **The lens never goes under the world** — not under a summit's falling
    // slope, and not under the sea, which from below is a pale ceiling.
    if (this.heightfield) {
      const floor = Math.max(sampleHeight(this.heightfield, scratchDesired.x, scratchDesired.z), WATER_LEVEL)
        + CAMERA.occlusionClearanceM;
      if (scratchDesired.y < floor) scratchDesired.y = floor;
    }
    const portraitLift = this.camera.aspect < 1 ? CAMERA.portraitLookLiftM : 0;
    // Lead along the direction of travel rather than the facing, so a sudden
    // turn does not whip the frame before Pip has actually gone anywhere.
    const lead = Math.min(1, p.speed / 4) * CAMERA.lookAheadM;
    const vlen = Math.hypot(p.vx, p.vz) || 1;
    scratchTarget.set(
      p.x + (p.vx / vlen) * lead,
      p.y + PIP_HEIGHT_M * CAMERA.lookHeightFrac + portraitLift,
      p.z + (p.vz / vlen) * lead,
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
    const kPos = 1 - Math.exp(-CAMERA.posLambda * scale * dt);
    const kLook = 1 - Math.exp(-CAMERA.lookLambda * scale * dt);
    this.distance += (this.targetDistance - this.distance) * kPos;

    // The leash: turn by exactly as much as Pip crosses the frame, never more.
    if (this.autoRecentre && this.sinceManualS > CAMERA.leashDelayS && p.speed > 0.1) {
      const lateral = p.vx * -Math.cos(this.yaw) + p.vz * Math.sin(this.yaw);
      const reach = Math.max(1, this.distance * Math.cos(this.pitch * DEG));
      this.yaw -= (lateral / reach) * CAMERA.leashGain * scale * dt;
    }

    // The tilt: automatic from the zoom and the slope, plus what the player dragged.
    const goal = Math.min(
      CAMERA.pitchMaxDeg,
      Math.max(CAMERA.pitchMinDeg, this.autoPitch() + this.slopeTilt() + this.pitchOffset),
    );
    this.pitch += (goal - this.pitch) * (1 - Math.exp(-CAMERA.pitchLambda * scale * dt));

    const boom = this.distance * this.aspectCompensation();
    const wanted = this.clearFraction(boom, this.pitch * DEG);
    const lambda = wanted < this.clearance ? CAMERA.occlusionInLambda : CAMERA.occlusionOutLambda;
    this.clearance += (wanted - this.clearance) * (1 - Math.exp(-lambda * dt));

    this.updateTargets();
    this.camera.position.lerp(scratchDesired, kPos);
    this.lookAt.lerp(scratchTarget, kLook);
    this.camera.lookAt(this.lookAt);
  }
}

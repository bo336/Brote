'use client';

import * as THREE from 'three';

import { CAMERA, PIP_HEIGHT_M, REDUCED_MOTION_DAMPING_SCALE } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { PropCollider } from './CharacterController';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The follow camera. Damped, never physical.
 *
 * The trick that makes a camera feel *attentive* rather than sluggish is
 * damping the **look-at target about twice as fast as the position**
 * (`10-CONTROLS-AND-CAMERA.md` §4): the frame keeps Pip centred while the
 * camera body drifts in behind.
 *
 * **No head bob. No camera shake. No motion blur. Ever.** (Xbox Accessibility
 * Guideline 117, and every nausea complaint ever filed about a third-person
 * mobile game.)
 *
 * FOV never changes between devices — that would change the art. A narrow
 * screen is compensated by pulling the camera *back*, so Pip occupies the same
 * fraction of the shorter dimension everywhere.
 *
 * The one place the camera yields to the world is the hillside. Walking behind
 * the mountain would otherwise bury the lens in it, so the boom shortens until
 * it clears the ground — **fast in, slow out**, and by distance probes rather
 * than a raycast (`10-CONTROLS-AND-CAMERA.md` §4).
 */
export interface CameraOptions {
  camera: THREE.PerspectiveCamera;
  reducedMotion?: boolean;
  /** The in-game setting; `false` disables auto-recentring entirely (XAG 117). */
  autoRecentre?: boolean;
}

const scratchTarget = new THREE.Vector3();
const scratchDesired = new THREE.Vector3();

export class FollowCamera {
  private camera: THREE.PerspectiveCamera;
  private lookAt = new THREE.Vector3();
  /** Orbit yaw around Pip. Manual drag moves it; auto-recentre eases it back. */
  private yaw = 0;
  private distance: number = CAMERA.distanceM;
  private targetDistance: number = CAMERA.distanceM;
  private sinceManualS = Infinity;
  private reducedMotion: boolean;
  private autoRecentre: boolean;
  /** The ground, for the boom's clearance probes. Null until the world is built. */
  private heightfield: Heightfield | null = null;
  /** Trunks and props the boom must not sit inside. */
  private occluders: readonly PropCollider[] = [];
  /** How much of the boom currently clears the ground, 0..1. */
  private clearance = 1;

  constructor(opts: CameraOptions) {
    this.camera = opts.camera;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.autoRecentre = opts.autoRecentre ?? true;
    this.camera.fov = CAMERA.fov;
    this.camera.updateProjectionMatrix();
  }

  setReducedMotion(v: boolean): void {
    this.reducedMotion = v;
  }

  setAutoRecentre(v: boolean): void {
    this.autoRecentre = v;
  }

  /** The camera needs the ground to know when to duck under it. */
  setTerrain(heightfield: Heightfield | null): void {
    this.heightfield = heightfield;
  }

  /**
   * The solid things between the lens and Pip.
   *
   * `10-CONTROLS-AND-CAMERA.md` §4 asks for a dithered fade on occluders and a
   * *soft distance pull-in* for the hard cases. This is the pull-in half: it is
   * what a wood needs, because standing in La Arboleda otherwise parks the lens
   * inside a trunk and fills the frame with bark.
   */
  setOccluders(occluders: readonly PropCollider[]): void {
    this.occluders = occluders;
  }

  /**
   * The longest boom that still clears the ground, as a fraction of the one we
   * asked for. Walks out from Pip in a handful of steps and stops at the first
   * that would put the lens inside a hill — a distance check, not a raycast,
   * because the ground is a heightfield and a height lookup is one sample.
   */
  private clearFraction(distance: number, pitch: number): number {
    const hf = this.heightfield;
    if (!hf) return 1;
    const p = playerTransform;
    const dx = -Math.sin(this.yaw) * Math.cos(pitch);
    const dz = -Math.cos(this.yaw) * Math.cos(pitch);
    const dy = -Math.sin(pitch);
    const n = CAMERA.occlusionSamples;
    for (let i = 1; i <= n; i++) {
      const f = i / n;
      const d = distance * f;
      const sx = p.x + dx * d;
      const sz = p.z + dz * d;
      const y = p.y + dy * d;
      const ground = sampleHeight(hf, sx, sz);
      if (y < ground + CAMERA.occlusionClearanceM) {
        // Back off to the previous clean step, less the margin.
        const safe = Math.max(CAMERA.occlusionMinM, d - CAMERA.occlusionMarginM);
        return Math.min(1, safe / Math.max(0.001, distance));
      }
    }

    // **Trunks are solved, not sampled.** Six probes over a seven-metre boom is
    // a 1.17 m stride and a trunk is half a metre wide, so point-sampling walked
    // straight past them and the lens still ended up inside the wood. This is
    // the closest approach of the boom to each circle — exact, and cheaper than
    // the sampling it replaces.
    //
    // The projection runs on the **ground plane**, so it needs the horizontal
    // direction normalised. `(dx, dz)` is the horizontal part of a 3D unit
    // vector, so its own length is `cos(pitch)` — about 0.88, not 1. Projecting
    // against it silently scales every distance by that factor and the test
    // stops finding the trees it is there to find.
    const cosPitch = Math.cos(pitch) || 1;
    const hx = dx / cosPitch;
    const hz = dz / cosPitch;
    /** How far the boom reaches across the ground, as opposed to along itself. */
    const reach = distance * cosPitch;
    let nearest = reach;
    for (const o of this.occluders) {
      const ox = o.x - p.x;
      const oz = o.z - p.z;
      // How far along the ground track the occluder's centre projects…
      const t = ox * hx + oz * hz;
      if (t <= 0 || t >= nearest) continue;
      // …and how far off that track it sits there.
      const perpX = ox - hx * t;
      const perpZ = oz - hz * t;
      const r = o.cameraRadius ?? o.radius;
      if (perpX * perpX + perpZ * perpZ < r * r) nearest = t;
    }
    if (nearest < reach) {
      // Back into boom length, then clamp.
      const safe = Math.max(CAMERA.occlusionMinM, nearest / cosPitch - CAMERA.occlusionMarginM);
      return Math.min(1, safe / Math.max(0.001, distance));
    }
    return 1;
  }

  /** The camera's yaw, which the controller uses to rotate the input vector. */
  getYaw(): number {
    return this.yaw;
  }

  /** A drag outside the joystick zone orbits. Resets the auto-recentre clock. */
  orbit(deltaYaw: number): void {
    this.yaw += deltaYaw;
    this.sinceManualS = 0;
  }

  /** Two-finger pinch, clamped so no shot is ever too near or too far. */
  zoom(delta: number): void {
    this.targetDistance = Math.min(CAMERA.pinchMaxM, Math.max(CAMERA.pinchMinM, this.targetDistance + delta));
    this.sinceManualS = 0;
  }

  /** Snap behind Pip. Used on entry so the first frame is already composed. */
  snap(): void {
    this.yaw = playerTransform.yaw;
    this.distance = this.targetDistance;
    this.updateTargets();
    this.camera.position.copy(scratchDesired);
    this.lookAt.copy(scratchTarget);
    this.camera.lookAt(this.lookAt);
  }

  /**
   * Portrait screens see less horizontally; pull back so Pip stays the same size
   * relative to the SHORTER dimension rather than shrinking.
   */
  private aspectCompensation(): number {
    return Math.min(
      CAMERA.aspectDistanceMax,
      Math.max(CAMERA.aspectDistanceMin, CAMERA.targetAspect / Math.max(0.01, this.camera.aspect)),
    );
  }

  private updateTargets(): void {
    const p = playerTransform;
    const aspect = this.camera.aspect;
    const distance = this.distance * this.aspectCompensation() * this.clearance;
    const pitch = (CAMERA.pitchDeg * Math.PI) / 180;

    scratchDesired.set(
      p.x - Math.sin(this.yaw) * distance * Math.cos(pitch),
      p.y - Math.sin(pitch) * distance,
      p.z - Math.cos(this.yaw) * distance * Math.cos(pitch),
    );

    // The look-at sits a little above Pip and a little ahead of them, and in
    // portrait it lifts further so the joystick thumb never covers the character.
    const portraitLift = aspect < 1 ? CAMERA.portraitLookLiftM : 0;
    scratchTarget.set(
      p.x + Math.sin(p.yaw) * CAMERA.lookAheadM,
      p.y + PIP_HEIGHT_M * CAMERA.lookHeightFrac + portraitLift,
      p.z + Math.cos(p.yaw) * CAMERA.lookAheadM,
    );
  }

  /**
   * One step. Both damping rates use the exponential form and are **halved**
   * under reduced motion, along with auto-recentring being switched off.
   */
  update(dt: number): void {
    const p = playerTransform;
    this.sinceManualS += dt;

    // Auto-recentre behind Pip while moving, after the manual-camera timeout.
    if (this.autoRecentre && !this.reducedMotion && p.speed > 0.2 && this.sinceManualS > CAMERA.recentreDelayS) {
      let delta = p.yaw - this.yaw;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.yaw += delta * (1 - Math.exp(-CAMERA.posLambda * CAMERA.recentreLambdaScale * dt));
    }

    const scale = this.reducedMotion ? REDUCED_MOTION_DAMPING_SCALE : 1;
    const kPos = 1 - Math.exp(-CAMERA.posLambda * scale * dt);
    const kLook = 1 - Math.exp(-CAMERA.lookLambda * scale * dt);
    this.distance += (this.targetDistance - this.distance) * kPos;

    // Duck under the hillside and out of the wood. Shortening is near-instant so
    // the lens never enters anything; lengthening is slow so the shot opens back
    // up calmly.
    //
    // Tested against the **compensated** boom, which is what actually gets used.
    // Measuring clearance on the uncompensated distance and then applying the
    // fraction to the compensated one let a portrait camera sit up to 1.6x
    // further out than the clearance it just proved.
    const boom = this.distance * this.aspectCompensation();
    const wanted = this.clearFraction(boom, (CAMERA.pitchDeg * Math.PI) / 180);
    const lambda = wanted < this.clearance ? CAMERA.occlusionInLambda : CAMERA.occlusionOutLambda;
    this.clearance += (wanted - this.clearance) * (1 - Math.exp(-lambda * dt));

    this.updateTargets();
    this.camera.position.lerp(scratchDesired, kPos);
    this.lookAt.lerp(scratchTarget, kLook);
    this.camera.lookAt(this.lookAt);
  }
}

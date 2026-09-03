'use client';

import * as THREE from 'three';

import { CAMERA, PIP_HEIGHT_M, REDUCED_MOTION_DAMPING_SCALE } from '@/lib/world/config';
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

  private updateTargets(): void {
    const p = playerTransform;
    const aspect = this.camera.aspect;
    // Portrait screens see less horizontally; pull back so Pip stays the same
    // size relative to the SHORTER dimension rather than shrinking.
    const compensation = Math.min(
      CAMERA.aspectDistanceMax,
      Math.max(CAMERA.aspectDistanceMin, CAMERA.targetAspect / Math.max(0.01, aspect)),
    );
    const distance = this.distance * compensation;
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

    this.updateTargets();
    this.camera.position.lerp(scratchDesired, kPos);
    this.lookAt.lerp(scratchTarget, kLook);
    this.camera.lookAt(this.lookAt);
  }
}

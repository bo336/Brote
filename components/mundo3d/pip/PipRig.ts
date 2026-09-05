'use client';

import { PIP, PIP_RIG } from '@/lib/world/config';
import type { PlayerState } from '@/lib/world/types';
import type { PipRoot } from '@/lib/render/geometry/pip';
import { playerTransform } from '../state/usePlayerStore';

/**
 * Pip's animation. **100% procedural** (`09-PIP.md` §3).
 *
 * No `SkinnedMesh`, no `AnimationMixer`, no glTF clips, no morph targets for
 * locomotion. For a rounded mascot this is not a compromise — squash-and-stretch
 * IS the native language of blob characters, and it costs a handful of
 * `Math.sin` calls and zero asset bytes.
 *
 * **This class is the ONE owner of Pip's transform.** The old code wrapped
 * `Pip3D` in drei's `<Float>` on top of its own `useFrame` position write, so
 * two systems fought over one object (`02-AUDIT.md` §5). There is no `<Float>`
 * here and there never will be.
 */
const DEG = Math.PI / 180;

export class PipRig {
  private root: PipRoot;
  /** Hop phase, in radians. Squash is the *derivative* of this, never a timer. */
  private hopPhase = 0;
  private lean = 0;
  private leanVelocity = 0;
  private leafYaw = 0;
  private idleT = 0;
  private blinkAt = 0;
  private blinkT = -1;
  private lookYaw = 0;
  private lookTarget = 0;
  private nextLookAt = 0;
  /** Milliseconds of anticipation squash left before the first hop. */
  private anticipation = 0;
  private wasMoving = false;
  private state: PlayerState = 'idle';

  constructor(root: PipRoot) {
    this.root = root;
    this.blinkAt = PIP_RIG.lookAroundEveryS * 0.5;
  }

  setState(state: PlayerState): void {
    this.state = state;
  }

  /**
   * One step. Reads `playerTransform`, writes the root's transform and the
   * body's scale. No allocation: every value below is a number.
   */
  update(dt: number, elapsed: number): void {
    const p = playerTransform;
    const u = this.root.userData;
    const moving = p.speed > 0.08 && this.state !== 'rest';

    // ── Anticipation: a squash BEFORE the first hop, so starting has weight.
    if (moving && !this.wasMoving) this.anticipation = PIP_RIG.anticipationMs;
    if (!moving && this.wasMoving) {
      // Counter-lean overshoot on stop. Throwing the lean the other way is what
      // makes Pip read as having mass rather than as a sprite that halted.
      this.leanVelocity = -this.lean * PIP_RIG.counterLean * 60;
    }
    this.wasMoving = moving;
    if (this.anticipation > 0) this.anticipation -= dt * 1000;

    // ── Hop-walk. A blob that hops needs no legs and reads instantly.
    let hop = 0;
    let hopDerivative = 0;
    if (moving) {
      const hz = Math.max(PIP_RIG.hopHzMin, p.speed * PIP_RIG.hopHzPerSpeed);
      this.hopPhase += dt * hz * Math.PI * 2;
      // `abs(sin)` gives two hops per cycle: contact, apex, contact.
      hop = Math.abs(Math.sin(this.hopPhase)) * PIP_RIG.hopHeightM;
      hopDerivative = Math.cos(this.hopPhase) * Math.sign(Math.sin(this.hopPhase) || 1);
    } else {
      this.hopPhase = 0;
    }

    // ── Squash and stretch, driven by the hop's derivative so they can never
    //    drift out of sync with the motion that causes them.
    let sx = 1;
    let sy = 1;
    if (this.anticipation > 0) {
      const a = this.anticipation / PIP_RIG.anticipationMs;
      sx = 1 + (PIP_RIG.squashContact - 1) * a;
    } else if (moving) {
      // Rising: stretch. Falling: squash. `hopDerivative` is +1 at take-off.
      const t = (hopDerivative + 1) / 2;
      sx = PIP_RIG.squashContact + (PIP_RIG.stretchApex - PIP_RIG.squashContact) * t;
    } else {
      // Idle breathing, ±2% at 0.4 Hz. Idle life is what sells a mascot.
      this.idleT += dt;
      sy = 1 + Math.sin(this.idleT * PIP_RIG.breathHz * Math.PI * 2) * PIP_RIG.breathAmp;
      sx = 1 / Math.sqrt(sy);
    }
    if (moving) sy = 1 / (sx * sx); // preserve volume: x·y·z ≈ 1
    u.body.scale.set(sx, sy, sx);
    u.pattern?.scale.set(sx, sy, sx);
    u.face.scale.set(sx, sy, sx);

    // ── Lean toward movement, damped, clamped.
    const targetLean = Math.min(PIP_RIG.leanMaxDeg, p.speed * PIP_RIG.leanPerSpeed) * DEG;
    const k = 1 - Math.exp(-PIP_RIG.leanLambda * dt);
    this.lean += (this.leanVelocity * dt) + ((moving ? targetLean : 0) - this.lean) * k;
    this.leanVelocity *= 1 - k;

    // ── Place the root. Position and yaw come from the controller; the hop, the
    //    lean and every scale below come from here. One owner, one transform.
    this.root.position.set(p.x, p.y + hop, p.z);
    this.root.rotation.set(this.lean, p.yaw + this.lookYaw, 0);

    // ── The leaf trails the body's rotation and overshoots. Secondary motion is
    //    most of the charm, and it is nearly free.
    const leafLambda = 1000 / PIP_RIG.leafLagMs;
    const leafK = 1 - Math.exp(-leafLambda * dt);
    const leafTarget = -this.lean * PIP_RIG.leafOvershoot;
    this.leafYaw += (leafTarget - this.leafYaw) * leafK;
    u.leaves.rotation.z = this.leafYaw;
    u.leaves.rotation.x = Math.sin(elapsed * PIP_RIG.leafIdleHz) * PIP_RIG.leafIdleAmp;

    this.updateFace(dt, elapsed);
  }

  /** Blink and look-around: two small behaviours that stop Pip reading as dead. */
  private updateFace(dt: number, elapsed: number): void {
    const u = this.root.userData;

    if (this.blinkT >= 0) {
      this.blinkT += dt * 1000;
      const t = this.blinkT / PIP.blinkMs;
      // A blink is a squash on the eyes' Y axis, not a texture swap.
      u.eyes.scale.y = t < 1 ? Math.max(0.08, Math.abs(Math.cos(t * Math.PI))) : 1;
      if (t >= 1) {
        this.blinkT = -1;
        u.eyes.scale.y = 1;
      }
    } else if (elapsed > this.blinkAt) {
      this.blinkT = 0;
      // Deterministic-enough jitter without touching the world PRNG.
      const jitter = (Math.sin(elapsed * 12.9898) * 43758.5453) % 1;
      this.blinkAt = elapsed + PIP.blinkMinS + Math.abs(jitter) * (PIP.blinkMaxS - PIP.blinkMinS);
    }

    // An occasional idle glance, only while standing still.
    if (this.state === 'idle' || this.state === 'rest') {
      if (elapsed > this.nextLookAt) {
        const jitter = (Math.sin(elapsed * 78.233) * 43758.5453) % 1;
        this.lookTarget = jitter * PIP_RIG.lookAroundDeg * DEG;
        this.nextLookAt = elapsed + PIP_RIG.lookAroundEveryS;
      }
    } else {
      this.lookTarget = 0;
    }
    this.lookYaw += (this.lookTarget - this.lookYaw) * (1 - Math.exp(-PIP_RIG.lookLambda * dt));
  }
}

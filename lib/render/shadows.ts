/**
 * Blob shadows — **one draw call for every shadow in the game**.
 *
 * T0-T2 get no shadow map at all (`06-ART-DIRECTION.md` §7). A real shadow pass
 * is a second render over most of the scene; this is one `InstancedMesh` of a
 * circle with a radial-gradient alpha, from a single generated 64×64 canvas
 * texture. The old world had `castShadow` on most objects, which is what
 * near-doubled its draw calls.
 *
 * Foliage never gets one: it is grounded by its vertex AO and by the blob under
 * the clump it belongs to.
 */
import * as THREE from 'three';

import { BLOB_SHADOW } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';

/** Scratch at module scope — this runs every frame for every caster. */
const scratchMatrix = new THREE.Matrix4();
const scratchPos = new THREE.Vector3();
const scratchQuat = new THREE.Quaternion();
const scratchScale = new THREE.Vector3();
const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const HIDDEN = new THREE.Vector3(0, 0, 0);
/** Lift the decal off the ground so it does not z-fight with the terrain. */
// A small physical lift on top of the depth bias, so a shadow on a steep bank
// still clears its own ground rather than relying on the offset alone.
const LIFT = 0.03;

/**
 * A caster that has no `Object3D` to follow — an instanced animal, which exists
 * only as a matrix in a pool. Its owner writes the position each frame.
 */
export interface PointCaster {
  x: number;
  y: number;
  z: number;
  footprint: number;
}

export interface ShadowCaster {
  /** The object to follow, or null for a caster the owner positions itself. */
  object: THREE.Object3D | null;
  /** Radius of the shadow on the ground, in metres. */
  footprint: number;
  /** Where a null-object caster currently is. Ignored otherwise. */
  point: PointCaster | null;
}

/** The one radial-gradient texture. Generated, cached, disposed with the pool. */
export function buildBlobTexture(): THREE.Texture {
  const size = BLOB_SHADOW.textureSize;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,1)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.75)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.name = 'blobShadow';
  return tex;
}

export class BlobShadowPool {
  readonly mesh: THREE.InstancedMesh;
  private casters: (ShadowCaster | null)[] = [];
  /**
   * Slot 0 up to `movingMax` belongs to things that move; everything above it
   * to things that do not.
   *
   * A tree's shadow never moves, and there are two hundred trees to one Pip.
   * Static slots are written once at placement and skipped by `update` forever
   * after, which is what makes grounding the whole island cost the same per
   * frame as grounding Pip alone. The ranges are **fixed at construction**
   * rather than filled in arrival order, because React runs a child's effects
   * before its parent's — the trees would otherwise claim their slots before
   * Pip claimed his.
   */
  private readonly movingMax: number;
  /** Highest static slot ever handed out, and the ones handed back since. */
  private statics = 0;
  private freeStatics: number[] = [];

  constructor(material: THREE.Material, movingMax: number, staticMax = 0) {
    const quad = new THREE.PlaneGeometry(1, 1);
    this.movingMax = Math.max(1, movingMax);
    this.mesh = new THREE.InstancedMesh(quad, material, this.movingMax + staticMax);
    this.mesh.name = 'blobShadows';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Every mover slot exists from the start, hidden until something claims it.
    this.casters = new Array(this.movingMax).fill(null);
    this.mesh.count = this.movingMax;
    // Decals sit flush on the ground; writing depth would fight the terrain.
    this.mesh.renderOrder = 1;
  }

  /** Register a moving caster. Returns its slot, or -1 when the pool is full. */
  attach(object: THREE.Object3D, footprint: number): number {
    for (let i = 0; i < this.movingMax; i++) {
      if (this.casters[i] === null) {
        this.casters[i] = { object, footprint, point: null };
        return i;
      }
    }
    return -1;
  }

  detach(slot: number): void {
    if (slot >= 0 && slot < this.movingMax) this.casters[slot] = null;
  }

  /**
   * Ground something that will never move again: a tree, a rock, a bench.
   * Writes its matrix once and takes no per-frame cost at all.
   *
   * Static casters must be added AFTER every moving one, because `update`
   * stops at the first static slot.
   */
  addStatic(hf: Heightfield, x: number, z: number, footprint: number): number {
    // A released slot is reused before the pool grows, so an effect that re-runs
    // (a tier change, a new biome) replaces its shadows instead of stacking a
    // second set on top of the first.
    const reused = this.freeStatics.pop();
    const i = reused ?? this.movingMax + this.statics;
    if (i >= this.mesh.instanceMatrix.count) return -1;
    if (reused === undefined) {
      this.statics++;
      this.mesh.count = i + 1;
    }
    scratchPos.set(x, sampleHeight(hf, x, z) + LIFT, z);
    scratchScale.set(footprint * 2, footprint * 2, 1);
    scratchMatrix.compose(scratchPos, FLAT, scratchScale);
    this.mesh.setMatrixAt(i, scratchMatrix);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.computeBoundingSphere();
    return i;
  }

  /**
   * Register a mover with no `Object3D` — an instanced animal, which exists only
   * as a matrix inside a pool and has nothing for `getWorldPosition` to read.
   * The owner calls `movePoint` each frame.
   */
  attachPoint(footprint: number): number {
    for (let i = 0; i < this.movingMax; i++) {
      if (this.casters[i] === null) {
        this.casters[i] = { object: null, footprint, point: { x: 0, y: 0, z: 0, footprint } };
        return i;
      }
    }
    return -1;
  }

  /** Where a point caster is this frame. */
  movePoint(slot: number, x: number, y: number, z: number): void {
    const caster = slot >= 0 && slot < this.movingMax ? this.casters[slot] : null;
    if (caster?.point) {
      caster.point.x = x;
      caster.point.y = y;
      caster.point.z = z;
    }
  }

  /** Hand a static slot back. The caller releases what it placed. */
  releaseStatic(slot: number): void {
    if (slot < this.movingMax || slot >= this.movingMax + this.statics) return;
    if (this.freeStatics.includes(slot)) return;
    scratchMatrix.compose(scratchPos.set(0, 0, 0), FLAT, HIDDEN);
    this.mesh.setMatrixAt(slot, scratchMatrix);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.freeStatics.push(slot);
  }

  /**
   * Re-place every shadow on the terrain beneath its caster, scaled by
   * footprint and **faded by height above the ground** — so a gliding Pip's
   * shadow spreads and softens instead of following at full strength.
   */
  update(hf: Heightfield): void {
    // Movers only. Everything above `movingMax` was placed once and is not
    // going anywhere.
    for (let i = 0; i < this.movingMax; i++) {
      const caster = this.casters[i];
      if (!caster) {
        scratchMatrix.compose(scratchPos.set(0, 0, 0), scratchQuat.identity(), HIDDEN);
        this.mesh.setMatrixAt(i, scratchMatrix);
        continue;
      }
      if (caster.object) caster.object.getWorldPosition(scratchPos);
      else scratchPos.set(caster.point!.x, caster.point!.y, caster.point!.z);
      const ground = sampleHeight(hf, scratchPos.x, scratchPos.z);
      const height = Math.max(0, scratchPos.y - ground);
      const fade = Math.max(0, 1 - height / BLOB_SHADOW.fadeHeightM);
      // Higher up: wider and weaker. The scale carries both, since the alpha is
      // baked into the texture and the material is shared.
      const spread = caster.footprint * (1 + height * 0.35) * (fade > 0 ? 1 : 0);
      scratchPos.y = ground + LIFT;
      scratchScale.set(spread * 2, spread * 2, 1);
      scratchMatrix.compose(scratchPos, FLAT, scratchScale);
      this.mesh.setMatrixAt(i, scratchMatrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    // **Recompute the bounds every frame.** An `InstancedMesh` keeps the base
    // geometry's bounding sphere until told otherwise — here, a 1x1 quad at the
    // origin. Every shadow on the island would vanish the moment the camera
    // stopped looking at the middle of it. This is O(count) over a few hundred
    // matrices and allocates nothing (three reuses module scratch for it).
    this.mesh.computeBoundingSphere();
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.dispose();
    this.casters = [];
    this.statics = 0;
    this.freeStatics = [];
  }
}

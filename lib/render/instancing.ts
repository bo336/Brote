/**
 * `InstancePool` — **every instanced mesh in the game goes through this.**
 *
 * Draw calls are the budget (`07-RENDER-ARCHITECTURE.md` §6). The old world
 * drew ~150-200 of them, near-doubled by a shadow pass, for a scene that could
 * have been a couple of dozen. One geometry plus one material plus N matrices
 * is one draw call, and that is where nearly all the wins are.
 *
 * Two rules this class exists to enforce:
 *
 *  1. **No scene file allocates its own `InstancedMesh`.** They come from here,
 *     so there is one place that knows how to dispose them.
 *  2. **A quality-tier change never re-creates geometry.** The pool is built at
 *     its maximum size once; `resize()` moves `mesh.count`, which is free. That
 *     is what makes a tier change cost nothing and drop no frame.
 */
import * as THREE from 'three';

/** Scratch, at module scope: nothing here may allocate per instance or per frame. */
const scratchMatrix = new THREE.Matrix4();
const scratchQuat = new THREE.Quaternion();
const scratchPos = new THREE.Vector3();
const scratchScale = new THREE.Vector3();
const scratchEuler = new THREE.Euler();
const HIDDEN_SCALE = new THREE.Vector3(0, 0, 0);

export interface InstancePoolOptions {
  /** Per-instance colour, for tint variation without a second material. */
  colors?: boolean;
  /** Cast a name so the perf overlay and the scene graph stay readable. */
  name?: string;
  /**
   * `frustumCulled={false}` is banned without a measured reason
   * (`01-RULES.md` §3.6). Pass one here and it is recorded on the mesh.
   */
  disableCullingBecause?: string;
}

export class InstancePool {
  readonly mesh: THREE.InstancedMesh;
  readonly max: number;
  private used = 0;

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    max: number,
    opts: InstancePoolOptions = {},
  ) {
    this.max = Math.max(0, Math.floor(max));
    this.mesh = new THREE.InstancedMesh(geometry, material, this.max);
    this.mesh.name = opts.name ?? 'instances';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Start empty: a pool with `count = max` and no matrices written renders
    // `max` copies of an identity transform stacked at the origin.
    this.mesh.count = 0;
    if (opts.colors) {
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 3).fill(1), 3);
      this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    if (opts.disableCullingBecause) {
      this.mesh.frustumCulled = false;
      this.mesh.userData.cullingDisabledBecause = opts.disableCullingBecause;
    }
  }

  /** Claim the next slot, or -1 when the pool is full. */
  alloc(): number {
    if (this.used >= this.max) return -1;
    return this.used++;
  }

  /** How many slots have been claimed. */
  get count(): number {
    return this.used;
  }

  setMatrix(i: number, m: THREE.Matrix4): void {
    if (i < 0 || i >= this.max) return;
    this.mesh.setMatrixAt(i, m);
  }

  /** The common case: position, Y rotation and a uniform scale. No allocation. */
  place(i: number, x: number, y: number, z: number, rotY: number, scale: number, tiltX = 0, tiltZ = 0): void {
    if (i < 0 || i >= this.max) return;
    scratchPos.set(x, y, z);
    scratchEuler.set(tiltX, rotY, tiltZ);
    scratchQuat.setFromEuler(scratchEuler);
    scratchScale.set(scale, scale, scale);
    scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
    this.mesh.setMatrixAt(i, scratchMatrix);
  }

  setColor(i: number, color: THREE.Color): void {
    if (i < 0 || i >= this.max || !this.mesh.instanceColor) return;
    this.mesh.setColorAt(i, color);
  }

  /** Collapse an instance to zero scale. Cheaper than re-packing the buffer. */
  hide(i: number): void {
    if (i < 0 || i >= this.max) return;
    scratchMatrix.compose(scratchPos.set(0, 0, 0), scratchQuat.identity(), HIDDEN_SCALE);
    this.mesh.setMatrixAt(i, scratchMatrix);
  }

  /**
   * Show the first `n` instances. This is the whole cost of a quality-tier
   * change for this pool: one integer, no geometry, no material, no frame drop.
   */
  resize(n: number): void {
    this.mesh.count = Math.max(0, Math.min(this.used, Math.floor(n)));
  }

  /** Upload whatever changed. Call once after a batch of writes, never per instance. */
  commit(): void {
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.computeBoundingSphere();
  }

  /**
   * Dispose the mesh only. Geometry and material belong to the caches in
   * `lib/render/geometry` and `lib/render/materials`, which own their own
   * disposal — freeing them here would pull them out from under another pool.
   */
  dispose(): void {
    this.mesh.dispose();
    this.used = 0;
  }
}

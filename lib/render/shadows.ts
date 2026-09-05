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
const LIFT = 0.012;

export interface ShadowCaster {
  /** The object to follow. Read-only here — the rig owns its transform. */
  object: THREE.Object3D;
  /** Radius of the shadow on the ground, in metres. */
  footprint: number;
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

  constructor(material: THREE.Material, max: number) {
    const quad = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.InstancedMesh(quad, material, Math.max(1, max));
    this.mesh.name = 'blobShadows';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    // Decals sit flush on the ground; writing depth would fight the terrain.
    this.mesh.renderOrder = 1;
  }

  /** Register a caster. Returns its slot, or -1 when the pool is full. */
  attach(object: THREE.Object3D, footprint: number): number {
    if (this.casters.length >= this.mesh.instanceMatrix.count) return -1;
    this.casters.push({ object, footprint });
    this.mesh.count = this.casters.length;
    return this.casters.length - 1;
  }

  detach(slot: number): void {
    if (slot >= 0 && slot < this.casters.length) this.casters[slot] = null;
  }

  /**
   * Re-place every shadow on the terrain beneath its caster, scaled by
   * footprint and **faded by height above the ground** — so a gliding Pip's
   * shadow spreads and softens instead of following at full strength.
   */
  update(hf: Heightfield): void {
    for (let i = 0; i < this.casters.length; i++) {
      const caster = this.casters[i];
      if (!caster) {
        scratchMatrix.compose(scratchPos.set(0, 0, 0), scratchQuat.identity(), HIDDEN);
        this.mesh.setMatrixAt(i, scratchMatrix);
        continue;
      }
      caster.object.getWorldPosition(scratchPos);
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
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.dispose();
    this.casters = [];
  }
}

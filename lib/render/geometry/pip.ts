/**
 * Pip, built in code.
 *
 * **Decision: Pip's geometry is generated, not modelled** (`09-PIP.md` §2). A
 * blob is trivially generated — a sphere with a vertical squash and a slight
 * taper is exactly the 2D SVG's silhouette — so it ships zero asset bytes,
 * needs no loader, no Draco and no KTX2, makes cosmetics parameters rather than
 * files, and gets three LODs for free.
 *
 * Sockets are plain `Object3D`s. Because Pip is procedurally animated, they
 * inherit squash-and-stretch for nothing. If Pip is ever skinned they become
 * bone-attached and this API does not change.
 *
 * **Colour lives in `attributes.color`, not in a material.** Equipping a hat or
 * changing a palette rewrites a Float32Array; it never compiles a shader and
 * never allocates a material, which is the rule that matters
 * (`09-PIP.md` §4.1) and also what keeps the whole game inside its budget of
 * eight live materials.
 */
import * as THREE from 'three';

import { PIP } from '@/lib/world/config';
import type { PipCosmetics } from '@/lib/world/types';
import type { PipStage } from '@/lib/mundo';
import { PIP_PARTS } from '../palette';
import { buildGlasses, buildHat, mergePainted, paletteFor } from './pip-cosmetics';
import { patternOffset } from './pip-patterns';

export { buildGlasses, buildHat } from './pip-cosmetics';
export { buildPatternAtlas, PATTERN_ATLAS, PATTERN_IDS, patternOffset } from './pip-patterns';
export { GLASSES_IDS, HAT_IDS } from './pip-cosmetics';

/** 0 full, 1 the mid distance, 2 the far silhouette and the poster. */
export type PipLod = 0 | 1 | 2;

const SEGMENTS: Record<PipLod, [number, number]> = {
  0: [24, 16],
  1: [16, 11],
  2: [10, 7],
};

export interface PipRoot extends THREE.Group {
  userData: {
    lod: PipLod;
    body: THREE.Mesh;
    pattern: THREE.Mesh | null;
    leaves: THREE.Mesh;
    face: THREE.Object3D;
    eyes: THREE.Mesh;
    headSocket: THREE.Object3D;
    glassesSocket: THREE.Object3D;
    aura: THREE.Mesh;
    /** Which hat/glasses geometry is mounted, so equipping is idempotent. */
    hatId: string;
    glassesId: string;
  };
}

const scratchColor = new THREE.Color();

/** Repaint an existing colour attribute in place. No allocation, no material. */
function repaint(mesh: THREE.Mesh, hex: string): void {
  const attr = mesh.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!attr) return;
  scratchColor.set(hex);
  const arr = attr.array as Float32Array;
  for (let i = 0; i < arr.length; i += 3) {
    arr[i] = scratchColor.r;
    arr[i + 1] = scratchColor.g;
    arr[i + 2] = scratchColor.b;
  }
  attr.needsUpdate = true;
}

/** Paint a fresh geometry one flat colour. */
function paint(geo: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  scratchColor.set(hex);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = scratchColor.r;
    colors[i * 3 + 1] = scratchColor.g;
    colors[i * 3 + 2] = scratchColor.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/** The body: a sphere, squashed and tapered toward the crown. Clay, not a ball. */
function buildBody(lod: PipLod): THREE.BufferGeometry {
  const [w, h] = SEGMENTS[lod];
  const geo = new THREE.SphereGeometry(PIP.bodyRadius, w, h);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // Taper: narrow the upper half so the crown reads as a seed, not a marble.
    const t = Math.max(0, y / PIP.bodyRadius);
    const taper = 1 - (1 - PIP.bodyTaper) * t * t;
    pos.setXYZ(i, pos.getX(i) * taper, y * PIP.bodyScaleY, pos.getZ(i) * taper * PIP.bodyScaleZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/** The leaf profile: a rounded blade, extruded flat and bevelled by its sphere. */
function buildLeaf(): THREE.BufferGeometry {
  const leaf = new THREE.SphereGeometry(PIP.leafLength / 2, 9, 6);
  leaf.scale(1, 0.16, PIP.leafWidth / PIP.leafLength);
  leaf.translate(PIP.leafLength / 2, 0, 0);
  return leaf;
}

/**
 * The whole character. Every cosmetic socket exists from the start; equipping
 * toggles `visible` rather than loading anything.
 */
export function buildPip(lod: PipLod = 0): PipRoot {
  const [w, h] = SEGMENTS[lod];
  const root = new THREE.Group() as PipRoot;
  root.name = 'pipRoot';

  const body = new THREE.Mesh(paint(buildBody(lod), '#ffffff'));
  body.name = 'body';
  body.position.y = PIP.bodyCentreY;
  root.add(body);

  // The pattern shell: the same shape a hair larger, alpha-mapped from the
  // atlas. Dropped at LOD 2, where it would be sub-pixel anyway.
  let pattern: THREE.Mesh | null = null;
  if (lod < 2) {
    const shell = buildBody(lod);
    shell.scale(1.012, 1.012, 1.012);
    pattern = new THREE.Mesh(paint(shell, '#ffffff'));
    pattern.name = 'pattern';
    pattern.position.y = PIP.bodyCentreY;
    pattern.visible = false;
    root.add(pattern);
  }

  // Stem and leaves, as one mesh so the leaf trail moves them together.
  const crown = PIP.bodyCentreY + PIP.bodyRadius * PIP.bodyScaleY;
  const stem = new THREE.CylinderGeometry(PIP.stemRadius, PIP.stemRadius * 1.4, PIP.stemHeight, 6);
  stem.translate(0, PIP.stemHeight / 2, 0);
  const leafA = buildLeaf();
  leafA.rotateZ(0.5);
  leafA.translate(0.012, PIP.stemHeight * 0.85, 0);
  const leafB = buildLeaf();
  leafB.rotateZ(0.34);
  leafB.rotateY(Math.PI * 0.82);
  leafB.translate(-0.012, PIP.stemHeight * 0.62, 0.01);
  const leaves = new THREE.Mesh(
    mergePainted([paint(stem, '#ffffff'), paint(leafA, '#ffffff'), paint(leafB, '#ffffff')]),
  );
  leaves.name = 'leaves';
  leaves.position.y = crown - 0.01;
  root.add(leaves);

  // The face. One mesh: two eyes, two shines, a mouth, and (above LOD 2) cheeks.
  const faceParts: THREE.BufferGeometry[] = [];
  const front = PIP.bodyRadius * PIP.bodyScaleZ * PIP.eyeDepth;
  for (const side of [-1, 1]) {
    const eye = new THREE.SphereGeometry(PIP.eyeRadius, w >> 1, h >> 1);
    eye.scale(1, 1.1, 0.6);
    eye.translate(side * PIP.eyeSpread, PIP.eyeHeight, front);
    faceParts.push(paint(eye, PIP_PARTS.eye));
    const shine = new THREE.SphereGeometry(PIP.eyeRadius * 0.32, 5, 4);
    shine.translate(side * PIP.eyeSpread + 0.011, PIP.eyeHeight + 0.013, front + 0.014);
    faceParts.push(paint(shine, PIP_PARTS.shine));
    if (lod < 2) {
      const cheek = new THREE.SphereGeometry(PIP.cheekRadius, 6, 5);
      cheek.scale(1, 0.62, 0.34);
      cheek.translate(side * PIP.cheekSpread, PIP.eyeHeight - 0.05, front * 0.82);
      faceParts.push(paint(cheek, PIP_PARTS.cheek));
    }
  }
  const mouth = new THREE.TorusGeometry(PIP.mouthWidth / 2, 0.006, 4, 8, Math.PI);
  mouth.rotateZ(Math.PI);
  mouth.scale(1, 0.7, 0.5);
  mouth.translate(0, PIP.eyeHeight - 0.062, front);
  faceParts.push(paint(mouth, PIP_PARTS.mouth));

  const eyes = new THREE.Mesh(mergePainted(faceParts));
  eyes.name = 'face';
  const face = new THREE.Object3D();
  face.name = 'faceSocket';
  face.position.y = PIP.bodyCentreY;
  face.add(eyes);
  root.add(face);

  const headSocket = new THREE.Object3D();
  headSocket.name = 'headSocket';
  headSocket.position.y = crown - 0.012;
  root.add(headSocket);

  const glassesSocket = new THREE.Object3D();
  glassesSocket.name = 'glassesSocket';
  glassesSocket.position.set(0, PIP.bodyCentreY + PIP.eyeHeight, front + 0.02);
  root.add(glassesSocket);

  const auraGeo = new THREE.SphereGeometry(PIP.auraRadius, 12, 8);
  const aura = new THREE.Mesh(paint(auraGeo, PIP_PARTS.aura));
  aura.name = 'aura';
  aura.position.y = PIP.bodyCentreY;
  aura.visible = false;
  root.add(aura);

  root.userData = {
    lod, body, pattern, leaves, face, eyes, headSocket, glassesSocket, aura,
    hatId: 'ninguno', glassesId: 'ninguno',
  };
  return root;
}

/**
 * Apply a cosmetics object. **Pure and imperative, and nothing else in the
 * codebase decides how Pip looks** (`09-PIP.md` §4).
 *
 * `material` is the shared clay material Pip is drawn with; the pattern mesh
 * takes the atlas-mapped one. Both are passed in so this function never reaches
 * for a cache and never creates anything.
 */
export function applyCosmetics(
  root: PipRoot,
  cosmetics: PipCosmetics,
  opts: { golden?: boolean; aura?: boolean; solid: THREE.Material; patternMaterial?: THREE.Material } = {
    solid: new THREE.MeshBasicMaterial(),
  },
): void {
  const u = root.userData;
  const [body, bodyDeep, leaf, leafDeep] = paletteFor(cosmetics.body, opts.golden ?? false);

  u.body.material = opts.solid;
  repaint(u.body, body);
  u.leaves.material = opts.solid;
  // The stem takes the deep body tone; both leaves take the leaf pair. Repaint
  // walks the whole attribute, so the leaves are recoloured by range below.
  repaintLeaves(u.leaves, bodyDeep, leaf, leafDeep);
  u.eyes.material = opts.solid;

  // Hat: mount the geometry, or hide the socket entirely.
  const hatId = cosmetics.hat ?? 'ninguno';
  if (hatId !== u.hatId) {
    u.headSocket.clear();
    const geo = buildHat(hatId);
    if (geo) u.headSocket.add(new THREE.Mesh(geo, opts.solid));
    u.hatId = hatId;
  } else if (u.headSocket.children[0]) {
    (u.headSocket.children[0] as THREE.Mesh).material = opts.solid;
  }

  const glassesId = cosmetics.glasses ?? 'ninguno';
  if (glassesId !== u.glassesId) {
    u.glassesSocket.clear();
    const geo = buildGlasses(glassesId);
    if (geo) u.glassesSocket.add(new THREE.Mesh(geo, opts.solid));
    u.glassesId = glassesId;
  } else if (u.glassesSocket.children[0]) {
    (u.glassesSocket.children[0] as THREE.Mesh).material = opts.solid;
  }

  // Pattern: one texture, moved by UV offset. Never a different texture object.
  if (u.pattern && opts.patternMaterial) {
    const offset = patternOffset(cosmetics.pattern ?? 'ninguno');
    u.pattern.visible = offset !== null;
    if (offset) {
      u.pattern.material = opts.patternMaterial;
      repaint(u.pattern, bodyDeep);
      const map = (opts.patternMaterial as THREE.MeshLambertMaterial).map;
      if (map) {
        map.offset.set(offset[0], offset[1]);
        map.repeat.set(1 / 3, 1 / 2);
      }
    }
  }

  u.aura.material = opts.solid;
  u.aura.visible = !!opts.aura;
  repaint(u.aura, opts.golden ? PIP_PARTS.auraGolden : PIP_PARTS.aura);
}

/**
 * The stem is the first slice of the merged leaves mesh and each leaf the next
 * two; repainting by range keeps them one draw call while still letting the
 * palette drive three separate colours.
 */
function repaintLeaves(mesh: THREE.Mesh, stem: string, leafA: string, leafB: string): void {
  const attr = mesh.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!attr) return;
  const arr = attr.array as Float32Array;
  const third = Math.floor(arr.length / 3 / 3) * 3;
  const bands: [number, number, string][] = [
    [0, third, stem],
    [third, third * 2, leafA],
    [third * 2, arr.length, leafB],
  ];
  for (const [from, to, hex] of bands) {
    scratchColor.set(hex);
    for (let i = from; i < to; i += 3) {
      arr[i] = scratchColor.r;
      arr[i + 1] = scratchColor.g;
      arr[i + 2] = scratchColor.b;
    }
  }
  attr.needsUpdate = true;
}

/**
 * `mundo_state.pipStage` finally drives something: the leaf.
 *
 * seed = a bare stem; sprout = one leaf; leafy = two; guardian = two plus the
 * aura; radiant = golden with a shimmer (`09-PIP.md` §4). A five-line change
 * that makes an existing, persisted, never-rendered data field visible.
 */
export function applyStage(root: PipRoot, stage: PipStage): void {
  const u = root.userData;
  const scale = stage === 'seed' ? 0 : stage === 'sprout' ? 0.62 : 1;
  u.leaves.scale.setScalar(Math.max(0.0001, scale));
  u.leaves.visible = stage !== 'seed';
  u.aura.visible = stage === 'guardian' || stage === 'radiant';
}

/** Free everything this root owns. Cosmetic geometry is cached and shared. */
export function disposePip(root: PipRoot): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    // Hat and glasses geometries live in the module cache and are reused by
    // every Pip; only this root's own meshes are ours to dispose.
    if (mesh.parent === root.userData.headSocket || mesh.parent === root.userData.glassesSocket) return;
    mesh.geometry.dispose();
  });
  root.clear();
}

/**
 * The sky: one inverted sphere with a two-stop vertical gradient, plus a cheap
 * star field at night. **No skybox textures** (`06-ART-DIRECTION.md` §6).
 *
 * The gradient lives in `attributes.color`, so changing time of day rewrites a
 * few hundred floats rather than uploading anything — and the dome shares the
 * one flat vertex-coloured material with the mist wall and the stars, which is
 * how the whole game stays inside its budget of eight live materials.
 */
import * as THREE from 'three';

import type { TimeOfDay } from '@/lib/world/types';
import { mulberry32 } from '@/lib/world/rng';
import type { WorldPalette } from './palette';

/** Far enough to sit behind everything, near enough to stay inside the far plane. */
const SKY_RADIUS = 400;
const SKY_SEGMENTS = 24;
const SKY_RINGS = 16;
/** Where the horizon colour gives way to the top colour, as a fraction of height. */
const HORIZON_BLEND = 0.55;

const scratchTop = new THREE.Color();
const scratchHorizon = new THREE.Color();

export interface Sky {
  dome: THREE.Mesh;
  stars: THREE.InstancedMesh | null;
  /** 0 = day, 1 = full night. Drives the star opacity. */
  nightness: number;
}

/**
 * Paint the dome. Called once at build and again on every time-of-day change —
 * both are cheap, and neither touches a texture or a material.
 */
export function paintSky(dome: THREE.Mesh, palette: WorldPalette): void {
  const geo = dome.geometry;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  let attr = geo.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (!attr) {
    // Four components: the sky is opaque (alpha 1) but shares its material with
    // the mist wall, which is not — and one material for both is what keeps the
    // whole game inside its budget of eight.
    attr = new THREE.BufferAttribute(new Float32Array(pos.count * 4), 4);
    geo.setAttribute('color', attr);
  }
  const arr = attr.array as Float32Array;
  scratchTop.set(palette.skyTop);
  scratchHorizon.set(palette.skyHorizon);
  for (let i = 0; i < pos.count; i++) {
    // Two stops: horizon at and below y = 0, top by `HORIZON_BLEND` of the way up.
    const h = Math.min(1, Math.max(0, pos.getY(i) / (SKY_RADIUS * HORIZON_BLEND)));
    const t = h * h;
    arr[i * 4] = scratchHorizon.r + (scratchTop.r - scratchHorizon.r) * t;
    arr[i * 4 + 1] = scratchHorizon.g + (scratchTop.g - scratchHorizon.g) * t;
    arr[i * 4 + 2] = scratchHorizon.b + (scratchTop.b - scratchHorizon.b) * t;
    arr[i * 4 + 3] = 1;
  }
  attr.needsUpdate = true;
}

/**
 * The dome, unpainted. The caller paints it with `paintSky` — keeping the two
 * apart is what lets a palette change repaint the sky instead of rebuilding it,
 * which would drop the cross-fade on the floor.
 */
export function buildSky(material: THREE.Material): THREE.Mesh {
  const geo = new THREE.SphereGeometry(SKY_RADIUS, SKY_SEGMENTS, SKY_RINGS);
  const dome = new THREE.Mesh(geo, material);
  dome.name = 'sky';
  // Inside-out, and never culled or depth-tested against the world.
  dome.scale.set(-1, 1, 1);
  dome.renderOrder = -1;
  return dome;
}

/**
 * The star field: one `InstancedMesh` of a tiny inward-facing quad. A `Points`
 * cloud would need its own `PointsMaterial`, and the material budget has no
 * room for one — this shares the sky's.
 */
export function buildStars(count: number, material: THREE.Material, seed = 20261): THREE.InstancedMesh {
  const quad = new THREE.PlaneGeometry(1, 1);
  const quadVerts = (quad.attributes.position as THREE.BufferAttribute).count;
  const colors = new Float32Array(quadVerts * 4).fill(1);
  quad.setAttribute('color', new THREE.BufferAttribute(colors, 4));

  const mesh = new THREE.InstancedMesh(quad, material, Math.max(1, count));
  mesh.name = 'stars';
  // Per-instance colour is how a star fades: it multiplies the vertex colour, so
  // the field can go from invisible to full without a second material and
  // without moving a single vertex.
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, count) * 3), 3);
  const rng = mulberry32(seed);
  const brightness = new Float32Array(Math.max(1, count));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0, 1);
  const dir = new THREE.Vector3();
  const radius = SKY_RADIUS * 0.94;

  for (let i = 0; i < count; i++) {
    // A hemisphere above the horizon, biased away from it so the field reads.
    const theta = rng() * Math.PI * 2;
    const y = 0.08 + rng() * 0.92;
    const r = Math.sqrt(1 - y * y);
    p.set(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius);
    // Face the centre — the camera never leaves the island.
    dir.copy(p).normalize().negate();
    q.setFromUnitVectors(up, dir);
    const size = radius * (0.0015 + rng() * 0.0035);
    s.set(size, size, size);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    // A little variation in brightness, fixed per star.
    brightness[i] = 0.55 + rng() * 0.45;
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.userData.brightness = brightness;
  mesh.renderOrder = -1;
  mesh.visible = false;
  return mesh;
}

/**
 * Advance the night fade. `t` is the same frame-rate-independent weight the
 * light rig takes, so the sky and the lights cross-fade together and neither
 * can lead.
 *
 * The gradient itself is repainted by `paintSky` only when the palette actually
 * changes — a few hundred vertices is cheap, but not every frame for nothing.
 */
export function setTimeOfDay(sky: Sky, tod: TimeOfDay, t: number): void {
  const target = tod === 'noche' ? 1 : 0;
  sky.nightness += (target - sky.nightness) * Math.min(1, Math.max(0, t));
  if (sky.stars) {
    sky.stars.visible = sky.nightness > 0.02;
    if (sky.stars.visible) fadeStars(sky.stars, sky.nightness);
  }
}

/** Scale every star's instance colour by the night weight. No allocation. */
function fadeStars(stars: THREE.InstancedMesh, nightness: number): void {
  const attr = stars.instanceColor;
  const brightness = stars.userData.brightness as Float32Array | undefined;
  if (!attr || !brightness) return;
  const arr = attr.array as Float32Array;
  for (let i = 0; i < brightness.length; i++) {
    const v = brightness[i]! * nightness;
    arr[i * 3] = v;
    arr[i * 3 + 1] = v;
    arr[i * 3 + 2] = v;
  }
  attr.needsUpdate = true;
}

export function disposeSky(sky: Sky): void {
  sky.dome.geometry.dispose();
  sky.stars?.geometry.dispose();
  sky.stars?.dispose();
}

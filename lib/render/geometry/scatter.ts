/**
 * Ground scatter — grass, flowers, rocks, ferns, reeds, mushrooms.
 *
 * All generated in code, all vertex-coloured, **no textures**. The old world
 * painted canvas textures for grass blades and leaf cards; this art direction
 * carries colour in `attributes.color` instead, which costs zero texture memory
 * and gives per-vertex variation for free (`06-ART-DIRECTION.md` §4).
 *
 * Every shape here is built to read as a **silhouette** and to have no sharp
 * unbevelled edge — clay has no corners. Each is small enough that the whole
 * scatter budget at T3 is a handful of draw calls through `InstancePool`.
 */
import * as THREE from 'three';

import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE } from '../palette';
import { mergePainted, paintFlat, paintVertical, surface } from './build';

/**
 * One blade: a tapered, slightly curved strip. Three segments is enough for the
 * curve to read and cheap enough to draw a thousand of them.
 *
 * **Open-ended.** The caps were a quarter of every blade in the game and not
 * one of their triangles is ever seen: the bottom is buried in the ground and
 * the top is a four-millimetre disc pointing at the sky. A tuft is four blades,
 * a T2 island draws eleven hundred tufts, and that made the caps alone
 * twenty-six thousand triangles — a sixth of the whole T2 budget, spent on
 * geometry facing away from every camera the game has.
 */
export function blade(height: number, width: number, bend: number, low: string, high: string): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(width * 0.12, width, height, 3, 3, true);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + height / 2) / height;
    // Bend forward with height, and flatten the section so it reads as a blade.
    // Flatten the section into a blade, but not so far that it vanishes edge-on.
    pos.setX(i, pos.getX(i) * 0.55);
    pos.setZ(i, pos.getZ(i) * 0.55 + bend * t * t);
  }
  geo.translate(0, height / 2, 0);
  geo.computeVertexNormals();
  // Bias the ramp upward so a blade reads as green, not as a dark stem.
  return paintVertical(geo, low, high, 0.45);
}

/** A tuft of grass: three blades fanned out. The workhorse of the ground cover. */
export function grassTuft(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  // Four wider, shorter blades: three thin ones read as dark spikes at a metre
  // away rather than as a tuft of grass.
  for (let i = 0; i < 4; i++) {
    const h = 0.13 + rng() * 0.09;
    const b = blade(h, 0.032 + rng() * 0.014, 0.04 + rng() * 0.05, CLAY.grassDeep, CLAY.grass);
    b.rotateY(rng() * Math.PI * 2);
    b.rotateX((rng() - 0.5) * 0.5);
    b.translate((rng() - 0.5) * 0.05, 0, (rng() - 0.5) * 0.05);
    parts.push(b);
  }
  return mergePainted(parts);
}

/**
 * A flower: stem, a ring of rounded petals, a centre. `variant` picks the petal
 * colour from the domain accents, which is the one place saturated hues belong.
 */
export function flower(variant = 0, accent: string = CLAY.leaf): THREE.BufferGeometry {
  const rng = mulberry32(variant * 977 + 13);
  const parts: THREE.BufferGeometry[] = [];
  const height = 0.18 + rng() * 0.08;

  const stem = new THREE.CylinderGeometry(0.006, 0.009, height, 4, 1);
  stem.translate(0, height / 2, 0);
  parts.push(paintVertical(stem, CLAY.grassDeep, CLAY.grass));

  const petals = 5 + Math.floor(rng() * 2);
  for (let i = 0; i < petals; i++) {
    // A squashed sphere is a rounded petal with no edge to bevel.
    const petal = new THREE.SphereGeometry(0.035, 5, 4);
    petal.scale(1, 0.35, 0.6);
    petal.translate(0.038, 0, 0);
    petal.rotateY((i / petals) * Math.PI * 2);
    petal.translate(0, height, 0);
    parts.push(paintFlat(petal, accent));
  }

  const centre = new THREE.SphereGeometry(0.022, 6, 5);
  centre.scale(1, 0.7, 1);
  centre.translate(0, height + 0.008, 0);
  parts.push(paintFlat(centre, CLAY.sand));

  return mergePainted(parts);
}

/**
 * A rock: **smooth, weathered, mossy** (`23-ART-DIRECTION-V2.md` rule 2).
 *
 * It was a jittered icosahedron — twenty shards, the most "low-poly asset pack"
 * shape in the game. Now a subdivided sphere pushed out by layered noise,
 * flattened where it meets the ground and sunk a little into it, with darker
 * crevices where the noise dips and moss on whatever faces the sky.
 */
export function rock(seed = 1): THREE.BufferGeometry {
  return smoothRock(0.15, seed);
}

/** The same weathered stone at any size — the cave arch, the waterfall lip, the mojón's foot. */
export function smoothRock(radius: number, seed: number): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const ox = rng() * 100;
  const oz = rng() * 100;
  const stretch = 0.85 + rng() * 0.5;
  // Pip is 0.55 m tall: these are stones you step around, not boulders.
  const indexed = mergeVertices(new THREE.IcosahedronGeometry(radius, 2));
  const pos = indexed.attributes.position as THREE.BufferAttribute;
  const bumps = new Float32Array(pos.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = rockNoise(v.x * 2.2 + ox, v.y * 2.2, v.z * 2.2 + oz) * 0.6
      + rockNoise(v.x * 5.1 + oz, v.y * 5.1, v.z * 5.1 + ox) * 0.25;
    bumps[i] = n;
    const r = radius * (0.78 + n * 0.45);
    let y = v.y * r * 0.7;
    // A flat underside, so it sits rather than balances.
    if (y < 0) y *= 0.35;
    pos.setXYZ(i, v.x * r * stretch, y, v.z * r);
  }
  indexed.translate(0, -radius * 0.08, 0);
  indexed.computeVertexNormals();
  const nor = indexed.attributes.normal as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const stone = new THREE.Color(NATIVE.stone);
  const deep = new THREE.Color(NATIVE.stoneDeep);
  const moss = new THREE.Color(NATIVE.moss);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(deep).lerp(stone, THREE.MathUtils.clamp(0.25 + bumps[i]! * 0.9, 0, 1));
    c.lerp(moss, THREE.MathUtils.smoothstep(nor.getY(i), 0.55, 0.9) * 0.75);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  indexed.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  // Grain and pits where a built thing's material shows them; plain elsewhere.
  return surface(indexed, 'stone', [0, 1, 0]);
}

/** Smooth 3D value noise for rock shapes, 0..1. Build-time only. */
function rockNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const h = (a: number, b: number, d: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7 + d * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const x0 = lerp(lerp(h(ix, iy, iz), h(ix + 1, iy, iz), u(fx)), lerp(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), u(fx)), u(fy));
  const x1 = lerp(lerp(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), u(fx)), lerp(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), u(fx)), u(fy));
  return lerp(x0, x1, u(fz));
}

/** A fern frond: a low arc of paired blades. Undergrowth, from tier 5. */
export function fern(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const fronds = 4;
  for (let i = 0; i < fronds; i++) {
    const h = 0.2 + rng() * 0.1;
    const b = blade(h, 0.03, 0.14 + rng() * 0.05, CLAY.leafDeep, CLAY.leaf);
    b.rotateZ(0.5 + rng() * 0.2);
    b.rotateY((i / fronds) * Math.PI * 2 + rng() * 0.4);
    parts.push(b);
  }
  return mergePainted(parts);
}

/** A reed: one tall straight blade for the waterline. */
export function reed(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const h = 0.5 + rng() * 0.35;
  return blade(h, 0.014, 0.03, CLAY.grassDeep, CLAY.grass);
}

/** A mushroom: stem plus a rounded cap. */
export function mushroom(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const h = 0.06 + rng() * 0.05;
  const stem = new THREE.CylinderGeometry(0.014, 0.02, h, 5, 1);
  stem.translate(0, h / 2, 0);
  const cap = new THREE.SphereGeometry(0.045 + rng() * 0.02, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.scale(1, 0.7, 1);
  cap.translate(0, h, 0);
  return mergePainted([paintFlat(stem, CLAY.sand), paintFlat(cap, CLAY.soil)]);
}

/**
 * A sprout: the tier-2 unlock, and the first thing a player ever grows. Two
 * small leaves on a short stem — the 2D Pip's own sprout, in three dimensions.
 */
export function sprout(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const h = 0.1 + rng() * 0.04;
  const stem = new THREE.CylinderGeometry(0.007, 0.01, h, 4, 1);
  stem.translate(0, h / 2, 0);
  parts.push(paintVertical(stem, CLAY.grassDeep, CLAY.grass));
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.SphereGeometry(0.05, 5, 4);
    leaf.scale(1, 0.22, 0.5);
    leaf.translate(0.045, 0, 0);
    leaf.rotateZ(0.35);
    leaf.rotateY(i * Math.PI + rng() * 0.4);
    leaf.translate(0, h * 0.85, 0);
    parts.push(paintFlat(leaf, i === 0 ? CLAY.leaf : CLAY.leafDeep));
  }
  return mergePainted(parts);
}

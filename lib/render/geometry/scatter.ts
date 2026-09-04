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

import { mulberry32 } from '@/lib/world/rng';
import { CLAY } from '../palette';
import { mergePainted, paintFlat, paintVertical } from './build';

/**
 * One blade: a tapered, slightly curved strip. Three segments is enough for the
 * curve to read and cheap enough to draw a thousand of them.
 */
function blade(height: number, width: number, bend: number, low: string, high: string): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(width * 0.12, width, height, 3, 3, false);
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
 * A rock: a jittered icosahedron, flat-shaded so every face catches the light
 * band differently. Deterministic from the seed, like everything else.
 */
export function rock(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  // Pip is 0.55 m tall. A rock the size of Pip is a boulder, and El Claro is
  // not a boulder field — these are stones you step over.
  const geo = new THREE.IcosahedronGeometry(0.13, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const j = 0.72 + rng() * 0.5;
    pos.setXYZ(i, pos.getX(i) * j, pos.getY(i) * j * 0.72, pos.getZ(i) * j);
  }
  // Sit it on the ground rather than half-buried at the origin.
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox!.min.y * 0.55, 0);
  geo.computeVertexNormals();
  return paintVertical(geo, CLAY.stoneDeep, CLAY.stone, 0.8);
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

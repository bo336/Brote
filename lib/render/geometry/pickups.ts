/**
 * Things lying on the ground that you pick up by walking past them.
 *
 * Sized for a game, not for a diorama: Pip is 55 cm, and a bottle drawn at its
 * real 25 cm read as a speck from the follow camera — the old beach debris was
 * sized for "a beach that needs a hand", seen, never touched. These have to be
 * seen from eight metres on a phone, so they are about half again as big and
 * each has one bright, readable colour. Still abstract and unbranded: this is a
 * game a twelve-year-old opens after school (`debris.ts`).
 *
 * Litter comes in five silhouettes — what matters in the world is *that* it is
 * litter; *which* kind it is, is shown in the sorting game, where it counts.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical } from './build';
import { smoothRock } from './scatter';
import { doubleSided } from './carpentry';

export type PickupShape = 'botella' | 'lata' | 'papel' | 'bolsa' | 'organico' | 'hojas' | 'ramas' | 'piedras';

const cache = new Map<string, THREE.BufferGeometry>();

function bottle(): THREE.BufferGeometry {
  const body = new THREE.CapsuleGeometry(0.06, 0.2, 4, 10);
  body.rotateZ(Math.PI / 2);
  body.translate(0, 0.06, 0);
  const neck = new THREE.CylinderGeometry(0.028, 0.05, 0.06, 10);
  neck.rotateZ(Math.PI / 2);
  neck.translate(0.15, 0.06, 0);
  const cap = new THREE.CylinderGeometry(0.03, 0.03, 0.035, 10);
  cap.rotateZ(Math.PI / 2);
  cap.translate(0.195, 0.06, 0);
  const label = new THREE.CylinderGeometry(0.063, 0.063, 0.09, 12, 1, true);
  label.rotateZ(Math.PI / 2);
  label.translate(-0.01, 0.06, 0);
  return mergePainted([
    paintFlat(body, '#BFE3EE'), paintFlat(neck, '#BFE3EE'), paintFlat(cap, '#2F7FD0'), paintFlat(label, '#E9F2F5'),
  ]);
}

function can(): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(0.05, 0.052, 0.15, 12);
  body.rotateZ(Math.PI / 2.1);
  body.scale(1, 0.88, 1);
  body.translate(0, 0.05, 0);
  const rim = new THREE.TorusGeometry(0.048, 0.008, 5, 12);
  rim.rotateY(Math.PI / 2);
  rim.translate(0.075, 0.05, 0);
  return mergePainted([paintVertical(body, '#8E9AA3', '#D84A3A', 0.6), paintFlat(rim, '#C9D0D4')]);
}

/** A crumpled sheet and a small flattened box, together: paper and card. */
function paper(): THREE.BufferGeometry {
  const ball = new THREE.IcosahedronGeometry(0.075, 1);
  const pos = ball.attributes.position as THREE.BufferAttribute;
  const rng = mulberry32(17);
  for (let i = 0; i < pos.count; i++) {
    const k = 0.78 + rng() * 0.4;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.9, pos.getZ(i) * k);
  }
  ball.computeVertexNormals();
  ball.translate(-0.06, 0.065, 0);
  const box = bevelBox(0.16, 0.035, 0.12, '#C49A6C', 0.9);
  box.rotateY(0.5);
  box.translate(0.07, 0.018, 0.02);
  return mergePainted([paintFlat(ball, '#F2EFE6'), box]);
}

function bag(): THREE.BufferGeometry {
  const lump = new THREE.IcosahedronGeometry(0.12, 1);
  const pos = lump.attributes.position as THREE.BufferAttribute;
  const rng = mulberry32(29);
  for (let i = 0; i < pos.count; i++) {
    const k = 0.72 + rng() * 0.45;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.45, pos.getZ(i) * k * 0.9);
  }
  lump.computeVertexNormals();
  lump.translate(0, 0.05, 0);
  const handle = new THREE.TorusGeometry(0.045, 0.012, 5, 10, Math.PI);
  handle.rotateX(-0.3);
  handle.translate(0.05, 0.09, 0);
  return mergePainted([paintFlat(lump, '#F4F6F2'), paintFlat(handle, '#F4F6F2')]);
}

/** A peel and a little mound of spent yerba: what goes to the compost. */
function organic(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const strip = new THREE.CapsuleGeometry(0.022, 0.12, 3, 6);
    strip.rotateZ(Math.PI / 2 - 0.2);
    strip.translate(0.06, 0.025, 0);
    strip.rotateY((k / 3) * Math.PI * 2 + 0.4);
    parts.push(paintVertical(strip, '#6E5A1E', '#F1CE3E', 0.5));
  }
  const mound = new THREE.SphereGeometry(0.065, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  mound.scale(1, 0.55, 1);
  mound.translate(-0.07, 0, 0.05);
  parts.push(paintFlat(mound, '#6F7A3A'));
  return mergePainted(parts);
}

/** A little heap of dry leaves: a few curled cards in warm browns. */
function leaves(): THREE.BufferGeometry {
  const rng = mulberry32(41);
  const parts: THREE.BufferGeometry[] = [];
  const tones = ['#B7792F', '#9C5E24', '#C98E3A', '#8A6A2E', '#B45A2A'];
  for (let k = 0; k < 14; k++) {
    const leaf = new THREE.CircleGeometry(0.075, 6);
    leaf.scale(1, 0.55, 1);
    const pos = leaf.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.abs(pos.getX(i)) * 0.35);
    leaf.computeVertexNormals();
    leaf.rotateX(-Math.PI / 2 + (rng() - 0.5) * 0.9);
    leaf.rotateY(rng() * Math.PI * 2);
    const r = rng() * 0.16;
    const a = rng() * Math.PI * 2;
    leaf.translate(Math.cos(a) * r, 0.02 + (0.16 - r) * 0.35 + rng() * 0.03, Math.sin(a) * r);
    parts.push(paintFlat(leaf, tones[k % tones.length]!));
  }
  // Both faces: a leaf seen from under is still a leaf.
  return mergePainted(doubleSided(mergePainted(parts), undefined, 0.002));
}

/** A fallen dry branch: a crooked limb with two twigs. */
function branch(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const main = new THREE.CylinderGeometry(0.022, 0.035, 0.75, 6, 3);
  const pos = main.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + Math.sin(pos.getY(i) * 4) * 0.025);
  main.computeVertexNormals();
  main.rotateZ(Math.PI / 2);
  main.translate(0, 0.035, 0);
  parts.push(paintVertical(main, NATIVE.barkDark, '#9A7650', 1));
  for (const [x, a, l] of [[0.12, 0.7, 0.26], [-0.18, -0.9, 0.22]] as const) {
    const twig = new THREE.CylinderGeometry(0.008, 0.015, l, 5);
    twig.translate(0, l / 2, 0);
    twig.rotateZ(Math.PI / 2 - 0.5);
    twig.rotateY(a);
    twig.translate(x, 0.04, 0);
    parts.push(paintFlat(twig, '#8A6844'));
  }
  return mergePainted(parts);
}

function stone(): THREE.BufferGeometry {
  const r = smoothRock(0.14, 53);
  r.scale(1, 0.62, 0.9);
  r.translate(0, 0.06, 0);
  return paintVertical(r, CLAY.stoneDeep, CLAY.stone, 0.8);
}

const BUILDERS: Record<PickupShape, () => THREE.BufferGeometry> = {
  botella: bottle, lata: can, papel: paper, bolsa: bag, organico: organic,
  hojas: leaves, ramas: branch, piedras: stone,
};

export function pickupGeometry(shape: PickupShape): THREE.BufferGeometry {
  const hit = cache.get(shape);
  if (hit) return hit;
  const geo = BUILDERS[shape]();
  geo.computeBoundingSphere();
  cache.set(shape, geo);
  return geo;
}

/**
 * A young invasive, about to be pulled: a leafy sapling knee-high to Pip, dark
 * and glossy so it reads as *not* one of the pale native meadow plants.
 */
export function invasiveGeometry(): THREE.BufferGeometry {
  const hit = cache.get('invasive');
  if (hit) return hit;
  const rng = mulberry32(67);
  const parts: THREE.BufferGeometry[] = [];
  const stem = new THREE.CylinderGeometry(0.015, 0.025, 0.55, 6);
  stem.translate(0, 0.275, 0);
  parts.push(paintFlat(stem, '#5A4632'));
  for (let k = 0; k < 16; k++) {
    const leaf = new THREE.SphereGeometry(0.06, 6, 4);
    leaf.scale(1.5, 0.35, 0.8);
    const y = 0.2 + rng() * 0.38;
    const a = rng() * Math.PI * 2;
    const r = 0.06 + (0.6 - y) * 0.25;
    leaf.rotateY(-a);
    leaf.translate(Math.cos(a) * r, y, Math.sin(a) * r);
    parts.push(paintVertical(leaf, '#1F4A2C', '#3C7A45', 0.6));
  }
  const geo = mergePainted(parts);
  geo.computeBoundingSphere();
  cache.set('invasive', geo);
  return geo;
}

export function disposePickups(): void {
  for (const g of cache.values()) g.dispose();
  cache.clear();
}

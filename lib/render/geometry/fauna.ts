/**
 * The ambient fauna, all procedural and all low-poly.
 *
 * Six shapes cover the whole island: a bird, a butterfly, a fish, a deer, a fox
 * and a condor. They are silhouettes first — at the distance you actually see
 * them, a shape that reads in black is worth more than a shape with detail
 * (`06-ART-DIRECTION.md` §2 rule 2).
 *
 * Every one is a single merged geometry so a whole flock is one draw call
 * through `InstancePool`. **Nothing here animates itself**: the scene moves the
 * instances, and only the ones it can see (`20-ACCEPTANCE.md` 3C).
 */
import * as THREE from 'three';

import { CLAY, DOMAIN_COLORS, PIP_PARTS } from '../palette';
import { mergePainted, paintFlat } from './build';

/** A body-and-wings shape, which four of the six share. */
function winged(
  bodyLength: number,
  bodyRadius: number,
  wingSpan: number,
  wingChord: number,
  bodyColor: string,
  wingColor: string,
  tail = 0,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.SphereGeometry(bodyRadius, 8, 6);
  body.scale(1, 0.85, bodyLength / bodyRadius / 2);
  parts.push(paintFlat(body, bodyColor));
  for (const side of [-1, 1]) {
    const wing = new THREE.SphereGeometry(wingSpan / 2, 7, 4);
    wing.scale(1, 0.1, wingChord / wingSpan);
    wing.translate((side * wingSpan) / 2, bodyRadius * 0.3, 0);
    // A little dihedral, so a bird in the air is not a cross.
    wing.rotateZ(side * -0.22);
    parts.push(paintFlat(wing, wingColor));
  }
  if (tail > 0) {
    const t = new THREE.SphereGeometry(tail, 6, 4);
    t.scale(0.6, 0.1, 1);
    t.translate(0, 0, -bodyLength * 0.55);
    parts.push(paintFlat(t, wingColor));
  }
  return mergePainted(parts);
}

/** A four-legged body, which the deer and the fox share. */
function quadruped(
  length: number,
  height: number,
  bodyColor: string,
  legColor: string,
  extras: (parts: THREE.BufferGeometry[]) => void,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.SphereGeometry(length / 2, 9, 6);
  body.scale(0.42, 0.46, 1);
  body.translate(0, height * 0.72, 0);
  parts.push(paintFlat(body, bodyColor));

  const neck = new THREE.CylinderGeometry(length * 0.09, length * 0.12, height * 0.42, 6);
  neck.rotateX(-0.5);
  neck.translate(0, height * 0.95, length * 0.3);
  parts.push(paintFlat(neck, bodyColor));

  const head = new THREE.SphereGeometry(length * 0.14, 8, 6);
  head.scale(0.8, 0.85, 1.2);
  head.translate(0, height * 1.14, length * 0.44);
  parts.push(paintFlat(head, bodyColor));

  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const leg = new THREE.CylinderGeometry(length * 0.045, length * 0.035, height * 0.72, 5);
    leg.translate(dx * length * 0.17, height * 0.36, dz * length * 0.3);
    parts.push(paintFlat(leg, legColor));
  }
  extras(parts);
  return mergePainted(parts);
}

/** El hornero, el zorzal, el benteveo — the everyday small bird. */
export function bird(): THREE.BufferGeometry {
  return winged(0.16, 0.055, 0.22, 0.09, CLAY.bark, CLAY.barkDeep, 0.05);
}

/** La mariposa: two bright wings and almost no body. */
export function butterfly(): THREE.BufferGeometry {
  return winged(0.05, 0.016, 0.13, 0.11, PIP_PARTS.eye, DOMAIN_COLORS.animales);
}

/** El cóndor: the tier-8 shape, five times the bird and mostly wing. */
export function condor(): THREE.BufferGeometry {
  return winged(0.5, 0.13, 1.5, 0.4, PIP_PARTS.eye, CLAY.stoneDeep, 0.18);
}

/** La mojarra, la tararira: a fish, seen mostly as a shadow under the surface. */
export function fish(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.SphereGeometry(0.09, 8, 6);
  body.scale(0.42, 0.7, 1.6);
  parts.push(paintFlat(body, CLAY.stone));
  const tail = new THREE.SphereGeometry(0.07, 6, 4);
  tail.scale(0.12, 1, 0.7);
  tail.translate(0, 0, -0.15);
  parts.push(paintFlat(tail, CLAY.stoneDeep));
  return mergePainted(parts);
}

/** El huemul: the tier-9 rarity, with antlers so the silhouette is unmistakable. */
export function deer(): THREE.BufferGeometry {
  return quadruped(1.1, 1.0, CLAY.bark, CLAY.barkDeep, (parts) => {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const tine = new THREE.CylinderGeometry(0.016, 0.022, 0.2 - i * 0.04, 4);
        tine.rotateZ(side * (0.35 + i * 0.3));
        tine.translate(side * (0.06 + i * 0.05), 1.28 + i * 0.07, 0.46);
        parts.push(paintFlat(tine, CLAY.sand));
      }
    }
  });
}

/** El zorro gris: lower, longer, and all tail. */
export function fox(): THREE.BufferGeometry {
  return quadruped(0.75, 0.55, DOMAIN_COLORS.residuos, CLAY.barkDeep, (parts) => {
    const tail = new THREE.SphereGeometry(0.13, 7, 5);
    tail.scale(0.55, 0.55, 2.1);
    tail.rotateX(-0.4);
    tail.translate(0, 0.48, -0.46);
    parts.push(paintFlat(tail, DOMAIN_COLORS.residuos));
    for (const side of [-1, 1]) {
      const ear = new THREE.ConeGeometry(0.045, 0.1, 4);
      ear.translate(side * 0.05, 0.7, 0.33);
      parts.push(paintFlat(ear, PIP_PARTS.eye));
    }
  });
}

export type FaunaKind = 'bird' | 'butterfly' | 'condor' | 'fish' | 'deer' | 'fox';

const BUILDERS: Record<FaunaKind, () => THREE.BufferGeometry> = {
  bird, butterfly, condor, fish, deer, fox,
};

const cache = new Map<FaunaKind, THREE.BufferGeometry>();

export function buildFauna(kind: FaunaKind): THREE.BufferGeometry {
  const hit = cache.get(kind);
  if (hit) return hit;
  const geo = BUILDERS[kind]();
  cache.set(kind, geo);
  return geo;
}

export function disposeFauna(): void {
  for (const geo of cache.values()) geo.dispose();
  cache.clear();
}

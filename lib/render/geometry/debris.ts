/**
 * The debris field on the beach — the waste channel of the impact mirror
 * (`13-IMPACT-MIRROR.md` §2).
 *
 * **This is the one place the world begins in a worse state**, and the rules
 * around it are not decoration:
 *
 *  - It **only ever shrinks**. `MIRROR_RANGE.debrisCount` runs `[40, 0]`: more
 *    logged waste avoided, fewer pieces on the sand. Nothing here can add one.
 *  - It **starts modest**. Forty small pieces along a shoreline is a beach that
 *    needs a hand, not a landfill. The framing is *"la playa se está
 *    limpiando"*, never *"mirá el desastre"*, and forty is the largest number
 *    that still reads as the former.
 *  - The shapes are **abstract and small**. A recognisable brand, a dead
 *    animal, anything grim — none of that. This is a game a twelve-year-old
 *    opens after school.
 */
import * as THREE from 'three';

import { CLAY } from '../palette';
import { bevelBox, mergePainted, paintFlat } from './build';

/** Three silhouettes, so a shoreline is not one shape repeated forty times. */
export type DebrisKind = 0 | 1 | 2;

const cache = new Map<DebrisKind, THREE.BufferGeometry>();

/**
 * A bottle: a small capsule lying on its side, with a cap.
 *
 * Everything here is under 20 cm — Pip is 55 cm, so a piece of litter reads as
 * something you could pick up rather than something dumped.
 */
function bottle(): THREE.BufferGeometry {
  const body = new THREE.CapsuleGeometry(0.035, 0.11, 3, 6);
  body.rotateZ(Math.PI / 2);
  body.translate(0, 0.035, 0);
  const cap = new THREE.CylinderGeometry(0.02, 0.02, 0.025, 6);
  cap.rotateZ(Math.PI / 2);
  cap.translate(0.09, 0.035, 0);
  return mergePainted([paintFlat(body, CLAY.foam), paintFlat(cap, CLAY.water)]);
}

/** A bag: a crumpled, flattened lump. Deliberately unbranded and unreadable. */
function bag(): THREE.BufferGeometry {
  const lump = new THREE.IcosahedronGeometry(0.075, 0);
  lump.scale(1, 0.45, 0.85);
  lump.translate(0, 0.032, 0);
  return paintFlat(lump, CLAY.snow);
}

/** A can: a squat cylinder, dented by being scaled unevenly. */
function can(): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(0.028, 0.03, 0.085, 7);
  body.rotateZ(Math.PI / 2.2);
  body.scale(1, 1, 0.88);
  body.translate(0, 0.03, 0);
  return paintFlat(body, CLAY.stone);
}

const BUILDERS: Record<DebrisKind, () => THREE.BufferGeometry> = {
  0: bottle,
  1: bag,
  2: can,
};

/** One geometry per kind, built once and shared by every instance of it. */
export function buildDebris(kind: DebrisKind): THREE.BufferGeometry {
  const hit = cache.get(kind);
  if (hit) return hit;
  const geo = BUILDERS[kind]();
  cache.set(kind, geo);
  return geo;
}

export function disposeDebris(): void {
  for (const geo of cache.values()) geo.dispose();
  cache.clear();
}

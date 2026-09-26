/**
 * Carpentry: the vocabulary every built thing on the island is made from.
 *
 * The 2026-09-14 playtest put the benches, the compost bin and "those things"
 * below the rest of the world. They were soft rounded blocks in one flat colour
 * each — toy furniture next to real grass. What makes a bench read as a bench is
 * almost never its silhouette; it is the small truths: separate boards with a
 * gap between them, square sawn edges, no two boards quite the same tone, a
 * little twist in the wood, legs braced by a stretcher, nail heads, rope that
 * sags. The bridge got that treatment first (`structures.ts`) and was the one
 * built thing the owner did not flag. These are those truths as functions.
 *
 * Everything takes an `rng` so a builder is deterministic — the same bench on
 * every device — and paints its own vertex colours, so the result merges through
 * `mergePainted` like everything else.
 */
import * as THREE from 'three';

import { bevelBox, paintFlat, paintVertical, surface } from './build';

export type Rng = () => number;

const tone = new THREE.Color();
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);

/** A colour a little off `hex`: sun-bleached, damp, older. No two boards of one bench are the same board. */
export function weather(hex: string, rng: Rng, amount = 1): string {
  tone.set(hex).offsetHSL(
    (rng() - 0.5) * 0.02 * amount,
    (rng() - 0.5) * 0.1 * amount,
    (rng() - 0.5) * 0.1 * amount,
  );
  return `#${tone.getHexString()}`;
}

/**
 * A sawn board, its length along X, its thickness along Y: square edges with a
 * small bevel, a hair of twist, and its own tone.
 */
export function board(len: number, width: number, thick: number, hex: string, rng: Rng): THREE.BufferGeometry {
  const b = surface(bevelBox(len, thick, width, weather(hex, rng), 0.93), 'wood', [1, 0, 0]);
  b.rotateX((rng() - 0.5) * 0.03);
  b.rotateY((rng() - 0.5) * 0.02);
  return b;
}

/**
 * Both faces of a thin sheet — cloth, canvas, a hull's skin. The world material
 * draws front faces only, so a sheet seen from behind simply vanished. The back
 * copy can take its own colour: the inside of a hull, the underside of a hammock.
 */
export function doubleSided(geo: THREE.BufferGeometry, backHex?: string, offset = 0.004): THREE.BufferGeometry[] {
  const front = geo.index ? geo.toNonIndexed() : geo;
  if (front !== geo) geo.dispose();
  const back = front.clone();
  const attrs = ['position', 'normal', 'color', 'uv']
    .map((name) => back.attributes[name] as THREE.BufferAttribute | undefined)
    .filter((a): a is THREE.BufferAttribute => a !== undefined);
  // Reverse each triangle's winding by swapping its second and third vertex.
  for (let t = 0; t + 2 < back.attributes.position!.count; t += 3) {
    for (const attr of attrs) {
      const n = attr.itemSize;
      const arr = attr.array as Float32Array;
      for (let k = 0; k < n; k++) {
        const tmp = arr[(t + 1) * n + k]!;
        arr[(t + 1) * n + k] = arr[(t + 2) * n + k]!;
        arr[(t + 2) * n + k] = tmp;
      }
    }
  }
  const pos = back.attributes.position as THREE.BufferAttribute;
  const nor = back.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < nor.count; i++) {
    const nx = -nor.getX(i);
    const ny = -nor.getY(i);
    const nz = -nor.getZ(i);
    nor.setXYZ(i, nx, ny, nz);
    pos.setXYZ(i, pos.getX(i) + nx * offset, pos.getY(i) + ny * offset, pos.getZ(i) + nz * offset);
  }
  if (backHex) paintFlat(back, backHex);
  return [front, back];
}

/** Orient a geometry built along `axis` so it runs from `a` to `b`. */
export function between(geo: THREE.BufferGeometry, axis: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): THREE.BufferGeometry {
  const dir = b.clone().sub(a);
  const len = dir.length() || 1;
  const m = new THREE.Matrix4().compose(
    a.clone().addScaledVector(dir, 0.5),
    new THREE.Quaternion().setFromUnitVectors(axis, dir.divideScalar(len)),
    new THREE.Vector3(1, 1, 1),
  );
  return geo.applyMatrix4(m);
}

/** A squared beam from `a` to `b`, `w` wide and `h` deep. */
export function beamBetween(
  a: THREE.Vector3, b: THREE.Vector3, w: number, h: number, hex: string, rng: Rng,
): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  return between(surface(bevelBox(len + 0.02, h, w, weather(hex, rng), 0.9), 'wood', [1, 0, 0]), X, a, b);
}

/**
 * A round log from `a` to `b`, tapering from `r0` to `r1`: bark along its length
 * and a pale sawn face at the top end, which is what tells a post from a pipe.
 */
export function logBetween(
  a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, bark: string, heart: string, rng: Rng, radial = 9,
): THREE.BufferGeometry[] {
  const len = a.distanceTo(b);
  const body = new THREE.CylinderGeometry(r1, r0, len, radial, 3);
  // A little irregularity in the section, so it is a trunk and not a turned dowel.
  const pos = body.attributes.position as THREE.BufferAttribute;
  const seed = rng() * 10;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const k = 1 + Math.sin(Math.atan2(z, x) * 3 + seed + pos.getY(i) * 4) * 0.06;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  body.computeVertexNormals();
  const log = between(surface(paintVertical(body, weather(bark, rng), bark, 1), 'wood', [0, 1, 0]), Y, a, b);
  const cap = new THREE.CircleGeometry(r1 * 0.96, radial);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, len / 2 + 0.002, 0);
  return [log, between(surface(paintFlat(cap, heart), 'wood', [0, 1, 0]), Y, a, b)];
}

/** A nail or a bolt head, sitting on a face whose outward normal is `normal`. */
export function nail(at: THREE.Vector3, normal: THREE.Vector3, hex: string, r = 0.011): THREE.BufferGeometry {
  const head = new THREE.CylinderGeometry(r, r * 1.1, r * 0.7, 6);
  head.translate(0, r * 0.35, 0);
  return between(surface(paintFlat(head, hex), 'metal', [0, 1, 0]), Y, at, at.clone().add(normal));
}

/**
 * Rope, or a chain of anything soft: a catenary-ish sag from `a` to `b` made of
 * short thin cylinders, so it hangs rather than bridges.
 */
export function rope(
  a: THREE.Vector3, b: THREE.Vector3, sag: number, radius: number, hex: string, segments = 10,
): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const p = (t: number) => a.clone().lerp(b, t).add(new THREE.Vector3(0, -Math.sin(t * Math.PI) * sag, 0));
  for (let i = 0; i < segments; i++) {
    const p0 = p(i / segments);
    const p1 = p((i + 1) / segments);
    const seg = new THREE.CylinderGeometry(radius, radius, p0.distanceTo(p1) + radius, 5);
    out.push(between(surface(paintFlat(seg, hex), 'cloth', [0, 1, 0]), Y, p0, p1));
  }
  return out;
}

export const v3 = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

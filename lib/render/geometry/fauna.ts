/**
 * The ambient fauna: six native animals, all procedural, all rigged.
 *
 * The 2026-09-14 playtest asked for the animals to be better — a fox that was a
 * ball on four sticks, a bird that was a cross. These are the same six kinds at
 * a craft level that matches the rest of the island: bodies with a chest and a
 * rump, heads with eyes and a beak or a snout, ears and antlers, legs with a
 * knee and a hoof, wings made of overlapping feather groups, tails that are a
 * tail. Colours are the real animals' (`FAUNA` in the palette), not accents.
 *
 *   bird       el hornero — rufous back, pale belly
 *   butterfly  a monarca-orange wing with a dark edge
 *   condor     black, the white ruff and wing patch, a bald head
 *   fish       la mojarra — silver belly, olive back
 *   deer       el huemul — with antlers, so the silhouette is unmistakable
 *   fox        el zorro gris — grey back, rufous legs, the black tail tip
 *
 * **Every vertex knows which part it is** (`aRig`), so `materials/fauna-rig.ts`
 * can flap the wings, walk the legs, sway the tail and nod the head on the GPU.
 * Each animal is still one merged geometry, and a whole flock one draw call.
 */
import * as THREE from 'three';

import { FAUNA, PIP_PARTS } from '../palette';
import { paintFlat, paintVertical } from './build';
import { between, faceAwayFrom } from './carpentry';

/** Which part of the animal a vertex belongs to. The numbers are the shader's. */
export const RIG = { body: 0, wingL: 1, wingR: 2, legFL: 3, legFR: 4, legBL: 5, legBR: 6, tail: 7, head: 8 } as const;

type Vec = readonly [number, number, number];
interface RigPart {
  geo: THREE.BufferGeometry;
  part: number;
  pivot: Vec;
}

const Y = new THREE.Vector3(0, 1, 0);
const EYE = PIP_PARTS.eye;

/** Merge parts into one geometry with position, normal, colour and the rig attribute. */
function rigMerge(parts: RigPart[]): THREE.BufferGeometry {
  const flat = parts.map((p) => ({ ...p, geo: p.geo.index ? p.geo.toNonIndexed() : p.geo, source: p.geo }));
  let total = 0;
  for (const p of flat) total += (p.geo.attributes.position as THREE.BufferAttribute).count;
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const color = new Float32Array(total * 3);
  const rig = new Float32Array(total * 4);
  let o = 0;
  for (const p of flat) {
    const gp = p.geo.attributes.position as THREE.BufferAttribute;
    const gn = p.geo.attributes.normal as THREE.BufferAttribute;
    const gc = p.geo.attributes.color as THREE.BufferAttribute | undefined;
    for (let i = 0; i < gp.count; i++, o++) {
      position.set([gp.getX(i), gp.getY(i), gp.getZ(i)], o * 3);
      normal.set([gn.getX(i), gn.getY(i), gn.getZ(i)], o * 3);
      color.set(gc ? [gc.getX(i), gc.getY(i), gc.getZ(i)] : [1, 1, 1], o * 3);
      rig.set([p.pivot[0], p.pivot[1], p.pivot[2], p.part], o * 4);
    }
    if (p.geo !== p.source) p.geo.dispose();
    p.source.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  out.setAttribute('color', new THREE.BufferAttribute(color, 3));
  out.setAttribute('aRig', new THREE.BufferAttribute(rig, 4));
  return out;
}

/** A sphere stretched into an ellipsoid and placed. */
function blob(r: number, sx: number, sy: number, sz: number, at: Vec, w = 14, h = 10): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, w, h);
  g.scale(sx, sy, sz);
  g.translate(at[0], at[1], at[2]);
  return g;
}

/**
 * One continuous body: rings along Z from the rump to the chest, fuller at the
 * shoulders and haunches, the belly hanging a little lower than the back is high.
 * Joined spheres read as balls standing on sticks; a barrel reads as an animal.
 */
function barrel(z0: number, z1: number, r: number, sx: number, sy: number, cy: number, chest = 0.15, rump = 0.1): THREE.BufferGeometry {
  const steps = 18;
  const seg = 16;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const z = z0 + (z1 - z0) * t;
    const prof = Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, t))), 0.55)
      * (1 + chest * Math.exp(-(((t - 0.78) / 0.13) ** 2)) + rump * Math.exp(-(((t - 0.22) / 0.13) ** 2)));
    const rr = r * prof;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      let y = Math.sin(a) * rr * sy;
      if (y < 0) y *= 1 + 0.18 * Math.sin(Math.PI * t);
      pos.push(Math.cos(a) * rr * sx, cy + y, z);
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      idx.push(a, a + 1, a + seg + 1, a + 1, a + seg + 2, a + seg + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return faceAwayFrom(geo, Math.floor(steps / 2) * (seg + 1), new THREE.Vector3(0, cy, (z0 + z1) / 2));
}

/** A tapered limb from `a` to `b`. */
function limb(a: Vec, b: Vec, r0: number, r1: number, radial = 8): THREE.BufferGeometry {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  return between(new THREE.CylinderGeometry(r1, r0, va.distanceTo(vb), radial, 2), Y, va, vb);
}

/** A cone pointing from `a` toward `b`. */
function spike(a: Vec, b: Vec, r: number, radial = 7): THREE.BufferGeometry {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  return between(new THREE.ConeGeometry(r, va.distanceTo(vb), radial), Y, va, vb);
}

/** El hornero: the everyday bird of the pampa. Body 16 cm. */
export function bird(): THREE.BufferGeometry {
  const P: RigPart[] = [];
  const head: Vec = [0, 0.02, 0.05];
  P.push({ geo: paintVertical(blob(0.055, 0.85, 0.8, 1.45, [0, 0, 0]), FAUNA.horneroBelly, FAUNA.hornero, 0.9), part: RIG.body, pivot: [0, 0, 0] });
  P.push({ geo: paintVertical(blob(0.037, 1, 0.95, 1.05, [0, 0.04, 0.07]), FAUNA.horneroBelly, FAUNA.hornero, 0.7), part: RIG.head, pivot: head });
  for (const s of [-1, 1]) P.push({ geo: paintFlat(blob(0.0085, 1, 1, 1, [s * 0.026, 0.05, 0.09], 8, 6), EYE), part: RIG.head, pivot: head });
  P.push({ geo: paintFlat(spike([0, 0.036, 0.095], [0, 0.03, 0.135], 0.01), FAUNA.beak), part: RIG.head, pivot: head });
  const tail = blob(0.05, 0.6, 0.1, 1.2, [0, 0, 0], 10, 5);
  tail.rotateX(-0.25);
  tail.translate(0, 0.015, -0.1);
  P.push({ geo: paintFlat(tail, FAUNA.horneroDark), part: RIG.tail, pivot: [0, 0.01, -0.06] });
  for (const [s, part] of [[-1, RIG.wingL], [1, RIG.wingR]] as const) {
    const tones = [FAUNA.hornero, FAUNA.horneroDark, FAUNA.horneroDark];
    for (let i = 0; i < 3; i++) {
      const feather = blob(0.05 - i * 0.008, 1.1, 0.09, 0.62 - i * 0.1, [s * (0.055 + i * 0.04), 0.03 - i * 0.003, 0.005 - i * 0.012], 12, 6);
      P.push({ geo: paintFlat(feather, tones[i]!), part, pivot: [s * 0.03, 0.03, 0.01] });
    }
  }
  return rigMerge(P);
}

/** La mariposa: four orange wings with a dark rim, antennae, almost no body. */
export function butterfly(): THREE.BufferGeometry {
  const P: RigPart[] = [];
  P.push({ geo: paintFlat(blob(0.006, 1, 1, 4.2, [0, 0, 0], 8, 6), FAUNA.butterflyEdge), part: RIG.body, pivot: [0, 0, 0] });
  for (const s of [-1, 1]) {
    P.push({ geo: paintFlat(limb([s * 0.002, 0.004, 0.024], [s * 0.012, 0.022, 0.05], 0.0012, 0.0008, 4), FAUNA.butterflyEdge), part: RIG.body, pivot: [0, 0, 0] });
  }
  for (const [s, part] of [[-1, RIG.wingL], [1, RIG.wingR]] as const) {
    const pivot: Vec = [s * 0.004, 0, 0];
    // Each wing is its dark rim with the orange laid just inside and above it.
    for (const [r, x, z, sz] of [[0.045, 0.042, 0.012, 0.75], [0.033, 0.03, -0.022, 0.8]] as const) {
      P.push({ geo: paintFlat(blob(r, 1, 0.05, sz, [s * x, 0.001, z], 14, 6), FAUNA.butterflyEdge), part, pivot });
      P.push({ geo: paintFlat(blob(r * 0.82, 1, 0.06, sz * 0.9, [s * (x - 0.002), 0.0025, z], 14, 6), FAUNA.butterflyWing), part, pivot });
    }
  }
  return rigMerge(P);
}

/** El cóndor: mostly wing, fingered primaries, the white ruff and the pale wing patch. */
export function condor(): THREE.BufferGeometry {
  const P: RigPart[] = [];
  const head: Vec = [0, 0.02, 0.28];
  P.push({ geo: paintFlat(blob(0.14, 1, 0.9, 2.4, [0, 0, 0]), FAUNA.condor), part: RIG.body, pivot: [0, 0, 0] });
  const ruff = new THREE.TorusGeometry(0.075, 0.035, 8, 16);
  ruff.translate(0, 0.02, 0.28);
  P.push({ geo: paintFlat(ruff, FAUNA.condorWhite), part: RIG.body, pivot: [0, 0, 0] });
  P.push({ geo: paintFlat(blob(0.055, 1, 1, 1.25, [0, 0.03, 0.37]), FAUNA.condorHead), part: RIG.head, pivot: head });
  P.push({ geo: paintFlat(spike([0, 0.03, 0.42], [0, 0.005, 0.49], 0.022), FAUNA.condorBeak), part: RIG.head, pivot: head });
  for (const s of [-1, 1]) P.push({ geo: paintFlat(blob(0.01, 1, 1, 1, [s * 0.045, 0.045, 0.4], 8, 6), EYE), part: RIG.head, pivot: head });
  P.push({ geo: paintFlat(blob(0.13, 0.9, 0.08, 1.25, [0, 0, -0.42], 12, 6), FAUNA.condor), part: RIG.tail, pivot: [0, 0, -0.3] });
  for (const [s, part] of [[-1, RIG.wingL], [1, RIG.wingR]] as const) {
    const pivot: Vec = [s * 0.1, 0.02, 0];
    P.push({ geo: paintFlat(blob(0.34, 1, 0.06, 0.4, [s * 0.36, 0.02, 0], 16, 8), FAUNA.condor), part, pivot });
    P.push({ geo: paintFlat(blob(0.24, 1, 0.05, 0.2, [s * 0.36, 0.036, -0.05], 16, 6), FAUNA.condorWhite), part, pivot });
    for (let i = 0; i < 6; i++) {
      const finger = blob(0.13, 1, 0.07, 0.17, [0.12, 0, 0], 12, 5);
      const splay = (i - 2.5) * 0.14;
      finger.rotateY(s > 0 ? splay : Math.PI - splay);
      finger.translate(s * 0.62, 0.018, 0.1 - i * 0.055);
      P.push({ geo: paintFlat(finger, FAUNA.condor), part, pivot });
    }
  }
  return rigMerge(P);
}

/** La mojarra: a silver fish, seen mostly from above as a shape under the surface. */
export function fish(): THREE.BufferGeometry {
  const P: RigPart[] = [];
  P.push({ geo: paintVertical(blob(0.07, 0.38, 0.75, 1.55, [0, 0, 0]), FAUNA.fishBelly, FAUNA.fishBack, 0.8), part: RIG.body, pivot: [0, 0, 0] });
  for (const s of [-1, 1]) P.push({ geo: paintFlat(blob(0.009, 1, 1, 1, [s * 0.022, 0.015, 0.075], 8, 6), EYE), part: RIG.body, pivot: [0, 0, 0] });
  const dorsal = new THREE.ConeGeometry(0.03, 0.05, 6);
  dorsal.scale(0.15, 1, 1.4);
  dorsal.translate(0, 0.07, -0.01);
  P.push({ geo: paintFlat(dorsal, FAUNA.fishBack), part: RIG.body, pivot: [0, 0, 0] });
  for (const lobe of [-1, 1]) {
    const fin = spike([0, lobe * 0.004, -0.1], [0, lobe * 0.045, -0.16], 0.028, 6);
    fin.scale(0.2, 1, 1);
    P.push({ geo: paintFlat(fin, FAUNA.fishBack), part: RIG.tail, pivot: [0, 0, -0.09] });
  }
  return rigMerge(P);
}

/** Four jointed legs: thigh, knee, shin, hoof or paw. Each swings from its own hip. */
function legs(P: RigPart[], hipY: number, front: number, back: number, half: number, r: number, upper: string, lower: string): void {
  const spec = [[-half, front, RIG.legFL], [half, front, RIG.legFR], [-half, back, RIG.legBL], [half, back, RIG.legBR]] as const;
  for (const [x, z, part] of spec) {
    const bend = z > 0 ? 0.03 : -0.05;
    const knee: Vec = [x, hipY * 0.52, z + bend];
    const pivot: Vec = [x, hipY, z];
    P.push({ geo: paintFlat(limb([x, hipY, z], knee, r, r * 0.7), upper), part, pivot });
    P.push({ geo: paintFlat(blob(r * 0.72, 1, 1, 1, knee, 8, 6), upper), part, pivot });
    P.push({ geo: paintFlat(limb(knee, [x, r * 0.8, z], r * 0.65, r * 0.45), lower), part, pivot });
    P.push({ geo: paintFlat(blob(r * 0.62, 1, 0.6, 1.3, [x, r * 0.45, z + r * 0.3], 8, 6), FAUNA.foxDark), part, pivot });
  }
}

/** El huemul: the tier-9 rarity. Antlers, big ears, a white flag of a tail. Shoulder ~0.9 m. */
export function deer(): THREE.BufferGeometry {
  const P: RigPart[] = [];
  const body = (geo: THREE.BufferGeometry) => P.push({ geo, part: RIG.body, pivot: [0, 0, 0] });
  const head: Vec = [0, 0.98, 0.32];
  const onHead = (geo: THREE.BufferGeometry) => P.push({ geo, part: RIG.head, pivot: head });
  // One continuous barrel, deep at the chest and full at the haunches.
  body(paintVertical(barrel(-0.5, 0.42, 0.2, 0.85, 1.2, 0.86, 0.22, 0.14), FAUNA.huemulBelly, FAUNA.huemul, 0.7));
  onHead(paintFlat(limb([0, 0.95, 0.3], [0, 1.28, 0.5], 0.1, 0.065), FAUNA.huemul));
  onHead(paintVertical(blob(0.1, 0.9, 1, 1.7, [0, 1.33, 0.6]), FAUNA.huemulBelly, FAUNA.huemul, 0.6));
  onHead(paintFlat(blob(0.06, 1, 0.9, 1.2, [0, 1.29, 0.74]), FAUNA.huemulDark));
  onHead(paintFlat(blob(0.025, 1.2, 0.9, 1, [0, 1.3, 0.8], 8, 6), EYE));
  for (const s of [-1, 1]) {
    onHead(paintFlat(blob(0.018, 1, 1, 1, [s * 0.07, 1.37, 0.64], 8, 6), EYE));
    const ear = spike([s * 0.06, 1.42, 0.52], [s * 0.19, 1.5, 0.48], 0.045);
    ear.scale(1, 1, 1);
    onHead(paintVertical(ear, FAUNA.huemulDark, FAUNA.huemul, 1));
    // Antlers: a beam up and back, forking twice.
    const base: Vec = [s * 0.05, 1.43, 0.55];
    const mid: Vec = [s * 0.12, 1.58, 0.5];
    onHead(paintFlat(limb(base, mid, 0.02, 0.015, 6), FAUNA.antler));
    onHead(paintFlat(limb(mid, [s * 0.2, 1.72, 0.6], 0.014, 0.008, 6), FAUNA.antler));
    onHead(paintFlat(limb(mid, [s * 0.1, 1.76, 0.4], 0.014, 0.008, 6), FAUNA.antler));
  }
  legs(P, 0.76, 0.3, -0.3, 0.13, 0.05, FAUNA.huemul, FAUNA.huemulDark);
  P.push({ geo: paintVertical(blob(0.05, 0.8, 1, 0.6, [0, 0.95, -0.5]), FAUNA.huemulBelly, FAUNA.huemul, 1), part: RIG.tail, pivot: [0, 0.95, -0.46] });
  return rigMerge(P);
}

/** El zorro gris: low and long, big ears, rufous legs, a bushy tail with a black tip. Shoulder ~0.42 m. */
export function fox(): THREE.BufferGeometry {
  const P: RigPart[] = [];
  const body = (geo: THREE.BufferGeometry) => P.push({ geo, part: RIG.body, pivot: [0, 0, 0] });
  const head: Vec = [0, 0.48, 0.24];
  const onHead = (geo: THREE.BufferGeometry) => P.push({ geo, part: RIG.head, pivot: head });
  body(paintVertical(barrel(-0.34, 0.3, 0.13, 0.9, 1.05, 0.45, 0.2, 0.12), FAUNA.foxBelly, FAUNA.fox, 0.6));
  onHead(paintVertical(blob(0.1, 0.95, 0.85, 1, [0, 0.58, 0.34]), FAUNA.foxBelly, FAUNA.fox, 0.7));
  onHead(paintVertical(spike([0, 0.55, 0.38], [0, 0.52, 0.52], 0.045, 8), FAUNA.foxBelly, FAUNA.foxRufous, 1));
  onHead(paintFlat(blob(0.014, 1.2, 1, 1, [0, 0.53, 0.52], 8, 6), EYE));
  for (const s of [-1, 1]) {
    onHead(paintFlat(blob(0.013, 1, 1, 1, [s * 0.045, 0.61, 0.41], 8, 6), EYE));
    onHead(paintVertical(spike([s * 0.05, 0.64, 0.3], [s * 0.08, 0.77, 0.27], 0.04, 6), FAUNA.fox, FAUNA.foxDark, 1.6));
  }
  legs(P, 0.38, 0.16, -0.18, 0.08, 0.03, FAUNA.foxRufous, FAUNA.foxDark);
  const tail = blob(0.1, 0.9, 0.9, 3.1, [0, 0, -0.26], 12, 10);
  tail.rotateX(0.5);
  tail.translate(0, 0.42, -0.2);
  P.push({ geo: paintVertical(tail, FAUNA.foxDark, FAUNA.fox, 0.35), part: RIG.tail, pivot: [0, 0.44, -0.22] });
  return rigMerge(P);
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

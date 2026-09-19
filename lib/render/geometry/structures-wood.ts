/**
 * The built structures of the ladder that are carpentry: the bridge, the
 * compost bin, the treehouse, the boat and the telescope. The stone ones and
 * the registry are in `structures.ts`. Split for the 400-line rule.
 */
import * as THREE from 'three';

import { BRIDGE, SCALE_REFERENCE } from '@/lib/world/config';
import { mulberry32 } from '@/lib/world/rng';
import { CLAY, DOMAIN_COLORS, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical, post } from './build';
import { beamBetween, between, board, doubleSided, logBetween, nail, rope, v3, weather } from './carpentry';

const METAL = PIP_PARTS.metal;
const ROPE = CLAY.sand;
const SAWN = CLAY.sand;
const UP = v3(0, 1, 0);
const Y = new THREE.Vector3(0, 1, 0);

/**
 * El puente de madera, sized to its crossing (`lib/world/crossing.ts`): two
 * stringers under the planks, planks with a little play in them — a gap between
 * each, never quite straight, never quite one shade — and posts standing on both
 * banks carrying a top rail and a lower one, all along a gentle camber. The
 * deck's top is `BRIDGE.deckTopM` plus the camber, which is exactly the floor
 * `lib/world/decks.ts` stands Pip on.
 */
export function bridge(span: number = BRIDGE.defaultSpanM): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const rng = mulberry32(Math.round(span * 1000));
  const half = span / 2;
  const deckHalf = BRIDGE.deckWidthM / 2;
  const plankY = BRIDGE.deckTopM - 0.035;
  const lift = (t: number) => Math.sin(t * Math.PI) * BRIDGE.camberM;
  const tilt = (t: number) => Math.atan((Math.cos(t * Math.PI) * Math.PI * BRIDGE.camberM) / span);
  /** A beam between two points along the span, following the camber. */
  const beam = (t0: number, t1: number, y: number, z: number, h: number, d: number, hex: string) => {
    const x0 = -half + t0 * span;
    const x1 = -half + t1 * span;
    const y0 = y + lift(t0);
    const y1 = y + lift(t1);
    const b = bevelBox(Math.hypot(x1 - x0, y1 - y0) + 0.04, h, d, hex, 0.9);
    b.rotateZ(Math.atan2(y1 - y0, x1 - x0));
    b.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
    return b;
  };

  const segments = Math.max(4, Math.round(span / 0.8));
  for (const side of [-1, 1]) {
    for (let i = 0; i < segments; i++) {
      parts.push(beam(i / segments, (i + 1) / segments, plankY - 0.12, side * (deckHalf - 0.22), 0.16, 0.13, CLAY.barkDeep));
    }
  }

  const planks = Math.max(8, Math.round(span / 0.3));
  const pitch = span / planks;
  for (let i = 0; i < planks; i++) {
    const t = (i + 0.5) / planks;
    const tone = rng();
    const hex = tone < 0.45 ? CLAY.bark : tone < 0.85 ? CLAY.barkRoof : CLAY.barkDeep;
    const plank = bevelBox(pitch - 0.03, 0.07, BRIDGE.deckWidthM - rng() * 0.14, hex, 0.94);
    plank.rotateY((rng() - 0.5) * 0.06);
    plank.rotateZ(tilt(t));
    plank.translate(-half + t * span, plankY + lift(t) + (rng() - 0.5) * 0.015, (rng() - 0.5) * 0.06);
    parts.push(plank);
  }

  const posts = Math.max(3, Math.round(span / 1.5) + 1);
  const railZ = deckHalf - 0.05;
  const at = (i: number) => 0.03 + (i / (posts - 1)) * 0.94;
  for (const side of [-1, 1]) {
    for (let i = 0; i < posts; i++) {
      const p = post(0.055, 1.0, CLAY.barkDeep, 7);
      p.translate(-half + at(i) * span, plankY - 0.3 + lift(at(i)), side * railZ);
      parts.push(p);
    }
    for (let i = 0; i < posts - 1; i++) {
      parts.push(beam(at(i), at(i + 1), plankY + 0.62, side * railZ, 0.07, 0.08, CLAY.bark));
      parts.push(beam(at(i), at(i + 1), plankY + 0.3, side * railZ, 0.045, 0.05, CLAY.barkRoof));
    }
  }
  return mergePainted(parts);
}

/** La compostera: a slatted bin the waste channel grows (`13` §2), its heap, and a fork left leaning on it. */
export function compost(): THREE.BufferGeometry {
  const rng = mulberry32(857);
  const parts: THREE.BufferGeometry[] = [];
  const h = 0.74;
  const r = 0.52;
  for (const [x, z] of [[-r, -r], [r, -r], [r, r], [-r, r]] as const) {
    parts.push(beamBetween(v3(x, -0.03, z), v3(x, h, z), 0.07, 0.07, CLAY.barkDeep, rng));
  }
  // Three sides slatted to the top; the front only half way, so you can reach in.
  const sides: [number, number, number, number][] = [[0, -r, 0, 4], [-r, 0, Math.PI / 2, 4], [r, 0, Math.PI / 2, 4], [0, r, 0, 2]];
  for (const [x, z, yaw, count] of sides) {
    for (let k = 0; k < count; k++) {
      const slat = bevelBox(r * 2 - 0.06, 0.12, 0.025, weather(CLAY.bark, rng), 0.93);
      slat.rotateY(yaw);
      slat.translate(x, 0.09 + k * 0.17, z);
      parts.push(slat);
      const out = yaw === 0 ? v3(0, 0, Math.sign(z)) : v3(Math.sign(x), 0, 0);
      for (const e of [-1, 1]) {
        const nx = yaw === 0 ? e * (r - 0.02) : x + out.x * 0.013;
        const nz = yaw === 0 ? z + out.z * 0.013 : e * (r - 0.02);
        parts.push(nail(v3(nx, 0.09 + k * 0.17, nz), out, METAL, 0.008));
      }
    }
  }
  const heap = new THREE.IcosahedronGeometry(0.44, 3);
  const pos = heap.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const n = 1 + Math.sin(pos.getX(i) * 13 + pos.getZ(i) * 9) * 0.06 + Math.sin(pos.getZ(i) * 21) * 0.03;
    pos.setXYZ(i, pos.getX(i) * n, Math.max(0, pos.getY(i)) * n * 0.6, pos.getZ(i) * n);
  }
  heap.computeVertexNormals();
  heap.translate(0, 0.02, 0);
  parts.push(paintVertical(heap, CLAY.soilDeep, NATIVE.barkDark, 1));
  const scraps = [CLAY.leaf, CLAY.barkRoof, NATIVE.ceibo, CLAY.grass, DOMAIN_COLORS.residuos];
  for (let i = 0; i < 16; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * 0.3;
    const bit = new THREE.SphereGeometry(0.03 + rng() * 0.02, 5, 3);
    bit.scale(1, 0.25, 0.7);
    bit.rotateY(rng() * 3);
    bit.translate(Math.cos(a) * d, 0.26 - d * 0.5, Math.sin(a) * d);
    parts.push(paintFlat(bit, weather(scraps[i % scraps.length]!, rng)));
  }
  // The fork, head down, leaning on the right side.
  const top = v3(r + 0.1, 1.1, 0.12);
  const foot = v3(r + 0.28, 0.08, 0.34);
  parts.push(...logBetween(foot, top, 0.018, 0.016, CLAY.barkRoof, SAWN, rng, 6));
  parts.push(beamBetween(v3(foot.x - 0.08, 0.1, foot.z), v3(foot.x + 0.08, 0.1, foot.z), 0.02, 0.02, METAL, rng));
  for (let t = 0; t < 4; t++) {
    const x = foot.x - 0.07 + t * 0.047;
    parts.push(beamBetween(v3(x, 0.1, foot.z), v3(x, -0.02, foot.z + 0.02), 0.008, 0.008, METAL, rng));
  }
  return mergePainted(parts);
}

/** La casita del árbol: a boarded deck in the ombú's fork, railings, a rope ladder. The glide launch point. */
export function treehouse(): THREE.BufferGeometry {
  const rng = mulberry32(911);
  const parts: THREE.BufferGeometry[] = [];
  const H = SCALE_REFERENCE.fullTreeM * 0.62;
  const half = 1.2;
  for (const z of [-0.8, 0.8]) parts.push(beamBetween(v3(-half - 0.05, H - 0.1, z), v3(half + 0.05, H - 0.1, z), 0.1, 0.12, CLAY.barkDeep, rng));
  // Knee braces down into the trunk, which is what a platform in a tree stands on.
  for (const [x, z] of [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.8], [0.9, 0.8]] as const) {
    parts.push(beamBetween(v3(x, H - 0.14, z), v3(x * 0.12, H - 1.0, z * 0.12), 0.07, 0.07, CLAY.barkDeep, rng));
  }
  const boards = 9;
  for (let i = 0; i < boards; i++) {
    const z = -half + 0.13 + i * ((half * 2 - 0.26) / (boards - 1));
    const deck = board(half * 2, 0.25, 0.05, CLAY.bark, rng);
    deck.translate(0, H, z);
    parts.push(deck);
    for (const x of [-0.9, 0.9]) parts.push(nail(v3(x, H + 0.026, z), UP, METAL, 0.01));
  }
  // Railing on three sides; the ladder side is open in the middle.
  const postsAt: [number, number][] = [[-half, -half], [0, -half], [half, -half], [-half, 0], [half, 0], [-half, half], [-0.35, half], [0.35, half], [half, half]];
  for (const [x, z] of postsAt) parts.push(beamBetween(v3(x, H - 0.05, z), v3(x, H + 0.92, z), 0.07, 0.07, CLAY.barkDeep, rng));
  const rails: [number, number, number, number][] = [
    [-half, -half, half, -half], [-half, -half, -half, half], [half, -half, half, half], [-half, half, -0.35, half], [0.35, half, half, half],
  ];
  for (const [x0, z0, x1, z1] of rails) {
    parts.push(beamBetween(v3(x0, H + 0.9, z0), v3(x1, H + 0.9, z1), 0.08, 0.05, CLAY.bark, rng));
    parts.push(...rope(v3(x0, H + 0.45, z0), v3(x1, H + 0.45, z1), 0.05, 0.012, ROPE, 8));
  }
  // The rope ladder, hanging from the open side.
  const ladderZ = half + 0.05;
  for (const x of [-0.2, 0.2]) parts.push(...rope(v3(x, H, ladderZ), v3(x, 0.08, ladderZ + 0.25), 0, 0.014, ROPE, 1));
  const rungs = 9;
  for (let i = 0; i < rungs; i++) {
    const t = (i + 0.5) / rungs;
    const y = H - t * (H - 0.08);
    const z = ladderZ + t * 0.25;
    parts.push(...logBetween(v3(-0.22, y, z), v3(0.22, y, z), 0.022, 0.022, NATIVE.bark, SAWN, rng, 6));
  }
  return mergePainted(parts);
}

/**
 * El bote: a planked rowboat. The hull is a real surface — beam and sheer vary
 * along its length, strakes alternate in tone — with a darker inside, a gunwale,
 * a keel, two thwarts and a pair of oars laid in it. Its bow is local +Z; it
 * floats with its origin at the water line.
 */
export function boat(): THREE.BufferGeometry {
  const rng = mulberry32(1013);
  const parts: THREE.BufferGeometry[] = [];
  const L = 2.5;
  const beam = 0.34;
  const depth = 0.36;
  const sink = 0.14;
  const N = 26;
  const M = 8;
  const width = (s: number) => beam * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 2.2)), 0.55);
  const sheer = (s: number) => depth + 0.1 * s * s - sink;
  const bottom = (s: number) => sheer(s) - depth * (1 - 0.35 * s * s);
  const strakes = [CLAY.barkDeep, CLAY.barkRoof, CLAY.bark, CLAY.barkRoof, CLAY.bark, CLAY.barkDeep];
  for (const side of [-1, 1]) {
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const c = new THREE.Color();
    for (let u = 0; u <= N; u++) {
      const s = (u / N) * 2 - 1;
      for (let v = 0; v <= M; v++) {
        const th = (v / M) * (Math.PI / 2);
        pos.push(side * width(s) * Math.cos(th), sheer(s) - depth * Math.sin(th) * (1 - 0.35 * s * s), (s * L) / 2);
        c.set(strakes[Math.min(strakes.length - 1, Math.floor((v / M) * strakes.length))]!);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let u = 0; u < N; u++) {
      for (let v = 0; v < M; v++) {
        const a = u * (M + 1) + v;
        idx.push(a, a + M + 1, a + 1, a + 1, a + M + 1, a + M + 2);
      }
    }
    const skin = new THREE.BufferGeometry();
    skin.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    skin.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    skin.setIndex(idx);
    skin.computeVertexNormals();
    // Outward is away from the keel: flip the winding if the normals came out facing in.
    const normal = skin.attributes.normal as THREE.BufferAttribute;
    if (normal.getX(Math.floor(N / 2) * (M + 1) + 2) * side < 0) {
      const index = skin.index!;
      for (let t = 0; t < index.count; t += 3) {
        const tmp = index.getX(t + 1);
        index.setX(t + 1, index.getX(t + 2));
        index.setX(t + 2, tmp);
      }
      skin.computeVertexNormals();
    }
    parts.push(...doubleSided(skin, weather(CLAY.barkDeep, rng, 0.4), 0.012));
    for (let i = 0; i < 12; i++) {
      const s0 = -0.96 + (i / 12) * 1.92;
      const s1 = -0.96 + ((i + 1) / 12) * 1.92;
      parts.push(beamBetween(
        v3(side * width(s0), sheer(s0) + 0.012, (s0 * L) / 2), v3(side * width(s1), sheer(s1) + 0.012, (s1 * L) / 2),
        0.04, 0.035, CLAY.barkDeep, rng,
      ));
    }
  }
  for (let i = 0; i < 8; i++) {
    const s0 = -0.9 + (i / 8) * 1.8;
    const s1 = -0.9 + ((i + 1) / 8) * 1.8;
    parts.push(beamBetween(v3(0, bottom(s0) - 0.02, (s0 * L) / 2), v3(0, bottom(s1) - 0.02, (s1 * L) / 2), 0.05, 0.05, CLAY.barkDeep, rng));
  }
  for (const s of [-0.32, 0.22]) {
    const thwart = board(width(s) * 2 - 0.03, 0.17, 0.035, CLAY.barkRoof, rng);
    thwart.translate(0, sheer(s) - 0.1, (s * L) / 2);
    parts.push(thwart);
  }
  for (const side of [-1, 1]) {
    const a = v3(side * 0.16, sheer(-0.32) - 0.06, -0.72);
    const b = v3(side * 0.05, sheer(0.5) - 0.03, 0.85);
    parts.push(...logBetween(a, b, 0.018, 0.016, CLAY.barkRoof, SAWN, rng, 6));
    const blade = bevelBox(0.11, 0.012, 0.34, weather(CLAY.barkRoof, rng), 0.93);
    blade.rotateY(Math.atan2(b.x - a.x, b.z - a.z));
    blade.translate(b.x + (b.x - a.x) * 0.12, b.y + 0.01, b.z + 0.14);
    parts.push(blade);
  }
  const coil = new THREE.TorusGeometry(0.07, 0.018, 5, 14);
  coil.rotateX(Math.PI / 2);
  coil.translate(0, sheer(0.72) - 0.1, 0.72 * (L / 2));
  parts.push(paintFlat(coil, ROPE));
  return mergePainted(parts);
}

/** El telescopio: the tier-10 `observe` spot at the summit. A brass-banded tube on a wooden tripod. */
export function telescope(): THREE.BufferGeometry {
  const rng = mulberry32(1117);
  const parts: THREE.BufferGeometry[] = [];
  const apex = v3(0, 1.02, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    const foot = v3(Math.cos(a) * 0.46, 0, Math.sin(a) * 0.46);
    parts.push(beamBetween(apex, foot, 0.036, 0.036, CLAY.bark, rng));
    const cap = new THREE.CylinderGeometry(0.03, 0.034, 0.05, 8);
    cap.translate(foot.x, 0.025, foot.z);
    parts.push(paintFlat(cap, DOMAIN_COLORS.energia));
  }
  const head = new THREE.CylinderGeometry(0.07, 0.085, 0.07, 14);
  head.translate(0, 1.05, 0);
  parts.push(paintFlat(head, METAL));
  const back = v3(0, 1.1, -0.34);
  const front = v3(0, 1.52, 0.5);
  const dir = front.clone().sub(back).normalize();
  const tube = new THREE.CylinderGeometry(0.085, 0.07, back.distanceTo(front), 18);
  parts.push(between(paintVertical(tube, PIP_PARTS.eye, weather(PIP_PARTS.eye, rng, 2)), Y, back, front));
  for (const t of [0.08, 0.5, 0.94]) {
    const at = back.clone().lerp(front, t);
    const ring = new THREE.CylinderGeometry(0.093, 0.093, 0.035, 18);
    parts.push(between(paintFlat(ring, DOMAIN_COLORS.energia), Y, at.clone().addScaledVector(dir, -0.018), at.clone().addScaledVector(dir, 0.018)));
  }
  const lens = new THREE.CircleGeometry(0.07, 20);
  lens.rotateX(-Math.PI / 2);
  parts.push(between(paintFlat(lens, DOMAIN_COLORS.ciencia), Y, front, front.clone().add(dir)));
  const eyepiece = new THREE.CylinderGeometry(0.025, 0.03, 0.1, 10);
  parts.push(between(paintFlat(eyepiece, METAL), Y, back.clone().addScaledVector(dir, -0.1), back));
  const finder = new THREE.CylinderGeometry(0.022, 0.022, 0.3, 10);
  const lift = v3(0, 0.12, 0);
  parts.push(between(paintFlat(finder, METAL), Y, back.clone().lerp(front, 0.55).add(lift), back.clone().lerp(front, 0.85).add(lift)));
  return mergePainted(parts);
}

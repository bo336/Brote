/**
 * The stations of the far island (`lib/world/game/stations.ts`, tiers 7–10):
 * the bridge's repair, the dock on the lagoon, the mountain refuge and Don
 * Beto's lighthouse. Each at its three levels — what the level's `gain` line
 * promises is what the level adds.
 *
 * The bridge itself is the world's (`structures-wood.ts#bridge`), drawn broken
 * until it is repaired; this file only adds what each repair level puts at its
 * end: a plaque, then lanterns, then a bench to look at the river from.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical, surface } from './build';
import { beamBetween, board, logBetween, nail, v3 } from './carpentry';
import { wallStone } from './props-habitat';
import { banco } from './props-build';

const METAL = PIP_PARTS.metal;

/** A lantern on a post: a ribbed paper body between dark caps. */
function lanternPost(x: number, z: number, h: number, rng: () => number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [...logBetween(v3(x, -0.05, z), v3(x, h, z), 0.045, 0.04, NATIVE.barkDark, CLAY.sand, rng)];
  const paper = new THREE.SphereGeometry(0.09, 14, 10);
  paper.scale(1, 1.2, 1);
  paper.translate(x, h + 0.14, z);
  out.push(paintVertical(paper, '#E0772F', '#F7C267', 1));
  for (const dy of [0.25, 0.03]) {
    const cap = new THREE.CylinderGeometry(0.04, 0.045, 0.03, 10, 1);
    cap.translate(x, h + dy, z);
    out.push(surface(paintFlat(cap, NATIVE.barkDark), 'metal', [0, 1, 0]));
  }
  return out;
}

/** El puente's repairs, standing at the bank end: a plaque, lanterns, a bench. */
export function puenteExtras(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(1201 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  // Level 1: a small plaque on a post — "reparado" — so the pad says what happened here.
  parts.push(...logBetween(v3(0.6, -0.05, 0), v3(0.6, 0.85, 0), 0.04, 0.035, NATIVE.barkDark, CLAY.sand, rng));
  const plaque = board(0.42, 0.26, 0.03, CLAY.bark, rng);
  plaque.rotateX(Math.PI / 2);
  plaque.rotateY(-0.3);
  plaque.translate(0.6, 0.85, 0.04);
  parts.push(plaque);
  parts.push(nail(v3(0.6, 0.92, 0.07), v3(0, 0, 1), METAL), nail(v3(0.6, 0.78, 0.07), v3(0, 0, 1), METAL));
  if (lvl >= 2) {
    parts.push(...lanternPost(-0.7, 0.55, 1.35, rng), ...lanternPost(-0.7, -0.55, 1.35, rng));
  }
  if (lvl >= 3) {
    const bench = banco();
    bench.rotateY(Math.PI / 2);
    bench.translate(1.4, 0, 0);
    parts.push(bench);
  }
  return mergePainted(parts);
}

/**
 * El muelle: planks on piles out over the lagoon. Built along +Z from the
 * shore; the scene turns it to face the water. Longer at level 2, and a
 * little roof for the nap at level 3.
 */
export function muelle(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(1301 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const L = lvl >= 2 ? 4.2 : 2.8;
  const W = 1.2;
  const deckY = 0.42;
  const pileAt = (z: number) => [-W / 2 + 0.08, W / 2 - 0.08].map((x) => v3(x, 0, z));
  for (let z = 0.3; z <= L; z += 1.3) {
    for (const p of pileAt(z)) parts.push(...logBetween(v3(p.x, -1.0, z), v3(p.x, deckY + 0.08, z), 0.08, 0.075, NATIVE.barkDark, CLAY.sand, rng));
    parts.push(beamBetween(v3(-W / 2 - 0.05, deckY - 0.08, z), v3(W / 2 + 0.05, deckY - 0.08, z), 0.08, 0.1, CLAY.barkDeep, rng));
  }
  for (const x of [-W / 2 + 0.08, W / 2 - 0.08]) parts.push(beamBetween(v3(x, deckY - 0.02, 0), v3(x, deckY - 0.02, L + 0.1), 0.07, 0.08, CLAY.barkDeep, rng));
  const planks = Math.round(L / 0.2);
  for (let i = 0; i < planks; i++) {
    const b = board(W + 0.08, 0.18, 0.04, i % 5 === 3 ? CLAY.barkRoof : CLAY.bark, rng);
    b.translate(0, deckY + 0.04, 0.1 + i * 0.2);
    parts.push(b);
  }
  // A mooring post and a coil of rope at the end.
  parts.push(...logBetween(v3(W / 2 - 0.1, deckY, L - 0.1), v3(W / 2 - 0.1, deckY + 0.45, L - 0.1), 0.06, 0.055, NATIVE.bark, CLAY.sand, rng));
  const coil = new THREE.TorusGeometry(0.12, 0.025, 6, 16);
  coil.rotateX(Math.PI / 2);
  coil.translate(-W / 2 + 0.3, deckY + 0.08, L - 0.3);
  parts.push(surface(paintFlat(coil, CLAY.sand), 'cloth', [1, 0, 0]));
  if (lvl >= 3) {
    // The siesta roof: four posts and a thatched top at the far end.
    for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) for (const z of [L - 1.4, L - 0.1]) {
      parts.push(...logBetween(v3(x, deckY, z), v3(x, deckY + 1.9, z), 0.05, 0.045, NATIVE.bark, CLAY.sand, rng));
    }
    const thatch = new THREE.ConeGeometry(1.25, 0.7, 4, 1);
    thatch.rotateY(Math.PI / 4);
    thatch.scale(1, 1, 1.15);
    thatch.translate(0, deckY + 2.2, L - 0.75);
    parts.push(surface(paintVertical(thatch, '#9C7A3C', '#C9A45C', 1), 'cloth', [0, 1, 0]));
  }
  return mergePainted(parts);
}

/**
 * El refugio de montaña: dry-stone walls (1), a roof and a stove chimney (2),
 * solar panels on the roof (3). Door on +Z.
 */
export function refugio(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(1401 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const W = 2.4;
  const D = 2.0;
  const H = lvl >= 2 ? 1.5 : 1.1;
  // Walls in courses; the front leaves a doorway.
  let y = 0;
  let course = 0;
  while (y < H) {
    const h = 0.18 + rng() * 0.05;
    for (const [len, x, z, rot] of [[W, 0, -D / 2, 0], [W, 0, D / 2, 0], [D, -W / 2, 0, Math.PI / 2], [D, W / 2, 0, Math.PI / 2]] as const) {
      let s = -len / 2 + (course % 2 ? 0.12 : 0);
      while (s < len / 2 - 0.1) {
        const w = Math.min(len / 2 - s, 0.28 + rng() * 0.2);
        const mid = s + w / 2;
        s += w;
        if (w < 0.1) break;
        // The doorway: front wall, centre, below the lintel.
        if (z > 0 && rot === 0 && Math.abs(mid) < 0.38 && y < 1.0) continue;
        const stone = wallStone(w - 0.015, h - 0.012, 0.32, 1400 + course * 31 + Math.round(mid * 40) + (rot ? 7 : 0));
        stone.rotateY(rot);
        if (rot === 0) stone.translate(x + mid, y + h / 2, z);
        else stone.translate(x, y + h / 2, z + mid);
        parts.push(stone);
      }
    }
    y += h;
    course += 1;
  }
  // The lintel over the door.
  parts.push(beamBetween(v3(-0.5, 1.02, D / 2), v3(0.5, 1.02, D / 2), 0.14, 0.34, NATIVE.barkDark, rng));
  if (lvl >= 2) {
    // A pitched roof of boards on two rafters, and the stove's chimney.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const b = board(W + 0.4, 0.26, 0.04, i % 4 === 1 ? CLAY.barkRoof : NATIVE.bark, rng);
        const t = (i + 0.5) / 9;
        b.rotateX(side * 0.55);
        b.translate(0, H + 0.08 + (1 - t) * 0.62, side * (0.05 + t * (D / 2 + 0.25)));
        parts.push(b);
      }
    }
    const chimney = wallStone(0.3, 0.9, 0.3, 1490);
    chimney.translate(W / 2 - 0.4, H + 0.55, -0.35);
    parts.push(chimney);
  }
  if (lvl >= 3) {
    // Two panels on the sunny slope.
    for (const x of [-0.55, 0.55]) {
      const frame = surface(bevelBox(0.9, 0.03, 0.62, '#9AA3A6', 0.96), 'metal', [1, 0, 0]);
      const cells = surface(bevelBox(0.84, 0.03, 0.56, '#22405F', 0.96), 'metal', [1, 0, 0]);
      for (const g of [frame, cells]) {
        g.translate(0, g === cells ? 0.012 : 0, 0);
        g.rotateX(0.55);
        g.translate(x, H + 0.52, 0.52);
        parts.push(g);
      }
    }
  }
  // A path of flat stones to the door.
  for (let i = 0; i < 3; i++) {
    const s = wallStone(0.34, 0.06, 0.28, 1480 + i);
    s.translate((i - 1) * 0.05, 0.03, D / 2 + 0.4 + i * 0.36);
    parts.push(s);
  }
  return mergePainted(parts);
}

/**
 * El faro de Don Beto: a striped stone tower (1), its lamp and panels (2), a
 * small wind turbine beside it (3). About six metres: tall enough to read from
 * the main island.
 */
export function faro(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(1501 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const H = 5.2;
  // The base: a ring of fitted stones.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const s = wallStone(0.6, 0.35, 0.4, 1500 + i);
    s.rotateY(-a + Math.PI / 2);
    s.translate(Math.cos(a) * 1.05, 0.17, Math.sin(a) * 1.05);
    parts.push(s);
  }
  // The tower: tapered, in bands of white and red.
  const bands = 7;
  for (let b = 0; b < bands; b++) {
    const y0 = 0.3 + (b / bands) * H;
    const y1 = 0.3 + ((b + 1) / bands) * H;
    const r0 = 0.95 - (b / bands) * 0.35;
    const r1 = 0.95 - ((b + 1) / bands) * 0.35;
    const band = new THREE.CylinderGeometry(r1, r0, y1 - y0, 22, 2);
    band.translate(0, (y0 + y1) / 2, 0);
    parts.push(surface(paintFlat(band, b % 2 ? '#C8423A' : '#EDE6D6'), 'stone', [0, 1, 0]));
  }
  // The door and two small windows.
  const door = bevelBox(0.42, 0.8, 0.06, NATIVE.barkDark, 0.94);
  door.translate(0, 0.72, 0.93);
  parts.push(surface(door, 'wood', [0, 1, 0]));
  for (const y of [2.4, 3.8]) {
    const w = new THREE.CircleGeometry(0.12, 12);
    w.translate(0, y, 0.95 - ((y - 0.3) / H) * 0.35 + 0.01);
    parts.push(paintFlat(w, '#2B3A44'));
  }
  const top = H + 0.3;
  // The gallery: a railed walkway round the top.
  const gallery = new THREE.CylinderGeometry(0.95, 0.9, 0.12, 24, 1);
  gallery.translate(0, top, 0);
  parts.push(surface(paintFlat(gallery, '#5B6366'), 'metal', [0, 1, 0]));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const p = surface(paintFlat(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), '#3E4447'), 'metal', [0, 1, 0]);
    p.translate(Math.cos(a) * 0.9, top + 0.28, Math.sin(a) * 0.9);
    parts.push(p);
  }
  const rail = new THREE.TorusGeometry(0.9, 0.02, 5, 32);
  rail.rotateX(Math.PI / 2);
  rail.translate(0, top + 0.52, 0);
  parts.push(surface(paintFlat(rail, '#3E4447'), 'metal', [1, 0, 0]));
  if (lvl >= 2) {
    // The lantern room: glass, a red cap, and panels on the gallery.
    const glass = new THREE.CylinderGeometry(0.45, 0.45, 0.7, 16, 1);
    glass.translate(0, top + 0.42, 0);
    parts.push(paintVertical(glass, '#F7C267', '#FFF0C0', 1));
    const cap = new THREE.ConeGeometry(0.55, 0.5, 16, 1);
    cap.translate(0, top + 1.02, 0);
    parts.push(surface(paintFlat(cap, '#A9352E'), 'metal', [0, 1, 0]));
    for (const a of [0.4, 2.5, 4.6]) {
      const panel = surface(bevelBox(0.5, 0.03, 0.34, '#22405F', 0.96), 'metal', [1, 0, 0]);
      panel.rotateX(-0.6);
      panel.rotateY(-a);
      panel.translate(Math.cos(a) * 0.7, top + 0.2, Math.sin(a) * 0.7);
      parts.push(panel);
    }
  } else {
    // Dark, until the lamp is back: an empty frame.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = surface(paintFlat(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5), '#3E4447'), 'metal', [0, 1, 0]);
      p.translate(Math.cos(a) * 0.42, top + 0.42, Math.sin(a) * 0.42);
      parts.push(p);
    }
  }
  if (lvl >= 3) {
    // A small wind turbine beside the tower: mast, nacelle, three blades.
    const mast = surface(paintVertical(new THREE.CylinderGeometry(0.05, 0.08, 3.2, 8), '#9AA3A6', '#D6DADB', 1), 'metal', [0, 1, 0]);
    mast.translate(2.2, 1.6, -0.6);
    parts.push(mast);
    const nacelle = surface(bevelBox(0.3, 0.14, 0.14, '#D6DADB', 0.9), 'metal', [1, 0, 0]);
    nacelle.translate(2.2, 3.25, -0.6);
    parts.push(nacelle);
    for (let k = 0; k < 3; k++) {
      const blade = surface(bevelBox(0.05, 0.9, 0.02, '#EDE6D6', 0.95), 'plastic', [0, 1, 0]);
      blade.translate(0, 0.45, 0);
      blade.rotateZ((k / 3) * Math.PI * 2);
      blade.rotateY(Math.PI / 2);
      blade.translate(2.03, 3.25, -0.6);
      parts.push(blade);
    }
  }
  return mergePainted(parts);
}

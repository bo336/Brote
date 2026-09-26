/**
 * What the world's shop sells that is not one of the original ten props
 * (`lib/world/game/shop.ts`): benches, pots, signs, paths, fences, tables,
 * lamps, a swing, a pergola, a pond and a lookout. The habitats are in
 * `props-habitat.ts`.
 *
 * Built from the carpentry kit (`carpentry.ts`), so every board and log carries
 * its grain and every stone its grain and pits (`../materials/built.ts`). Each
 * builder is deterministic and its shop description is its brief.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical, surface } from './build';
import { beamBetween, board, logBetween, nail, rope, v3, weather } from './carpentry';
import { flower, reed, smoothRock } from './scatter';

const METAL = PIP_PARTS.metal;
const UP = v3(0, 1, 0);
const TERRACOTTA = '#B8653A';
const TERRACOTTA_DEEP = '#8E4A2A';

/** A disc of water, deep in the middle and clear at the rim. */
function waterDisc(radius: number, deep: string, rim: string): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(radius, 36);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Color(deep);
  const b = new THREE.Color(rim);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i)) / radius;
    pos.setY(i, -0.025 * (1 - r * r));
    c.copy(a).lerp(b, Math.pow(r, 1.7));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/** "Hecho con lo que separaste en el Punto Limpio." Recycled-plastic boards on solid plastic legs. */
export function bancoReciclado(): THREE.BufferGeometry {
  const rng = mulberry32(211);
  const parts: THREE.BufferGeometry[] = [];
  const W = 1.2;
  const tones = ['#4F7F6A', '#5E8A76', '#476F61'];
  const plank = (len: number, w: number, t: number, hex: string) => surface(bevelBox(len, t, w, hex, 0.94), 'plastic', [1, 0, 0]);
  for (const side of [-1, 1]) {
    // Each end is one moulded frame: two legs and a foot, in a darker grey.
    const x = side * 0.5;
    const leg = (z: number) => {
      const g = plank(0.07, 0.07, 0.46, '#5A6468');
      g.rotateZ(Math.PI / 2);
      g.translate(x, 0.23, z);
      return g;
    };
    parts.push(leg(0.14), leg(-0.16));
    const foot = plank(0.4, 0.07, 0.05, '#4E575B');
    foot.rotateY(Math.PI / 2);
    foot.translate(x, 0.025, -0.01);
    parts.push(foot);
    const back = plank(0.5, 0.07, 0.06, '#5A6468');
    back.rotateZ(Math.PI / 2 - 0.12);
    back.translate(x - 0.02 * side * 0, 0.66, -0.2);
    parts.push(back);
  }
  for (let i = 0; i < 4; i++) {
    const seat = plank(W, 0.09, 0.04, tones[i % tones.length]!);
    seat.translate(0, 0.47, 0.14 - i * 0.1);
    parts.push(seat);
  }
  for (let i = 0; i < 2; i++) {
    const rest = plank(W, 0.09, 0.035, tones[(i + 1) % tones.length]!);
    rest.rotateX(-0.12);
    rest.translate(0, 0.66 + i * 0.16, -0.225 + i * 0.02);
    parts.push(rest);
  }
  for (const side of [-1, 1]) for (const z of [0.14, -0.16]) parts.push(nail(v3(side * 0.5, 0.495, z), UP, METAL, 0.009));
  void rng;
  return mergePainted(parts);
}

/** "Una maceta con flores del claro." A thrown terracotta pot, dark soil, a clump in bloom. */
export function maceta(): THREE.BufferGeometry {
  const rng = mulberry32(223);
  const parts: THREE.BufferGeometry[] = [];
  const profile = [
    [0.0, 0.0], [0.13, 0.0], [0.15, 0.02], [0.17, 0.2], [0.19, 0.3], [0.215, 0.31], [0.22, 0.36], [0.2, 0.37], [0.19, 0.34],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.LatheGeometry(profile, 24);
  pot.computeVertexNormals();
  parts.push(paintVertical(pot, TERRACOTTA_DEEP, TERRACOTTA, 0.8));
  const soil = new THREE.CircleGeometry(0.185, 20);
  soil.rotateX(-Math.PI / 2);
  soil.translate(0, 0.33, 0);
  parts.push(paintFlat(soil, CLAY.soilDeep));
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.SphereGeometry(0.05, 6, 4);
    leaf.scale(1, 0.25, 0.5);
    leaf.translate(0.07, 0.36, 0);
    leaf.rotateY((i / 6) * Math.PI * 2 + rng());
    parts.push(paintVertical(leaf, CLAY.leafDeep, CLAY.leaf, 0.7));
  }
  const accents = ['#F2C230', '#E8574B', '#F4F1E6', '#8C5BC7'];
  for (let i = 0; i < 6; i++) {
    const f = flower(i + 11, accents[i % accents.length]!);
    f.scale(1.3, 1.1 + rng() * 0.5, 1.3);
    f.translate((rng() - 0.5) * 0.2, 0.33, (rng() - 0.5) * 0.2);
    parts.push(f);
  }
  return mergePainted(parts);
}

/** "Para ponerle nombre a un lugar." Two posts, a sign of two boards with a carved border. */
export function cartel(): THREE.BufferGeometry {
  const rng = mulberry32(227);
  const parts: THREE.BufferGeometry[] = [];
  for (const x of [-0.42, 0.42]) parts.push(...logBetween(v3(x, -0.05, 0), v3(x, 1.25, 0), 0.05, 0.045, NATIVE.barkDark, CLAY.sand, rng));
  for (let i = 0; i < 2; i++) {
    const b = board(1.05, 0.2, 0.04, CLAY.bark, rng);
    b.rotateX(Math.PI / 2);
    b.translate(0, 0.9 + i * 0.205, 0.05);
    parts.push(b);
  }
  // The carved border: a darker inset line a hand's width in from the edge.
  for (const [w, h, x, y] of [[0.9, 0.02, 0, 1.17], [0.9, 0.02, 0, 0.84], [0.02, 0.33, -0.45, 1.005], [0.02, 0.33, 0.45, 1.005]] as const) {
    const g = surface(bevelBox(w, h, 0.012, NATIVE.barkDark, 0.95), 'wood', [1, 0, 0]);
    g.translate(x, y, 0.074);
    parts.push(g);
  }
  // A little roof so the rain runs off the name.
  const roof = board(1.2, 0.16, 0.03, NATIVE.bark, rng);
  roof.rotateX(Math.PI / 2 - 0.35);
  roof.translate(0, 1.28, 0.02);
  parts.push(roof);
  for (const x of [-0.42, 0.42]) for (const y of [0.9, 1.1]) parts.push(nail(v3(x, y, 0.075), v3(0, 0, 1), METAL));
  return mergePainted(parts);
}

/** "Un caminito para no pisar lo que crece." Five flat stones in a gentle curve, sunk into the ground. */
export function senderoPiedra(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4 - 0.5;
    const s = smoothRock(0.2 + (i % 2) * 0.04, 300 + i);
    s.scale(1.25, 0.28, 1);
    s.rotateY(i * 1.3);
    s.translate(t * 1.4, 0.0, Math.sin(t * 2.4) * 0.28);
    parts.push(s);
  }
  return mergePainted(parts);
}

/** "Un tramo de cerco rústico." Three posts, two rails that do not quite line up. */
export function cerco(): THREE.BufferGeometry {
  const rng = mulberry32(229);
  const parts: THREE.BufferGeometry[] = [];
  const xs = [-0.85, 0, 0.85];
  for (const x of xs) parts.push(...logBetween(v3(x, -0.05, (rng() - 0.5) * 0.04), v3(x + (rng() - 0.5) * 0.04, 0.85, 0), 0.05, 0.045, NATIVE.barkDark, CLAY.sand, rng));
  for (const y of [0.34, 0.66]) {
    for (let i = 0; i < 2; i++) {
      parts.push(...logBetween(v3(xs[i]! - 0.05, y + (rng() - 0.5) * 0.04, 0.05), v3(xs[i + 1]! + 0.05, y + (rng() - 0.5) * 0.05, 0.05), 0.03, 0.028, NATIVE.bark, CLAY.sand, rng, 7));
    }
  }
  for (const x of xs) for (const y of [0.34, 0.66]) parts.push(...rope(v3(x - 0.05, y + 0.03, 0.07), v3(x + 0.05, y - 0.03, 0.07), 0.01, 0.008, CLAY.sand, 3));
  return mergePainted(parts);
}

/** "Para comer afuera mirando lo que plantaste." A table and its two benches on crossed legs. */
export function mesaPicnic(): THREE.BufferGeometry {
  const rng = mulberry32(233);
  const parts: THREE.BufferGeometry[] = [];
  const L = 1.5;
  for (let i = 0; i < 4; i++) {
    const top = board(L, 0.14, 0.04, CLAY.bark, rng);
    top.translate(0, 0.74, -0.225 + i * 0.15);
    parts.push(top);
  }
  for (const z of [-0.52, 0.52]) {
    for (let i = 0; i < 2; i++) {
      const seat = board(L, 0.13, 0.04, CLAY.bark, rng);
      seat.translate(0, 0.44, z + (i - 0.5) * 0.14);
      parts.push(seat);
    }
  }
  for (const x of [-0.55, 0.55]) {
    // The A-frame: two legs crossing under the top, the seat bearer through them.
    parts.push(beamBetween(v3(x, 0, -0.6), v3(x, 0.72, 0.1), 0.06, 0.05, CLAY.barkDeep, rng));
    parts.push(beamBetween(v3(x, 0, 0.6), v3(x, 0.72, -0.1), 0.06, 0.05, CLAY.barkDeep, rng));
    parts.push(beamBetween(v3(x, 0.4, -0.66), v3(x, 0.4, 0.66), 0.05, 0.06, CLAY.barkDeep, rng));
    parts.push(beamBetween(v3(x, 0.7, -0.3), v3(x, 0.7, 0.3), 0.05, 0.05, CLAY.barkDeep, rng));
    for (const z of [-0.225, -0.075, 0.075, 0.225]) parts.push(nail(v3(x, 0.762, z), UP, METAL));
  }
  parts.push(beamBetween(v3(-0.55, 0.42, 0), v3(0.55, 0.68, 0), 0.04, 0.04, CLAY.barkDeep, rng));
  return mergePainted(parts);
}

/** "Carga de día, alumbra de noche. Sin cables." A metal post on a stone, a lamp, a tilted panel. */
export function farolSolar(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = smoothRock(0.18, 401);
  base.scale(1, 0.6, 1);
  parts.push(base);
  const pole = surface(new THREE.CylinderGeometry(0.025, 0.035, 1.6, 10, 1), 'metal', [0, 1, 0]);
  pole.translate(0, 0.85, 0);
  parts.push(paintVertical(pole, '#3E4447', '#5B6366', 1));
  // The lamp: a metal hood over a warm glass, and a small cap.
  const glass = new THREE.CylinderGeometry(0.07, 0.06, 0.14, 12, 1);
  glass.translate(0, 1.57, 0);
  parts.push(paintVertical(glass, '#F7C267', '#FFE6A8', 1));
  const hood = surface(new THREE.ConeGeometry(0.12, 0.08, 14, 1), 'metal', [0, 1, 0]);
  hood.translate(0, 1.68, 0);
  parts.push(paintFlat(hood, '#3E4447'));
  // The panel on its bracket, tilted to the sun, with its cell grid.
  const arm = surface(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6, 1), 'metal', [0, 1, 0]);
  arm.rotateZ(Math.PI / 2);
  arm.translate(0.1, 1.76, 0);
  parts.push(paintFlat(arm, '#3E4447'));
  const panel = surface(bevelBox(0.34, 0.025, 0.26, '#22405F', 0.96), 'metal', [1, 0, 0]);
  const frame = surface(bevelBox(0.37, 0.02, 0.29, '#9AA3A6', 0.96), 'metal', [1, 0, 0]);
  for (const g of [frame, panel]) {
    g.translate(0, g === panel ? 0.008 : 0, 0);
    g.rotateZ(0.5);
    g.translate(0.22, 1.83, 0);
    parts.push(g);
  }
  for (let i = -1; i <= 1; i += 2) {
    const line = paintFlat(new THREE.BoxGeometry(0.004, 0.028, 0.25), '#6E8FAE');
    line.translate(i * 0.056, 0.01, 0);
    line.rotateZ(0.5);
    line.translate(0.22, 1.83, 0);
    parts.push(line);
  }
  return mergePainted(parts);
}

/** "Una tabla y dos sogas." A log frame with its crossbar, two ropes, one worn seat. */
export function hamacaArbol(): THREE.BufferGeometry {
  const rng = mulberry32(239);
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    parts.push(...logBetween(v3(side * 0.75, -0.05, -0.35), v3(side * 0.7, 1.9, 0), 0.06, 0.05, NATIVE.barkDark, CLAY.sand, rng));
    parts.push(...logBetween(v3(side * 0.75, -0.05, 0.35), v3(side * 0.7, 1.9, 0), 0.06, 0.05, NATIVE.barkDark, CLAY.sand, rng));
  }
  parts.push(...logBetween(v3(-0.85, 1.9, 0), v3(0.85, 1.92, 0), 0.07, 0.065, NATIVE.bark, CLAY.sand, rng));
  for (const x of [-0.28, 0.28]) parts.push(...rope(v3(x, 1.86, 0), v3(x, 0.52, 0), 0.0, 0.012, CLAY.sand, 6));
  const seat = board(0.7, 0.2, 0.045, CLAY.bark, rng);
  seat.translate(0, 0.5, 0);
  parts.push(seat);
  for (const x of [-0.28, 0.28]) {
    const knot = paintFlat(new THREE.SphereGeometry(0.025, 6, 5), CLAY.sand);
    knot.translate(x, 0.53, 0);
    parts.push(surface(knot, 'cloth', [0, 1, 0]));
  }
  return mergePainted(parts);
}

/** "Sombra de madera para que trepe algo." Four posts, beams, rafters, and a flowering vine on its way up. */
export function pergola(): THREE.BufferGeometry {
  const rng = mulberry32(241);
  const parts: THREE.BufferGeometry[] = [];
  const H = 2.3;
  const S = 0.95;
  for (const x of [-S, S]) for (const z of [-S, S]) parts.push(...logBetween(v3(x, -0.05, z), v3(x, H, z), 0.07, 0.065, NATIVE.bark, CLAY.sand, rng));
  for (const z of [-S, S]) parts.push(beamBetween(v3(-S - 0.2, H + 0.05, z), v3(S + 0.2, H + 0.05, z), 0.08, 0.12, CLAY.barkDeep, rng));
  for (let i = 0; i < 6; i++) {
    const x = -S + (i / 5) * 2 * S;
    parts.push(beamBetween(v3(x, H + 0.15, -S - 0.25), v3(x, H + 0.15, S + 0.25), 0.05, 0.08, CLAY.bark, rng));
  }
  for (const x of [-S, S]) for (const z of [-S, S]) {
    parts.push(beamBetween(v3(x, H - 0.35, z), v3(x + (x > 0 ? -0.3 : 0.3), H + 0.02, z), 0.04, 0.04, CLAY.barkDeep, rng));
  }
  // The vine: leaves climbing one post in a loose spiral, then running along the top.
  const vine = (x: number, y: number, z: number, s = 1) => {
    const leaf = new THREE.SphereGeometry(0.07 * s, 6, 4);
    leaf.scale(1, 0.4, 0.7);
    leaf.rotateY(rng() * Math.PI * 2);
    leaf.rotateX((rng() - 0.5) * 0.8);
    leaf.translate(x, y, z);
    parts.push(paintVertical(leaf, CLAY.leafDeep, CLAY.leaf, 0.8));
  };
  for (let k = 0; k < 26; k++) {
    const t = k / 26;
    const a = t * 12;
    vine(-S + Math.cos(a) * 0.09, t * H, -S + Math.sin(a) * 0.09, 0.8 + rng() * 0.4);
  }
  for (let k = 0; k < 40; k++) {
    const x = -S + rng() * 1.3;
    const z = -S - 0.1 + rng() * 1.1;
    vine(x, H + 0.22 + rng() * 0.05, z, 0.9 + rng() * 0.5);
    if (k % 3 === 0) {
      const f = flower(k, '#8C5BC7');
      f.rotateX(Math.PI);
      f.translate(x, H + 0.2, z);
      parts.push(f);
    }
  }
  return mergePainted(parts);
}

/** "Un espejo de agua chico. Llegan ranas." Water ringed with stones, reeds and two lily pads. */
export function estanque(): THREE.BufferGeometry {
  const rng = mulberry32(251);
  const parts: THREE.BufferGeometry[] = [];
  const R = 0.85;
  const water = waterDisc(R, '#2A6F7C', '#7FCBCB');
  water.translate(0, 0.04, 0);
  parts.push(water);
  const lip = new THREE.RingGeometry(R * 0.95, R * 1.2, 36, 1);
  lip.rotateX(-Math.PI / 2);
  lip.translate(0, 0.03, 0);
  parts.push(paintFlat(lip, CLAY.soilDeep));
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.2;
    const s = smoothRock(0.1 + rng() * 0.06, 500 + i);
    s.translate(Math.cos(a) * (R + 0.08), 0.02, Math.sin(a) * (R + 0.08));
    parts.push(s);
  }
  for (let i = 0; i < 9; i++) {
    const r = reed(600 + i);
    const a = 2.2 + rng() * 1.1;
    r.translate(Math.cos(a) * (R - 0.08) + (rng() - 0.5) * 0.1, 0.02, Math.sin(a) * (R - 0.08) + (rng() - 0.5) * 0.1);
    parts.push(r);
  }
  for (const [x, z, s] of [[0.25, -0.2, 1], [-0.18, 0.3, 0.8]] as const) {
    const pad = new THREE.CircleGeometry(0.12 * s, 14, 0.3, Math.PI * 2 - 0.3);
    pad.rotateX(-Math.PI / 2);
    pad.translate(x, 0.048, z);
    parts.push(paintFlat(pad, '#4E8F4A'));
  }
  const lily = flower(3, '#F4B6C8');
  lily.scale(1.6, 0.4, 1.6);
  lily.translate(0.25, 0.02, -0.2);
  parts.push(lily);
  return mergePainted(parts);
}

/** "Una plataforma para ver la isla desde arriba." A deck on braced log legs, a railing, a ladder. */
export function mirador(): THREE.BufferGeometry {
  const rng = mulberry32(257);
  const parts: THREE.BufferGeometry[] = [];
  const H = 1.6;
  const S = 0.8;
  for (const x of [-S, S]) for (const z of [-S, S]) parts.push(...logBetween(v3(x, -0.05, z), v3(x, H + 1.0, z), 0.08, 0.07, NATIVE.bark, CLAY.sand, rng));
  // Cross braces on two sides.
  parts.push(beamBetween(v3(-S, 0.2, S), v3(S, H - 0.1, S), 0.05, 0.05, CLAY.barkDeep, rng));
  parts.push(beamBetween(v3(S, 0.2, -S), v3(S, H - 0.1, S), 0.05, 0.05, CLAY.barkDeep, rng));
  parts.push(beamBetween(v3(-S, 0.2, -S), v3(-S, H - 0.1, S), 0.05, 0.05, CLAY.barkDeep, rng));
  for (const z of [-S, S]) parts.push(beamBetween(v3(-S - 0.1, H - 0.05, z), v3(S + 0.1, H - 0.05, z), 0.07, 0.1, CLAY.barkDeep, rng));
  for (let i = 0; i < 9; i++) {
    const b = board(2 * S + 0.25, 0.17, 0.04, CLAY.bark, rng);
    b.rotateY(Math.PI / 2);
    b.translate(-S - 0.02 + i * 0.2, H + 0.02, 0);
    parts.push(b);
  }
  // Railing on three sides; the fourth is where the ladder arrives.
  for (const [a, b] of [[v3(-S, 0, -S), v3(S, 0, -S)], [v3(S, 0, -S), v3(S, 0, S)], [v3(-S, 0, -S), v3(-S, 0, S)]] as const) {
    for (const y of [H + 0.5, H + 0.95]) parts.push(beamBetween(a.clone().setY(y), b.clone().setY(y), 0.045, 0.06, CLAY.bark, rng));
  }
  // The ladder, leaning on the open side.
  for (const x of [-0.25, 0.25]) parts.push(beamBetween(v3(x, 0, S + 0.75), v3(x, H + 0.05, S + 0.02), 0.05, 0.07, CLAY.barkDeep, rng));
  for (let k = 1; k <= 5; k++) {
    const t = k / 6;
    const rung = board(0.55, 0.08, 0.035, CLAY.bark, rng);
    rung.translate(0, t * H, S + 0.75 - t * 0.73);
    parts.push(rung);
  }
  for (const x of [-S, S]) for (const z of [-S, S]) parts.push(nail(v3(x, H + 0.05, z), UP, METAL, 0.014));
  return mergePainted(parts);
}

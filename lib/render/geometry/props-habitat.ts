/**
 * The habitats: what a restored parcel needs to flourish, and what the shop
 * sells for it (`lib/world/game/shop.ts`, kind `habitat`). Each one is a real
 * thing people build for wildlife in Argentina, at the size it really is.
 *
 * They are placeable like any prop, and a flourishing parcel shows the one it
 * was given beside its stake (`components/mundo3d/game/scene/Habitats.tsx`).
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical, surface } from './build';
import { beamBetween, board, logBetween, nail, v3 } from './carpentry';
import { reed, smoothRock } from './scatter';

const METAL = PIP_PARTS.metal;

/**
 * A field stone for a wall: a rounded block, pushed about by noise so no two
 * are the same, each its own shade of weathered grey. Unlike `smoothRock` it has
 * no moss cap — a wall with a green top on every stone reads as a stack of pancakes.
 */
export function wallStone(w: number, h: number, d: number, seed: number): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const g = bevelBox(w, h, d, '#8C857B', 0.88);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const a = rng() * 10;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = 1 + 0.09 * Math.sin(x * 23 + a) * Math.cos(z * 19 - a) + 0.05 * Math.sin((y + x) * 31 + a);
    pos.setXYZ(i, x * k, y * (0.92 + 0.08 * k), z * k);
  }
  g.computeVertexNormals();
  const tones = ['#8C857B', '#7D766C', '#9A9387', '#857A6A', '#948C80'];
  const base = new THREE.Color(tones[Math.floor(rng() * tones.length)]!);
  const deep = base.clone().multiplyScalar(0.72);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(deep).lerp(base, THREE.MathUtils.clamp((pos.getY(i) / h) + 0.6, 0, 1));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return surface(g, 'stone', [1, 0, 0]);
}

/** Shallow water in a bowl: teal in the middle, clear at the rim. */
function shallowWater(radius: number, y: number): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(radius, 24);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const deep = new THREE.Color('#3A8E98');
  const rim = new THREE.Color('#A6E1DE');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i)) / radius;
    pos.setY(i, y - 0.012 * (1 - r * r));
    c.copy(deep).lerp(rim, Math.pow(r, 1.5));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/** "Un palo alto donde se paran las aves a mirar." A tall pole, a crossbar perch, a forked twig, stones at the foot. */
export function posadero(): THREE.BufferGeometry {
  const rng = mulberry32(307);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(...logBetween(v3(0, -0.1, 0), v3(0.03, 2.2, -0.02), 0.045, 0.03, NATIVE.barkDark, CLAY.sand, rng));
  parts.push(...logBetween(v3(-0.32, 2.05, 0), v3(0.36, 2.08, 0), 0.02, 0.016, NATIVE.bark, CLAY.sand, rng, 7));
  parts.push(...logBetween(v3(0.03, 1.55, 0), v3(0.28, 1.85, 0.08), 0.018, 0.01, NATIVE.bark, CLAY.sand, rng, 6));
  parts.push(...logBetween(v3(0.2, 1.75, 0.05), v3(0.3, 1.95, -0.04), 0.01, 0.007, NATIVE.bark, CLAY.sand, rng, 5));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rng() * 0.4;
    const s = smoothRock(0.07 + rng() * 0.04, 700 + i);
    s.translate(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
    parts.push(s);
  }
  return mergePainted(parts);
}

/** "Agua baja y limpia para aves e insectos." A stone basin on a stacked-stone foot, with pebbles to land on. */
export function bebedero(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // A turned stone column on a squared foot.
  const foot = wallStone(0.34, 0.1, 0.34, 721);
  foot.translate(0, 0.05, 0);
  parts.push(foot);
  const colProfile = [[0.0, 0.0], [0.11, 0.0], [0.09, 0.06], [0.07, 0.2], [0.075, 0.3], [0.1, 0.36], [0.0, 0.36]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const column = new THREE.LatheGeometry(colProfile, 18);
  column.computeVertexNormals();
  column.translate(0, 0.09, 0);
  parts.push(surface(paintVertical(column, '#7D766C', '#9A9387', 1), 'stone', [0, 1, 0]));
  // The basin: a wide, shallow stone dish, rim thick enough to perch on.
  const profile = [[0, 0.0], [0.2, 0.0], [0.3, 0.05], [0.34, 0.1], [0.32, 0.12], [0.26, 0.09], [0.0, 0.07]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const basin = new THREE.LatheGeometry(profile, 28);
  basin.computeVertexNormals();
  basin.translate(0, 0.44, 0);
  parts.push(surface(paintVertical(basin, NATIVE.stoneDeep, NATIVE.stone, 0.8), 'stone', [0, 1, 0]));
  parts.push(shallowWater(0.26, 0.535));
  for (let i = 0; i < 3; i++) {
    const p = smoothRock(0.035, 740 + i);
    p.translate(Math.cos(i * 2.2) * 0.12, 0.52, Math.sin(i * 2.2) * 0.12);
    parts.push(p);
  }
  return mergePainted(parts);
}

/** "Cañas huecas donde anidan abejas nativas solitarias." A box of hollow canes under a little roof, on a post. */
export function hotelChico(): THREE.BufferGeometry {
  const rng = mulberry32(311);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(...logBetween(v3(0, -0.1, 0), v3(0, 0.95, 0), 0.04, 0.035, NATIVE.barkDark, CLAY.sand, rng));
  const W = 0.34;
  const H = 0.3;
  const D = 0.18;
  const y0 = 0.95;
  // The frame: back, sides, a shelf, and a pitched roof that overhangs.
  const back = board(W, H, 0.02, CLAY.bark, rng);
  back.rotateX(Math.PI / 2);
  back.translate(0, y0 + H / 2, -D / 2);
  parts.push(back);
  for (const side of [-1, 1]) {
    const s = board(D, H, 0.02, CLAY.bark, rng);
    s.rotateX(Math.PI / 2);
    s.rotateY(Math.PI / 2);
    s.translate(side * W / 2, y0 + H / 2, 0);
    parts.push(s);
  }
  for (const y of [y0, y0 + H / 2]) {
    const shelf = board(W, D, 0.02, CLAY.bark, rng);
    shelf.translate(0, y, 0);
    parts.push(shelf);
  }
  for (const side of [-1, 1]) {
    const r = board(W * 0.62, D + 0.08, 0.025, NATIVE.barkDark, rng);
    r.rotateZ(side * 0.55);
    r.translate(side * W * 0.24, y0 + H + 0.06, 0.01);
    parts.push(r);
  }
  // The canes: bundles of hollow reeds, their open ends facing out.
  const cols = 7;
  for (let row = 0; row < 5; row++) {
    for (let c = 0; c < cols; c++) {
      const x = -W / 2 + 0.03 + (c + (row % 2) * 0.5) * ((W - 0.07) / cols);
      const y = y0 + 0.03 + row * 0.052 + (row > 2 ? 0.02 : 0);
      if (x > W / 2 - 0.03) continue;
      const r = 0.017 + rng() * 0.006;
      const cane = new THREE.CylinderGeometry(r, r, D - 0.01, 8, 1, true);
      cane.rotateX(Math.PI / 2);
      cane.translate(x, y, 0.005);
      parts.push(surface(paintFlat(cane, rng() > 0.5 ? '#C9B27A' : '#B89C63'), 'wood', [0, 0, 1]));
      const hole = new THREE.CircleGeometry(r * 0.72, 8);
      hole.translate(x, y, D / 2 - 0.003);
      parts.push(paintFlat(hole, '#2B2118'));
      const lip = new THREE.RingGeometry(r * 0.72, r, 8, 1);
      lip.translate(x, y, D / 2 - 0.004);
      parts.push(paintFlat(lip, '#D8C48E'));
    }
  }
  parts.push(nail(v3(0, y0 + 0.2, -D / 2 - 0.01), v3(0, 0, -1), METAL));
  return mergePainted(parts);
}

/** "Una casita con agujero a medida de un ave chica." A nest box on a post: pitched lid, a round door, a perch. */
export function cajaNido(): THREE.BufferGeometry {
  const rng = mulberry32(313);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(...logBetween(v3(0, -0.1, 0), v3(0, 1.6, 0), 0.045, 0.04, NATIVE.barkDark, CLAY.sand, rng));
  const y0 = 1.45;
  const body = surface(bevelBox(0.2, 0.28, 0.18, CLAY.bark, 0.95), 'wood', [0, 1, 0]);
  body.translate(0, y0 + 0.14, 0.1);
  parts.push(body);
  for (const side of [-1, 1]) {
    const lid = board(0.18, 0.28, 0.02, NATIVE.barkDark, rng);
    lid.rotateX(Math.PI / 2);
    lid.rotateY(Math.PI / 2);
    lid.rotateZ(side * 0.65);
    lid.translate(side * 0.065, y0 + 0.33, 0.1);
    parts.push(lid);
  }
  // The door: 28 mm, the size of a chingolo or a ratona, and a darker ring of worn wood.
  const door = new THREE.CircleGeometry(0.03, 14);
  door.translate(0, y0 + 0.19, 0.192);
  parts.push(paintFlat(door, '#1E1710'));
  const ring = new THREE.RingGeometry(0.03, 0.04, 14, 1);
  ring.translate(0, y0 + 0.19, 0.191);
  parts.push(paintFlat(ring, NATIVE.barkDark));
  parts.push(...logBetween(v3(0, y0 + 0.11, 0.19), v3(0, y0 + 0.11, 0.26), 0.007, 0.007, NATIVE.bark, CLAY.sand, rng, 5));
  parts.push(beamBetween(v3(0, y0 - 0.12, 0.04), v3(0, y0 + 0.02, 0.02), 0.03, 0.03, NATIVE.barkDark, rng));
  parts.push(nail(v3(0, y0 + 0.05, 0.195), v3(0, 0, 1), METAL, 0.008));
  return mergePainted(parts);
}

/** "Piedras húmedas y sombra junto al agua." A low cave of flat stones, moss, and a puddle at its mouth. */
export function refugioRanas(): THREE.BufferGeometry {
  const rng = mulberry32(317);
  const parts: THREE.BufferGeometry[] = [];
  // Two walls of stacked stones and a flat slab across them: the gap is the shelter.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const s = smoothRock(0.1 + rng() * 0.03, 760 + i + (side > 0 ? 10 : 0));
      s.scale(1.2, 0.75, 1);
      s.translate(side * 0.2 + (rng() - 0.5) * 0.04, 0.04 + i * 0.1, -0.05 + (rng() - 0.5) * 0.08);
      parts.push(s);
    }
  }
  const slab = smoothRock(0.26, 780);
  slab.scale(1.4, 0.32, 1.1);
  slab.translate(0, 0.33, -0.04);
  parts.push(slab);
  const dark = new THREE.CircleGeometry(0.1, 12);
  dark.scale(1, 0.7, 1);
  dark.translate(0, 0.12, 0.08);
  parts.push(paintFlat(dark, '#1F2A22'));
  parts.push(shallowWater(0.24, 0.015).translate(0.05, 0, 0.36));
  for (let i = 0; i < 5; i++) {
    const r = reed(800 + i);
    r.scale(0.7, 0.7, 0.7);
    r.translate(0.28 + rng() * 0.12, 0, 0.3 + rng() * 0.15);
    parts.push(r);
  }
  for (let i = 0; i < 6; i++) {
    const m = new THREE.SphereGeometry(0.05, 6, 4);
    m.scale(1, 0.35, 1);
    m.translate((rng() - 0.5) * 0.5, 0.38 + rng() * 0.02, (rng() - 0.5) * 0.3 - 0.04);
    parts.push(paintFlat(m, NATIVE.moss));
  }
  return mergePainted(parts);
}

/** "Pared de piedra seca: casa de lagartijas y chinchillones." Courses of fitted stones, no mortar, gaps to hide in. */
export function pirca(): THREE.BufferGeometry {
  const rng = mulberry32(331);
  const parts: THREE.BufferGeometry[] = [];
  const L = 1.5;
  const courses = 4;
  let y = 0;
  for (let c = 0; c < courses; c++) {
    // Each course its own height; stones of mixed length, joints staggered.
    const h = 0.13 + rng() * 0.04 - c * 0.012;
    let x = -L / 2 + (c % 2 ? 0.1 : 0);
    const depth = 0.34 - c * 0.03;
    while (x < L / 2 - 0.08) {
      const w = Math.min(L / 2 - x, 0.2 + rng() * 0.16);
      if (w < 0.08) break;
      const s = wallStone(w - 0.012, h - 0.01, depth - rng() * 0.05, 820 + c * 17 + Math.round(x * 50));
      s.rotateY((rng() - 0.5) * 0.08);
      s.translate(x + w / 2, y + h / 2, (rng() - 0.5) * 0.03);
      parts.push(s);
      x += w;
    }
    y += h;
  }
  // Flat capstones along the top, and small chinks wedged into the joints.
  for (let i = 0; i < 5; i++) {
    const s = wallStone(0.3, 0.07, 0.3, 900 + i);
    s.rotateY((rng() - 0.5) * 0.3);
    s.translate(-L / 2 + 0.15 + i * 0.3, y + 0.035, 0);
    parts.push(s);
  }
  for (let i = 0; i < 6; i++) {
    const ch = wallStone(0.05, 0.04, 0.05, 950 + i);
    ch.translate(-L / 2 + 0.2 + i * 0.22, 0.12 + (i % 3) * 0.14, 0.16);
    parts.push(ch);
  }
  // A lizard's gap at the foot: the reason the wall is a habitat.
  const gap = new THREE.CircleGeometry(0.04, 10);
  gap.scale(1.4, 0.8, 1);
  gap.translate(0.2, 0.05, 0.176);
  parts.push(paintFlat(gap, '#1F1B16'));
  return mergePainted(parts);
}

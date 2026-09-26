/**
 * The game's stations, built from the same carpentry vocabulary as the benches
 * (`carpentry.ts`): separate boards, braced frames, nails, rope, weathered tones.
 * Each level adds something you can see from the path — a second bin, a lid, a
 * bigger roof — because an upgrade nobody can see is an upgrade nobody wanted.
 *
 * Every builder is deterministic and paints its own vertex colours, so it merges
 * like everything else and costs one draw call. The pad for a station that does
 * not exist yet is a construction site: stakes, a string line, a stack of boards.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical } from './build';
import { beamBetween, board, logBetween, nail, rope, v3, weather } from './carpentry';
import { smoothRock } from './scatter';

const METAL = PIP_PARTS.metal;
const SAWN = CLAY.sand;
const UP = v3(0, 1, 0);
type Rng = () => number;

const BIN_COLORS = { verde: '#2F9E5B', marron: '#7A5230', gris: '#4E555C', rojo: '#C8423A' };

/** A wheelie-style bin with a lid, a handle and a pale label patch. */
function bin(x: number, z: number, color: string, rng: Rng, h = 0.62): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const body = new THREE.CylinderGeometry(0.2, 0.17, h, 14, 2);
  body.scale(1, 1, 0.82);
  body.translate(x, h / 2 + 0.02, z);
  out.push(paintVertical(body, weather(color, rng, 0.6), color, 1));
  const lid = bevelBox(0.44, 0.05, 0.36, weather(color, rng, 0.4), 0.85);
  lid.rotateX(-0.08);
  lid.translate(x, h + 0.045, z - 0.01);
  out.push(lid);
  const label = new THREE.PlaneGeometry(0.16, 0.12);
  label.translate(x, h * 0.62, z + 0.166);
  out.push(paintFlat(label, '#EDEBE3'));
  const handle = new THREE.TorusGeometry(0.06, 0.012, 5, 10, Math.PI);
  handle.translate(x, h + 0.02, z - 0.19);
  out.push(paintFlat(handle, METAL));
  for (const sx of [-0.13, 0.13]) {
    const wheel = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x + sx, 0.045, z - 0.13);
    out.push(paintFlat(wheel, '#26292B'));
  }
  return out;
}

/** A lean-to roof on four posts, boards laid across, gently sloping back. */
function shelter(w: number, d: number, front: number, back: number, rng: Rng): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (const [x, z, h] of [[-w / 2, d / 2, front], [w / 2, d / 2, front], [-w / 2, -d / 2, back], [w / 2, -d / 2, back]] as const) {
    out.push(...logBetween(v3(x, -0.05, z), v3(x, h, z), 0.045, 0.038, NATIVE.bark, SAWN, rng));
  }
  out.push(beamBetween(v3(-w / 2 - 0.08, front, d / 2), v3(w / 2 + 0.08, front, d / 2), 0.06, 0.08, CLAY.barkDeep, rng));
  out.push(beamBetween(v3(-w / 2 - 0.08, back, -d / 2), v3(w / 2 + 0.08, back, -d / 2), 0.06, 0.08, CLAY.barkDeep, rng));
  const slope = Math.atan2(front - back, d);
  const boards = Math.max(4, Math.round(w / 0.16));
  for (let i = 0; i < boards; i++) {
    const x = -w / 2 - 0.1 + ((w + 0.2) * (i + 0.5)) / boards;
    const plank = board(d + 0.3, (w + 0.2) / boards - 0.012, 0.03, CLAY.barkRoof, rng);
    plank.rotateY(Math.PI / 2);
    plank.rotateX(slope);
    plank.translate(x, (front + back) / 2 + 0.06, 0);
    out.push(plank);
  }
  return out;
}

/** "Punto Limpio" — three bins (+ the red one for batteries from level 2) under a roof. */
export function puntoLimpio(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(501 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const w = lvl >= 3 ? 2.6 : 1.9;
  parts.push(...shelter(w, 1.0, 1.55, 1.3, rng));
  const xs = lvl >= 2 ? [-0.66, -0.22, 0.22, 0.66] : [-0.5, 0, 0.5];
  const colors = lvl >= 2
    ? [BIN_COLORS.verde, BIN_COLORS.marron, BIN_COLORS.gris, BIN_COLORS.rojo]
    : [BIN_COLORS.verde, BIN_COLORS.marron, BIN_COLORS.gris];
  xs.forEach((x, i) => parts.push(...bin(x, 0.05, colors[i]!, rng, i === 3 ? 0.45 : 0.62)));
  // The sign: a board on the front beam, a strip of colour per bin under it.
  const sign = board(w * 0.7, 0.2, 0.03, '#EFE6D2', rng);
  sign.translate(0, 1.4, 0.54);
  parts.push(sign);
  xs.forEach((x, i) => {
    const tag = new THREE.PlaneGeometry(0.18, 0.05);
    tag.translate(x * 0.9, 1.34, 0.558);
    parts.push(paintFlat(tag, colors[i]!));
  });
  if (lvl >= 3) {
    // A baling press: a steel box with a lever, the recycling centre's workhorse.
    const press = bevelBox(0.5, 0.8, 0.45, '#5E7A8C', 0.92);
    press.translate(w / 2 - 0.2, 0.42, -0.1);
    parts.push(press);
    parts.push(beamBetween(v3(w / 2 - 0.2, 0.84, -0.1), v3(w / 2 + 0.25, 1.15, -0.1), 0.035, 0.035, METAL, rng));
  }
  return mergePainted(parts);
}

/** A slatted compost bay: boards with gaps, dark compost heaped inside. */
function compostBay(x: number, rng: Rng, fill: number, lid: boolean): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const s = 0.72;
  const h = 0.6;
  for (const [cx, cz] of [[-s / 2, -s / 2], [s / 2, -s / 2], [-s / 2, s / 2], [s / 2, s / 2]] as const) {
    out.push(beamBetween(v3(x + cx, 0, cz), v3(x + cx, h + 0.06, cz), 0.06, 0.06, CLAY.barkDeep, rng));
  }
  for (let k = 0; k < 4; k++) {
    const y = 0.08 + k * 0.15;
    for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [-1, 1, 1, 1], [-1, -1, -1, 1], [1, -1, 1, 1]] as const) {
      if (az === 1 && bz === 1 && k === 3) continue; // the front top board is off, to load it
      out.push(beamBetween(v3(x + (ax * s) / 2, y, (az * s) / 2), v3(x + (bx * s) / 2, y, (bz * s) / 2), 0.02, 0.1, CLAY.bark, rng));
    }
  }
  const heap = new THREE.SphereGeometry(s * 0.46, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  heap.scale(1, fill, 1);
  heap.translate(x, 0.05, 0);
  out.push(paintVertical(heap, '#2E2016', '#5A4127', 0.7));
  // A few leaves on top: this is where they end up.
  for (let k = 0; k < 5; k++) {
    const leaf = new THREE.CircleGeometry(0.05, 5);
    leaf.rotateX(-Math.PI / 2 + (rng() - 0.5) * 0.6);
    leaf.translate(x + (rng() - 0.5) * 0.4, 0.05 + s * 0.46 * fill + 0.01, (rng() - 0.5) * 0.4);
    out.push(paintFlat(leaf, rng() < 0.5 ? '#B7792F' : '#8BA35A'));
  }
  if (lid) {
    const top = bevelBox(s + 0.1, 0.04, s + 0.1, weather(CLAY.barkRoof, rng), 0.9);
    top.rotateX(-0.5);
    top.translate(x, h + 0.2, -s / 2 - 0.05);
    out.push(top);
  }
  return out;
}

export function compostera(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(611 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const bays = Math.max(1, Math.min(3, lvl));
  for (let b = 0; b < bays; b++) {
    const x = (b - (bays - 1) / 2) * 0.82;
    parts.push(...compostBay(x, rng, 0.45 + b * 0.18, lvl >= 3));
  }
  // A fork leaning on it.
  parts.push(beamBetween(v3(bays * 0.41 + 0.05, 0, 0.3), v3(bays * 0.41 - 0.05, 1.05, 0.2), 0.025, 0.025, NATIVE.bark, rng));
  for (let k = -1; k <= 1; k++) {
    parts.push(beamBetween(v3(bays * 0.41 + 0.05 + k * 0.04, 0.0, 0.32), v3(bays * 0.41 + 0.05 + k * 0.04, 0.2, 0.32), 0.008, 0.008, METAL, rng));
  }
  return mergePainted(parts);
}

/** A rain barrel on a stand, fed by a gutter from a small roof. */
export function tanque(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(701 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const barrels = lvl >= 2 ? 2 : 1;
  for (let b = 0; b < barrels; b++) {
    const x = (b - (barrels - 1) / 2) * 0.62;
    const base = bevelBox(0.56, 0.22, 0.56, weather(CLAY.stone, rng), 0.85);
    base.translate(x, 0.11, 0);
    parts.push(base);
    const barrel = new THREE.CylinderGeometry(0.26, 0.26, 0.82, 18, 3);
    const pos = barrel.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const bulge = 1 + (1 - (y / 0.41) ** 2) * 0.06;
      pos.setX(i, pos.getX(i) * bulge);
      pos.setZ(i, pos.getZ(i) * bulge);
    }
    barrel.computeVertexNormals();
    barrel.translate(x, 0.63, 0);
    parts.push(paintVertical(barrel, '#2F6E8C', '#3F8FB0', 1));
    for (const y of [0.35, 0.9]) {
      const band = new THREE.TorusGeometry(0.275, 0.014, 5, 20);
      band.rotateX(Math.PI / 2);
      band.translate(x, y, 0);
      parts.push(paintFlat(band, '#26485A'));
    }
    const tap = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    tap.rotateX(Math.PI / 2);
    tap.translate(x, 0.34, 0.3);
    parts.push(paintFlat(tap, METAL));
  }
  const roofW = lvl >= 3 ? 2 : 1.4;
  parts.push(...shelter(roofW, 0.9, 1.65, 1.45, rng).map((g) => g.translate(0, 0, -0.55)));
  // The gutter and the downpipe that feed the first barrel.
  parts.push(beamBetween(v3(-roofW / 2, 1.58, -0.1), v3(roofW / 2, 1.58, -0.1), 0.06, 0.05, '#8E9AA3', rng));
  parts.push(beamBetween(v3(-0.1, 1.56, -0.1), v3(-0.1, 1.08, -0.05), 0.045, 0.045, '#8E9AA3', rng));
  return mergePainted(parts);
}

/** Tables of seedling trays under shade cloth; a small greenhouse at level 3. */
export function vivero(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(811 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const w = lvl >= 2 ? 2.4 : 1.8;
  const d = 1.3;
  const h = 1.7;
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]] as const) {
    parts.push(...logBetween(v3(x, -0.05, z), v3(x, h, z), 0.04, 0.034, NATIVE.bark, SAWN, rng));
  }
  if (lvl >= 3) {
    // Greenhouse: pale panels on the sides and a ridged roof.
    for (const side of [-1, 1]) {
      const panel = new THREE.PlaneGeometry(w, h * 0.9);
      panel.translate(0, h * 0.48, (side * d) / 2);
      if (side < 0) panel.rotateY(Math.PI);
      parts.push(paintFlat(panel, '#DDEFE6'));
    }
    const ridge = new THREE.CylinderGeometry(d * 0.62, d * 0.62, w + 0.1, 3, 1, true, 0, Math.PI);
    ridge.rotateZ(Math.PI / 2);
    ridge.rotateX(Math.PI / 2);
    ridge.translate(0, h, 0);
    parts.push(paintFlat(ridge, '#CFE6DA'));
  } else {
    const cloth = new THREE.PlaneGeometry(w + 0.2, d + 0.2, 8, 6);
    cloth.rotateX(-Math.PI / 2);
    const pos = cloth.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / ((w + 0.2) / 2);
      const z = pos.getZ(i) / ((d + 0.2) / 2);
      pos.setY(i, h + 0.02 - (1 - x * x) * (1 - z * z) * 0.1);
    }
    cloth.computeVertexNormals();
    parts.push(paintFlat(cloth, '#2F5E3A'));
    const under = cloth.clone();
    under.scale(1, 1, 1);
    under.translate(0, -0.004, 0);
    const idx: number[] = [];
    const n = under.index!;
    for (let i = 0; i < n.count; i += 3) idx.push(n.getX(i), n.getX(i + 2), n.getX(i + 1));
    under.setIndex(idx);
    under.computeVertexNormals();
    parts.push(paintFlat(under, '#24492E'));
  }
  // Two tables of trays, each tray a grid of little green sprouts.
  for (const tz of [-0.3, 0.3]) {
    parts.push(board(w - 0.3, 0.42, 0.04, CLAY.bark, rng).translate(0, 0.72, tz));
    for (const tx of [-(w - 0.4) / 2, (w - 0.4) / 2]) {
      parts.push(beamBetween(v3(tx, 0, tz), v3(tx, 0.7, tz), 0.045, 0.045, CLAY.barkDeep, rng));
    }
    for (let k = 0; k < Math.round((w - 0.4) / 0.36); k++) {
      const x = -(w - 0.6) / 2 + k * 0.36;
      const tray = bevelBox(0.32, 0.05, 0.3, '#2B2B2B', 0.95);
      tray.translate(x, 0.765, tz);
      parts.push(tray);
      for (let s = 0; s < 6; s++) {
        const sprout = new THREE.ConeGeometry(0.018, 0.07 + rng() * 0.04, 5);
        sprout.translate(x - 0.1 + (s % 3) * 0.1, 0.83, tz - 0.07 + Math.floor(s / 3) * 0.14);
        parts.push(paintVertical(sprout, '#3C7A3F', '#8FC45A', 0.8));
      }
    }
  }
  // A watering can on the ground: this is a place where plants are looked after.
  const can = new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12);
  can.translate(w / 2 + 0.25, 0.1, 0.4);
  parts.push(paintFlat(can, '#3F8FB0'));
  parts.push(beamBetween(v3(w / 2 + 0.33, 0.12, 0.4), v3(w / 2 + 0.52, 0.26, 0.4), 0.02, 0.02, '#3F8FB0', rng));
  return mergePainted(parts);
}

/** Canes, drilled logs and bricks stacked in a little roofed frame. */
export function hotelInsectos(lvl: number): THREE.BufferGeometry {
  const rng = mulberry32(911 + lvl);
  const parts: THREE.BufferGeometry[] = [];
  const floors = 2 + Math.min(2, lvl);
  const w = 0.9;
  const fh = 0.32;
  for (const x of [-w / 2, w / 2]) {
    parts.push(beamBetween(v3(x, 0, 0), v3(x, 0.35 + floors * fh + 0.1, 0), 0.07, 0.3, CLAY.barkDeep, rng));
  }
  for (let f = 0; f <= floors; f++) {
    parts.push(board(w, 0.3, 0.035, CLAY.bark, rng).translate(0, 0.35 + f * fh, 0));
  }
  for (let f = 0; f < floors; f++) {
    const y = 0.35 + f * fh + fh / 2;
    const kind = f % 3;
    for (let k = 0; k < 7; k++) {
      const x = -w / 2 + 0.1 + k * 0.115;
      if (kind === 0) {
        const cane = new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8, 1, true);
        cane.rotateX(Math.PI / 2);
        cane.translate(x, y - 0.06 + (k % 2) * 0.07, 0.01);
        parts.push(paintFlat(cane, '#C9B27A'));
        const hole = new THREE.CircleGeometry(0.02, 8);
        hole.translate(x, y - 0.06 + (k % 2) * 0.07, 0.141);
        parts.push(paintFlat(hole, '#2A2118'));
      } else if (kind === 1) {
        const brick = bevelBox(0.1, 0.12, 0.26, '#B5533A', 0.9);
        brick.translate(x, y, 0);
        parts.push(brick);
      } else {
        const log = new THREE.CylinderGeometry(0.055, 0.055, 0.26, 10);
        log.rotateX(Math.PI / 2);
        log.translate(x, y, 0);
        parts.push(paintFlat(log, NATIVE.bark));
      }
    }
  }
  const roof = bevelBox(w + 0.3, 0.05, 0.45, weather(CLAY.barkRoof, rng), 0.9);
  roof.rotateZ(0.08);
  roof.translate(0, 0.4 + floors * fh + 0.12, 0);
  parts.push(roof);
  return mergePainted(parts);
}

/**
 * A pad that is still only a site: four stakes and a string line around a
 * patch of trodden earth, and a small stack of boards waiting.
 */
export function constructionSite(size = 1.8): THREE.BufferGeometry {
  const rng = mulberry32(1001);
  const parts: THREE.BufferGeometry[] = [];
  const h = size / 2;
  const corners = [v3(-h, 0, -h), v3(h, 0, -h), v3(h, 0, h), v3(-h, 0, h)];
  for (const c of corners) {
    parts.push(beamBetween(c.clone().setY(-0.05), c.clone().setY(0.42), 0.04, 0.04, CLAY.bark, rng));
    parts.push(nail(c.clone().setY(0.42), UP, METAL, 0.014));
  }
  for (let i = 0; i < 4; i++) {
    const a = corners[i]!.clone().setY(0.34);
    const b = corners[(i + 1) % 4]!.clone().setY(0.34);
    parts.push(...rope(a, b, 0.03, 0.006, '#E0C27A', 8));
  }
  const patch = new THREE.CircleGeometry(size * 0.55, 20);
  patch.rotateX(-Math.PI / 2);
  patch.translate(0, 0.012, 0);
  parts.push(paintFlat(patch, CLAY.soil));
  for (let k = 0; k < 4; k++) {
    const plank = board(1.0, 0.12, 0.03, CLAY.bark, rng);
    plank.rotateY(0.3 + (rng() - 0.5) * 0.2);
    plank.translate(h * 0.3, 0.035 + k * 0.034, h * 0.25);
    parts.push(plank);
  }
  const stone = smoothRock(0.16, 77);
  stone.translate(-h * 0.35, 0.08, h * 0.3);
  parts.push(paintFlat(stone, CLAY.stone));
  return mergePainted(parts);
}

/**
 * A parcel's marker: a short stake with a small sign and a ribbon. The ribbon
 * is white in the geometry and tinted per instance, so one pool colours every
 * parcel by its stage.
 */
export function parcelStake(): THREE.BufferGeometry {
  const rng = mulberry32(1101);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(beamBetween(v3(0, -0.1, 0), v3(0, 0.78, 0), 0.045, 0.045, CLAY.bark, rng));
  const sign = board(0.34, 0.2, 0.025, '#E8DCC2', rng);
  sign.rotateY(Math.PI / 2);
  sign.rotateZ(Math.PI / 2);
  sign.rotateX(Math.PI / 2);
  sign.translate(0, 0.62, 0.035);
  parts.push(sign);
  // The ribbon: white here, tinted by the instance colour.
  const ribbon = new THREE.PlaneGeometry(0.06, 0.24, 1, 4);
  const pos = ribbon.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getY(i) + 0.12) * 9) * 0.02);
  ribbon.computeVertexNormals();
  ribbon.translate(0.03, 0.68, 0);
  const [front, back] = doubleSidedRibbon(ribbon);
  parts.push(paintFlat(front, '#FFFFFF'), paintFlat(back, '#FFFFFF'));
  return mergePainted(parts);
}

function doubleSidedRibbon(geo: THREE.BufferGeometry): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const front = geo.toNonIndexed();
  const back = front.clone();
  const p = back.attributes.position as THREE.BufferAttribute;
  for (let t = 0; t + 2 < p.count; t += 3) {
    for (const attr of [back.attributes.position, back.attributes.normal] as THREE.BufferAttribute[]) {
      const n = attr.itemSize;
      const arr = attr.array as Float32Array;
      for (let k = 0; k < n; k++) {
        const tmp = arr[(t + 1) * n + k]!;
        arr[(t + 1) * n + k] = arr[(t + 2) * n + k]!;
        arr[(t + 2) * n + k] = tmp;
      }
    }
  }
  const nor = back.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, -nor.getX(i), -nor.getY(i), -nor.getZ(i));
  return [front, back];
}

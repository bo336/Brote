/**
 * The garden props from `14-CONTENT.md` §3 — the ones that are mostly about
 * something growing or living in them. Built from `carpentry.ts`; the registry
 * is in `props.ts`.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, DOMAIN_COLORS, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical } from './build';
import { beamBetween, board, logBetween, nail, v3, weather, type Rng } from './carpentry';
import { smoothRock } from './scatter';

const METAL = PIP_PARTS.metal;
const SAWN = CLAY.sand;

/** A leaf: a flattened, pointed blob, tilted as it grows. */
function leaf(at: THREE.Vector3, size: number, yaw: number, pitch: number, hex: string): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(size, 7, 4);
  g.scale(0.55, 0.14, 1);
  g.translate(0, 0, size * 0.8);
  g.rotateX(pitch);
  g.rotateY(yaw);
  g.translate(at.x, at.y, at.z);
  return paintFlat(g, hex);
}

/** A five-petal flower facing up and out, with a yellow heart. */
function blossom(parts: THREE.BufferGeometry[], at: THREE.Vector3, r: number, hex: string, rng: Rng): void {
  const tilt = (rng() - 0.5) * 0.8;
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * Math.PI * 2;
    const petal = new THREE.SphereGeometry(r, 6, 4);
    petal.scale(1, 0.35, 0.7);
    petal.translate(Math.cos(a) * r * 1.1, 0, Math.sin(a) * r * 1.1);
    petal.rotateZ(tilt);
    petal.translate(at.x, at.y, at.z);
    parts.push(paintFlat(petal, weather(hex, rng, 0.5)));
  }
  const heart = new THREE.SphereGeometry(r * 0.55, 6, 4);
  heart.translate(at.x, at.y + r * 0.2, at.z);
  parts.push(paintFlat(heart, DOMAIN_COLORS.energia));
}

/** "Un poste con techito. Los pájaros lo van a encontrar." */
export function comedero(): THREE.BufferGeometry {
  const rng = mulberry32(503);
  const parts: THREE.BufferGeometry[] = [
    ...logBetween(v3(0, -0.05, 0), v3(0, 1.02, 0), 0.05, 0.04, NATIVE.bark, SAWN, rng),
  ];
  const tray = board(0.44, 0.34, 0.025, CLAY.bark, rng);
  tray.translate(0, 1.04, 0);
  parts.push(tray);
  for (const s of [-1, 1]) {
    const lipX = bevelBox(0.44, 0.04, 0.015, weather(CLAY.barkDeep, rng), 0.93);
    lipX.translate(0, 1.07, s * 0.165);
    const lipZ = bevelBox(0.015, 0.04, 0.31, weather(CLAY.barkDeep, rng), 0.93);
    lipZ.translate(s * 0.215, 1.07, 0);
    parts.push(lipX, lipZ);
    parts.push(beamBetween(v3(s * 0.19, 1.05, 0), v3(s * 0.19, 1.37, 0), 0.025, 0.025, CLAY.barkDeep, rng));
    const roof = board(0.58, 0.26, 0.022, CLAY.barkRoof, rng);
    roof.rotateX(s * 0.62);
    roof.translate(0, 1.33, s * 0.1);
    parts.push(roof);
  }
  parts.push(beamBetween(v3(-0.3, 1.41, 0), v3(0.3, 1.41, 0), 0.03, 0.03, CLAY.barkDeep, rng));
  const seeds = [CLAY.sand, CLAY.soil, CLAY.barkRoof];
  for (let i = 0; i < 18; i++) {
    const seed = new THREE.SphereGeometry(0.012 + rng() * 0.006, 5, 4);
    seed.scale(1.3, 0.7, 1);
    seed.translate((rng() - 0.5) * 0.34, 1.062, (rng() - 0.5) * 0.24);
    parts.push(paintFlat(seed, seeds[i % 3]!));
  }
  return mergePainted(parts);
}

/** "Cajones apilados y abejas dando vueltas." A hive on its stand: bodies, handholds, lid, entrance. */
export function colmena(): THREE.BufferGeometry {
  const rng = mulberry32(557);
  const parts: THREE.BufferGeometry[] = [];
  for (const z of [-0.14, 0.14]) parts.push(beamBetween(v3(-0.26, 0.05, z), v3(0.26, 0.05, z), 0.07, 0.08, CLAY.barkDeep, rng));
  const paints = [PIP_PARTS.cloth, CLAY.sand, DOMAIN_COLORS.energia];
  let y = 0.1;
  for (let i = 0; i < 3; i++) {
    const h = i === 0 ? 0.24 : 0.18;
    const body = bevelBox(0.46, h, 0.4, weather(paints[i]!, rng, 0.6), 0.95);
    body.translate(0, y + h / 2, 0);
    parts.push(body);
    for (const [x, z, w, d] of [[0, 0.205, 0.12, 0.01], [0.235, 0, 0.01, 0.12], [-0.235, 0, 0.01, 0.12]] as const) {
      const grip = bevelBox(w, 0.03, d, weather(CLAY.barkDeep, rng, 0.4), 0.9);
      grip.translate(x, y + h * 0.62, z);
      parts.push(grip);
    }
    y += h + 0.004;
  }
  const lid = bevelBox(0.54, 0.07, 0.48, weather(METAL, rng, 0.4), 0.92);
  lid.translate(0, y + 0.035, 0);
  parts.push(lid);
  const slit = bevelBox(0.28, 0.022, 0.02, PIP_PARTS.eye, 0.9);
  slit.translate(0, 0.13, 0.2);
  const landing = board(0.32, 0.1, 0.018, CLAY.bark, rng);
  landing.translate(0, 0.105, 0.25);
  parts.push(slit, landing);
  // A brick on the lid, the way every beekeeper holds one down.
  const brick = bevelBox(0.18, 0.05, 0.09, weather(CLAY.path, rng, 0.5), 0.9);
  brick.rotateY(0.3);
  brick.translate(0.05, y + 0.1, -0.04);
  parts.push(brick);
  return mergePainted(parts);
}

/** "Un arco cubierto de enredaderas en flor." A trellis arch, climbing vines, blossoms. */
export function arco(): THREE.BufferGeometry {
  const rng = mulberry32(601);
  const parts: THREE.BufferGeometry[] = [];
  const half = 0.72;
  const rise = 1.5;
  const depth = 0.18;
  for (const x of [-half, half]) for (const z of [-depth, depth]) {
    parts.push(beamBetween(v3(x, -0.04, z), v3(x, rise, z), 0.065, 0.065, CLAY.bark, rng));
  }
  const arc = (t: number, z: number) => v3(-Math.cos(t * Math.PI) * half, rise + Math.sin(t * Math.PI) * 0.55, z);
  const segments = 10;
  for (const z of [-depth, depth]) {
    for (let i = 0; i < segments; i++) parts.push(beamBetween(arc(i / segments, z), arc((i + 1) / segments, z), 0.05, 0.06, CLAY.bark, rng));
  }
  for (let i = 0; i <= segments; i++) {
    parts.push(beamBetween(arc(i / segments, -depth - 0.03), arc(i / segments, depth + 0.03), 0.03, 0.03, CLAY.barkRoof, rng));
  }
  for (const x of [-half, half]) {
    for (let k = 0; k < 5; k++) {
      const y = 0.25 + k * 0.28;
      parts.push(beamBetween(v3(x, y, -depth), v3(x, y, depth), 0.02, 0.025, CLAY.barkRoof, rng));
    }
  }
  // The vine: leaves spiralling up both sides and draped over the top.
  const greens = [CLAY.leafDeep, CLAY.leaf, CLAY.grassDeep, NATIVE.ombu];
  const flowers = [DOMAIN_COLORS.animales, NATIVE.jacaranda, NATIVE.ceibo];
  for (const x of [-half, half]) {
    for (let k = 0; k < 46; k++) {
      const t = k / 46;
      const a = t * 20 + x;
      const at = v3(x + Math.cos(a) * 0.1, t * rise, Math.sin(a) * (depth + 0.06));
      parts.push(leaf(at, 0.05 + rng() * 0.03, rng() * Math.PI * 2, -0.4 + rng() * 0.8, weather(greens[k % 4]!, rng, 0.6)));
      if (k % 6 === 3) blossom(parts, at.clone().add(v3(0, 0.03, 0)), 0.024, flowers[k % 3]!, rng);
    }
  }
  for (let k = 0; k < 60; k++) {
    const t = rng();
    const at = arc(t, (rng() - 0.5) * (depth * 2 + 0.1)).add(v3(0, 0.04, 0));
    parts.push(leaf(at, 0.05 + rng() * 0.03, rng() * Math.PI * 2, -0.6 + rng() * 0.5, weather(greens[k % 4]!, rng, 0.6)));
    if (k % 4 === 1) blossom(parts, at.clone().add(v3(0, 0.03, 0)), 0.026, flowers[k % 3]!, rng);
  }
  return mergePainted(parts);
}

/** "Cuatro canteros con verduras creciendo en hilera." Board-framed beds, furrowed soil, four real crops. */
export function huerta(): THREE.BufferGeometry {
  const rng = mulberry32(653);
  const parts: THREE.BufferGeometry[] = [];
  const len = 1.5;
  for (let bed = 0; bed < 4; bed++) {
    const z = -0.63 + bed * 0.42;
    for (const s of [-1, 1]) {
      const sideBoard = bevelBox(len, 0.14, 0.03, weather(CLAY.bark, rng), 0.93);
      sideBoard.translate(0, 0.07, z + s * 0.16);
      const endBoard = bevelBox(0.03, 0.14, 0.32, weather(CLAY.bark, rng), 0.93);
      endBoard.translate(s * len * 0.5, 0.07, z);
      parts.push(sideBoard, endBoard);
      for (const e of [-1, 1]) parts.push(nail(v3(e * len * 0.49, 0.1, z + s * 0.176), v3(0, 0, s), METAL, 0.008));
    }
    const soil = bevelBox(len - 0.04, 0.05, 0.29, weather(CLAY.soilDeep, rng, 0.5), 0.96);
    soil.translate(0, 0.12, z);
    parts.push(soil);
    for (const off of [-0.07, 0.07]) {
      const furrow = bevelBox(len - 0.1, 0.012, 0.05, weather(CLAY.soil, rng, 0.4), 0.9);
      furrow.translate(0, 0.148, z + off);
      parts.push(furrow);
    }
    for (let i = 0; i < 5; i++) {
      const at = v3(-0.58 + i * 0.29, 0.15, z);
      if (bed === 0) {
        // Lettuce: a loose rosette, pale in the heart.
        for (let l = 0; l < 7; l++) parts.push(leaf(at, 0.06, (l / 7) * Math.PI * 2 + rng(), -0.55, weather(CLAY.grass, rng, 0.8)));
        parts.push(leaf(at.clone().add(v3(0, 0.02, 0)), 0.04, rng() * 6, -1.1, weather(CLAY.leaf, rng)));
      } else if (bed === 1) {
        // Carrots: the orange shoulder showing, and a feathery top.
        const root = new THREE.ConeGeometry(0.022, 0.05, 7);
        root.rotateX(Math.PI);
        root.translate(at.x, at.y + 0.01, at.z);
        parts.push(paintFlat(root, DOMAIN_COLORS.residuos));
        for (let l = 0; l < 5; l++) {
          const frond = new THREE.ConeGeometry(0.012, 0.16, 4);
          frond.translate(0, 0.08, 0);
          frond.rotateZ((rng() - 0.5) * 0.9);
          frond.rotateY(l * 1.3);
          frond.translate(at.x, at.y + 0.02, at.z);
          parts.push(paintFlat(frond, weather(CLAY.grassDeep, rng)));
        }
      } else if (bed === 2) {
        // Tomatoes: a cane, leaves, and fruit at three stages.
        parts.push(beamBetween(at, at.clone().add(v3(0, 0.42, 0)), 0.012, 0.012, CLAY.barkRoof, rng));
        for (let l = 0; l < 4; l++) parts.push(leaf(at.clone().add(v3(0, 0.12 + l * 0.08, 0)), 0.045, l * 1.9, -0.2, weather(CLAY.leafDeep, rng)));
        const ripe = [NATIVE.ceibo, DOMAIN_COLORS.residuos, CLAY.grass];
        for (let f = 0; f < 3; f++) {
          const fruit = new THREE.SphereGeometry(0.03, 8, 6);
          fruit.translate(at.x + (f - 1) * 0.04, at.y + 0.14 + f * 0.07, at.z + 0.03);
          parts.push(paintFlat(fruit, ripe[f]!));
        }
      } else {
        // Acelga: big crinkled leaves on pale ribs, standing up.
        for (let l = 0; l < 5; l++) {
          const yaw = (l / 5) * Math.PI * 2 + rng();
          parts.push(beamBetween(at, at.clone().add(v3(Math.sin(yaw) * 0.05, 0.13, Math.cos(yaw) * 0.05)), 0.01, 0.01, PIP_PARTS.cloth, rng));
          parts.push(leaf(at.clone().add(v3(Math.sin(yaw) * 0.06, 0.15, Math.cos(yaw) * 0.06)), 0.075, yaw, -1.2, weather(NATIVE.ombuDeep, rng, 0.8)));
        }
      }
    }
  }
  return mergePainted(parts);
}

/** "Piedras apiladas que alguien equilibró con paciencia." An apacheta: balanced stones, pebbles, moss. */
export function totem(): THREE.BufferGeometry {
  const rng = mulberry32(709);
  const parts: THREE.BufferGeometry[] = [];
  const sizes = [0.3, 0.25, 0.2, 0.16, 0.12, 0.085];
  let y = 0;
  for (let i = 0; i < sizes.length; i++) {
    const r = sizes[i]!;
    const stone = smoothRock(r, 710 + i);
    stone.scale(1.05, 0.55 + rng() * 0.12, 0.92);
    stone.rotateY(rng() * Math.PI * 2);
    stone.translate((rng() - 0.5) * 0.05, y + r * 0.5, (rng() - 0.5) * 0.05);
    parts.push(stone);
    y += r * 1.02;
  }
  for (let i = 0; i < 7; i++) {
    const a = rng() * Math.PI * 2;
    const pebble = smoothRock(0.035 + rng() * 0.03, 730 + i);
    pebble.scale(1, 0.6, 1);
    pebble.translate(Math.cos(a) * (0.33 + rng() * 0.12), 0.015, Math.sin(a) * (0.33 + rng() * 0.12));
    parts.push(pebble);
  }
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2;
    const moss = new THREE.SphereGeometry(0.045 + rng() * 0.03, 7, 4);
    moss.scale(1, 0.3, 1);
    moss.translate(Math.cos(a) * 0.22, 0.13 + rng() * 0.03, Math.sin(a) * 0.2);
    parts.push(paintVertical(moss, NATIVE.moss, CLAY.grass, 1.2));
  }
  return mergePainted(parts);
}

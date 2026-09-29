/**
 * What you planted, as it grows: one shape per native species, built from the
 * same clay as the rest of the island (`06-ART-DIRECTION.md`).
 *
 * A parcel used to go from "planted" to "alive" with nothing but greener grass.
 * Now every species you put in it stands there — a clump of flechilla with its
 * straw tips, margaritas, a chilca, the tala you raised in the vivero — and the
 * parcel's stage decides how big they are (`components/mundo3d/game/scene/Planted.tsx`).
 *
 * Seven looks, one per `PlantLook`, each tinted by the species' own colour and
 * a few with a signature detail (the cortadera's plumes, the totora's cattails,
 * the camalote's floating rosette, the chaguar's spikes). Trees and shrubs are
 * grown with `growTree` in the species' colours: flowering ones blossom in
 * their colour, green ones take it for their leaves.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE } from '../palette';
import { mergePainted, paintFlat, paintVertical } from './build';
import { blade } from './scatter';
import { growTree, type SpeciesSpec, type TreeSpecies } from './tree';

export type PlantedLookKind = 'pasto' | 'flor' | 'arbusto' | 'arbol' | 'acuatica' | 'suculenta' | 'cojin';

export interface PlantedSpecies {
  id: string;
  look: PlantedLookKind;
  color: string;
}

/**
 * One species' shapes: `solid` is vertex-coloured clay (everything but leaf
 * cards), `leaves` the alpha-tested cards of a tree or shrub. `height` is the
 * grown height in metres, for the growth animation and the tag above it.
 */
export interface PlantedBuild {
  solid: THREE.BufferGeometry;
  leaves: THREE.BufferGeometry | null;
  height: number;
}

const tmp = new THREE.Color();

function mix(a: string, b: string, t: number): string {
  return `#${tmp.set(a).lerp(new THREE.Color(b), t).getHexString()}`;
}

function shade(hex: string, dl: number, ds = 0): string {
  const hsl = { h: 0, s: 0, l: 0 };
  tmp.set(hex).getHSL(hsl);
  tmp.setHSL(hsl.h, Math.min(1, Math.max(0, hsl.s + ds)), Math.min(1, Math.max(0, hsl.l + dl)));
  return `#${tmp.getHexString()}`;
}

/** Green-ish colours dress the leaves; anything else is a flower colour. */
function isGreen(hex: string): boolean {
  const hsl = { h: 0, s: 0, l: 0 };
  tmp.set(hex).getHSL(hsl);
  return hsl.h > 0.16 && hsl.h < 0.45 && hsl.l < 0.7;
}

function isShowy(hex: string): boolean {
  const hsl = { h: 0, s: 0, l: 0 };
  tmp.set(hex).getHSL(hsl);
  return !isGreen(hex) && (hsl.s > 0.3 || hsl.l > 0.85);
}

// ── Grasses ─────────────────────────────────────────────────────────────────

/**
 * A bunchgrass: sixteen arching blades from one crown, green at the foot and
 * the species' colour at the tips — flechilla straw, paja colorada rust.
 * Cortadera and cola de zorro add their plumes on tall stalks.
 */
function bunchGrass(p: PlantedSpecies, seed: number): PlantedBuild {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const tip = mix(CLAY.grass, p.color, 0.72);
  const blades = 16;
  for (let i = 0; i < blades; i++) {
    const h = 0.36 + rng() * 0.26;
    const b = blade(h, 0.022 + rng() * 0.01, 0.1 + rng() * 0.12, CLAY.grassDeep, tip);
    b.rotateX(0.12 + rng() * 0.42);
    b.rotateY((i / blades) * Math.PI * 2 + rng() * 0.5);
    b.translate((rng() - 0.5) * 0.06, 0, (rng() - 0.5) * 0.06);
    parts.push(b);
  }
  let height = 0.55;
  if (p.id === 'cortadera' || p.id === 'cola_zorro') {
    const plumes = p.id === 'cortadera' ? 4 : 3;
    for (let i = 0; i < plumes; i++) {
      const h = (p.id === 'cortadera' ? 1.05 : 0.7) + rng() * 0.25;
      const a = rng() * Math.PI * 2;
      const lean = 0.08 + rng() * 0.12;
      const stalk = new THREE.CylinderGeometry(0.006, 0.01, h, 4, 1);
      stalk.translate(0, h / 2, 0);
      stalk.rotateZ(lean);
      stalk.rotateY(a);
      parts.push(paintVertical(stalk, CLAY.grassDeep, mix(CLAY.grass, p.color, 0.5)));
      // The plume is a panicle, not a swab: a spray of fine strands that fan
      // out of the stalk's tip and droop to one side, pale at the ends.
      const strands = p.id === 'cortadera' ? 18 : 11;
      const len = p.id === 'cortadera' ? 0.3 : 0.2;
      const droop = rng() * Math.PI * 2;
      for (let s = 0; s < strands; s++) {
        const k = s / strands;
        const strand = blade(len * (0.7 + rng() * 0.5), 0.016, 0.05 + k * 0.05, shade(p.color, -0.12), shade(p.color, 0.08));
        strand.rotateX(0.12 + rng() * 0.35);
        strand.rotateY(droop + (rng() - 0.5) * 1.6);
        strand.translate(0, h - len * 0.35 + k * len * 0.45, 0);
        strand.rotateZ(lean);
        strand.rotateY(a);
        parts.push(strand);
      }
      height = Math.max(height, h + len);
    }
  }
  return { solid: mergePainted(parts), leaves: null, height };
}

// ── Flowers ─────────────────────────────────────────────────────────────────

/** A head of rounded petals around a centre, at `y`, tipped `tilt` radians. */
function flowerHead(parts: THREE.BufferGeometry[], x: number, y: number, z: number, petal: string, centre: string, size: number, rng: () => number): void {
  const n = 5 + Math.floor(rng() * 3);
  const tilt = (rng() - 0.5) * 0.5;
  const turn = rng() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const g = new THREE.SphereGeometry(0.034 * size, 5, 4);
    g.scale(1, 0.32, 0.58);
    g.translate(0.036 * size, 0, 0);
    g.rotateY((i / n) * Math.PI * 2);
    g.rotateX(tilt);
    g.rotateY(turn);
    g.translate(x, y, z);
    parts.push(paintFlat(g, i % 2 ? petal : shade(petal, -0.05)));
  }
  const c = new THREE.SphereGeometry(0.02 * size, 6, 5);
  c.scale(1, 0.7, 1);
  c.translate(x, y + 0.006, z);
  parts.push(paintFlat(c, centre));
}

/**
 * A flowering clump: a basal rosette of leaves and four or five stems of
 * different heights, each with a head in the species' colour. The achira gets
 * broad paddle leaves and a taller spike instead.
 */
function flowerClump(p: PlantedSpecies, seed: number): PlantedBuild {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const achira = p.id === 'achira';
  const leaves = achira ? 5 : 4;
  for (let i = 0; i < leaves; i++) {
    const g = new THREE.SphereGeometry(achira ? 0.09 : 0.05, 6, 4);
    g.scale(achira ? 0.55 : 1, achira ? 2.6 : 0.25, achira ? 0.3 : 0.55);
    g.translate(achira ? 0 : 0.05, achira ? 0.2 : 0.02, 0);
    if (achira) g.rotateZ(0.35 + rng() * 0.2);
    g.rotateY((i / leaves) * Math.PI * 2 + rng() * 0.6);
    parts.push(paintVertical(g, CLAY.leafDeep, CLAY.leaf, 0.7));
  }
  const stems = achira ? 2 : 5;
  const centre = p.color.toLowerCase() === '#f4f1e6' || isShowy(p.color) ? '#E9B949' : CLAY.sand;
  let height = 0.3;
  for (let i = 0; i < stems; i++) {
    const h = (achira ? 0.62 : 0.2) + rng() * (achira ? 0.2 : 0.2);
    const a = rng() * Math.PI * 2;
    const r = 0.02 + rng() * 0.06;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const stem = new THREE.CylinderGeometry(0.005, 0.008, h, 4, 1);
    stem.translate(x, h / 2, z);
    parts.push(paintVertical(stem, CLAY.grassDeep, CLAY.grass));
    flowerHead(parts, x, h, z, p.color, centre, achira ? 1.9 : 1 + rng() * 0.25, rng);
    height = Math.max(height, h + 0.04);
  }
  return { solid: mergePainted(parts), leaves: null, height };
}

// ── Wetland ─────────────────────────────────────────────────────────────────

/**
 * Junco and totora stand in clumps of straight stems; the totora carries its
 * brown cattails. The camalote floats: a rosette of round glossy leaves and one
 * lilac spike.
 */
function wetland(p: PlantedSpecies, seed: number): PlantedBuild {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  if (p.id === 'camalote') {
    for (let i = 0; i < 7; i++) {
      const g = new THREE.SphereGeometry(0.08, 8, 5);
      g.scale(1, 0.32, 0.85);
      g.translate(0.09 + rng() * 0.04, 0.05 + rng() * 0.03, 0);
      g.rotateY((i / 7) * Math.PI * 2 + rng() * 0.3);
      parts.push(paintVertical(g, CLAY.leafDeep, mix(CLAY.leaf, p.color, 0.3), 0.8));
    }
    const spike = new THREE.CylinderGeometry(0.008, 0.012, 0.26, 4, 1);
    spike.translate(0, 0.17, 0);
    parts.push(paintFlat(spike, CLAY.grassDeep));
    for (let k = 0; k < 6; k++) flowerHead(parts, 0, 0.18 + k * 0.035, 0, '#B39DDB', '#F2D14A', 0.7, rng);
    return { solid: mergePainted(parts), leaves: null, height: 0.36 };
  }
  const totora = p.id === 'totora';
  const stems = totora ? 9 : 11;
  let height = 0.9;
  for (let i = 0; i < stems; i++) {
    const h = (totora ? 0.95 : 0.7) + rng() * 0.4;
    const b = blade(h, totora ? 0.02 : 0.012, 0.02 + rng() * 0.05, CLAY.grassDeep, mix(CLAY.grass, p.color, 0.6));
    b.rotateX(rng() * 0.2);
    b.rotateY(rng() * Math.PI * 2);
    b.translate((rng() - 0.5) * 0.16, 0, (rng() - 0.5) * 0.16);
    parts.push(b);
    height = Math.max(height, h);
    if (totora && i < 3) {
      const head = new THREE.CylinderGeometry(0.028, 0.028, 0.16, 7, 1);
      head.translate((rng() - 0.5) * 0.1, h * 0.82, (rng() - 0.5) * 0.1);
      parts.push(paintFlat(head, '#6B4A2E'));
    }
  }
  return { solid: mergePainted(parts), leaves: null, height };
}

// ── Dry country ─────────────────────────────────────────────────────────────

/** Ribs on a column: the radius swells and dips around the circumference. */
function ribbed(geo: THREE.CylinderGeometry, ribs: number, depth: number): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-5) continue;
    const a = Math.atan2(z, x);
    const k = 1 + depth * Math.cos(a * ribs);
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** A column of cactus with a domed top, from `(x, y, z)` up `h`. */
function column(parts: THREE.BufferGeometry[], x: number, y: number, z: number, r: number, h: number, low: string, high: string): void {
  const body = ribbed(new THREE.CylinderGeometry(r, r * 1.05, h, 16, 5, true), 8, 0.12);
  body.translate(x, y + h / 2, z);
  parts.push(paintVertical(body, low, high, 0.8));
  const cap = new THREE.SphereGeometry(r, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.translate(x, y + h, z);
  parts.push(paintFlat(cap, high));
}

/** The cardón: a ribbed column with two arms that turn up, and a white flower on top. */
function cardon(p: PlantedSpecies, seed: number): PlantedBuild {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const low = shade(p.color, -0.12);
  const high = shade(p.color, 0.06);
  const h = 1.25 + rng() * 0.3;
  column(parts, 0, 0, 0, 0.12, h, low, high);
  for (let side = -1; side <= 1; side += 2) {
    const at = h * (0.35 + rng() * 0.2);
    const out = 0.24 + rng() * 0.06;
    const elbow = new THREE.CylinderGeometry(0.075, 0.075, out, 10, 1);
    elbow.rotateZ(Math.PI / 2);
    elbow.translate(side * out / 2, at, 0);
    parts.push(paintFlat(elbow, low));
    column(parts, side * out, at, 0, 0.08, 0.35 + rng() * 0.25, low, high);
  }
  flowerHead(parts, 0, h + 0.1, 0, '#F4F1E6', '#E9B949', 1.3, rng);
  return { solid: mergePainted(parts), leaves: null, height: h + 0.15 };
}

/** The chaguar: a rosette of stiff, spiny leaves around a short red-tipped spike. */
function rosette(p: PlantedSpecies, seed: number): PlantedBuild {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const leaves = 14;
  for (let i = 0; i < leaves; i++) {
    const h = 0.34 + rng() * 0.18;
    const b = blade(h, 0.035, 0.12 + rng() * 0.08, shade(p.color, -0.1), shade(p.color, 0.1));
    b.rotateX(0.5 + rng() * 0.5);
    b.rotateY((i / leaves) * Math.PI * 2 + rng() * 0.3);
    parts.push(b);
  }
  const spike = new THREE.ConeGeometry(0.05, 0.2, 7, 1);
  spike.translate(0, 0.16, 0);
  parts.push(paintVertical(spike, shade(p.color, -0.05), '#C8423A'));
  return { solid: mergePainted(parts), leaves: null, height: 0.45 };
}

/**
 * The yareta: a tight green cushion, like a mossy boulder, that grows a
 * centimetre a year. A squashed noisy dome, darker where it meets the ground.
 */
function cushion(p: PlantedSpecies, seed: number): PlantedBuild {
  const rng = mulberry32(seed);
  const g = new THREE.SphereGeometry(0.42, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const a = rng() * 10;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const bump = 1 + 0.07 * Math.sin(x * 11 + a) * Math.cos(z * 9 - a) + 0.04 * Math.sin((x + z) * 23);
    pos.setXYZ(i, x * bump * (1.05 + 0.1 * Math.sin(a)), y * 0.55 * bump, z * bump);
  }
  g.computeVertexNormals();
  const parts = [paintVertical(g, shade(p.color, -0.18), shade(p.color, 0.08), 0.6)];
  // Pale flecks: the yareta's tiny flowers.
  for (let i = 0; i < 9; i++) {
    const f = new THREE.SphereGeometry(0.018, 5, 4);
    const r = 0.3 * Math.sqrt(rng());
    const t = rng() * Math.PI * 2;
    f.translate(Math.cos(t) * r, 0.22 * Math.sqrt(1 - (r / 0.45) ** 2) + 0.01, Math.sin(t) * r);
    parts.push(paintFlat(f, '#E8E2B8'));
  }
  return { solid: mergePainted(parts), leaves: null, height: 0.25 };
}

// ── Trees and shrubs ────────────────────────────────────────────────────────

/** Which crown each planted tree borrows. */
const TREE_BASE: Partial<Record<string, TreeSpecies>> = {
  ceibo: 'birch', lapacho: 'birch', aguaribay: 'birch',
};

/**
 * A tree or a shrub from `growTree`, in the species' colours: a showy colour
 * becomes blossom scattered through the crown (ceibo red, lapacho pink,
 * espinillo yellow); a green one becomes its leaves.
 */
function woody(p: PlantedSpecies, seed: number): PlantedBuild {
  const shrub = p.look === 'arbusto';
  const base: TreeSpecies = shrub ? 'bush' : TREE_BASE[p.id] ?? 'oak';
  const look: Partial<SpeciesSpec> = {};
  if (isShowy(p.color)) {
    look.bloom = shrub ? 0.28 : p.id === 'lapacho' ? 0.6 : 0.4;
    look.bloomColor = p.color;
    if (shrub) look.leaf = [NATIVE.ceiboLeafDeep, NATIVE.ceiboLeaf, NATIVE.ceiboLeafLight];
  } else {
    look.bloom = 0;
    look.leaf = [shade(p.color, -0.14), p.color, shade(p.color, 0.1)];
  }
  if (p.id === 'cachiyuyo') look.leaf = ['#7F8C7A', '#A3AE9B', '#C1C8B6'];
  // Full detail: a planted tree is seen up close, and there are few of them.
  const built = growTree(base, seed, 0, look);
  return { solid: paintBark(built.wood), leaves: built.leaves, height: built.height };
}

/** `growTree`'s wood comes painted already; this only guarantees a colour attribute. */
function paintBark(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.attributes.color) paintVertical(geo, NATIVE.barkDark, NATIVE.bark);
  return geo;
}

/** Build the shape for one species. Deterministic from its id. */
export function plantedGeometry(p: PlantedSpecies): PlantedBuild {
  let seed = 7;
  for (let i = 0; i < p.id.length; i++) seed = (seed * 31 + p.id.charCodeAt(i)) >>> 0;
  switch (p.look) {
    case 'pasto':
      return bunchGrass(p, seed);
    case 'flor':
      return flowerClump(p, seed);
    case 'acuatica':
      return wetland(p, seed);
    case 'suculenta':
      return cardon(p, seed);
    case 'cojin':
      return cushion(p, seed);
    case 'arbusto':
      return p.id === 'chaguar' ? rosette(p, seed) : woody(p, seed);
    case 'arbol':
    default:
      return woody(p, seed);
  }
}

/** How many of one species stand in a parcel, by look. */
export const PLANTED_PER_PARCEL: Record<PlantedLookKind, number> = {
  pasto: 6, flor: 6, arbusto: 2, arbol: 1, acuatica: 5, suculenta: 1, cojin: 2,
};

/**
 * Size by parcel stage: just planted, alive, flourishing. Trees start as a
 * sapling a fifth of their size and are not full-grown even in flower — a tree
 * that is grown in a week is a toy.
 */
export function plantedScale(look: PlantedLookKind, stage: number): number {
  const tree = look === 'arbol';
  if (stage <= 3) return tree ? 0.2 : 0.45;
  if (stage === 4) return tree ? 0.45 : 0.85;
  return tree ? 0.7 : 1;
}

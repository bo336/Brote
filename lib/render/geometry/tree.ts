/**
 * Native trees, grown in code (`23-ART-DIRECTION-V2.md` §1).
 *
 * The four shapes the biome mixes ask for keep their old keys — so every saved
 * island and every biome table still works — but they are no longer a pine, an
 * oak and a birch drawn as green balloons. They are four trees an Argentine
 * player knows on sight:
 *
 *   `oak`   → **ombú**: a massive, buttressed trunk and a wide umbrella of dark leaves.
 *   `pine`  → **araucaria (pehuén)**: a straight column, and branches in whorls at the
 *             top holding tufts of needles — the candelabra silhouette.
 *   `birch` → **jacarandá**: a slender, forking trunk under an airy crown half purple.
 *   `bush`  → **ceibo**: low and twisted, green with red flower spikes.
 *
 * Wood is tapered tubes with a flared base; foliage is **cards carrying painted
 * leaf clusters** from the leaf atlas, with normals bent outward from the crown
 * so the canopy lights as one soft volume instead of as a pile of planes.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { NATIVE } from '../palette';
import { paintVertical } from './build';
import { LEAF_TILE, tileUV, type LeafTile } from './leaf-atlas';

export type TreeSpecies = 'pine' | 'oak' | 'birch' | 'bush';

/** 0 full detail, 1 the mid distance, 2 the far silhouette. */
export type TreeLod = 0 | 1 | 2;

export interface Piece {
  geo: THREE.BufferGeometry;
  matrix: THREE.Matrix4;
}

export interface TreeBuild {
  /** Trunk and branches. */
  wood: THREE.BufferGeometry;
  /** Leaf cards, alpha-tested against the atlas. */
  leaves: THREE.BufferGeometry;
  /** Height of the finished tree. */
  height: number;
}

/** Merge transformed geometries into one (position, normal and uv). */
export function mergePieces(pieces: Piece[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const nm = new THREE.Matrix3();
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const p of pieces) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
    const gp = g.attributes.position as THREE.BufferAttribute;
    const gn = g.attributes.normal as THREE.BufferAttribute | undefined;
    const gu = g.attributes.uv as THREE.BufferAttribute | undefined;
    nm.getNormalMatrix(p.matrix);
    const base = pos.length / 3;
    for (let i = 0; i < gp.count; i++) {
      v.fromBufferAttribute(gp, i).applyMatrix4(p.matrix);
      pos.push(v.x, v.y, v.z);
      if (gn) {
        n.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize();
        nor.push(n.x, n.y, n.z);
      } else nor.push(0, 1, 0);
      if (gu) uv.push(gu.getX(i), gu.getY(i));
      else uv.push(0, 0);
      idx.push(base + i);
    }
    if (g !== p.geo) g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

type Crown = 'umbrella' | 'whorl' | 'airy' | 'shrub';

export interface SpeciesSpec {
  trunkH: number;
  trunkR: number;
  /** How much wider the base is than the trunk. The ombú's buttress. */
  flare: number;
  crown: Crown;
  crownR: number;
  crownH: number;
  clusters: number;
  cardSize: number;
  cardsPerCluster: number;
  tile: LeafTile;
  leaf: readonly [string, string, string];
  /** Fraction of cards that are blossom, and their colour. */
  bloom: number;
  bloomColor: string;
  bark: readonly [string, string];
}

const SPECIES: Record<TreeSpecies, SpeciesSpec> = {
  oak: {
    trunkH: 1.1, trunkR: 0.2, flare: 2.2, crown: 'umbrella', crownR: 1.55, crownH: 0.9,
    // Many small cards, not a few big ones: at 0.95 m a card's painted leaves came
    // out forty centimetres long on a grown tree — fig leaves, not an ombú.
    clusters: 70, cardSize: 0.55, cardsPerCluster: 4, tile: LEAF_TILE.broad,
    leaf: [NATIVE.ombuDeep, NATIVE.ombu, NATIVE.ombuLight], bloom: 0, bloomColor: NATIVE.ombu,
    bark: [NATIVE.barkDark, NATIVE.bark],
  },
  pine: {
    trunkH: 2.6, trunkR: 0.1, flare: 1.3, crown: 'whorl', crownR: 1.05, crownH: 0.9,
    clusters: 30, cardSize: 0.75, cardsPerCluster: 3, tile: LEAF_TILE.needle,
    leaf: [NATIVE.araucariaDeep, NATIVE.araucaria, NATIVE.araucariaLight], bloom: 0, bloomColor: NATIVE.araucaria,
    bark: [NATIVE.barkGrey, NATIVE.barkGreyLight],
  },
  birch: {
    trunkH: 1.4, trunkR: 0.075, flare: 1.4, crown: 'airy', crownR: 1.3, crownH: 1.0,
    clusters: 44, cardSize: 0.65, cardsPerCluster: 3, tile: LEAF_TILE.fine,
    leaf: [NATIVE.jacarandaLeafDeep, NATIVE.jacarandaLeaf, NATIVE.jacarandaLeafLight], bloom: 0.55,
    bloomColor: NATIVE.jacaranda, bark: [NATIVE.barkDark, NATIVE.bark],
  },
  bush: {
    trunkH: 0.45, trunkR: 0.06, flare: 1.5, crown: 'shrub', crownR: 0.75, crownH: 0.7,
    clusters: 26, cardSize: 0.4, cardsPerCluster: 3, tile: LEAF_TILE.broad,
    leaf: [NATIVE.ceiboLeafDeep, NATIVE.ceiboLeaf, NATIVE.ceiboLeafLight], bloom: 0.3,
    bloomColor: NATIVE.ceibo, bark: [NATIVE.barkDark, NATIVE.bark],
  },
};

/** Detail by LOD: how much of the crown is drawn, and how round the wood is. */
const LOD: Record<TreeLod, { clusters: number; cards: number; radial: number }> = {
  0: { clusters: 1, cards: 1, radial: 8 },
  1: { clusters: 0.7, cards: 0.67, radial: 6 },
  2: { clusters: 0.45, cards: 0.67, radial: 5 },
};

const up = new THREE.Vector3(0, 1, 0);

/** One tapered wood segment from `a` to `b`. */
function limb(out: Piece[], a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, radial: number): void {
  const dir = b.clone().sub(a);
  const len = dir.length();
  if (len < 1e-4) return;
  const geo = new THREE.CylinderGeometry(r1, r0, len, radial, 2, false);
  const m = new THREE.Matrix4().compose(
    a.clone().addScaledVector(dir, 0.5),
    new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  out.push({ geo, matrix: m });
  // A knuckle at the joint, so a bend never shows a seam.
  const knot = new THREE.SphereGeometry(r1 * 1.05, radial, 4);
  out.push({ geo: knot, matrix: new THREE.Matrix4().makeTranslation(b.x, b.y, b.z) });
}

/** Where the foliage clusters sit, by crown shape. Returns cluster centres and the crown's own centre. */
function crownPoints(spec: SpeciesSpec, top: THREE.Vector3, count: number, rng: () => number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    if (spec.crown === 'umbrella') {
      // A broad dome, denser at its skin, flat underneath.
      const r = spec.crownR * Math.sqrt(0.25 + rng() * 0.75);
      const y = spec.crownH * (1 - (r / spec.crownR) ** 2) * (0.55 + rng() * 0.45);
      pts.push(new THREE.Vector3(top.x + Math.cos(a) * r, top.y + y, top.z + Math.sin(a) * r));
    } else if (spec.crown === 'whorl') {
      // Tiers of horizontal branches near the top, each ending in a tuft.
      const tier = Math.floor(rng() * 3);
      const r = spec.crownR * (0.55 + tier * 0.22) * (0.8 + rng() * 0.3);
      const y = -tier * 0.35 + rng() * 0.15;
      pts.push(new THREE.Vector3(top.x + Math.cos(a) * r, top.y + y, top.z + Math.sin(a) * r));
    } else if (spec.crown === 'airy') {
      // A wide, open ellipsoid with gaps you can see sky through.
      const r = spec.crownR * (0.35 + rng() * 0.65);
      const y = spec.crownH * (rng() - 0.2);
      pts.push(new THREE.Vector3(top.x + Math.cos(a) * r, top.y + y, top.z + Math.sin(a) * r));
    } else {
      const r = spec.crownR * Math.sqrt(rng());
      const y = spec.crownH * rng() * 0.9;
      pts.push(new THREE.Vector3(top.x + Math.cos(a) * r, top.y + y - 0.2, top.z + Math.sin(a) * r));
    }
  }
  return pts;
}

/**
 * Grow one tree. Deterministic from `(species, seed, lod)` — the same seed gives
 * the same tree on every device. `look` overrides the species' colours and
 * proportions: a planted lapacho is the airy crown in pink, a tala the umbrella
 * in its own green (`planted.ts`).
 */
export function growTree(species: TreeSpecies, seed: number, lod: TreeLod = 0, look?: Partial<SpeciesSpec>): TreeBuild {
  const rng = mulberry32(seed * 7919 + species.length);
  const spec: SpeciesSpec = look ? { ...SPECIES[species], ...look } : SPECIES[species];
  const detail = LOD[lod];
  const wood: Piece[] = [];

  // ── The trunk: a gently bending column, flared at the foot.
  const lean = new THREE.Vector3((rng() - 0.5) * 0.35, 1, (rng() - 0.5) * 0.35).normalize();
  const segments = 4;
  let prev = new THREE.Vector3(0, 0, 0);
  const trunkPts: THREE.Vector3[] = [prev.clone()];
  for (let s = 1; s <= segments; s++) {
    const t = s / segments;
    const p = new THREE.Vector3(
      lean.x * spec.trunkH * t + Math.sin(t * 3 + seed) * 0.06,
      spec.trunkH * t,
      lean.z * spec.trunkH * t + Math.cos(t * 2.3 + seed) * 0.06,
    );
    const r0 = spec.trunkR * (s === 1 ? spec.flare : 1 - (t - 0.25) * 0.35);
    const r1 = spec.trunkR * (1 - t * 0.35);
    limb(wood, prev, p, r0, r1, detail.radial);
    trunkPts.push(p.clone());
    prev = p;
  }
  const top = prev.clone();

  // Buttress roots on the ombú: the base spreads into the ground.
  if (spec.flare > 2) {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + rng() * 0.5;
      const foot = new THREE.Vector3(Math.cos(a) * spec.trunkR * 3.2, -0.05, Math.sin(a) * spec.trunkR * 3.2);
      limb(wood, new THREE.Vector3(0, spec.trunkH * 0.3, 0), foot, spec.trunkR * 0.7, spec.trunkR * 0.25, 5);
    }
  }

  // ── Main branches from the upper trunk out toward the crown.
  const clusterCount = Math.max(6, Math.round(spec.clusters * detail.clusters));
  const clusters = crownPoints(spec, top, clusterCount, rng);
  const branches = spec.crown === 'shrub' ? 4 : spec.crown === 'whorl' ? 9 : 6;
  for (let b = 0; b < branches; b++) {
    const target = clusters[Math.floor((b / branches) * clusters.length)]!;
    const from = trunkPts[Math.max(2, segments - (b % 2))]!;
    const mid = from.clone().lerp(target, 0.55).add(new THREE.Vector3(0, 0.15, 0));
    limb(wood, from, mid, spec.trunkR * 0.55, spec.trunkR * 0.32, Math.max(4, detail.radial - 2));
    limb(wood, mid, target, spec.trunkR * 0.32, spec.trunkR * 0.12, Math.max(4, detail.radial - 3));
  }

  // ── Foliage cards.
  const crownCentre = top.clone().add(new THREE.Vector3(0, spec.crownH * 0.35, 0));
  const leafTile = tileUV(spec.tile);
  const bloomTile = tileUV(LEAF_TILE.blossom);
  const cardsPer = Math.max(2, Math.round(spec.cardsPerCluster * detail.cards));
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const corner = new THREE.Vector3();
  const outward = new THREE.Vector3();
  let maxY = top.y;

  for (const centre of clusters) {
    for (let k = 0; k < cardsPer; k++) {
      const size = spec.cardSize * (0.75 + rng() * 0.5);
      e.set(rng() * Math.PI, rng() * Math.PI * 2, rng() * Math.PI);
      q.setFromEuler(e);
      const off = new THREE.Vector3((rng() - 0.5) * size * 0.5, (rng() - 0.5) * size * 0.35, (rng() - 0.5) * size * 0.5);
      const cardCentre = centre.clone().add(off);
      // Canopy normal: out from the crown's centre, so the whole crown shades as one volume.
      outward.copy(cardCentre).sub(crownCentre);
      outward.y += spec.crown === 'whorl' ? 0.6 : 0.25;
      outward.normalize();
      const bloom = rng() < spec.bloom;
      const tile = bloom ? bloomTile : leafTile;
      if (bloom) {
        c.set(spec.bloomColor).offsetHSL((rng() - 0.5) * 0.03, 0, (rng() - 0.5) * 0.08);
      } else {
        // Deep underneath, light on the sunny top of the crown.
        const height = THREE.MathUtils.clamp((cardCentre.y - top.y) / (spec.crownH + 0.001) + 0.35, 0, 1);
        const shade = spec.leaf[height > 0.66 ? 2 : height > 0.33 ? 1 : 0];
        c.set(shade).offsetHSL((rng() - 0.5) * 0.025, 0, (rng() - 0.5) * 0.06);
      }
      const base = pos.length / 3;
      const corners: [number, number, number, number][] = [
        [-0.5, -0.5, tile[0], tile[1]], [0.5, -0.5, tile[2], tile[1]],
        [0.5, 0.5, tile[2], tile[3]], [-0.5, 0.5, tile[0], tile[3]],
      ];
      for (const [cx, cy, u, v] of corners) {
        corner.set(cx * size, cy * size, 0).applyQuaternion(q).add(cardCentre);
        pos.push(corner.x, corner.y, corner.z);
        nor.push(outward.x, outward.y, outward.z);
        uv.push(u, v);
        col.push(c.r, c.g, c.b);
        maxY = Math.max(maxY, corner.y);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  const leaves = new THREE.BufferGeometry();
  leaves.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  leaves.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  leaves.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  leaves.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  leaves.setIndex(idx);

  // The merge carries each cylinder's own smooth normals. Recomputing them on a
  // non-indexed merge gives every triangle its face normal — which is what made
  // the first ombú trunks read as carved planks.
  const woodGeo = paintVertical(mergePieces(wood), spec.bark[0], spec.bark[1], 0.8);
  for (const p of wood) p.geo.dispose();
  return { wood: woodGeo, leaves, height: maxY };
}

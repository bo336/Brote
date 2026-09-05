/**
 * Procedural trees — ported from the old `components/mundo/Vegetation.tsx`.
 *
 * Recursive growth: a tapered trunk splits into branches, branches split again,
 * and leaf clusters sit at the tips. Each species has its own growth rules, so a
 * pine, an oak and a birch are genuinely different shapes instead of recoloured
 * blobs. This was one of the four things worth rescuing (`02-AUDIT.md` §8).
 *
 * What changed: it is now **pure geometry** — no React, no `useMemo`, no
 * component — and it takes an LOD level, because three LODs are free when the
 * geometry is generated rather than loaded.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY } from '../palette';
import { paintVertical } from './build';

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
  /** Leaf cards. Separate so bark and foliage can light differently. */
  leaves: THREE.BufferGeometry;
  /** Height of the finished tree, for blob-shadow sizing and LOD switching. */
  height: number;
}

/** Merge transformed geometries into one (position, normal and uv only). */
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

interface SpeciesParams {
  trunkH: number;
  trunkR: number;
  levels: number;
  kids: number[];
  spread: number;
  drop: number;
  leafSize: number;
  leafPer: number;
}

/** Growth rules per species, verbatim from the old `Vegetation.tsx`. */
const PARAMS: Record<TreeSpecies, SpeciesParams> = {
  pine: { trunkH: 1.5, trunkR: 0.075, levels: 4, kids: [3, 3, 2], spread: 0.62, drop: 0.66, leafSize: 0.42, leafPer: 3 },
  oak: { trunkH: 0.95, trunkR: 0.1, levels: 4, kids: [3, 3, 2], spread: 1.02, drop: 0.72, leafSize: 0.52, leafPer: 4 },
  birch: { trunkH: 1.35, trunkR: 0.055, levels: 3, kids: [2, 3], spread: 0.78, drop: 0.7, leafSize: 0.4, leafPer: 3 },
  bush: { trunkH: 0.24, trunkR: 0.045, levels: 3, kids: [4, 3], spread: 1.25, drop: 0.74, leafSize: 0.34, leafPer: 3 },
};

/** LOD trims recursion depth, leaf count and trunk segments — never the shape. */
const LOD_TRIM: Record<TreeLod, { levels: number; leaves: number; radialSegments: number; cards: number }> = {
  // `cards` is how many crossed planes make one cluster. Near, three read as a
  // mass; far, one double-faced card is a silhouette and the difference is not
  // visible — which is the whole point of having LODs.
  0: { levels: 0, leaves: 1, radialSegments: 7, cards: 3 },
  1: { levels: -1, leaves: 0.6, radialSegments: 5, cards: 2 },
  2: { levels: -2, leaves: 0.34, radialSegments: 4, cards: 1 },
};

/**
 * Grow one tree. Deterministic from `(species, seed, lod)` — the same seed gives
 * the same tree on every device, which is what makes the island reproducible.
 */
/**
 * One cluster of foliage, as **crossed, double-faced cards**.
 *
 * A single quad at a random angle is not a leaf cluster — it is a slab. Seen
 * from the side it is a line, seen from behind it is nothing at all, because
 * the clay material is `FrontSide` (and giving foliage its own double-sided
 * material would spend one of the eight, `07-RENDER-ARCHITECTURE.md` §5). So
 * the volume is built into the geometry instead: three cards through a common
 * centre, each emitted twice back-to-back. The cluster reads as a mass from
 * every angle and costs one material of nobody's. How many planes make a
 * cluster is an LOD decision — see `LOD_TRIM`.
 */
function leafCluster(
  out: Piece[],
  quad: THREE.BufferGeometry,
  centre: THREE.Vector3,
  size: number,
  cards: number,
  rng: () => number,
): void {
  // One shared tilt per cluster, so the cards stay a single mass rather than
  // splaying into separate flakes.
  const tiltX = (rng() - 0.5) * 0.5;
  const tiltZ = (rng() - 0.5) * 0.5;
  const yaw0 = rng() * Math.PI * 2;
  for (let c = 0; c < cards; c++) {
    const yaw = yaw0 + (c / cards) * Math.PI;
    for (let face = 0; face < 2; face++) {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(tiltX, yaw + face * Math.PI, tiltZ),
      );
      m.compose(centre, q, new THREE.Vector3(size, size, size));
      out.push({ geo: quad, matrix: m });
    }
  }
}

export function growTree(species: TreeSpecies, seed: number, lod: TreeLod = 0): TreeBuild {
  const rng = mulberry32(seed);
  const params = PARAMS[species];
  const trim = LOD_TRIM[lod];
  const levels = Math.max(2, params.levels + trim.levels);
  const wood: Piece[] = [];
  const leaves: Piece[] = [];
  let maxY = 0;

  const cyl = new THREE.CylinderGeometry(1, 1, 1, trim.radialSegments, 1, true);
  const quad = new THREE.PlaneGeometry(1, 1);

  function branch(origin: THREE.Vector3, dir: THREE.Vector3, len: number, radius: number, depth: number) {
    const end = origin.clone().addScaledVector(dir, len);
    maxY = Math.max(maxY, end.y);

    // Wood segment oriented along `dir`.
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    m.compose(origin.clone().addScaledVector(dir, len / 2), q, new THREE.Vector3(radius, len, radius));
    wood.push({ geo: cyl, matrix: m });

    if (depth >= levels - 1 || len < 0.12) {
      // Tip: a small cluster of crossed leaf cards.
      const n = Math.max(1, Math.round(params.leafPer * trim.leaves));
      for (let i = 0; i < n; i++) {
        const size = params.leafSize * (0.75 + rng() * 0.5);
        const off = new THREE.Vector3((rng() - 0.5) * 0.16, (rng() - 0.5) * 0.16, (rng() - 0.5) * 0.16);
        leafCluster(leaves, quad, end.clone().add(off), size, trim.cards, rng);
      }
      return;
    }

    const kidCount = params.kids[Math.min(depth, params.kids.length - 1)]!;
    for (let i = 0; i < kidCount; i++) {
      // Diverge around the parent direction, biased upward.
      const ang = (i / kidCount) * Math.PI * 2 + rng() * 0.9;
      const tilt = params.spread * (0.55 + rng() * 0.6);
      const side = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const kidDir = dir.clone().multiplyScalar(1.1).addScaledVector(side, tilt).normalize();
      // Pines keep branches nearly horizontal; oaks reach outward and up.
      if (species === 'pine') kidDir.y = Math.max(-0.15, kidDir.y * 0.42);
      branch(end, kidDir, len * params.drop * (0.85 + rng() * 0.3), radius * 0.63, depth + 1);
    }

    // Pines also carry foliage along the trunk, not only at the tips.
    if (species === 'pine' && depth <= 1) {
      const n = Math.max(1, Math.round(4 * trim.leaves));
      for (let i = 0; i < n; i++) {
        const t = 0.25 + rng() * 0.7;
        const p = origin.clone().addScaledVector(dir, len * t);
        const size = params.leafSize * (0.8 + rng() * 0.5);
        leafCluster(leaves, quad, p, size, trim.cards, rng);
      }
    }
  }

  const up = new THREE.Vector3(0, 1, 0);
  // Trunks lean a little; nothing in nature is perfectly plumb.
  const lean = new THREE.Vector3((rng() - 0.5) * 0.12, 1, (rng() - 0.5) * 0.12).normalize();
  branch(new THREE.Vector3(0, 0, 0), species === 'bush' ? up : lean, params.trunkH, params.trunkR, 0);

  // **Paint both halves.** The clay material runs with `vertexColors`, and an
  // unbound `color` attribute reads as black in WebGL — which is exactly what
  // the trees were, while every other scatter shape came out of `build.ts`
  // already painted. Bark darkens toward the roots, canopy toward its underside.
  const woodGeo = paintVertical(mergePieces(wood), CLAY.barkDeep, CLAY.bark, 0.9);
  const leavesGeo = paintVertical(mergePieces(leaves), CLAY.leafDeep, CLAY.leaf, 0.75);
  cyl.dispose();
  quad.dispose();
  return { wood: woodGeo, leaves: leavesGeo, height: maxY };
}

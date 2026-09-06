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
}

/** Growth rules per species, verbatim from the old `Vegetation.tsx`. */
const PARAMS: Record<TreeSpecies, SpeciesParams> = {
  pine: { trunkH: 1.5, trunkR: 0.075, levels: 4, kids: [3, 3, 2], spread: 0.62, drop: 0.66, leafSize: 0.42 },
  oak: { trunkH: 0.95, trunkR: 0.1, levels: 4, kids: [3, 3, 2], spread: 1.02, drop: 0.72, leafSize: 0.52 },
  birch: { trunkH: 1.35, trunkR: 0.055, levels: 3, kids: [2, 3], spread: 0.78, drop: 0.7, leafSize: 0.4 },
  bush: { trunkH: 0.24, trunkR: 0.045, levels: 3, kids: [4, 3], spread: 1.25, drop: 0.74, leafSize: 0.34 },
};

/** LOD trims recursion depth, blob count and trunk segments — never the shape. */
const LOD_TRIM: Record<TreeLod, { levels: number; radialSegments: number; blobs: number; segW: number; segH: number }> = {
  // `blobs` is how many rounded masses hang at each branch tip; `segW`/`segH`
  // how round each one is. Near, overlapping blobs read as a canopy; far, one
  // is a silhouette and the difference is not visible — the point of LODs.
  //
  // A **low-segment sphere, not an icosahedron.** An icosahedron at detail 0 is
  // twenty large triangles, and scaled unevenly under a random rotation it reads
  // as a shard — sharp-cornered, in an art direction whose first rule is that
  // clay has no corners. Detail 1 is round but 80 faces, which put T3 449k
  // triangles against a 400k ceiling. A 6x4 sphere is 36 faces and actually
  // round.
  0: { levels: 0, radialSegments: 7, blobs: 1, segW: 6, segH: 4 },
  1: { levels: -1, radialSegments: 5, blobs: 1, segW: 5, segH: 3 },
  2: { levels: -2, radialSegments: 4, blobs: 1, segW: 4, segH: 3 },
};

/**
 * Grow one tree. Deterministic from `(species, seed, lod)` — the same seed gives
 * the same tree on every device, which is what makes the island reproducible.
 */
/**
 * One mass of foliage, as **rounded blobs**.
 *
 * This was flat cards, and cards were wrong twice over. They were single-sided
 * against a `FrontSide` material, so half of every canopy was missing; and once
 * that was fixed by crossing and doubling them, a canopy was still a stack of
 * planes — in an art direction whose first rule is that **clay has no corners**
 * (`06-ART-DIRECTION.md` §2). Every other shape in the game is a bevelled solid.
 * The trees were the one thing still built out of billboards, and they read as
 * slabs from every angle because that is what they were.
 *
 * A low-segment sphere is about the same triangle cost as the crossed cards it
 * replaces, needs no double-siding, and is a volume rather than a picture of
 * one.
 */
function leafBlob(
  out: Piece[],
  blob: THREE.BufferGeometry,
  centre: THREE.Vector3,
  size: number,
  count: number,
  rng: () => number,
): void {
  for (let i = 0; i < count; i++) {
    // The first sits on the tip; any others cluster around it, so a canopy has
    // a lumpy silhouette instead of a row of identical balls.
    const off = i === 0 ? 0 : size * 0.55;
    const a = rng() * Math.PI * 2;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
    );
    scratchCentre.set(
      centre.x + Math.cos(a) * off,
      centre.y + (rng() - 0.5) * off,
      centre.z + Math.sin(a) * off,
    );
    // Slightly flattened: foliage spreads wider than it is tall.
    const r = size * (0.7 + rng() * 0.62);
    m.compose(scratchCentre, q, new THREE.Vector3(r, r * 0.78, r));
    out.push({ geo: blob, matrix: m });
  }
}

const scratchCentre = new THREE.Vector3();

export function growTree(species: TreeSpecies, seed: number, lod: TreeLod = 0): TreeBuild {
  const rng = mulberry32(seed);
  const params = PARAMS[species];
  const trim = LOD_TRIM[lod];
  const levels = Math.max(2, params.levels + trim.levels);
  const wood: Piece[] = [];
  const leaves: Piece[] = [];
  let maxY = 0;

  const cyl = new THREE.CylinderGeometry(1, 1, 1, trim.radialSegments, 1, true);
  // One unit blob, instanced into the merge by matrix — never rebuilt per leaf.
  const blob = new THREE.SphereGeometry(1, trim.segW, trim.segH);

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
      // One canopy mass per tip, sized from the species. This used to be a
      // count of cards; a blob is big enough that one does the work.
      leafBlob(leaves, blob, end.clone(), params.leafSize * 1.15, trim.blobs, rng);
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
      for (let i = 0; i < 2; i++) {
        const t = 0.3 + rng() * 0.6;
        const p = origin.clone().addScaledVector(dir, len * t);
        leafBlob(leaves, blob, p, params.leafSize * 0.95, trim.blobs, rng);
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
  blob.dispose();
  return { wood: woodGeo, leaves: leavesGeo, height: maxY };
}

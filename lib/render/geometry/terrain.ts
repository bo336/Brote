/**
 * The island's own geometry: the ground, the body under it, and the water.
 *
 * The ground is a **polar** grid, not a square one clipped to a disc. A radial
 * mesh lands its outer ring exactly on the coastline function, so the rim the
 * player can see is the rim the controller pushes back against — no stair-step
 * edge, no wasted vertices outside the island.
 *
 * Colour lives in `attributes.color`, blended by height, slope and a moisture
 * mask, with **ambient occlusion baked per vertex at generation time**. That AO
 * is what replaces SSAO entirely (`06-ART-DIRECTION.md` §4.4) — it costs one
 * pass at load and nothing per frame.
 */
import * as THREE from 'three';

import { CLAY as CLAY_CFG, WATER_LEVEL } from '@/lib/world/config';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import { sampleHeight, sampleSlope, type Heightfield, type WorldLayout } from '@/lib/world/terrain';
import type { WorldPalette } from '../palette';
import { CLAY } from '../palette';
// Colour lives next door — see `ground-paint.ts` for why.
import {
  bakedAO, cliffColor, groundColor, moistureAt, patchAt, primeCliffRamp, primeRamp, scratch,
} from './ground-paint';


/**
 * The walkable surface. `res` is the tier's terrain grid; it becomes
 * `res` angular segments by `res / 2` radial rings, so a tier change is a
 * different mesh built once at load, never per frame.
 */
export function buildGround(
  hf: Heightfield,
  layout: IslandLayout,
  palette: WorldPalette,
  res: number,
): THREE.BufferGeometry {
  primeRamp(palette);

  const segments = Math.max(16, Math.floor(res));
  const rings = Math.max(8, Math.floor(res / 2));
  const vertexCount = 1 + segments * rings;
  const position = new Float32Array(vertexCount * 3);
  const color = new Float32Array(vertexCount * 3);
  const indices: number[] = [];
  const seed = layout.seed * 0.001;

  const write = (v: number, x: number, z: number) => {
    const h = sampleHeight(hf, x, z);
    const slope = sampleSlope(hf, x, z);
    // Two masks, seeded per island, and no texture between them: the broad one
    // says damp or dry, the fine one keeps a big field from being one colour.
    const moisture = moistureAt(x, z, seed, layout);
    const patch = patchAt(x, z, seed);
    groundColor(scratch, x, z, h, slope, moisture, patch, layout.snowLine);
    const ao = bakedAO(hf, x, z, h);
    position[v * 3] = x;
    position[v * 3 + 1] = h;
    position[v * 3 + 2] = z;
    color[v * 3] = scratch.r * ao;
    color[v * 3 + 1] = scratch.g * ao;
    color[v * 3 + 2] = scratch.b * ao;
  };

  write(0, 0, 0);
  for (let ring = 1; ring <= rings; ring++) {
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      // `t²` biases detail toward the middle of the island, where the player
      // spends almost all of their time, without changing the rim.
      const t = ring / rings;
      const radius = coastRadiusAt(layout.coastline, angle) * t;
      write(1 + (ring - 1) * segments + s, Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
  }

  /**
   * Winding matters more than it looks. `x = cos(a)`, `z = sin(a)` walks
   * clockwise when seen from above, so the obvious index order gives every
   * triangle a **downward** normal — the key light then misses the ground
   * entirely and the hemisphere light hands it the brown ground tone. The
   * result is a green pradera that renders as mud with nothing in the shader to
   * blame for it. These two loops are wound to face the sky.
   */
  // The centre fan.
  for (let s = 0; s < segments; s++) {
    indices.push(0, 1 + ((s + 1) % segments), 1 + s);
  }
  // The ring quads.
  for (let ring = 1; ring < rings; ring++) {
    const inner = 1 + (ring - 1) * segments;
    const outer = 1 + ring * segments;
    for (let s = 0; s < segments; s++) {
      const n = (s + 1) % segments;
      indices.push(inner + s, outer + n, outer + s);
      indices.push(inner + s, inner + n, outer + n);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * The body under the ground: the cliff face and the tapered underside, so the
 * island reads as **a small object you could pick up** rather than a plane with
 * a painted edge (`06-ART-DIRECTION.md` §1).
 */
export function buildIslandBody(hf: Heightfield, layout: IslandLayout, segments = 96): THREE.BufferGeometry {
  primeCliffRamp();
  // Ring profile: `[radius scale, y offset]`, from the rim down to the tip.
  const profile: [number, number][] = [
    [1.0, 0],
    [0.98, -0.55],
    [0.9, -1.4],
    [0.72, -2.4],
    [0.45, -3.3],
    [0.16, -4.0],
    [0, -4.5],
  ];
  const vertexCount = profile.length * segments;
  const position = new Float32Array(vertexCount * 3);
  const color = new Float32Array(vertexCount * 3);
  const indices: number[] = [];

  for (let p = 0; p < profile.length; p++) {
    const [scale, drop] = profile[p]!;
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const rim = coastRadiusAt(layout.coastline, angle);
      const radius = rim * scale;
      const rimHeight = sampleHeight(hf, Math.cos(angle) * rim, Math.sin(angle) * rim);
      const v = p * segments + s;
      position[v * 3] = Math.cos(angle) * radius;
      position[v * 3 + 1] = rimHeight + drop;
      position[v * 3 + 2] = Math.sin(angle) * radius;
      cliffColor(scratch, p / (profile.length - 1));
      color[v * 3] = scratch.r;
      color[v * 3 + 1] = scratch.g;
      color[v * 3 + 2] = scratch.b;
    }
  }

  for (let p = 0; p < profile.length - 1; p++) {
    for (let s = 0; s < segments; s++) {
      const n = (s + 1) % segments;
      const a = p * segments + s;
      const b = p * segments + n;
      const c = (p + 1) * segments + s;
      const d = (p + 1) * segments + n;
      // Wound to face outward, for the same reason the ground faces up.
      indices.push(a, d, c, a, b, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * El Islote's own ground: a small disc across the water, with its own rim.
 *
 * It gets a separate mesh because the main island's ground is bounded by the
 * coastline function and the islet lives outside it — which is exactly what
 * makes it a place you have to sail to (`08-WORLD-AND-PROGRESSION.md` §1).
 */
export function buildIsletGround(
  hf: Heightfield,
  islet: { x: number; z: number; r: number },
  palette: WorldPalette,
  segments = 32,
): THREE.BufferGeometry {
  primeRamp(palette);

  const rings = Math.max(4, Math.floor(segments / 2));
  const vertexCount = 1 + segments * rings;
  const position = new Float32Array(vertexCount * 3);
  const color = new Float32Array(vertexCount * 3);
  const indices: number[] = [];

  const write = (v: number, x: number, z: number) => {
    const h = sampleHeight(hf, x, z);
    // The islet takes the same fine break-up as the mainland, offset by its own
    // position so the two never repeat the same patch.
    const patch = patchAt(x, z, islet.x + islet.z);
    groundColor(scratch, x, z, h, sampleSlope(hf, x, z), 0.35, patch, null);
    position[v * 3] = x;
    position[v * 3 + 1] = h;
    position[v * 3 + 2] = z;
    color[v * 3] = scratch.r;
    color[v * 3 + 1] = scratch.g;
    color[v * 3 + 2] = scratch.b;
  };

  write(0, islet.x, islet.z);
  for (let ring = 1; ring <= rings; ring++) {
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const radius = islet.r * (ring / rings);
      write(1 + (ring - 1) * segments + s, islet.x + Math.cos(angle) * radius, islet.z + Math.sin(angle) * radius);
    }
  }
  // Wound to face the sky, for the same reason the main ground is.
  for (let s = 0; s < segments; s++) indices.push(0, 1 + ((s + 1) % segments), 1 + s);
  for (let ring = 1; ring < rings; ring++) {
    const inner = 1 + (ring - 1) * segments;
    const outer = 1 + ring * segments;
    for (let s = 0; s < segments; s++) {
      const n = (s + 1) % segments;
      indices.push(inner + s, outer + n, outer + s);
      indices.push(inner + s, inner + n, outer + n);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface WaterMesh {
  geometry: THREE.BufferGeometry;
  /** The deepest point, for the shader's depth normalisation. */
  maxDepth: number;
}

/**
 * One surface per body of water, carrying the `aDepth` attribute the ported
 * shader reads. Cells whose ground is above the water line are not emitted, so
 * the mesh is exactly the shape of the water and its edge is where the foam
 * line belongs.
 */
/**
 * **The open sea, out to the horizon.**
 *
 * The island had no ocean. `buildWaterMeshes` builds only what
 * `terrain.lakes` declares — a puddle and the lagoon — and the ground mesh
 * stops at the coastline, so past the rim there was *nothing*: no water, no
 * ground, just the sky dome showing through. At eye level nobody notices,
 * because the island's own rim sits at the horizon. From La Cumbre, El Monte
 * and El Monumento you look **over** that rim, and three quarters of the frame
 * was empty sky with a deer standing in it.
 *
 * Those are the three regions the ladder spends nine tiers earning, so this is
 * not a background detail: it is the end of the game.
 *
 * An annulus rather than a disc — nothing is drawn under the island — with
 * three rings:
 *
 *  - one tucked just inside the coastline, at depth zero, so the shader paints
 *    its foam line where the sand actually meets the water;
 *  - one a few metres out at full depth, which is where the foam ends;
 *  - and one at `SEA_RADIUS`, just inside the sky dome, which is the horizon.
 *
 * Three hundred and eighty-four triangles and **no new material**: it is the
 * same water the lagoon is made of, so one mood update still moves all of it.
 */
const SEA_RADIUS = 380;
/** How far under the rim the inner edge tucks, so no seam shows at the beach. */
const SEA_UNDERLAP = 1.2;
/** How far out the shelf reaches full depth. The foam line lives inside this. */
const SEA_SHELF_M = 4;

export function buildOpenSea(layout: IslandLayout, deepAt: number): WaterMesh {
  const segments = layout.coastline.length;
  const positions: number[] = [];
  const depths: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < segments; s++) {
    const angle = (s / segments) * Math.PI * 2;
    const coast = coastRadiusAt(layout.coastline, angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (const [radius, depth] of [
      [coast - SEA_UNDERLAP, 0],
      [coast + SEA_SHELF_M, deepAt],
      [SEA_RADIUS, deepAt],
    ] as const) {
      positions.push(cos * radius, WATER_LEVEL, sin * radius);
      depths.push(depth);
    }
  }

  for (let s = 0; s < segments; s++) {
    const a = s * 3;
    const b = ((s + 1) % segments) * 3;
    for (let ring = 0; ring < 2; ring++) {
      // Wound to face the sky, like the ground: the other order gives every
      // triangle a downward normal and the key light misses the sea entirely.
      indices.push(a + ring, b + ring, b + ring + 1);
      indices.push(a + ring, b + ring + 1, a + ring + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return { geometry: geo, maxDepth: deepAt };
}

export function buildWaterMeshes(terrain: WorldLayout, hf: Heightfield, segments = 40): WaterMesh[] {
  const out: WaterMesh[] = [];
  for (const lake of terrain.lakes) {
    const extent = lake.r * 1.45;
    const step = (extent * 2) / segments;
    const positions: number[] = [];
    const depths: number[] = [];
    const indices: number[] = [];
    const index = new Map<number, number>();
    let maxDepth = 0;

    const vertexAt = (ix: number, iz: number): number => {
      const key = iz * (segments + 1) + ix;
      const hit = index.get(key);
      if (hit !== undefined) return hit;
      const x = lake.x - extent + ix * step;
      const z = lake.z - extent + iz * step;
      const depth = Math.max(0, WATER_LEVEL - sampleHeight(hf, x, z));
      maxDepth = Math.max(maxDepth, depth);
      const id = positions.length / 3;
      positions.push(x, WATER_LEVEL, z);
      depths.push(depth);
      index.set(key, id);
      return id;
    };

    for (let iz = 0; iz < segments; iz++) {
      for (let ix = 0; ix < segments; ix++) {
        const cx = lake.x - extent + (ix + 0.5) * step;
        const cz = lake.z - extent + (iz + 0.5) * step;
        if (sampleHeight(hf, cx, cz) >= WATER_LEVEL) continue;
        const a = vertexAt(ix, iz);
        const b = vertexAt(ix + 1, iz);
        const c = vertexAt(ix + 1, iz + 1);
        const d = vertexAt(ix, iz + 1);
        indices.push(a, c, b, a, d, c);
      }
    }
    if (indices.length === 0) continue;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    out.push({ geometry: geo, maxDepth: Math.max(CLAY_CFG.bandSoftness, maxDepth) });
  }
  return out;
}

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
import { fbm, sampleHeight, sampleSlope, type Heightfield, type WorldLayout } from '@/lib/world/terrain';
import type { WorldPalette } from '../palette';
import { CLAY } from '../palette';

const scratch = new THREE.Color();
/**
 * A SECOND scratch colour, and the reason is worth writing down: `groundColor`
 * is called with `scratch` as its output, so using `scratch` again inside it as
 * a temporary silently overwrote the result. Every ground vertex came out as
 * the shadow tone — a green pradera rendered as flat mud, with nothing in the
 * shader to blame.
 */
const scratchMix = new THREE.Color();
const ramp = {
  sand: new THREE.Color(),
  soil: new THREE.Color(),
  soilDeep: new THREE.Color(),
  grass: new THREE.Color(),
  grassDeep: new THREE.Color(),
  stone: new THREE.Color(),
  snow: new THREE.Color(),
};

/** How high above water the beach gives way to grass, in metres. */
const SAND_TO_GRASS = 0.09;
/** How far the deep tones fold in with height, for value structure. */
const DEPTH_SHADE = 0.45;
/** Slope above which ground reads as rock rather than cover. */
const ROCK_SLOPE = 0.42;
/** Ring offsets used by the AO probe, in metres. */
const AO_RADII = [0.6, 1.6, 3.2];
/**
 * How strongly a higher neighbour darkens a vertex, and how dark it may get.
 *
 * The first pass used a gain of 1.6 with no floor, which on rolling terrain
 * pushed the average vertex to about half brightness and turned a green pradera
 * into flat brown. AO is a *contact* cue — it belongs in the hollows and at the
 * foot of the cliff, not across the whole field.
 */
const AO_GAIN = 0.85;
const AO_FLOOR = 0.62;

/**
 * Approximate AO from the heightfield itself: a vertex surrounded by ground
 * higher than it sits in a hollow and is darker. Eight directions at three
 * radii is enough to read valleys, cliff bases and the inside of a bowl.
 */
function bakedAO(hf: Heightfield, x: number, z: number, h: number): number {
  let occlusion = 0;
  for (const r of AO_RADII) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const dh = sampleHeight(hf, x + Math.cos(a) * r, z + Math.sin(a) * r) - h;
      if (dh > 0) occlusion += Math.min(1, dh / r);
    }
  }
  return Math.max(AO_FLOOR, 1 - (occlusion / (AO_RADII.length * 8)) * AO_GAIN);
}

/** The colour of the ground at a point, before AO. */
function groundColor(
  target: THREE.Color,
  x: number,
  z: number,
  h: number,
  slope: number,
  moisture: number,
  snowLine: number | null,
): void {
  const above = h - WATER_LEVEL;
  if (snowLine !== null && h > snowLine) {
    target.copy(ramp.snow);
    return;
  }
  if (slope > ROCK_SLOPE) {
    target.copy(ramp.stone);
    return;
  }
  if (above < SAND_TO_GRASS) {
    // The shoreline: sand fading into whatever the bank is made of.
    target.copy(ramp.sand).lerp(ramp.grass, Math.max(0, above / SAND_TO_GRASS) * moisture);
    return;
  }
  // Dry ground reads as soil, damp ground as grass; the mask does the mixing.
  target.copy(ramp.soil).lerp(ramp.grass, moisture);
  // Fold in the deep tones with height so the land has value structure rather
  // than one flat green (`06-ART-DIRECTION.md` §2 rule 3).
  const depth = Math.min(1, above / 3);
  scratchMix.copy(ramp.soilDeep).lerp(ramp.grassDeep, moisture);
  target.lerp(scratchMix, depth * DEPTH_SHADE);
}

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
  ramp.sand.set(CLAY.sand);
  ramp.soil.set(palette.ground);
  ramp.soilDeep.set(CLAY.soilDeep);
  ramp.grass.set(palette.grass);
  ramp.grassDeep.set(CLAY.grassDeep);
  ramp.stone.set(CLAY.stone);
  ramp.snow.set(CLAY.snow);

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
    // A low-frequency moisture mask, seeded per island: where it is damp, grass;
    // where it is dry, bare earth. One noise call, not a texture.
    const moisture = Math.min(1, Math.max(0, fbm(x * 0.06 + seed, z * 0.06 - seed, 2) * 1.7 - 0.25));
    groundColor(scratch, x, z, h, slope, moisture, layout.snowLine);
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
  ramp.stone.set(CLAY.stone);
  ramp.soilDeep.set(CLAY.soilDeep);
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
      // Rock at the waterline, dark soil in the undercut: the cliff has to read
      // as a different value group from the ground on top of it.
      scratch.copy(ramp.stone).lerp(ramp.soilDeep, p / (profile.length - 1));
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
  ramp.sand.set(CLAY.sand);
  ramp.soil.set(palette.ground);
  ramp.soilDeep.set(CLAY.soilDeep);
  ramp.grass.set(palette.grass);
  ramp.grassDeep.set(CLAY.grassDeep);
  ramp.stone.set(CLAY.stone);
  ramp.snow.set(CLAY.snow);

  const rings = Math.max(4, Math.floor(segments / 2));
  const vertexCount = 1 + segments * rings;
  const position = new Float32Array(vertexCount * 3);
  const color = new Float32Array(vertexCount * 3);
  const indices: number[] = [];

  const write = (v: number, x: number, z: number) => {
    const h = sampleHeight(hf, x, z);
    groundColor(scratch, x, z, h, sampleSlope(hf, x, z), 0.35, null);
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

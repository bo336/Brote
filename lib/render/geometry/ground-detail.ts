/**
 * The ground's surface detail: soil grain, pebbles and leaf litter, and the bump
 * map that goes with them.
 *
 * The ground was a vertex colour — one tone per metre — and up close it read as
 * a flat painted floor, which is most of what made the island look drawn rather
 * than built. This is one tileable 512² detail map, generated at load with no
 * image files, sampled at two scales in the ground shader so its repeat never
 * shows:
 *
 *   albedo R  brightness of the soil, from grain to clods
 *   albedo G  where a pebble is (the shader greys the ground toward stone there)
 *   albedo B  where a dead leaf or a twig lies
 *   normal RG how the surface tilts, from the same height field the stones were stamped into
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';

const SIZE = 512;
const PEBBLES = 1100;
const LITTER = 650;
/** How steep the stamped height reads in the normal map. */
const BUMP = 3.2;

/** Value noise on a lattice that wraps every `period` cells, so the map tiles seamlessly. */
function periodicNoise(x: number, y: number, period: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const h = (a: number, b: number) => {
    const aa = ((a % period) + period) % period;
    const bb = ((b % period) + period) % period;
    const s = Math.sin(aa * 127.1 + bb * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const top = h(ix, iy) + (h(ix + 1, iy) - h(ix, iy)) * u;
  const bottom = h(ix, iy + 1) + (h(ix + 1, iy + 1) - h(ix, iy + 1)) * u;
  return top + (bottom - top) * v;
}

export interface GroundDetail {
  albedo: THREE.DataTexture;
  normal: THREE.DataTexture;
}

export function buildGroundDetail(): GroundDetail {
  const height = new Float32Array(SIZE * SIZE);
  const lum = new Float32Array(SIZE * SIZE);
  const pebble = new Float32Array(SIZE * SIZE);
  const litter = new Float32Array(SIZE * SIZE);

  // Soil: grain and clods, five octaves, all wrapping at the tile's edge.
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let n = 0;
      let amp = 0.5;
      for (let o = 0; o < 5; o++) {
        const period = 4 << o;
        n += periodicNoise((x / SIZE) * period, (y / SIZE) * period, period, o + 1) * amp;
        amp *= 0.5;
      }
      const i = y * SIZE + x;
      height[i] = n * 0.5;
      lum[i] = 0.4 + n * 0.45;
    }
  }

  const rng = mulberry32(90421);
  const stamp = (cx: number, cy: number, rx: number, ry: number, angle: number, visit: (i: number, d: number) => void) => {
    const reach = Math.ceil(Math.max(rx, ry));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const lx = (dx * cos + dy * sin) / rx;
        const ly = (-dx * sin + dy * cos) / ry;
        const d = Math.hypot(lx, ly);
        if (d >= 1) continue;
        const px = (((Math.round(cx) + dx) % SIZE) + SIZE) % SIZE;
        const py = (((Math.round(cy) + dy) % SIZE) + SIZE) % SIZE;
        visit(py * SIZE + px, d);
      }
    }
  };

  // Pebbles: small rounded stones pressed into the soil, a few larger ones.
  for (let p = 0; p < PEBBLES; p++) {
    const r = 1.4 + Math.pow(rng(), 3) * 7;
    const shade = 0.45 + rng() * 0.45;
    stamp(rng() * SIZE, rng() * SIZE, r, r * (0.6 + rng() * 0.4), rng() * Math.PI, (i, d) => {
      const dome = Math.sqrt(1 - d * d);
      height[i] = Math.max(height[i]!, 0.35 + dome * r * 0.06);
      const edge = 1 - Math.pow(d, 6);
      pebble[i] = Math.max(pebble[i]!, edge);
      lum[i] = lum[i]! + (shade * (0.75 + dome * 0.35) - lum[i]!) * edge;
    });
  }

  // Litter: dead leaves and twigs lying flat.
  for (let l = 0; l < LITTER; l++) {
    const twig = rng() < 0.3;
    const len = twig ? 8 + rng() * 10 : 3 + rng() * 5;
    const wid = twig ? 0.9 : len * (0.4 + rng() * 0.2);
    stamp(rng() * SIZE, rng() * SIZE, len, wid, rng() * Math.PI, (i, d) => {
      const edge = 1 - d * d;
      litter[i] = Math.max(litter[i]!, edge);
      height[i] = height[i]! + edge * 0.04;
      lum[i] = lum[i]! * (1 - edge * 0.35);
    });
  }

  const albedoData = new Uint8Array(SIZE * SIZE * 4);
  const normalData = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      const o = i * 4;
      albedoData[o] = Math.round(Math.min(1, Math.max(0, lum[i]!)) * 255);
      albedoData[o + 1] = Math.round(pebble[i]! * 255);
      albedoData[o + 2] = Math.round(litter[i]! * 255);
      albedoData[o + 3] = 255;
      const l = height[y * SIZE + ((x + SIZE - 1) % SIZE)]!;
      const r = height[y * SIZE + ((x + 1) % SIZE)]!;
      const u = height[((y + SIZE - 1) % SIZE) * SIZE + x]!;
      const dn = height[((y + 1) % SIZE) * SIZE + x]!;
      const nx = (l - r) * BUMP;
      const nz = (u - dn) * BUMP;
      normalData[o] = Math.round(Math.min(1, Math.max(0, nx * 0.5 + 0.5)) * 255);
      normalData[o + 1] = Math.round(Math.min(1, Math.max(0, nz * 0.5 + 0.5)) * 255);
      normalData[o + 2] = 255;
      normalData[o + 3] = 255;
    }
  }

  const make = (data: Uint8Array<ArrayBuffer>, name: string) => {
    const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.name = name;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  };
  return { albedo: make(albedoData, 'groundDetail'), normal: make(normalData, 'groundNormal') };
}

/**
 * The leaf atlas: one generated texture for every canopy on the island.
 *
 * **v2 (`23-ART-DIRECTION-V2.md` rule 2): foliage is hundreds of leaves.** A
 * canopy made of smooth blobs reads as a green balloon from any distance. A
 * canopy made of cards, each carrying a cluster of painted leaves with a real
 * silhouette, reads as foliage — light breaks through it, its edge is ragged,
 * and it sways as many small things rather than one big one.
 *
 * Four tiles, painted once on a canvas at load, **no image files**:
 *
 *   0  broad leaves   — ombú, ceibo
 *   1  fine leaflets  — jacarandá's feathery pinnate leaves
 *   2  needle tufts   — araucaria
 *   3  blossoms       — jacarandá purple, ceibo red, lapacho pink
 *
 * The tiles are greyscale with alpha. Colour comes from the vertex colour of the
 * card, so one texture serves every species and every season.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';

export const LEAF_TILE = { broad: 0, fine: 1, needle: 2, blossom: 3 } as const;
export type LeafTile = (typeof LEAF_TILE)[keyof typeof LEAF_TILE];

/** Tiles per side of the atlas. */
export const ATLAS_SIDE = 2;
const TILE_PX = 256;

/** The UV rectangle of a tile: `[u0, v0, u1, v1]`. */
export function tileUV(tile: LeafTile): [number, number, number, number] {
  const col = tile % ATLAS_SIDE;
  const row = Math.floor(tile / ATLAS_SIDE);
  const s = 1 / ATLAS_SIDE;
  // A hair of inset, so mipmapping never bleeds a neighbour's leaves in.
  const inset = 2 / (TILE_PX * ATLAS_SIDE);
  return [col * s + inset, 1 - (row + 1) * s + inset, (col + 1) * s - inset, 1 - row * s - inset];
}

type Ctx = CanvasRenderingContext2D;

function leafShape(ctx: Ctx, length: number, width: number): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, length * 0.45, 0, length);
  ctx.quadraticCurveTo(-width, length * 0.45, 0, 0);
  ctx.closePath();
}

/** A cluster of broad leaves radiating from the tile centre, each with a darker midrib. */
function paintBroad(ctx: Ctx, rng: () => number): void {
  for (let i = 0; i < 38; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * TILE_PX * 0.28;
    ctx.save();
    ctx.translate(TILE_PX / 2 + Math.cos(a) * r, TILE_PX / 2 + Math.sin(a) * r);
    ctx.rotate(a + Math.PI / 2 + (rng() - 0.5) * 1.2);
    const len = TILE_PX * (0.14 + rng() * 0.08);
    const v = 175 + Math.floor(rng() * 80);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    leafShape(ctx, len, len * 0.36);
    ctx.fill();
    ctx.strokeStyle = `rgba(90,90,90,0.5)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, len * 0.9);
    ctx.stroke();
    ctx.restore();
  }
}

/** Feathery sprays: a stem with many small leaflets, like jacarandá. */
function paintFine(ctx: Ctx, rng: () => number): void {
  for (let s = 0; s < 14; s++) {
    const a = rng() * Math.PI * 2;
    ctx.save();
    ctx.translate(TILE_PX / 2 + Math.cos(a) * 20 * rng(), TILE_PX / 2 + Math.sin(a) * 20 * rng());
    ctx.rotate(a);
    const len = TILE_PX * (0.28 + rng() * 0.12);
    for (let k = 0; k < 16; k++) {
      const t = k / 16;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(0, t * len);
        ctx.rotate(side * (0.9 + rng() * 0.3));
        const v = 170 + Math.floor(rng() * 85);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        leafShape(ctx, 12 * (1 - t * 0.5), 3.2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

/** Dense needle tufts in radial bursts, like the araucaria's branch ends. */
function paintNeedle(ctx: Ctx, rng: () => number): void {
  for (let b = 0; b < 9; b++) {
    const cx = TILE_PX / 2 + (rng() - 0.5) * TILE_PX * 0.45;
    const cy = TILE_PX / 2 + (rng() - 0.5) * TILE_PX * 0.45;
    for (let k = 0; k < 40; k++) {
      const a = rng() * Math.PI * 2;
      const len = 18 + rng() * 34;
      const v = 150 + Math.floor(rng() * 90);
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  }
}

/** Blossoms: small five-petal flowers massed in a clump, with a few leaves under them. */
function paintBlossom(ctx: Ctx, rng: () => number): void {
  for (let i = 0; i < 70; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * TILE_PX * 0.33;
    const x = TILE_PX / 2 + Math.cos(a) * r;
    const y = TILE_PX / 2 + Math.sin(a) * r;
    const size = 6 + rng() * 7;
    const v = 200 + Math.floor(rng() * 55);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2 + rng();
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(pa) * size * 0.55, y + Math.sin(pa) * size * 0.55, size * 0.5, size * 0.32, pa, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Paint the atlas. Called once, through the texture cache. */
export function buildLeafAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TILE_PX * ATLAS_SIDE;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const painters = [paintBroad, paintFine, paintNeedle, paintBlossom];
  painters.forEach((paint, tile) => {
    ctx.save();
    ctx.translate((tile % ATLAS_SIDE) * TILE_PX, Math.floor(tile / ATLAS_SIDE) * TILE_PX);
    ctx.beginPath();
    ctx.rect(0, 0, TILE_PX, TILE_PX);
    ctx.clip();
    paint(ctx, mulberry32(1709 + tile * 31));
    ctx.restore();
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.name = 'leafAtlas';
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  return tex;
}

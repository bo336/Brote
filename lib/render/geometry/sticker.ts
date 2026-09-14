/**
 * The eight visitor stickers, as geometry.
 *
 * `18-DECISIONS.md` D8 gives a visitor exactly one thing to leave behind, from
 * a closed list of eight. They are built here for the same reason everything
 * else is: no asset ships, so a sticker costs zero bytes and can be recoloured
 * per instance.
 *
 * Each one is **a clay medallion with a raised symbol** — a shallow disc lying
 * on the ground with the shape standing a couple of centimetres proud of it.
 * That reads at the angle the camera actually looks from; a flat decal would
 * be a texture, and edge-on it would be nothing.
 */
import * as THREE from 'three';

import { CLAY, DOMAIN_COLORS } from '../palette';
import { mergePainted, paintFlat } from './build';

/** Small: it is a token somebody left, not a monument. */
const DISC_R = 0.34;
const DISC_H = 0.05;
const RAISE = DISC_H * 0.9;

export const STICKER_KINDS = [
  'semilla', 'sol', 'agua', 'hoja', 'pajaro', 'estrella', 'corazon', 'mate',
] as const;
export type StickerKind = (typeof STICKER_KINDS)[number];

/** The colour each symbol is painted. The disc is always fired clay. */
const INK: Record<StickerKind, string> = {
  semilla: CLAY.leafDeep,
  sol: DOMAIN_COLORS.energia,
  agua: CLAY.water,
  hoja: CLAY.leaf,
  pajaro: DOMAIN_COLORS.animales,
  estrella: DOMAIN_COLORS.consumo,
  corazon: '#E2686F',
  mate: CLAY.bark,
};

function ball(r: number, hex: string, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, 8, 6);
  g.scale(sx, sy, sz);
  g.translate(x, y, z);
  return paintFlat(g, hex);
}

function bar(len: number, thick: number, hex: string, angle: number, x = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(thick, thick, len, 5, 1);
  g.rotateZ(Math.PI / 2);
  g.rotateY(angle);
  g.translate(x, RAISE, z);
  return paintFlat(g, hex);
}

/** A flat extruded outline, laid down on the disc. For the two curvy ones. */
function plate(shape: THREE.Shape, hex: string, scale: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  g.scale(scale, 1, scale);
  g.translate(0, RAISE, 0);
  g.computeVertexNormals();
  return paintFlat(g, hex);
}

function star(): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : 0.44;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function heart(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.bezierCurveTo(1.5, 0.2, 0.75, 1.3, 0, 0.55);
  s.bezierCurveTo(-0.75, 1.3, -1.5, 0.2, 0, -1);
  return s;
}

/** The symbol for one kind, already raised above the disc. */
function symbol(kind: StickerKind): THREE.BufferGeometry[] {
  const ink = INK[kind];
  switch (kind) {
    case 'semilla':
      // A seed and the first thing out of it.
      return [
        ball(0.1, ink, 0, RAISE + 0.02, 0.04, 1, 1.25, 0.8),
        ball(0.075, CLAY.leaf, 0.05, RAISE + 0.1, -0.05, 1.5, 0.5, 0.9),
      ];
    case 'sol':
      return [
        ball(0.105, ink, 0, RAISE + 0.02, 0, 1, 0.65, 1),
        ...[0, 1, 2, 3, 4, 5].map((i) => bar(0.13, 0.016, ink, (i / 6) * Math.PI, 0, 0)),
      ];
    case 'agua':
      // A drop: a ball with a point pulled out of the top.
      return [
        ball(0.1, ink, 0, RAISE + 0.02, 0.03, 1, 0.8, 1),
        ball(0.055, ink, 0, RAISE + 0.05, -0.09, 0.7, 0.7, 1.6),
      ];
    case 'hoja':
      return [
        ball(0.14, ink, 0, RAISE + 0.02, 0, 0.55, 0.35, 1),
        bar(0.16, 0.012, CLAY.leafDeep, Math.PI / 2, 0, 0.12),
      ];
    case 'pajaro':
      // Two wings, the oldest bird there is.
      return [
        ball(0.11, ink, -0.07, RAISE + 0.02, 0, 1, 0.3, 0.42),
        ball(0.11, ink, 0.07, RAISE + 0.02, 0, 1, 0.3, 0.42),
      ];
    case 'estrella':
      return [plate(star(), ink, 0.2)];
    case 'corazon':
      return [plate(heart(), ink, 0.17)];
    case 'mate':
      return [
        ball(0.12, ink, 0, RAISE + 0.02, 0, 1, 0.75, 1),
        bar(0.2, 0.017, CLAY.stone, Math.PI / 3, 0.05, -0.03),
      ];
  }
}

/**
 * One sticker, whole. A disc of fired clay with its symbol on top, sitting flat
 * with its base at y = 0 so the caller only has to know the ground height.
 */
export function stickerGeometry(kind: StickerKind): THREE.BufferGeometry {
  const disc = new THREE.CylinderGeometry(DISC_R, DISC_R * 0.94, DISC_H, 16, 1);
  disc.translate(0, DISC_H / 2, 0);
  return mergePainted([paintFlat(disc, CLAY.sand), ...symbol(kind)]);
}

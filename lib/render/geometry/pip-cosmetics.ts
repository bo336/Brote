/**
 * Pip's hats, glasses and patterns — all thirteen hats, all six glasses, all
 * seven patterns, generated in code.
 *
 * Two sets exist and **both must render**: the repo's free set from
 * `components/pip/Pip.tsx`, and the paid set from the live `cosmetics` table
 * (`18-DECISIONS.md` D4). The old 3D Pip rendered neither — it hardcoded one
 * green and ignored customisation entirely (`02-AUDIT.md` §5).
 *
 * Because Pip is procedural, "every cosmetic mesh exists in the hierarchy" costs
 * generation time at load rather than file size — so each shape is **built
 * lazily on first equip and cached**, and equipping is a `visible` toggle.
 */
import * as THREE from 'three';

import { PIP } from '@/lib/world/config';
import { CLAY, PIP_PARTS, PIP_PALETTES } from '../palette';
import { mergePainted, paintFlat as paint } from './build';

export { mergePainted };

// ── Hats ────────────────────────────────────────────────────────────────────

/** A brim-and-crown hat, the shape four of the thirteen share. */
function brimmed(crownH: number, crownR: number, brimR: number, colour: string): THREE.BufferGeometry[] {
  const crown = new THREE.CylinderGeometry(crownR * 0.85, crownR, crownH, 10, 1);
  crown.translate(0, crownH / 2 + 0.01, 0);
  const brim = new THREE.CylinderGeometry(brimR, brimR, 0.012, 12, 1);
  brim.translate(0, 0.012, 0);
  const cap = new THREE.SphereGeometry(crownR * 0.85, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.scale(1, 0.5, 1);
  cap.translate(0, crownH + 0.01, 0);
  return [paint(crown, colour), paint(brim, colour), paint(cap, colour)];
}

const HAT_BUILDERS: Record<string, () => THREE.BufferGeometry> = {
  // ── free set ──
  brotecito: () => {
    const stem = new THREE.CylinderGeometry(0.008, 0.01, 0.05, 5);
    stem.translate(0, 0.025, 0);
    const leaf = new THREE.SphereGeometry(0.055, 6, 4);
    leaf.scale(1, 0.25, 0.55);
    leaf.translate(0.05, 0.06, 0);
    leaf.rotateZ(0.4);
    return mergePainted([paint(stem, CLAY.grassDeep), paint(leaf, CLAY.leaf)]);
  },
  flor: () => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const petal = new THREE.SphereGeometry(0.04, 6, 4);
      petal.scale(1, 0.3, 0.7);
      petal.translate(0.04, 0.03, 0);
      petal.rotateY((i / 5) * Math.PI * 2);
      parts.push(paint(petal, PIP_PARTS.cheek));
    }
    const centre = new THREE.SphereGeometry(0.026, 7, 5);
    centre.translate(0, 0.04, 0);
    parts.push(paint(centre, CLAY.sand));
    return mergePainted(parts);
  },
  gorro: () => {
    const cone = new THREE.ConeGeometry(0.12, 0.17, 10);
    cone.translate(0, 0.085, 0);
    const band = new THREE.TorusGeometry(0.115, 0.018, 5, 12);
    band.rotateX(Math.PI / 2);
    band.translate(0, 0.012, 0);
    const pom = new THREE.SphereGeometry(0.032, 7, 5);
    pom.translate(0, 0.185, 0);
    return mergePainted([paint(cone, CLAY.water), paint(band, PIP_PARTS.cloth), paint(pom, PIP_PARTS.cloth)]);
  },
  corona: () => {
    const parts: THREE.BufferGeometry[] = [];
    const band = new THREE.CylinderGeometry(0.1, 0.105, 0.035, 12, 1, true);
    band.translate(0, 0.02, 0);
    parts.push(paint(band, CLAY.sand));
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.ConeGeometry(0.022, 0.055, 5);
      spike.translate(0.1, 0.06, 0);
      spike.rotateY((i / 6) * Math.PI * 2);
      parts.push(paint(spike, CLAY.sand));
    }
    return mergePainted(parts);
  },
  hongo: () => {
    const cap = new THREE.SphereGeometry(0.115, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    cap.scale(1, 0.62, 1);
    cap.translate(0, 0.012, 0);
    const parts = [paint(cap, PIP_PARTS.cheek)];
    for (let i = 0; i < 5; i++) {
      const dot = new THREE.SphereGeometry(0.02, 6, 4);
      dot.scale(1, 0.4, 1);
      dot.translate(0.055, 0.062, 0);
      dot.rotateY((i / 5) * Math.PI * 2 + 0.4);
      parts.push(paint(dot, PIP_PARTS.cloth));
    }
    return mergePainted(parts);
  },
  mono: () => {
    const parts: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.SphereGeometry(0.05, 6, 5);
      wing.scale(1, 0.7, 0.45);
      wing.translate(side * 0.05, 0.03, 0);
      parts.push(paint(wing, PIP_PARTS.cheek));
    }
    const knot = new THREE.SphereGeometry(0.024, 7, 5);
    knot.translate(0, 0.03, 0);
    parts.push(paint(knot, PIP_PARTS.cheek));
    return mergePainted(parts);
  },
  vincha: () => {
    const band = new THREE.TorusGeometry(0.115, 0.016, 6, 14);
    band.rotateX(Math.PI / 2 - 0.25);
    band.translate(0, 0.005, 0);
    return mergePainted([paint(band, CLAY.leaf)]);
  },
  estrella: () => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const point = new THREE.ConeGeometry(0.026, 0.075, 4);
      point.translate(0, 0.038, 0);
      point.rotateZ((i / 5) * Math.PI * 2);
      point.translate(0, 0.045, 0);
      parts.push(paint(point, CLAY.sand));
    }
    return mergePainted(parts);
  },
  // ── paid set ──
  sombrero: () => mergePainted(brimmed(0.07, 0.1, 0.19, CLAY.bark)),
  casco: () => {
    const shell = new THREE.SphereGeometry(0.13, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2);
    shell.translate(0, 0.005, 0);
    const stripe = new THREE.BoxGeometry(0.03, 0.02, 0.26);
    stripe.translate(0, 0.11, 0);
    return mergePainted([paint(shell, CLAY.sand), paint(stripe, PIP_PARTS.cloth)]);
  },
  visera: () => {
    const band = new THREE.CylinderGeometry(0.115, 0.118, 0.04, 12, 1, true);
    band.translate(0, 0.02, 0);
    const peak = new THREE.SphereGeometry(0.12, 10, 5, 0, Math.PI, 0, Math.PI / 2);
    peak.scale(1, 0.12, 1.5);
    peak.rotateY(-Math.PI / 2);
    peak.translate(0, 0.012, 0.07);
    return mergePainted([paint(band, CLAY.water), paint(peak, CLAY.waterDeep)]);
  },
  aureola: () => {
    const ring = new THREE.TorusGeometry(0.085, 0.013, 6, 16);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 0.1, 0);
    return mergePainted([paint(ring, CLAY.sand)]);
  },
};

/** Every hat id, `ninguno` included. The customiser reads this order. */
export const HAT_IDS = [
  'ninguno', 'brotecito', 'flor', 'gorro', 'corona', 'hongo', 'mono', 'vincha', 'estrella',
  'sombrero', 'casco', 'visera', 'aureola',
] as const;

const hatCache = new Map<string, THREE.BufferGeometry>();

/** Built on first equip and cached — no runtime loading, no pop-in, no network. */
export function buildHat(id: string): THREE.BufferGeometry | null {
  if (!id || id === 'ninguno') return null;
  const hit = hatCache.get(id);
  if (hit) return hit;
  const build = HAT_BUILDERS[id];
  if (!build) return null;
  const geo = build();
  hatCache.set(id, geo);
  return geo;
}

// ── Glasses ─────────────────────────────────────────────────────────────────

/** One lens plus the bridge, the shape every pair shares. */
function lenses(build: (side: number) => THREE.BufferGeometry, colour: string): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) parts.push(paint(build(side), colour));
  const bridge = new THREE.BoxGeometry(0.05, 0.008, 0.008);
  parts.push(paint(bridge, colour));
  return mergePainted(parts);
}

const GLASSES_BUILDERS: Record<string, () => THREE.BufferGeometry> = {
  redondos: () =>
    lenses((side) => {
      const ring = new THREE.TorusGeometry(0.042, 0.008, 5, 12);
      ring.translate(side * PIP.eyeSpread, 0, 0);
      return ring;
    }, PIP_PARTS.eye),
  sol: () =>
    lenses((side) => {
      const lens = new THREE.SphereGeometry(0.046, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      lens.scale(1, 0.8, 0.25);
      lens.rotateX(Math.PI / 2);
      lens.translate(side * PIP.eyeSpread, 0, 0);
      return lens;
    }, PIP_PARTS.eye),
  corazones: () =>
    lenses((side) => {
      const parts: THREE.BufferGeometry[] = [];
      for (const lobe of [-1, 1]) {
        const s = new THREE.SphereGeometry(0.026, 6, 5);
        s.scale(1, 1, 0.3);
        s.translate(side * PIP.eyeSpread + lobe * 0.02, 0.014, 0);
        parts.push(s);
      }
      const tip = new THREE.ConeGeometry(0.036, 0.05, 4);
      tip.rotateZ(Math.PI);
      tip.scale(1, 1, 0.3);
      tip.translate(side * PIP.eyeSpread, -0.018, 0);
      parts.push(tip);
      return mergePainted(parts.map((g) => paint(g, PIP_PARTS.cheek)));
    }, PIP_PARTS.cheek),
  aviador: () =>
    lenses((side) => {
      const lens = new THREE.SphereGeometry(0.05, 8, 6);
      lens.scale(1, 0.85, 0.2);
      lens.translate(side * PIP.eyeSpread, -0.006, 0);
      return lens;
    }, PIP_PARTS.metal),
  pixel: () =>
    lenses((side) => {
      const lens = new THREE.BoxGeometry(0.07, 0.045, 0.014);
      lens.translate(side * PIP.eyeSpread, 0, 0);
      return lens;
    }, PIP_PARTS.eye),
};

export const GLASSES_IDS = ['ninguno', 'redondos', 'sol', 'corazones', 'aviador', 'pixel'] as const;

const glassesCache = new Map<string, THREE.BufferGeometry>();

export function buildGlasses(id: string): THREE.BufferGeometry | null {
  if (!id || id === 'ninguno') return null;
  const hit = glassesCache.get(id);
  if (hit) return hit;
  const build = GLASSES_BUILDERS[id];
  if (!build) return null;
  const geo = build();
  glassesCache.set(id, geo);
  return geo;
}

/** The four-tuple for a body palette, falling back to the free default. */
export function paletteFor(body: string | undefined, golden: boolean): readonly [string, string, string, string] {
  if (golden) return PIP_PALETTES.sol!;
  return (body && PIP_PALETTES[body]) || PIP_PALETTES.clasico!;
}

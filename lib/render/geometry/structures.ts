/**
 * The fixed structures: the things the ladder puts on the island, as opposed to
 * the ten props the player places.
 *
 * One builder per `FeatureId` that has a shape. They are keyed by feature so the
 * scene can walk the layout's anchors and never has to know what a bridge is —
 * which is also what makes the tier-up ceremony's "the feature arrives" beat a
 * matter of animating something that already exists (`08` §5.3).
 */
import * as THREE from 'three';

import { BRIDGE, SCALE_REFERENCE } from '@/lib/world/config';
import { mulberry32 } from '@/lib/world/rng';
import type { FeatureId } from '@/lib/world/types';
import { CLAY, DOMAIN_COLORS, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical, post } from './build';
import { smoothRock } from './scatter';

/** El Mojón: the one place impact numbers live. A stone marker, waist high. */
function mojon(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = smoothRock(0.42, 11);
  base.scale(1.1, 0.55, 1.1);
  base.translate(0, 0.08, 0);
  parts.push(base);
  const shaft = new THREE.CylinderGeometry(0.15, 0.2, 0.95, 7);
  shaft.translate(0, 0.72, 0);
  parts.push(paintVertical(shaft, CLAY.stoneDeep, CLAY.stone));
  // The face that carries the panel, angled to catch the key light.
  const face = bevelBox(0.34, 0.4, 0.06, CLAY.sand);
  face.rotateX(-0.28);
  face.translate(0, 0.95, 0.16);
  parts.push(face);
  return mergePainted(parts);
}

/** El banco del mirador. Shares the placeable bench's shape at a fixed spot. */
function bench(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) parts.push(bevelBox(0.09, 0.42, 0.34, CLAY.barkDeep).translate(side * 0.44, 0.21, 0));
  parts.push(bevelBox(1.1, 0.08, 0.36, CLAY.bark).translate(0, 0.45, 0));
  parts.push(bevelBox(1.05, 0.18, 0.06, CLAY.bark).translate(0, 0.7, -0.15));
  return mergePainted(parts);
}

/** La compostera: a slatted bin that the waste channel grows (`13` §2). */
function compost(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const [dx, dz, w, d] of [[0, -0.5, 1.1, 0.08], [0, 0.5, 1.1, 0.08], [-0.5, 0, 0.08, 1.1], [0.5, 0, 0.08, 1.1]] as const) {
    for (let slat = 0; slat < 3; slat++) {
      const board = bevelBox(w, 0.14, d, CLAY.bark);
      board.translate(dx, 0.12 + slat * 0.2, dz);
      parts.push(board);
    }
  }
  const heap = new THREE.SphereGeometry(0.45, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  heap.scale(1, 0.55, 1);
  heap.translate(0, 0.06, 0);
  parts.push(paintFlat(heap, CLAY.soilDeep));
  return mergePainted(parts);
}

/**
 * El puente de madera, sized to its crossing (`lib/world/crossing.ts`): two
 * stringers under the planks, planks with a little play in them — a gap between
 * each, never quite straight, never quite one shade — and posts standing on both
 * banks carrying a top rail and a lower one, all along a gentle camber. The
 * deck's top is `BRIDGE.deckTopM` plus the camber, which is exactly the floor
 * `lib/world/decks.ts` stands Pip on.
 */
function bridge(span: number = BRIDGE.defaultSpanM): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const rng = mulberry32(Math.round(span * 1000));
  const half = span / 2;
  const deckHalf = BRIDGE.deckWidthM / 2;
  const plankY = BRIDGE.deckTopM - 0.035;
  const lift = (t: number) => Math.sin(t * Math.PI) * BRIDGE.camberM;
  const tilt = (t: number) => Math.atan((Math.cos(t * Math.PI) * Math.PI * BRIDGE.camberM) / span);
  /** A beam between two points along the span, following the camber. */
  const beam = (t0: number, t1: number, y: number, z: number, h: number, d: number, hex: string) => {
    const x0 = -half + t0 * span;
    const x1 = -half + t1 * span;
    const y0 = y + lift(t0);
    const y1 = y + lift(t1);
    const b = bevelBox(Math.hypot(x1 - x0, y1 - y0) + 0.04, h, d, hex, 0.9);
    b.rotateZ(Math.atan2(y1 - y0, x1 - x0));
    b.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
    return b;
  };

  const segments = Math.max(4, Math.round(span / 0.8));
  for (const side of [-1, 1]) {
    for (let i = 0; i < segments; i++) {
      parts.push(beam(i / segments, (i + 1) / segments, plankY - 0.12, side * (deckHalf - 0.22), 0.16, 0.13, CLAY.barkDeep));
    }
  }

  const planks = Math.max(8, Math.round(span / 0.3));
  const pitch = span / planks;
  for (let i = 0; i < planks; i++) {
    const t = (i + 0.5) / planks;
    const tone = rng();
    const hex = tone < 0.45 ? CLAY.bark : tone < 0.85 ? CLAY.barkRoof : CLAY.barkDeep;
    const plank = bevelBox(pitch - 0.03, 0.07, BRIDGE.deckWidthM - rng() * 0.14, hex, 0.94);
    plank.rotateY((rng() - 0.5) * 0.06);
    plank.rotateZ(tilt(t));
    plank.translate(-half + t * span, plankY + lift(t) + (rng() - 0.5) * 0.015, (rng() - 0.5) * 0.06);
    parts.push(plank);
  }

  const posts = Math.max(3, Math.round(span / 1.5) + 1);
  const railZ = deckHalf - 0.05;
  const at = (i: number) => 0.03 + (i / (posts - 1)) * 0.94;
  for (const side of [-1, 1]) {
    for (let i = 0; i < posts; i++) {
      const p = post(0.055, 1.0, CLAY.barkDeep, 7);
      p.translate(-half + at(i) * span, plankY - 0.3 + lift(at(i)), side * railZ);
      parts.push(p);
    }
    for (let i = 0; i < posts - 1; i++) {
      parts.push(beam(at(i), at(i + 1), plankY + 0.62, side * railZ, 0.07, 0.08, CLAY.bark));
      parts.push(beam(at(i), at(i + 1), plankY + 0.3, side * railZ, 0.045, 0.05, CLAY.barkRoof));
    }
  }
  return mergePainted(parts);
}

/** La cascada: the rock lip the water breaks over. The sheet is a water mesh. */
function waterfall(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const rock = smoothRock(0.55 + (i % 3) * 0.18, 40 + i);
    rock.scale(1.3, 0.9, 1);
    rock.rotateY(i * 1.3);
    rock.translate(-1.4 + i * 0.7, 0.2 + (i % 2) * 0.2, (i % 2 ? 0.3 : -0.2));
    parts.push(rock);
  }
  return mergePainted(parts);
}

/** La casita del árbol: a platform, a rail and a ladder. The glide launch point. */
function treehouse(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const H = SCALE_REFERENCE.fullTreeM * 0.62;
  const deck = bevelBox(2.4, 0.14, 2.4, CLAY.bark);
  deck.translate(0, H, 0);
  parts.push(deck);
  for (const [dx, dz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]] as const) {
    parts.push(post(0.09, 0.85, CLAY.barkDeep).translate(dx, H + 0.07, dz));
  }
  for (const side of [-1, 1]) {
    parts.push(bevelBox(2.3, 0.07, 0.07, CLAY.bark).translate(0, H + 0.9, side * 1.1));
    parts.push(bevelBox(0.07, 0.07, 2.3, CLAY.bark).translate(side * 1.1, H + 0.9, 0));
  }
  // The ladder — the way up before `climb` exists as a verb.
  for (let i = 0; i < 9; i++) {
    const rung = bevelBox(0.5, 0.05, 0.05, CLAY.barkDeep);
    rung.translate(0, 0.4 + i * ((H - 0.4) / 8), 1.32);
    parts.push(rung);
  }
  return mergePainted(parts);
}

/** La boca de la cueva: an arch of rock with a dark interior. */
function cave(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI;
    const rock = smoothRock(0.66, 70 + i);
    rock.scale(1, 1.25, 0.85);
    rock.rotateY(i * 0.8);
    rock.translate(Math.cos(a) * 1.7, Math.sin(a) * 2.1, 0);
    parts.push(rock);
  }
  // The mouth itself: near-black, so the cave reads as depth rather than a hole.
  const mouth = new THREE.SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  mouth.scale(1, 1.25, 0.35);
  mouth.translate(0, 0, -0.55);
  parts.push(paintFlat(mouth, PIP_PARTS.eye));
  return mergePainted(parts);
}

/** El bote: the way to El Islote. A hull, a bench and an oar. */
function boat(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const hull = new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  hull.scale(0.62, 0.42, 1.5);
  hull.rotateX(Math.PI);
  hull.translate(0, 0.42, 0);
  parts.push(paintFlat(hull, CLAY.bark));
  const rim = new THREE.TorusGeometry(0.62, 0.055, 5, 16);
  rim.rotateX(Math.PI / 2);
  rim.scale(1, 1, 2.42);
  rim.translate(0, 0.42, 0);
  parts.push(paintFlat(rim, CLAY.barkRoof));
  parts.push(bevelBox(1.05, 0.06, 0.28, CLAY.barkDeep).translate(0, 0.4, 0));
  const oar = bevelBox(0.05, 0.05, 1.5, CLAY.bark);
  oar.rotateX(0.35);
  oar.translate(0.5, 0.5, 0.1);
  parts.push(oar);
  return mergePainted(parts);
}

/** El telescopio: the tier-10 `observe` spot at the summit. */
function telescope(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const leg = bevelBox(0.05, 1.0, 0.05, PIP_PARTS.metal);
    leg.rotateZ(0.28);
    leg.rotateY((i / 3) * Math.PI * 2);
    leg.translate(0, 0.5, 0);
    parts.push(leg);
  }
  const tube = new THREE.CylinderGeometry(0.11, 0.15, 0.95, 9);
  tube.rotateZ(Math.PI / 2 - 0.55);
  tube.translate(0, 1.15, 0);
  parts.push(paintFlat(tube, PIP_PARTS.eye));
  const lens = new THREE.SphereGeometry(0.12, 8, 6);
  lens.scale(1, 1, 0.3);
  lens.translate(0.42, 1.42, 0);
  parts.push(paintFlat(lens, DOMAIN_COLORS.ciencia));
  return mergePainted(parts);
}

/** El Monumento: the tier-11 legacy marker. Golden, and deliberately simple. */
function monument(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.CylinderGeometry(1.05, 1.3, 0.45, 10);
  base.translate(0, 0.22, 0);
  parts.push(paintFlat(base, CLAY.stone));
  const step = new THREE.CylinderGeometry(0.8, 0.95, 0.3, 10);
  step.translate(0, 0.58, 0);
  parts.push(paintFlat(step, CLAY.stoneDeep));
  // A seed, three metres tall, standing on the summit.
  const seed = new THREE.SphereGeometry(0.75, 14, 10);
  seed.scale(0.85, 1.35, 0.8);
  seed.translate(0, 1.85, 0);
  parts.push(paintVertical(seed, CLAY.sand, DOMAIN_COLORS.energia, 0.7));
  const leaf = new THREE.SphereGeometry(0.5, 9, 6);
  leaf.scale(1, 0.16, 0.42);
  leaf.translate(0.5, 0, 0);
  leaf.rotateZ(0.55);
  leaf.translate(0, 3.15, 0);
  parts.push(paintFlat(leaf, DOMAIN_COLORS.energia));
  return mergePainted(parts);
}

/** La hamaca, as a fixed tier-6 structure rather than a placed prop. */
function hammock(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const segments = 9;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const sag = Math.sin(t * Math.PI) * 0.24;
    const seg = bevelBox(1.8 / segments, 0.035, 0.44, PIP_PARTS.cloth);
    seg.translate(-0.9 + t * 1.8, 1.0 - sag, 0);
    parts.push(seg);
  }
  return mergePainted(parts);
}

/** El nido: the tier-5 first nest. */
function nest(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bowl = new THREE.TorusGeometry(0.19, 0.09, 5, 12);
  bowl.rotateX(Math.PI / 2);
  bowl.scale(1, 0.7, 1);
  parts.push(paintFlat(bowl, CLAY.barkDeep));
  for (let i = 0; i < 2; i++) {
    const egg = new THREE.SphereGeometry(0.06, 7, 5);
    egg.scale(1, 1.25, 1);
    egg.translate(-0.05 + i * 0.1, 0.02, 0);
    parts.push(paintFlat(egg, PIP_PARTS.cloth));
  }
  return mergePainted(parts);
}

const BUILDERS: Partial<Record<FeatureId, (size?: number) => THREE.BufferGeometry>> = {
  mojon, bench, compost, bridge, waterfall, treehouse, cave, boat, telescope, monument, hammock, nest,
};

const cache = new Map<string, THREE.BufferGeometry>();

/**
 * Built on first use and cached. A feature the tier has not granted costs
 * nothing. `size` is for a structure sized to where it stands — the bridge's span.
 */
export function buildStructure(feature: FeatureId, size?: number): THREE.BufferGeometry | null {
  // Centimetres, as an integer: close enough to share a cached shape.
  const key = size === undefined ? feature : `${feature}:${Math.round(size * 100)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const build = BUILDERS[feature];
  if (!build) return null;
  const geo = build(size);
  cache.set(key, geo);
  return geo;
}

export function disposeStructures(): void {
  for (const geo of cache.values()) geo.dispose();
  cache.clear();
}

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

import { SCALE_REFERENCE } from '@/lib/world/config';
import type { FeatureId } from '@/lib/world/types';
import { CLAY, DOMAIN_COLORS, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical, post } from './build';

/** El Mojón: the one place impact numbers live. A stone marker, waist high. */
function mojon(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.IcosahedronGeometry(0.42, 0);
  base.scale(1, 0.5, 1);
  base.translate(0, 0.2, 0);
  parts.push(paintFlat(base, CLAY.stoneDeep));
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

/** El puente de madera: planks and two rails across the channel. */
function bridge(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const planks = 11;
  for (let i = 0; i < planks; i++) {
    const t = i / (planks - 1);
    const plank = bevelBox(0.3, 0.07, 1.5, i % 2 ? CLAY.bark : CLAY.barkRoof);
    // A gentle camber: a flat bridge reads as a plank, an arched one as a bridge.
    plank.translate(-1.9 + t * 3.8, 0.32 + Math.sin(t * Math.PI) * 0.16, 0);
    parts.push(plank);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const p = post(0.05, 0.6, CLAY.barkDeep);
      p.translate(-1.8 + t * 3.6, 0.3 + Math.sin(t * Math.PI) * 0.16, side * 0.68);
      parts.push(p);
    }
    const rail = bevelBox(3.7, 0.06, 0.06, CLAY.bark);
    rail.translate(0, 0.98, side * 0.68);
    parts.push(rail);
  }
  return mergePainted(parts);
}

/** La cascada: the rock lip the water breaks over. The sheet is a water mesh. */
function waterfall(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const rock = new THREE.IcosahedronGeometry(0.55 + (i % 3) * 0.18, 0);
    rock.scale(1.3, 0.7, 1);
    rock.rotateY(i * 1.3);
    rock.translate(-1.4 + i * 0.7, 0.3 + (i % 2) * 0.2, (i % 2 ? 0.3 : -0.2));
    parts.push(paintFlat(rock, i % 2 ? CLAY.stone : CLAY.stoneDeep));
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
    const rock = new THREE.IcosahedronGeometry(0.62, 0);
    rock.scale(1, 0.9, 0.8);
    rock.rotateY(i * 0.8);
    rock.translate(Math.cos(a) * 1.7, Math.sin(a) * 2.1, 0);
    parts.push(paintFlat(rock, i % 2 ? CLAY.stone : CLAY.stoneDeep));
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

const BUILDERS: Partial<Record<FeatureId, () => THREE.BufferGeometry>> = {
  mojon, bench, compost, bridge, waterfall, treehouse, cave, boat, telescope, monument, hammock, nest,
};

const cache = new Map<string, THREE.BufferGeometry>();

/** Built on first use and cached. A feature the tier has not granted costs nothing. */
export function buildStructure(feature: FeatureId): THREE.BufferGeometry | null {
  const hit = cache.get(feature);
  if (hit) return hit;
  const build = BUILDERS[feature];
  if (!build) return null;
  const geo = build();
  cache.set(feature, geo);
  return geo;
}

export function disposeStructures(): void {
  for (const geo of cache.values()) geo.dispose();
  cache.clear();
}

/**
 * The fixed structures: the things the ladder puts on the island, as opposed to
 * the ten props the player places.
 *
 * One builder per `FeatureId` that has a shape. They are keyed by feature so the
 * scene can walk the layout's anchors and never has to know what a bridge is —
 * which is also what makes the tier-up ceremony's "the feature arrives" beat a
 * matter of animating something that already exists (`08` §5.3).
 *
 * The carpentry ones (bridge, compost bin, treehouse, boat, telescope) are in
 * `structures-wood.ts`; the bench and the hammock are the placeable props'
 * own shapes (`props-build.ts`). This file holds the stone ones and the registry.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import type { FeatureId } from '@/lib/world/types';
import { CLAY, DOMAIN_COLORS, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical } from './build';
import { weather } from './carpentry';
import { banco, hamaca } from './props-build';
import { smoothRock } from './scatter';
import { boat, bridge, bridgeRails, compost, telescope, treehouse } from './structures-wood';

/** A patch of moss, sitting on whatever it is placed on. */
function moss(parts: THREE.BufferGeometry[], x: number, y: number, z: number, r: number): void {
  const m = new THREE.SphereGeometry(r, 8, 4);
  m.scale(1, 0.28, 1);
  m.translate(x, y, z);
  parts.push(paintVertical(m, NATIVE.moss, CLAY.grass, 1.3));
}

/**
 * El Mojón: the one place impact numbers live. A waist-high stone post, hewn
 * rather than turned, with a carved panel angled to the light, moss at its foot
 * and the small stones people leave on a marker.
 */
function mojon(): THREE.BufferGeometry {
  const rng = mulberry32(1201);
  const parts: THREE.BufferGeometry[] = [];
  const base = smoothRock(0.42, 11);
  base.scale(1.1, 0.55, 1.1);
  base.translate(0, 0.08, 0);
  parts.push(base);
  const shaft = new THREE.CylinderGeometry(0.15, 0.21, 0.98, 10, 8);
  const pos = shaft.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const k = 1 + Math.sin(a * 3 + 1.3) * 0.05 + Math.sin(a * 7 + pos.getY(i) * 5) * 0.025;
    pos.setX(i, pos.getX(i) * k);
    pos.setZ(i, pos.getZ(i) * k);
  }
  shaft.computeVertexNormals();
  shaft.translate(0, 0.72, 0);
  parts.push(paintVertical(shaft, CLAY.stoneDeep, CLAY.stone, 0.9));
  const frame = bevelBox(0.38, 0.44, 0.05, weather(CLAY.stoneDeep, rng, 0.5), 0.9);
  const face = bevelBox(0.31, 0.37, 0.04, CLAY.sand, 0.94);
  face.translate(0, 0, 0.018);
  for (const g of [frame, face]) {
    g.rotateX(-0.28);
    g.translate(0, 0.96, 0.17);
    parts.push(g);
  }
  for (let i = 0; i < 6; i++) {
    const a = rng() * Math.PI * 2;
    moss(parts, Math.cos(a) * 0.32, 0.2 + rng() * 0.05, Math.sin(a) * 0.3, 0.06 + rng() * 0.04);
  }
  for (let i = 0; i < 3; i++) {
    const pebble = smoothRock(0.05 - i * 0.01, 1210 + i);
    pebble.scale(1, 0.6, 1);
    pebble.translate(0.24, 0.27 + i * 0.045, -0.12);
    parts.push(pebble);
  }
  return mergePainted(parts);
}

/** La cascada: the rock lip the water breaks over. The sheet is a water mesh. */
function waterfall(): THREE.BufferGeometry {
  const rng = mulberry32(1301);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const rock = smoothRock(0.55 + (i % 3) * 0.18, 40 + i);
    rock.scale(1.3, 0.9, 1);
    rock.rotateY(i * 1.3);
    rock.translate(-1.4 + i * 0.7, 0.2 + (i % 2) * 0.2, i % 2 ? 0.3 : -0.2);
    parts.push(rock);
    moss(parts, -1.4 + i * 0.7, 0.55 + (i % 2) * 0.2, (i % 2 ? 0.3 : -0.2) + 0.1, 0.12 + rng() * 0.08);
  }
  return mergePainted(parts);
}

/** La boca de la cueva: an arch of rock with a dark interior. */
function cave(): THREE.BufferGeometry {
  const rng = mulberry32(1401);
  const parts: THREE.BufferGeometry[] = [];
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI;
    const rock = smoothRock(0.66, 70 + i);
    rock.scale(1, 1.25, 0.85);
    rock.rotateY(i * 0.8);
    rock.translate(Math.cos(a) * 1.7, Math.sin(a) * 2.1, 0);
    parts.push(rock);
    if (i % 2 === 0) moss(parts, Math.cos(a) * 1.7, Math.sin(a) * 2.1 + 0.6, 0.25, 0.14 + rng() * 0.1);
  }
  // The mouth itself: near-black, so the cave reads as depth rather than a hole.
  const mouth = new THREE.SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  mouth.scale(1, 1.25, 0.35);
  mouth.translate(0, 0, -0.55);
  parts.push(paintFlat(mouth, PIP_PARTS.eye));
  return mergePainted(parts);
}

/** El Monumento: the tier-11 legacy marker. A golden seed on a plinth of cut stone. */
function monument(): THREE.BufferGeometry {
  const rng = mulberry32(1501);
  const parts: THREE.BufferGeometry[] = [];
  // Two courses of cut stone, each block its own tone.
  for (const [radius, y, count, h] of [[1.2, 0.18, 14, 0.36], [0.88, 0.5, 11, 0.28]] as const) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (y > 0.3 ? 0.14 : 0);
      const w = ((Math.PI * 2 * radius) / count) * 0.97;
      const block = bevelBox(w, h, 0.34, weather(CLAY.stone, rng, 0.7), 0.9);
      block.rotateY(-a + Math.PI / 2);
      block.translate(Math.cos(a) * radius, y, Math.sin(a) * radius);
      parts.push(block);
    }
    const fill = new THREE.CylinderGeometry(radius - 0.05, radius - 0.05, h * 0.98, count * 2);
    fill.translate(0, y, 0);
    parts.push(paintFlat(fill, weather(CLAY.stoneDeep, rng, 0.4)));
  }
  // A seed, three metres tall, standing on the summit.
  const seed = new THREE.SphereGeometry(0.75, 28, 20);
  seed.scale(0.85, 1.35, 0.8);
  seed.translate(0, 1.66, 0);
  parts.push(paintVertical(seed, CLAY.sand, DOMAIN_COLORS.energia, 0.7));
  for (const side of [-1, 1]) {
    const leaf = new THREE.SphereGeometry(0.5, 16, 8);
    leaf.scale(1, 0.14, 0.42);
    leaf.translate(0.5, 0, 0);
    leaf.rotateZ(side > 0 ? 0.55 : Math.PI - 0.55);
    leaf.translate(0, 2.96, 0);
    parts.push(paintVertical(leaf, DOMAIN_COLORS.energia, CLAY.sand, 1.2));
  }
  const plaque = bevelBox(0.5, 0.2, 0.03, weather(DOMAIN_COLORS.energia, rng, 0.3), 0.94);
  plaque.translate(0, 0.52, 0.9);
  parts.push(plaque);
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
  mojon, bench: banco, compost, bridge, waterfall, treehouse, cave, boat, telescope, monument, hammock: hamaca, nest,
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

/** The bridge's rails, apart from its deck (`bridgeRails`). Cached like every structure. */
export function buildBridgeRails(span?: number): THREE.BufferGeometry {
  const key = span === undefined ? 'bridge-rails' : `bridge-rails:${Math.round(span * 100)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const geo = bridgeRails(span);
  cache.set(key, geo);
  return geo;
}

export function disposeStructures(): void {
  for (const geo of cache.values()) geo.dispose();
  cache.clear();
}

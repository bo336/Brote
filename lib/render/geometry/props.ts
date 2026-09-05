/**
 * The ten placeable props from `14-CONTENT.md` §3, all procedural.
 *
 * The slugs, prices and rank gates come from the live `cosmetics` table and are
 * used verbatim — none of this invents a prop.
 *
 * **Their Spanish descriptions are a specification, not flavour text.** The
 * lanterns light at night, the windmill turns and turns faster when it blows,
 * the hammock sways and is a `rest` spot, the beehive has bees by day, the
 * feeder draws a bird within 8 m. A prop whose description promises motion and
 * does not move is a bug (`20-ACCEPTANCE.md` 3C).
 */
import * as THREE from 'three';

import { PLACEMENT } from '@/lib/world/config';
import type { PropId } from '@/lib/world/types';
import { CLAY, DOMAIN_COLORS, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, post } from './build';

/**
 * What a prop needs from the world beyond its geometry: how much ground it
 * reserves, and which moving part the scene has to animate.
 */
export interface PropSpec {
  /** Collision and overlap radius, in metres. */
  footprint: number;
  /**
   * A named part the scene animates. `null` for props that just sit there —
   * most of them, and that is fine.
   */
  animates: 'windmill' | 'lantern' | 'sway' | 'bees' | 'feeder' | null;
  /** Whether the prop is a `rest` interactable (`10-CONTROLS` §3). */
  rest?: boolean;
}

export const PROP_SPECS: Record<PropId, PropSpec> = {
  mundo_comedero: { footprint: 0.4, animates: 'feeder' },
  mundo_banco: { footprint: 0.7, animates: null, rest: true },
  mundo_hamaca: { footprint: 1.1, animates: 'sway', rest: true },
  mundo_colmena: { footprint: 0.5, animates: 'bees' },
  mundo_farolitos: { footprint: 1.4, animates: 'lantern' },
  mundo_arco: { footprint: 0.9, animates: null },
  mundo_huerta: { footprint: 1.3, animates: null },
  mundo_totem: { footprint: 0.4, animates: null },
  mundo_carpa: { footprint: 1.2, animates: null },
  mundo_molino: { footprint: 0.8, animates: 'windmill' },
};

/** The footprint a prop reserves, falling back to the default. */
export function propFootprint(slug: PropId): number {
  return PROP_SPECS[slug]?.footprint ?? PLACEMENT.defaultFootprintM;
}

// ── Builders ────────────────────────────────────────────────────────────────

/** "Un poste con techito. Los pájaros lo van a encontrar." */
function comedero(): THREE.BufferGeometry {
  const parts = [post(0.035, 1.05, CLAY.bark)];
  const tray = bevelBox(0.34, 0.05, 0.28, CLAY.bark);
  tray.translate(0, 1.05, 0);
  parts.push(tray);
  for (const side of [-1, 1]) {
    const roof = bevelBox(0.26, 0.03, 0.3, CLAY.barkRoof);
    roof.rotateZ(side * 0.5);
    roof.translate(side * 0.1, 1.32, 0);
    parts.push(roof);
  }
  const seed = new THREE.SphereGeometry(0.05, 6, 4);
  seed.scale(1.6, 0.5, 1.4);
  seed.translate(0, 1.09, 0);
  parts.push(paintFlat(seed, CLAY.sand));
  return mergePainted(parts);
}

/** "Madera gastada mirando al agua." */
function banco(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const leg = bevelBox(0.08, 0.4, 0.36, CLAY.barkDeep);
    leg.translate(side * 0.42, 0.2, 0);
    parts.push(leg);
  }
  const seat = bevelBox(1.05, 0.07, 0.36, CLAY.bark);
  seat.translate(0, 0.43, 0);
  parts.push(seat);
  const back = bevelBox(1.0, 0.16, 0.06, CLAY.bark);
  back.translate(0, 0.68, -0.16);
  parts.push(back);
  return mergePainted(parts);
}

/** "Colgada entre dos árboles, se mueve con el viento." */
function hamaca(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) parts.push(bevelBox(0.07, 1.5, 0.07, CLAY.bark).translate(side * 0.95, 0.75, 0));
  // The sling: a shallow arc of segments, so it reads as cloth under weight.
  const segments = 9;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -0.85 + t * 1.7;
    const sag = Math.sin(t * Math.PI) * 0.22;
    const seg = bevelBox(1.7 / segments, 0.035, 0.42, PIP_PARTS.cloth);
    seg.translate(x, 0.95 - sag, 0);
    parts.push(seg);
  }
  return mergePainted(parts);
}

/** "Cajones apilados y abejas dando vueltas." */
function colmena(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const box = bevelBox(0.44 - i * 0.03, 0.16, 0.4 - i * 0.03, i % 2 ? CLAY.sand : CLAY.bark);
    box.translate(0, 0.09 + i * 0.17, 0);
    parts.push(box);
  }
  const lid = bevelBox(0.5, 0.05, 0.46, CLAY.barkRoof);
  lid.translate(0, 0.63, 0);
  parts.push(lid);
  return mergePainted(parts);
}

/** "Una guirnalda sobre el sendero. De noche se prende." */
function farolitos(): THREE.BufferGeometry {
  const parts = [post(0.04, 1.6, CLAY.bark), post(0.04, 1.6, CLAY.bark).translate(2.2, 0, 0)];
  const span = 8;
  for (let i = 0; i <= span; i++) {
    const t = i / span;
    const sag = Math.sin(t * Math.PI) * 0.3;
    const cord = bevelBox(2.2 / span, 0.015, 0.015, CLAY.barkDeep);
    cord.translate(t * 2.2, 1.58 - sag, 0);
    parts.push(cord);
    if (i % 2 === 0 && i > 0 && i < span) {
      // The bulbs are painted with the energy accent: at night the scene tints
      // them by instance colour rather than by swapping a material.
      const bulb = new THREE.SphereGeometry(0.055, 6, 5);
      bulb.translate(t * 2.2, 1.5 - sag, 0);
      parts.push(paintFlat(bulb, DOMAIN_COLORS.energia));
    }
  }
  return mergePainted(parts);
}

/** "Un arco cubierto de enredaderas en flor." */
function arco(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI;
    const x = Math.cos(a) * 0.75;
    const y = Math.sin(a) * 1.55;
    const seg = bevelBox(0.09, 0.22, 0.09, CLAY.bark);
    seg.rotateZ(-a + Math.PI / 2);
    seg.translate(x, y, 0);
    parts.push(seg);
    if (i % 2 === 0) {
      const bloom = new THREE.SphereGeometry(0.075, 6, 5);
      bloom.scale(1, 0.7, 1);
      bloom.translate(x * 1.04, y + 0.06, (i % 4 === 0 ? 0.07 : -0.07));
      parts.push(paintFlat(bloom, i % 4 === 0 ? DOMAIN_COLORS.animales : CLAY.leaf));
    }
  }
  return mergePainted(parts);
}

/** "Cuatro canteros con verduras creciendo en hilera." */
function huerta(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let bed = 0; bed < 4; bed++) {
    const z = -0.6 + bed * 0.4;
    const frame = bevelBox(1.5, 0.12, 0.3, CLAY.bark);
    frame.translate(0, 0.06, z);
    parts.push(frame);
    const soil = bevelBox(1.4, 0.06, 0.22, CLAY.soilDeep);
    soil.translate(0, 0.13, z);
    parts.push(soil);
    for (let i = 0; i < 4; i++) {
      const crop = new THREE.SphereGeometry(0.07, 6, 5);
      crop.scale(1, 1.3, 1);
      crop.translate(-0.5 + i * 0.34, 0.2, z);
      parts.push(paintFlat(crop, bed % 2 ? CLAY.leaf : CLAY.grass));
    }
  }
  return mergePainted(parts);
}

/** "Piedras apiladas que alguien equilibró con paciencia." */
function totem(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const sizes = [0.3, 0.24, 0.19, 0.14, 0.09];
  let y = 0;
  for (let i = 0; i < sizes.length; i++) {
    const r = sizes[i]!;
    const stone = new THREE.IcosahedronGeometry(r, 0);
    stone.scale(1, 0.66, 0.92);
    stone.rotateY(i * 1.1);
    stone.translate((i % 2 ? 1 : -1) * 0.02, y + r * 0.66, 0);
    parts.push(paintFlat(stone, i % 2 ? CLAY.stone : CLAY.stoneDeep));
    y += r * 1.25;
  }
  return mergePainted(parts);
}

/** "Armada junto al fuego, lista para quedarse a dormir." */
function carpa(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // A ridge tent: two sloping walls and a floor, all bevelled.
  for (const side of [-1, 1]) {
    const wall = bevelBox(0.05, 1.35, 1.5, DOMAIN_COLORS.comunidad);
    wall.rotateZ(side * 0.62);
    wall.translate(side * 0.38, 0.6, 0);
    parts.push(wall);
  }
  const floor = bevelBox(1.35, 0.05, 1.5, CLAY.soilDeep);
  floor.translate(0, 0.03, 0);
  parts.push(floor);
  const ridge = bevelBox(0.07, 0.07, 1.6, CLAY.bark);
  ridge.translate(0, 1.16, 0);
  parts.push(ridge);
  return mergePainted(parts);
}

/**
 * "Gira de verdad, más rápido cuando sopla fuerte."
 *
 * Built as two pieces so the scene can spin the blades on their own axis
 * without moving the tower — the RPM comes from `MirrorParams.windmillRPM`,
 * which is real kWh not spent.
 */
function molinoTower(): THREE.BufferGeometry {
  const parts = [post(0.16, 2.4, CLAY.sand, 8)];
  const cap = new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.translate(0, 2.4, 0);
  parts.push(paintFlat(cap, CLAY.barkRoof));
  return mergePainted(parts);
}

function molinoBlades(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const blade = bevelBox(0.09, 0.95, 0.03, PIP_PARTS.cloth);
    blade.translate(0, 0.5, 0);
    blade.rotateZ((i / 4) * Math.PI * 2);
    parts.push(blade);
  }
  const hub = new THREE.SphereGeometry(0.09, 7, 5);
  parts.push(paintFlat(hub, CLAY.bark));
  return mergePainted(parts);
}

/** Props whose moving part is a separate mesh the scene animates. */
export const MOVING_PARTS: Partial<Record<PropId, () => THREE.BufferGeometry>> = {
  mundo_molino: molinoBlades,
};

/** Where a prop's moving part is mounted, relative to the prop's origin. */
export const MOVING_PART_MOUNT: Partial<Record<PropId, [number, number, number]>> = {
  mundo_molino: [0, 2.4, 0.22],
};

const BUILDERS: Record<PropId, () => THREE.BufferGeometry> = {
  mundo_comedero: comedero,
  mundo_banco: banco,
  mundo_hamaca: hamaca,
  mundo_colmena: colmena,
  mundo_farolitos: farolitos,
  mundo_arco: arco,
  mundo_huerta: huerta,
  mundo_totem: totem,
  mundo_carpa: carpa,
  mundo_molino: molinoTower,
};

const cache = new Map<string, THREE.BufferGeometry>();

/** Built on first use and cached — a prop the player never places costs nothing. */
export function buildProp(slug: PropId): THREE.BufferGeometry | null {
  const hit = cache.get(slug);
  if (hit) return hit;
  const build = BUILDERS[slug];
  if (!build) return null;
  const geo = build();
  cache.set(slug, geo);
  return geo;
}

export function buildMovingPart(slug: PropId): THREE.BufferGeometry | null {
  const key = `${slug}:moving`;
  const hit = cache.get(key);
  if (hit) return hit;
  const build = MOVING_PARTS[slug];
  if (!build) return null;
  const geo = build();
  cache.set(key, geo);
  return geo;
}

export const PROP_IDS = Object.keys(BUILDERS) as PropId[];

export function disposeProps(): void {
  for (const geo of cache.values()) geo.dispose();
  cache.clear();
}

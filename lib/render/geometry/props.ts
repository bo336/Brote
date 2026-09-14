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
 *
 * The builders themselves are in `props-build.ts` (wood, rope, canvas) and
 * `props-garden.ts` (the ones something grows or lives in), made from the
 * carpentry vocabulary in `carpentry.ts`. This file is the registry.
 */
import type * as THREE from 'three';

import { PLACEMENT } from '@/lib/world/config';
import type { PropId } from '@/lib/world/types';
import { banco, carpa, farolitos, hamaca, HEAD_Y, molinoBlades, molinoTower } from './props-build';
import { arco, colmena, comedero, huerta, totem } from './props-garden';

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
  // The tent now has its fire pit in front of it, inside the same footprint.
  mundo_carpa: { footprint: 1.3, animates: null },
  mundo_molino: { footprint: 0.8, animates: 'windmill' },
};

/** The footprint a prop reserves, falling back to the default. */
export function propFootprint(slug: PropId): number {
  return PROP_SPECS[slug]?.footprint ?? PLACEMENT.defaultFootprintM;
}

/** Props whose moving part is a separate mesh the scene animates. */
export const MOVING_PARTS: Partial<Record<PropId, () => THREE.BufferGeometry>> = {
  mundo_molino: molinoBlades,
};

/** Where a prop's moving part is mounted, relative to the prop's origin. */
export const MOVING_PART_MOUNT: Partial<Record<PropId, [number, number, number]>> = {
  mundo_molino: [0, HEAD_Y, 0.22],
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

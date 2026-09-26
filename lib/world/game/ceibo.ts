/**
 * El Ceibo's shape, from the real impact totals and from nothing else
 * (`docs/MUNDO_JUEGO.md` §3.10, R13).
 *
 * Pure and separate from the game state on purpose: its only input is
 * `ImpactTotals`, which the app measures, so there is no path by which playing
 * could make it grow — and a test says so.
 */
import type { ImpactTotals } from '../types';

export const CEIBO = {
  /** One flower per action up to here; past it the crown is simply full. */
  maxFlowers: 240,
  /** A flower is about as big as a real ceibo flower at this scale. */
  flowerScale: 1.35,
  /** Size of the tree at 0 actions, and how much each tenfold adds. */
  scaleAtZero: 0.42,
  scalePerDecade: 0.24,
  scaleMax: 1.25,
  trunkRadiusM: 0.3,
  crownRadiusM: 1.4,
  interactRadiusM: 2.6,
  tagWithinM: 11,
  lanternRingM: 1.9,
  /** Where the spring and the bed sit, relative to the trunk. */
  springAt: [-1.5, 0.9] as const,
  bedAt: [1.4, 1.2] as const,
  copy: {
    title: 'Tu ceibo',
    verb: 'Ver tu impacto real',
    line: (n: number) => (n === 1 ? '1 acción real' : `${n} acciones reales`),
  },
} as const;

export interface CeiboShape {
  /** Uniform scale of the tree. */
  scale: number;
  /** Red flowers in the crown. */
  flowers: number;
  /** Radius of the spring, metres; 0 before any water was saved. */
  springM: number;
  /** Flowers in the bed where the rubbish was; 0 before any waste was avoided. */
  bedFlowers: number;
  /** Paper lanterns; 0 before any energy was saved. */
  lanterns: number;
}

/**
 * Logarithmic everywhere: the first actions change the most, and a veteran's
 * ceibo keeps getting fuller without ever outgrowing the Claro. Radii are
 * rounded to steps so the geometry cache holds a handful of variants, not one
 * per litre.
 */
export function ceiboShape(t: ImpactTotals): CeiboShape {
  const actions = Math.max(0, Math.floor(t.actions ?? 0));
  const scale = Math.min(CEIBO.scaleMax, CEIBO.scaleAtZero + CEIBO.scalePerDecade * Math.log10(1 + actions));
  const water = Math.max(0, t.water_l);
  const springM = water > 0 ? Math.round(Math.min(0.85, 0.22 + 0.13 * Math.log10(1 + water / 20)) * 20) / 20 : 0;
  const waste = Math.max(0, t.waste_kg);
  const bedFlowers = waste > 0 ? Math.min(14, 2 + Math.floor(2 * Math.log2(1 + waste))) : 0;
  const energy = Math.max(0, t.energy_kwh);
  const lanterns = energy > 0 ? Math.min(6, 1 + Math.floor(Math.log2(1 + energy / 4))) : 0;
  return { scale, flowers: Math.min(CEIBO.maxFlowers, actions), springM, bedFlowers, lanterns };
}

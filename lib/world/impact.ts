/**
 * The impact mirror: four real metrics → thirteen world parameters.
 *
 * The world IS the dashboard (`13-IMPACT-MIRROR.md`). Litres saved become the
 * river's width and flow; kg CO₂ become how far you can see; kg waste become a
 * shrinking beach and a growing compost heap; kWh become the lights at night.
 *
 * Two properties make this compatible with "the world never regresses"
 * (`01-RULES.md` §4.2): cumulative impact only ever increases, and every mapping
 * here is monotonic in its input. So no world system driven by it can regress.
 *
 * Pure. The scene reads the output as uniforms and instance counts and does not
 * know what an impact metric is.
 */
import { IMPACT_CURVE, MIRROR_RANGE } from './config';
import type { ImpactTotals, MirrorParams } from './types';

/** 0..1, guarding against NaN from a malformed jsonb payload. */
function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * The log curve. Impact totals span orders of magnitude — a linear map would be
 * invisible for a year and then saturate — so progress is read on a log scale
 * between a reference amount and a saturation point.
 */
export function curve(value: number, ref: number, max: number): number {
  const v = Number.isFinite(value) ? Math.max(0, value) : 0;
  return clamp01(Math.log10(1 + v / ref) / Math.log10(1 + max / ref));
}

/** Interpolate one `MIRROR_RANGE` entry. Ranges may descend (fog, debris). */
function lerpRange(range: readonly [number, number], t: number): number {
  return range[0] + (range[1] - range[0]) * clamp01(t);
}

/** Round to instance counts — you cannot render 7.4 lanterns. */
function count(range: readonly [number, number], t: number): number {
  return Math.round(lerpRange(range, t));
}

/**
 * The whole mirror, as thirteen numbers. Every one is inside its declared clamp
 * for every finite input, including 0 and 1e9 — `impact.test.ts` proves it.
 */
export function mirrorFrom(totals: ImpactTotals): MirrorParams {
  const water = curve(totals.water_l, IMPACT_CURVE.water_l.ref, IMPACT_CURVE.water_l.max);
  const co2 = curve(totals.co2_kg, IMPACT_CURVE.co2_kg.ref, IMPACT_CURVE.co2_kg.max);
  const waste = curve(totals.waste_kg, IMPACT_CURVE.waste_kg.ref, IMPACT_CURVE.waste_kg.max);
  const energy = curve(totals.energy_kwh, IMPACT_CURVE.energy_kwh.ref, IMPACT_CURVE.energy_kwh.max);

  return {
    // Agua → El Río. Before tier 7 the same value drives the puddle and the can.
    riverWidth: lerpRange(MIRROR_RANGE.riverWidth, water),
    riverFlow: lerpRange(MIRROR_RANGE.riverFlow, water),
    waterfallGain: lerpRange(MIRROR_RANGE.waterfallGain, water),
    pondArea: lerpRange(MIRROR_RANGE.pondArea, water),
    // CO₂ → El Aire. Clean air is literally how far you can see.
    fogDensity: lerpRange(MIRROR_RANGE.fogDensity, co2),
    fogFar: lerpRange(MIRROR_RANGE.fogFar, co2),
    skySaturation: lerpRange(MIRROR_RANGE.skySaturation, co2),
    // Residuos → La Costa y la Compostera. The debris field only ever shrinks.
    debrisCount: count(MIRROR_RANGE.debrisCount, waste),
    compostScale: lerpRange(MIRROR_RANGE.compostScale, waste),
    // Energía → La Noche.
    lanternCount: count(MIRROR_RANGE.lanternCount, energy),
    fireflyCount: count(MIRROR_RANGE.fireflyCount, energy),
    auroraIntensity: lerpRange(MIRROR_RANGE.auroraIntensity, energy),
    windmillRPM: lerpRange(MIRROR_RANGE.windmillRPM, energy),
  };
}

/** The mirror at zero impact — the honest starting state of a brand-new island. */
export const ZERO_MIRROR: MirrorParams = mirrorFrom({
  water_l: 0,
  co2_kg: 0,
  waste_kg: 0,
  energy_kwh: 0,
});

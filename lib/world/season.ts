/**
 * Seasons, on the Argentine calendar (`08-WORLD-AND-PROGRESSION.md` §9).
 *
 * Purely visual and species-level. **No mechanic is gated on a season**, so
 * nobody misses content by playing in March — which is also why the modifiers
 * below only bias ramps and weights, and never switch anything off.
 */
import { SEASON_STARTS } from './config';
import type { SeasonId, TimeOfDay } from './types';

export interface SeasonMods {
  /** -1 bare and cool … +1 full and warm. Biases the canopy colour ramp. */
  canopyShift: number;
  /** -1 dry … +1 lush. Biases the ground tint. */
  groundTint: number;
  /** 0..1 of summit height where the snow line sits. Lower = more snow. */
  snowLine: number;
  /** Relative weights for picking a time-of-day preset on entry. */
  todWeights: Record<TimeOfDay, number>;
}

const MODS: Record<SeasonId, SeasonMods> = {
  primavera: {
    canopyShift: 0.6,
    groundTint: 0.8,
    snowLine: 0.8,
    todWeights: { amanecer: 1.2, dia: 1.4, atardecer: 1, noche: 0.6 },
  },
  verano: {
    canopyShift: 1,
    groundTint: 0.4,
    snowLine: 0.95,
    todWeights: { amanecer: 1, dia: 1.6, atardecer: 1.2, noche: 0.6 },
  },
  otono: {
    canopyShift: -0.3,
    groundTint: -0.2,
    snowLine: 0.75,
    todWeights: { amanecer: 1, dia: 1, atardecer: 1.5, noche: 0.9 },
  },
  invierno: {
    canopyShift: -0.8,
    groundTint: -0.6,
    snowLine: 0.45,
    todWeights: { amanecer: 0.8, dia: 1, atardecer: 1.1, noche: 1.4 },
  },
};

/** Day-of-year index, ignoring leap-day drift — a boundary a day out is fine. */
function dayIndex(month: number, day: number): number {
  return month * 100 + day;
}

/**
 * The season for a date, southern hemisphere. Callers pass a date already in
 * `WORLD_TIMEZONE` — this module does no zone conversion of its own, because
 * the server owns the local date everywhere else in the app.
 */
export function seasonFor(date: Date): SeasonId {
  const d = dayIndex(date.getMonth() + 1, date.getDate());
  const verano = dayIndex(...SEASON_STARTS.verano);
  const otono = dayIndex(...SEASON_STARTS.otono);
  const invierno = dayIndex(...SEASON_STARTS.invierno);
  const primavera = dayIndex(...SEASON_STARTS.primavera);
  if (d >= verano || d < otono) return 'verano';
  if (d < invierno) return 'otono';
  if (d < primavera) return 'invierno';
  return 'primavera';
}

/** What a season changes. Never what it removes. */
export function seasonModifiers(season: SeasonId): SeasonMods {
  return MODS[season];
}

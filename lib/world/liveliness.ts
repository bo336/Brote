/**
 * `liveliness` — the one number that says how recently somebody has been here,
 * and **the one number that is only ever allowed to add**.
 *
 * `01-RULES.md` §4.2 is a hard rule and `08-WORLD-AND-PROGRESSION.md` §6 spells
 * out why: a player returning after two months finds their island exactly as
 * they left it, just quieter, and it brightens within one session. It never
 * desaturates, never wilts, never greys, and nothing they built goes away.
 *
 * This module exists because that rule was being enforced by three separate
 * copies of the same clamp — in the light rig, in the fauna pool and in the
 * poster's SVG fallback — and a rule spread across three copies is a rule that
 * holds until somebody edits two of them.
 */
import { LIVELINESS } from './config';

/**
 * `liveliness` (0.35–1) as warmth (0–1).
 *
 * Clamped at both ends, so a wire value outside the range cannot push anything
 * below its floor. **0 is the floor, not "off"** — see `atLeast` below.
 */
export function livelinessWarmth(liveliness: number): number {
  if (!Number.isFinite(liveliness)) return 0;
  const span = LIVELINESS.max - LIVELINESS.min;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (liveliness - LIVELINESS.min) / span));
}

/**
 * Scale something from a floor up to its full value.
 *
 * The floor is what keeps this additive: at the quietest an island still has
 * `floor` of whatever this is — 40 % of its animals, a quarter of its motes —
 * and at the liveliest it has all of it. Nothing here can ever return zero, and
 * nothing here can ever exceed 1.
 */
export function atLeast(floor: number, liveliness: number): number {
  const f = Math.min(1, Math.max(0, floor));
  return f + (1 - f) * livelinessWarmth(liveliness);
}

/**
 * A multiplier that only ever brightens: 1 at the quietest, `1 + gain` at the
 * liveliest. Never below 1 — that is the whole point.
 */
export function warmerBy(gain: number, liveliness: number): number {
  return 1 + Math.max(0, gain) * livelinessWarmth(liveliness);
}

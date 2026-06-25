/**
 * Points / XP system (BUILD_SPEC §6). One currency: Puntos (XP).
 *
 * Base point values are stored explicitly per activity in the seed (so each can
 * be tuned), but the grid below documents the canonical values and the bonus
 * rules. The authoritative awarding happens server-side in `complete_activity`;
 * these helpers are for display, estimates, and keeping the seed honest.
 */

export type Effort = 'easy' | 'medium' | 'hard';
export type Impact = 'low' | 'medium' | 'high';

/** Daily streak action base points by effort (§6.1). */
export const DAILY_POINTS: Record<Effort, number> = {
  easy: 50,
  medium: 100,
  hard: 175, // "hard-ish but still routine" → 150–200 band
};

/** Catalog base points grid by effort × impact (§6.1). */
export const CATALOG_POINTS: Record<Effort, Record<Impact, number>> = {
  easy: { low: 300, medium: 500, high: 750 },
  medium: { low: 500, medium: 750, high: 1000 },
  hard: { low: 1000, medium: 1500, high: 2000 },
};

/** Bonuses & multipliers (§6.2). */
export const BONUSES = {
  /** Photo-AI / peer verified completions grant +25% of base (rounded to 10). */
  verificationPct: 0.25,
  /** First-ever completion of a given catalog activity. */
  firstTimeFlat: 100,
  /** Completing the entire daily set. */
  dailySetFlat: 200,
} as const;

/** Streak multiplier for daily-action points (§6.2). Modest by design. */
export function streakMultiplier(currentStreak: number): number {
  if (currentStreak >= 100) return 1.3;
  if (currentStreak >= 30) return 1.2;
  if (currentStreak >= 7) return 1.1;
  return 1.0;
}

/** Round to the nearest 10 (used for the verification bonus). */
export function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}

export function verificationBonus(base: number): number {
  return roundTo10(base * BONUSES.verificationPct);
}

/** Format a point total with thousands separators (es-AR uses '.'). */
export function formatPoints(n: number): string {
  return new Intl.NumberFormat('es-AR').format(Math.max(0, Math.round(n)));
}

/** Compact form for big counters, e.g. 12.5k. */
export function formatPointsCompact(n: number): string {
  if (n < 10_000) return formatPoints(n);
  return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

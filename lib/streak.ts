/**
 * Streak helpers (BUILD_SPEC §13.2). The authoritative streak mutation happens
 * server-side in `complete_activity` + the nightly maintenance job; these are
 * client-side derivations for display (is it at risk? did I act today?).
 */
import { APP_TZ, localDate, localHour } from './utils/dates';

/** Did the user already keep the streak today? */
export function actedToday(lastStreakDate: string | null, tz: string = APP_TZ): boolean {
  if (!lastStreakDate) return false;
  return lastStreakDate === localDate(tz);
}

/**
 * The streak is "at risk" when the user has an active streak, hasn't done a
 * daily action today, and it's late enough in the day to warn (evening).
 */
export function isStreakAtRisk(
  lastStreakDate: string | null,
  currentStreak: number,
  tz: string = APP_TZ,
  riskHour = 18,
): boolean {
  if (currentStreak <= 0) return false;
  if (actedToday(lastStreakDate, tz)) return false;
  return localHour(tz) >= riskHour;
}

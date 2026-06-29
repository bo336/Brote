/**
 * Timezone-correct date helpers (BUILD_SPEC §13).
 * All daily/streak logic runs in America/Argentina/Buenos_Aires for v1. The
 * per-user `timezone` column exists so this can become per-user later — pass
 * a tz argument anywhere instead of relying on the default.
 */
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { differenceInCalendarDays } from 'date-fns';

export const APP_TZ = process.env.NEXT_PUBLIC_APP_TZ || 'America/Argentina/Buenos_Aires';

/** The user-local calendar date (YYYY-MM-DD) for `now`, in the given tz. */
export function localDate(tz: string = APP_TZ, now: Date = new Date()): string {
  return formatInTimeZone(now, tz, 'yyyy-MM-dd');
}

/** "Yesterday" relative to the local day, as YYYY-MM-DD. */
export function localYesterday(tz: string = APP_TZ, now: Date = new Date()): string {
  const zoned = toZonedTime(now, tz);
  zoned.setDate(zoned.getDate() - 1);
  return formatInTimeZone(zoned, tz, 'yyyy-MM-dd');
}

/** Calendar-day difference between two YYYY-MM-DD strings (a - b). */
export function dayDiff(a: string, b: string): number {
  return differenceInCalendarDays(new Date(a + 'T00:00:00'), new Date(b + 'T00:00:00'));
}

/** Local hour (0-23) in the given tz — used for greetings + streak-risk timing. */
export function localHour(tz: string = APP_TZ, now: Date = new Date()): number {
  return Number(formatInTimeZone(now, tz, 'H'));
}

/** Is it night locally? (used for Pip + the day/night world cycle) */
export function isNight(tz: string = APP_TZ, now: Date = new Date()): boolean {
  const h = localHour(tz, now);
  return h >= 20 || h < 6;
}

/** A 0..1 value representing time-of-day progress (for the world's sky). */
export function dayProgress(tz: string = APP_TZ, now: Date = new Date()): number {
  const minutes = Number(formatInTimeZone(now, tz, 'H')) * 60 + Number(formatInTimeZone(now, tz, 'm'));
  return minutes / 1440;
}

/** Greeting key based on local time. */
export function greetingKey(tz: string = APP_TZ, now: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = localHour(tz, now);
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 19) return 'afternoon';
  return 'evening';
}

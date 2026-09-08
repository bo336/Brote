/**
 * The narrative drip — four voices, one beat a day.
 *
 * `14-CONTENT.md` §6: four recurring visitors, ≤25 words each, at least ninety
 * beats so the cycle lasts three months. Ninety-six ship, twenty-four apiece.
 *
 * **Hard rule: no character is ever disappointed in the player.** Nobody
 * comments on absence, nobody nags, nobody mentions a streak. Every beat is
 * somebody telling you a thing they find interesting, and
 * `__tests__/cast.test.ts` is what keeps it that way when the ninety-seventh
 * gets written.
 *
 * The copy lives in `messages/es.json` under `mundo.cast`, like every other
 * string. This is only the schedule.
 */

export type CastId = 'ines' | 'tuco' | 'mila' | 'don_beto';

/** In the order they take their turns. One per day, rotating. */
export const CAST: readonly CastId[] = ['ines', 'tuco', 'mila', 'don_beto'];

/** How many beats each of them has. Kept here so the tests can check the copy. */
export const BEATS_PER_CHARACTER = 24;

/** Ninety-six days before anyone repeats themselves — a season and a bit. */
export const TOTAL_BEATS = CAST.length * BEATS_PER_CHARACTER;

export interface Beat {
  who: CastId;
  /** `cast.<who>.<n>` — relative to the `mundo` namespace, like every label. */
  key: string;
  nameKey: string;
}

/**
 * Whole days since the epoch, from a `YYYY-MM-DD`.
 *
 * The date comes from the server's timezone helper, never from a local clock:
 * everyone in Buenos Aires should hear the same person on the same day.
 */
export function dayIndex(localDate: string): number {
  const t = Date.parse(`${localDate}T00:00:00Z`);
  return Number.isFinite(t) ? Math.floor(t / 86_400_000) : 0;
}

/**
 * Whose turn it is and what they say.
 *
 * Round-robin across the cast, and **in order within each character** — the
 * beats are written as a drip, not a shuffle, so Mila's questions build on
 * Inés's answers. After ninety-six days it starts again, which is long enough
 * that the second pass reads as a season rather than a loop.
 */
export function beatForDay(localDate: string): Beat {
  const day = dayIndex(localDate);
  const positive = ((day % TOTAL_BEATS) + TOTAL_BEATS) % TOTAL_BEATS;
  const who = CAST[positive % CAST.length]!;
  const n = Math.floor(positive / CAST.length) % BEATS_PER_CHARACTER;
  return { who, key: `cast.${who}.${n}`, nameKey: `cast.${who}.name` };
}

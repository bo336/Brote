/**
 * The line the island greets you with.
 *
 * `14-CONTENT.md` §Return gives five, and one instruction that matters more
 * than the copy: **never** *"tu isla te extraña"*, *"volviste"*, *"hace {n} días
 * que no venís"*, or anything loss-framed. Line 5 exists "precisely so that
 * 'nothing happened' has a warm phrasing".
 *
 * The rule this module adds is that the line has to be **true**. Saying the
 * jasmine bloomed when nothing bloomed is a small lie, and a game whose whole
 * premise is that the world reflects something real cannot afford small lies
 * about the world. So each line has a condition, they are checked in order of
 * how specific they are, and line 5 catches everything else — which is not a
 * failure state, it is an accurate and kind description of a quiet week.
 */
import { LIVELINESS, MATURATION } from './config';

export type ReturnLine = 1 | 2 | 3 | 4 | 5;

export interface ReturnState {
  /** At least one foraging node is carrying something right now. */
  ripeForage: boolean;
  /** How grown the island is on its own, 0..1 (`growth.ts`). */
  matured: number;
  /** 0.35..1, from the streak. */
  liveliness: number;
  /** Does the island have a river yet? Line 4 is about one. */
  hasRiver: boolean;
}

/** How much idle growth counts as "something bloomed". OURS. */
const BLOOMED = 0.25;
/** Above this, the island is busy enough that a bird coming back is true. */
const LIVELY = 0.7;

/**
 * Which of the five to show.
 *
 * Ordered most specific first: something you can go and pick beats something
 * you can go and look at, which beats a general observation about the water.
 */
export function returnLine(state: ReturnState): ReturnLine {
  if (state.ripeForage) return 3;
  if (state.matured >= BLOOMED) return 1;
  if (state.liveliness >= LIVELY) return 2;
  if (state.hasRiver) return 4;
  return 5;
}

/** The i18n key, relative to the `mundo` namespace like every other label. */
export function returnLineKey(line: ReturnLine): string {
  return `return.${line}`;
}

/**
 * A sanity bound the tests lean on: liveliness never leaves its own range, so
 * the "lively" threshold has to sit inside it or line 2 is unreachable.
 */
export const LIVELY_THRESHOLD = LIVELY;
export const BLOOMED_THRESHOLD = Math.min(1, BLOOMED);
export const MATURATION_DAYS = MATURATION.daysToFull;
export const LIVELINESS_RANGE = [LIVELINESS.min, LIVELINESS.max] as const;

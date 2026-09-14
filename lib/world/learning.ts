/**
 * The learning budget — "present but not overdone" (`12-LEARNING.md` §2).
 *
 * The table in §2 is a set of hard caps, and the reason they are hard is in §1:
 * **a player who never engages with a single learning beat must still have a
 * complete, satisfying game.** So learning is something the world offers and
 * never something it requires, and every number below exists to stop it
 * becoming the session.
 *
 * | Constraint | Value |
 * | learning as a share of session time | ≤ 10% |
 * | consecutive learning beats | never two in a row |
 * | spaced-repetition items surfaced | ≤ 5 per day |
 * | wilting objects visible at once | ≤ 3 |
 * | micro-fact length | 12-18 words |
 * | learning that blocks world progression | **zero, ever** |
 *
 * This module is the gate. It is pure so the caps are testable rather than
 * reviewable — the failure mode for a budget is that it quietly stops being
 * enforced, and nobody notices because nothing breaks.
 */
import { LEARNING } from './config';

/** What the gate needs to know about the session so far. */
export interface LearningState {
  /** Milliseconds since the session started. */
  sessionMs: number;
  /** Milliseconds already spent showing learning beats. */
  learningMs: number;
  /** Was the last thing shown a learning beat? */
  lastWasLearning: boolean;
  /** Review items surfaced today, across sessions. */
  reviewsToday: number;
}

/** Why a beat was not shown. Never surfaced to the player — this is for tests. */
export type Refusal = 'back_to_back' | 'over_share' | 'daily_cap' | null;

/**
 * May a micro-fact be shown right now?
 *
 * **Never two in a row** is checked first because it is the one a player would
 * actually feel: two facts back to back is a lecture, whatever the percentages
 * say. The share cap is measured against elapsed session time, so an early
 * session — where the share is noisy — gets a grace window rather than a
 * refusal on the first beat.
 */
export function mayShowFact(state: LearningState, factMs: number): Refusal {
  if (state.lastWasLearning) return 'back_to_back';
  const elapsed = Math.max(state.sessionMs, GRACE_MS);
  if ((state.learningMs + factMs) / elapsed > LEARNING.sessionShareMax) return 'over_share';
  return null;
}

/**
 * The first minute of a session, during which the share cap is measured against
 * a minute rather than against however long the player has been standing there.
 *
 * Without it the very first fact is always over budget — one beat divided by
 * three seconds of session is 100% — and the honest reading of "≤10% of session
 * time" is about a session, not about its first breath. OURS.
 */
const GRACE_MS = 60_000;

/** May another spaced-repetition item be surfaced today? */
export function mayShowReview(state: LearningState): Refusal {
  if (state.lastWasLearning) return 'back_to_back';
  if (state.reviewsToday >= LEARNING.reviewItemsPerDay) return 'daily_cap';
  return null;
}

/**
 * How many wilting objects to show, out of however many are actually due.
 *
 * "≤3 visible at once, however many are due" (§3.3). The island must never look
 * like a to-do list, and the cap is what guarantees that a player who has been
 * away for a month comes back to three quiet plants rather than to a field of
 * them.
 */
export function wiltingVisible(due: number): number {
  return Math.max(0, Math.min(LEARNING.wiltingVisibleMax, Math.floor(due)));
}

/**
 * Has a wilting object recovered on its own?
 *
 * "Recovers on its own after a week regardless of player action" (§3.3). Decay
 * is cosmetic and reversible only: nothing wilting ever dies, disappears or
 * blocks anything, and ignoring it entirely is a complete and valid way to play.
 */
export function hasSelfRecovered(wiltedAtMs: number, nowMs: number): boolean {
  if (!Number.isFinite(wiltedAtMs) || wiltedAtMs <= 0) return true;
  const days = (nowMs - wiltedAtMs) / 86_400_000;
  return days >= LEARNING.wiltingSelfRecoverDays;
}

/**
 * The next fact to show from a pool, or null when they have all been seen.
 *
 * "The same fact is never shown twice" (§3.1). Once the pool is exhausted the
 * answer is nothing at all rather than a repeat — a fact somebody has already
 * read is not a fact, it is filler.
 */
export function nextFact(pool: readonly string[], seen: ReadonlySet<string>): string | null {
  for (const key of pool) if (!seen.has(key)) return key;
  return null;
}

/** Word count, for the length caps the copy tests enforce. */
export function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export { LEARNING };

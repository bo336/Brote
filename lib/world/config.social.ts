/**
 * The social half of the tunables: visiting, gifting, and the first session.
 *
 * Re-exported from `config.ts`, which stays the single import path for every
 * tunable in the game (`01-RULES.md` §3.9) while no file exceeds 400 lines
 * (§3.2). The seam is real: everything here is about two people rather than
 * one, and nothing in the rest of the config is.
 */

/**
 * Visiting somebody else's island (`11-GAME-LOOP.md` §8).
 *
 * One sticker per island per day is the whole rate limit. It is low on purpose:
 * a visit is meant to be a small kindness, and anything you can do fifty times
 * stops reading as one.
 */
export const VISIT = {
  stickersPerDay: 1, // per host, per visitor, per day — the server agrees
  stickerAheadM: 1.6, // dropped in front of the visitor, not under them
  /** How long a sticker stays on the island before it fades away. */
  lifetimeDays: 30,
} as const;

/**
 * Regalar (`11-GAME-LOOP.md` §8). One a day, per friend, and a gift is a copy:
 * the giver loses nothing, which is the only version of this that is a
 * kindness rather than a trade.
 */
export const GIFT = {
  perFriendPerDay: 1,
} as const;

/**
 * The first three minutes (`11-GAME-LOOP.md` §7).
 *
 * `maxTier` is a guard rather than a rule: somebody who reached rank 3 in the
 * app before ever opening the world does not need to be told how to walk.
 */
export const FIRST_RUN = {
  maxTier: 2,
  moveDistanceM: 6, // enough to have actually gone somewhere
  plantAheadM: 5.5, // the marked spot, in plain sight from the spawn
  /** How long the ghosted promise stays up before it can be dismissed. */
  promiseMinS: 2,
} as const;

/**
 * The shared streak (`11-GAME-LOOP.md` §8).
 *
 * `restDays` is the whole of anti-pattern 7's requirement made concrete: that
 * many flat days are forgiven, silently and without asking, before the count
 * stops. The server holds the same number.
 */
export const FRIEND_STREAK = {
  restDays: 2,
  minVisibleDays: 3, // below this it is not a streak, it is two days
  tiers: [7, 14, 30, 50] as const,
} as const;

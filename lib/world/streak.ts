/**
 * The shared streak: "los dos, hoy".
 *
 * `11-GAME-LOOP.md` §8. It is a number between exactly two people and it is
 * never a ranking — there is no list, no order and no way to see anybody's but
 * the person whose island you are standing on.
 *
 * **Anti-pattern 7 forbids streaks with no free rest days, not streaks**
 * (`04-RESEARCH-DESIGN.md` §9). So this one has them, they are spent
 * automatically, and nobody is ever asked or told. And because it is derived
 * from real completions rather than stored, there is no counter to push: the
 * only way to move it is for both people to actually do something.
 */
import { FRIEND_STREAK } from './config';

export interface FriendStreak {
  days: number;
  /** Rest days already spent. Never shown — it exists so a test can see it. */
  restUsed: number;
}

/**
 * Which milestone a streak has passed, or 0. The tiers are 7/14/30/50
 * (`11-GAME-LOOP.md` §8); they change what the line says and nothing else.
 * A tier is never a reward, because a reward would make this worth farming.
 */
export function streakTier(days: number): number {
  let tier = 0;
  for (const at of FRIEND_STREAK.tiers) if (days >= at) tier = at;
  return tier;
}

/** Below this it is not a streak yet, it is two days, and saying so is noise. */
export function streakVisible(days: number): boolean {
  return days >= FRIEND_STREAK.minVisibleDays;
}

export function parseFriendStreak(raw: unknown): FriendStreak {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const int = (v: unknown) => Math.max(0, Math.trunc(Number(v) || 0));
  return { days: int(o.days), restUsed: int(o.restUsed) };
}

export { FRIEND_STREAK };

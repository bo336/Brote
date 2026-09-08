/**
 * Regalar: one item per friend per day, from the set you already own.
 *
 * `11-GAME-LOOP.md` §8. Three properties make this a kindness rather than an
 * economy, and all three are here rather than in the UI:
 *
 *  1. **A gift is a copy, never a transfer.** You lose nothing. A game that
 *     charges you for being generous teaches the opposite of what this one is
 *     for, and it is also how gifting turns into trading, which turns into a
 *     market, which turns into somebody selling accounts.
 *  2. **It cannot be farmed.** One per friend per day, enforced by a unique
 *     index and repeated here so the button knows before the round trip.
 *  3. **It buys nothing that matters.** Cosmetics only — never semillas, never
 *     XP, never rank. `no-xp.test.ts` greps for the second and third.
 */
import { GIFT } from './config';

/** One thing you could give: its slug, and what the catalogue calls it. */
export interface Giftable {
  slug: string;
  name: string;
}

/** What the picker has to work with. Nothing here describes the other person. */
export interface GiftOptions {
  /** What the visitor owns that the host does not. Server-computed. */
  slugs: Giftable[];
  sentToday: number;
}

/** A gift that arrived while you were away. Read once, on the way in. */
export interface ArrivedGift {
  slug: string;
  name: string;
  from: string;
}

export function maySendGift(sentToday: number): boolean {
  return sentToday < GIFT.perFriendPerDay;
}

/**
 * Why a gift was refused, as something the screen can say.
 *
 * `not_friends` is the only one worth a sentence — it is the one a person can
 * do something about. The rest are states the button should already have
 * prevented, so they read as "not now" and nothing more.
 */
export type GiftRefusal =
  | 'not_found' | 'not_friends' | 'not_owned' | 'already_has' | 'already_today' | 'error';

export function refusalOf(data: unknown, error: unknown): GiftRefusal | null {
  if (error) return 'error';
  const o = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  if (o.ok === true) return null;
  const reasons: GiftRefusal[] = [
    'not_found', 'not_friends', 'not_owned', 'already_has', 'already_today',
  ];
  const said = typeof o.reason === 'string' ? o.reason : '';
  return (reasons as string[]).includes(said) ? (said as GiftRefusal) : 'error';
}

const asRow = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

export function parseGiftOptions(raw: unknown): GiftOptions {
  const o = asRow(raw);
  return {
    slugs: (Array.isArray(o.slugs) ? o.slugs : [])
      .map((v) => {
        const row = asRow(v);
        return typeof row.slug === 'string'
          ? { slug: row.slug, name: typeof row.name === 'string' ? row.name : row.slug }
          : null;
      })
      .filter((g): g is Giftable => g !== null),
    sentToday: Math.max(0, Math.trunc(Number(o.sentToday) || 0)),
  };
}

/** `world_gifts_unseen()`'s blob. Anything unrecognised is simply not a gift. */
export function parseArrivedGifts(raw: unknown): ArrivedGift[] {
  const list = Array.isArray(asRow(raw).gifts) ? (asRow(raw).gifts as unknown[]) : [];
  return list
    .map((v) => {
      const row = asRow(v);
      if (typeof row.slug !== 'string') return null;
      return {
        slug: row.slug,
        name: typeof row.name === 'string' ? row.name : row.slug,
        from: typeof row.from === 'string' ? row.from : '',
      };
    })
    .filter((g): g is ArrivedGift => g !== null);
}

export { GIFT };

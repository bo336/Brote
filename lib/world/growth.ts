/**
 * What wall-clock time does to the island while nobody is playing.
 *
 * Two things, and they are the same idea (`11-GAME-LOOP.md` §3.5 and §3.6):
 *
 *  - **Foraging** — berries, seeds and mushrooms respawn on staggered 4-8 hour
 *    timers. This is "the appointment loop": one real action, two app opens.
 *  - **Idle maturation** — trees, ponds and flowers grow on wall-clock time,
 *    independent of play, visible on return. **Supplementary, never the
 *    session**: "log in, collect, log out" is a dead game
 *    (`04-RESEARCH-DESIGN.md` §2), so this never becomes a reason to open the
 *    app, only something you notice once you have.
 *
 * **Both are derived, not stored.** A node's ripeness is a pure function of its
 * id, the island's seed and the clock, so there is no table, no migration, and
 * no state to disagree with itself across devices. The cost is that a player
 * who clears their site data sees a node offer itself again — which is bounded
 * by the thing that actually protects the economy: `world_daily_chore` caps
 * foraging at eight a day server-side and writes every award to the ledger. The
 * timers are texture; the cap is the rule.
 */
import { FORAGE_RESPAWN, MATURATION } from './config';
import { hashInt, mulberry32 } from './rng';

const HOUR_MS = 3_600_000;

/**
 * One node's cycle, in hours. Drawn per node from the island's seed, so a
 * player's six nodes come back at six different times rather than all at once
 * — which is the whole point of "staggered".
 */
export function forageCycleHours(nodeId: string, seed: number): number {
  const rng = mulberry32(hashInt(`forage:${seed}:${nodeId}`));
  const { minHours, maxHours } = FORAGE_RESPAWN;
  return minHours + rng() * (maxHours - minHours);
}

/**
 * Is this node carrying anything right now?
 *
 * Ripe for the first half of its cycle and empty for the second, with a phase
 * offset of its own — so at any moment roughly half the nodes have something
 * and the other half are a reason to come back later.
 */
export function forageRipe(nodeId: string, seed: number, nowMs: number): boolean {
  return foragePhase(nodeId, seed, nowMs) < 0.5;
}

/** Where in its cycle a node is, 0..1. Exported for the "comes back in" copy. */
export function foragePhase(nodeId: string, seed: number, nowMs: number): number {
  const cycleMs = forageCycleHours(nodeId, seed) * HOUR_MS;
  const rng = mulberry32(hashInt(`forage-phase:${seed}:${nodeId}`));
  const offset = rng() * cycleMs;
  const t = ((nowMs + offset) % cycleMs + cycleMs) % cycleMs;
  return t / cycleMs;
}

/** Hours until an empty node is carrying again. Zero when it already is. */
export function forageReturnsInHours(nodeId: string, seed: number, nowMs: number): number {
  const phase = foragePhase(nodeId, seed, nowMs);
  if (phase < 0.5) return 0;
  return (1 - phase) * forageCycleHours(nodeId, seed);
}

/**
 * How grown the island is on its own, 0..1.
 *
 * Saturating over `MATURATION.daysToFull`, so the difference between day one
 * and the end of the first week is visible and the difference between month six
 * and month seven is not. **It only ever adds** — the same rule `liveliness`
 * lives under: nothing here can shrink, wilt or grey anything.
 *
 * `sinceMs` is the island's own epoch, not the player's last visit. Tying it to
 * absence would make going away the thing that grows a tree, which is the
 * opposite of what the game is for.
 */
export function maturation(sinceMs: number, nowMs: number): number {
  if (!Number.isFinite(sinceMs) || !Number.isFinite(nowMs)) return 0;
  const days = (nowMs - sinceMs) / (24 * HOUR_MS);
  if (days <= 0) return 0;
  return Math.min(1, days / MATURATION.daysToFull);
}

/**
 * The scale a matured thing is drawn at.
 *
 * A tenth over a week is a lot at a glance and nothing to a collider — big
 * enough to notice on return, small enough that nothing you walked around
 * yesterday blocks you today.
 */
export function maturedScale(base: number, matured: number): number {
  return base * (1 + MATURATION.scaleGain * Math.min(1, Math.max(0, matured)));
}

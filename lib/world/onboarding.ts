/**
 * The first three minutes, as a state machine.
 *
 * `11-GAME-LOOP.md` §7 writes the beat sheet out to the second. Four of its six
 * beats happen inside the world and are here; the two that do not are recorded
 * as deviations in `22-PROGRESS.md` — they are about the order of *signing up*,
 * which is an app-architecture decision and not a world one.
 *
 * The shape that matters is that **nothing here asks for anything**. The first
 * beat is movement, the second is planting, and the only question in the whole
 * sequence — "¿qué querés cuidar primero?" — has three answers and all three
 * put something on the island straight away. A first session that opens with a
 * form is a first session most people do not finish.
 */
import { FIRST_RUN } from './config';
import type { PropId } from './types';

export type BeatId = 'move' | 'plant' | 'care' | 'promise' | 'act';

/** In order. The sequence never branches and never goes backwards. */
export const BEATS: readonly BeatId[] = ['move', 'plant', 'care', 'promise', 'act'];

/**
 * The one question, and what each answer puts down.
 *
 * All three are tier-1 props, so the object is theirs to keep and to move: a
 * first session that gives you something and then takes it back when the
 * tutorial ends has taught you not to trust the next thing it gives you.
 */
export const CARE_CHIPS = ['agua', 'residuos', 'transporte'] as const;
export type CareChip = (typeof CARE_CHIPS)[number];

const CHIP_PROP: Record<CareChip, PropId> = {
  agua: 'mundo_comedero', // a bird feeder is water put out for something else
  residuos: 'mundo_banco', // made of what somebody did not throw away
  transporte: 'mundo_hamaca', // the thing you walk to instead of driving past
};

export function propForChip(chip: CareChip): PropId {
  return CHIP_PROP[chip];
}

/** Where the marked planting spot goes: ahead of the spawn, in plain sight. */
export function plantSpot(spawnX: number, spawnZ: number): [number, number] {
  return [spawnX + FIRST_RUN.plantAheadM, spawnZ];
}

/**
 * Has this player's first session happened?
 *
 * `onboardedAt` is a column on `user_world`, not a browser key: a tutorial that
 * replays on a second device is a tutorial that reads as a bug, and
 * `01-RULES.md` §2 does not allow authoritative state in `localStorage`.
 */
export function needsFirstRun(onboardedAt: number, tier: number): boolean {
  return onboardedAt === 0 && tier <= FIRST_RUN.maxTier;
}

/** The next beat, or `null` when the sequence is over. */
export function nextBeat(current: BeatId): BeatId | null {
  const i = BEATS.indexOf(current);
  return i < 0 || i === BEATS.length - 1 ? null : BEATS[i + 1]!;
}

/**
 * Has the move beat been satisfied? Distance walked, not time elapsed — a beat
 * that ends on a timer ends while somebody is still reading it.
 */
export function hasMoved(distanceM: number): boolean {
  return distanceM >= FIRST_RUN.moveDistanceM;
}

export { FIRST_RUN };

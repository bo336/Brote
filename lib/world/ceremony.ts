/**
 * The tier-up ceremony, as data.
 *
 * `08-WORLD-AND-PROGRESSION.md` §5 calls it "the most important 40 seconds in
 * the product", and it is a scripted sequence rather than a toast. This module
 * is the script: which beats play, for how long, what arrives, which verb is
 * taught and which line ties it to something the player actually did.
 *
 * Pure, because the parts worth getting right are decisions rather than
 * animation — that the beats are in the right order, that a skip still produces
 * the card, that reduced motion drops the camera moves and not the content,
 * and that a tier which changes nothing physical does not sit on a held shot
 * waiting for an event that never comes.
 */
import { CEREMONY, CEREMONY_ARRIVAL_S } from './config';
import { unlocksFor } from './progression';
import type { RegionId, VerbId } from './types';

/**
 * The six physical arrivals. Each is an animation over geometry that exists.
 *
 * Keyed off the durations rather than declared twice: an arrival with no beat
 * length is an arrival that plays for zero seconds.
 */
export type ArrivalId = keyof typeof CEREMONY_ARRIVAL_S;

export type BeatId =
  | 'camera'
  | 'before'
  | 'arrival'
  | 'title'
  | 'verb'
  | 'share'
  | 'return';

export interface Beat {
  id: BeatId;
  /** Seconds. `0` means "as long as it takes", used by the capture. */
  seconds: number;
}

/**
 * Which tier brings which arrival.
 *
 * Six of the eleven change the island physically. The rest change what you can
 * do, or what grows — real, but not something the camera can watch happen, and
 * holding an orbit on nothing for twelve seconds is worse than not holding it.
 */
export const ARRIVALS: Partial<Record<number, ArrivalId>> = {
  3: 'flores',
  4: 'arbol',
  7: 'rio',
  8: 'monte',
  9: 'nieve',
  10: 'islote',
};

/** Where the camera looks during the arrival. */
const ARRIVAL_REGION: Record<ArrivalId, RegionId> = {
  flores: 'jardin',
  arbol: 'arboleda',
  rio: 'rio',
  monte: 'monte',
  nieve: 'cumbre',
  islote: 'islote',
};

export interface CeremonyScript {
  tier: number;
  arrival: ArrivalId | null;
  /** Where to frame. Falls back to the region the tier unlocks, or the spawn. */
  region: RegionId;
  /** The verbs this tier grants. The first is the one beat 5 teaches. */
  verbs: VerbId[];
  beats: Beat[];
  /** `mundo.tierup.t<N>` — the line tying the change to the real cause. */
  lineKey: string;
  totalSeconds: number;
}

/**
 * Build the script for one tier.
 *
 * `reducedMotion` does not shorten the ceremony and does not remove a beat. It
 * removes the *camera moves* and the screen-filling particles; the content is
 * the same content, cut to rather than swept to (§5, and XAG 117). Somebody who
 * needs reduced motion is not somebody who deserves less of the game.
 */
export function ceremonyFor(tier: number, opts: { reducedMotion?: boolean } = {}): CeremonyScript {
  const unlock = unlocksFor(tier);
  const arrival = ARRIVALS[unlock.tier] ?? null;
  const verbs = unlock.verbs;
  const region: RegionId = arrival
    ? ARRIVAL_REGION[arrival]
    : (unlock.regions[0] ?? 'claro');

  const beats: Beat[] = [
    // A cut instead of a lift, but the beat still exists: the world still has
    // to stop and look at the thing before it changes.
    { id: 'camera', seconds: opts.reducedMotion ? 0.4 : CEREMONY.takeCameraS },
    // The "before" is captured in one silent frame, so it takes no time of its
    // own. It is a beat because the order matters: after the framing, before
    // anything moves.
    { id: 'before', seconds: 0 },
  ];

  if (arrival) beats.push({ id: 'arrival', seconds: CEREMONY_ARRIVAL_S[arrival] });

  beats.push({ id: 'title', seconds: CEREMONY.titleCardS });
  // Nothing to teach on a tier that grants no verb — and a card reading
  // "Ahora podés" with nothing after it is worse than no card.
  if (verbs.length > 0) beats.push({ id: 'verb', seconds: CEREMONY.newVerbS });
  beats.push({ id: 'share', seconds: CEREMONY.shareCardS });
  beats.push({ id: 'return', seconds: 0 });

  return {
    tier: unlock.tier,
    arrival,
    region,
    verbs,
    beats,
    lineKey: `t${unlock.tier}`,
    totalSeconds: beats.reduce((sum, b) => sum + b.seconds, 0),
  };
}

/** Which beat a script is in at `elapsed` seconds, and how far through it. */
export function beatAt(script: CeremonyScript, elapsed: number): { beat: Beat; progress: number; index: number } {
  let t = Math.max(0, elapsed);
  for (let i = 0; i < script.beats.length; i++) {
    const beat = script.beats[i]!;
    if (beat.seconds <= 0) {
      // Zero-length beats fire once and hand straight on.
      if (t <= 0) return { beat, progress: 1, index: i };
      continue;
    }
    if (t < beat.seconds) return { beat, progress: t / beat.seconds, index: i };
    t -= beat.seconds;
  }
  const last = script.beats[script.beats.length - 1]!;
  return { beat: last, progress: 1, index: script.beats.length - 1 };
}

/**
 * Skipping jumps to the end — **but the card is still made** (§5). Losing the
 * before-and-after because somebody was in a hurry is losing the one artefact
 * the ceremony produces.
 */
export function skipTo(script: CeremonyScript): number {
  return script.totalSeconds;
}

/** Every tier reached but not yet celebrated, oldest first. */
export function pendingCeremonies(celebrated: number, tier: number): number[] {
  const out: number[] = [];
  for (let t = Math.max(1, celebrated + 1); t <= tier; t++) out.push(t);
  return out;
}

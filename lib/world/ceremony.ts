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
 * The two things worth stopping the world for.
 *
 * A rank-up is the headline; a world completion happens every 40–360 actions
 * and "carries the pacing between rank tiers" (§7), so it gets a much smaller
 * moment — the same beats, a fifth of the length, and no verb to teach.
 */
export type CeremonyKind = 'tier' | 'world';

/** One queued celebration: a rank tier, or a world index that has completed. */
export interface CeremonyRequest {
  kind: CeremonyKind;
  n: number;
}

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
  kind: CeremonyKind;
  /** The rank tier, or — for a world completion — the world index. */
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
    kind: 'tier',
    tier: unlock.tier,
    arrival,
    region,
    verbs,
    beats,
    lineKey: `t${unlock.tier}`,
    totalSeconds: beats.reduce((sum, b) => sum + b.seconds, 0),
  };
}

/**
 * The world-completion ceremony (§7): "the palette cross-fades, the sky shifts,
 * one new species appears, a card is filed in the Bitácora".
 *
 * Eight seconds, and deliberately not a small tier-up. It shares the beat
 * machinery so there is one clock, one skip and one card path in the codebase,
 * but it teaches nothing and grants no verb — a world completing is a change of
 * light, not a change of what you can do.
 */
export function worldCeremonyFor(
  worldIndex: number,
  opts: { reducedMotion?: boolean } = {},
): CeremonyScript {
  const camera = opts.reducedMotion ? 0.3 : CEREMONY.worldCameraS;
  const beats: Beat[] = [
    { id: 'camera', seconds: camera },
    { id: 'before', seconds: 0 },
    // The eight seconds §7 budgets cover the sequence — the lift, the wash and
    // the card that names the world. What follows is the same offer the tier-up
    // makes, and it waits the same way.
    { id: 'arrival', seconds: Math.max(0, CEREMONY.worldCompleteS - camera - CEREMONY.worldTitleS) },
    { id: 'title', seconds: CEREMONY.worldTitleS },
    // **Never zero.** `beatAt` can only return a zero-length beat at t = 0, so a
    // share beat with no duration is a share beat the clock walks straight
    // past — the ceremony would hold on the title card and the card the whole
    // thing exists to produce would never appear.
    { id: 'share', seconds: CEREMONY.shareCardS },
    { id: 'return', seconds: 0 },
  ];
  return {
    kind: 'world',
    tier: worldIndex,
    arrival: null,
    region: 'claro',
    verbs: [],
    beats,
    lineKey: 'world',
    totalSeconds: beats.reduce((sum, b) => sum + b.seconds, 0),
  };
}

/** Build whichever script a queued request asks for. */
export function scriptFor(
  request: CeremonyRequest,
  opts: { reducedMotion?: boolean } = {},
): CeremonyScript {
  return request.kind === 'world'
    ? worldCeremonyFor(request.n, opts)
    : ceremonyFor(request.n, opts);
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
 * Where the clock parks: inside the share beat, the last one with a duration.
 *
 * Small enough to be inside that beat, large enough that no accumulation of
 * float error can push it past. One definition, used by the runner every frame
 * and by `skipTo` — two would drift, and the failure mode is the ceremony
 * holding on the wrong card forever.
 */
export const HOLD_EPSILON = 0.001;

/** Where the clock stops. See `HOLD_EPSILON`. */
export function holdPoint(script: CeremonyScript): number {
  return script.totalSeconds - HOLD_EPSILON;
}

/**
 * Skipping jumps straight to the card — **which is still made** (§5). Losing
 * the before-and-after because somebody was in a hurry is losing the one
 * artefact the ceremony produces, so the skip lands ON it rather than past it.
 */
export function skipTo(script: CeremonyScript): number {
  return holdPoint(script);
}

/**
 * Everything owed, in the order it should play.
 *
 * Rank tiers first, oldest first, then the world completion. A world completes
 * far more often than a rank changes, so when both are owed the rank is the one
 * somebody came back for — and an eight-second coda after it lands better than
 * an eight-second delay before it.
 */
export function queueFor(
  celebratedTier: number,
  tier: number,
  celebratedWorld: number,
  worldIndex: number,
): CeremonyRequest[] {
  const out: CeremonyRequest[] = pendingCeremonies(celebratedTier, tier)
    .map((n) => ({ kind: 'tier' as const, n }));
  // Only the world they are in now. Somebody who completed four worlds while
  // away gets one ceremony, not four — the island only looks like the last one.
  if (worldIndex > celebratedWorld && worldIndex > 1) out.push({ kind: 'world', n: worldIndex });
  return out;
}

/** Every tier reached but not yet celebrated, oldest first. */
export function pendingCeremonies(celebrated: number, tier: number): number[] {
  const out: number[] = [];
  for (let t = Math.max(1, celebrated + 1); t <= tier; t++) out.push(t);
  return out;
}

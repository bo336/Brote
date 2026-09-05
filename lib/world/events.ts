/**
 * The six events (`14-CONTENT.md` §5).
 *
 * Bounded 2-5 minute scenarios with a beginning and an end. **At most one per
 * two days, never two in a row, always skippable, never blocking, failure never
 * punitive, nothing permanently lost** (`11-GAME-LOOP.md` §3.7).
 *
 * Selection is server-side and recorded in `world_daily.event_slug`; this module
 * is the pure decision the server and the client agree on.
 */
import { CRECIENTE, EVENT_MIN_GAP_DAYS, INCENDIO, NIDO, RESIDUOS, SEQUIA, VISITANTE } from './config';
import { mulberry32, hashInt } from './rng';
import type { EventId, FeatureId, RegionId, VerbId } from './types';

export interface EventDef {
  id: EventId;
  /** i18n key for the title. Copy lives in `messages/es.json`. */
  titleKey: string;
  region: RegionId;
  /** The tier that makes this event possible at all. */
  minTier: number;
  /** A feature the event needs to exist in the world, if any. */
  requiresFeature?: FeatureId;
  /** The verbs it leans on. Never a verb the player does not hold. */
  verbs: VerbId[];
  /** Seconds of in-game time, roughly. */
  durationS: number;
  /** Semillas on a clean run, and on a run with a wrong choice. Never zero. */
  payout: number;
  payoutImperfect: number;
  /** Does it carry a learning beat, and how heavy (`12-LEARNING.md` §3.2)? */
  learning: 'none' | 'light' | 'flagship';
}

export const EVENTS: EventDef[] = [
  {
    id: 'incendio',
    titleKey: 'mundo.event.incendio',
    region: 'arboleda',
    minTier: 4,
    verbs: ['water', 'walk'],
    durationS: INCENDIO.durationS,
    payout: INCENDIO.payout,
    payoutImperfect: INCENDIO.payoutImperfect,
    learning: 'flagship',
  },
  {
    id: 'creciente',
    titleKey: 'mundo.event.creciente',
    region: 'rio',
    minTier: 7,
    requiresFeature: 'river',
    verbs: ['walk', 'swim'],
    durationS: CRECIENTE.durationS,
    payout: CRECIENTE.payout,
    payoutImperfect: CRECIENTE.payout,
    learning: 'light',
  },
  {
    id: 'nido',
    titleKey: 'mundo.event.nido',
    region: 'arboleda',
    minTier: 5,
    requiresFeature: 'nest',
    verbs: ['walk', 'climb'],
    durationS: 150,
    payout: NIDO.payout,
    payoutImperfect: NIDO.payout,
    learning: 'none',
  },
  {
    id: 'residuos',
    titleKey: 'mundo.event.residuos',
    region: 'islote',
    minTier: 10,
    requiresFeature: 'islet',
    verbs: ['walk'],
    durationS: 240,
    payout: RESIDUOS.payout,
    payoutImperfect: RESIDUOS.payout,
    learning: 'flagship',
  },
  {
    id: 'sequia',
    titleKey: 'mundo.event.sequia',
    region: 'jardin',
    minTier: 3,
    verbs: ['water'],
    durationS: SEQUIA.days * 60,
    payout: SEQUIA.payout,
    payoutImperfect: SEQUIA.payout,
    learning: 'light',
  },
  {
    id: 'visitante',
    titleKey: 'mundo.event.visitante',
    region: 'claro',
    minTier: 2,
    verbs: ['walk', 'log', 'rest'],
    durationS: 180,
    payout: VISITANTE.payout,
    payoutImperfect: VISITANTE.payout,
    learning: 'none',
  },
];

export const EVENTS_BY_ID: ReadonlyMap<EventId, EventDef> = new Map(EVENTS.map((e) => [e.id, e]));

/** Whole days between two `YYYY-MM-DD` strings. Dates only — no zone maths. */
function daysBetween(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return Number.POSITIVE_INFINITY;
  return Math.round((tb - ta) / 86_400_000);
}

/**
 * The event for a day, or `null` — which is the common answer, on purpose.
 *
 * `lastEventDate` is the last day an event actually ran (`null` if never). The
 * two-day gap is enforced here rather than trusted to the caller, because "never
 * two days running" is a design rule and not a preference.
 */
export function eventForDay(
  userId: string,
  localDate: string,
  lastEventDate: string | null,
  opts: { tier: number; features: readonly FeatureId[] },
): EventId | null {
  if (lastEventDate && daysBetween(lastEventDate, localDate) < EVENT_MIN_GAP_DAYS) return null;

  const eligible = EVENTS.filter(
    (e) => e.minTier <= opts.tier && (!e.requiresFeature || opts.features.includes(e.requiresFeature)),
  );
  if (eligible.length === 0) return null;

  const rng = mulberry32(hashInt(`event:${userId}:${localDate}`));
  // Roughly every other eligible day carries one — bounded, never a daily chore.
  if (rng() > 0.5) return null;
  return eligible[Math.floor(rng() * eligible.length)]!.id;
}

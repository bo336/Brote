/**
 * Daily care, and the biodiversity stars — the two things that keep a restored
 * island asking for you after every parcel on it is green.
 *
 * **Care is maintenance, never loss.** Each day a few living parcels have one
 * small, true-to-life thing going on: an invasive resprouting from a seed a bird
 * dropped, aphids, litter the wind brought, a dry spell. Leaving it changes
 * nothing that was built — the parcel simply keeps its fruit until you come by
 * (`11-GAME-LOOP.md` §6: the world never regresses). Doing it teaches the lesson
 * that restoration is not a one-off: it is looking after something.
 *
 * **Stars** reward diversity past flourishing: a fourth, fifth and sixth native
 * species in the same parcel, each needing species the real-life axis
 * discovers — which is exactly how the two axes keep needing each other.
 */
import { hashInt, mulberry32 } from '../rng';
import { dayOf, bump, earn } from './state';
import { type ParcelField, type ParcelSpec } from './parcels';
import type { GameContext, GameEvent, GameState, ParcelState } from './types';

export type CareKind = 'yuyo' | 'pulgones' | 'basura' | 'sed';

export const CARE: Record<CareKind, { name: string; verb: string; card: string }> = {
  yuyo: { name: 'Rebrotó una invasora', verb: 'Arrancar', card: 'k:rebrote' },
  pulgones: { name: 'Hay pulgones', verb: 'Revisar', card: 'k:pulgones' },
  basura: { name: 'El viento trajo basura', verb: 'Juntar', card: 'k:viento' },
  sed: { name: 'Tiene sed', verb: 'Regar', card: 'k:sequia' },
};

const CARE_KINDS = Object.keys(CARE) as CareKind[];

/** Share of living parcels with something going on, each day, and the most at once. */
const CARE_SHARE = 0.24;
const CARE_MAX = 8;

/** Today's care, deterministic from the island and the date: the same on every device. */
export function careToday(s: GameState, field: ParcelField, ctx: GameContext): Map<string, CareKind> {
  const out = new Map<string, CareKind>();
  const living = Object.entries(s.parcels)
    .filter(([id, ps]) => ps.s >= 4 && field.byId.has(id) && dayOf(ctx.day) > (ps.d ?? 0))
    .map(([id]) => id)
    .sort();
  const rng = mulberry32(hashInt(`care:${ctx.who}:${ctx.day}`));
  for (const id of living) {
    if (out.size >= CARE_MAX) break;
    if (rng() >= CARE_SHARE) continue;
    out.set(id, CARE_KINDS[Math.floor(rng() * CARE_KINDS.length)]!);
  }
  return out;
}

/** The care a parcel still asks for today, or null. */
export function careOf(s: GameState, field: ParcelField, id: string, ctx: GameContext): CareKind | null {
  if (s.today.cared?.includes(id)) return null;
  return careToday(s, field, ctx).get(id) ?? null;
}

/** Look after a parcel. Water for thirst; everything else is just your hands. */
export function care(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const kind = careOf(s, field, id, ctx);
  if (!kind) return false;
  if (kind === 'sed') {
    if (s.agua < 1) {
      events.push({ type: 'refused', why: 'missing', need: { agua: 1 } });
      return false;
    }
    s.agua -= 1;
  }
  (s.today.cared ??= []).push(id);
  events.push({ type: 'cared', parcel: id, kind });
  bump(s, 'cared');
  bump(s, `cared:${kind}`);
  earn(s, 2, 'care', events);
  return true;
}

// ── Stars ──────────────────────────────────────────────────────────────────

export const MAX_SPECIES = 6;

/** 0..3 stars: one per distinct species past the three that made it flourish. */
export function starsOf(ps: ParcelState | undefined): number {
  if (!ps || ps.s < 5) return 0;
  return Math.max(0, Math.min(3, new Set(ps.plants).size - 3));
}

/** A new star just landed: pay it and say so. */
export function starEarned(s: GameState, p: ParcelSpec, ps: ParcelState, events: GameEvent[]): void {
  const stars = starsOf(ps);
  events.push({ type: 'star', parcel: p.id, stars });
  bump(s, 'stars');
  earn(s, 8 + 4 * stars, 'star', events);
}

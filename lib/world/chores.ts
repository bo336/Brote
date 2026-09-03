/**
 * Daily caretaking — the backbone of the 90-second session (`11-GAME-LOOP.md` §3.4).
 *
 * Three chores are drawn per day from a pool of ten, deterministically from
 * `hash(userId + localDate)`, so the same player sees the same three all day on
 * every device, and a reload cannot reroll them.
 *
 * This rhymes with the existing `care_world()` RPC and the `cuida-tu-mundo`
 * daily activity, and both are reused rather than replaced.
 */
import { DAILY_CAPS } from './config';
import { mulberry32, hashInt } from './rng';
import type { ChoreId, RegionId, VerbId } from './types';

export interface ChoreDef {
  id: ChoreId;
  /** i18n key. Copy lives in `messages/es.json`, never here. */
  nameKey: string;
  /** Where it happens; `null` means anywhere on the island. */
  region: RegionId | null;
  verb: VerbId | 'interact' | 'follow';
  /** Some chores need a prop the player has actually placed. */
  requiresProp?: string;
}

/** The pool of ten, verbatim from `14-CONTENT.md` §4. */
export const CHORES: ChoreDef[] = [
  { id: 'regar_canteros', nameKey: 'mundo.chore.regar_canteros', region: 'jardin', verb: 'water' },
  { id: 'podar_seco', nameKey: 'mundo.chore.podar_seco', region: 'arboleda', verb: 'interact' },
  { id: 'juntar_ramas', nameKey: 'mundo.chore.juntar_ramas', region: 'arboleda', verb: 'interact' },
  { id: 'limpiar_orilla', nameKey: 'mundo.chore.limpiar_orilla', region: 'rio', verb: 'interact' },
  { id: 'llenar_comedero', nameKey: 'mundo.chore.llenar_comedero', region: null, verb: 'interact', requiresProp: 'mundo_comedero' },
  { id: 'guiar_bicho', nameKey: 'mundo.chore.guiar_bicho', region: null, verb: 'follow' },
  { id: 'barrer_sendero', nameKey: 'mundo.chore.barrer_sendero', region: 'claro', verb: 'interact' },
  { id: 'dar_vuelta_compost', nameKey: 'mundo.chore.dar_vuelta_compost', region: 'jardin', verb: 'interact' },
  { id: 'colgar_farol', nameKey: 'mundo.chore.colgar_farol', region: null, verb: 'interact', requiresProp: 'mundo_farolitos' },
  { id: 'ajustar_puente', nameKey: 'mundo.chore.ajustar_puente', region: 'rio', verb: 'interact' },
];

export const CHORES_BY_ID: ReadonlyMap<ChoreId, ChoreDef> = new Map(CHORES.map((c) => [c.id, c]));

/**
 * The day's three. `localDate` is the BA-local `YYYY-MM-DD` the server already
 * computes for every other daily surface — pass it in, never derive it here.
 */
export function choresForDay(userId: string, localDate: string): ChoreId[] {
  const rng = mulberry32(hashInt(`chores:${userId}:${localDate}`));
  const pool = CHORES.map((c) => c.id);
  // Fisher-Yates on a copy: an unbiased draw, and deterministic from the seed.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = a;
  }
  return pool.slice(0, DAILY_CAPS.chores);
}

/**
 * Whether a drawn chore can actually be done right now. A chore whose prop is
 * not placed, or whose region is still behind the mist, is shown as not
 * available — never as a failure, and never as a nag.
 */
export function choreAvailable(
  chore: ChoreDef,
  unlockedRegions: readonly RegionId[],
  placedProps: readonly string[],
): boolean {
  if (chore.region && !unlockedRegions.includes(chore.region)) return false;
  if (chore.requiresProp && !placedProps.includes(chore.requiresProp)) return false;
  return true;
}

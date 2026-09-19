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
import type { ChoreId, FeatureId, RegionId, VerbId } from './types';

export interface ChoreDef {
  id: ChoreId;
  /**
   * i18n key **relative to the `mundo` namespace**, which is the convention
   * every `labelKey` in the world uses (`accion.mojon`, `verb.swim`).
   *
   * It used to be fully qualified, and the action button — which already scopes
   * itself to `mundo` — rendered "Mundo.Mundo.Chore.Dar_vuelta_compost" on the
   * one surface a player actually reads. Copy still lives in `messages/es.json`
   * and never here.
   */
  nameKey: string;
  /** Where it happens; `null` means anywhere on the island. */
  region: RegionId | null;
  verb: VerbId | 'interact' | 'follow';
  /** Some chores need a prop the player has actually placed. */
  requiresProp?: string;
  /**
   * A chore that names a thing happens **at that thing**.
   *
   * "Ajustar la soga del puente" belongs at the bridge, not at a random point
   * in El Río — whose centre is the lagoon, which is where the first version
   * put it: two metres under water, unreachable, with nothing to explain it.
   */
  anchor?: FeatureId;
}

/** The pool of ten, verbatim from `14-CONTENT.md` §4. */
export const CHORES: ChoreDef[] = [
  { id: 'regar_canteros', nameKey: 'chore.regar_canteros', region: 'jardin', verb: 'water' },
  { id: 'podar_seco', nameKey: 'chore.podar_seco', region: 'arboleda', verb: 'interact' },
  { id: 'juntar_ramas', nameKey: 'chore.juntar_ramas', region: 'arboleda', verb: 'interact' },
  { id: 'limpiar_orilla', nameKey: 'chore.limpiar_orilla', region: 'rio', verb: 'interact', anchor: 'bridge' },
  { id: 'llenar_comedero', nameKey: 'chore.llenar_comedero', region: null, verb: 'interact', requiresProp: 'mundo_comedero' },
  { id: 'guiar_bicho', nameKey: 'chore.guiar_bicho', region: null, verb: 'follow' },
  { id: 'barrer_sendero', nameKey: 'chore.barrer_sendero', region: 'claro', verb: 'interact' },
  { id: 'dar_vuelta_compost', nameKey: 'chore.dar_vuelta_compost', region: 'jardin', verb: 'interact', anchor: 'compost' },
  { id: 'colgar_farol', nameKey: 'chore.colgar_farol', region: null, verb: 'interact', requiresProp: 'mundo_farolitos' },
  { id: 'ajustar_puente', nameKey: 'chore.ajustar_puente', region: 'rio', verb: 'interact', anchor: 'bridge' },
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

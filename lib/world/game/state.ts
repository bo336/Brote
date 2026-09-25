/**
 * The save itself: a new game, a loaded game made safe, and the small helpers
 * every rule uses — the bag, the watering can, the wallet.
 *
 * **Everything that comes off the wire is untrusted.** `sanitize` turns any
 * JSON into a valid `GameState` or a fresh one: a corrupted save must never
 * take the island down with it, and a hand-edited one must not get further
 * than the server's caps would let it.
 */
import { dayIndex } from '../cast';
import { SEMILLAS } from './config';
import { MATERIALS, TOOLS, toolValue, WASTE } from './materials';
import { PLANTS } from './plants';
import { STATIONS } from './stations';
import { SHOP_BY_SLUG } from './shop';
import {
  GAME_STATE_VERSION,
  type Bag, type BulkMaterial, type GameContext, type GameEvent, type GameState,
  type MaterialId, type ParcelState, type StationId, type StationState, type ToolId, type WasteKind,
} from './types';

export const BULK: BulkMaterial[] = ['hojas', 'ramas', 'piedras', 'frutos', 'compost', 'reciclado'];

export function emptyBag(): Bag {
  return { residuos: [], hojas: 0, ramas: 0, piedras: 0, frutos: 0, compost: 0, reciclado: 0, plantines: {} };
}

export function newGame(ctx: GameContext): GameState {
  return {
    v: GAME_STATE_VERSION,
    sem: { earned: SEMILLAS.start, spent: 0 },
    bag: emptyBag(),
    agua: 0,
    tools: { mochila: 1, regadera: 1, guantes: 1 },
    // Don Beto's Punto Limpio is already standing when you arrive: litter
    // always has somewhere to go, from the first minute.
    stations: { punto_limpio: { lvl: 1, paid: {}, queue: 0, since: 0, out: 0 } },
    parcels: {},
    missions: { chain: {}, prog: {}, met: [], daily: { day: '', ids: [], prog: [], claimed: [], bonus: false } },
    today: { day: ctx.day, picked: [], harvested: [], earned: 0 },
    inv: {},
    know: [],
    stats: {},
    seen: { tier: 0, div: 0 },
    census: [],
    savedAt: ctx.now,
  };
}

// ── Wallet ─────────────────────────────────────────────────────────────────

export function balance(s: GameState): number {
  return Math.max(0, s.sem.earned - s.sem.spent);
}

/**
 * Pay the player, under the daily cap. Returns how much actually landed, so a
 * reward card never shows a number the wallet did not receive.
 */
export function earn(s: GameState, n: number, why: string, events: GameEvent[]): number {
  const room = Math.max(0, SEMILLAS.dailyCap - s.today.earned);
  const paid = Math.max(0, Math.min(Math.floor(n), room));
  if (paid <= 0) return 0;
  s.sem.earned += paid;
  s.today.earned += paid;
  events.push({ type: 'earned', n: paid, why });
  return paid;
}

export function spend(s: GameState, n: number): boolean {
  if (balance(s) < n) return false;
  s.sem.spent += n;
  return true;
}

// ── Bag ────────────────────────────────────────────────────────────────────

/**
 * What fills the backpack: only what you pick up off the ground. What you
 * *made* — compost, recycled material, seedlings — goes to the galpón, which
 * has no bottom. That split is what makes a full backpack a reason to walk to
 * a station and never a dead end: the simulation found a day-one deadlock
 * (a bag full of litter, no room for the branches that build anything) when
 * everything shared one limit.
 */
export const RAW: BulkMaterial[] = ['hojas', 'ramas', 'piedras', 'frutos'];

export function bagCount(bag: Bag): number {
  let n = bag.residuos.length;
  for (const m of RAW) n += bag[m];
  return n;
}

export function bagCap(s: GameState): number {
  return toolValue('mochila', s.tools.mochila);
}

export function bagFree(s: GameState): number {
  return Math.max(0, bagCap(s) - bagCount(s.bag));
}

export function waterCap(s: GameState): number {
  return toolValue('regadera', s.tools.regadera);
}

export function plantinesTotal(bag: Bag): number {
  let n = 0;
  for (const v of Object.values(bag.plantines)) n += v;
  return n;
}

/** How many of a material the bag holds. */
export function have(s: GameState, m: MaterialId): number {
  if (m === 'residuos') return s.bag.residuos.length;
  if (m === 'plantines') return plantinesTotal(s.bag);
  return s.bag[m];
}

/** Take bulk material out of the bag; false (and nothing taken) when short. */
export function take(s: GameState, m: BulkMaterial, n: number): boolean {
  if (s.bag[m] < n) return false;
  s.bag[m] -= n;
  return true;
}

/** Put material in: raw as far as the backpack allows, made things without limit. */
export function put(s: GameState, m: BulkMaterial, n: number): number {
  const fit = RAW.includes(m) ? Math.max(0, Math.min(n, bagFree(s))) : Math.max(0, n);
  s.bag[m] += fit;
  return fit;
}

/** Seedlings go to the galpón: no limit. */
export function putPlantin(s: GameState, plant: string, n: number): number {
  if (n > 0) s.bag.plantines[plant] = (s.bag.plantines[plant] ?? 0) + n;
  return Math.max(0, n);
}

export function bump(s: GameState, key: string, n = 1): void {
  s.stats[key] = (s.stats[key] ?? 0) + n;
}

// ── Days ───────────────────────────────────────────────────────────────────

/** The day index of a `YYYY-MM-DD`, shared with the cast's drip. */
export function dayOf(day: string): number {
  return dayIndex(day);
}

/**
 * A new local day: today's spawns come back, harvests are available again and
 * the daily cap starts over. Nothing the player built or grew is touched —
 * the world never regresses (`11-GAME-LOOP.md` §6).
 */
export function rollDay(s: GameState, ctx: GameContext): boolean {
  if (s.today.day === ctx.day) return false;
  s.today = { day: ctx.day, picked: [], harvested: [], earned: 0, cared: [] };
  return true;
}

// ── Sanitising a loaded save ───────────────────────────────────────────────

const num = (v: unknown, min = 0, max = 1e9): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0;
  return Math.min(max, Math.max(min, n));
};
const str = (v: unknown, max = 64): string => (typeof v === 'string' ? v.slice(0, max) : '');
const strList = (v: unknown, max = 400): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 64)) : [];
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function cleanStation(v: unknown): StationState {
  const o = obj(v);
  const paid: StationState['paid'] = {};
  for (const [k, val] of Object.entries(obj(o.paid))) if (k in MATERIALS) paid[k as MaterialId] = num(val, 0, 999);
  const out: StationState = { lvl: num(o.lvl, 0, 3), paid, queue: num(o.queue, 0, 999), since: num(o.since, 0, 9e15), out: num(o.out, 0, 999) };
  const pick = str(o.pick);
  if (pick && PLANTS[pick]) out.pick = pick;
  return out;
}

function cleanParcel(v: unknown): ParcelState {
  const o = obj(v);
  const s = num(o.s, 0, 5) as ParcelState['s'];
  const out: ParcelState = {
    s,
    lit: num(o.lit, 0, 255),
    inv: o.inv === true,
    n: num(o.n, 0, 99),
    plants: strList(o.plants, 24).filter((p) => PLANTS[p]),
    wet: (Array.isArray(o.wet) ? o.wet : []).map((d) => num(d, 0, 1e7)).slice(-8),
    at: num(o.at, 0, 9e15),
  };
  const hab = str(o.hab);
  if (hab && SHOP_BY_SLUG.get(hab)?.kind === 'habitat') out.hab = hab;
  const r = str(o.r);
  if (r) out.r = r as ParcelState['r'];
  return out;
}

/** Any JSON in, a valid save out. Unknown keys are dropped; missing ones filled. */
export function sanitize(raw: unknown, ctx: GameContext): GameState {
  const o = obj(raw);
  if (num(o.v) < 1) return newGame(ctx);
  const s = newGame(ctx);
  const sem = obj(o.sem);
  s.sem = { earned: num(sem.earned), spent: num(sem.spent) };
  const bag = obj(o.bag);
  s.bag.residuos = strList(bag.residuos, 200).filter((w): w is WasteKind => w in WASTE);
  for (const m of BULK) s.bag[m] = num(bag[m], 0, 999);
  for (const [k, v] of Object.entries(obj(bag.plantines))) if (PLANTS[k]) s.bag.plantines[k] = num(v, 0, 999);
  s.agua = num(o.agua, 0, 99);
  const tools = obj(o.tools);
  for (const t of Object.keys(TOOLS) as ToolId[]) s.tools[t] = num(tools[t], 1, TOOLS[t].values.length) || 1;
  for (const [k, v] of Object.entries(obj(o.stations))) if (k in STATIONS) s.stations[k as StationId] = cleanStation(v);
  for (const [k, v] of Object.entries(obj(o.parcels))) if (/^p-?\d+_-?\d+$/.test(k)) s.parcels[k] = cleanParcel(v);
  const mis = obj(o.missions);
  for (const [k, v] of Object.entries(obj(mis.chain))) s.missions.chain[str(k)] = num(v, 0, 99);
  for (const [k, v] of Object.entries(obj(mis.prog))) s.missions.prog[str(k)] = num(v, 0, 9999);
  s.missions.met = strList(mis.met, 40);
  const daily = obj(mis.daily);
  s.missions.daily = {
    day: str(daily.day, 10),
    ids: strList(daily.ids, 6),
    prog: (Array.isArray(daily.prog) ? daily.prog : []).map((p) => num(p, 0, 9999)).slice(0, 6),
    claimed: (Array.isArray(daily.claimed) ? daily.claimed : []).map((c) => c === true).slice(0, 6),
    bonus: daily.bonus === true,
  };
  const today = obj(o.today);
  s.today = {
    day: str(today.day, 10) || ctx.day,
    picked: strList(today.picked, 600),
    harvested: strList(today.harvested, 300),
    earned: num(today.earned, 0, SEMILLAS.dailyCap),
    cared: strList(today.cared, 60),
  };
  for (const [k, v] of Object.entries(obj(o.inv))) if (SHOP_BY_SLUG.has(k)) s.inv[k] = num(v, 0, 99);
  s.know = strList(o.know, 300);
  for (const [k, v] of Object.entries(obj(o.stats))) s.stats[str(k, 40)] = num(v);
  const seen = obj(o.seen);
  s.seen = { tier: num(seen.tier, 0, 11), div: num(seen.div, 0, 5) };
  s.census = strList(o.census, 200);
  s.savedAt = num(o.savedAt, 0, 9e15) || ctx.now;
  return s;
}

/** A deep copy cheap enough to take before every action: the state is small and flat. */
export function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

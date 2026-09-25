/**
 * Missions: the story chains, the dailies, and the one rule that joins them —
 * **a mission is a question about events or about the state, never a timer.**
 *
 * Chains (`texto/cadenas*.ts`) are the backbone: one per region, told by the
 * island's four voices, opened by the rank tier that discovers the region.
 * Dailies (`texto/diarias.ts`) are three a day, drawn from what this island can
 * actually do today, the same three on every device.
 *
 * Rewards are world semillas and world things. Nothing here reaches the app.
 */
import { hashInt, mulberry32 } from '../rng';
import type { RegionId } from '../types';
import { SEMILLAS } from './config';
import { parcelRegion, type ParcelField } from './parcels';
import { bump, earn, putPlantin } from './state';
import { CHAINS, CHAIN_ORDER } from './texto/cadenas';
import { DAILIES } from './texto/diarias';
import type { BulkMaterial, GameContext, GameEvent, GameState, StationId } from './types';

// ── Goals ──────────────────────────────────────────────────────────────────

/** An event goal counts matching events after the mission became current. */
export interface EventMatch {
  type: GameEvent['type'];
  material?: string;
  bin?: string;
  right?: boolean;
  station?: StationId;
  plant?: string | string[];
  stage?: number;
  region?: RegionId;
  item?: string;
  species?: string;
}

export type StateTest =
  | { t: 'station'; id: StationId; lvl: number }
  | { t: 'parcels'; stage: number; n: number; region?: RegionId }
  | { t: 'stat'; key: string; n: number };

export type Goal =
  | { k: 'talk'; who: string }
  | { k: 'event'; match: EventMatch; n: number }
  | { k: 'state'; test: StateTest };

/** Where the objective card should point while this is the current mission. */
export type Target =
  | { to: 'spawn'; kind: 'residuos' | 'hojas' | 'ramas' | 'piedras' }
  | { to: 'station'; id: StationId }
  | { to: 'parcel'; stage: number; region?: RegionId }
  | { to: 'cast'; who: string }
  | { to: 'water' }
  | { to: 'region'; id: RegionId }
  | { to: 'none' };

export interface Reward {
  sem: number;
  mat?: Partial<Record<BulkMaterial, number>>;
  plantines?: Record<string, number>;
  inv?: Record<string, number>;
  card?: string;
}

export interface MissionDef {
  id: string;
  who: string;
  title: string;
  /** What to do, in one or two short sentences. Shown on the card. */
  ask: string;
  /** The character's line when it is done. The lesson, when there is one. */
  done: string;
  /** The character's line when you talk to open it (talk goals only). */
  intro?: string;
  goal: Goal;
  target: Target;
  reward: Reward;
  /** Given the moment this mission becomes current: seedlings Inés hands you, and so on. */
  gift?: Reward;
}

export interface ChainDef {
  id: string;
  tier: number;
  region: RegionId;
  missions: MissionDef[];
}

export interface DailyDef {
  id: string;
  title: string;
  match: EventMatch;
  /** How many, from the rank tier. */
  n: (tier: number) => number;
  target: Target;
  minTier: number;
  /** Is this completable on this island today? Checked when the day's three are drawn. */
  can?: (s: GameState, ctx: GameContext, w: MissionWorld) => boolean;
}

// ── Checking ───────────────────────────────────────────────────────────────

export interface MissionWorld {
  field: ParcelField;
}

function regionOfParcel(s: GameState, w: MissionWorld, id: string, tier: number): RegionId | null {
  const p = w.field.byId.get(id);
  return p ? parcelRegion(p, s.parcels[id], tier) : null;
}

export function eventMatches(ev: GameEvent, m: EventMatch, s: GameState, w: MissionWorld, tier: number): number {
  if (ev.type !== m.type) return 0;
  const e = ev as Record<string, unknown>;
  if (m.material && e.material !== m.material) return 0;
  if (m.bin && e.bin !== m.bin) return 0;
  if (m.right !== undefined && e.right !== m.right) return 0;
  if (m.station && e.station !== m.station) return 0;
  if (m.item && e.item !== m.item) return 0;
  if (m.species && e.species !== m.species) return 0;
  if (m.stage !== undefined && e.stage !== m.stage) return 0;
  if (m.plant) {
    const ok = Array.isArray(m.plant) ? m.plant.includes(e.plant as string) : e.plant === m.plant;
    if (!ok) return 0;
  }
  if (m.region) {
    const region = (e.region as RegionId | undefined) ?? (typeof e.parcel === 'string' ? regionOfParcel(s, w, e.parcel, tier) : null);
    if (region !== m.region) return 0;
  }
  return typeof e.n === 'number' ? (e.n as number) : 1;
}

export function stateValue(test: StateTest, s: GameState, w: MissionWorld, tier: number): number {
  switch (test.t) {
    case 'station':
      return s.stations[test.id]?.lvl ?? 0;
    case 'parcels': {
      let n = 0;
      for (const [id, ps] of Object.entries(s.parcels)) {
        if (ps.s < test.stage) continue;
        if (test.region && regionOfParcel(s, w, id, tier) !== test.region) continue;
        n++;
      }
      return n;
    }
    case 'stat':
      return s.stats[test.key] ?? 0;
  }
}

export function stateNeed(test: StateTest): number {
  return test.t === 'station' ? test.lvl : test.n;
}

/** The current mission of a chain, or null when the chain is done. */
export function currentOf(s: GameState, chain: string): MissionDef | null {
  const def = CHAINS[chain];
  if (!def) return null;
  return def.missions[s.missions.chain[chain] ?? 0] ?? null;
}

/** Progress of a mission: [done, total]. */
export function progressOf(m: MissionDef, s: GameState, w: MissionWorld, tier: number): [number, number] {
  const g = m.goal;
  if (g.k === 'talk') return [s.missions.met.includes(m.id) ? 1 : 0, 1];
  if (g.k === 'event') return [Math.min(g.n, s.missions.prog[m.id] ?? 0), g.n];
  const need = stateNeed(g.test);
  return [Math.min(need, stateValue(g.test, s, w, tier)), need];
}

/** Open chains, lowest tier first: what the card shows, in order. */
export function openChains(s: GameState, tier: number): string[] {
  return CHAIN_ORDER.filter((c) => CHAINS[c]!.tier <= tier && currentOf(s, c) !== null);
}

/** Pay a reward. Materials and seedlings go in as far as the bag allows. */
export function grant(s: GameState, r: Reward, why: string, events: GameEvent[]): void {
  if (r.sem) earn(s, r.sem, why, events);
  for (const [m, n] of Object.entries(r.mat ?? {})) {
    const fit = Math.min(n ?? 0, Math.max(0, 999));
    s.bag[m as BulkMaterial] += fit;
  }
  for (const [p, n] of Object.entries(r.plantines ?? {})) putPlantin(s, p, n);
  for (const [slug, n] of Object.entries(r.inv ?? {})) s.inv[slug] = (s.inv[slug] ?? 0) + n;
  if (r.card && !s.know.includes(r.card)) {
    s.know.push(r.card);
    events.push({ type: 'learned', card: r.card });
  }
}

/**
 * Feed the events of one action to every open mission, complete what is
 * complete, and open what comes next. Loops, because finishing one mission can
 * satisfy the next one's state test at once (you already built the vivero).
 */
export function advanceMissions(s: GameState, events: GameEvent[], w: MissionWorld, ctx: GameContext): void {
  const fresh = [...events];
  for (let guard = 0; guard < 12; guard++) {
    let moved = false;
    for (const chain of openChains(s, ctx.tier)) {
      const m = currentOf(s, chain)!;
      if (!s.missions.met.includes(`gift:${m.id}`) && m.gift && m.goal.k !== 'talk') {
        s.missions.met.push(`gift:${m.id}`);
        grant(s, m.gift, `gift:${m.id}`, events);
        events.push({ type: 'gift', from: m.who, what: m.id });
      }
      if (m.goal.k === 'event') {
        let add = 0;
        for (const ev of fresh) add += eventMatches(ev, m.goal.match, s, w, ctx.tier);
        if (add > 0) s.missions.prog[m.id] = (s.missions.prog[m.id] ?? 0) + add;
      }
      const [done, total] = progressOf(m, s, w, ctx.tier);
      if (done < total) continue;
      delete s.missions.prog[m.id];
      s.missions.chain[chain] = (s.missions.chain[chain] ?? 0) + 1;
      grant(s, m.reward, `mission:${m.id}`, events);
      events.push({ type: 'mission', id: m.id, chain });
      bump(s, 'missions');
      moved = true;
    }
    // Only the events of the action count toward a mission opened by it;
    // a mission opened now starts from zero.
    fresh.length = 0;
    if (!moved) break;
  }
  advanceDailies(s, events, w, ctx);
}

/** Talking opens a talk mission (and hands over its gift). */
export function talk(s: GameState, who: string, w: MissionWorld, ctx: GameContext, events: GameEvent[]): MissionDef | null {
  events.push({ type: 'talked', who });
  for (const chain of openChains(s, ctx.tier)) {
    const m = currentOf(s, chain)!;
    if (m.goal.k === 'talk' && m.goal.who === who && !s.missions.met.includes(m.id)) {
      s.missions.met.push(m.id);
      if (m.gift) grant(s, m.gift, `gift:${m.id}`, events);
      advanceMissions(s, events, w, ctx);
      return m;
    }
  }
  advanceMissions(s, events, w, ctx);
  return null;
}

// ── Dailies ────────────────────────────────────────────────────────────────

const DAILY_COUNT = 3;

/** Draw today's three, from what can be done on this island today. */
export function drawDailies(s: GameState, ctx: GameContext, w: MissionWorld): void {
  if (s.missions.daily.day === ctx.day) return;
  const rng = mulberry32(hashInt(`dailies:${ctx.who}:${ctx.day}`));
  const pool = DAILIES.filter((d) => d.minTier <= ctx.tier && (!d.can || d.can(s, ctx, w)));
  const ids: string[] = [];
  while (ids.length < DAILY_COUNT && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    ids.push(pool[i]!.id);
    pool.splice(i, 1);
  }
  s.missions.daily = { day: ctx.day, ids, prog: ids.map(() => 0), claimed: ids.map(() => false), bonus: false };
}

export const DAILY_BY_ID: ReadonlyMap<string, DailyDef> = new Map(DAILIES.map((d) => [d.id, d]));

function advanceDailies(s: GameState, events: GameEvent[], w: MissionWorld, ctx: GameContext): void {
  const d = s.missions.daily;
  if (d.day !== ctx.day) return;
  d.ids.forEach((id, i) => {
    const def = DAILY_BY_ID.get(id);
    if (!def || d.claimed[i]) return;
    const need = def.n(ctx.tier);
    for (const ev of events) d.prog[i] = Math.min(need, (d.prog[i] ?? 0) + eventMatches(ev, def.match, s, w, ctx.tier));
    if ((d.prog[i] ?? 0) >= need) {
      d.claimed[i] = true;
      earn(s, SEMILLAS.daily, `daily:${id}`, events);
      events.push({ type: 'mission', id: `daily:${id}`, chain: null });
      bump(s, 'dailies');
    }
  });
  if (!d.bonus && d.ids.length > 0 && d.claimed.every(Boolean)) {
    d.bonus = true;
    earn(s, SEMILLAS.dailyBonus, 'daily:bonus', events);
    events.push({ type: 'mission', id: 'daily:bonus', chain: null });
  }
}

/**
 * A player who plays thirty minutes a day, for the balance tests.
 *
 * Greedy and honest: it walks (at run speed) to everything it does, pays a
 * few seconds per action, and only does what the rules allow. It is not a good
 * player — it is a *plausible* one — so if it runs out of things to do, a
 * person will too; and if it finishes everything in a week, so will they.
 *
 * Output is a row per day: seconds busy, seconds idle (nothing left worth
 * doing), semillas earned, parcels per stage, missions finished.
 */
import { buildLayout, type IslandLayout } from '../layout';
import { cumulativeState } from '../progression';
import { hashInt } from '../rng';
import { buildOpen, currentOf, openChains } from './missions';
import { fittingHabitats, fittingPlantines, parcelNext, ripe } from './parcel-actions';
import { buildParcels, parcelRegion, parcelsAt, type ParcelField } from './parcels';
import { plantsFor, PARCEL_TYPES, progressOf } from './plants';
import { careOf } from './care';
import { reduce, type GameAction } from './reduce';
import { SHOP } from './shop';
import { dailySpawns, parcelLitter, type Spawn } from './spawns';
import { gameSpots, type GameSpots } from './spots';
import { nextCost, STATIONS, STATION_ORDER } from './stations';
import { rate, secondsToNext } from './production';
import { balance, bagFree, newGame, waterCap } from './state';
import { TOOLS, WASTE } from './materials';
import type { GameContext, GameState, StationId } from './types';

/**
 * A person, not an optimiser: they jog rather than sprint in straight lines,
 * turn the camera, read what the characters say, and take a couple of seconds
 * per piece in the sorting game. Calibrated against the 2026-09-14 bot runs
 * with real keyboard input (~2.8 m/s over a route with turns).
 */
const SPEED = 2.8;
const COST = { pickup: 1.2, sort: 2.6, deliver: 0.15, station: 4, parcel: 3.5, talk: 16, buy: 10 } as const;

export interface SimDay {
  day: number;
  tier: number;
  busy: number;
  idle: number;
  earned: number;
  stages: number[];
  missions: number;
  cards: number;
  stageUps: number;
  /** Biodiversity stars on the island at the end of the day. */
  stars: number;
  /** What the bot spent its day on, by action type. */
  did: Record<string, number>;
}

interface Step {
  x: number;
  z: number;
  actions: GameAction[];
  cost: number;
}

function dateOf(day: number): string {
  const d = new Date(Date.UTC(2026, 9, 1 + day));
  return d.toISOString().slice(0, 10);
}

export function simulate(who: string, days: number, tierOn: (day: number) => number, minutes = 30): SimDay[] {
  const seed = hashInt(who);
  const field = buildParcels(seed);
  const world = { field };
  const layouts = new Map<number, IslandLayout>();
  const layoutAt = (t: number) => {
    let l = layouts.get(t);
    if (!l) {
      l = buildLayout(who, cumulativeState(t));
      layouts.set(t, l);
    }
    return l;
  };
  const start = Date.UTC(2026, 9, 1, 22, 0, 0);
  let s: GameState | null = null;
  const out: SimDay[] = [];
  let px = 0;
  let pz = 0;

  for (let day = 0; day < days; day++) {
    // `tierOn` returns progress: 3.4 is tier 3, division 3.
    const progress = tierOn(day);
    const tier = Math.floor(progress);
    const div = 1 + Math.min(4, Math.round((progress - tier) * 5));
    const layout = layoutAt(tier);
    const spots = gameSpots(who, layout);
    const ctxAt = (t: number): GameContext => ({ now: start + day * 86_400_000 + t * 1000, day: dateOf(day), tier, div, who });
    if (!s) s = newGame(ctxAt(0));
    s = reduce(s, { t: 'tick' }, ctxAt(0), world).state;
    [px, pz] = layout.spawn;
    const daily = dailySpawns({ seed, day: dateOf(day), tier, terrain: layout.terrain, coastline: layout.coastline });
    const before = { earned: s.sem.earned, missions: s.stats.missions ?? 0, dailies: s.stats.dailies ?? 0, cards: s.know.length, ups: stageUps(s) };
    let t = 0;
    let busy = 0;
    const did: Record<string, number> = {};
    const budget = minutes * 60;
    while (t < budget) {
      const step: Step | null = choose(s, ctxAt(t), field, spots, daily, px, pz);
      if (!step) {
        // A person waits out a short timer instead of leaving: the compost is minutes away.
        const wait = shortestWait(s, ctxAt(t).now);
        if (wait !== null && wait <= WAIT_MAX_S && t + wait < budget) {
          t += wait + 1;
          s = reduce(s, { t: 'tick' }, ctxAt(t), world).state;
          continue;
        }
        break;
      }
      const travel = Math.hypot(step.x - px, step.z - pz) / SPEED;
      t += travel + step.cost;
      busy += travel + step.cost;
      px = step.x;
      pz = step.z;
      for (const a of step.actions) s = reduce(s, a, ctxAt(t), world).state;
      const k = step.actions[0]?.t ?? '?';
      did[k] = (did[k] ?? 0) + 1;
    }
    out.push({
      day, tier,
      busy: Math.round(Math.min(budget, busy)),
      idle: Math.round(Math.max(0, budget - t)),
      earned: s.sem.earned - before.earned,
      stages: [0, 1, 2, 3, 4, 5].map((k) => parcelsAt(field, tier).filter((p) => (s!.parcels[p.id]?.s ?? 0) === k).length),
      missions: (s.stats.missions ?? 0) - before.missions,
      cards: s.know.length - before.cards,
      stageUps: stageUps(s) - before.ups,
      stars: s.stats.stars ?? 0,
      did,
    });
  }
  return out;
}

/** How long a player stands around for a producer before calling it a day. */
const WAIT_MAX_S = 300;

/** Seconds until the next thing a loaded producer makes, if any. */
function shortestWait(s: GameState, now: number): number | null {
  let best: number | null = null;
  for (const id of ['compostera', 'vivero'] as StationId[]) {
    const st = s.stations[id];
    if (!st || st.lvl < 1 || st.queue <= 0) continue;
    const w = secondsToNext(st, id, now);
    if (w !== null && (best === null || w < best)) best = w;
  }
  return best;
}

function stageUps(s: GameState): number {
  let n = 0;
  for (const k of [1, 2, 3, 4, 5]) n += s.stats[`stage:${k}`] ?? 0;
  return n;
}

/** The next thing worth doing, or null when nothing is. */
function choose(s: GameState, ctx: GameContext, field: ParcelField, spots: GameSpots, daily: Spawn[], px: number, pz: number): Step | null {
  const near = <T extends { x: number; z: number }>(xs: T[]) =>
    xs.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0] ?? null;
  const st = (id: StationId) => s.stations[id];
  const spot = (id: StationId) => spots.stations[id];

  // 1. Somebody is waiting to talk.
  for (const chain of openChains(s, ctx.tier)) {
    const m = currentOf(s, chain)!;
    if (m.goal.k === 'talk' && !s.missions.met.includes(m.id)) {
      const c = spots.cast[m.goal.who]!;
      return { x: c.x, z: c.z, actions: [{ t: 'talk', who: m.goal.who }], cost: COST.talk };
    }
  }

  // 2. Sort when the bag is heavy with litter.
  const pl = spot('punto_limpio');
  if (pl && (st('punto_limpio')?.lvl ?? 0) >= 1 && s.bag.residuos.length >= Math.min(8, bagFree(s) === 0 ? 1 : 8)) {
    const n = s.bag.residuos.length;
    // A plausible sorter gets about four in five right.
    const acts: GameAction[] = s.bag.residuos.map((w, i) => ({ t: 'sort', bin: i % 5 === 4 ? 'resto' : binOf(w) }));
    return { x: pl.x, z: pl.z, actions: acts, cost: COST.sort * n };
  }

  // 3. Producers: collect, then feed.
  for (const id of ['tanque', 'compostera', 'vivero'] as StationId[]) {
    const station = st(id);
    const where = spot(id);
    if (!station || station.lvl < 1 || !where) continue;
    const ready = station.out > 0 && (id !== 'tanque' || s.agua < waterCap(s));
    const r = rate(id, station.lvl);
    const per = STATIONS[id].makes?.per ?? 0;
    const room = r && per > 0 ? (r.cap - station.out) * per - station.queue : 0;
    const feedable = room >= per && (id === 'compostera' ? s.bag.hojas >= 3 : id === 'vivero' ? s.bag.frutos >= 2 : false);
    if (ready || feedable) {
      const acts: GameAction[] = [];
      if (id === 'vivero') acts.push({ t: 'vivero', plant: neededPlant(s, field, ctx) });
      if (ready) acts.push({ t: 'collect', station: id });
      if (feedable) acts.push({ t: 'feed', station: id });
      return { x: where.x, z: where.z, actions: acts, cost: COST.station };
    }
  }

  // 4. A build or upgrade that the bag can feed right now.
  for (const id of STATION_ORDER) {
    const where = spot(id);
    if (!where || STATIONS[id].tier > ctx.tier || !buildOpen(s, id)) continue;
    const lvl = st(id)?.lvl ?? 0;
    const cost = nextCost(id, lvl);
    if (!cost || (lvl >= 1 && balance(s) < (cost.semillas ?? 0) + 60)) continue;
    const paid = st(id)?.paid ?? {};
    const useful = Object.entries(cost).some(([k, v]) => k !== 'semillas' && (paid[k as 'ramas'] ?? 0) < (v ?? 0) && (s.bag[k as 'ramas'] ?? 0) > 0);
    if (useful) {
      const acts: GameAction[] = Array.from({ length: 40 }, () => ({ t: 'deliver', station: id }) as GameAction);
      return { x: where.x, z: where.z, actions: acts, cost: COST.deliver * 20 };
    }
  }

  // 5. Parcels, nearest useful first.
  const parcels = parcelsAt(field, ctx.tier).map((p) => ({ p, x: p.x, z: p.z }));
  const candidates: Step[] = [];
  for (const { p } of parcels) {
    const ps = s.parcels[p.id];
    const stage = ps?.s ?? 0;
    if (stage === 3 && s.agua > 0 && nx0(s, p, ctx).left > 0 && !ps!.wet.includes(dayIdx(ctx.day))) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'water', parcel: p.id }], cost: COST.parcel });
    else if (stage === 2 && fittingPlantines(s, p, ps!, ctx).length) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'plant', parcel: p.id }], cost: COST.parcel });
    else if (stage === 1 && s.bag[PARCEL_TYPES[parcelRegion(p, ps, ctx.tier)].soil] > 0) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'soil', parcel: p.id }], cost: COST.parcel });
    else if (stage >= 4 && careOf(s, field, p.id, ctx) && (careOf(s, field, p.id, ctx) !== 'sed' || s.agua > 0)) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'care', parcel: p.id }], cost: COST.parcel });
    else if (stage >= 4 && !careOf(s, field, p.id, ctx) && ripe(p.id, ctx) && !s.today.harvested.includes(p.id) && bagFree(s) > 1) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'harvest', parcel: p.id }], cost: COST.parcel });
    if (stage >= 4 && new Set(ps!.plants).size < 6 && fittingPlantines(s, p, ps!, ctx).some((x) => !ps!.plants.includes(x))) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'plant', parcel: p.id }], cost: COST.parcel });
    const nx = parcelNext(s, p, ctx);
    if (stage === 4 && nx.step === 'grow' && nx.daysLeft === 0 && new Set(ps!.plants).size >= 3 && fittingHabitats(s, p, ps!, ctx).length) candidates.push({ x: p.x, z: p.z, actions: [{ t: 'flourish', parcel: p.id }], cost: COST.parcel });
  }
  const best = near(candidates);
  if (best) return best;

  // 6. Buy what the parcels are waiting for.
  const buy = shopping(s, field, ctx);
  if (buy) return { x: px, z: pz, actions: [{ t: 'buy', slug: buy }], cost: COST.buy };
  for (const tool of ['mochila', 'regadera', 'guantes'] as const) {
    const lvl = s.tools[tool];
    const price = TOOLS[tool].prices[lvl - 1];
    const tt = TOOLS[tool].tiers[lvl - 1];
    if (price !== undefined && tt !== undefined && tt <= ctx.tier && balance(s) > price + 150) {
      return { x: px, z: pz, actions: [{ t: 'tool', tool }], cost: COST.buy };
    }
  }

  // 7. Wild parcels: their litter and their invasive.
  if (bagFree(s) > 0) {
    const wild: Step[] = [];
    for (const { p } of parcels) {
      const ps = s.parcels[p.id];
      if ((ps?.s ?? 0) !== 0) continue;
      for (const sp of parcelLitter(p, ps)) wild.push({ x: sp.x, z: sp.z, actions: [{ t: 'pickup', spawn: sp }], cost: COST.pickup });
      if (p.invasive && !ps?.inv) wild.push({ x: p.invasive[0], z: p.invasive[1], actions: [{ t: 'pull', parcel: p.id }], cost: COST.parcel });
    }
    const w = near(wild);
    if (w) return w;
  }

  // 8. Today's spawns.
  if (bagFree(s) > 0) {
    const left = daily.filter((sp) => !s.today.picked.includes(sp.id));
    const d = near(left.map((sp) => ({ ...sp })));
    if (d) {
      const sp = left.find((x) => x.id === d.id)!;
      return { x: sp.x, z: sp.z, actions: [{ t: 'pickup', spawn: sp }], cost: COST.pickup };
    }
  }
  // 9. A full backpack with nowhere to put it: sell the surplus to Don Beto.
  if (bagFree(s) === 0) {
    const raw = (['hojas', 'ramas', 'piedras', 'frutos'] as const).slice().sort((a, b) => s.bag[b] - s.bag[a])[0]!;
    if (s.bag[raw] > 0) return { x: px, z: pz, actions: [{ t: 'sell', material: raw, n: Math.ceil(s.bag[raw] / 2) }], cost: COST.buy };
  }
  return null;
}

function nx0(s: GameState, p: Parameters<typeof parcelNext>[1], ctx: GameContext): { left: number } {
  const n = parcelNext(s, p, ctx);
  return n.step === 'water' ? n : { left: 0 };
}

function dayIdx(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

function binOf(w: keyof typeof WASTE) {
  return WASTE[w].bin;
}

/** The plant most parcels are waiting for. */
function neededPlant(s: GameState, field: ParcelField, ctx: GameContext): string {
  const counts = new Map<string, number>();
  for (const p of parcelsAt(field, ctx.tier)) {
    const ps = s.parcels[p.id];
    if (!ps || (ps.s !== 2 && ps.s !== 4 && ps.s !== 1)) continue;
    for (const pl of plantsFor(parcelRegion(p, ps, ctx.tier), progressOf(ctx.tier, ctx.div))) {
      if (ps.s === 4 && ps.plants.includes(pl)) continue;
      counts.set(pl, (counts.get(pl) ?? 0) + 1);
    }
  }
  let best = 'flechilla';
  let n = -1;
  for (const [k, v] of counts) if (v > n) [best, n] = [k, v];
  return best;
}

/** A seedling packet when a planted-ready parcel has nothing to plant; a habitat when one is ready to flourish. */
function shopping(s: GameState, field: ParcelField, ctx: GameContext): string | null {
  for (const p of parcelsAt(field, ctx.tier)) {
    const ps = s.parcels[p.id];
    if (!ps) continue;
    const region = parcelRegion(p, ps, ctx.tier);
    if (ps.s === 2 && fittingPlantines(s, p, ps, ctx).length === 0) {
      const pick = plantsFor(region, progressOf(ctx.tier, ctx.div))[0];
      const item = SHOP.find((i) => i.plant === pick);
      if (item && balance(s) >= item.price + 40 && bagFree(s) > 0) return item.slug;
    }
    if (ps.s === 4 && new Set(ps.plants).size >= 3 && fittingHabitats(s, p, ps, ctx).length === 0) {
      for (const h of PARCEL_TYPES[region].habitats) {
        const item = SHOP.find((i) => i.slug === h);
        if (!item || item.tier > ctx.tier || balance(s) < item.price + 20) continue;
        const mats = Object.entries(item.mats ?? {}).every(([m, n]) => (s.bag[m as 'ramas'] ?? 0) >= (n ?? 0));
        if (mats) return item.slug;
      }
    }
    if (ps.s >= 4 && new Set(ps.plants).size < (ps.s === 5 ? 6 : 3)) {
      const missing = plantsFor(region, progressOf(ctx.tier, ctx.div)).find((pl) => !ps.plants.includes(pl) && !(s.bag.plantines[pl]));
      const item = SHOP.find((i) => i.plant === missing);
      if (item && balance(s) >= item.price + 60 && bagFree(s) > 0) return item.slug;
    }
  }
  return null;
}

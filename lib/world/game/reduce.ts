/**
 * The game's one door: `reduce(state, action, ctx, world)`.
 *
 * Pure — a copy in, a copy out, and the list of what happened. The scene
 * dispatches, the HUD reads, the tests and the 60-day simulation call it
 * directly. Every action first lets the clock catch up (a new day, stations
 * that worked while nobody looked), then does its one thing, then lets the
 * missions and the Guide see what happened.
 */
import type { RegionId } from '../types';
import { SPAWNS, SEMILLAS } from './config';
import { buildOpen, drawDailies, advanceMissions, talk, type MissionWorld } from './missions';
import { flourish, growAll, harvest, pickParcelLitter, plant, pull, soil, water } from './parcel-actions';
import { collect, deliverOne, feed, stationOf, tickAll, tryBuild } from './production';
import { SORT_YIELD, TOOLS, WASTE } from './materials';
import { discoveredAt, PARCEL_TYPES, PLANTS, progressOf } from './plants';
import { care, CARE, type CareKind } from './care';
import { SHOP_BY_SLUG } from './shop';
import { STATIONS } from './stations';
import type { Spawn } from './spawns';
import {
  bagFree, balance, bump, clone, earn, putPlantin, rollDay, spend, waterCap,
} from './state';
import { CARD_BY_ID, invasiveCard, plantCard, stationCard, wasteCard } from './texto/guia';
import type { BinId, GameContext, GameEvent, GameState, StationId, ToolId } from './types';

export type GameAction =
  | { t: 'tick' }
  | { t: 'pickup'; spawn: Spawn }
  | { t: 'pull'; parcel: string }
  | { t: 'sort'; bin: BinId }
  | { t: 'deliver'; station: StationId }
  | { t: 'deliverAll'; station: StationId }
  | { t: 'feed'; station: StationId }
  | { t: 'collect'; station: StationId }
  | { t: 'vivero'; plant: string }
  | { t: 'soil' | 'plant' | 'water' | 'harvest' | 'flourish'; parcel: string }
  | { t: 'fill' }
  | { t: 'buy'; slug: string }
  | { t: 'sell'; material: 'hojas' | 'ramas' | 'piedras' | 'frutos'; n: number }
  | { t: 'tool'; tool: ToolId }
  | { t: 'talk'; who: string }
  | { t: 'log'; species: string }
  | { t: 'fished'; species: string }
  | { t: 'forage' }
  | { t: 'visit'; region: RegionId }
  | { t: 'seen'; tier: number; div: number }
  | { t: 'care'; parcel: string };

export type GameWorld = MissionWorld;

export interface Reduced {
  state: GameState;
  events: GameEvent[];
}

/** A card, learned once. A little semillas for it: reading is playing too. */
export function learn(s: GameState, card: string, events: GameEvent[]): void {
  if (!CARD_BY_ID.has(card) || s.know.includes(card)) return;
  s.know.push(card);
  events.push({ type: 'learned', card });
  earn(s, 2, `card:${card}`, events);
}

function pickDaily(s: GameState, sp: Spawn, events: GameEvent[]): boolean {
  if (s.today.picked.includes(sp.id)) return false;
  if (bagFree(s) < 1) {
    events.push({ type: 'refused', why: 'bag_full' });
    return false;
  }
  let n = 1;
  if (sp.kind === 'residuos') s.bag.residuos.push(sp.waste ?? 'botella');
  else if (sp.kind === 'hojas') {
    n = Math.min(SPAWNS.leavesPerPile, bagFree(s));
    s.bag.hojas += n;
  } else s.bag[sp.kind] += 1;
  s.today.picked.push(sp.id);
  events.push({ type: 'pickup', material: sp.kind, waste: sp.waste, n });
  bump(s, `pick:${sp.kind}`, n);
  if (sp.kind === 'residuos') learn(s, 'k:plastico_mar', events);
  return true;
}

function sort(s: GameState, bin: BinId, events: GameEvent[]): boolean {
  const st = s.stations.punto_limpio;
  if (!st || st.lvl < 1) {
    events.push({ type: 'refused', why: 'locked' });
    return false;
  }
  const waste = s.bag.residuos.shift();
  if (!waste) {
    events.push({ type: 'refused', why: 'missing', need: { residuos: 1 } });
    return false;
  }
  const correct = WASTE[waste].bin;
  const right = bin === correct;
  // Whatever you chose, the piece ends up where it belongs: the point is the
  // line that says why, not a lost bottle.
  const y = SORT_YIELD[correct];
  if (y.material && y.material !== 'residuos' && y.material !== 'plantines') {
    const extra = correct === 'reciclable' && st.lvl >= 2 ? 2 : 1;
    s.bag[y.material] += extra;
  }
  if (right) earn(s, y.semillas * (st.lvl >= 3 ? 2 : 1), 'sort', events);
  events.push({ type: 'sorted', waste, bin, right });
  bump(s, 'sorted');
  if (right) bump(s, 'sorted:right');
  learn(s, wasteCard(waste), events);
  if ((s.stats.sorted ?? 0) >= 20) learn(s, 'k:reducir', events);
  return true;
}

function buy(s: GameState, slug: string, ctx: GameContext, events: GameEvent[]): boolean {
  const item = SHOP_BY_SLUG.get(slug);
  if (!item) return false;
  if (discoveredAt(item) > progressOf(ctx.tier, ctx.div)) {
    events.push({ type: 'refused', why: 'locked' });
    return false;
  }
  if (balance(s) < item.price) {
    events.push({ type: 'refused', why: 'poor', need: { semillas: item.price - balance(s) } });
    return false;
  }
  for (const [m, n] of Object.entries(item.mats ?? {})) {
    if ((s.bag[m as 'ramas'] ?? 0) < (n ?? 0)) {
      events.push({ type: 'refused', why: 'missing', need: { [m]: (n ?? 0) - (s.bag[m as 'ramas'] ?? 0) } });
      return false;
    }
  }
  if (item.kind === 'sobre' && bagFree(s) < 1) {
    events.push({ type: 'refused', why: 'bag_full' });
    return false;
  }
  spend(s, item.price);
  for (const [m, n] of Object.entries(item.mats ?? {})) s.bag[m as 'ramas'] -= n ?? 0;
  if (item.kind === 'sobre' && item.plant) putPlantin(s, item.plant, 1);
  else s.inv[slug] = (s.inv[slug] ?? 0) + 1;
  events.push({ type: 'bought', item: slug });
  bump(s, 'bought');
  if (slug === 'farol_solar') learn(s, 'k:energia_solar', events);
  return true;
}

function upgradeTool(s: GameState, tool: ToolId, ctx: GameContext, events: GameEvent[]): boolean {
  const def = TOOLS[tool];
  const lvl = s.tools[tool];
  const price = def.prices[lvl - 1];
  const tier = def.tiers[lvl - 1];
  if (price === undefined || tier === undefined) return false;
  if (tier > ctx.tier) {
    events.push({ type: 'refused', why: 'locked' });
    return false;
  }
  if (!spend(s, price)) {
    events.push({ type: 'refused', why: 'poor', need: { semillas: price - balance(s) } });
    return false;
  }
  s.tools[tool] = lvl + 1;
  events.push({ type: 'bought', item: `tool:${tool}` });
  return true;
}

/** Learning moments that belong to a thing happening for the first time. */
function lessons(s: GameState, events: GameEvent[]): void {
  for (const ev of [...events]) {
    if (ev.type === 'built' && ev.lvl === 1) learn(s, stationCard(ev.station), events);
    if (ev.type === 'pulled') {
      learn(s, 'k:invasoras', events);
      const r = s.parcels[ev.parcel]?.r;
      const inv = r ? INVASIVE_OF[r] : undefined;
      if (inv) learn(s, invasiveCard(inv), events);
    }
    if (ev.type === 'planted') {
      learn(s, 'k:nativas', events);
      learn(s, plantCard(ev.plant), events);
    }
    if (ev.type === 'watered') learn(s, 'k:regar_hora', events);
    if (ev.type === 'collected' && ev.material === 'compost') learn(s, 'k:compost_mezcla', events);
    if (ev.type === 'collected' && ev.material === 'agua') learn(s, 'k:lluvia', events);
    if (ev.type === 'stage' && ev.stage === 5) learn(s, 'k:diversidad', events);
    if (ev.type === 'cared') learn(s, CARE[ev.kind as CareKind].card, events);
  }
}

const INVASIVE_OF: Partial<Record<RegionId, string>> = Object.fromEntries(
  Object.values(PARCEL_TYPES).map((t) => [t.id, t.invasive]),
);

/** Species whose sighting also teaches something. */
const LOG_CARDS: Record<string, string> = {
  luciernaga: 'k:luciernagas', abeja_nativa: 'k:polinizadores', abejorro: 'k:polinizadores',
  mariposa_bandera: 'k:especialistas', huemul: 'k:huemul',
};

export function reduce(prev: GameState, action: GameAction, ctx: GameContext, world: GameWorld): Reduced {
  const s = clone(prev);
  const events: GameEvent[] = [];
  rollDay(s, ctx);
  drawDailies(s, ctx, world);
  tickAll(s, ctx.now);
  growAll(s, world.field, ctx, events);

  switch (action.t) {
    case 'tick':
      break;
    case 'pickup': {
      const sp = action.spawn;
      if (sp.parcel && sp.index !== undefined) pickParcelLitter(s, world.field, sp.parcel, sp.index, sp.waste ?? 'botella', ctx, events);
      else pickDaily(s, sp, events);
      break;
    }
    case 'pull':
      pull(s, world.field, action.parcel, ctx, events);
      break;
    case 'sort':
      sort(s, action.bin, events);
      break;
    case 'deliver': {
      if (!buildOpen(s, action.station)) break;
      const m = deliverOne(s, action.station, ctx, events);
      if (m) events.push({ type: 'delivered', station: action.station, material: m });
      tryBuild(s, action.station, ctx, events);
      break;
    }
    case 'deliverAll': {
      // Everything the bag has that the next level needs, then one try at building.
      if (!buildOpen(s, action.station)) {
        events.push({ type: 'refused', why: 'later' });
        break;
      }
      for (let k = 0; k < 400; k++) {
        const m = deliverOne(s, action.station, ctx, events);
        if (!m) break;
        events.push({ type: 'delivered', station: action.station, material: m });
      }
      tryBuild(s, action.station, ctx, events);
      break;
    }
    case 'feed':
      feed(s, action.station, ctx, events);
      break;
    case 'collect':
      collect(s, action.station, ctx, events);
      break;
    case 'vivero': {
      if (!PLANTS[action.plant] || discoveredAt(PLANTS[action.plant]!) > progressOf(ctx.tier, ctx.div)) break;
      stationOf(s, 'vivero').pick = action.plant;
      break;
    }
    case 'soil':
      soil(s, world.field, action.parcel, ctx, events);
      break;
    case 'plant':
      plant(s, world.field, action.parcel, ctx, events);
      break;
    case 'water':
      water(s, world.field, action.parcel, ctx, events);
      break;
    case 'harvest':
      harvest(s, world.field, action.parcel, ctx, events);
      break;
    case 'flourish':
      flourish(s, world.field, action.parcel, ctx, events);
      break;
    case 'fill': {
      const n = Math.max(0, waterCap(s) - s.agua);
      if (n > 0) {
        s.agua += n;
        events.push({ type: 'filled', n });
      }
      break;
    }
    case 'buy':
      buy(s, action.slug, ctx, events);
      break;
    case 'tool':
      upgradeTool(s, action.tool, ctx, events);
      break;
    case 'sell': {
      const n = Math.max(0, Math.min(Math.floor(action.n), s.bag[action.material]));
      if (n <= 0) break;
      s.bag[action.material] -= n;
      earn(s, Math.floor(n * SEMILLAS.sell[action.material]), 'sell', events);
      bump(s, 'sold', n);
      break;
    }
    case 'talk':
      talk(s, action.who, world, ctx, events);
      break;
    case 'log': {
      if (!s.census.includes(action.species)) {
        s.census.push(action.species);
        earn(s, SEMILLAS.census, 'census', events);
        const card = LOG_CARDS[action.species];
        if (card) learn(s, card, events);
      }
      events.push({ type: 'logged', species: action.species });
      break;
    }
    case 'fished':
      events.push({ type: 'fished', species: action.species });
      bump(s, 'fished');
      break;
    case 'forage': {
      // A calafate bush: berries for the vivero, as far as the backpack allows.
      const n = Math.min(2, bagFree(s));
      if (n <= 0) {
        events.push({ type: 'refused', why: 'bag_full' });
        break;
      }
      s.bag.frutos += n;
      events.push({ type: 'pickup', material: 'frutos', n });
      bump(s, 'foraged');
      break;
    }
    case 'visit':
      events.push({ type: 'visited', region: action.region });
      break;
    case 'seen':
      s.seen = { tier: Math.max(s.seen.tier, action.tier), div: action.div };
      break;
    case 'care':
      care(s, world.field, action.parcel, ctx, events);
      break;
  }

  lessons(s, events);
  if (action.t !== 'talk') advanceMissions(s, events, world, ctx);
  s.savedAt = ctx.now;
  return { state: s, events };
}

/** Is a station on this island yet? (Discovered by rank, and not necessarily built.) */
export function stationDiscovered(id: StationId, tier: number): boolean {
  return STATIONS[id].tier <= tier;
}

/**
 * Stations over time, and stations as building sites.
 *
 * **Production is a pure function of the clock.** A compostera loaded before
 * bed has its compost ready in the morning because `tick` counts the cycles
 * that fit between `since` and now — no timer ran, nothing was stored while the
 * tab was closed. The cap is what ends a day: a full compostera waits for you.
 */
import { MATERIALS } from './materials';
import { levelDef, nextCost, STATIONS, type Cost } from './stations';
import { bump, earn, spend, take, waterCap as capOfCan } from './state';
import type { BulkMaterial, GameContext, GameEvent, GameState, MaterialId, StationId, StationState } from './types';

export function stationOf(s: GameState, id: StationId): StationState {
  return (s.stations[id] ??= { lvl: 0, paid: {}, queue: 0, since: 0, out: 0 });
}

/** Seconds per output and output cap at the station's current level. */
export function rate(id: StationId, lvl: number): { secs: number; cap: number } | null {
  const def = levelDef(id, lvl);
  if (!def?.secs || !def.cap) return null;
  return { secs: def.secs, cap: def.cap };
}

/**
 * Advance one station to `now`. The tanque makes water from nothing (rain);
 * the others turn their queue into output, one cycle at a time, up to the cap.
 */
export function tickStation(st: StationState, id: StationId, now: number): void {
  const r = rate(id, st.lvl);
  const makes = STATIONS[id].makes;
  if (!r || !makes) return;
  const free = r.cap - st.out;
  const needsInput = makes.per > 0;
  const canMake = needsInput ? Math.min(free, Math.floor(st.queue / makes.per)) : free;
  if (canMake <= 0) {
    st.since = 0;
    return;
  }
  if (!st.since) {
    st.since = now;
    return;
  }
  const cycles = Math.min(canMake, Math.floor((now - st.since) / (r.secs * 1000)));
  if (cycles <= 0) return;
  st.out += cycles;
  if (needsInput) st.queue -= cycles * makes.per;
  const stillCan = needsInput ? Math.min(r.cap - st.out, Math.floor(st.queue / makes.per)) : r.cap - st.out;
  st.since = stillCan > 0 ? st.since + cycles * r.secs * 1000 : 0;
}

export function tickAll(s: GameState, now: number): void {
  for (const id of Object.keys(s.stations) as StationId[]) tickStation(s.stations[id]!, id, now);
}

/** Seconds until the next output, or null when idle or full. For the station panel. */
export function secondsToNext(st: StationState, id: StationId, now: number): number | null {
  const r = rate(id, st.lvl);
  if (!r || !st.since) return null;
  return Math.max(0, r.secs - (now - st.since) / 1000);
}

/**
 * Put inputs into a producer. Takes as many as the player has and the queue
 * can still turn into output before the cap — never more, so nothing is eaten.
 */
export function feed(s: GameState, id: StationId, ctx: GameContext, events: GameEvent[]): number {
  const st = stationOf(s, id);
  const makes = STATIONS[id].makes;
  const r = rate(id, st.lvl);
  if (!makes || makes.per <= 0 || !r) return 0;
  tickStation(st, id, ctx.now);
  const input = makes.input as BulkMaterial;
  const room = (r.cap - st.out) * makes.per - st.queue;
  const n = Math.max(0, Math.min(s.bag[input], room));
  if (n <= 0) return 0;
  s.bag[input] -= n;
  st.queue += n;
  if (!st.since) st.since = ctx.now;
  events.push({ type: 'deposited', station: id, material: makes.input, n });
  bump(s, `feed:${id}`, n);
  return n;
}

// ── Building and upgrading ─────────────────────────────────────────────────

/** What is still missing for the next level, material by material (semillas included). */
export function missingFor(st: StationState, cost: Cost): Partial<Record<MaterialId | 'semillas', number>> {
  const out: Partial<Record<MaterialId | 'semillas', number>> = {};
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'semillas') continue;
    const left = (v ?? 0) - (st.paid[k as MaterialId] ?? 0);
    if (left > 0) out[k as MaterialId] = left;
  }
  return out;
}

/**
 * One piece onto the pad (the "materials fly from the backpack" moment).
 * Returns the material delivered, or null when nothing the site needs is in
 * the bag. When the last piece lands and the semillas are there, it builds.
 */
export function deliverOne(s: GameState, id: StationId, ctx: GameContext, events: GameEvent[]): MaterialId | null {
  const st = stationOf(s, id);
  if (STATIONS[id].tier > ctx.tier) return null;
  const cost = nextCost(id, st.lvl);
  if (!cost) return null;
  const missing = missingFor(st, cost);
  for (const k of Object.keys(missing) as MaterialId[]) {
    if (k === 'residuos' || k === 'plantines') continue;
    if (take(s, k as BulkMaterial, 1)) {
      st.paid[k] = (st.paid[k] ?? 0) + 1;
      return k;
    }
  }
  return null;
}

/**
 * Finish the build if everything is paid. Semillas are taken at the end, in
 * one go, so walking away from a half-built site never costs any.
 */
export function tryBuild(s: GameState, id: StationId, ctx: GameContext, events: GameEvent[]): boolean {
  const st = stationOf(s, id);
  const cost = nextCost(id, st.lvl);
  if (!cost) return false;
  if (Object.keys(missingFor(st, cost)).length > 0) return false;
  if (cost.semillas && !spend(s, cost.semillas)) {
    events.push({ type: 'refused', why: 'poor', need: { semillas: cost.semillas } });
    return false;
  }
  tickStation(st, id, ctx.now);
  st.lvl += 1;
  st.paid = {};
  events.push({ type: 'built', station: id, lvl: st.lvl });
  bump(s, 'built');
  // Building is progress you can see; it pays a little, like a parcel stage does.
  earn(s, 6 + 6 * st.lvl, `built:${id}`, events);
  return true;
}

/** Collect what a station made. Water goes to the can; the rest to the bag, as far as it fits. */
export function collect(s: GameState, id: StationId, ctx: GameContext, events: GameEvent[]): number {
  const st = stationOf(s, id);
  const makes = STATIONS[id].makes;
  if (!makes) return 0;
  tickStation(st, id, ctx.now);
  if (st.out <= 0) {
    events.push({ type: 'refused', why: 'nothing_ready' });
    return 0;
  }
  let n = 0;
  if (makes.output === 'agua') {
    const cap = s.tools.regadera ? capOfCan(s) : 0;
    n = Math.max(0, Math.min(st.out, cap - s.agua));
    s.agua += n;
  } else if (makes.output === 'plantines') {
    // Made things go to the galpón, which has no limit.
    const plant = st.pick ?? 'flechilla';
    n = st.out;
    s.bag.plantines[plant] = (s.bag.plantines[plant] ?? 0) + n;
  } else {
    const m = makes.output as BulkMaterial;
    n = st.out;
    s.bag[m] += n;
  }
  if (n <= 0) {
    events.push({ type: 'refused', why: makes.output === 'agua' ? 'not_now' : 'bag_full' });
    return 0;
  }
  const wasFull = st.since === 0;
  st.out -= n;
  if (wasFull) tickStation(st, id, ctx.now);
  events.push({ type: 'collected', station: id, material: makes.output, n });
  bump(s, `made:${makes.output}`, n);
  return n;
}

/** A readable cost line: "4 ramas · 3 piedras · 120 semillas". */
export function costLine(cost: Cost): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    parts.push(k === 'semillas' ? `${v} semillas` : `${v} ${MATERIALS[k as MaterialId].short.toLowerCase()}`);
  }
  return parts.join(' · ');
}

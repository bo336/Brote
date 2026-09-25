/**
 * Working a parcel, stage by stage (`docs/MUNDO_JUEGO.md` §3.3).
 *
 *   0 silvestre  → pick up its litter, pull its invasive
 *   1 limpia     → feed it compost (stone, on the mountain)
 *   2 suelo vivo → plant seedlings that belong there
 *   3 plantada   → water it on two different days
 *   4 viva       → harvest daily; add species; set a habitat to flourish
 *   5 floreciente
 *
 * Every step is a refusal or a small visible change — never a failure. Wrong
 * plants are simply not offered (the card lists the ones that fit), because
 * "the right plant in the right place" is taught by the list, not by a loss.
 */
import { dayOf, earn, bump, bagFree } from './state';
import { hashInt } from '../rng';
import { PARCEL, SEMILLAS } from './config';
import { parcelRegion, soilMaterial, stageNeed, wildParcel, type ParcelField, type ParcelSpec } from './parcels';
import { PARCEL_TYPES, plantsFor, progressOf } from './plants';
import { careOf, MAX_SPECIES, starEarned, starsOf } from './care';
import { SHOP_BY_SLUG } from './shop';
import type { GameContext, GameEvent, GameState, ParcelStage, ParcelState, WasteKind } from './types';

export function parcelState(s: GameState, id: string): ParcelState {
  return (s.parcels[id] ??= wildParcel());
}

function spec(field: ParcelField, id: string, ctx: GameContext): ParcelSpec | null {
  const p = field.byId.get(id);
  return p && p.tier <= ctx.tier ? p : null;
}

/** Remember which region this parcel was first worked as. */
function claim(ps: ParcelState, p: ParcelSpec, ctx: GameContext): void {
  if (!ps.r) ps.r = parcelRegion(p, ps, ctx.tier);
}

export function advance(s: GameState, p: ParcelSpec, ps: ParcelState, to: ParcelStage, ctx: GameContext, events: GameEvent[]): void {
  ps.s = to;
  ps.n = 0;
  ps.at = ctx.now;
  ps.d = dayOf(ctx.day);
  const region = parcelRegion(p, ps, ctx.tier);
  events.push({ type: 'stage', parcel: p.id, region, stage: to });
  bump(s, `stage:${to}`);
  bump(s, `stage:${to}:${region}`);
  earn(s, SEMILLAS.stage[to] ?? 0, `stage:${to}`, events);
}

function stageZeroDone(p: ParcelSpec, ps: ParcelState): boolean {
  const all = (1 << p.litter.length) - 1;
  return (ps.lit & all) === all && (!p.invasive || ps.inv);
}

/** A piece of a wild parcel's own litter, into the bag. */
export function pickParcelLitter(
  s: GameState, field: ParcelField, id: string, index: number, waste: WasteKind, ctx: GameContext, events: GameEvent[],
): boolean {
  const p = spec(field, id, ctx);
  if (!p || index < 0 || index >= p.litter.length) return false;
  const ps = parcelState(s, id);
  if (ps.s > 0 || ps.lit & (1 << index)) return false;
  if (bagFree(s) < 1) {
    events.push({ type: 'refused', why: 'bag_full' });
    return false;
  }
  claim(ps, p, ctx);
  ps.lit |= 1 << index;
  s.bag.residuos.push(waste);
  events.push({ type: 'pickup', material: 'residuos', waste, n: 1 });
  bump(s, 'pick:residuos');
  if (stageZeroDone(p, ps)) advance(s, p, ps, 1, ctx, events);
  return true;
}

/** Pull the invasive. It goes to the compost pile — it is organic like anything else. */
export function pull(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const p = spec(field, id, ctx);
  if (!p?.invasive) return false;
  const ps = parcelState(s, id);
  if (ps.inv || ps.s > 0) return false;
  claim(ps, p, ctx);
  ps.inv = true;
  const got = Math.min(2, bagFree(s));
  s.bag.hojas += got;
  events.push({ type: 'pulled', parcel: id });
  if (got > 0) events.push({ type: 'pickup', material: 'hojas', n: got });
  bump(s, 'pulled');
  bump(s, `pulled:${ps.r}`);
  earn(s, SEMILLAS.pull, 'pull', events);
  if (stageZeroDone(p, ps)) advance(s, p, ps, 1, ctx, events);
  return true;
}

/** Stage 1 → 2: compost into the soil (or stone into the slope). */
export function soil(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const p = spec(field, id, ctx);
  const ps = s.parcels[id];
  if (!p || !ps || ps.s !== 1) return false;
  const region = parcelRegion(p, ps, ctx.tier);
  const m = soilMaterial(region);
  const need = stageNeed(p, region, 1) - ps.n;
  const n = Math.min(need, s.bag[m]);
  if (n <= 0) {
    events.push({ type: 'refused', why: 'missing', need: { [m]: need } });
    return false;
  }
  s.bag[m] -= n;
  ps.n += n;
  bump(s, `soil:${m}`, n);
  if (ps.n >= stageNeed(p, region, 1)) advance(s, p, ps, 2, ctx, events);
  return true;
}

/** The seedlings in the bag that this parcel accepts, most-needed species first. */
export function fittingPlantines(s: GameState, p: ParcelSpec, ps: ParcelState, ctx: GameContext): string[] {
  const region = parcelRegion(p, ps, ctx.tier);
  const ok = plantsFor(region, progressOf(ctx.tier, ctx.div));
  return ok
    .filter((pl) => (s.bag.plantines[pl] ?? 0) > 0)
    .sort((a, b) => Number(ps.plants.includes(a)) - Number(ps.plants.includes(b)));
}

/**
 * Stage 2 → 3: plant. At stage 4 the same verb adds a species the parcel does
 * not have yet — that is how it gets the diversity to flourish.
 */
export function plant(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const p = spec(field, id, ctx);
  const ps = s.parcels[id];
  if (!p || !ps || (ps.s !== 2 && ps.s < 4)) return false;
  const region = parcelRegion(p, ps, ctx.tier);
  const fitting = fittingPlantines(s, p, ps, ctx);
  if (fitting.length === 0) {
    events.push({ type: 'refused', why: 'missing', need: { plantines: 1 } });
    return false;
  }
  if (ps.s >= 4) {
    // Alive or flourishing: planting adds a species the parcel does not have.
    // At stage 5 each one past the third is a biodiversity star.
    const fresh = fitting.find((pl) => !ps.plants.includes(pl));
    if (!fresh || new Set(ps.plants).size >= MAX_SPECIES) {
      events.push({ type: 'refused', why: 'not_now' });
      return false;
    }
    const before = starsOf(ps);
    s.bag.plantines[fresh]! -= 1;
    if (s.bag.plantines[fresh]! <= 0) delete s.bag.plantines[fresh];
    ps.plants.push(fresh);
    events.push({ type: 'planted', parcel: id, plant: fresh, n: 1 });
    bump(s, 'planted');
    if (starsOf(ps) > before) starEarned(s, p, ps, events);
    return true;
  }
  let need = stageNeed(p, region, 2) - ps.n;
  let i = 0;
  while (need > 0 && fitting.length > 0) {
    const pl = fitting[i % fitting.length]!;
    if ((s.bag.plantines[pl] ?? 0) <= 0) {
      fitting.splice(i % fitting.length, 1);
      continue;
    }
    s.bag.plantines[pl]! -= 1;
    if (!ps.plants.includes(pl)) ps.plants.push(pl);
    ps.n += 1;
    need -= 1;
    events.push({ type: 'planted', parcel: id, plant: pl, n: 1 });
    bump(s, 'planted');
    i += 1;
  }
  for (const [k, v] of Object.entries(s.bag.plantines)) if (v <= 0) delete s.bag.plantines[k];
  if (ps.n >= stageNeed(p, region, 2)) advance(s, p, ps, 3, ctx, events);
  return true;
}

/** What growing takes here: waterings on different days, and days since planting. */
export function growNeed(p: ParcelSpec, ps: ParcelState | undefined, tier: number): { water: number; days: number } {
  return PARCEL_TYPES[parcelRegion(p, ps, tier)].grow;
}

/** Stage 3 → 4, once both the waterings and the days are there. Called by watering and by the clock. */
export function tryGrow(s: GameState, p: ParcelSpec, ps: ParcelState, ctx: GameContext, events: GameEvent[]): boolean {
  if (ps.s !== 3) return false;
  const need = growNeed(p, ps, ctx.tier);
  const days = dayOf(ctx.day) - (ps.d ?? dayOf(ctx.day));
  if (ps.wet.length < need.water || days < need.days) return false;
  advance(s, p, ps, 4, ctx, events);
  return true;
}

/** Every planted parcel whose time has come — the clock's half of growing. */
export function growAll(s: GameState, field: ParcelField, ctx: GameContext, events: GameEvent[]): void {
  for (const [id, ps] of Object.entries(s.parcels)) {
    if (ps.s !== 3) continue;
    const p = spec(field, id, ctx);
    if (p) tryGrow(s, p, ps, ctx, events);
  }
}

/** Stage 3: water, once per parcel per day. A wetland is never watered: it is wet. */
export function water(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const p = spec(field, id, ctx);
  const ps = s.parcels[id];
  if (!p || !ps || ps.s !== 3) return false;
  if (ps.wet.length >= growNeed(p, ps, ctx.tier).water) {
    events.push({ type: 'refused', why: 'not_now' });
    return false;
  }
  const today = dayOf(ctx.day);
  if (ps.wet.includes(today)) {
    events.push({ type: 'refused', why: 'already_today' });
    return false;
  }
  if (s.agua < 1) {
    events.push({ type: 'refused', why: 'missing', need: { agua: 1 } });
    return false;
  }
  s.agua -= 1;
  ps.wet.push(today);
  events.push({ type: 'watered', parcel: id });
  bump(s, 'watered');
  tryGrow(s, p, ps, ctx, events);
  return true;
}

/** Once a day, a living parcel gives frutos (and some organics). */
export function harvest(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const p = spec(field, id, ctx);
  const ps = s.parcels[id];
  if (!p || !ps || ps.s < 4) return false;
  if (s.today.harvested.includes(id)) {
    events.push({ type: 'refused', why: 'already_today' });
    return false;
  }
  // A parcel with something going on keeps its fruit until it is looked after.
  if (careOf(s, field, id, ctx)) {
    events.push({ type: 'refused', why: 'not_now' });
    return false;
  }
  if (!ripe(id, ctx)) {
    events.push({ type: 'refused', why: 'nothing_ready' });
    return false;
  }
  const want = (ps.s >= 5 ? PARCEL.fruitFlor : PARCEL.fruitViva) + (starsOf(ps) >= PARCEL.fruitStars ? 1 : 0);
  const n = Math.min(want, bagFree(s));
  if (n <= 0) {
    events.push({ type: 'refused', why: 'bag_full' });
    return false;
  }
  s.bag.frutos += n;
  const leaves = Math.min(PARCEL.harvestLeaves, bagFree(s));
  s.bag.hojas += leaves;
  s.today.harvested.push(id);
  events.push({ type: 'harvested', parcel: id, n });
  events.push({ type: 'pickup', material: 'frutos', n });
  bump(s, 'harvested');
  earn(s, SEMILLAS.harvest, 'harvest', events);
  return true;
}

/** Every other day, on the parcel's own rhythm, a living parcel has fruit. */
export function ripe(id: string, ctx: GameContext): boolean {
  return (dayOf(ctx.day) + (hashInt(`ripe:${id}`) & 1)) % 2 === 0;
}

/** Habitat items in the inventory that would make this parcel flourish. */
export function fittingHabitats(s: GameState, p: ParcelSpec, ps: ParcelState, ctx: GameContext): string[] {
  const region = parcelRegion(p, ps, ctx.tier);
  return PARCEL_TYPES[region].habitats.filter((h) => (s.inv[h] ?? 0) > 0 && (SHOP_BY_SLUG.get(h)?.tier ?? 99) <= ctx.tier);
}

/** Stage 4 → 5: enough species and a habitat that suits the place. */
export function flourish(s: GameState, field: ParcelField, id: string, ctx: GameContext, events: GameEvent[]): boolean {
  const p = spec(field, id, ctx);
  const ps = s.parcels[id];
  if (!p || !ps || ps.s !== 4) return false;
  if (dayOf(ctx.day) - (ps.d ?? 0) < PARCEL.flourishAfterDays) {
    events.push({ type: 'refused', why: 'not_now' });
    return false;
  }
  if (new Set(ps.plants).size < PARCEL.flourishSpecies) {
    events.push({ type: 'refused', why: 'missing', need: { plantines: PARCEL.flourishSpecies - new Set(ps.plants).size } });
    return false;
  }
  const hab = fittingHabitats(s, p, ps, ctx)[0];
  if (!hab) {
    events.push({ type: 'refused', why: 'missing' });
    return false;
  }
  s.inv[hab]! -= 1;
  if (s.inv[hab]! <= 0) delete s.inv[hab];
  ps.hab = hab;
  advance(s, p, ps, 5, ctx, events);
  return true;
}

/** What the parcel asks for next, for its marker and the objective card. */
export type ParcelNext =
  | { step: 'clean'; left: number }
  | { step: 'soil'; material: 'compost' | 'piedras'; left: number }
  | { step: 'plant'; left: number; fits: string[] }
  | { step: 'water'; left: number; today: boolean; daysLeft: number }
  | { step: 'grow'; species: number; need: number; habitats: string[]; daysLeft: number }
  | { step: 'done'; stars: number; species: number };

export function parcelNext(s: GameState, p: ParcelSpec, ctx: GameContext): ParcelNext {
  const ps = s.parcels[p.id];
  const stage = ps?.s ?? 0;
  const region = parcelRegion(p, ps, ctx.tier);
  switch (stage) {
    case 0: {
      let left = 0;
      p.litter.forEach((_, i) => {
        if (!ps || !(ps.lit & (1 << i))) left += 1;
      });
      if (p.invasive && !ps?.inv) left += 1;
      return { step: 'clean', left };
    }
    case 1:
      return { step: 'soil', material: soilMaterial(region), left: stageNeed(p, region, 1) - (ps?.n ?? 0) };
    case 2:
      return { step: 'plant', left: stageNeed(p, region, 2) - (ps?.n ?? 0), fits: plantsFor(region, progressOf(ctx.tier, ctx.div)) };
    case 3: {
      const need = PARCEL_TYPES[region].grow;
      const since = dayOf(ctx.day) - (ps?.d ?? dayOf(ctx.day));
      return {
        step: 'water', left: Math.max(0, need.water - (ps?.wet.length ?? 0)),
        today: !!ps?.wet.includes(dayOf(ctx.day)), daysLeft: Math.max(0, need.days - since),
      };
    }
    case 4: {
      const since = dayOf(ctx.day) - (ps?.d ?? dayOf(ctx.day));
      return {
        step: 'grow', species: new Set(ps?.plants ?? []).size, need: PARCEL.flourishSpecies,
        habitats: PARCEL_TYPES[region].habitats, daysLeft: Math.max(0, PARCEL.flourishAfterDays - since),
      };
    }
    default:
      return { step: 'done', stars: starsOf(ps), species: new Set(ps?.plants ?? []).size };
  }
}

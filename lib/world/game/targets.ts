/**
 * "What should I do now, and where?" — for the mission card and the beacon.
 *
 * One mission at a time: the first open chapter of the story (lowest rank
 * first), otherwise the first unfinished daily, otherwise the most useful
 * thing on the island (something ripe, something thirsty, a wild parcel).
 * Its target is resolved to a real place near Pip, so the beacon never points
 * at an abstraction.
 */
import { regionCentre } from '../regions';
import type { RegionId } from '../types';
import { careOf } from './care';
import { currentOf, DAILY_BY_ID, openChains, progressOf, type MissionWorld, type Target } from './missions';
import { fittingPlantines, parcelNext, ripe } from './parcel-actions';
import { parcelRegion, parcelsAt, soilMaterial, wildParcel, type ParcelSpec } from './parcels';
import { INVASIVES, PARCEL_TYPES } from './plants';
import type { Spawn } from './spawns';
import type { GameSpots } from './spots';
import { MATERIALS, WASTE } from './materials';
import { missingFor } from './production';
import { nextCost, STATIONS } from './stations';
import { CHAINS } from './texto/cadenas';
import { castName } from './texto/guia';
import type { BulkMaterial, GameContext, GameState, MaterialId, StationId } from './types';

export interface MissionView {
  /** Chain mission id, `daily:<id>`, or `free`. */
  id: string;
  kind: 'story' | 'daily' | 'free';
  who: string | null;
  eyebrow: string;
  title: string;
  ask: string;
  progress: { done: number; total: number } | null;
  target: { x: number; z: number; id: string } | null;
  /** What is missing for it, when the bag cannot do it yet: "Te faltan 2 ramas". */
  need?: string | null;
}

interface Where {
  pip: { x: number; z: number };
  spawns: readonly Spawn[];
  spots: GameSpots;
  /** Where each character is standing right now. */
  cast: ReadonlyMap<string, { x: number; z: number }>;
  /** Where water can be taken (the tanque, the charco, the lagoon), by interactable id. */
  water: readonly { x: number; z: number; id: string }[];
  /** Interactables whose id starts with this, for census and fishing spots. */
  find?: (prefix: string) => readonly { x: number; z: number; id: string }[];
}

function nearest<T extends { x: number; z: number }>(list: readonly T[], p: { x: number; z: number }): T | null {
  let best: T | null = null;
  let d = Infinity;
  for (const it of list) {
    const k = (it.x - p.x) ** 2 + (it.z - p.z) ** 2;
    if (k < d) {
      d = k;
      best = it;
    }
  }
  return best;
}

export function resolveTarget(
  t: Target, s: GameState, w: MissionWorld, ctx: GameContext, at: Where,
): { x: number; z: number; id: string } | null {
  switch (t.to) {
    case 'spawn': {
      const hit = nearest(at.spawns.filter((sp) => sp.kind === t.kind), at.pip);
      return hit ? { x: hit.x, z: hit.z, id: hit.id } : null;
    }
    case 'station': {
      const spot = at.spots.stations[t.id];
      if (!spot || STATIONS[t.id].tier > ctx.tier) return null;
      // Nothing to bring yet: the beacon goes to what is missing, not to the empty pad.
      return detourFor(s, w, ctx, t.id, at)?.target ?? { x: spot.x, z: spot.z, id: `game-station-${t.id}` };
    }
    case 'cast': {
      const c = at.cast.get(t.who);
      return c ? { x: c.x, z: c.z, id: `game-cast-${t.who}` } : null;
    }
    case 'water': {
      const hit = nearest(at.water, at.pip);
      return hit ? { x: hit.x, z: hit.z, id: hit.id } : null;
    }
    case 'region': {
      const [x, z] = regionCentre(t.id);
      return { x, z, id: `region-${t.id}` };
    }
    case 'species': {
      const hit = nearest(at.find?.(`log-${t.slug}`) ?? [], at.pip);
      if (hit) return hit;
      const [x, z] = regionCentre(t.region);
      return { x, z, id: `region-${t.region}` };
    }
    case 'fish': {
      const hit = nearest(at.find?.('fish-') ?? [], at.pip);
      if (hit) return hit;
      const [x, z] = regionCentre('rio');
      return { x, z, id: 'region-rio' };
    }
    case 'parcel':
    case 'grow': {
      const hit = pickParcel(t, s, w, ctx, at);
      if (!hit) return null;
      const stage = s.parcels[hit.id]?.s ?? 0;
      // A wild parcel is worked at its litter and its invasive, not its stake.
      if (stage === 0) {
        const piece = hit.litter.find((_, i) => !((s.parcels[hit.id]?.lit ?? 0) & (1 << i)));
        if (piece) return { x: piece[0], z: piece[1], id: `game-parcel-${hit.id}` };
        if (hit.invasive && !s.parcels[hit.id]?.inv) return { x: hit.invasive[0], z: hit.invasive[1], id: `game-invasive-${hit.id}` };
      }
      // Nothing to do there yet: first go and get what it needs.
      return parcelDetour(s, w, ctx, hit, at)?.target ?? { x: hit.x, z: hit.z, id: `game-parcel-${hit.id}` };
    }
    case 'none':
      return null;
  }
}

type Place = { x: number; z: number; id: string };

/** A planted parcel already watered today waits for tomorrow; everything else has something to do. */
function actionable(s: GameState, p: ParcelSpec, ctx: GameContext): boolean {
  if ((s.parcels[p.id]?.s ?? 0) !== 3) return true;
  const n = parcelNext(s, p, ctx);
  return n.step === 'water' && n.left > 0 && !n.today;
}

/**
 * Which parcel a parcel mission means. `parcel`: the nearest at that stage
 * with something to do (any at that stage, if none has). `grow`: the most
 * advanced one still short of the goal — finish what you started before
 * clearing more wild ground.
 */
function pickParcel(t: Extract<Target, { to: 'parcel' | 'grow' }>, s: GameState, w: MissionWorld, ctx: GameContext, at: Where): ParcelSpec | null {
  const inRegion = (p: ParcelSpec) => !t.region || parcelRegion(p, s.parcels[p.id], ctx.tier) === t.region;
  const stageOf = (p: ParcelSpec) => s.parcels[p.id]?.s ?? 0;
  const all = parcelsAt(w.field, ctx.tier).filter(inRegion);
  if (t.to === 'parcel') {
    const at0 = all.filter((p) => stageOf(p) === t.stage);
    return nearest(at0.filter((p) => actionable(s, p, ctx)), at.pip) ?? nearest(at0, at.pip);
  }
  const short = all.filter((p) => stageOf(p) < t.stage);
  for (let stage = t.stage - 1; stage >= 0; stage--) {
    const hit = nearest(short.filter((p) => stageOf(p) === stage && actionable(s, p, ctx)), at.pip);
    if (hit) return hit;
  }
  return nearest(short, at.pip);
}

/** Where the nearest `k` can be had: off the ground, or from the station that makes it. */
function sourceOf(k: MaterialId, s: GameState, w: MissionWorld, ctx: GameContext, at: Where): Place | null {
  const station = (id: StationId): Place | null => {
    const spot = at.spots.stations[id];
    return spot ? { x: spot.x, z: spot.z, id: `game-station-${id}` } : null;
  };
  const ground = (kind: Spawn['kind']): Place | null => {
    const hit = nearest(at.spawns.filter((sp) => sp.kind === kind), at.pip);
    return hit ? { x: hit.x, z: hit.z, id: hit.id } : null;
  };
  switch (k) {
    case 'ramas': {
      // Off the ground, or out of a woody invasive still standing in a wild parcel.
      const hit = ground('ramas');
      if (hit) return hit;
      const woody = parcelsAt(w.field, ctx.tier).filter((p) => p.invasive && !s.parcels[p.id]?.inv
        && (s.parcels[p.id]?.s ?? 0) === 0 && INVASIVES[PARCEL_TYPES[parcelRegion(p, s.parcels[p.id], ctx.tier)].invasive]?.woody);
      const tree = nearest(woody.map((p) => ({ x: p.invasive![0], z: p.invasive![1], id: `game-invasive-${p.id}` })), at.pip);
      return tree;
    }
    case 'piedras':
    case 'hojas':
    case 'residuos':
      return ground(k);
    case 'reciclado':
      // Recycled material comes out of sorting: sort what you carry, or pick some up first.
      return s.bag.residuos.some((w) => WASTE[w].bin === 'reciclable') ? station('punto_limpio') : ground('residuos');
    case 'compost':
      return station('compostera');
    default:
      return null;
  }
}

/**
 * A station mission the bag cannot do yet — a build short of materials, a
 * producer with nothing to load — sends Pip to the first missing thing, and
 * the card says what it is. Without it the beacon points at an empty pad and
 * the player stands on it wondering why nothing happens.
 */
function detourFor(s: GameState, w: MissionWorld, ctx: GameContext, id: StationId, at: Where): { target: Place; need: string } | null {
  const st = s.stations[id] ?? { lvl: 0, paid: {}, queue: 0, since: 0, out: 0 };
  const cost = nextCost(id, st.lvl);
  if (st.lvl < 1 && cost) {
    for (const [k, n] of Object.entries(missingFor(st, cost)) as [MaterialId, number][]) {
      const have = k === 'residuos' ? s.bag.residuos.length : k === 'plantines' ? 0 : s.bag[k as BulkMaterial] ?? 0;
      if (have >= n) continue;
      const route = sourceOf(k, s, w, ctx, at);
      if (!route) continue;
      const short = n - have;
      return { target: route, need: `Te ${short === 1 ? 'falta' : 'faltan'} ${short} ${MATERIALS[k].short.toLowerCase()}` };
    }
    return null;
  }
  const makes = STATIONS[id].makes;
  if (st.lvl >= 1 && makes && makes.per > 0 && st.out <= 0 && st.queue <= 0 && (s.bag[makes.input as BulkMaterial] ?? 0) === 0) {
    const route = sourceOf(makes.input, s, w, ctx, at);
    if (route) return { target: route, need: `Juntá ${MATERIALS[makes.input].short.toLowerCase()}` };
  }
  return null;
}

/**
 * A parcel mission the bag cannot do yet sends Pip to what it lacks: compost
 * from the compostera (or stones off the ground, on the mountain), seedlings
 * from the vivero, water for the can. The same rule as a build's.
 */
function parcelDetour(s: GameState, w: MissionWorld, ctx: GameContext, p: ParcelSpec, at: Where): { target: Place; need: string } | null {
  const ps = s.parcels[p.id] ?? wildParcel();
  if (ps.s === 1) {
    const m = soilMaterial(parcelRegion(p, ps, ctx.tier));
    if ((s.bag[m] ?? 0) > 0) return null;
    const route = m === 'compost' && (s.stations.compostera?.lvl ?? 0) < 1 ? null : sourceOf(m, s, w, ctx, at);
    return route ? { target: route, need: m === 'compost' ? 'Primero, compost de la compostera' : 'Primero, piedras del suelo' } : null;
  }
  if (ps.s === 2 && fittingPlantines(s, p, ps, ctx).length === 0) {
    const v = at.spots.stations.vivero;
    if (v && (s.stations.vivero?.lvl ?? 0) >= 1) return { target: { x: v.x, z: v.z, id: 'game-station-vivero' }, need: 'Primero, plantines del vivero' };
    return null;
  }
  if (ps.s === 3 && s.agua <= 0) {
    const hit = nearest(at.water, at.pip);
    return hit ? { target: { x: hit.x, z: hit.z, id: hit.id }, need: 'Primero, cargá la regadera' } : null;
  }
  return null;
}

/** The card's "what is missing" line for a mission's target. */
function needFor(t: Target, s: GameState, w: MissionWorld, ctx: GameContext, at: Where): string | null {
  if (t.to === 'station') return detourFor(s, w, ctx, t.id, at)?.need ?? null;
  if (t.to === 'parcel' || t.to === 'grow') {
    const p = pickParcel(t, s, w, ctx, at);
    return p ? parcelDetour(s, w, ctx, p, at)?.need ?? null : null;
  }
  return null;
}

/** The one thing the card shows. */
export function missionView(s: GameState, w: MissionWorld, ctx: GameContext, at: Where): MissionView {
  for (const chain of openChains(s, ctx.tier)) {
    const m = currentOf(s, chain);
    if (!m) continue;
    const [done, total] = progressOf(m, s, w, ctx.tier);
    const region = CHAINS[chain]!.region;
    return {
      id: m.id, kind: 'story', who: m.who,
      eyebrow: `${castName(m.who)} · ${REGION_NAME[region]}`,
      title: m.title, ask: m.ask,
      progress: total > 1 ? { done, total } : null,
      target: resolveTarget(m.target, s, w, ctx, at),
      need: needFor(m.target, s, w, ctx, at),
    };
  }
  const d = s.missions.daily;
  if (d.day === ctx.day) {
    const i = d.ids.findIndex((_, k) => !d.claimed[k]);
    const def = i >= 0 ? DAILY_BY_ID.get(d.ids[i]!) : undefined;
    if (def) {
      const n = def.n(ctx.tier);
      return {
        id: `daily:${def.id}`, kind: 'daily', who: null,
        eyebrow: `Del día · ${d.claimed.filter(Boolean).length} de ${d.ids.length}`,
        title: def.title.replace('{n}', String(n)), ask: '',
        progress: n > 1 ? { done: d.prog[i] ?? 0, total: n } : null,
        target: resolveTarget(def.target, s, w, ctx, at),
      };
    }
  }
  return { ...freeView(s, w, ctx, at) };
}

const REGION_NAME: Record<RegionId, string> = {
  claro: 'El Claro', pradera: 'La Pradera', jardin: 'El Jardín', arboleda: 'La Arboleda', rio: 'El Río',
  monte: 'El Monte', cumbre: 'La Cumbre', islote: 'El Islote', monumento: 'El Monumento',
};

/** Nothing asked for: the most useful thing on the island right now. */
function freeView(s: GameState, w: MissionWorld, ctx: GameContext, at: Where): MissionView {
  const parcels = parcelsAt(w.field, ctx.tier);
  const base = { id: 'free', kind: 'free' as const, who: null, eyebrow: 'Tu isla', progress: null };
  const cared = parcels.filter((p) => careOf(s, w.field, p.id, ctx));
  const c = nearest(cared, at.pip);
  if (c) return { ...base, title: 'Una parcela necesita cuidado', ask: '', target: { x: c.x, z: c.z, id: `game-parcel-${c.id}` } };
  const thirsty = parcels.filter((p) => {
    const n = parcelNext(s, p, ctx);
    return n.step === 'water' && n.left > 0 && !n.today;
  });
  const t = nearest(thirsty, at.pip);
  if (t) return { ...base, title: 'Hay algo para regar', ask: '', target: { x: t.x, z: t.z, id: `game-parcel-${t.id}` } };
  const fruit = parcels.filter((p) => (s.parcels[p.id]?.s ?? 0) >= 4 && ripe(p.id, ctx) && !s.today.harvested.includes(p.id));
  const f = nearest(fruit, at.pip);
  if (f) return { ...base, title: 'Hay frutos para cosechar', ask: '', target: { x: f.x, z: f.z, id: `game-parcel-${f.id}` } };
  const wild = parcels.filter((p) => (s.parcels[p.id]?.s ?? 0) < 4);
  const g = nearest(wild, at.pip);
  if (g) return { ...base, title: 'Seguí restaurando la isla', ask: '', target: { x: g.x, z: g.z, id: `game-parcel-${g.id}` } };
  return { ...base, title: 'Tu isla está en flor', ask: 'Tu nivel real descubre más lugares y especies.', target: null };
}

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
import { missingFor, rate } from './production';
import { nextCost, STATIONS } from './stations';
import { SPECIES_BY_SLUG } from '../species';
import { PLACE_NAME } from './discoveries';
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
      return detourFor(s, w, ctx, t.id, at, t.load)?.target ?? { x: spot.x, z: spot.z, id: `game-station-${t.id}` };
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

/** How much input a producer can still take before it is full. */
function loadRoom(st: { lvl: number; out: number; queue: number }, id: StationId): number {
  const r = rate(id, st.lvl);
  const per = STATIONS[id].makes?.per ?? 0;
  return r && per > 0 ? (r.cap - st.out) * per - st.queue : 0;
}

/**
 * How many organics a producer still lacks before it can make the next unit:
 * 0 when something is ready, one is on its way, or the bag has enough to load.
 * Otherwise the beacon would point at it forever — a compostera with three of
 * the four organics it needs never makes anything by itself.
 */
function inputShort(s: GameState, id: StationId): number {
  const st = s.stations[id];
  const makes = STATIONS[id].makes;
  if (!st || st.lvl < 1 || !makes || makes.per <= 0 || st.out > 0 || st.queue >= makes.per) return 0;
  return Math.max(0, makes.per - st.queue - (s.bag[makes.input as BulkMaterial] ?? 0));
}

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
    case 'residuos':
      return ground(k);
    case 'hojas':
      // Organic waste already in the bag becomes organics at the Punto Limpio;
      // otherwise a leaf pile, or any litter (some of it is organic).
      if (s.bag.residuos.some((x) => WASTE[x].bin === 'organico')) return station('punto_limpio');
      return ground('hojas') ?? ground('residuos');
    case 'reciclado':
      // Recycled material comes out of sorting: sort what you carry, or pick some up first.
      return s.bag.residuos.some((w) => WASTE[w].bin === 'reciclable') ? station('punto_limpio') : ground('residuos');
    case 'compost':
      // Short of organics for the next batch: those first. Organic waste in the
      // bag becomes organics at the Punto Limpio.
      if (inputShort(s, 'compostera') > 0) return sourceOf('hojas', s, w, ctx, at) ?? station('compostera');
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
function detourFor(s: GameState, w: MissionWorld, ctx: GameContext, id: StationId, at: Where, load = false): { target: Place; need: string } | null {
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
  // Loading is the job: an empty bag goes for more, whatever is cooking —
  // unless the station is full and has to be emptied first.
  if (load && makes && makes.per > 0 && st.lvl >= 1 && (s.bag[makes.input as BulkMaterial] ?? 0) === 0 && loadRoom(st, id) > 0) {
    const route = sourceOf(makes.input, s, w, ctx, at);
    const [, many] = WORD[makes.input] ?? ['', MATERIALS[makes.input].short.toLowerCase()];
    if (route) return { target: route, need: `Juntá más ${many}` };
  }
  const short = inputShort(s, id);
  if (makes && short > 0) {
    const route = sourceOf(makes.input, s, w, ctx, at);
    if (route) return { target: route, need: shortLine(short, makes.input, makes.output) };
  }
  return null;
}

const WORD: Partial<Record<MaterialId, [string, string]>> = { hojas: ['orgánico', 'orgánicos'], frutos: ['fruto', 'frutos'] };
const NEXT: Partial<Record<string, string>> = { compost: 'el próximo compost', plantines: 'los próximos plantines' };

/** "Te faltan 2 orgánicos para el próximo compost." */
function shortLine(n: number, input: MaterialId, output: string): string {
  const [one, many] = WORD[input] ?? [MATERIALS[input].short.toLowerCase(), MATERIALS[input].short.toLowerCase()];
  return `Te ${n === 1 ? 'falta' : 'faltan'} ${n} ${n === 1 ? one : many} para ${NEXT[output] ?? 'la próxima tanda'}`;
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
    if (!route) return null;
    if (m !== 'compost') return { target: route, need: 'Primero, piedras del suelo' };
    const short = inputShort(s, 'compostera');
    const st = s.stations.compostera;
    const cooking = !!st && st.out <= 0 && st.queue >= (STATIONS.compostera.makes?.per ?? 1);
    const need = short > 0 ? shortLine(short, 'hojas', 'compost') : cooking ? COOKING : 'Primero, compost de la compostera';
    return { target: route, need };
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

/** The need line of a story step that is only waiting for the compost to be done. */
const COOKING = 'El compost está en camino';

/** The card's "what is missing" line for a mission's target. */
function needFor(t: Target, s: GameState, w: MissionWorld, ctx: GameContext, at: Where): string | null {
  if (t.to === 'station') return detourFor(s, w, ctx, t.id, at, t.load)?.need ?? null;
  if (t.to === 'parcel' || t.to === 'grow') {
    const p = pickParcel(t, s, w, ctx, at);
    return p ? parcelDetour(s, w, ctx, p, at)?.need ?? null : null;
  }
  return null;
}

/**
 * What the thing at a target is, in two or three words, for the pin that hangs
 * over it (`hud/WorldLabels.tsx`): the card says the mission, the pin says what
 * you will find where it points.
 */
export function targetName(id: string): string {
  const station = /^game-station-(.+)$/.exec(id);
  if (station) return STATIONS[station[1] as StationId]?.name ?? 'Estación';
  const cast = /^game-cast-(.+)$/.exec(id);
  if (cast) return castName(cast[1]!);
  if (id.startsWith('game-invasive-')) return 'Invasora para arrancar';
  if (id.startsWith('game-parcel-')) return 'Tu parcela';
  if (id.startsWith('game-water-')) return 'Agua para la regadera';
  const log = /^log-(.+)$/.exec(id);
  if (log) return SPECIES_BY_SLUG.get(log[1]!)?.name_es ?? 'Una especie';
  if (id.startsWith('fish-')) return 'Para pescar';
  const region = /^region-(.+)$/.exec(id);
  if (region) return PLACE_NAME[region[1] as RegionId] ?? 'Por acá';
  if (/:l:\d+$/.test(id) || /:r:\d+$/.test(id)) return 'Basura';
  if (/:h:\d+$/.test(id)) return 'Orgánicos';
  if (/:b:\d+$/.test(id)) return 'Ramas';
  if (/:s:\d+$/.test(id)) return 'Piedras';
  return '';
}

/** The one thing the card shows. */
export function missionView(s: GameState, w: MissionWorld, ctx: GameContext, at: Where): MissionView {
  for (const chain of openChains(s, ctx.tier)) {
    const m = currentOf(s, chain);
    if (!m) continue;
    const [done, total] = progressOf(m, s, w, ctx.tier);
    const region = CHAINS[chain]!.region;
    const need = needFor(m.target, s, w, ctx, at);
    // A step that only waits for the clock hands the card to something to do
    // meanwhile, and takes it back when the compost is out. Standing at the
    // compostera for six minutes on the first day is not a game.
    if (need === COOKING) {
      const side = meanwhile(s, w, ctx, at);
      if (side) return side;
    }
    return {
      id: m.id, kind: 'story', who: m.who,
      eyebrow: `${castName(m.who)} · ${REGION_NAME[region]}`,
      title: m.title, ask: m.ask,
      progress: total > 1 ? { done, total } : null,
      target: resolveTarget(m.target, s, w, ctx, at),
      need,
    };
  }
  return dailyView(s, w, ctx, at) ?? freeView(s, w, ctx, at);
}

/** The first unfinished daily, if today has one. */
function dailyView(s: GameState, w: MissionWorld, ctx: GameContext, at: Where): MissionView | null {
  const d = s.missions.daily;
  if (d.day !== ctx.day) return null;
  const i = d.ids.findIndex((_, k) => !d.claimed[k]);
  const def = i >= 0 ? DAILY_BY_ID.get(d.ids[i]!) : undefined;
  if (!def) return null;
  const n = def.n(ctx.tier);
  return {
    id: `daily:${def.id}`, kind: 'daily', who: null,
    eyebrow: `Del día · ${d.claimed.filter(Boolean).length} de ${d.ids.length}`,
    title: def.title.replace('{n}', String(n)), ask: '',
    progress: n > 1 ? { done: d.prog[i] ?? 0, total: n } : null,
    target: resolveTarget(def.target, s, w, ctx, at),
  };
}

/** While the compost works: a daily, or the next wild parcel to clean. */
function meanwhile(s: GameState, w: MissionWorld, ctx: GameContext, at: Where): MissionView | null {
  const ask = 'Cuando esté el compost, la tarjeta te lleva de vuelta.';
  const daily = dailyView(s, w, ctx, at);
  if (daily?.target) return { ...daily, eyebrow: `Mientras el compost trabaja · ${daily.eyebrow}`, ask };
  const target = resolveTarget({ to: 'parcel', stage: 0 }, s, w, ctx, at);
  if (!target) return null;
  return {
    id: 'free:meanwhile', kind: 'free', who: null, eyebrow: 'Mientras el compost trabaja',
    title: 'Limpiá otra parcela', ask, progress: null, target,
  };
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

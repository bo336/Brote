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
import { parcelNext, ripe } from './parcel-actions';
import { parcelRegion, parcelsAt } from './parcels';
import type { Spawn } from './spawns';
import type { GameSpots } from './spots';
import { STATIONS } from './stations';
import { CHAINS } from './texto/cadenas';
import { castName } from './texto/guia';
import type { GameContext, GameState } from './types';

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
}

interface Where {
  pip: { x: number; z: number };
  spawns: readonly Spawn[];
  spots: GameSpots;
  /** Where each character is standing right now. */
  cast: ReadonlyMap<string, { x: number; z: number }>;
  /** Where water can be taken (the tanque, the charco, the lagoon). */
  water: readonly { x: number; z: number }[];
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
      return spot && STATIONS[t.id].tier <= ctx.tier ? { x: spot.x, z: spot.z, id: `game-station-${t.id}` } : null;
    }
    case 'cast': {
      const c = at.cast.get(t.who);
      return c ? { x: c.x, z: c.z, id: `game-cast-${t.who}` } : null;
    }
    case 'water': {
      const hit = nearest(at.water, at.pip);
      return hit ? { x: hit.x, z: hit.z, id: 'game-water' } : null;
    }
    case 'region': {
      const [x, z] = regionCentre(t.id);
      return { x, z, id: `region-${t.id}` };
    }
    case 'parcel': {
      const list = parcelsAt(w.field, ctx.tier).filter((p) => {
        const ps = s.parcels[p.id];
        if ((ps?.s ?? 0) !== t.stage) return false;
        if (t.region && parcelRegion(p, ps, ctx.tier) !== t.region) return false;
        if (t.stage === 3) {
          const n = parcelNext(s, p, ctx);
          return n.step === 'water' && n.left > 0 && !n.today;
        }
        return true;
      });
      const hit = nearest(list, at.pip) ?? nearest(parcelsAt(w.field, ctx.tier).filter((p) => (s.parcels[p.id]?.s ?? 0) === t.stage), at.pip);
      if (!hit) return null;
      // A wild parcel is worked at its litter and its invasive, not its stake.
      if (t.stage === 0) {
        const piece = hit.litter.find((_, i) => !((s.parcels[hit.id]?.lit ?? 0) & (1 << i)));
        if (piece) return { x: piece[0], z: piece[1], id: `game-parcel-${hit.id}` };
        if (hit.invasive && !s.parcels[hit.id]?.inv) return { x: hit.invasive[0], z: hit.invasive[1], id: `game-invasive-${hit.id}` };
      }
      return { x: hit.x, z: hit.z, id: `game-parcel-${hit.id}` };
    }
    case 'none':
      return null;
  }
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

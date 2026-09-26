/**
 * What the Descubrir axis reveals, step by step: each rank tier and each of its
 * five divisions (`docs/MUNDO_JUEGO.md` §3.8).
 *
 * Derived from the catalogues — the ladder, the plants, the stations, the shop
 * and the Bitácora — so nothing here can drift from what the game actually
 * gates. It feeds the "Tu camino" tab (what you have, what comes next) and the
 * "Descubriste" card of the rank-up ceremony.
 */
import { unlocksFor } from '../progression';
import { SPECIES } from '../species';
import type { RegionId } from '../types';
import { PLANTS } from './plants';
import { SHOP } from './shop';
import { STATIONS } from './stations';

export interface Discovery {
  kind: 'lugar' | 'planta' | 'estacion' | 'objeto' | 'especie';
  name: string;
  /** One line: what it is for. */
  note?: string;
  color?: string;
}

export const PLACE_NAME: Record<RegionId, string> = {
  claro: 'El Claro', pradera: 'La Pradera', jardin: 'El Jardín', arboleda: 'La Arboleda', rio: 'El Río y la Laguna',
  monte: 'El Monte', cumbre: 'La Cumbre nevada', islote: 'El Islote', monumento: 'El Monumento',
};

const FEATURE_NAME: Partial<Record<string, string>> = {
  puddle: 'El charco', river: 'El río', pond: 'La laguna', mountain: 'La montaña', snow: 'La nieve',
  treehouse: 'La casa del árbol', islet: 'El islote', monument: 'El monumento', cave: 'La cueva', aurora: 'La aurora',
};

/** Everything that arrives exactly at (tier, div). */
export function discoveriesAt(tier: number, div: number): Discovery[] {
  const out: Discovery[] = [];
  const d = (x: { div?: number }) => (x.div ?? 1) === div;
  if (div === 1) {
    const u = unlocksFor(tier);
    for (const r of u.regions) out.push({ kind: 'lugar', name: PLACE_NAME[r], note: 'La isla crece hasta acá.' });
    for (const f of u.features) {
      const name = FEATURE_NAME[f];
      if (name && !u.regions.some((r) => PLACE_NAME[r].toLowerCase().includes(name.toLowerCase().replace('el ', '').replace('la ', '')))) {
        out.push({ kind: 'lugar', name });
      }
    }
    for (const st of Object.values(STATIONS)) if (st.tier === tier && tier > 1) out.push({ kind: 'estacion', name: st.name, note: st.does });
  }
  for (const p of Object.values(PLANTS)) if (p.tier === tier && d(p)) out.push({ kind: 'planta', name: p.name, note: p.role, color: p.color });
  for (const i of SHOP) {
    if (i.kind === 'sobre' || i.tier !== tier || !d(i)) continue;
    out.push({ kind: 'objeto', name: i.name, note: i.desc });
  }
  if (div === 1) {
    for (const s of SPECIES) {
      if (s.min_tier !== tier || PLANTS[s.slug]) continue;
      out.push({ kind: 'especie', name: s.name_es });
    }
  }
  return out;
}

/** Everything a tier reveals, division by division. */
export function tierPath(tier: number): { div: number; items: Discovery[] }[] {
  return [1, 2, 3, 4, 5].map((div) => ({ div, items: discoveriesAt(tier, div) })).filter((x) => x.items.length > 0);
}

'use client';

import { useState } from 'react';
import { Lock, Sprout } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MATERIALS, TOOLS, TOOL_ORDER, toolValue } from '@/lib/world/game/materials';
import { discoveredAt, PLANTS, progressOf } from '@/lib/world/game/plants';
import { SHOP, type ShopItem, type ShopKind } from '@/lib/world/game/shop';
import { balance } from '@/lib/world/game/state';
import type { MaterialId } from '@/lib/world/game/types';
import { useGameStore } from '../../useGameStore';
import { useGameUi } from '../../useGameUi';
import { useSessionStore } from '../../../state/useSessionStore';

/**
 * La Tienda — el almacén de Don Beto.
 *
 * World semillas only (they are earned only by playing and spent only here).
 * The whole catalogue is visible: what your real rank has not discovered yet
 * shows its lock and when it opens, so the Tienda is also a map of what is
 * coming. Nothing rotates, nothing expires, nothing is random.
 */
type Section = 'herramientas' | ShopKind;
const SECTIONS: Section[] = ['herramientas', 'sobre', 'habitat', 'decor'];

function mats(item: ShopItem): string {
  return Object.entries(item.mats ?? {}).map(([k, n]) => `${n} ${MATERIALS[k as MaterialId].short.toLowerCase()}`).join(' · ');
}

export function Tienda() {
  const t = useTranslations('mundo.juego.tienda');
  const when = (tier: number, div: number | undefined) =>
    div && div > 1 ? t('seDescubreDiv', { tier, div }) : t('seDescubre', { tier });
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const ctx = useGameStore.getState().ctx();
  const [section, setSection] = useState<Section>('sobre');
  if (!state || !ctx) return null;
  const prog = progressOf(ctx.tier, ctx.div);
  const money = balance(state);
  const items = SHOP.filter((i) => i.kind === section).sort((a, b) => discoveredAt(a) - discoveredAt(b) || a.price - b.price);

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-snug text-brote-cream/65">
        {t.rich('saldo', { n: money, b: (chunks) => <span className="tnum font-bold text-brote-sun">{chunks}</span> })}
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${section === id ? 'bg-brote-cream text-brote-ink' : 'bg-white/10 text-brote-cream/80'}`}
          >
            {t(`secciones.${id}`)}
          </button>
        ))}
      </div>

      {section === 'herramientas' ? (
        <ul className="space-y-2">
          {TOOL_ORDER.map((tool) => {
            const def = TOOLS[tool];
            const lvl = state.tools[tool];
            const price = def.prices[lvl - 1];
            const tier = def.tiers[lvl - 1];
            const locked = tier !== undefined && tier > ctx.tier;
            return (
              <li key={tool} className="rounded-2xl bg-white/5 p-3.5">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-[15px] font-semibold text-brote-cream">{def.name}</p>
                  <p className="tnum text-[12px] text-brote-cream/60">{t('nivel', { lvl, value: toolValue(tool, lvl), unit: def.unit })}</p>
                </div>
                <p className="mt-0.5 text-[12.5px] text-brote-cream/65">{def.what}</p>
                {price === undefined ? (
                  <p className="mt-2 text-[12px] text-brote-green">{t('maximo')}</p>
                ) : (
                  <button
                    type="button"
                    disabled={locked || money < price}
                    onClick={() => dispatch({ t: 'tool', tool })}
                    className="mt-2 w-full rounded-full bg-brote-sun px-4 py-2 text-[13px] font-bold text-brote-ink disabled:bg-white/10 disabled:text-brote-cream/40"
                  >
                    {locked ? when(tier!, 1) : t('mejorar', { value: toolValue(tool, lvl + 1), unit: def.unit, price })}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => {
            const locked = discoveredAt(item) > prog + 1e-9;
            const owned = state.inv[item.slug] ?? 0;
            const plant = item.plant ? PLANTS[item.plant] : null;
            const missing = Object.entries(item.mats ?? {}).some(([k, n]) => (state.bag[k as 'ramas'] ?? 0) < (n ?? 0));
            return (
              <li key={item.slug} className={`rounded-2xl p-3.5 ${locked ? 'bg-white/[0.03]' : 'bg-white/5'}`}>
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: locked ? 'rgba(255,255,255,0.06)' : `${plant?.color ?? '#C9A45C'}33` }}>
                    {locked ? <Lock className="h-4 w-4 text-brote-cream/40" aria-hidden /> : <Sprout className="h-4 w-4" style={{ color: plant?.color ?? '#C9A45C' }} aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-display text-[14.5px] font-semibold ${locked ? 'text-brote-cream/45' : 'text-brote-cream'}`}>{item.name}</p>
                    <p className="text-[12px] leading-snug text-brote-cream/60">{plant ? plant.role : item.desc}</p>
                    {owned > 0 && <p className="mt-0.5 text-[11.5px] text-brote-green">{t('tenes', { n: owned })}</p>}
                  </div>
                </div>
                {locked ? (
                  <p className="mt-2 text-[11.5px] text-brote-cream/45">{when(item.tier, item.div)} {t('conAcciones')}</p>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={money < item.price || missing}
                      onClick={() => dispatch({ t: 'buy', slug: item.slug })}
                      className="flex-1 rounded-full bg-brote-sun px-3 py-1.5 text-[12.5px] font-bold text-brote-ink disabled:bg-white/10 disabled:text-brote-cream/40"
                    >
                      {item.mats ? t('precioMats', { price: item.price, mats: mats(item) }) : t('precio', { price: item.price })}
                    </button>
                    {owned > 0 && item.kind !== 'sobre' && (
                      <button
                        type="button"
                        onClick={() => {
                          useGameUi.getState().close();
                          useSessionStore.getState().setHud('placement');
                        }}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-brote-cream"
                      >
                        {t('colocar')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

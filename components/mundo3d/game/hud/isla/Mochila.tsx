'use client';

import { Droplet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SEMILLAS } from '@/lib/world/game/config';
import { MATERIALS, TOOLS, TOOL_ORDER, toolValue, WASTE } from '@/lib/world/game/materials';
import { PLANTS } from '@/lib/world/game/plants';
import { SHOP_BY_SLUG } from '@/lib/world/game/shop';
import { bagCap, bagCount, waterCap } from '@/lib/world/game/state';
import type { WasteKind } from '@/lib/world/game/types';
import { useGameStore } from '../../useGameStore';

/**
 * What you carry and what you have made.
 *
 * The **mochila** is only what you picked up off the ground, and it has a
 * limit — the reason to walk to a station. The **galpón** is what you made
 * (compost, recycled material, seedlings) and what you bought: no limit, usable
 * from anywhere. Surplus raw material can always be sold to Don Beto, cheaply:
 * a full backpack is never a dead end.
 */
function Row({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-[13.5px] text-brote-cream">{label}</span>
      <span className="tnum text-[13.5px] font-semibold text-brote-cream">{value}</span>
    </li>
  );
}

export function Mochila() {
  const t = useTranslations('mundo.juego.mochila');
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  if (!state) return null;
  const used = bagCount(state.bag);
  const cap = bagCap(state);
  const waste = state.bag.residuos.reduce<Partial<Record<WasteKind, number>>>((acc, w) => ({ ...acc, [w]: (acc[w] ?? 0) + 1 }), {});
  const plantines = Object.entries(state.bag.plantines).filter(([, n]) => n > 0);
  const owned = Object.entries(state.inv).filter(([, n]) => n > 0);

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">{t('titulo')}</h3>
          <span className="tnum text-[12px] text-brote-cream/70">{t('deTotal', { used, cap })}</span>
        </div>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${used >= cap ? 'bg-brote-coral' : 'bg-brote-green'}`} style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} />
        </div>
        <ul className="space-y-1.5">
          <Row label={t('residuos')} value={state.bag.residuos.length} color={MATERIALS.residuos.color} />
          {(['hojas', 'ramas', 'piedras', 'frutos'] as const).map((m) => (
            <li key={m} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: MATERIALS[m].color }} />
              <span className="flex-1 text-[13.5px] text-brote-cream">{MATERIALS[m].name}</span>
              <span className="tnum text-[13.5px] font-semibold text-brote-cream">{state.bag[m]}</span>
              {state.bag[m] > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch({ t: 'sell', material: m, n: state.bag[m] })}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-brote-cream active:scale-95"
                  title={t('venderHint', { n: SEMILLAS.sell[m] })}
                >
                  {t('vender')}
                </button>
              )}
            </li>
          ))}
        </ul>
        {state.bag.residuos.length > 0 && (
          <p className="mt-2 text-[11.5px] leading-snug text-brote-cream/55">
            {Object.entries(waste).map(([k, n]) => `${n} ${WASTE[k as WasteKind].name.toLowerCase()}`).join(' · ')}.
            {' '}{t('separarEn')}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">{t('galpon')}</h3>
        <ul className="space-y-1.5">
          <Row label={MATERIALS.compost.name} value={state.bag.compost} color={MATERIALS.compost.color} />
          <Row label={MATERIALS.reciclado.name} value={state.bag.reciclado} color={MATERIALS.reciclado.color} />
          {plantines.map(([k, n]) => <Row key={k} label={t('plantin', { name: PLANTS[k]?.name.toLowerCase() ?? k })} value={n} color={PLANTS[k]?.color ?? '#5FA84A'} />)}
          {owned.map(([k, n]) => <Row key={k} label={SHOP_BY_SLUG.get(k)?.name ?? k} value={n} color="#C9A45C" />)}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">{t('herramientas')}</h3>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
            <Droplet className="h-4 w-4 text-brote-aqua" aria-hidden />
            <span className="flex-1 text-[13.5px] text-brote-cream">{t('agua')}</span>
            <span className="tnum text-[13.5px] font-semibold text-brote-cream">{t('deTotal', { used: state.agua, cap: waterCap(state) })}</span>
          </li>
          {TOOL_ORDER.map((tool) => (
            <li key={tool} className="rounded-xl bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between text-[13.5px] text-brote-cream">
                <span>{t('herramienta', { name: TOOLS[tool].name, n: state.tools[tool] })}</span>
                <span className="tnum font-semibold">{toolValue(tool, state.tools[tool])} {TOOLS[tool].unit}</span>
              </div>
              <p className="text-[11.5px] text-brote-cream/55">{TOOLS[tool].what}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

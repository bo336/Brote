'use client';

import { Droplet } from 'lucide-react';

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
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">Mochila</h3>
          <span className="tnum text-[12px] text-brote-cream/70">{used} de {cap}</span>
        </div>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${used >= cap ? 'bg-brote-coral' : 'bg-brote-green'}`} style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} />
        </div>
        <ul className="space-y-1.5">
          <Row label="Residuos para separar" value={state.bag.residuos.length} color={MATERIALS.residuos.color} />
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
                  title={`Don Beto paga ${SEMILLAS.sell[m]} semilla por unidad`}
                >
                  Vender
                </button>
              )}
            </li>
          ))}
        </ul>
        {state.bag.residuos.length > 0 && (
          <p className="mt-2 text-[11.5px] leading-snug text-brote-cream/55">
            {Object.entries(waste).map(([k, n]) => `${n} ${WASTE[k as WasteKind].name.toLowerCase()}`).join(' · ')}.
            Se separan en el Punto Limpio.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">Galpón</h3>
        <ul className="space-y-1.5">
          <Row label="Compost" value={state.bag.compost} color={MATERIALS.compost.color} />
          <Row label="Material reciclado" value={state.bag.reciclado} color={MATERIALS.reciclado.color} />
          {plantines.map(([k, n]) => <Row key={k} label={`Plantín de ${PLANTS[k]?.name.toLowerCase() ?? k}`} value={n} color={PLANTS[k]?.color ?? '#5FA84A'} />)}
          {owned.map(([k, n]) => <Row key={k} label={SHOP_BY_SLUG.get(k)?.name ?? k} value={n} color="#C9A45C" />)}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">Herramientas</h3>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
            <Droplet className="h-4 w-4 text-brote-aqua" aria-hidden />
            <span className="flex-1 text-[13.5px] text-brote-cream">Agua en la regadera</span>
            <span className="tnum text-[13.5px] font-semibold text-brote-cream">{state.agua} de {waterCap(state)}</span>
          </li>
          {TOOL_ORDER.map((t) => (
            <li key={t} className="rounded-xl bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between text-[13.5px] text-brote-cream">
                <span>{TOOLS[t].name} · nivel {state.tools[t]}</span>
                <span className="tnum font-semibold">{toolValue(t, state.tools[t])} {TOOLS[t].unit}</span>
              </div>
              <p className="text-[11.5px] text-brote-cream/55">{TOOLS[t].what}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

'use client';

import { Check, Sun } from 'lucide-react';

import { currentOf, DAILY_BY_ID, openChains, progressOf } from '@/lib/world/game/missions';
import { parcelsAt } from '@/lib/world/game/parcels';
import { CHAINS, CHAIN_ORDER } from '@/lib/world/game/texto/cadenas';
import { castName } from '@/lib/world/game/texto/guia';
import { useGameStore } from '../../useGameStore';

/**
 * The missions tab: where the island stands on both axes, the story's open
 * chapters, and today's three.
 *
 * The two bars at the top are the whole design in one glance: *Descubierto* is
 * how much of the island your real rank has revealed; *Cuidado* is how much of
 * that your play has restored. One alone never fills the other.
 */
const REGION: Record<string, string> = {
  claro: 'El Claro', pradera: 'La Pradera', jardin: 'El Jardín', arboleda: 'La Arboleda', rio: 'El Río',
  monte: 'El Monte', cumbre: 'La Cumbre', islote: 'El Islote', monumento: 'El Monumento',
};

function Bar({ label, value, total, hint, color }: { label: string; value: number; total: number; hint: string; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px] text-brote-cream/80">
        <span className="font-semibold text-brote-cream">{label}</span>
        <span className="tnum">{value} de {total}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-brote-cream/60">{hint}</p>
    </div>
  );
}

export function Misiones() {
  const state = useGameStore((s) => s.state);
  const field = useGameStore((s) => s.field);
  const ctx = useGameStore.getState().ctx();
  if (!state || !field || !ctx) return null;

  const all = field.parcels.length;
  const found = parcelsAt(field, ctx.tier);
  const alive = found.filter((p) => (state.parcels[p.id]?.s ?? 0) >= 4).length;
  const open = openChains(state, ctx.tier);
  const daily = state.missions.daily;

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl bg-white/5 p-4">
        <Bar
          label="Descubierto" value={found.length} total={all} color="#5B6CF0"
          hint="Lo abre tu nivel en Brote, con acciones reales: lugares, especies, estaciones."
        />
        <Bar
          label="Cuidado" value={alive} total={found.length} color="#1FB57A"
          hint="Lo hace crecer jugar: parcelas vivas de todo lo que ya descubriste."
        />
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">La historia</h3>
        {open.length === 0 && (
          <p className="text-[13px] text-brote-cream/70">
            Terminaste todos los capítulos que tu nivel abrió. El próximo llega con tu próximo nivel en Brote.
          </p>
        )}
        <ul className="space-y-2">
          {open.map((chain) => {
            const m = currentOf(state, chain)!;
            const [done, total] = progressOf(m, state, { field }, ctx.tier);
            const index = state.missions.chain[chain] ?? 0;
            return (
              <li key={chain} className="rounded-2xl bg-white/5 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brote-cream/55">
                  {REGION[CHAINS[chain]!.region]} · capítulo {index + 1} de {CHAINS[chain]!.missions.length} · {castName(m.who)}
                </p>
                <p className="mt-0.5 font-display text-[15px] font-semibold text-brote-cream">{m.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-brote-cream/75">{m.ask}</p>
                {total > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-brote-sun" style={{ width: `${Math.round((done / total) * 100)}%` }} />
                    </div>
                    <span className="tnum text-[11px] text-brote-cream/60">{done}/{total}</span>
                  </div>
                )}
                {m.reward.sem > 0 && <p className="mt-1.5 text-[11.5px] text-brote-sun">Recompensa: {m.reward.sem} semillas</p>}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11.5px] text-brote-cream/50">
          {CHAIN_ORDER.filter((c) => CHAINS[c]!.tier > ctx.tier).length > 0
            ? `${CHAIN_ORDER.filter((c) => CHAINS[c]!.tier > ctx.tier).length} capítulos más se abren con tu nivel en Brote.`
            : 'Todos los lugares de la isla están descubiertos.'}
        </p>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">
          <Sun className="h-3.5 w-3.5" aria-hidden /> Las de hoy
        </h3>
        <ul className="space-y-2">
          {daily.ids.map((id, i) => {
            const def = DAILY_BY_ID.get(id);
            if (!def) return null;
            const n = def.n(ctx.tier);
            const got = Math.min(n, daily.prog[i] ?? 0);
            const doneIt = daily.claimed[i];
            return (
              <li key={id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3.5 py-2.5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${doneIt ? 'bg-brote-green text-white' : 'bg-white/10 text-brote-cream/60'}`}>
                  {doneIt ? <Check className="h-4 w-4" aria-hidden /> : <span className="tnum text-[11px]">{i + 1}</span>}
                </span>
                <span className={`flex-1 text-[13.5px] ${doneIt ? 'text-brote-cream/60 line-through' : 'text-brote-cream'}`}>
                  {def.title.replace('{n}', String(n))}
                </span>
                {!doneIt && n > 1 && <span className="tnum text-[12px] text-brote-cream/60">{got}/{n}</span>}
                <span className="tnum text-[12px] font-semibold text-brote-sun">+12</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11.5px] text-brote-cream/55">
          {daily.bonus ? 'Hiciste las tres. Mañana hay nuevas.' : 'Las tres juntas dan 30 semillas más. Cambian cada día.'}
        </p>
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MATERIALS } from '@/lib/world/game/materials';
import { costLine, missingFor, rate, secondsToNext, tickStation } from '@/lib/world/game/production';
import { discoveredAt, PLANTS, progressOf } from '@/lib/world/game/plants';
import { nextCost, STATIONS } from '@/lib/world/game/stations';
import { balance, waterCap } from '@/lib/world/game/state';
import type { MaterialId, StationId } from '@/lib/world/game/types';
import { useGameStore } from '../useGameStore';
import { useGameUi } from '../useGameUi';

/**
 * A station's panel: what it is doing, what is ready, what to load, the one
 * lesson it teaches, and what the next level costs.
 *
 * A bottom card rather than a full sheet: the station stays visible above it,
 * which is where the eye should be — you are standing at it.
 */
type T = ReturnType<typeof useTranslations<'mundo.juego'>>;

function mmss(s: number, t: T): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m > 0 ? t('estacion.min', { m, s: r.toString().padStart(2, '0') }) : t('estacion.seg', { s: r });
}

export function StationSheet() {
  const t = useTranslations('mundo.juego');
  const screen = useGameUi((s) => s.screen);
  const close = useGameUi((s) => s.close);
  const state = useGameStore((s) => s.state);
  const dispatch = useGameStore((s) => s.dispatch);
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (screen?.kind !== 'estacion' || !state) return null;
  const id: StationId = screen.station;
  const def = STATIONS[id];
  const st = { ...(state.stations[id] ?? { lvl: 0, paid: {}, queue: 0, since: 0, out: 0 }) };
  tickStation(st, id, Date.now());
  const r = rate(id, st.lvl);
  const makes = def.makes;
  const next = secondsToNext(st, id, Date.now());
  const cost = nextCost(id, st.lvl);
  const ctx = useGameStore.getState().ctx();
  const prog = ctx ? progressOf(ctx.tier, ctx.div) : 1;
  const inputName = makes && makes.per > 0 ? MATERIALS[makes.input].short.toLowerCase() : '';
  const outputName = makes ? (makes.output === 'agua' ? t('estacion.agua') : MATERIALS[makes.output].short.toLowerCase()) : '';
  const canFeed = makes && makes.per > 0 && r ? state.bag[makes.input as 'hojas'] > 0 && (r.cap - st.out) * makes.per - st.queue > 0 : false;
  const plants = Object.values(PLANTS).filter((p) => discoveredAt(p) <= prog + 1e-9);
  const missing = cost ? missingFor(st, cost) : {};
  const readyToUpgrade = cost && Object.keys(missing).length === 0 && balance(state) >= (cost.semillas ?? 0);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[78vh] overflow-y-auto rounded-t-3xl bg-brote-ink/95 px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 text-brote-cream shadow-soft-lg backdrop-blur-md">
      <div className="mx-auto max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brote-sun">{t('estacion.nivelDe', { lvl: st.lvl })}</p>
            <h2 className="font-display text-[22px] font-bold">{def.name}</h2>
          </div>
          <button type="button" onClick={close} aria-label={t('cerrar')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-brote-cream/75">{def.does}</p>

        {makes && r && (
          <section className="mt-4 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13.5px]">
                <span className="tnum text-[22px] font-bold text-brote-sun">{st.out}</span>
                <span className="text-brote-cream/70">{t('estacion.listo', { cap: r.cap, what: outputName })}</span>
              </p>
              <button
                type="button"
                disabled={st.out <= 0 || (makes.output === 'agua' && state.agua >= waterCap(state))}
                onClick={() => dispatch({ t: 'collect', station: id })}
                className="rounded-full bg-brote-sun px-4 py-2 text-[13px] font-bold text-brote-ink disabled:bg-white/10 disabled:text-brote-cream/40"
              >
                {makes.output === 'agua' ? t('estacion.cargarRegadera') : t('estacion.retirar')}
              </button>
            </div>
            {makes.per > 0 && (
              <>
                <p className="mt-2 text-[12.5px] text-brote-cream/65">
                  {st.queue > 0 && st.queue < makes.per && next === null
                    ? t('estacion.espera', { n: makes.per - st.queue, have: st.queue, input: inputName })
                    : st.queue > 0
                    ? next !== null
                      ? t('estacion.trabajandoProx', { n: Math.floor(st.queue / makes.per), t: mmss(next, t) })
                      : t('estacion.trabajando', { n: Math.floor(st.queue / makes.per) })
                    : t('estacion.vacia', { per: makes.per, input: inputName, output: outputName })}
                </p>
                <button
                  type="button"
                  disabled={!canFeed}
                  onClick={() => dispatch({ t: 'feed', station: id })}
                  className="mt-2 w-full rounded-full bg-brote-green px-4 py-2 text-[13px] font-bold text-white disabled:bg-white/10 disabled:text-brote-cream/40"
                >
                  {t('estacion.cargar', { input: inputName, n: state.bag[makes.input as 'hojas'] })}
                </button>
              </>
            )}
            {makes.per === 0 && next !== null && (
              <p className="mt-2 text-[12.5px] text-brote-cream/65">{t('estacion.lluvia', { t: mmss(next, t) })}</p>
            )}
          </section>
        )}

        {id === 'vivero' && st.lvl >= 1 && (
          <section className="mt-3">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">{t('estacion.queCrias')}</p>
            <div className="flex flex-wrap gap-1.5">
              {plants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => dispatch({ t: 'vivero', plant: p.id })}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${(st.pick ?? 'flechilla') === p.id ? 'bg-brote-cream text-brote-ink' : 'bg-white/10 text-brote-cream/80'}`}
                >
                  <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="mt-4 border-l-2 border-brote-sun/70 pl-3 text-[13px] italic leading-snug text-brote-cream/80">{def.teaches}</p>

        {cost ? (
          <section className="mt-4 rounded-2xl bg-white/5 p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brote-sun">{t('estacion.nivel', { n: st.lvl + 1 })}</p>
            <p className="mt-0.5 text-[13px] text-brote-cream/80">{def.levels[st.lvl]?.gain}</p>
            <p className="mt-1 text-[12.5px] text-brote-cream/60">{costLine(cost)}</p>
            {Object.keys(missing).length > 0 && (
              <p className="mt-1 text-[12px] text-brote-cream/50">
                {t('estacion.falta', { what: Object.entries(missing).map(([k, n]) => `${n} ${MATERIALS[k as MaterialId].short.toLowerCase()}`).join(' · ') })}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => dispatch({ t: 'deliverAll', station: id })}
                className="flex-1 rounded-full bg-white/10 px-4 py-2 text-[13px] font-semibold"
              >
                {t('estacion.entregar')}
              </button>
              <button
                type="button"
                disabled={!readyToUpgrade}
                onClick={() => dispatch({ t: 'deliverAll', station: id })}
                className="flex-1 rounded-full bg-brote-sun px-4 py-2 text-[13px] font-bold text-brote-ink disabled:bg-white/10 disabled:text-brote-cream/40"
              >
                {t('estacion.mejorar')}
              </button>
            </div>
          </section>
        ) : (
          <p className="mt-4 text-[12.5px] text-brote-green">{t('estacion.maximo')}</p>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { NumeroVivo } from './NumeroVivo';
import { useImpactoHoy, useImpactoTotal } from './datos';
import { METRICAS, esCero, pistaDeImpacto } from '@/lib/inicio/impacto';
import { co2Equivalence, energyEquivalence, formatWhole, wasteEquivalence, waterEquivalence } from '@/lib/impact';
import { cn } from '@/lib/utils/cn';

const EQUIVALENCIA = {
  water: waterEquivalence,
  co2: co2Equivalence,
  waste: wasteEquivalence,
  energy: energyEquivalence,
} as const;

/**
 * "Tu impacto real" — the hero of Inicio, and the one dark band on the page
 * (Bitácora Viva §1: canvas → ink → canvas).
 *
 * It sits at the top because it is the point of the app: what someone saved
 * in the real world. It used to be at the bottom of the page, under the island
 * picture. Four real totals with count-up numbers, today's additions next to
 * each one, and ONE picturable comparison as the headline — the metric where
 * this person weighs most against a day of an average person's use.
 *
 * The numbers are `brote_user_impact` / `brote_user_impact_since`: sums over
 * `activity_completions`, which only the daily set, the routine and the
 * Acciones section can write (0117). The footnote says so, because "what moves
 * this number" is the first thing someone wonders about a number.
 */
export function ImpactoReal({ className }: { className?: string }) {
  const t = useTranslations('inicio.impacto');
  const total = useImpactoTotal();
  const hoy = useImpactoHoy();

  if (total.isLoading) {
    return <Skeleton className={cn('h-[252px] w-full rounded-card !bg-brote-ink/90', className)} />;
  }

  const tot = total.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };
  const dia = hoy.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };
  const vacio = esCero(tot);
  const acciones = tot.actions ?? 0;

  // The headline: the heaviest metric, said as something you can picture.
  const lider = pistaDeImpacto(tot);
  const eq = lider ? EQUIVALENCIA[lider.key](tot[METRICAS.find((m) => m.key === lider.key)!.campo]) : null;
  const eqMatch = eq ? /^(\S+)\s(.*)$/u.exec(eq) : null;

  return (
    <section
      aria-labelledby="impacto-real"
      className={cn('relative isolate overflow-hidden rounded-card bg-brote-ink text-brote-cream shadow-soft-lg', className)}
    >
      {/* Two soft washes of light so the band has depth, not a flat fill. */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-brote-green/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 -z-10 h-56 w-56 rounded-full bg-brote-sun/10 blur-3xl" />

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brote-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brote-green animate-live-pulse" aria-hidden />
            {t('eyebrow')}
          </span>
          <Link
            href="/perfil#impacto"
            className="group inline-flex items-center gap-0.5 rounded-pill px-2 py-1 text-caption font-medium text-brote-cream/70 transition-colors duration-150 hover:bg-white/5 hover:text-brote-cream"
          >
            {t('detalle')}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <h2 id="impacto-real" className="mt-2.5 font-display leading-tight">
          {vacio || !eqMatch ? (
            <>
              <span className="block text-h1 font-extrabold">{t('vacioTitulo')}</span>
              <span className="mt-1 block text-small font-normal leading-relaxed text-brote-cream/70">{t('vacioCuerpo')}</span>
            </>
          ) : (
            <>
              <span className="block text-h1 font-extrabold">
                <span aria-hidden className="mr-1.5">{eqMatch[1]}</span>
                <span className="bg-brand-gradient bg-clip-text text-transparent">{eqMatch[2]}</span>
              </span>
              <span className="mt-1 block text-small font-normal leading-relaxed text-brote-cream/70">
                {t(`sub_${lider!.key}`, { n: formatWhole(acciones) })}
              </span>
            </>
          )}
        </h2>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
          {METRICAS.map((m) => {
            const v = tot[m.campo];
            const d = dia[m.campo];
            return (
              <div key={m.key} className="min-w-0 border-l-2 pl-3" style={{ borderColor: `${m.color}${v > 0 ? '' : '55'}` }}>
                <dt className="truncate text-caption text-brote-cream/60">{m.label}</dt>
                <dd className={cn('font-display text-h2 font-bold leading-tight tnum', v > 0 ? '' : 'opacity-50')} style={{ color: m.color }}>
                  <NumeroVivo value={v} format={m.formato} />
                </dd>
                {d > 0 && (
                  <span className="mt-0.5 inline-flex items-center rounded-pill bg-brote-green/15 px-1.5 py-px text-[11px] font-semibold text-brote-lime tnum">
                    {t('hoyMas', { v: m.formato(d) })}
                  </span>
                )}
              </div>
            );
          })}
        </dl>

        <p className="mt-4 flex items-start gap-1.5 border-t border-white/10 pt-3 text-caption leading-relaxed text-brote-cream/60">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brote-green" aria-hidden />
          {t('regla')}
        </p>
      </div>
    </section>
  );
}

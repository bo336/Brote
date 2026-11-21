'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconoImpacto } from '@/components/impacto/IconoImpacto';
import { NumeroVivo } from './NumeroVivo';
import { useImpactoHoy, useImpactoTotal } from './datos';
import { METRICAS, esCero } from '@/lib/inicio/impacto';
import { historiaPrincipal, NOMBRE_METRICA, type Historia } from '@/lib/impacto/historias';
import { cn } from '@/lib/utils/cn';

/**
 * "Tu impacto real" en Hoy, contado como una frase (docs/REESTRUCTURA.md D5).
 *
 * Antes el titular era "≈ N cosas" y, con cifras grandes, saltaba a piletas
 * olímpicas o camiones: cosas que nadie dimensiona. Ahora el titular dice
 * cuánto dura un hábito de todos los días con lo que ahorraste ("alcanza para
 * ducharte todos los días durante casi 3 semanas"), debajo van dos cosas de la
 * casa que lo dicen de otra forma, y los cuatro números quedan chicos, como
 * respaldo. Es la franja oscura de la página (Bitácora Viva §1).
 *
 * Los números son `brote_user_impact`: sólo acciones medidas (0117). Las
 * acciones propias suman puntos, no impacto.
 */
export function ImpactoReal({ className }: { className?: string }) {
  const t = useTranslations('inicio.impacto');
  const total = useImpactoTotal();
  const hoy = useImpactoHoy();

  if (total.isLoading) {
    return <Skeleton className={cn('h-[236px] w-full rounded-card !bg-brote-ink/90', className)} />;
  }

  const tot = total.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };
  const dia = hoy.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };
  const vacio = esCero(tot);
  const h = vacio ? null : historiaPrincipal(tot);
  const color = h ? NOMBRE_METRICA[h.metrica].color : '#2DB4D4';

  return (
    <section
      aria-labelledby="impacto-real"
      className={cn('relative isolate overflow-hidden rounded-card bg-brote-ink text-brote-cream shadow-soft-lg', className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full blur-3xl"
        style={{ background: `${color}33` }}
      />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 -z-10 h-56 w-56 rounded-full bg-brote-sun/10 blur-3xl" />

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>
            <span className="h-1.5 w-1.5 rounded-full animate-live-pulse" style={{ background: color }} aria-hidden />
            {t('eyebrow')}
          </span>
          <Link
            href="/impacto"
            className="group inline-flex items-center gap-0.5 rounded-pill px-2 py-1 text-caption font-medium text-brote-cream/70 transition-colors duration-150 hover:bg-white/5 hover:text-brote-cream"
          >
            {t('detalle')}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {h ? (
          <>
            <h2 id="impacto-real" className="mt-2.5 text-balance font-display text-h1 font-bold leading-[1.15]">
              <FraseDestacada h={h} color={color} />
            </h2>
            <p className="mt-1.5 text-small leading-relaxed text-brote-cream/65">
              {t('conLoQue', { valor: h.valor, de: NOMBRE_METRICA[h.metrica].de, n: tot.actions ?? 0 })}
            </p>
            {h.ejemplos.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('otrasPalabras')}>
                {h.ejemplos.slice(0, 2).map((e) => (
                  <li
                    key={e.texto}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-white/[0.07] px-2.5 py-1 text-caption font-medium text-brote-cream/90"
                  >
                    <IconoImpacto icono={e.icono} className="h-3.5 w-3.5 shrink-0" />
                    {e.texto}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <h2 id="impacto-real" className="mt-2.5 font-display leading-tight">
            <span className="block text-h1 font-extrabold">{t('vacioTitulo')}</span>
            <span className="mt-1 block text-small font-normal leading-relaxed text-brote-cream/70">{t('vacioCuerpo')}</span>
          </h2>
        )}

        <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-white/10 pt-3">
          {METRICAS.map((m) => {
            const v = tot[m.campo];
            const d = dia[m.campo];
            return (
              <div key={m.key} className="min-w-0">
                <dt className="truncate text-[11px] text-brote-cream/55">{NOMBRE_METRICA[m.key].titulo}</dt>
                <dd className={cn('truncate font-display text-small font-bold leading-tight tnum', v > 0 ? '' : 'opacity-45')} style={{ color: m.color }}>
                  <NumeroVivo value={v} format={m.formato} />
                </dd>
                {d > 0 && <span className="block truncate text-[10px] font-semibold text-brote-lime tnum">{t('hoyMas', { v: m.formato(d) })}</span>}
              </div>
            );
          })}
        </dl>

        <p className="mt-3 flex items-start gap-1.5 text-caption leading-relaxed text-brote-cream/55">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brote-cream/55" aria-hidden />
          {t('regla')}
        </p>
      </div>
    </section>
  );
}

/** La frase con la duración (o la cosa) en el color de la métrica. */
export function FraseDestacada({ h, color }: { h: Historia; color: string }) {
  const i = h.frase.indexOf(h.destacado);
  if (i < 0 || !h.destacado) return <>{h.frase}</>;
  return (
    <>
      {h.frase.slice(0, i)}
      <span style={{ color }}>{h.destacado}</span>
      {h.frase.slice(i + h.destacado.length)}
    </>
  );
}

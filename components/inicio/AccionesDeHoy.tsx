'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Cloud, Droplets, Recycle, Zap, type LucideIcon } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { impactoDeAccion, pistaDeImpacto, sumar, type ConImpacto, type Metrica } from '@/lib/inicio/impacto';
import { EMPTY_IMPACT } from '@/lib/impact';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';
import type { ActivityRow } from '@/lib/supabase/rows';

type Accion = ActivityRow & ConImpacto;

export const ICONO_METRICA: Record<Metrica, LucideIcon> = {
  water: Droplets,
  co2: Cloud,
  waste: Recycle,
  energy: Zap,
};

/**
 * The day's actions, as ONE checklist: a single card with hairline rows, a
 * progress ring and what is still left to save today. Deliberately unlike the
 * routine (pills) and the suggestions (a rail of cards) — the three used to be
 * the same bordered card repeated, so nothing said which was which.
 *
 * Each row shows the real amount it adds (the heaviest metric of that action,
 * from `activities.impact_*`), so marking it is visibly the thing that moves
 * the impact panel above.
 */
export function AccionesDeHoy({
  set,
  extra,
  done,
  loading,
  onComplete,
}: {
  set: Accion[];
  extra: Accion[];
  done: Set<string>;
  loading: boolean;
  onComplete: (a: Accion) => void;
}) {
  const t = useTranslations('inicio.hoy');
  const [masAbierto, setMasAbierto] = useState(false);
  const [verHechas, setVerHechas] = useState(false);

  const hechas = set.filter((a) => done.has(a.id)).length;
  const total = set.length;
  const completo = total > 0 && hechas === total;
  const puntosPendientes = set.filter((a) => !done.has(a.id)).reduce((s, a) => s + a.base_points, 0);

  // What the rest of today's set would still add — a real sum, not a slogan.
  const pendiente = useMemo(
    () => pistaDeImpacto(set.filter((a) => !done.has(a.id)).reduce((acc, a) => sumar(acc, impactoDeAccion(a)), { ...EMPTY_IMPACT })),
    [set, done],
  );
  const extrasHechas = extra.filter((a) => done.has(a.id)).length;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-t border-hairline px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-[14px]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const filas = completo && !verHechas ? [] : set;

  return (
    <section aria-labelledby="acciones-de-hoy" className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <header className={cn('flex items-center gap-3.5 p-4', completo && 'bg-primary/[0.06]')}>
        <Anillo hechas={hechas} total={total} />
        <div className="min-w-0 flex-1">
          <span className="eyebrow block text-primary">{t('eyebrow')}</span>
          <h2 id="acciones-de-hoy" className="mt-0.5 font-display text-h2 font-bold leading-tight">
            {completo ? t('completoTitulo') : t('titulo')}
          </h2>
          <p className="mt-0.5 text-small leading-snug text-muted-foreground">
            {completo
              ? t('completoCuerpo')
              : pendiente
                ? t('quedan', { impacto: pendiente.texto, puntos: puntosPendientes })
                : t('quedanPuntos', { puntos: puntosPendientes })}
          </p>
        </div>
      </header>

      {total === 0 ? (
        <p className="border-t border-hairline px-4 py-5 text-center text-small text-muted-foreground">{t('vacio')}</p>
      ) : (
        <ul className="divide-y divide-hairline border-t border-hairline">
          {filas.map((a) => (
            <Fila key={a.id} a={a} hecha={done.has(a.id)} onComplete={onComplete} />
          ))}
          <AnimatePresence initial={false}>
            {masAbierto &&
              extra.map((a) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <FilaContenido a={a} hecha={done.has(a.id)} onComplete={onComplete} />
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="flex border-t border-hairline">
        {completo && (
          <button
            type="button"
            onClick={() => setVerHechas((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-3 text-small font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
          >
            {verHechas ? t('ocultarHechas') : t('verHechas', { n: total })}
          </button>
        )}
        {extra.length > 0 && (
          <button
            type="button"
            aria-expanded={masAbierto}
            onClick={() => setMasAbierto((v) => !v)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-small font-semibold text-primary transition-colors duration-150 hover:bg-primary/[0.06]',
              completo && 'border-l border-hairline',
            )}
          >
            <span className="whitespace-nowrap">{masAbierto ? t('menos') : completo ? t('unaMas') : t('mas', { n: extra.length })}</span>
            {extrasHechas > 0 && !masAbierto && !completo && (
              <span className="whitespace-nowrap rounded-pill bg-primary/12 px-1.5 text-caption tnum">{t('extrasHechas', { n: extrasHechas })}</span>
            )}
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', masAbierto && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}

function Fila(props: { a: Accion; hecha: boolean; onComplete: (a: Accion) => void }) {
  return (
    <li>
      <FilaContenido {...props} />
    </li>
  );
}

function FilaContenido({ a, hecha, onComplete }: { a: Accion; hecha: boolean; onComplete: (a: Accion) => void }) {
  const t = useTranslations('inicio.hoy');
  const pista = pistaDeImpacto(impactoDeAccion(a), a.domain_slug);
  const Icono = pista ? ICONO_METRICA[pista.key] : null;

  return (
    <button
      type="button"
      disabled={hecha}
      aria-pressed={hecha}
      aria-label={hecha ? t('hechaAria', { titulo: a.title_es }) : t('marcarAria', { titulo: a.title_es })}
      onClick={() => {
        if (hecha) return;
        haptic('success');
        onComplete(a);
      }}
      className={cn(
        'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
        hecha ? 'cursor-default' : 'hover:bg-surface-2/70 active:bg-surface-2',
      )}
    >
      <span className={cn('shrink-0 transition-transform duration-200', !hecha && 'group-hover:scale-105', hecha && 'opacity-60')}>
        <DomainIcon domain={a.domain_slug} size={40} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'line-clamp-2 text-body font-medium leading-snug transition-colors duration-200',
            hecha && 'text-muted-foreground line-through decoration-muted-foreground/50',
          )}
        >
          {a.title_es}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-caption">
          {pista && Icono && (
            <span className="inline-flex items-center gap-1 font-semibold tnum" style={{ color: pista.color }}>
              <Icono className="h-3.5 w-3.5" aria-hidden />
              {hecha ? t('sumaste', { v: pista.valor }) : pista.valor}
            </span>
          )}
          <span className={cn('font-semibold tnum', hecha ? 'text-muted-foreground' : 'text-brote-sun')}>
            +{a.base_points} pts
          </span>
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
          hecha
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border group-hover:border-primary/60 group-hover:bg-primary/5',
        )}
      >
        {hecha && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        )}
      </span>
    </button>
  );
}

/** The day's progress as a ring: fills as actions are marked. */
function Anillo({ hechas, total }: { hechas: number; total: number }) {
  const r = 21;
  const c = 2 * Math.PI * r;
  const p = total ? hechas / total : 0;
  const completo = total > 0 && hechas === total;
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4.5" className="stroke-border" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4.5"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      {completo ? (
        <Check className="h-5 w-5 text-primary" strokeWidth={3} />
      ) : (
        <span className="font-display text-small font-bold tnum">
          {hechas}/{total}
        </span>
      )}
    </span>
  );
}

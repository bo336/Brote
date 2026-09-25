'use client';

import { useTranslations } from 'next-intl';
import { CountUp } from '@/components/ui/count-up';
import type { Mapa } from '@/lib/academia/modelo';

/**
 * La tira oscura del árbol: el corte canvas → tinta → canvas del sistema de
 * diseño, con las cifras reales de esta persona.
 *
 * Todo sale de `academia_mapa()`. Si un dato no existe, la columna no se
 * dibuja: nada de "minutos de estudio" ni de un nivel inventado para llenar.
 */
export function TiraArbol({ mapa }: { mapa: Mapa }) {
  const t = useTranslations('arbol');
  const s = mapa.stats;
  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-5 overflow-x-auto bg-brote-ink px-4 py-3 text-brote-cream lg:mx-0 lg:rounded-card">
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-brote-green">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brote-green opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brote-green" />
        </span>
        {t('tuArbol')}
      </span>
      <span className="shrink-0 whitespace-nowrap text-small text-brote-cream/70">
        <CountUp value={s.unidades_completas} className="tnum font-display font-bold text-brote-cream" />
        <span className="text-brote-cream/50">/{s.unidades_total}</span> {t('statUnidades')}
      </span>
      <span className="shrink-0 whitespace-nowrap text-small text-brote-cream/70">
        <CountUp value={s.lecciones_completas} className="tnum font-display font-bold text-brote-cream" />
        <span className="text-brote-cream/50">/{s.lecciones_total}</span> {t('statSesiones')}
      </span>
      {s.ramas_abiertas > 0 ? (
        <span className="hidden shrink-0 whitespace-nowrap text-small text-brote-cream/70 sm:inline">
          <CountUp value={s.ramas_abiertas} className="tnum font-display font-bold text-brote-cream" />{' '}
          {t('statRamas')}
        </span>
      ) : null}
      {mapa.racha > 0 ? (
        <span className="ml-auto shrink-0 whitespace-nowrap text-small font-semibold text-brote-sun">
          {t('rachaSigue', { n: mapa.racha })}
        </span>
      ) : null}
    </div>
  );
}

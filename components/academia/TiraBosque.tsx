'use client';

import { useTranslations } from 'next-intl';
import { CountUp } from '@/components/ui/count-up';
import type { StatsArbol } from '@/lib/academia/types';

/**
 * La tira oscura del bosque: el corte canvas → tinta → canvas del §1 del
 * sistema de diseño, con las cifras reales de esta persona.
 *
 * Todos los números salen de `academia_arbol()`. No hay "minutos de lectura",
 * ni "nivel", ni ninguna cifra inventada para llenar la tira: si un dato no
 * existe, la columna no se dibuja.
 */
export function TiraBosque({ stats, racha }: { stats: StatsArbol; racha: number }) {
  const t = useTranslations('academia');

  return (
    <div className="-mx-4 flex items-center gap-5 overflow-x-auto bg-brote-ink px-4 py-3 text-brote-cream no-scrollbar lg:mx-0 lg:rounded-card">
      {stats.anillo_nombre ? (
        <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-brote-green">
          {t('anillo', { n: stats.anillo })} · {stats.anillo_nombre}
        </span>
      ) : null}

      <span className="shrink-0 whitespace-nowrap text-small text-brote-cream/70">
        <CountUp value={stats.conceptos_vistos} className="tnum font-display font-bold text-brote-cream" />{' '}
        {t('statConceptos').toLowerCase()}
      </span>

      <span className="hidden shrink-0 whitespace-nowrap text-small text-brote-cream/70 sm:inline">
        <CountUp value={stats.conceptos_frondosos} className="tnum font-display font-bold text-brote-cream" />{' '}
        {t('statFuertes').toLowerCase()}
      </span>

      <span className="hidden shrink-0 whitespace-nowrap text-small text-brote-cream/70 md:inline">
        <CountUp value={stats.hojas_completas} className="tnum font-display font-bold text-brote-cream" />{' '}
        {t('statHojasCorto').toLowerCase()}
      </span>

      {racha > 0 ? (
        <span className="ml-auto shrink-0 whitespace-nowrap text-small font-semibold text-brote-sun">
          {t('rachaSigue', { n: racha })}
        </span>
      ) : null}
    </div>
  );
}

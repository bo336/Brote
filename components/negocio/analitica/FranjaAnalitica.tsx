'use client';

import { useTranslations } from 'next-intl';
import { CountUp } from '@/components/ui/count-up';

/**
 * La franja oscura de la analítica (07 §1: canvas → tinta → canvas), UNA sola
 * vez por pantalla, con el mismo lenguaje de terminal que la Plaza.
 *
 * Todos los números son reales. Si no hubo nada que medir, esta franja no se
 * dibuja: cuatro ceros con animación son peor que un estado vacío honesto.
 */
export function FranjaAnalitica({
  impresiones,
  salidas,
  tasa,
  reportes,
  dias,
}: {
  impresiones: number;
  salidas: number;
  tasa: number | null;
  reportes: number;
  dias: number;
}) {
  const t = useTranslations('negocio.analitica');

  return (
    <div className="-mx-4 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-white/10 bg-brote-ink px-4 py-4 text-brote-cream sm:grid-cols-4 lg:mx-0 lg:rounded-card lg:border lg:px-6">
      <Dato valor={<CountUp value={impresiones} className="tnum" />} etiqueta={t('impresiones')} />
      <Dato valor={<CountUp value={salidas} className="tnum" />} etiqueta={t('salidas')} />
      <Dato
        valor={<span className="tnum">{tasa === null ? '—' : `${tasa.toLocaleString('es-AR')}%`}</span>}
        etiqueta={t('tasa')}
      />
      <Dato valor={<CountUp value={reportes} className="tnum" />} etiqueta={t('reportesResueltos')} />
      <p className="col-span-2 text-[11px] uppercase tracking-[0.12em] text-brote-cream/50 sm:col-span-4">
        {t('ultimosDias', { dias })}
      </p>
    </div>
  );
}

function Dato({ valor, etiqueta }: { valor: React.ReactNode; etiqueta: string }) {
  return (
    <div className="min-w-0">
      <span className="block font-display text-display-s font-extrabold leading-none">{valor}</span>
      <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-brote-cream/60">{etiqueta}</span>
    </div>
  );
}

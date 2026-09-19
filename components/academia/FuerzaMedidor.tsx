'use client';

import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';

/**
 * La fuerza de un concepto: maestría por retrievability, 0..1.
 *
 * No es "avance". Un concepto que se sabía y hace tres semanas que no se toca
 * BAJA, y el medidor tiene que mostrarlo bajando — es la única forma de que
 * "regar" signifique algo. Por eso el color cambia con el valor: lo que se
 * está apagando se ve apagándose antes de que el bosque lo marque marchito.
 */
export function FuerzaMedidor({
  fuerza,
  titulo,
  className,
  compacto,
}: {
  fuerza: number;
  titulo?: string;
  className?: string;
  compacto?: boolean;
}) {
  const t = useTranslations('academia');
  const v = Math.max(0, Math.min(1, fuerza));
  const pct = Math.round(v * 100);
  const color = v >= 0.7 ? '#1FB57A' : v >= 0.35 ? '#FFB23E' : '#FF6B5E';

  return (
    <div className={cn('w-full', className)}>
      {titulo ? (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="truncate text-small font-medium">{titulo}</span>
          <span className="tnum shrink-0 text-caption text-muted-foreground">{t('fuerzaValor', { n: pct })}</span>
        </div>
      ) : null}
      <ProgressBar value={v} color={color} height={compacto ? 4 : 6} />
      {titulo ? null : (
        <span className="sr-only">
          {t('fuerza')}: {t('fuerzaValor', { n: pct })}
        </span>
      )}
    </div>
  );
}

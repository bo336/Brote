'use client';

import { Droplet, Infinity as InfinityIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SaviaEstado } from '@/lib/academia/types';
import { cn } from '@/lib/utils/cn';

/**
 * El medidor de savia, o el chip de {plus} en su lugar.
 *
 * La savia se gasta al EMPEZAR una hoja, no al terminarla, y por eso el
 * medidor dice cuántas hojas quedan y no cuánto se avanzó. Regar nunca lo toca.
 *
 * Con Brote+ el RPC devuelve `savia: null`: la ausencia del medidor es el
 * beneficio. No se dibuja un medidor lleno hasta arriba — eso sería recordarle
 * a alguien que pagó que había un límite.
 */
export function SaviaMedidor({
  savia,
  pro,
  className,
}: {
  savia: SaviaEstado | null;
  pro: boolean;
  className?: string;
}) {
  const t = useTranslations('academia');

  if (pro || !savia) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-pill border border-brote-sun/40 bg-brote-sun/10 px-2.5 py-1',
          'text-caption font-semibold text-brote-sun',
          className,
        )}
      >
        <InfinityIcon className="h-3.5 w-3.5" aria-hidden />
        {t('saviaIlimitada')}
      </span>
    );
  }

  const gotas = Array.from({ length: savia.max }, (_, i) => i < savia.restante);
  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={t('saviaRestante', { n: savia.restante })}
    >
      {gotas.map((llena, i) => (
        <Droplet
          key={i}
          aria-hidden
          className={cn(
            'h-4 w-4 transition-colors duration-300',
            llena ? 'fill-brote-aqua text-brote-aqua' : 'fill-transparent text-muted-foreground/40',
          )}
        />
      ))}
    </div>
  );
}

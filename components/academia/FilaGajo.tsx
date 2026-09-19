'use client';

import Link from 'next/link';
import { ChevronRight, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui/progress';
import type { GajoDelArbol } from '@/lib/academia/types';
import { cn } from '@/lib/utils/cn';

/**
 * Una fila de gajo: densa, con línea de pelo y sin caja.
 *
 * El sistema de diseño §1 es explícito — divisores antes que tarjetas. Una
 * lista de 16 gajos en 16 tarjetas con sombra es una pantalla que scrollea el
 * doble y dice lo mismo.
 */
export function FilaGajo({ gajo, color }: { gajo: GajoDelArbol; color: string }) {
  const t = useTranslations('academia');
  const latente = gajo.estado === 'latente';
  const marchito = gajo.estado === 'marchito';

  return (
    <Link
      href={`/aprender/g/${gajo.slug}`}
      className={cn(
        'flex items-center gap-3 py-3 transition-colors',
        'hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        latente && 'opacity-60',
      )}
    >
      <span
        className={cn('h-9 w-1 shrink-0 rounded-pill', latente && 'opacity-40')}
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {latente ? <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden /> : null}
          <span className="truncate text-small font-semibold">{gajo.titulo_es}</span>
        </span>
        <span className="mt-0.5 block truncate text-caption text-muted-foreground">
          {latente && gajo.falta
            ? t('bloqueada', { concepto: gajo.falta })
            : `${t('ramaConceptos', { n: gajo.conceptos })} · ${gajo.hojas_hechas}/${gajo.hojas_total}`}
        </span>
        {!latente ? (
          <span className="mt-1.5 block">
            <ProgressBar
              value={gajo.progreso}
              color={marchito ? '#FF6B5E' : color}
              height={4}
              className="max-w-[220px]"
            />
          </span>
        ) : null}
      </span>

      <span className="tnum shrink-0 text-caption text-muted-foreground">
        {latente ? t('bloqueadaCorta') : `${Math.round(gajo.progreso * 100)}%`}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

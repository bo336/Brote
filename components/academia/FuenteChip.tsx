'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Fuente } from '@/lib/academia/types';
import { cn } from '@/lib/utils/cn';

/**
 * De dónde salió el dato.
 *
 * Aparece SIEMPRE que hay corrección — se haya acertado o no — y siempre es
 * tocable. Una afirmación sobre el ambiente sin su fuente al lado es una
 * opinión con tipografía linda, y esta sección no publica opiniones.
 */
export function FuenteChip({ fuente, className }: { fuente: Fuente; className?: string }) {
  const t = useTranslations('academia');
  const anio = fuente.publicado ? new Date(fuente.publicado).getFullYear() : null;

  return (
    <a
      href={fuente.url}
      target="_blank"
      rel="noopener noreferrer"
      title={fuente.titulo}
      aria-label={`${t('fuenteAbrir')}: ${fuente.titulo}, ${fuente.organizacion}`}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-pill border border-hairline bg-surface-2 px-2.5 py-1',
        'text-caption text-muted-foreground transition-colors',
        'hover:border-primary/40 hover:text-foreground active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">
        {fuente.organizacion}
        {anio ? ` · ${anio}` : ''}
      </span>
    </a>
  );
}

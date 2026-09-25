'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, TreePine } from 'lucide-react';

import type { MundoState } from '@/lib/mundo';
import { defaultPosterFor } from './defaultPoster';

/**
 * The door to Tu mundo from Hoy — **one section among the others**.
 *
 * The world used to be the hero of the home screen, a 320 px card above
 * everything else. The owner's call (2026-09-25): it is not the app's priority,
 * it is one more section people love to spend time in, like the Academia and
 * the Mercado. So it sits with them, as a row — but a row with a **real
 * picture** of the island in it, because "I can't see the preview" was the
 * other half of the same request.
 *
 * The picture is the player's own poster when there is one, and otherwise a
 * real capture of the game at their level from `public/mundo/`. Never a drawing.
 *
 * No `three`, no `lib/render`: this is on the home feed's first paint.
 */
const PLACE_BY_TIER = [
  'El Claro', 'La Pradera', 'El Jardín', 'La Arboleda', 'La Arboleda', 'La Arboleda',
  'El Río', 'El Monte', 'La Cumbre', 'El Islote', 'El Monumento',
] as const;

export function EntradaMundo({
  mundo,
  snapshotUrl,
}: {
  mundo?: MundoState | null;
  snapshotUrl?: string | null;
}) {
  const t = useTranslations('mundo.entrada');
  const tier = Math.min(11, Math.max(1, mundo?.rankTier ?? 1));
  const src = snapshotUrl || defaultPosterFor(tier);

  return (
    <Link
      href="/mundo"
      className="press group block overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative h-36 w-full overflow-hidden bg-brote-ink/10">
        <img
          src={src}
          alt=""
          width={1200}
          height={600}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex items-center gap-3 p-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary/12 text-primary">
          <TreePine className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-semibold">{t('titulo')}</span>
          <span className="mt-0.5 block truncate text-caption text-muted-foreground">
            {mundo?.rankTier ? t('subNivel', { n: tier, lugar: PLACE_BY_TIER[tier - 1] }) : t('sub')}
          </span>
        </span>
        <span className="hidden text-caption font-semibold text-primary sm:inline">{t('entrar')}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </Link>
  );
}

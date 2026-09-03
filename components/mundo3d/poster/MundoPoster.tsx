'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Sprout } from 'lucide-react';

import { biomeFor, type MundoState } from '@/lib/mundo';
import { cn } from '@/lib/utils/cn';
import { PosterFallback } from './PosterFallback';

/**
 * The feed card. **A still image, and nothing else.**
 *
 * This is the single most important structural change in the rebuild: a live
 * WebGL game must never run inside a scrolling card. The old world mounted a
 * `<Canvas>` with five post-processing passes at up to 2× DPR inside a 320 px
 * card on the home feed, and that alone explains most of how it felt on a phone
 * (`07-RENDER-ARCHITECTURE.md` §1).
 *
 * Cost here: one `<img>`. **This file must not import `three` or `lib/render/**`
 * — eslint enforces it**, because the home feed loads this component and any
 * such import would pull the whole renderer into everyone's first paint.
 */
interface MundoPosterProps {
  mundo?: MundoState | null;
  /** A real picture of this player's island, captured on their last visit. */
  snapshotUrl?: string | null;
  height?: number;
  /**
   * `false` on someone else's profile and in onboarding: the card is shown, but
   * it is not a door. Only Hoy and Perfil lead into the game.
   */
  interactive?: boolean;
  className?: string;
}

export function MundoPoster({
  mundo,
  snapshotUrl,
  height = 320,
  interactive = true,
  className,
}: MundoPosterProps) {
  const t = useTranslations('mundo');

  const worldIndex = mundo?.worldIndex ?? 1;
  const biome = biomeFor(worldIndex);
  const growth = mundo?.worldGrowth ?? 0;
  const goal = mundo?.worldGoal ?? 40;
  const pct = Math.min(100, Math.round((growth / Math.max(1, goal)) * 100));

  const card = (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {snapshotUrl ? (
        <img
          src={snapshotUrl}
          alt=""
          width={1080}
          height={1350}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <PosterFallback mundo={mundo} height={height} className="rounded-none border-0" />
      )}

      {/* Biome chip */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-pill bg-brote-ink/25 px-3 py-1 backdrop-blur-sm">
        <span className="text-caption font-bold text-white/95">Mundo {worldIndex}</span>
        <span className="text-caption text-white/70">· {biome.name}</span>
      </div>

      {/* Growth bar */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3">
        <div className="rounded-pill bg-brote-ink/25 px-3 py-1.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-caption text-white/90">
            <span className="tnum inline-flex items-center gap-1 font-semibold">
              <Sprout className="h-3 w-3" /> {t('poster.growth', { actual: growth, objetivo: goal })}
            </span>
            {interactive && (
              <span className="inline-flex items-center gap-0.5 font-semibold">
                {t('poster.enter')}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-white/20">
            <div
              className="h-full rounded-pill bg-brand-gradient transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!interactive) {
    return <div className={cn('overflow-hidden rounded-card', className)}>{card}</div>;
  }

  return (
    <Link
      href="/mundo"
      aria-label={t('poster.enter')}
      className={cn(
        'group block overflow-hidden rounded-card transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.005]',
        className,
      )}
    >
      {card}
    </Link>
  );
}

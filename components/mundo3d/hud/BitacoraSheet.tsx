'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid, Settings2, X } from 'lucide-react';

import { getDomainColor } from '@/lib/domains';
import { pagesFor, progressFor } from '@/lib/world/journal';
import { cn } from '@/lib/utils/cn';
import { DomainSuggestion } from './DomainSuggestion';
import { LevelPath } from './LevelPath';
import { useRegionCensus } from './useRegionCensus';
import type { JournalEntry } from '@/lib/world/types';

/**
 * La Bitácora — the census, which is the product's own tagline made literal
 * (`11-GAME-LOOP.md` §3.3).
 *
 * Two rules shape it. **Unseen species are silhouettes, not blanks**: the name
 * is withheld but the region and the time of day are not, because that turns an
 * empty row into somewhere to go rather than a wall. And **nothing here is
 * loss-framed** — a page reads "6 de 9", never "te faltan 3".
 *
 * The decisions live in `lib/world/journal.ts`. This is the shape of them.
 */
interface BitacoraSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  tier: number;
  journal: readonly JournalEntry[];
  /** The bootstrap failed and this census is a default. Never claim anything. */
  readOnly: boolean;
  /** There is something to arrange. A button opening an empty tray is a lie. */
  canArrange: boolean;
  onArrange: () => void;
  onOpenSettings: () => void;
  /** The world the biome is on, and real actions into it — for "Tu camino". */
  worldIndex: number;
  worldGrowth: number;
  worldGoal: number;
}

export function BitacoraSheet({
  open, onClose, userId, tier, journal, readOnly, canArrange, onArrange, onOpenSettings,
  worldIndex, worldGrowth, worldGoal,
}: BitacoraSheetProps) {
  const t = useTranslations('mundo.bitacora');
  const tHud = useTranslations('mundo');
  const tRegion = useTranslations('mundo.region');
  const tTod = useTranslations('mundo.tod');
  const [openRegion, setOpenRegion] = useState<string | null>(null);

  const pages = useMemo(() => pagesFor(tier, journal), [tier, journal]);
  const total = useMemo(() => progressFor(tier, journal), [tier, journal]);

  // A completed region pays a cosmetic. The server counts it again before it
  // hands anything over; this only says which region to look at.
  useRegionCensus({ pages, open, readOnly });

  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-10 flex flex-col bg-brote-ink/95 backdrop-blur-sm">
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <div>
          <h2 className="font-display text-h2 font-bold text-brote-cream">{t('title')}</h2>
          {/* Counted up, never down. */}
          <p className="mt-0.5 text-caption text-brote-cream/70">
            {t('progress', { seen: total.seen, total: total.total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* The two other sheets, reached through this one rather than from
              the HUD — which §1 keeps at four elements during play. */}
          {canArrange && (
            <button
              type="button"
              onClick={onArrange}
              aria-label={tHud('placement.modo')}
              className="flex h-11 w-11 items-center justify-center rounded-pill bg-brote-cream/10 text-brote-cream"
            >
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={tHud('set.quality.label')}
            className="flex h-11 w-11 items-center justify-center rounded-pill bg-brote-cream/10 text-brote-cream"
          >
            <Settings2 className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-11 w-11 items-center justify-center rounded-pill bg-brote-cream/10 text-brote-cream"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* First, not after four thousand pixels of census: where you are, and
            what the next level brings, is the question somebody opens this with. */}
        <LevelPath tier={tier} worldIndex={worldIndex} growth={worldGrowth} goal={worldGoal} />

        {total.seen === 0 && (
          <p className="mt-6 text-body text-brote-cream/80">{t('empty')}</p>
        )}

        {/* The app seam. Inside the sheet they already opened — never an
            interruption, and never more than one at a time. */}
        <DomainSuggestion userId={userId} tier={tier} journal={journal} />

        {pages.map((page) => {
          const isOpen = openRegion === page.region || openRegion === null;
          return (
            <section key={page.region} className="mt-5">
              <button
                type="button"
                onClick={() => setOpenRegion(openRegion === page.region ? null : page.region)}
                className="flex w-full items-baseline justify-between gap-3 text-left"
              >
                <h3 className="text-h3 font-semibold text-brote-cream">{tRegion(page.region)}</h3>
                <span
                  className={cn(
                    'shrink-0 rounded-pill px-2.5 py-0.5 text-caption font-semibold',
                    page.complete
                      ? 'bg-brote-green/20 text-brote-lime'
                      : 'bg-brote-cream/10 text-brote-cream/70',
                  )}
                >
                  {page.complete ? t('complete') : `${page.seen}/${page.total}`}
                </span>
              </button>

              {isOpen && (
                <ul className="mt-2 space-y-1.5">
                  {page.lines.map(({ species, entry, seen }) => (
                    <li
                      key={species.slug}
                      className="rounded-2xl bg-brote-cream/[0.06] p-3"
                      style={{ borderLeft: `3px solid ${getDomainColor(species.domain_slug)}` }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          className={cn(
                            'text-body font-semibold',
                            seen ? 'text-brote-cream' : 'text-brote-cream/35',
                          )}
                        >
                          {/* A silhouette keeps the shape of the name without
                              giving it away — the row still has a size, so the
                              page does not jump when it is finally logged. */}
                          {seen ? species.name_es : '·'.repeat(Math.min(12, species.name_es.length))}
                        </span>
                        <span className="shrink-0 text-caption text-brote-cream/50">
                          {tTod(species.time_of_day[0] ?? 'dia')}
                        </span>
                      </div>
                      <p className="mt-1 text-caption leading-relaxed text-brote-cream/70">
                        {seen ? species.blurb_es : t('unseen')}
                      </p>
                      {seen && entry && (
                        <p className="mt-1.5 text-[11px] text-brote-cream/45">
                          {t('firstSeen', {
                            region: tRegion(entry.region),
                            tod: tTod(entry.time_of_day),
                          })}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

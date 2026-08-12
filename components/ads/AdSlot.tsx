'use client';

/**
 * A single AdSense unit (PLAN F13.3).
 *
 * Renders nothing at all unless the policy engine allows it, so paying users
 * and children never get an empty box, a layout shift, or a network call.
 * When it does render it reserves its height up front — an ad that pushes
 * content around after load is worse than no ad.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAds, ADSENSE_CLIENT } from './AdsProvider';
import type { Placement } from '@/lib/ads/policy';
import { cn } from '@/lib/utils/cn';

/** Ad unit ids come from AdSense; set them in env so they can change freely. */
const SLOT_IDS: Record<Placement, string | undefined> = {
  'news-feed': process.env.NEXT_PUBLIC_ADSLOT_NEWS_FEED,
  'news-article': process.env.NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE,
  'ranking-footer': process.env.NEXT_PUBLIC_ADSLOT_RANKING,
  'catalog-footer': process.env.NEXT_PUBLIC_ADSLOT_CATALOG,
  moment: process.env.NEXT_PUBLIC_ADSLOT_MOMENT,
};

/** Reserved heights, chosen to match what AdSense typically returns. */
const MIN_HEIGHT: Record<Placement, number> = {
  'news-feed': 120,
  'news-article': 250,
  'ranking-footer': 120,
  'catalog-footer': 120,
  moment: 250,
};

export function AdSlot({
  placement,
  className,
  label = true,
}: {
  placement: Placement;
  className?: string;
  /** Ads must be labelled so they are never mistaken for our own content. */
  label?: boolean;
}) {
  const { canRenderHere } = useAds();
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const slotId = SLOT_IDS[placement];

  useEffect(() => {
    if (!canRenderHere || !slotId || pushed.current) return;
    const el = ref.current;
    if (!el) return;
    // Guard against React strict-mode double effects re-pushing the same unit.
    if (el.getAttribute('data-adsbygoogle-status')) {
      pushed.current = true;
      return;
    }
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      /* AdSense not ready or blocked — the reserved space just stays empty */
    }
  }, [canRenderHere, slotId]);

  if (!canRenderHere || !slotId) return null;

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between px-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Publicidad</span>
          <Link href="/brote-plus" className="text-[10px] font-medium text-primary underline-offset-2 hover:underline">
            Quitar anuncios
          </Link>
        </div>
      )}
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: MIN_HEIGHT[placement] }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={placement === 'news-feed' ? 'fluid' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * The "moment" ad: a calm, dismissible card at a natural stopping point.
 * Deliberately not a blocking pop-over — interstitials that hijack navigation
 * annoy users and put the AdSense account at risk.
 */
export function MomentAd() {
  const { momentOpen, dismissMoment, canRenderHere } = useAds();
  if (!momentOpen || !canRenderHere) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-24 lg:pb-4">
      <div className="mx-auto max-w-md rounded-sheet border border-border bg-surface p-3 shadow-soft-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Publicidad</span>
          <button
            onClick={dismissMoment}
            className="rounded-full px-2 py-1 text-caption font-medium text-muted-foreground hover:text-foreground"
            aria-label="Cerrar anuncio"
          >
            Cerrar ✕
          </button>
        </div>
        <AdSlot placement="moment" label={false} />
        <Link
          href="/brote-plus"
          className="mt-2 block text-center text-caption font-medium text-primary"
          onClick={dismissMoment}
        >
          Con Brote+ no ves más anuncios 🌟
        </Link>
      </div>
    </div>
  );
}

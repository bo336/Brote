'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/reveal';
import { getDomain } from '@/lib/domains';
import { relativeLabel } from '@/lib/utils/dates';
import type { NewsRow } from '@/lib/supabase/rows';

/**
 * The one featured story per page load — big leaf-clipped image, gradient
 * headline (the ONE hero-text use of the brand gradient), eyebrow domain +
 * time. This is the single "signature moment" of the screen; everything
 * beneath it is the calmer hairline-divided briefing river.
 */
export function NewsHero({ item }: { item: NewsRow }) {
  const dom = item.domain_tags[0] ? getDomain(item.domain_tags[0]) : undefined;

  return (
    <Reveal>
      <Link href={`/explorar/novedades/${item.id}`} className="group block">
        <div className="leaf-clip relative h-64 w-full overflow-hidden rounded-card sm:h-80">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: `linear-gradient(135deg, ${dom?.color ?? '#1FB57A'}, #0C1A13)` }}
            />
          )}
          <div className="absolute inset-0 bg-ink-scrim" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/85">
              {dom && <span style={{ color: dom.color }}>{dom.name_es}</span>}
              {item.published_at && <span className="text-white/60">· {relativeLabel(item.published_at)}</span>}
            </div>
            <h2 className="max-w-xl bg-brand-gradient bg-clip-text font-display text-hero font-extrabold leading-[1.04] text-transparent">
              {item.title_es}
            </h2>
          </div>
        </div>
        {item.summary_es && (
          <p className="mt-3 line-clamp-2 max-w-2xl text-body leading-relaxed text-muted-foreground">{item.summary_es}</p>
        )}
      </Link>
    </Reveal>
  );
}

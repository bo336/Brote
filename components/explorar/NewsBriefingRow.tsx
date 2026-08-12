'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getDomain } from '@/lib/domains';
import { relativeLabel } from '@/lib/utils/dates';
import type { NewsRow } from '@/lib/supabase/rows';

/**
 * Hairline-divided list row (divider-first, not box-first — see
 * BROTE_DESIGN_SYSTEM.md §3). The title underlines in on hover and an arrow
 * slides in, rather than the whole row just lifting like a generic card.
 */
export function NewsBriefingRow({ item }: { item: NewsRow }) {
  const dom = item.domain_tags[0] ? getDomain(item.domain_tags[0]) : undefined;
  const meta = [dom?.name_es, item.source, item.published_at ? relativeLabel(item.published_at) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/explorar/novedades/${item.id}`}
      className="group -mx-2 flex items-center gap-3 rounded-button px-2 py-3.5 transition-colors duration-150 hover:bg-surface-2/70"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dom?.color ?? '#1FB57A' }} aria-hidden />
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" className="h-14 w-14 shrink-0 rounded-[10px] object-cover" />
      ) : (
        <div className="h-14 w-14 shrink-0 rounded-[10px]" style={{ background: `${dom?.color ?? '#1FB57A'}22` }} />
      )}
      <div className="min-w-0 flex-1">
        <p
          className="line-clamp-1 bg-gradient-to-r from-current to-current bg-no-repeat font-display text-body font-semibold leading-snug transition-[background-size] duration-200 [background-position:0_100%] [background-size:0%_1.5px] group-hover:[background-size:100%_1.5px]"
        >
          {item.title_es}
        </p>
        <p className="mt-0.5 truncate text-caption text-muted-foreground">{meta}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { Pill } from '@/components/ui/pill';
import { getDomain } from '@/lib/domains';
import type { NewsRow } from '@/lib/supabase/rows';

export function NewsCard({ item }: { item: NewsRow }) {
  const when = item.published_at
    ? new Date(item.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    : '';
  return (
    <Link
      href={`/explorar/novedades/${item.id}`}
      className="flex gap-3 overflow-hidden rounded-card border border-border bg-surface p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
    >
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" className="h-20 w-20 shrink-0 rounded-[12px] object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-semibold leading-tight">{item.title_es}</p>
        {item.summary_es && <p className="mt-1 line-clamp-2 text-small text-muted-foreground">{item.summary_es}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
          {item.source && <span>{item.source}</span>}
          {when && <span>· {when}</span>}
          {item.domain_tags.slice(0, 2).map((d) => {
            const dom = getDomain(d);
            return dom ? (
              <Pill key={d} color={dom.color} size="sm">
                {dom.name_es}
              </Pill>
            ) : null;
          })}
        </div>
      </div>
    </Link>
  );
}

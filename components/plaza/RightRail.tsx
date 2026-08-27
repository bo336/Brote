'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { WhoToFollow } from '@/components/social/WhoToFollow';
import { getDomain } from '@/lib/domains';

/**
 * The second column, on a large screen only.
 *
 * It carries what a phone puts inline: search, the topics that actually have
 * something in them right now, and who to follow. Nothing here is invented —
 * the topic list comes from `feed_pulse`, so a quiet topic simply is not on it.
 *
 * `position: sticky` so it stays useful through a long scroll instead of
 * disappearing after the first screen.
 */
export function RightRail({ topics, trending }: { topics: string[]; trending: string | null }) {
  const t = useTranslations('feed');
  const tb = useTranslations('buscar');

  const shown = topics.map(getDomain).filter(Boolean).slice(0, 8);

  return (
    <aside className="sticky top-20 hidden h-fit space-y-4 xl:block">
      <Link
        href="/buscar"
        className="press flex items-center gap-2.5 rounded-pill border border-border bg-surface-2 px-4 py-2.5 text-small text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        {tb('placeholder')}
      </Link>

      {shown.length > 0 && (
        <Card className="p-4">
          <span className="eyebrow mb-2 block text-muted-foreground">{t('trending')}</span>
          <ul className="space-y-0.5">
            {shown.map((d) => (
              <li key={d!.slug}>
                <Link
                  href={`/feed?topic=${d!.slug}`}
                  className="group -mx-2 flex items-center gap-2.5 rounded-button px-2 py-2 transition-colors hover:bg-surface-2"
                >
                  <DomainIcon domain={d!.slug} size={26} />
                  <span className="min-w-0 flex-1 truncate text-small font-medium">{d!.name_es}</span>
                  {trending === d!.slug && <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <WhoToFollow limit={3} />
    </aside>
  );
}

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { ChipRail } from '@/components/ui/chip-rail';
import { AccountRow } from '@/components/social/AccountRow';
import { WhoToFollow } from '@/components/social/WhoToFollow';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { searchProfiles } from '@/lib/api/social';
import { searchNews } from '@/lib/api/plaza';
import { DOMAINS } from '@/lib/domains';
import { relativeLabel } from '@/lib/utils/dates';

type Tab = 'cuentas' | 'temas' | 'historias';

export default function BuscarPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <BuscarInner />
    </Suspense>
  );
}

function BuscarInner() {
  const t = useTranslations('buscar');
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [debounced, setDebounced] = useState(q);
  const [tab, setTab] = useState<Tab>('cuentas');

  // 250 ms debounce: typing "agua" should be one query, not four.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const accounts = useQuery({
    queryKey: ['search-accounts', debounced],
    queryFn: () => searchProfiles(debounced),
    enabled: tab === 'cuentas' && debounced.length >= 2,
  });

  const stories = useQuery({
    queryKey: ['search-news', debounced],
    queryFn: () => searchNews(debounced),
    enabled: tab === 'historias' && debounced.length >= 2,
  });

  const tabs = useMemo(
    () => [
      { value: 'cuentas', label: t('tabAccounts') },
      { value: 'temas', label: t('tabTopics') },
      { value: 'historias', label: t('tabStories') },
    ],
    [t],
  );

  const tooShort = debounced.length < 2;

  return (
    <div className="space-y-4 pb-6">
      <div>
        <span className="eyebrow block text-primary">{t('eyebrow')}</span>
        <h1 className="mt-0.5 font-display text-h1 font-bold">{t('title')}</h1>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          icon
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('placeholder')}
          autoFocus
          className={q ? 'pr-10' : undefined}
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label={t('clear')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <ChipRail layoutId="buscar-tabs" value={tab} onChange={(v) => setTab(v as Tab)} options={tabs} />

      {/* Topics never need a query — they are a fixed set of 13. */}
      {tab === 'temas' ? (
        <div className="grid grid-cols-2 gap-2">
          {DOMAINS.map((d) => (
            <Link
              key={d.slug}
              href={`/feed?topic=${d.slug}`}
              className="press flex items-center gap-2.5 rounded-card border border-border bg-surface p-3 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
            >
              <DomainIcon domain={d.slug} size={32} />
              <span className="min-w-0 flex-1 truncate text-small font-semibold" style={{ color: d.color }}>
                {d.name_es}
              </span>
            </Link>
          ))}
        </div>
      ) : tooShort ? (
        // The empty state is a chance to suggest people, not a dead screen.
        <div className="space-y-4">
          <p className="text-center text-small text-muted-foreground">{t('typeMore')}</p>
          <WhoToFollow limit={3} />
        </div>
      ) : tab === 'cuentas' ? (
        accounts.isLoading ? (
          <SearchSkeleton />
        ) : (accounts.data?.length ?? 0) === 0 ? (
          <Empty message={t('noAccounts', { q: debounced })} />
        ) : (
          <ul className="divide-y divide-hairline">
            {accounts.data!.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </ul>
        )
      ) : stories.isLoading ? (
        <SearchSkeleton />
      ) : (stories.data?.length ?? 0) === 0 ? (
        <Empty message={t('noStories', { q: debounced })} />
      ) : (
        <div className="divide-y divide-hairline">
          {stories.data!.map((n) => (
            <Link key={n.id} href={`/feed/n/${n.id}`} className="group flex gap-3 py-3">
              {n.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.image_url} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-card object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="eyebrow truncate text-muted-foreground">
                  {n.source}
                  {n.published_at ? ` · ${relativeLabel(n.published_at)}` : ''}
                </p>
                <p className="mt-0.5 line-clamp-2 font-display text-small font-bold leading-snug">
                  <span className="link-underline">{n.title_es}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <Pip size={56} mood="neutral" />
      <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">{message}</p>
    </Card>
  );
}

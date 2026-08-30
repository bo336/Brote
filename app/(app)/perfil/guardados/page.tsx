'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { FeedCard } from '@/components/feed/FeedCard';
import { ThreadSheet } from '@/components/feed/ThreadSheet';
import { fetchSavedPosts } from '@/lib/api/perfil-publico';
import type { FeedItem } from '@/lib/api/feed';

/** Your bookmarks. Private: nobody sees them, and no counter is shown anywhere. */
export default function GuardadosPage() {
  const router = useRouter();
  const t = useTranslations('perfilPublico');
  const tc = useTranslations('common');
  const [thread, setThread] = useState<FeedItem | null>(null);

  const q = useInfiniteQuery({
    queryKey: ['saved-posts'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchSavedPosts(pageParam),
    getNextPageParam: (last) => last.next_cursor,
  });

  const items = (q.data?.pages ?? []).flatMap((p) => p.items);

  return (
    <div className="space-y-4 pb-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      <div>
        <span className="eyebrow block text-primary">{t('privateToYou')}</span>
        <h1 className="mt-0.5 font-display text-h1 font-bold">{t('tabSaved')}</h1>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <Pip size={56} mood="neutral" />
          <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">{t('emptySaved')}</p>
        </Card>
      ) : (
        <>
          <div className="divide-y divide-hairline">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} onReply={setThread} />
            ))}
          </div>
          {q.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}

      <ThreadSheet item={thread} onClose={() => setThread(null)} />
    </div>
  );
}

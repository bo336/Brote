'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Pip } from '@/components/pip/Pip';
import { ChipRail } from '@/components/ui/chip-rail';
import { FeedCard } from '@/components/feed/FeedCard';
import { ThreadSheet } from '@/components/feed/ThreadSheet';
import { fetchProfilePosts, fetchSavedPosts } from '@/lib/api/perfil-publico';
import type { FeedItem } from '@/lib/api/feed';

type Tab = 'posts' | 'replies' | 'saved';

/**
 * Publicaciones · Respuestas (· Guardados on your own profile).
 *
 * Keyset paginated like the feed, for the same reason: a profile with a few
 * hundred posts should not send them all, and OFFSET would repeat items as new
 * ones arrive.
 */
export function ProfileTabs({
  userId,
  isMe,
  displayName,
}: {
  userId: string;
  isMe: boolean;
  displayName: string | null;
}) {
  const t = useTranslations('perfilPublico');
  const [tab, setTab] = useState<Tab>('posts');
  const [thread, setThread] = useState<FeedItem | null>(null);

  const q = useInfiniteQuery({
    queryKey: ['profile-posts', userId, tab],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      tab === 'saved' ? fetchSavedPosts(pageParam) : fetchProfilePosts(userId, tab, pageParam),
    getNextPageParam: (last) => last.next_cursor,
    staleTime: 60_000,
  });

  const items = (q.data?.pages ?? []).flatMap((p) => p.items);

  const options = [
    { value: 'posts', label: t('tabPosts') },
    { value: 'replies', label: t('tabReplies') },
    ...(isMe ? [{ value: 'saved', label: t('tabSaved') }] : []),
  ];

  return (
    <section>
      <ChipRail layoutId="profile-tabs" value={tab} onChange={(v) => setTab(v as Tab)} options={options} />

      <div className="mt-3">
        {q.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <Pip size={56} mood="neutral" />
            {/* Specific and warm, never "No hay nada" (design §7). */}
            <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">
              {tab === 'saved'
                ? t('emptySaved')
                : tab === 'replies'
                  ? t('emptyReplies', { name: displayName ?? '' })
                  : t('emptyPosts', { name: displayName ?? '' })}
            </p>
          </Card>
        ) : (
          <>
            <div className="divide-y divide-hairline">
              {items.map((item) => (
                <FeedCard key={item.id} item={item} onReply={setThread} />
              ))}
            </div>
            {q.hasNextPage && (
              <div className="flex justify-center py-4">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={q.isFetchingNextPage}
                  onClick={() => void q.fetchNextPage()}
                >
                  {t('loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ThreadSheet item={thread} onClose={() => setThread(null)} />
    </section>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';
import { Card } from '@/components/ui/card';
import { Pip } from '@/components/pip/Pip';
import { AdSlot } from '@/components/ads/AdSlot';
import { feedAdIndices } from '@/lib/ads/policy';
import { FeedCard } from './FeedCard';
import { WhoToFollow } from '@/components/social/WhoToFollow';
import { NewPostsPill } from './NewPostsPill';
import { MilestoneNotice } from './MilestoneNotice';
import { useNewPosts } from '@/hooks/use-new-posts';
import { useSession } from '@/stores/session';
import { fetchFeedPage, markSeen, type FeedCursor, type FeedItem, type FeedTab } from '@/lib/api/feed';

const PAGE_SIZE = 20;

/**
 * The timeline.
 *
 * Two things here are load-bearing and easy to get wrong:
 *
 * 1. `nowRef` is fixed for the life of a (tab, topic) scroll. Recency decay is
 *    part of the server score, so sending a fresh `now` on page 2 would
 *    re-rank everything and the reader would see items they already scrolled
 *    past. It resets only when the tab or topic changes.
 * 2. The sentinel prefetches 800px early, so the next page is usually already
 *    in hand by the time the reader gets there and the scroll never stalls.
 */
export function InfiniteFeed({
  tab,
  topic,
  onReply,
  isKid,
  showWhoToFollow,
  reloadToken = 0,
}: {
  tab: FeedTab;
  topic: string | null;
  onReply?: (item: FeedItem) => void;
  isKid?: boolean;
  showWhoToFollow?: boolean;
  /**
   * Bumped by the parent after you publish. It has to reset `nowRef` too, not
   * just refetch: the ranking window is anchored at `now`, so a plain
   * invalidate would ask the server for the same slice of time your post is
   * not in yet, and you would watch your own post fail to appear.
   */
  reloadToken?: number;
}) {
  const t = useTranslations('feed');
  const myId = useSession((st) => st.profile?.id);

  // One timestamp per scroll, per (tab, topic).
  const nowRef = useRef<string>(new Date().toISOString());
  const scrollKey = `${tab}|${topic ?? 'all'}|${reloadToken}`;
  const lastKeyRef = useRef(scrollKey);
  if (lastKeyRef.current !== scrollKey) {
    lastKeyRef.current = scrollKey;
    nowRef.current = new Date().toISOString();
  }

  const q = useInfiniteQuery({
    queryKey: ['feed', tab, topic ?? 'all'],
    initialPageParam: null as FeedCursor | null,
    queryFn: ({ pageParam }) => fetchFeedPage(tab, topic, pageParam, nowRef.current, PAGE_SIZE),
    getNextPageParam: (last) => last.next_cursor,
    staleTime: 60_000,
  });

  const items = useMemo(() => (q.data?.pages ?? []).flatMap((p) => p.items), [q.data]);

  const hasOwnMilestone = useMemo(
    () => items.some((i) => i.kind === 'milestone' && i.author?.id === myId),
    [items, myId],
  );

  // Live arrivals, counted but never inserted — see NewPostsPill.
  const newPosts = useNewPosts({ enabled: !isKid && !topic, myId });

  function jumpToNew() {
    newPosts.reset();
    nowRef.current = new Date().toISOString();
    void q.refetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // `scrollKey` already moved when reloadToken changed, which reset nowRef on
  // this render; the refetch pulls page 1 through the new window.
  const lastReload = useRef(reloadToken);
  useEffect(() => {
    if (lastReload.current === reloadToken) return;
    lastReload.current = reloadToken;
    newPosts.reset();
    void q.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  // ── impressions ───────────────────────────────────────────────────────────
  // Batched on a 2s debounce: one RPC per burst of scrolling instead of one
  // per row. Fire-and-forget, so a failure never interrupts the scroll.
  const pending = useRef<Set<string>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueSeen = useCallback((id: string) => {
    pending.current.add(id);
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      const ids = Array.from(pending.current);
      pending.current.clear();
      flushTimer.current = null;
      if (ids.length) void markSeen(ids);
    }, 2000);
  }, []);

  useEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    [],
  );

  // ── the "load more" sentinel ──────────────────────────────────────────────
  const sentinel = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = q;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '800px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Ads keep running through the one policy gate; kids never reach it anyway.
  const adAt = useMemo(() => new Set(feedAdIndices(items.length)), [items.length]);

  if (q.isLoading) return <FeedSkeletons />;

  if (q.isError) {
    return (
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Pip size={56} mood="worried" />
        <p className="text-small text-muted-foreground">{t('loadMoreFailed')}</p>
        <Button variant="secondary" size="sm" onClick={() => q.refetch()}>
          {t('retry')}
        </Button>
      </Card>
    );
  }

  if (items.length === 0) {
    const msg =
      tab === 'siguiendo' ? t('emptySiguiendo') : tab === 'novedades' ? t('emptyNovedades') : t('emptyParaVos');
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <Pip size={64} mood="neutral" />
        <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">{msg}</p>
      </Card>
    );
  }

  return (
    <>
      <NewPostsPill count={newPosts.count} onClick={jumpToNew} />

      <MilestoneNotice show={hasOwnMilestone} />

      <div className="divide-y divide-hairline">
        {items.map((item, i) => (
          <div key={item.id}>
            {/* Reveal index is capped so page 5 of an infinite scroll does not
                animate in one slow row at a time. */}
            <Reveal index={Math.min(i % PAGE_SIZE, 6)}>
              <FeedCard item={item} onReply={onReply} onSeen={queueSeen} readOnly={isKid} />
            </Reveal>
            {adAt.has(i) && <AdSlot placement="news-feed" className="py-3" />}
            {showWhoToFollow && i === 4 && <WhoToFollow className="my-3" />}
          </div>
        ))}
      </div>

      {/* Sentinel + the three states below it. */}
      <div ref={sentinel} aria-hidden className="h-px w-full" />

      {isFetchingNextPage && <FeedSkeletons />}

      {/*
        Explicit fallback. IntersectionObserver is throttled or disabled in more
        places than you would expect — background tabs, some mobile browsers,
        reduced-motion and accessibility tooling — and when it does not fire the
        feed simply dead-ends with no way forward. A real control means the
        scroll is never the only way to reach page 2, and it is reachable by
        keyboard, which a sentinel never is.
      */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="secondary" size="sm" onClick={() => void fetchNextPage()}>
            {t('loadMore')}
          </Button>
        </div>
      )}

      {!hasNextPage && (
        <Card className="mt-4 flex flex-col items-center gap-2 p-6 text-center">
          <Pip size={56} mood="happy" />
          <p className="font-display text-h3 font-bold">{t('endTitle')}</p>
          <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">{t('endBody')}</p>
          <Button variant="secondary" size="sm" asChild className="mt-1">
            <Link href="/acciones">{t('endCta')}</Link>
          </Button>
        </Card>
      )}
    </>
  );
}

/** Skeleton rows matched to real item height — never a spinner (design §5). */
function FeedSkeletons() {
  return (
    <div className="divide-y divide-hairline">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 py-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

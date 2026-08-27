'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { SectionTabs } from '@/components/plaza/SectionTabs';
import { PulseStrip } from '@/components/plaza/PulseStrip';
import { ChipRail } from '@/components/ui/chip-rail';
import { BackToTop } from '@/components/ui/back-to-top';
import { Skeleton } from '@/components/ui/skeleton';
import { Composer } from '@/components/feed/Composer';
import { InfiniteFeed } from '@/components/feed/InfiniteFeed';
import { ThreadSheet } from '@/components/feed/ThreadSheet';
import { RightRail } from '@/components/plaza/RightRail';
import { fetchPulse, type FeedItem, type FeedTab } from '@/lib/api/feed';
import { fetchMyFollowingIds } from '@/lib/api/social';
import { useSession } from '@/stores/session';
import { DOMAINS, getDomain } from '@/lib/domains';

const TAB_KEY = 'brote:feed:tab';
const TABS: FeedTab[] = ['para_vos', 'siguiendo', 'novedades'];

export default function FeedPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <FeedInner />
    </Suspense>
  );
}

/**
 * La Plaza.
 *
 * The home of the adult product: three tabs, a topic filter applied
 * server-side, a live strip whose numbers all come from a real count, and an
 * infinite personalised timeline.
 *
 * Kid accounts get a read-only news river with no tabs and no composer. That
 * is a courtesy here — the server refuses posts, reactions and follows from a
 * kid account regardless of what the client renders.
 */
function FeedInner() {
  const t = useTranslations('feed');
  const params = useSearchParams();
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const isKid = profile?.accountType === 'kid';

  const [tab, setTab] = useState<FeedTab>('para_vos');
  const [topic, setTopic] = useState<string>(params.get('topic') ?? 'all');
  const [thread, setThread] = useState<FeedItem | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Remember the tab, but never for a kid (they only ever have one).
  useEffect(() => {
    if (isKid) {
      setTab('novedades');
      return;
    }
    const fromUrl = params.get('tab');
    if (fromUrl && (TABS as string[]).includes(fromUrl)) {
      setTab(fromUrl as FeedTab);
      return;
    }
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (saved && (TABS as string[]).includes(saved)) setTab(saved as FeedTab);
    } catch {
      /* private mode — the default tab is fine */
    }
  }, [isKid, params]);

  /**
   * Push the tab and topic into the URL so the screen you are looking at is
   * the screen you can send someone — /feed?tab=siguiendo&topic=agua. `replace`
   * rather than `push`: the back button should leave the Plaza, not walk
   * backwards through every chip you tapped.
   */
  function syncUrl(nextTab: FeedTab, nextTopic: string) {
    const q = new URLSearchParams();
    if (nextTab !== 'para_vos') q.set('tab', nextTab);
    if (nextTopic !== 'all') q.set('topic', nextTopic);
    const qs = q.toString();
    router.replace(qs ? `/feed?${qs}` : '/feed', { scroll: false });
  }

  function changeTab(next: FeedTab) {
    setTab(next);
    syncUrl(next, topic);
  }

  function changeTopic(next: string) {
    setTopic(next);
    syncUrl(tab, next);
  }

  useEffect(() => {
    if (isKid) return;
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab, isKid]);

  const pulse = useQuery({ queryKey: ['feed-pulse'], queryFn: fetchPulse, staleTime: 5 * 60_000 });

  // "A quién seguir" only earns its place while the graph is thin.
  const followingQ = useQuery({
    queryKey: ['my-following'],
    queryFn: fetchMyFollowingIds,
    enabled: !isKid,
    staleTime: 5 * 60_000,
  });
  const showWhoToFollow = !isKid && (followingQ.data?.length ?? 0) < 5;

  // Only domains that actually have something in them. A chip that filters to
  // an empty feed is worse than no chip.
  const topicOptions = useMemo(() => {
    const withContent = new Set(pulse.data?.topics ?? []);
    return [
      { value: 'all', label: 'Todo' },
      ...DOMAINS.filter((d) => withContent.has(d.slug)).map((d) => ({
        value: d.slug,
        label: d.name_es,
        color: d.color,
      })),
    ];
  }, [pulse.data?.topics]);

  const trending = pulse.data?.trending ? getDomain(pulse.data.trending) : undefined;

  return (
    // data-shell="wide" widens the app shell for this route only — see the
    // `main:has(...)` rule in globals.css.
    <div data-shell="wide" className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
      <div className="min-w-0 space-y-4">
        {!isKid && (
          <SectionTabs
            value={tab}
            onChange={(v) => changeTab(v as FeedTab)}
            options={[
              { value: 'para_vos', label: t('tabParaVos') },
              { value: 'siguiendo', label: t('tabSiguiendo') },
              { value: 'novedades', label: t('tabNovedades') },
            ]}
          />
        )}

        {isKid && (
          <div>
            <span className="eyebrow block text-primary">{t('title')}</span>
            <h1 className="mt-1 font-display text-display-l font-extrabold leading-tight">
              {t('tabNovedades')}
            </h1>
            <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
              {t('kidNotice')}
            </p>
          </div>
        )}

        {topicOptions.length > 1 && (
          <ChipRail
            layoutId="feed-topic"
            value={topic}
            onChange={changeTopic}
            options={topicOptions}
          />
        )}

        {/* The one dark band per screen. Every figure comes from feed_pulse(). */}
        {pulse.data && (
          <PulseStrip
            today={pulse.data.today}
            total={pulse.data.total}
            trendingLabel={trending?.name_es ?? null}
            trendingColor={trending?.color}
          />
        )}

        {!isKid && (
          // Publishing has to put your post on screen. Scrolling to the top of a
          // timeline that does not contain it yet just looks broken.
          <Composer
            onPosted={() => {
              setReloadToken((n) => n + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        <InfiniteFeed
          tab={tab}
          topic={topic === 'all' ? null : topic}
          onReply={setThread}
          isKid={isKid}
          showWhoToFollow={showWhoToFollow}
          reloadToken={reloadToken}
        />

        <ThreadSheet item={thread} onClose={() => setThread(null)} />
        <BackToTop />
      </div>

      {!isKid && (
        <RightRail topics={pulse.data?.topics ?? []} trending={pulse.data?.trending ?? null} />
      )}
    </div>
  );
}

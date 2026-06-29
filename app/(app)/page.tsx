'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight, ChevronDown, Sparkles, AlertTriangle } from 'lucide-react';
import { Mundo } from '@/components/mundo/Mundo';
import { SectionHeader } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyActionRow } from '@/components/acciones/DailyActionRow';
import { Pip } from '@/components/pip/Pip';
import { ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSession } from '@/stores/session';
import { greetingKey } from '@/lib/utils/dates';
import { isStreakAtRisk } from '@/lib/streak';
import { useDailySet, useTodayCompletions, useDailyPool, useCompleteActivity } from '@/hooks/use-daily-set';
import { fetchDailyChallenge } from '@/lib/api/home';
import type { ActivityRow } from '@/lib/supabase/rows';

export default function HoyPage() {
  const t = useTranslations('home');
  const tp = useTranslations('pip');
  const tc = useTranslations('common');
  const profile = useSession((s) => s.profile);

  const dailySet = useDailySet();
  const completions = useTodayCompletions();
  const pool = useDailyPool();
  const complete = useCompleteActivity();
  const challenge = useQuery({ queryKey: ['daily-challenge'], queryFn: fetchDailyChallenge, staleTime: 5 * 60_000 });

  const [showMore, setShowMore] = useState(false);

  const greeting = useMemo(() => {
    const key = greetingKey();
    return t(
      key === 'morning'
        ? 'greetingMorning'
        : key === 'afternoon'
          ? 'greetingAfternoon'
          : key === 'evening'
            ? 'greetingEvening'
            : 'greetingNight',
    );
  }, [t]);

  const set = dailySet.data ?? [];
  const done = completions.data ?? new Set<string>();
  const doneCount = set.filter((a) => done.has(a.id)).length;
  const allDone = set.length > 0 && doneCount === set.length;

  const atRisk = isStreakAtRisk(profile?.lastStreakDate ?? null, profile?.currentStreak ?? 0);

  // Extra daily actions not already in today's set.
  const extra = (pool.data ?? []).filter((a) => !set.some((s) => s.id === a.id));

  function onComplete(a: ActivityRow) {
    if (done.has(a.id) || complete.isPending) return;
    complete.mutate({ activityId: a.id });
  }

  return (
    <div className="space-y-6">
      {/* Greeting + Pip */}
      <div className="flex items-center gap-3">
        <Pip size={52} mood={atRisk ? 'worried' : 'happy'} />
        <div>
          <h1 className="font-display text-h1 font-bold leading-tight">
            {greeting}
            {profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-small text-muted-foreground">{tp('homeGreeting')}</p>
        </div>
      </div>

      {/* Tu Mundo hero */}
      <Link href="/perfil" className="block" aria-label={t('tapWorld')}>
        <Mundo mundo={profile?.mundoState} height={236} />
      </Link>

      {/* Streak at risk */}
      {atRisk && (
        <Card className="flex items-center gap-3 border-brote-coral/40 bg-brote-coral/5 p-3.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-brote-coral" />
          <div>
            <p className="text-small font-semibold">{t('streakRiskTitle')}</p>
            <p className="text-caption text-muted-foreground">{t('streakRiskBody')}</p>
          </div>
        </Card>
      )}

      {/* Daily Set */}
      <section aria-labelledby="daily-set">
        <SectionHeader
          title={t('dailySetTitle')}
          subtitle={
            dailySet.isLoading
              ? t('dailySetSubtitle')
              : t('dailyProgress', { done: doneCount, total: set.length })
          }
        />

        {dailySet.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[68px] w-full" />
            ))}
          </div>
        ) : allDone ? (
          <Card className="flex items-center gap-3 p-4">
            <Pip size={48} mood="celebrating" />
            <div>
              <p className="font-display text-h3 font-bold">{t('dailySetDoneTitle')}</p>
              <p className="text-small text-muted-foreground">{t('dailySetDoneBody')}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            <ProgressBar value={set.length ? doneCount / set.length : 0} className="mb-2" />
            {set.map((a) => (
              <DailyActionRow
                key={a.id}
                title={a.title_es}
                domain={a.domain_slug}
                points={a.base_points}
                done={done.has(a.id)}
                onComplete={() => onComplete(a)}
              />
            ))}
          </div>
        )}

        {/* más acciones diarias */}
        <div className="mt-3">
          <Button variant="ghost" size="sm" block onClick={() => setShowMore((v) => !v)}>
            {t('moreDaily')}
            <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </Button>
          {showMore && (
            <div className="mt-2 space-y-2">
              {extra.map((a) => (
                <DailyActionRow
                  key={a.id}
                  title={a.title_es}
                  domain={a.domain_slug}
                  points={a.base_points}
                  done={done.has(a.id)}
                  onComplete={() => onComplete(a)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reto del día */}
      <section>
        <SectionHeader title={t('retoTitle')} />
        {challenge.data ? (
          <Card className="flex items-center gap-3 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-brote-sun/15 text-brote-sun">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{challenge.data.challenge.title_es}</p>
              <p className="text-small text-muted-foreground tnum">
                {challenge.data.progress}/{challenge.data.challenge.target_value} · +
                {challenge.data.challenge.reward_points} pts
              </p>
            </div>
          </Card>
        ) : (
          <Skeleton className="h-[80px] w-full" />
        )}
      </section>

      {/* Para Vos peek */}
      <section>
        <SectionHeader
          title={t('paraVosTitle')}
          subtitle={t('paraVosSubtitle')}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/acciones">{tc('seeAll')}</Link>
            </Button>
          }
        />
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <Pip size={44} />
            <p className="text-small text-muted-foreground">Acciones más grandes, elegidas para vos.</p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/acciones">
              {tc('seeMore')} <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}

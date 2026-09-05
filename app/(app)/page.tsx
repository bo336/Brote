'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight, ChevronDown, Sparkles, AlertTriangle, Newspaper, Users } from 'lucide-react';
import { MundoPoster } from '@/components/mundo3d/poster/MundoPoster';
import { ImpactCard } from '@/components/impacto/ImpactCard';
import { EntradaAcademia } from '@/components/academia/EntradaAcademia';
import { RoutineSection } from '@/components/habitos/RoutineSection';
import { NewsNudge } from '@/components/plaza/NewsNudge';
import { SectionHeader } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { LinkRow } from '@/components/ui/link-row';
import { Reveal } from '@/components/ui/reveal';
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
import { fetchProjects } from '@/lib/api/plaza';
import type { ActivityRow } from '@/lib/supabase/rows';

export default function HoyPage() {
  const t = useTranslations('home');
  const tp = useTranslations('pip');
  const tpr = useTranslations('proyectos');
  const tc = useTranslations('common');
  const profile = useSession((s) => s.profile);

  // Real count, so the card never claims projects that are not there.
  const projectsQ = useQuery({
    queryKey: ['projects', profile?.id],
    queryFn: () => fetchProjects(profile?.id),
    staleTime: 5 * 60_000,
  });
  const openProjects = (projectsQ.data ?? []).filter((p) => p.status === 'active').length;

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

  // "miércoles 21 de agosto", capitalised. Computed once per render rather
  // than per row so the string is stable across the page.
  const today = useMemo(() => {
    const s = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);

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
      {/* Greeting + Pip. The date eyebrow is the §2 micro-label: it grounds
          the screen in "today", which is what this page is about. */}
      <div className="flex items-center gap-3">
        <Pip size={52} mood={atRisk ? 'worried' : 'happy'} pipStyle={profile?.pipStyle} />
        <div className="min-w-0">
          <span className="eyebrow block text-primary">{today}</span>
          <h1 className="mt-0.5 font-display text-h1 font-bold leading-tight">
            {greeting}
            {profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{tp('homeGreeting')}</p>
        </div>
      </div>

      {/* Tu Mundo hero — the one hero media per page, so it carries the
          signature leaf notch (§4). */}
      <MundoPoster
        mundo={profile?.mundoState}
        height={320}
        className="leaf-clip shadow-soft-lg"
      />

      {/* Streak at risk */}
      {atRisk && (
        <Card className="flex items-center gap-3 border-brote-coral/40 bg-brote-coral/[0.07] p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brote-coral/15">
            <AlertTriangle className="h-4.5 w-4.5 text-brote-coral" />
          </span>
          <div className="min-w-0">
            <p className="text-small font-semibold">{t('streakRiskTitle')}</p>
            <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{t('streakRiskBody')}</p>
          </div>
        </Card>
      )}

      {/* Daily Set */}
      <section aria-labelledby="daily-set">
        <SectionHeader
          eyebrow="Hoy"
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

      {/* Mi rutina (F14.5) — sits directly under the daily set, and always
          renders so it can actually be discovered. */}
      <RoutineSection />

      {/* La Academia. The mobile tab bar keeps five tabs, so this row is how the
          section is discovered on a phone — and since phase 2 it shows the real
          sap left today instead of a description that never changes.
          The news row below used a 📰 emoji as its icon, which §0 forbids for
          anything functional, and tinted its tile with `bg-brote-aqua/15` — a
          colour that did not exist, so the tile rendered transparent. */}
      <section className="space-y-2.5">
        <EntradaAcademia />
        {/* Always-present way into the feed (F15.19). The floating nudge below
            is the once-a-day prompt; this is the permanent door, so news access
            never depends on catching a transient banner. */}
        <LinkRow
          href="/feed"
          icon={<Newspaper className="h-5 w-5" />}
          accent="#2DB4D4"
          title="Últimas noticias y comentarios"
          description="Qué está pasando y qué está opinando la gente"
        />
        {/* Projects moved under Acciones, so they need a door on Inicio or the
            move would simply bury them. Deep-links straight to the tab. */}
        <LinkRow
          href="/acciones?tab=proyectos"
          icon={<Users className="h-5 w-5" />}
          accent="#FF8A3D"
          title={tpr('nearbyTitle')}
          description={
            openProjects > 0 ? tpr('nearbyBody', { n: openProjects }) : 'Sumate a algo que ya está pasando'
          }
        />
      </section>

      {/* A quiet nudge toward the feed once you have actually done something
          today — at most once a day, and dismissible (F14.9). */}
      <NewsNudge completionsToday={doneCount} />

      {/* Tu impacto real (F12.2) */}
      <Reveal>
        <section>
          <SectionHeader eyebrow="Acumulado" title="Tu impacto real" subtitle="Lo que ahorraste de verdad, en números" />
          <ImpactCard period="total" />
        </section>
      </Reveal>

      {/* Reto del día */}
      <Reveal index={1}>
        <section>
          <SectionHeader eyebrow="Desafío" title={t('retoTitle')} />
          {challenge.data ? (
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-brote-sun/15 text-brote-sun">
                <Sparkles className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{challenge.data.challenge.title_es}</p>
                <p className="mt-1 text-small text-muted-foreground tnum">
                  {challenge.data.progress}/{challenge.data.challenge.target_value} · +
                  {challenge.data.challenge.reward_points} pts
                </p>
                {/* The numbers alone did not show how close you were. */}
                <ProgressBar
                  value={
                    challenge.data.challenge.target_value
                      ? Math.min(1, challenge.data.progress / challenge.data.challenge.target_value)
                      : 0
                  }
                  className="mt-2"
                />
              </div>
            </Card>
          ) : (
            <Skeleton className="h-[80px] w-full" />
          )}
        </section>
      </Reveal>

      {/* Para Vos peek */}
      <Reveal index={2}>
        <section>
          <SectionHeader
            eyebrow="Para vos"
            title={t('paraVosTitle')}
            subtitle={t('paraVosSubtitle')}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/acciones">{tc('seeAll')}</Link>
              </Button>
            }
          />
          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Pip size={44} />
              <p className="text-small leading-relaxed text-muted-foreground">
                Acciones más grandes, elegidas para vos.
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild className="shrink-0">
              <Link href="/acciones">
                {tc('seeMore')} <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </section>
      </Reveal>
    </div>
  );
}

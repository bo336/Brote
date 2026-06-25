'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Sparkles } from 'lucide-react';
import { MundoHeroFallback } from '@/components/mundo/MundoHeroFallback';
import { SectionHeader } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { DailyActionRow } from '@/components/acciones/DailyActionRow';
import { Pip } from '@/components/pip/Pip';
import { ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSession } from '@/stores/session';
import { greetingKey } from '@/lib/utils/dates';
import { toast } from '@/stores/toast';

/**
 * Hoy / Home — the daily hub (BUILD_SPEC §8.3). This scaffold renders the real
 * layout and design system; the Daily Set and reward loop are wired to
 * `complete_activity` in step 4. Demo rows use local state to show the UX.
 */
export default function HoyPage() {
  const t = useTranslations('home');
  const tp = useTranslations('pip');
  const tc = useTranslations('common');
  const profile = useSession((s) => s.profile);

  const greeting = useMemo(() => {
    const key = greetingKey();
    return key === 'morning'
      ? t('greetingMorning')
      : key === 'afternoon'
        ? t('greetingAfternoon')
        : key === 'evening'
          ? t('greetingEvening')
          : t('greetingNight');
  }, [t]);

  // Demo daily set (replaced by the personalized set in step 4).
  const [set, setSet] = useState([
    { id: '1', title: 'Ducha corta (≤5 min)', domain: 'agua', points: 50, done: false },
    { id: '2', title: 'Caminá un trayecto en vez de ir en auto', domain: 'movilidad', points: 150, done: false },
    { id: '3', title: 'Comé una comida sin carne hoy', domain: 'alimentacion', points: 150, done: false },
    { id: '4', title: 'Separá bien tus residuos hoy', domain: 'residuos', points: 50, done: false },
  ]);

  const doneCount = set.filter((s) => s.done).length;
  const allDone = doneCount === set.length;

  function complete(id: string, points: number) {
    setSet((prev) => prev.map((s) => (s.id === id ? { ...s, done: true } : s)));
    toast.points(points);
  }

  return (
    <div className="space-y-6">
      {/* Greeting + Pip */}
      <div className="flex items-center gap-3">
        <Pip size={52} mood="happy" />
        <div>
          <h1 className="font-display text-h1 font-bold leading-tight">
            {greeting}
            {profile?.displayName ? `, ${profile.displayName}` : ''}
          </h1>
          <p className="text-small text-muted-foreground">{tp('homeGreeting')}</p>
        </div>
      </div>

      {/* Tu Mundo hero */}
      <Link href="/perfil" className="block" aria-label={t('tapWorld')}>
        <MundoHeroFallback mundo={profile?.mundoState} height={236} />
      </Link>

      {/* Daily Set */}
      <section aria-labelledby="daily-set">
        <SectionHeader
          title={t('dailySetTitle')}
          subtitle={t('dailyProgress', { done: doneCount, total: set.length })}
        />
        {allDone ? (
          <Card className="flex items-center gap-3 p-4">
            <Pip size={48} mood="celebrating" />
            <div>
              <p className="font-display text-h3 font-bold">{t('dailySetDoneTitle')}</p>
              <p className="text-small text-muted-foreground">{t('dailySetDoneBody')}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            <ProgressBar value={doneCount / set.length} className="mb-2" />
            {set.map((s) => (
              <DailyActionRow
                key={s.id}
                title={s.title}
                domain={s.domain}
                points={s.points}
                done={s.done}
                onComplete={() => complete(s.id, s.points)}
              />
            ))}
          </div>
        )}
        <div className="mt-3 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/acciones">{t('moreDaily')} <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Reto del día */}
      <section>
        <SectionHeader title={t('retoTitle')} />
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-brote-sun/15 text-brote-sun">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Sumá 2 acciones de Agua hoy</p>
            <p className="text-small text-muted-foreground tnum">0/2 · +300 pts</p>
          </div>
        </Card>
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
        <Card className="flex items-center gap-3 p-4">
          <Pip size={44} />
          <p className="text-small text-muted-foreground">
            Cuando inicies sesión te armo recomendaciones según tus intereses. 🌱
          </p>
        </Card>
      </section>
    </div>
  );
}

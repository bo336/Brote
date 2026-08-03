'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Pill } from '@/components/ui/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { getDomain } from '@/lib/domains';
import { meetsRank } from '@/lib/ranks';
import { lockLabel } from '@/lib/recommendations';
import { formatPoints } from '@/lib/points';
import { activityDescription, activityInstructions } from '@/lib/activity-copy';
import { useSession } from '@/stores/session';
import { fetchActivityBySlug } from '@/lib/api/catalog';
import { addHabit } from '@/lib/api/competencias';
import { useCatalogCompletions } from '@/hooks/use-catalog';
import { completeActivity } from '@/lib/api/activities';
import { celebrateCompletion } from '@/lib/rewards';
import { toast } from '@/stores/toast';
import Link from 'next/link';
import type { Impact } from '@/lib/points';

const EFFORT_ES = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' } as const;
const IMPACT_ES = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const;

/**
 * Activity detail. Trust-based completion model: no photo verification —
 * every action is marked done on the user's honor (IMPROVEMENT_PLAN F1.6).
 */
export default function ActivityDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations('acciones');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const [busy, setBusy] = useState(false);
  const [habitBusy, setHabitBusy] = useState(false);

  const activityQ = useQuery({
    queryKey: ['activity', params.slug],
    queryFn: () => fetchActivityBySlug(params.slug),
    enabled: !!params.slug,
  });
  const completions = useCatalogCompletions(profile?.id);

  const a = activityQ.data;
  const completion = a ? completions.data?.get(a.id) : undefined;
  const locked = a ? !meetsRank(profile?.totalXp ?? 0, a.min_rank_slug) : false;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['catalog-completions'] });
    qc.invalidateQueries({ queryKey: ['domain-points'] });
  }

  async function doComplete() {
    if (!a || busy) return;
    setBusy(true);
    try {
      const result = await completeActivity(a.id);
      celebrateCompletion(result);
      invalidate();
    } catch (e) {
      toast.error('Ups', e instanceof Error ? e.message : 'No se pudo completar');
    } finally {
      setBusy(false);
    }
  }

  if (activityQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!a) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos esa acción.</p>
        <Button variant="secondary" asChild>
          <Link href="/acciones">{tc('back')}</Link>
        </Button>
      </div>
    );
  }

  const domain = getDomain(a.domain_slug);
  const isDone = completion?.status === 'honor' || completion?.status === 'verified';

  return (
    <div className="space-y-5 pb-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      {/* Header */}
      <div
        className="flex flex-col items-center rounded-card p-6 text-center"
        style={{ background: `linear-gradient(160deg, ${domain?.color}22, transparent)` }}
      >
        <DomainIcon domain={a.domain_slug} size={72} />
        <h1 className="mt-3 font-display text-h1 font-bold">{a.title_es}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {domain && (
            <Pill color={domain.color} size="sm">
              {domain.name_es}
            </Pill>
          )}
          <Pill size="sm">{EFFORT_ES[a.effort]}</Pill>
          <Pill size="sm">Impacto {IMPACT_ES[a.impact]}</Pill>
        </div>
        <span className="mt-3 font-display text-display-l font-extrabold text-brote-sun tnum">
          +{formatPoints(a.base_points)}
        </span>
      </div>

      {/* Description */}
      <Card className="p-4">
        <p className="text-body">{activityDescription(a.title_es, a.impact as Impact, a.description_es)}</p>
      </Card>

      {/* Instructions */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">{t('instructions')}</h2>
        <ol className="space-y-2">
          {activityInstructions(a.verification, a.instructions_es).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-small font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-body">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Follow as a habit (F12.6) — only makes sense for repeatable actions. */}
      {(a.type === 'daily' || a.frequency === 'recurring') && (
        <Card className="flex items-center gap-3 p-4">
          <span className="text-2xl">🔁</span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold">Convertilo en hábito</p>
            <p className="text-small text-muted-foreground">Seguilo día a día y ganá bonus cada 7 y 30 días.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={habitBusy}
            onClick={async () => {
              setHabitBusy(true);
              const res = await addHabit(a.id);
              setHabitBusy(false);
              if (res.ok) toast.success('¡Hábito agregado!', 'Lo vas a ver en tu inicio');
              else toast.error('No se pudo', res.error);
            }}
          >
            Seguir
          </Button>
        </Card>
      )}

      {/* Impact */}
      {a.impact_equivalency_es && (
        <Card className="flex items-center gap-3 bg-primary/5 p-4">
          <span className="text-2xl">🌍</span>
          <div>
            <p className="text-small font-semibold">{t('impactEquivalency')}</p>
            <p className="text-small text-muted-foreground">{a.impact_equivalency_es}</p>
          </div>
        </Card>
      )}

      {/* CTA */}
      <div className="sticky bottom-24 lg:bottom-4">
        {locked ? (
          <Button block variant="secondary" disabled>
            <Lock className="h-4 w-4" /> {t('lockedUntil', { rank: lockLabel(a.min_rank_slug) })}
          </Button>
        ) : isDone ? (
          <Button block variant="secondary" disabled>
            <Check className="h-4 w-4" /> {t('alreadyDone')}
          </Button>
        ) : (
          <Button block variant="primary" loading={busy} onClick={doComplete}>
            <Check className="h-4 w-4" /> {t('markDone')}
          </Button>
        )}
      </div>
    </div>
  );
}

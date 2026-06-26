'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Camera, Check, Lock, Loader2 } from 'lucide-react';
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
import { fetchActivityBySlug, uploadVerificationPhoto, triggerVerification } from '@/lib/api/catalog';
import { useCatalogCompletions } from '@/hooks/use-catalog';
import { completeActivity } from '@/lib/api/activities';
import { celebrateCompletion } from '@/lib/rewards';
import { toast } from '@/stores/toast';
import Link from 'next/link';
import type { Impact } from '@/lib/points';

const EFFORT_ES = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' } as const;
const IMPACT_ES = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const;

export default function ActivityDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations('acciones');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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

  async function doHonor() {
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

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!a || !file || !profile?.id || busy) return;
    setBusy(true);
    try {
      const path = await uploadVerificationPhoto(profile.id, file);
      const result = await completeActivity(a.id, path);
      celebrateCompletion(result); // shows "verificando…"
      triggerVerification(a.id);
      invalidate();
    } catch (err) {
      toast.error('No se pudo subir', err instanceof Error ? err.message : 'Probá de nuevo');
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
  const isPhoto = a.verification === 'photo_ai';
  const isDone = completion?.status === 'honor' || completion?.status === 'verified';
  const isPending = completion?.status === 'pending';

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
          {isPhoto && (
            <Pill size="sm" className="text-brote-green">
              <Camera className="h-3 w-3" /> Verificada
            </Pill>
          )}
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
        ) : isPending ? (
          <Button block variant="secondary" disabled>
            <Loader2 className="h-4 w-4 animate-spin" /> {t('verifying')}
          </Button>
        ) : isPhoto ? (
          <>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoSelected} />
            <Button block variant="primary" loading={busy} onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> {t('uploadVerify')}
            </Button>
          </>
        ) : (
          <Button block variant="primary" loading={busy} onClick={doHonor}>
            <Check className="h-4 w-4" /> {t('markDone')}
          </Button>
        )}
      </div>
    </div>
  );
}

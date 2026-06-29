'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Trash2, Target, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Sheet } from '@/components/ui/sheet';
import { ProgressBar } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useSession } from '@/stores/session';
import { fetchGoals, createGoal, deleteGoal, type NewGoalInput } from '@/lib/api/profile';
import { DOMAINS } from '@/lib/domains';
import { toast } from '@/stores/toast';
import type { GoalRow } from '@/lib/supabase/rows';

const METRICS = [
  { v: 'completions', label: 'Cantidad de acciones', unit: 'acciones' },
  { v: 'daily_actions', label: 'Acciones diarias', unit: 'diarias' },
  { v: 'streak_days', label: 'Días de racha', unit: 'días' },
  { v: 'xp', label: 'Puntos', unit: 'pts' },
  { v: 'domain_points', label: 'Puntos en un tema', unit: 'pts' },
];

const SUGGESTED: NewGoalInput[] = [
  { titleEs: 'Hacé 5 acciones de Agua esta semana', metric: 'domain_points', domainSlug: 'agua', targetValue: 500, period: 'weekly' },
  { titleEs: 'Mantené 7 días de racha', metric: 'streak_days', domainSlug: null, targetValue: 7, period: 'weekly' },
  { titleEs: 'Completá 20 acciones este mes', metric: 'completions', domainSlug: null, targetValue: 20, period: 'monthly' },
  { titleEs: 'Sumá 3.000 puntos este mes', metric: 'xp', domainSlug: null, targetValue: 3000, period: 'monthly' },
];

export default function ObjetivosPage() {
  const t = useTranslations('objetivos');
  const tp = useTranslations('perfil');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);

  const goalsQ = useQuery({ queryKey: ['goals', profile?.id], queryFn: () => fetchGoals(profile!.id), enabled: !!profile?.id });
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState('completions');
  const [domainSlug, setDomainSlug] = useState('agua');
  const [target, setTarget] = useState(5);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const createM = useMutation({
    mutationFn: (input: NewGoalInput) => createGoal(profile!.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      setOpen(false);
      toast.success('¡Objetivo creado!');
    },
    onError: (e) => toast.error('Ups', e instanceof Error ? e.message : ''),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  function submitCustom() {
    const m = METRICS.find((x) => x.v === metric)!;
    const dom = metric === 'domain_points' ? DOMAINS.find((d) => d.slug === domainSlug)?.name_es : null;
    const title = metric === 'domain_points' ? `Sumá ${target} pts en ${dom}` : `${m.label}: ${target} ${m.unit}`;
    createM.mutate({ titleEs: title, metric, domainSlug: metric === 'domain_points' ? domainSlug : null, targetValue: target, period });
  }

  const goals = goalsQ.data ?? [];
  const active = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);

  return (
    <div className="space-y-4">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tp('title')}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h1 font-bold">{t('title')}</h1>
        <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t('create')}
        </Button>
      </div>

      {goalsQ.isLoading ? (
        [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full" />)
      ) : goals.length === 0 ? (
        <>
          <EmptyState message={t('empty')} />
          <SuggestedGoals onPick={(g) => createM.mutate(g)} pending={createM.isPending} title={t('suggested')} />
        </>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-2">
              <p className="text-small font-semibold text-muted-foreground">{t('active')}</p>
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} streak={profile?.currentStreak ?? 0} onDelete={() => deleteM.mutate(g.id)} />
              ))}
            </section>
          )}
          {done.length > 0 && (
            <section className="space-y-2">
              <p className="text-small font-semibold text-muted-foreground">{t('completed')}</p>
              {done.map((g) => (
                <GoalCard key={g.id} goal={g} streak={profile?.currentStreak ?? 0} onDelete={() => deleteM.mutate(g.id)} />
              ))}
            </section>
          )}
          <SuggestedGoals onPick={(g) => createM.mutate(g)} pending={createM.isPending} title={t('suggested')} />
        </>
      )}

      {/* Create sheet */}
      <Sheet open={open} onOpenChange={setOpen} title={t('create')}>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-small font-medium">{t('metric')}</p>
            <div className="flex flex-wrap gap-2">
              {METRICS.map((m) => (
                <button key={m.v} onClick={() => setMetric(m.v)}>
                  <Pill active={metric === m.v} size="sm">
                    {m.label}
                  </Pill>
                </button>
              ))}
            </div>
          </div>
          {metric === 'domain_points' && (
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {DOMAINS.map((d) => (
                <button key={d.slug} onClick={() => setDomainSlug(d.slug)} className="shrink-0">
                  <Pill color={d.color} active={domainSlug === d.slug} size="sm">
                    {d.name_es}
                  </Pill>
                </button>
              ))}
            </div>
          )}
          <div>
            <p className="mb-1.5 text-small font-medium">{t('target')}</p>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-button border border-border bg-surface px-4 py-2.5 text-body outline-none focus:border-primary"
            />
          </div>
          <div>
            <p className="mb-1.5 text-small font-medium">{t('period')}</p>
            <div className="flex gap-2">
              {(['weekly', 'monthly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}>
                  <Pill active={period === p} size="sm">
                    {p === 'weekly' ? t('weekly') : t('monthly')}
                  </Pill>
                </button>
              ))}
            </div>
          </div>
          <Button block variant="primary" loading={createM.isPending} onClick={submitCustom}>
            {t('create')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function GoalCard({ goal, streak, onDelete }: { goal: GoalRow; streak: number; onDelete: () => void }) {
  const progress = goal.metric === 'streak_days' ? Math.max(goal.progress, streak) : goal.progress;
  const pct = Math.min(1, progress / goal.target_value);
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <p className="text-small font-semibold">{goal.title_es}</p>
        </div>
        {goal.completed ? (
          <Check className="h-4 w-4 text-brote-green" />
        ) : (
          <button onClick={onDelete} aria-label="Eliminar" className="text-muted-foreground hover:text-brote-coral">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ProgressBar value={pct} className="flex-1" />
        <span className="text-caption text-muted-foreground tnum">
          {progress}/{goal.target_value}
        </span>
      </div>
    </Card>
  );
}

function SuggestedGoals({ onPick, pending, title }: { onPick: (g: NewGoalInput) => void; pending: boolean; title: string }) {
  return (
    <section className="space-y-2">
      <p className="text-small font-semibold text-muted-foreground">{title}</p>
      {SUGGESTED.map((g, i) => (
        <button key={i} onClick={() => onPick(g)} disabled={pending} className="w-full text-left">
          <Card className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-surface-2">
            <span className="text-small">{g.titleEs}</span>
            <Plus className="h-4 w-4 shrink-0 text-primary" />
          </Card>
        </button>
      ))}
    </section>
  );
}

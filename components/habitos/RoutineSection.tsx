'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Check, X, Plus, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet } from '@/components/ui/sheet';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { fetchMyHabits, fetchRoutineSuggestions, addHabit, removeHabit } from '@/lib/api/competencias';
import { useCompleteActivity } from '@/hooks/use-daily-set';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const MAX_HABITS = 5;

/**
 * "Mi rutina" (F14.5) — the handful of actions someone has deliberately made
 * part of their day, shown under the daily set.
 *
 * Unlike the previous habits card, this ALWAYS renders: when empty it explains
 * what a routine is and offers suggestions. The old card returned null with no
 * habits, which is precisely why the feature was undiscoverable.
 *
 * Only curated, genuinely repeatable actions can be added. Letting everything
 * be pinned would turn the daily set into a static checklist within a week and
 * remove the reason to come back.
 */
export function RoutineSection({ className }: { className?: string }) {
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const complete = useCompleteActivity();

  const habitsQ = useQuery({ queryKey: ['my-habits'], queryFn: fetchMyHabits, staleTime: 30_000 });
  const suggestionsQ = useQuery({
    queryKey: ['routine-suggestions'],
    queryFn: () => fetchRoutineSuggestions(20),
    enabled: pickerOpen,
  });

  const habits = habitsQ.data ?? [];
  const full = habits.length >= MAX_HABITS;

  function refresh() {
    qc.invalidateQueries({ queryKey: ['my-habits'] });
    qc.invalidateQueries({ queryKey: ['routine-suggestions'] });
  }

  function onDo(activityId: string) {
    haptic('medium');
    complete.mutate({ activityId }, { onSettled: refresh });
  }

  async function onAdd(activityId: string) {
    setBusyId(activityId);
    const res = await addHabit(activityId);
    setBusyId(null);
    if (res.ok) {
      haptic('success');
      refresh();
      setPickerOpen(false);
    } else {
      toast.error('No se pudo sumar', res.error);
    }
  }

  async function onDrop(activityId: string) {
    await removeHabit(activityId);
    refresh();
  }

  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Repeat className="h-4 w-4 text-primary" />
          <h2 className="font-display text-h3 font-bold">Mi rutina</h2>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          disabled={full}
          className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {full ? 'Rutina completa' : 'Sumar'}
        </button>
      </div>

      {habitsQ.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : habits.length === 0 ? (
        <Card className="p-4">
          <p className="text-small text-muted-foreground">
            Tu rutina son las acciones que hacés{' '}
            <span className="font-semibold text-foreground">todos los días</span> — la ducha corta, ir en bici,
            llevar tu botella. Suman puntos cada día y arman su propia racha.
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-button bg-primary px-3 py-2 text-small font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" /> Armar mi rutina
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {habits.map((h) => (
            <Card key={h.activity_id} className="flex items-center gap-3 p-3">
              <DomainIcon domain={h.domain_slug} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium leading-tight">{h.title_es}</p>
                <p className="mt-0.5 flex items-center gap-1 text-caption text-muted-foreground">
                  {h.current_streak > 0 ? (
                    <>
                      <Flame className="h-3 w-3 text-brote-coral" />
                      <span className="font-semibold text-foreground tnum">{h.current_streak}</span> días seguidos
                    </>
                  ) : (
                    'Empezá tu racha de hábito'
                  )}
                </p>
              </div>
              {h.done_today ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brote-green/15 text-brote-green">
                  <Check className="h-4 w-4" />
                </span>
              ) : (
                <button
                  onClick={() => onDo(h.activity_id)}
                  disabled={complete.isPending}
                  aria-label={`Marcar ${h.title_es}`}
                  className="flex h-9 items-center gap-1 rounded-pill bg-primary px-3 text-caption font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                >
                  +{h.base_points}
                </button>
              )}
              <button
                onClick={() => onDrop(h.activity_id)}
                aria-label="Sacar de mi rutina"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-brote-coral"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen} title="Sumar a mi rutina">
        <p className="mb-3 text-small text-muted-foreground">
          Elegí hasta {MAX_HABITS} acciones que quieras convertir en costumbre. Solo aparecen las que tiene sentido
          repetir todos los días.
        </p>
        {suggestionsQ.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (suggestionsQ.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-small text-muted-foreground">
            Ya sumaste todas las que estaban disponibles 🌱
          </p>
        ) : (
          <div className="space-y-2">
            {(suggestionsQ.data ?? []).map((s) => (
              <button
                key={s.activity_id}
                onClick={() => onAdd(s.activity_id)}
                disabled={busyId === s.activity_id}
                className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left transition-colors hover:border-primary/40 disabled:opacity-50"
              >
                <DomainIcon domain={s.domain_slug} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium">{s.title_es}</span>
                  {s.short_es && (
                    <span className="block truncate text-caption text-muted-foreground">{s.short_es}</span>
                  )}
                </span>
                <span className="shrink-0 text-caption font-bold text-brote-sun tnum">+{s.base_points}</span>
                <Plus className="h-4 w-4 shrink-0 text-primary" />
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </section>
  );
}

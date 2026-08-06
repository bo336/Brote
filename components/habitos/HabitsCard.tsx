'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { fetchMyHabits, removeHabit } from '@/lib/api/competencias';
import { useCompleteActivity } from '@/hooks/use-daily-set';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Habits (PLAN F12.6) — the routines a user is deliberately installing
 * (e.g. bici al trabajo). Completing one daily keeps its own streak, and
 * every 7 / 30 days pays a routine bonus on top of the action's points.
 */
export function HabitsCard({ className }: { className?: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['my-habits'], queryFn: fetchMyHabits, staleTime: 30_000 });
  const complete = useCompleteActivity();

  if (q.isLoading) return <Skeleton className={cn('h-[92px] w-full', className)} />;
  const habits = q.data ?? [];
  if (habits.length === 0) return null;

  async function onDo(activityId: string) {
    haptic('medium');
    complete.mutate(
      { activityId },
      { onSettled: () => qc.invalidateQueries({ queryKey: ['my-habits'] }) },
    );
  }

  async function onDrop(activityId: string) {
    await removeHabit(activityId);
    qc.invalidateQueries({ queryKey: ['my-habits'] });
  }

  return (
    <div className={cn('space-y-2', className)}>
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
            aria-label="Dejar de seguir este hábito"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-brote-coral"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Card>
      ))}
    </div>
  );
}

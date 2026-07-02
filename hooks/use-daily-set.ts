'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeActivity,
  fetchDailyPool,
  fetchDailySet,
  fetchTodayCompletions,
} from '@/lib/api/activities';
import { celebrateCompletion } from '@/lib/rewards';
import { toast } from '@/stores/toast';
import { localDate } from '@/lib/utils/dates';

const KEYS = {
  set: ['daily-set', localDate()] as const,
  done: ['today-completions', localDate()] as const,
  pool: ['daily-pool'] as const,
};

export function useDailySet() {
  return useQuery({ queryKey: KEYS.set, queryFn: fetchDailySet, staleTime: 5 * 60_000 });
}

export function useTodayCompletions() {
  return useQuery({ queryKey: KEYS.done, queryFn: fetchTodayCompletions, staleTime: 30_000 });
}

export function useDailyPool() {
  return useQuery({ queryKey: KEYS.pool, queryFn: fetchDailyPool, staleTime: 10 * 60_000 });
}

/** The core completion mutation — optimistic done state + reward orchestration. */
export function useCompleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, photoUrl, note }: { activityId: string; photoUrl?: string; note?: string }) =>
      completeActivity(activityId, photoUrl, note),
    onMutate: async ({ activityId }) => {
      await qc.cancelQueries({ queryKey: KEYS.done });
      const prev = qc.getQueryData<Set<string>>(KEYS.done);
      const nextSet = new Set(prev ?? []);
      nextSet.add(activityId);
      qc.setQueryData(KEYS.done, nextSet);
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEYS.done, ctx.prev);
      const message = err instanceof Error ? err.message : 'No se pudo completar';
      toast.error('Ups', message);
    },
    onSuccess: (result) => {
      celebrateCompletion(result);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.done });
      // Challenge progress is recomputed server-side on every completion.
      qc.invalidateQueries({ queryKey: ['daily-challenge'] });
    },
  });
}

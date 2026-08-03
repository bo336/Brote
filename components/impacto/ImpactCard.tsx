'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMyImpact, fetchMyImpactSince } from '@/lib/api/impacto';
import { impactLines } from '@/lib/impact';
import { cn } from '@/lib/utils/cn';

/**
 * "Tu impacto real" (PLAN F12.2) — the concrete quantities a user has saved,
 * each translated into something picturable ("≈ 4 duchas"). Lifetime by
 * default, or the rolling week when `period="week"`.
 */
export function ImpactCard({
  period = 'total',
  className,
  compact = false,
}: {
  period?: 'total' | 'week';
  className?: string;
  compact?: boolean;
}) {
  const q = useQuery({
    queryKey: ['impact', period],
    queryFn: () => (period === 'week' ? fetchMyImpactSince(7) : fetchMyImpact()),
    staleTime: 60_000,
  });

  if (q.isLoading) return <Skeleton className={cn('h-[168px] w-full', className)} />;

  const lines = impactLines(q.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 });

  if (lines.length === 0) {
    return (
      <Card className={cn('p-4 text-center', className)}>
        <p className="text-small text-muted-foreground">
          Completá acciones y acá vas a ver <span className="font-semibold text-foreground">exactamente</span> cuánta
          agua, CO₂ y residuos estás ahorrando. 🌍
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('divide-y divide-border', className)}>
      {lines.map((l) => (
        <div key={l.key} className="flex items-center gap-3 p-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-xl"
            style={{ background: `${l.color}1f` }}
            aria-hidden
          >
            {l.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">{l.label}</p>
            <p className="font-display text-h3 font-bold leading-tight tnum" style={{ color: l.color }}>
              {l.value}
            </p>
            {!compact && l.equivalence && (
              <p className="mt-0.5 truncate text-caption text-muted-foreground">{l.equivalence}</p>
            )}
          </div>
        </div>
      ))}
      {period === 'week' && (
        <p className="p-2.5 text-center text-caption text-muted-foreground">Últimos 7 días</p>
      )}
    </Card>
  );
}

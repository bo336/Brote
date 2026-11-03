'use client';

import { ProgressRing } from '@/components/ui/progress';
import { getRank, formatRank, divisionRoman } from '@/lib/ranks';
import { cn } from '@/lib/utils/cn';

interface RankBadgeProps {
  totalXp: number;
  /** 'compact' = ring + division (top bar); 'full' = ring + name + progress. */
  variant?: 'compact' | 'full';
  size?: number;
  className?: string;
}

/** Shows current rank, division, and a progress ring to the next step (§2.7). */
export function RankBadge({ totalXp, variant = 'compact', size = 44, className }: RankBadgeProps) {
  const r = getRank(totalXp);

  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)} title={formatRank(r.rankName, r.division)}>
        <ProgressRing value={r.progressToNextDivisionPct} size={size} strokeWidth={4} color={r.rankColor}>
          <span className="font-display text-small font-bold" style={{ color: r.rankColor }}>
            {divisionRoman(r.division)}
          </span>
        </ProgressRing>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ProgressRing value={r.progressToNextDivisionPct} size={size} strokeWidth={5} color={r.rankColor}>
        <span className="font-display text-small font-bold" style={{ color: r.rankColor }}>
          {divisionRoman(r.division)}
        </span>
      </ProgressRing>
      <div className="min-w-0">
        <p className="truncate font-display text-h3 font-bold" style={{ color: r.rankColor }}>
          {formatRank(r.rankName, r.division)}
        </p>
        <p className="text-caption text-muted-foreground tnum">
          {r.nextRankSlug
            ? `${Math.round(r.progressToNextRankPct * 100)}% al próximo rango`
            : 'Rango máximo · Leyenda'}
        </p>
      </div>
    </div>
  );
}

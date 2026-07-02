'use client';

import { Check, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { RankBadge } from '@/components/brand/RankBadge';
import { useSession } from '@/stores/session';
import { RANKS, getRank, divisionRoman } from '@/lib/ranks';
import { cn } from '@/lib/utils/cn';

const nf = new Intl.NumberFormat('es-AR');

/**
 * The full rank ladder (11 tiers): where you are, what each rank needs and
 * unlocks — so "rango X+" gates are never a mystery.
 */
export default function RangosPage() {
  const profile = useSession((s) => s.profile);
  const xp = profile?.totalXp ?? 0;
  const progress = getRank(xp);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4">
        <RankBadge totalXp={xp} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-h1 font-bold leading-tight">Los rangos</h1>
          <p className="text-small text-muted-foreground">
            Estás en <span className="font-semibold text-foreground">{progress.rankName} {divisionRoman(progress.division)}</span>
            {' · '}
            <span className="tnum">{nf.format(xp)} pts</span>
          </p>
        </div>
      </header>

      <div className="relative space-y-2.5">
        {RANKS.map((r) => {
          const isCurrent = r.tier === progress.tier;
          const isPast = r.tier < progress.tier;
          const isFuture = r.tier > progress.tier;
          const missing = Math.max(0, r.enterAt - xp);

          return (
            <Card
              key={r.slug}
              className={cn(
                'relative overflow-hidden p-4 transition-colors',
                isCurrent && 'ring-2 ring-primary',
                isFuture && 'opacity-80',
              )}
            >
              {/* Rank color accent */}
              <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: r.color }} />

              <div className="flex items-start gap-3 pl-2">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: r.color }}
                >
                  {isPast ? <Check className="h-5 w-5" /> : isFuture ? <Lock className="h-4 w-4" /> : (
                    <span className="text-small font-bold tnum">{r.tier}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h2 className="font-display text-h3 font-bold">{r.name_es}</h2>
                    <span className="text-caption text-muted-foreground tnum">
                      {r.enterAt === 0 ? 'Desde el inicio' : `${nf.format(r.enterAt)} pts`}
                    </span>
                    {isCurrent && (
                      <span className="rounded-pill bg-primary/15 px-2 py-0.5 text-caption font-semibold text-primary">
                        Estás acá
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-small text-muted-foreground">{r.unlock_es}</p>

                  {isCurrent && progress.nextRankSlug && (
                    <div className="mt-2.5">
                      <ProgressBar value={progress.progressToNextRankPct} />
                      <p className="mt-1 text-caption text-muted-foreground tnum">
                        {Math.round(progress.progressToNextRankPct * 100)}% hacia el próximo rango
                      </p>
                    </div>
                  )}
                  {isFuture && (
                    <p className="mt-1.5 text-caption font-medium text-muted-foreground tnum">
                      Te faltan {nf.format(missing)} pts
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="pb-2 text-center text-caption text-muted-foreground">
        Cada rango tiene 5 divisiones (I → V). Tus puntos nunca bajan: los rangos solo suben.
      </p>
    </div>
  );
}

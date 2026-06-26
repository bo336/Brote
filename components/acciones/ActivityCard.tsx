'use client';

import Link from 'next/link';
import { Lock, Camera, Check, Sparkles } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Pill } from '@/components/ui/pill';
import { getDomain } from '@/lib/domains';
import { lockLabel } from '@/lib/recommendations';
import { cn } from '@/lib/utils/cn';
import { formatPoints } from '@/lib/points';
import type { ActivityRow } from '@/lib/supabase/rows';

interface ActivityCardProps {
  activity: ActivityRow;
  locked?: boolean;
  completed?: boolean;
  reason?: string;
}

const EFFORT_ES = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' } as const;
const IMPACT_ES = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const;

export function ActivityCard({ activity, locked, completed, reason }: ActivityCardProps) {
  const domain = getDomain(activity.domain_slug);
  return (
    <Link
      href={`/acciones/${activity.slug}`}
      className={cn(
        'group flex gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg',
        locked && 'opacity-75',
      )}
    >
      <DomainIcon domain={activity.domain_slug} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-body font-semibold leading-tight">{activity.title_es}</p>
          <span className="shrink-0 font-display text-body font-bold text-brote-sun tnum">
            +{formatPoints(activity.base_points)}
          </span>
        </div>
        {reason ? (
          <p className="mt-0.5 flex items-center gap-1 text-caption text-primary">
            <Sparkles className="h-3 w-3" /> {reason}
          </p>
        ) : (
          activity.short_es && <p className="mt-0.5 text-caption text-muted-foreground">{activity.short_es}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {domain && (
            <Pill color={domain.color} size="sm">
              {domain.name_es}
            </Pill>
          )}
          <Pill size="sm">{EFFORT_ES[activity.effort]}</Pill>
          <Pill size="sm">Impacto {IMPACT_ES[activity.impact]}</Pill>
          {activity.verification === 'photo_ai' && (
            <Pill size="sm" className="text-brote-green">
              <Camera className="h-3 w-3" /> Foto
            </Pill>
          )}
          {completed && (
            <Pill size="sm" className="border-brote-green/40 text-brote-green">
              <Check className="h-3 w-3" /> Hecha
            </Pill>
          )}
          {locked && (
            <Pill size="sm" className="border-brote-coral/40 text-brote-coral">
              <Lock className="h-3 w-3" /> {lockLabel(activity.min_rank_slug)}
            </Pill>
          )}
        </div>
      </div>
    </Link>
  );
}

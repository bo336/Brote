'use client';

import Link from 'next/link';
import { Lock, Check, Sparkles, Clock, PiggyBank, Ruler } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Pill } from '@/components/ui/pill';
import { getDomain } from '@/lib/domains';
import { lockLabel } from '@/lib/recommendations';
import { cn } from '@/lib/utils/cn';
import { formatPoints } from '@/lib/points';
import type { ActivityRow } from '@/lib/supabase/rows';
import { minutosTexto } from '@/lib/acciones/presentar';

interface ActivityCardProps {
  activity: ActivityRow;
  locked?: boolean;
  completed?: boolean;
  reason?: string;
  /** Si hoy no le sirve a esta persona, por qué (queda visible pero apagada). */
  noApta?: string | null;
}

const IMPACT_ES = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const;

export function ActivityCard({ activity, locked, completed, reason, noApta }: ActivityCardProps) {
  const domain = getDomain(activity.domain_slug);
  const minutos = minutosTexto(activity.minutos);
  return (
    <Link
      href={`/acciones/${activity.slug}`}
      className={cn(
        'press group flex gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft',
        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift',
        (locked || noApta) && 'opacity-75',
      )}
    >
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <DomainIcon domain={activity.domain_slug} size={48} />
      </span>
      <div className="min-w-0 flex-1">
        {/* Domain name moved up into the §2 eyebrow slot: it identifies the
            row before you read the title, and frees a chip below. */}
        {domain && (
          <span className="eyebrow mb-1 block" style={{ color: domain.color }}>
            {domain.name_es}
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          <p className="text-body font-semibold leading-tight">
            <span className="link-underline">{activity.title_es}</span>
          </p>
          <span className="shrink-0 font-display text-body font-bold text-brote-sun tnum">
            +{formatPoints(activity.base_points)}
          </span>
        </div>
        {noApta ? (
          <p className="mt-1 text-caption text-muted-foreground">{noApta}</p>
        ) : reason ? (
          <p className="mt-1 flex items-center gap-1 text-caption text-primary">
            <Sparkles className="h-3 w-3 shrink-0" /> {reason}
          </p>
        ) : (
          activity.short_es && (
            <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{activity.short_es}</p>
          )
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {minutos && (
            <Pill size="sm">
              <Clock className="h-3 w-3" aria-hidden /> {minutos}
            </Pill>
          )}
          <Pill size="sm">Impacto {IMPACT_ES[activity.impact]}</Pill>
          {activity.ahorra && (
            <Pill size="sm" className="border-brote-green/40 text-brote-green">
              <PiggyBank className="h-3 w-3" aria-hidden /> Ahorra
            </Pill>
          )}
          {activity.medida && (
            <Pill size="sm">
              <Ruler className="h-3 w-3" aria-hidden /> Medible
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

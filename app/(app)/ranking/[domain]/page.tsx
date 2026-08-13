'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { LeaderboardRow } from '@/components/ranking/LeaderboardRow';
import { useSession } from '@/stores/session';
import { getDomain } from '@/lib/domains';
import { fetchDomainLeaderboard, fetchDomainLeaderboardWeekly, type Period } from '@/lib/api/ranking';
import { PeriodToggle } from '@/components/ranking/PeriodToggle';

export default function DomainRankingPage() {
  const params = useParams<{ domain: string }>();
  const profile = useSession((s) => s.profile);
  const domain = getDomain(params.domain);
  const [period, setPeriod] = useState<Period>('semana');

  const q = useQuery({
    queryKey: ['lb-domain', params.domain, period],
    queryFn: () =>
      period === 'semana' ? fetchDomainLeaderboardWeekly(params.domain) : fetchDomainLeaderboard(params.domain),
    enabled: !!params.domain,
  });

  return (
    <div className="space-y-4">
      <Link href="/ranking" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Ranking
      </Link>
      <div className="flex items-center gap-3">
        <DomainIcon domain={params.domain} size={48} />
        <h1 className="font-display text-h1 font-bold" style={{ color: domain?.color }}>
          {domain?.name_es ?? params.domain}
        </h1>
      </div>

      <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-domain" />

      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[60px] w-full" />
          ))}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState
          message={
            period === 'semana'
              ? 'Nadie sumó puntos en este tema esta semana. ¡Empezá vos!'
              : 'Todavía nadie sumó puntos en este tema. ¡Empezá vos!'
          }
        />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((e) => (
            <LeaderboardRow
              key={e.user_id}
              entry={e}
              isMe={e.user_id === profile?.id}
              metric={period === 'semana' ? 'xp' : 'points'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

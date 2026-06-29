'use client';

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
import { fetchDomainLeaderboard } from '@/lib/api/ranking';

export default function DomainRankingPage() {
  const params = useParams<{ domain: string }>();
  const profile = useSession((s) => s.profile);
  const domain = getDomain(params.domain);

  const q = useQuery({
    queryKey: ['lb-domain', params.domain],
    queryFn: () => fetchDomainLeaderboard(params.domain),
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

      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[60px] w-full" />
          ))}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState message="Todavía nadie sumó puntos en este tema. ¡Empezá vos!" />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((e) => (
            <LeaderboardRow key={e.user_id} entry={e} isMe={e.user_id === profile?.id} metric="points" />
          ))}
        </div>
      )}
    </div>
  );
}

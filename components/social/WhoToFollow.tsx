'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { FollowButton } from './FollowButton';
import { fetchSuggestedAccounts } from '@/lib/api/social';
import { RANK_BY_SLUG } from '@/lib/ranks';
import { cn } from '@/lib/utils/cn';

/**
 * "A quién seguir" — three real accounts.
 *
 * The server picks these and will never return a simulated player (those only
 * exist as leaderboard rows, not as profiles), a kid, a private profile, or
 * someone already followed. Nothing in this card is filler.
 */
export function WhoToFollow({ className, limit = 3 }: { className?: string; limit?: number }) {
  const t = useTranslations('feed');
  const q = useQuery({
    queryKey: ['suggested-accounts', limit],
    queryFn: () => fetchSuggestedAccounts(limit),
    staleTime: 10 * 60_000,
  });

  // A card that suggests nobody is worse than no card.
  if (!q.isLoading && (q.data?.length ?? 0) === 0) return null;

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className="px-4 pb-2 pt-3.5">
        <span className="eyebrow block text-primary">{t('whoToFollow')}</span>
        <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{t('whoToFollowBody')}</p>
      </div>

      {q.isLoading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-8 w-20 rounded-pill" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-hairline">
          {(q.data ?? []).map((a) => {
            const rank = a.rank_slug ? RANK_BY_SLUG[a.rank_slug] : null;
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <PipAvatar
                  pipStyle={a.pip_style}
                  avatarUrl={a.avatar_url}
                  name={a.display_name}
                  rankSlug={a.rank_slug}
                  size={40}
                  ring
                  href={a.username ? `/perfil/${a.username}` : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-semibold leading-tight">
                    {a.display_name ?? a.username ?? 'Alguien'}
                  </p>
                  <p className="eyebrow truncate text-muted-foreground">
                    {[rank?.name_es, a.city].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <FollowButton targetId={a.id} initialFollowing={a.is_following ?? false} size="sm" />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

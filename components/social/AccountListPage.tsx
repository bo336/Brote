'use client';

import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { AccountRow } from './AccountRow';
import {
  fetchFollowers,
  fetchFollowing,
  fetchPublicProfileV2,
  type AccountsPage,
} from '@/lib/api/perfil-publico';

/**
 * Shared by /perfil/[username]/seguidores and /siguiendo — the two pages differ
 * only by which RPC they call, so they share an implementation.
 */
export function AccountListPage({ username, mode }: { username: string; mode: 'followers' | 'following' }) {
  const router = useRouter();
  const t = useTranslations('perfilPublico');
  const tc = useTranslations('common');

  // Resolve the handle to an id, and inherit the profile's visibility rules.
  const prof = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => fetchPublicProfileV2(username),
    enabled: !!username,
  });
  const userId = prof.data?.profile?.id;
  const canSee = prof.data?.viewer?.can_see ?? false;

  const q = useInfiniteQuery({
    queryKey: ['account-list', mode, userId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }): Promise<AccountsPage> =>
      mode === 'followers' ? fetchFollowers(userId!, pageParam) : fetchFollowing(userId!, pageParam),
    getNextPageParam: (last) => last.next_cursor,
    enabled: !!userId && canSee,
  });

  const items = (q.data?.pages ?? []).flatMap((p) => p.items);

  return (
    <div className="space-y-4 pb-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      <div>
        <span className="eyebrow block text-muted-foreground">@{username}</span>
        <h1 className="mt-0.5 font-display text-h1 font-bold">
          {mode === 'followers' ? t('followers') : t('following')}
        </h1>
      </div>

      {prof.isLoading || q.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !prof.data?.ok ? (
        <Card className="p-8 text-center">
          <p className="text-small text-muted-foreground">{prof.data?.error ?? t('notFound')}</p>
        </Card>
      ) : !canSee ? (
        <Card className="p-8 text-center">
          <p className="text-small text-muted-foreground">{t('privateBody')}</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <Pip size={56} mood="neutral" />
          <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">
            {mode === 'followers' ? t('emptyFollowers') : t('emptyFollowing')}
          </p>
        </Card>
      ) : (
        <>
          <ul className="divide-y divide-hairline">
            {items.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </ul>
          {q.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

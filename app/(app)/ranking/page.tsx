'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { LeaderboardRow } from '@/components/ranking/LeaderboardRow';
import { useSession } from '@/stores/session';
import { DOMAINS } from '@/lib/domains';
import {
  fetchGlobalLeaderboard,
  fetchWeeklyLeaderboard,
  fetchNeighborhoodLeaderboard,
  fetchFriendLeaderboard,
  fetchMyPosition,
  addFriendByUsername,
} from '@/lib/api/ranking';
import type { LeaderboardEntry } from '@/lib/supabase/rows';
import { toast } from '@/stores/toast';

function List({
  query,
  metric,
  myId,
  emptyMessage,
}: {
  query: { data?: LeaderboardEntry[]; isLoading: boolean };
  metric?: 'total_xp' | 'points' | 'xp';
  myId?: string;
  emptyMessage: string;
}) {
  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[60px] w-full" />
        ))}
      </div>
    );
  }
  const entries = query.data ?? [];
  if (entries.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <LeaderboardRow key={e.user_id} entry={e} isMe={e.user_id === myId} metric={metric} />
      ))}
    </div>
  );
}

export default function RankingPage() {
  const t = useTranslations('ranking');
  const profile = useSession((s) => s.profile);
  const myId = profile?.id;

  const [period, setPeriod] = useState<'historico' | 'semana'>('historico');
  const [friendName, setFriendName] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  const globalQ = useQuery({
    queryKey: ['lb-global', period],
    queryFn: period === 'historico' ? fetchGlobalLeaderboard : fetchWeeklyLeaderboard,
    refetchInterval: 60_000,
  });
  const barrioQ = useQuery({
    queryKey: ['lb-barrio', profile?.neighborhood],
    queryFn: () => fetchNeighborhoodLeaderboard(profile!.neighborhood!),
    enabled: !!profile?.neighborhood,
  });
  const friendsQ = useQuery({
    queryKey: ['lb-friends', myId],
    queryFn: () => fetchFriendLeaderboard(myId!),
    enabled: !!myId,
  });
  const myPosQ = useQuery({ queryKey: ['my-pos', myId], queryFn: () => fetchMyPosition(myId!), enabled: !!myId });

  async function onAddFriend() {
    if (!friendName.trim() || addingFriend) return;
    setAddingFriend(true);
    const res = await addFriendByUsername(friendName);
    setAddingFriend(false);
    if (res.ok) {
      toast.success('¡Amigo agregado!');
      setFriendName('');
      friendsQ.refetch();
    } else {
      toast.error('Ups', res.error);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="global">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="global">{t('global')}</TabsTrigger>
            <TabsTrigger value="barrio">{t('barrio')}</TabsTrigger>
            <TabsTrigger value="amigos">{t('amigos')}</TabsTrigger>
            <TabsTrigger value="dominio">{t('porDominio')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="global" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-pill border border-border bg-surface-2 p-1">
              {(['historico', 'semana'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-pill px-3 py-1 text-small font-medium ${period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  {p === 'historico' ? t('historico') : t('weekly')}
                </button>
              ))}
            </div>
            {myPosQ.data ? (
              <span className="text-small text-muted-foreground tnum">
                {t('yourPosition')}: <span className="font-bold text-foreground">#{myPosQ.data}</span>
              </span>
            ) : null}
          </div>
          <List query={globalQ} metric={period === 'semana' ? 'xp' : 'total_xp'} myId={myId} emptyMessage="Todavía no hay nadie en el ranking. ¡Sé el primero!" />
        </TabsContent>

        <TabsContent value="barrio">
          {profile?.neighborhood ? (
            <List query={barrioQ} myId={myId} emptyMessage="Sé la primera persona de tu barrio en sumar puntos." />
          ) : (
            <EmptyState
              message="Elegí tu barrio en tu perfil para ver el ranking local."
              action={
                <Button variant="secondary" asChild>
                  <Link href="/perfil/ajustes">Ir a ajustes</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="amigos" className="space-y-3">
          <Card className="p-3">
            <div className="flex gap-2">
              <input
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="Usuario de tu amigo"
                className="flex-1 rounded-button border border-border bg-surface px-3 py-2 text-body outline-none focus:border-primary"
              />
              <Button variant="primary" onClick={onAddFriend} loading={addingFriend}>
                <UserPlus className="h-4 w-4" /> {t('addFriends')}
              </Button>
            </div>
          </Card>
          <List query={friendsQ} myId={myId} emptyMessage={t('friendsEmpty')} />
        </TabsContent>

        <TabsContent value="dominio">
          <div className="grid grid-cols-2 gap-2.5">
            {DOMAINS.map((d) => (
              <Link
                key={d.slug}
                href={`/ranking/${d.slug}`}
                className="flex items-center gap-2.5 rounded-card border border-border bg-surface p-3 transition-transform hover:-translate-y-0.5"
                style={{ borderColor: `${d.color}33` }}
              >
                <DomainIcon domain={d.slug} size={36} />
                <span className="flex-1 text-small font-semibold leading-tight">{d.name_es}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight, Trophy, Flag } from 'lucide-react';
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
  fetchCityLeaderboard,
  fetchCityLeaderboardWeekly,
  fetchFriendLeaderboard,
  fetchFriendLeaderboardWeekly,
  fetchWeeklyLeague,
  fetchMyPositionFor,
  metricFor,
  addFriendByCode,
  type Period,
} from '@/lib/api/ranking';
import { PeriodToggle } from '@/components/ranking/PeriodToggle';
import { FriendInvite } from '@/components/ranking/FriendInvite';
import { fetchMyCompetitions } from '@/lib/api/competencias';

/** Short "ends in N days" label; competitions may have no end date at all. */
function compDaysLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'terminada';
  const d = Math.ceil(ms / 86_400_000);
  return d === 1 ? 'termina hoy' : `${d} días`;
}
import { Avatar } from '@/components/ui/avatar';
import { AdSlot } from '@/components/ads/AdSlot';
import { cn } from '@/lib/utils/cn';
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

// useSearchParams (for the ?amigo= invite link) needs a Suspense boundary.
export default function RankingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RankingInner />
    </Suspense>
  );
}

function RankingInner() {
  const t = useTranslations('ranking');
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useSession((s) => s.profile);
  const myId = profile?.id;

  // Weekly is the default on every board (F14.1): a lifetime-only ranking
  // permanently favours whoever signed up first.
  const [period, setPeriod] = useState<Period>('semana');
  const metric = metricFor(period);

  const globalQ = useQuery({
    queryKey: ['lb-global', period],
    queryFn: period === 'historico' ? fetchGlobalLeaderboard : fetchWeeklyLeaderboard,
  });
  const cityQ = useQuery({
    queryKey: ['lb-city', profile?.city, period],
    queryFn: () =>
      period === 'semana' ? fetchCityLeaderboardWeekly(profile!.city!) : fetchCityLeaderboard(profile!.city!),
    enabled: !!profile?.city,
  });
  const friendsQ = useQuery({
    queryKey: ['lb-friends', myId, period],
    queryFn: () => (period === 'semana' ? fetchFriendLeaderboardWeekly(myId!) : fetchFriendLeaderboard(myId!)),
    enabled: !!myId,
  });
  // Keyed on `period` so the number actually changes with the toggle.
  const myComps = useQuery({ queryKey: ['my-competitions'], queryFn: fetchMyCompetitions, enabled: !!myId });
  const myPosQ = useQuery({
    queryKey: ['my-pos', myId, period],
    queryFn: () => fetchMyPositionFor(myId!, period),
    enabled: !!myId,
  });
  const leagueQ = useQuery({
    queryKey: ['weekly-league', myId],
    queryFn: () => fetchWeeklyLeague(myId!),
    enabled: !!myId,
    refetchInterval: 60_000,
  });

  // Someone opening an invite link (?amigo=CODE) gets the code applied for
  // them — the point of a link is that it does the work.
  const inviteCode = searchParams.get('amigo');
  useEffect(() => {
    if (!inviteCode) return;
    let cancelled = false;
    (async () => {
      const res = await addFriendByCode(inviteCode);
      if (cancelled) return;
      if (res.ok) {
        toast.success('¡Listo!', `Ahora sos amigo de ${res.name ?? 'esa persona'}`);
        friendsQ.refetch();
      } else {
        toast.error('No se pudo agregar', res.error);
      }
      router.replace('/ranking');
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteCode]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="liga">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="liga">Liga</TabsTrigger>
            <TabsTrigger value="global">{t('global')}</TabsTrigger>
            <TabsTrigger value="ciudad">{t('ciudad')}</TabsTrigger>
            <TabsTrigger value="amigos">{t('amigos')}</TabsTrigger>
            <TabsTrigger value="competencias">Mis competencias</TabsTrigger>
            <TabsTrigger value="dominio">{t('porDominio')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="liga" className="space-y-3">
          {leagueQ.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[56px] w-full" />
              ))}
            </div>
          ) : leagueQ.data ? (
            <>
              <Card className="flex items-center justify-between gap-3 border-primary/25 bg-primary/5 p-4">
                <div className="min-w-0">
                  <span className="eyebrow block text-primary">Tu liga</span>
                  <p className="mt-0.5 font-display text-h3 font-bold">{leagueQ.data.league}</p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    Se renueva cada lunes · Top 5 suben de liga
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="eyebrow block text-muted-foreground">Puesto</span>
                  <span className="font-display text-display-l font-extrabold leading-none text-primary tnum">
                    {leagueQ.data.my_pos}
                  </span>
                </div>
              </Card>
              <div className="space-y-1.5">
                {leagueQ.data.rows.map((r) => {
                  const isMe = r.user_id === myId;
                  const promote = r.pos <= 5;
                  const relegate = leagueQ.data!.rows.length >= 15 && r.pos > leagueQ.data!.rows.length - 3;
                  const inner = (
                    <>
                      <span
                        className={cn(
                          'w-6 shrink-0 text-center text-small font-bold tnum',
                          promote ? 'text-brote-green' : relegate ? 'text-brote-coral' : 'text-muted-foreground',
                        )}
                      >
                        {r.pos}
                      </span>
                      <Avatar name={r.display_name} src={r.avatar_url} size={34} />
                      <span className="min-w-0 flex-1 truncate text-small font-medium">
                        <span className="link-underline">{r.display_name ?? r.username ?? 'Alguien'}</span>
                        {isMe && <span className="text-muted-foreground"> (vos)</span>}
                      </span>
                      <span className="shrink-0 text-small font-bold text-brote-sun tnum">+{r.xp}</span>
                      {/* Was the text "· visitar 🌍" inline in the name, which
                          §0 forbids and which also truncated on narrow rows.
                          A chevron that slides on hover says the same thing. */}
                      {!isMe && r.username && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                      )}
                    </>
                  );
                  const cls = cn(
                    'group flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5',
                    promote && 'border-brote-green/40 bg-brote-green/5',
                    relegate && 'border-brote-coral/30 bg-brote-coral/5',
                    isMe && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                  );
                  // Visiting worlds (F10.3): tap a rival to walk their island.
                  return !isMe && r.username ? (
                    <Link
                      key={r.user_id}
                      href={`/perfil/${r.username}`}
                      title={`Visitar el mundo de ${r.display_name ?? r.username}`}
                      className={cn(cls, 'press hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft')}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={r.user_id} className={cls}>
                      {inner}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-caption text-muted-foreground">
                Sumá puntos esta semana para subir en tu liga 🌱
              </p>
              <Button variant="secondary" block asChild>
                <Link href="/competencias">
                  <Flag className="h-4 w-4" /> Crear o unirme a una competencia
                </Link>
              </Button>
              <AdSlot placement="ranking-footer" className="pt-1" />
            </>
          ) : (
            <EmptyState message="No pudimos cargar tu liga. Probá de nuevo." />
          )}
        </TabsContent>

        <TabsContent value="global" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-global" />
            {myPosQ.data ? (
              <span className="text-small text-muted-foreground tnum">
                {t('yourPosition')}: <span className="font-bold text-foreground">#{myPosQ.data}</span>
              </span>
            ) : null}
          </div>
          <List
            query={globalQ}
            metric={metric}
            myId={myId}
            emptyMessage={
              period === 'semana'
                ? 'Todavía nadie sumó puntos esta semana. ¡Sé la primera persona!'
                : 'Todavía no hay nadie en el ranking. ¡Sé el primero!'
            }
          />
        </TabsContent>

        <TabsContent value="ciudad" className="space-y-3">
          {profile?.city ? (
            <>
              <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-city" />
              <List
                query={cityQ}
                metric={metric}
                myId={myId}
                emptyMessage={
                  period === 'semana'
                    ? 'Nadie de tu ciudad sumó puntos esta semana. ¡Empezá vos!'
                    : 'Sé la primera persona de tu ciudad en sumar puntos.'
                }
              />
            </>
          ) : (
            <EmptyState
              message="Elegí tu ciudad en tu perfil para ver el ranking local."
              action={
                <Button variant="secondary" asChild>
                  <Link href="/perfil/ajustes">Ir a ajustes</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="amigos" className="space-y-3">
          <FriendInvite onAdded={() => friendsQ.refetch()} />
          <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-friends" />
          <List query={friendsQ} metric={metric} myId={myId} emptyMessage={t('friendsEmpty')} />
        </TabsContent>

        {/* The competitions you are in belong beside the other boards — they
            are leaderboards too, and were previously two taps away. */}
        <TabsContent value="competencias" className="space-y-3">
          {myComps.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[68px] w-full" />
              <Skeleton className="h-[68px] w-full" />
            </div>
          ) : (myComps.data ?? []).length === 0 ? (
            <EmptyState
              message="Todavía no estás en ninguna competencia."
              action={
                <Button variant="primary" asChild>
                  <Link href="/competencias">Crear o unirme</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="space-y-2">
                {myComps.data!.map((c) => (
                  <Link
                    key={c.id}
                    href={`/competencias/${c.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 transition-colors hover:border-primary/40',
                      !c.active && 'opacity-60',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brote-sun/15 text-brote-sun">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.name}</span>
                      <span className="block truncate text-caption text-muted-foreground">
                        {c.members} {c.members === 1 ? 'participante' : 'participantes'}
                        {c.ends_at ? ` · ${compDaysLeft(c.ends_at)}` : ' · sin fecha de fin'}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <Button variant="secondary" block asChild>
                <Link href="/competencias">
                  <Flag className="h-4 w-4" /> Crear o unirme a otra
                </Link>
              </Button>
            </>
          )}
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

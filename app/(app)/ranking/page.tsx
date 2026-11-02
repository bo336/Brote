'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight, Trophy, Flag } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { LeaderboardRow } from '@/components/ranking/LeaderboardRow';
import { useSession } from '@/stores/session';
import { DOMAINS } from '@/lib/domains';
import {
  fetchGlobalLeaderboard,
  fetchCityLeaderboard,
  fetchFriendLeaderboard,
  fetchMyPositionFor,
  metricFor,
  addFriendByCode,
  type Period,
} from '@/lib/api/ranking';
import { PeriodToggle } from '@/components/ranking/PeriodToggle';
import { TuRango } from '@/components/ranking/TuRango';
import { useNombreRango } from '@/hooks/use-rango';
import { fetchRankingPeriodo, type AmbitoRanking, type FilaRanking } from '@/lib/api/rangos';
import { FriendInvite } from '@/components/ranking/FriendInvite';
import { fetchMyCompetitions } from '@/lib/api/competencias';

/** Short "ends in N days" label; competitions may have no end date at all. */
function compDaysLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'terminada';
  const d = Math.ceil(ms / 86_400_000);
  return d === 1 ? 'termina hoy' : `${d} días`;
}
import { usePipStyles } from '@/hooks/use-pip-styles';
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
  const entries = query.data ?? [];
  // The leaderboard RPCs do not carry pip_style, so it comes in one batched
  // lookup here rather than thirteen rewritten functions.
  const pips = usePipStyles(entries.map((e) => e.user_id));

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[60px] w-full" />
        ))}
      </div>
    );
  }
  if (entries.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <LeaderboardRow
          key={e.user_id}
          entry={e}
          isMe={e.user_id === myId}
          metric={metric}
          pipStyle={pips.data?.[e.user_id]?.pip_style ?? null}
        />
      ))}
    </div>
  );
}

/** The period's board. What decides your rank is the requirements, not the place. */
function TablaPeriodo({
  ambito,
  myId,
  emptyMessage,
}: {
  ambito: AmbitoRanking;
  myId?: string;
  emptyMessage: string;
}) {
  const nombreRango = useNombreRango();
  const q = useQuery({
    queryKey: ['ranking-periodo', ambito, myId],
    queryFn: () => fetchRankingPeriodo(ambito),
    enabled: !!myId,
    staleTime: 60_000,
  });
  const filas: FilaRanking[] = q.data?.filas ?? [];
  const pips = usePipStyles(filas.map((f) => f.user_id));
  const yo = q.data?.yo;
  const yaEsta = filas.some((f) => f.user_id === myId);

  if (q.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[60px] w-full" />
        ))}
      </div>
    );
  }
  if (q.isError || (q.isFetched && !q.data)) return <EmptyState message="No pudimos cargar esta tabla. Probá de nuevo." />;
  if (filas.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="space-y-2">
      {filas.map((f) => (
        <LeaderboardRow
          key={f.user_id}
          entry={{
            pos: f.pos,
            user_id: f.user_id,
            username: f.username,
            display_name: f.display_name,
            avatar_url: f.avatar_url,
            neighborhood: null,
            xp: f.puntos,
            rank_slug: f.nivel,
            division: 1,
            title_es: null,
          }}
          isMe={f.user_id === myId}
          metric="xp"
          pipStyle={pips.data?.[f.user_id]?.pip_style ?? null}
          detalle={nombreRango(f.tier)}
        />
      ))}
      {yo && yo.pos && !yaEsta && (
        <p className="pt-1 text-center text-small text-muted-foreground tnum">
          Tu puesto: <span className="font-bold text-foreground">#{yo.pos}</span> con {yo.puntos} puntos
        </p>
      )}
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

  // The period boards load themselves; these are the lifetime ones ("De siempre").
  const historico = period === 'historico';
  const globalQ = useQuery({
    queryKey: ['lb-global', 'historico'],
    queryFn: fetchGlobalLeaderboard,
    enabled: historico,
  });
  const cityQ = useQuery({
    queryKey: ['lb-city', profile?.city, 'historico'],
    queryFn: () => fetchCityLeaderboard(profile!.city!),
    enabled: historico && !!profile?.city,
  });
  const friendsQ = useQuery({
    queryKey: ['lb-friends', myId, 'historico'],
    queryFn: () => fetchFriendLeaderboard(myId!),
    enabled: historico && !!myId,
  });
  const myComps = useQuery({ queryKey: ['my-competitions'], queryFn: fetchMyCompetitions, enabled: !!myId });
  const myPosQ = useQuery({
    queryKey: ['my-pos', myId, 'historico'],
    queryFn: () => fetchMyPositionFor(myId!, 'historico'),
    enabled: historico && !!myId,
  });
  const qc = useQueryClient();
  const refrescarAmigos = () => {
    void friendsQ.refetch();
    void qc.invalidateQueries({ queryKey: ['ranking-periodo', 'amigos'] });
  };

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
        refrescarAmigos();
      } else {
        toast.error('No se pudo agregar', res.error);
      }
      router.replace('/ranking');
    })();
    return () => {
      cancelled = true;
    };
    // Deliberately keyed on the code alone: adding `friendsQ`/`router` would
    // re-run this whenever their identity changed and re-apply the invite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  return (
    <div className="space-y-4">
      <TuRango />

      <Tabs defaultValue="liga">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="liga">Tu liga</TabsTrigger>
            <TabsTrigger value="global">{t('global')}</TabsTrigger>
            <TabsTrigger value="ciudad">{t('ciudad')}</TabsTrigger>
            <TabsTrigger value="amigos">{t('amigos')}</TabsTrigger>
            <TabsTrigger value="competencias">Mis competencias</TabsTrigger>
            <TabsTrigger value="dominio">{t('porDominio')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Your league is everyone at your rank this period. */}
        <TabsContent value="liga" className="space-y-3">
          <p className="text-caption leading-relaxed text-muted-foreground">
            Quienes tienen tu mismo rango, por los puntos de este período. Se renueva con cada período.
          </p>
          <TablaPeriodo ambito="rango" myId={myId} emptyMessage="Todavía nadie de tu liga sumó puntos en este período. ¡Sé la primera persona!" />
          <Button variant="secondary" block asChild>
            <Link href="/competencias">
              <Flag className="h-4 w-4" /> Crear o unirme a una competencia
            </Link>
          </Button>
          {/* Lejos del botón de arriba: AdSense pide no poner anuncios pegados
              a botones o navegación (clics accidentales). */}
          <AdSlot placement="ranking-footer" className="mt-8 border-t border-hairline pt-6" />
        </TabsContent>

        <TabsContent value="global" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-global" />
            {historico && myPosQ.data ? (
              <span className="text-small text-muted-foreground tnum">
                {t('yourPosition')}: <span className="font-bold text-foreground">#{myPosQ.data}</span>
              </span>
            ) : null}
          </div>
          {historico ? (
            <List query={globalQ} metric={metric} myId={myId} emptyMessage="Todavía no hay nadie en el ranking. ¡Sé el primero!" />
          ) : (
            <TablaPeriodo ambito="global" myId={myId} emptyMessage="Todavía nadie sumó puntos en este período. ¡Sé la primera persona!" />
          )}
        </TabsContent>

        <TabsContent value="ciudad" className="space-y-3">
          {profile?.city ? (
            <>
              <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-city" />
              {historico ? (
                <List query={cityQ} metric={metric} myId={myId} emptyMessage="Sé la primera persona de tu ciudad en sumar puntos." />
              ) : (
                <TablaPeriodo ambito="ciudad" myId={myId} emptyMessage="Nadie de tu ciudad sumó puntos en este período. ¡Empezá vos!" />
              )}
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
          <FriendInvite onAdded={refrescarAmigos} />
          <PeriodToggle value={period} onChange={setPeriod} layoutId="pt-friends" />
          {historico ? (
            <List query={friendsQ} metric={metric} myId={myId} emptyMessage={t('friendsEmpty')} />
          ) : (
            <TablaPeriodo ambito="amigos" myId={myId} emptyMessage={t('friendsEmpty')} />
          )}
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

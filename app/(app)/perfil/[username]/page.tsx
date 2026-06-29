'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { RankBadge } from '@/components/brand/RankBadge';
import { PointsBadge } from '@/components/brand/PointsBadge';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { Mundo } from '@/components/mundo/Mundo';
import { createClient } from '@/lib/supabase/client';
import { parseMundoState } from '@/lib/mundo';

interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  neighborhood: string | null;
  total_xp: number;
  current_streak: number;
  title_es: string | null;
  mundo_state: unknown;
}

async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const { data } = await createClient().rpc('get_public_profile', { p_username: username });
  return ((data ?? [])[0] as PublicProfile) ?? null;
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const q = useQuery({
    queryKey: ['public-profile', params.username],
    queryFn: () => fetchPublicProfile(params.username),
    enabled: !!params.username,
  });
  const p = q.data;

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!p) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos a @{params.username}.</p>
        <Button variant="secondary" asChild>
          <Link href="/ranking">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/ranking" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Ranking
      </Link>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Avatar name={p.display_name ?? p.username} src={p.avatar_url} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-h1 font-bold">{p.display_name ?? p.username}</h1>
            <p className="text-small text-muted-foreground">
              {p.username ? `@${p.username}` : ''}
              {p.neighborhood ? ` · ${p.neighborhood}` : ''}
            </p>
            {p.title_es && <p className="text-caption font-medium text-primary">{p.title_es}</p>}
          </div>
        </div>
        {p.bio && <p className="mt-3 text-small text-muted-foreground">{p.bio}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <RankBadge totalXp={p.total_xp} variant="full" size={52} />
          <div className="flex flex-col items-end gap-1">
            <PointsBadge value={p.total_xp} animate={false} />
            <StreakFlame count={p.current_streak} size="sm" />
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Su mundo</h2>
        <Mundo mundo={parseMundoState(p.mundo_state)} height={240} />
      </section>
    </div>
  );
}

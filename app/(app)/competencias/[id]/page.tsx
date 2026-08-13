'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { fetchCompetitionBoard, resetLabel } from '@/lib/api/competencias';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

function daysLeft(endsAt: string | null): string {
  if (!endsAt) return 'Sin fecha de fin';
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Terminada';
  const d = Math.ceil(ms / 86_400_000);
  return d === 1 ? 'Termina hoy' : `Termina en ${d} días`;
}

/** Competition leaderboard — scores are windowed to the competition period. */
export default function CompetenciaDetailPage() {
  const params = useParams<{ id: string }>();
  const myId = useSession((s) => s.profile?.id);
  const q = useQuery({
    queryKey: ['competition', params.id],
    queryFn: () => fetchCompetitionBoard(params.id),
    enabled: !!params.id,
    refetchInterval: 60_000,
  });

  async function share() {
    const c = q.data;
    if (!c) return;
    const text = `Sumate a "${c.name}" en Brote 🌱 — código ${c.code}`;
    try {
      if (navigator.share) await navigator.share({ title: c.name, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado', 'Compartí el código con quien quieras');
      }
    } catch {
      /* cancelled */
    }
  }

  if (q.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const c = q.data;
  if (!c?.ok) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No encontramos esa competencia.</p>
        <Button variant="secondary" asChild className="mt-3">
          <Link href="/competencias">Volver</Link>
        </Button>
      </div>
    );
  }

  const reset = resetLabel(c.reset_period, c.reset_anchor);

  return (
    <div className="space-y-4 pb-6">
      <Link href="/competencias" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Competencias
      </Link>

      <Card className="bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-h1 font-bold leading-tight">{c.name}</h1>
            <p className="mt-0.5 text-small text-muted-foreground">
              <Users className="mr-1 inline h-3.5 w-3.5" />
              {c.rows.length} · {daysLeft(c.ends_at)}
            </p>
            {reset && (
              <p className="mt-1 text-caption font-medium text-primary">
                🔄 {reset} · período desde el{' '}
                {new Date(c.period_start).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={share}>
            <Share2 className="h-4 w-4" /> {c.code}
          </Button>
        </div>
      </Card>

      <div className="space-y-1.5">
        {c.rows.map((r) => {
          const isMe = r.user_id === myId;
          const medal = r.pos === 1 ? '🥇' : r.pos === 2 ? '🥈' : r.pos === 3 ? '🥉' : null;
          return (
            <div
              key={r.user_id}
              className={cn(
                'flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5',
                r.pos <= 3 && 'border-brote-sun/40 bg-brote-sun/5',
                isMe && 'ring-2 ring-primary',
              )}
            >
              <span className="w-7 text-center text-small font-bold tnum">{medal ?? r.pos}</span>
              <Avatar name={r.display_name} src={r.avatar_url} size={34} />
              <span className="min-w-0 flex-1 truncate text-small font-medium">
                {r.display_name ?? r.username ?? 'Alguien'}
                {isMe && <span className="text-muted-foreground"> (vos)</span>}
                <span className="block text-caption text-muted-foreground">
                  {r.actions} {r.actions === 1 ? 'acción' : 'acciones'}
                  {/* With resets on, the all-time total still deserves credit
                      even though the ranking uses the current period. */}
                  {reset && ` · ${r.total_xp} en total`}
                </span>
              </span>
              <span className="text-right text-small font-bold text-brote-sun tnum">
                +{r.xp}
                {reset && <span className="block text-caption font-normal text-muted-foreground">este período</span>}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-caption text-muted-foreground">
        {reset
          ? 'El puesto se define por los puntos del período actual, así que siempre se puede dar vuelta. 🌱'
          : 'Solo cuentan los puntos hechos durante la competencia — todos empiezan de cero. 🌱'}
      </p>
    </div>
  );
}

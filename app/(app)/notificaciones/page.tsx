'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Trophy, Flame, Award, Users, Sparkles, Bell, CheckCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section';
import { useSession } from '@/stores/session';
import { fetchNotifications, markAllRead } from '@/lib/api/notifications';
import { cn } from '@/lib/utils/cn';
import type { NotificationRow } from '@/lib/supabase/rows';

const ICON: Record<string, typeof Bell> = {
  rank_up: Trophy,
  streak_risk: Flame,
  streak_lost: Flame,
  title: Award,
  points: Sparkles,
  project: Users,
  challenge: Sparkles,
  friend: Users,
  news: Bell,
  system: Bell,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function NotificacionesPage() {
  const t = useTranslations('notifications');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const setUnread = useSession((s) => s.setUnread);

  const q = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: () => fetchNotifications(profile!.id),
    enabled: !!profile?.id,
  });

  // Mark all read on open + clear the top-bar badge.
  useEffect(() => {
    if (!profile?.id || !q.data) return;
    const hasUnread = q.data.some((n) => !n.read);
    if (hasUnread) {
      markAllRead(profile.id).then(() => {
        setUnread(0);
        qc.invalidateQueries({ queryKey: ['notifications'] });
      });
    } else {
      setUnread(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, q.data?.length]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('title')}
        action={
          (q.data ?? []).length > 0 ? (
            <Button variant="ghost" size="sm" disabled>
              <CheckCheck className="h-4 w-4" /> {t('markAllRead')}
            </Button>
          ) : undefined
        }
      />

      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState message={t('empty')} />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ n }: { n: NotificationRow }) {
  const Icon = ICON[n.type] ?? Bell;
  return (
    <Card className={cn('flex items-start gap-3 p-3.5', !n.read && 'border-primary/30 bg-primary/5')}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold">{n.title_es}</p>
        {n.body_es && <p className="text-small text-muted-foreground">{n.body_es}</p>}
        <p className="mt-0.5 text-caption text-muted-foreground">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brote-coral" />}
    </Card>
  );
}

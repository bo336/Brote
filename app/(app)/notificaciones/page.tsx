'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Trophy,
  Flame,
  Award,
  Users,
  Sparkles,
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Repeat2,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section';
import { ChipRail } from '@/components/ui/chip-rail';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { FollowButton } from '@/components/social/FollowButton';
import { useSession } from '@/stores/session';
import { usePipStyles, type PipIdentity } from '@/hooks/use-pip-styles';
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
  like: Heart,
  reply: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
  repost: Repeat2,
  moderation: ShieldAlert,
};

/**
 * Per-type tint. Every notification used to be brand green, so a lost streak
 * and a new title looked identical at a glance — the icon was decoration
 * rather than information.
 */
const TINT: Record<string, string> = {
  rank_up: '#FFB23E',
  streak_risk: '#FF6B5E',
  streak_lost: '#FF6B5E',
  title: '#B07CD6',
  points: '#FFB23E',
  project: '#FF8A3D',
  challenge: '#1FB57A',
  friend: '#5B6CF0',
  news: '#2DB4D4',
  system: '#1FB57A',
  like: '#1FB57A',
  reply: '#5B6CF0',
  follow: '#5B6CF0',
  mention: '#B07CD6',
  repost: '#1FB57A',
  moderation: '#FF6B5E',
};

/** Which filter chip each type belongs under. */
const SOCIAL = new Set(['like', 'reply', 'follow', 'mention', 'repost', 'friend']);
const PROGRESS = new Set(['rank_up', 'title', 'points', 'streak_risk', 'streak_lost', 'challenge', 'project']);

type Filter = 'todo' | 'social' | 'progreso' | 'sistema';

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
  const tf = useTranslations('feed');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const setUnread = useSession((s) => s.setUnread);
  const isKid = profile?.accountType === 'kid';
  const [filter, setFilter] = useState<Filter>('todo');

  const q = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: () => fetchNotifications(profile!.id),
    enabled: !!profile?.id,
  });

  const all = useMemo(() => q.data ?? [], [q.data]);

  // One batched lookup for every actor on screen, rather than one per row.
  const actorIds = useMemo(
    () => all.map((n) => (n.data?.user_id as string | undefined) ?? null),
    [all],
  );
  const actors = usePipStyles(actorIds);

  const items = useMemo(() => {
    if (filter === 'todo') return all;
    if (filter === 'social') return all.filter((n) => SOCIAL.has(n.type));
    if (filter === 'progreso') return all.filter((n) => PROGRESS.has(n.type));
    return all.filter((n) => !SOCIAL.has(n.type) && !PROGRESS.has(n.type));
  }, [all, filter]);

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
      {/*
        There was a "marcar todas como leídas" button here that was hardcoded
        `disabled` — it could never do anything. Opening this screen already
        marks everything read, so the honest version is to say that rather than
        show a control that refuses every click.
      */}
      <SectionHeader
        eyebrow="Tu actividad"
        title={t('title')}
        action={
          all.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
              <CheckCheck className="h-3.5 w-3.5 text-brote-green" /> Todo al día
            </span>
          ) : undefined
        }
      />

      {/* Kids only ever receive progress and system notices, so a filter that
          offers "Social" would be three chips of which one is always empty. */}
      {!isKid && all.length > 3 && (
        <ChipRail
          layoutId="notif-filter"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: 'todo', label: tf('filterAll') },
            { value: 'social', label: tf('filterSocial') },
            { value: 'progreso', label: tf('filterProgress') },
            { value: 'sistema', label: tf('filterSystem') },
          ]}
        />
      )}

      {q.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState message={t('empty')} />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              actor={actors.data?.[(n.data?.user_id as string | undefined) ?? ''] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One notification.
 *
 * A social one leads with the person's Pip, because who did it is the whole
 * content of the row; everything else keeps the tinted type icon. The "y N
 * personas más" comes from `data.count`, which the aggregating notifier keeps
 * up to date in place — it is a real number of real people, never a guess.
 */
function NotificationItem({ n, actor }: { n: NotificationRow; actor: PipIdentity | null }) {
  const tf = useTranslations('feed');
  const Icon = ICON[n.type] ?? Bell;
  const tint = TINT[n.type] ?? '#1FB57A';

  const isSocial = SOCIAL.has(n.type);
  const count = Number(n.data?.count ?? 1);
  const postId = (n.data?.post_id as string | undefined) ?? null;
  const actorId = (n.data?.user_id as string | undefined) ?? null;
  const actorHref = actor?.username ? `/perfil/${actor.username}` : undefined;

  const body: ReactNode = (
    <>
      <p className="text-small font-semibold leading-tight">
        {n.title_es}
        {/* Real plural agreement: "y 1 persona más", not "y 1 personas más". */}
        {count > 1 && (
          <span className="ml-1 font-normal text-muted-foreground">
            {tf('othersCount', { n: count - 1 })}
          </span>
        )}
      </p>
      {n.body_es && <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{n.body_es}</p>}
      <p className="mt-1 text-caption text-muted-foreground">{timeAgo(n.created_at)}</p>
    </>
  );

  return (
    <Card className={cn('flex items-start gap-3 p-3.5', !n.read && 'border-primary/30 bg-primary/5')}>
      {isSocial && actor ? (
        <PipAvatar
          pipStyle={actor.pip_style}
          avatarUrl={actor.avatar_url}
          name={actor.display_name}
          rankSlug={actor.rank_slug}
          size={40}
          ring
          href={actorHref}
        />
      ) : (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${tint}20`, color: tint }}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        {/* Every social notification lands on the permalink — that is the
            point of the permalink existing. */}
        {postId ? (
          <Link href={`/feed/p/${postId}`} className="block transition-opacity hover:opacity-80">
            {body}
          </Link>
        ) : (
          body
        )}

        {/* "Seguir de vuelta", right where you read that someone followed you. */}
        {n.type === 'follow' && actorId && actor && !actor.is_following && (
          <div className="mt-2">
            <FollowButton
              targetId={actorId}
              initialFollowing={false}
              size="sm"
              label={tf('followBack')}
            />
          </div>
        )}
      </div>

      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brote-coral" aria-label="No leída" />}
    </Card>
  );
}

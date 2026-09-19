'use client';

import Link from 'next/link';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { RANK_BY_SLUG, formatRank } from '@/lib/ranks';
import { formatPoints } from '@/lib/points';
import { cn } from '@/lib/utils/cn';
import type { PipStyle } from '@/components/pip/Pip';
import type { LeaderboardEntry } from '@/lib/supabase/rows';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe?: boolean;
  /** Which numeric field to show (total_xp default, points for domain, xp for weekly). */
  metric?: 'total_xp' | 'points' | 'xp';
  /**
   * Merged in by the parent from `usePipStyles` — the leaderboard RPCs do not
   * carry it. Simulated players have none, and correctly fall back to a
   * neutral Pip rather than borrowing somebody else's.
   */
  pipStyle?: PipStyle | null;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export function LeaderboardRow({ entry, isMe, metric = 'total_xp', pipStyle }: LeaderboardRowProps) {
  const rank = RANK_BY_SLUG[entry.rank_slug];
  const value = (entry[metric] ?? entry.total_xp ?? entry.points ?? entry.xp ?? 0) as number;
  const name = entry.display_name || entry.username || 'Anónimo';

  const body = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border px-3 py-2.5 transition-colors',
        isMe ? 'border-primary bg-primary/8' : 'border-border bg-surface',
      )}
    >
      <span className={cn('w-7 shrink-0 text-center font-display font-bold tnum', entry.pos <= 3 ? 'text-base' : 'text-muted-foreground')}>
        {entry.pos <= 3 ? MEDAL[entry.pos - 1] : entry.pos}
      </span>
      <PipAvatar
        pipStyle={pipStyle}
        avatarUrl={entry.avatar_url}
        name={name}
        rankSlug={entry.rank_slug}
        size={36}
        ring
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-semibold">
          {name} {isMe && <span className="text-primary">· vos</span>}
        </p>
        <p className="truncate text-caption" style={{ color: rank?.color }}>
          {entry.title_es ? `${entry.title_es} · ` : ''}
          {rank ? formatRank(rank.name_es, entry.division) : ''}
        </p>
      </div>
      <span className="shrink-0 font-display text-body font-bold text-brote-sun tnum">{formatPoints(value)}</span>
    </div>
  );

  if (entry.username) {
    return (
      <Link href={`/perfil/${entry.username}`} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

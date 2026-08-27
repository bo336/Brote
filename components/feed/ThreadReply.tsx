'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trash2, BadgeCheck, CornerDownRight } from 'lucide-react';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { ReactionBar } from './ReactionBar';
import { relativeLabel } from '@/lib/utils/dates';
import { useSession } from '@/stores/session';
import type { FeedItem } from '@/lib/api/feed';

/**
 * One reply inside a thread.
 *
 * Replies render flat, one visual level. A reply to a reply is stored against
 * the root post and shows an "en respuesta a @x" line instead of nesting —
 * nested threads are unreadable on a phone and make feed_thread expensive.
 */
export function ThreadReply({
  reply,
  onDelete,
  onReply,
}: {
  reply: FeedItem;
  onDelete?: (id: string) => void;
  onReply?: (reply: FeedItem) => void;
}) {
  const t = useTranslations('feed');
  const myId = useSession((s) => s.profile?.id);
  const isMine = reply.author?.id === myId;
  const href = reply.author?.username ? `/perfil/${reply.author.username}` : undefined;

  // Replies are stored flat against the root (see migration 0057), so who this
  // one is answering lives in the leading @handle the composer prefills. Lift
  // it into the eyebrow and drop it from the text — showing it twice reads
  // like the person typed the handle out for no reason.
  const lead = /^@([A-Za-z0-9_.]{3,24})\s+/.exec(reply.body ?? '');
  const answering = lead?.[1] ?? null;
  const body = answering ? (reply.body ?? '').slice(lead![0].length) : reply.body;

  return (
    <div className="flex gap-2.5 py-3">
      <PipAvatar
        pipStyle={reply.author?.pip_style}
        avatarUrl={reply.author?.avatar_url}
        name={reply.author?.display_name}
        rankSlug={reply.author?.rank_slug}
        size={30}
        href={href}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-caption text-muted-foreground">
          {href ? (
            <Link href={href} className="font-semibold text-foreground transition-colors hover:text-primary">
              {reply.author?.display_name ?? reply.author?.username ?? 'Alguien'}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">
              {reply.author?.display_name ?? 'Alguien'}
            </span>
          )}
          {reply.author?.is_verified && <BadgeCheck className="h-3 w-3 shrink-0 text-primary" />}
          <span>· {relativeLabel(reply.created_at)}</span>
          {reply.edited_at && <span>· {t('edited')}</span>}
        </p>

        {answering && (
          <p className="eyebrow mt-0.5 flex items-center gap-1 text-muted-foreground">
            <CornerDownRight className="h-3 w-3" />
            {t('inReplyTo', { handle: answering })}
          </p>
        )}

        <p className="mt-0.5 whitespace-pre-wrap text-small leading-relaxed">{body}</p>
        <ReactionBar item={reply} onReply={onReply ? () => onReply(reply) : undefined} />
      </div>

      {isMine && onDelete && (
        <button
          onClick={() => onDelete(reply.id)}
          aria-label={t('delete')}
          className="h-fit rounded-pill p-1.5 text-muted-foreground transition-colors hover:text-brote-coral"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

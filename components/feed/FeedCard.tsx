'use client';

import Link from 'next/link';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { ReactionBar } from './ReactionBar';
import { getDomain } from '@/lib/domains';
import { relativeLabel } from '@/lib/utils/dates';
import { useSession } from '@/stores/session';
import type { FeedItem } from '@/lib/api/feed';
import { cn } from '@/lib/utils/cn';

/**
 * One item in the timeline. A news card and someone's opinion share the same
 * frame deliberately — the point of the feed is that both are things you can
 * react to and talk about, not two separate systems bolted together.
 */
export function FeedCard({
  item,
  onReply,
  onDelete,
  className,
}: {
  item: FeedItem;
  onReply?: (item: FeedItem) => void;
  onDelete?: (item: FeedItem) => void;
  className?: string;
}) {
  const myId = useSession((s) => s.profile?.id);
  const dom = item.domain_tags[0] ? getDomain(item.domain_tags[0]) : undefined;
  const isMine = !!item.author && item.author.id === myId;

  return (
    <article className={cn('py-4', className)}>
      {/* Who / what, and when */}
      <div className="mb-2 flex items-center gap-2">
        {item.author ? (
          <>
            <Avatar name={item.author.display_name} src={item.author.avatar_url} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-semibold leading-tight">
                {item.author.display_name ?? item.author.username ?? 'Alguien'}
              </p>
              <p className="text-caption text-muted-foreground">{relativeLabel(item.created_at)}</p>
            </div>
          </>
        ) : (
          <>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: `${dom?.color ?? '#1FB57A'}1f` }}
            >
              <DomainIcon domain={item.domain_tags[0] ?? 'comunidad'} size={18} variant="bare" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-semibold leading-tight">{item.news?.source ?? 'Novedad'}</p>
              <p className="text-caption text-muted-foreground">
                {dom ? `${dom.name_es} · ` : ''}
                {relativeLabel(item.created_at)}
              </p>
            </div>
          </>
        )}

        {isMine && onDelete && (
          <button
            onClick={() => onDelete(item)}
            aria-label="Borrar"
            className="rounded-pill p-1.5 text-muted-foreground transition-colors hover:text-brote-coral"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Someone's own words come first — the story is the attachment. */}
      {item.body && <p className="mb-2 whitespace-pre-wrap text-body leading-relaxed">{item.body}</p>}

      {item.news && (
        <Link
          href={`/explorar/novedades/${item.news.id}`}
          className="group block overflow-hidden rounded-card border border-border transition-colors hover:border-primary/40"
        >
          {item.news.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.news.image_url}
              alt=""
              className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
          <div className="p-3">
            <p className="font-display text-body font-bold leading-snug">{item.news.title_es}</p>
            {item.news.summary_es && (
              <p className="mt-1 line-clamp-2 text-small text-muted-foreground">{item.news.summary_es}</p>
            )}
            <p className="mt-1.5 inline-flex items-center gap-1 text-caption text-muted-foreground">
              {item.news.source} <ExternalLink className="h-3 w-3" />
            </p>
          </div>
        </Link>
      )}

      <ReactionBar
        postId={item.id}
        likes={item.like_count}
        dislikes={item.dislike_count}
        replies={item.reply_count}
        myReaction={item.my_reaction}
        onReply={onReply ? () => onReply(item) : undefined}
      />
    </article>
  );
}

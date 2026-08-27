'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BadgeCheck, ExternalLink, Sprout, Trophy, Clock } from 'lucide-react';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { ReactionBar } from './ReactionBar';
import { PostMenu } from './PostMenu';
import { getDomain } from '@/lib/domains';
import { RANK_BY_SLUG } from '@/lib/ranks';
import { relativeLabel } from '@/lib/utils/dates';
import { useSession } from '@/stores/session';
import type { FeedItem } from '@/lib/api/feed';
import { cn } from '@/lib/utils/cn';

/**
 * One row of the river.
 *
 * A news story and somebody's opinion share the same frame on purpose: the
 * whole point of the Plaza is that both are things you can react to and talk
 * about, not two separate systems bolted together. What differs is the left
 * edge — a person is their Pip, a story is its domain glyph.
 *
 * Rows are NOT individually bordered cards (design system §3, divider-first).
 * The only Card-with-shadow objects here are the attached story and the
 * suggestion cards, because those genuinely are separate objects.
 */
export function FeedCard({
  item,
  onReply,
  onSeen,
  readOnly,
  avatarSize = 40,
  className,
}: {
  item: FeedItem;
  onReply?: (item: FeedItem) => void;
  onSeen?: (id: string) => void;
  /** Kid accounts read only: no reactions, no menu. */
  readOnly?: boolean;
  /** 56 on a permalink root, 40 in a list. */
  avatarSize?: number;
  className?: string;
}) {
  const t = useTranslations('feed');
  const myId = useSession((s) => s.profile?.id);
  const dom = item.domain_tags?.[0] ? getDomain(item.domain_tags[0]) : undefined;
  const rank = item.author?.rank_slug ? RANK_BY_SLUG[item.author.rank_slug] : null;
  const isMine = !!item.author && item.author.id === myId;

  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const [clamped, setClamped] = useState(false);

  // Only offer "Ver más" when the text is actually cut off — a permanently
  // visible toggle on a two-line post is noise.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 4);
  }, [item.body]);

  // Report the impression once the row has really been on screen.
  const rowRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = rowRef.current;
    if (!el || !onSeen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onSeen(item.id);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [item.id, onSeen]);

  const profileHref = item.author?.username ? `/perfil/${item.author.username}` : undefined;

  return (
    <article ref={rowRef} className={cn('py-4', className)}>
      {/* Held by the word list. Shown only to the author (the server does not
          return hidden posts to anyone else), so nobody is left thinking their
          post evaporated. */}
      {item.hidden && (
        <p className="mb-1.5 inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-caption font-medium text-muted-foreground">
          <Clock className="h-3 w-3" />
          {t('underReview')}
        </p>
      )}

      {/* "X replantó" sits above the row it belongs to. */}
      {item.kind === 'repost' && item.author && (
        <p className="eyebrow mb-1.5 flex items-center gap-1 text-muted-foreground">
          <Sprout className="h-3 w-3 text-primary" />
          {t('repostedBy', { name: item.author.display_name ?? item.author.username ?? 'Alguien' })}
        </p>
      )}

      <div className="flex gap-3">
        {/* Left edge: a person is their Pip, a story is its domain. */}
        {item.author ? (
          <PipAvatar
            pipStyle={item.author.pip_style}
            avatarUrl={item.author.avatar_url}
            name={item.author.display_name}
            rankSlug={item.author.rank_slug}
            size={avatarSize}
            ring
            href={profileHref}
          />
        ) : (
          <span
            className="flex shrink-0 items-center justify-center rounded-[12px]"
            style={{
              background: `${dom?.color ?? '#1FB57A'}1f`,
              width: avatarSize,
              height: avatarSize,
            }}
          >
            <DomainIcon
              domain={item.domain_tags?.[0] ?? 'comunidad'}
              size={Math.round(avatarSize / 2)}
              variant="bare"
            />
          </span>
        )}

        <div className="min-w-0 flex-1">
          {/* Author line + eyebrow. The eyebrow (rank · city, or the source) is
              what keeps a dense list readable without boxing every row. */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-1 text-small font-semibold leading-tight">
                {profileHref ? (
                  <Link href={profileHref} className="truncate transition-colors hover:text-primary">
                    {item.author?.display_name ?? item.author?.username ?? 'Alguien'}
                  </Link>
                ) : (
                  <span className="truncate">
                    {item.author?.display_name ?? item.news?.source ?? 'Novedad'}
                  </span>
                )}
                {item.author?.is_verified && (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Cuenta verificada" />
                )}
              </p>
              <p className="eyebrow mt-0.5 truncate text-muted-foreground">
                {item.author
                  ? [rank?.name_es, item.author.city].filter(Boolean).join(' · ') || '—'
                  : (dom?.name_es ?? 'Novedad')}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <span className="whitespace-nowrap text-caption text-muted-foreground">
                {relativeLabel(item.created_at)}
                {item.edited_at ? ` · ${t('edited')}` : ''}
              </span>
              {!readOnly && <PostMenu item={item} isMine={isMine} />}
            </div>
          </div>

          {/* Someone's own words come first — the story is the attachment. */}
          {item.body && (
            <>
              <p
                ref={bodyRef}
                className={cn(
                  'mt-2 whitespace-pre-wrap text-body leading-relaxed',
                  !expanded && 'line-clamp-8',
                  item.kind === 'milestone' && 'font-display text-h3 font-bold',
                )}
              >
                {item.kind === 'milestone' && (
                  <Trophy className="mr-1.5 inline h-4 w-4 -translate-y-0.5 text-brote-sun" />
                )}
                {item.body}
              </p>
              {clamped && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-caption font-medium text-primary transition-colors hover:text-brote-green-deep"
                >
                  {expanded ? t('seeLess') : t('seeMore')}
                </button>
              )}
            </>
          )}

          {/* A post's own image. Fixed aspect + tinted ground so nothing jumps
              or flashes white while it loads. */}
          {item.image_url && (
            <div
              className="mt-2.5 overflow-hidden rounded-card border border-border"
              style={{ background: `${dom?.color ?? '#1FB57A'}14` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          )}

          {/* The original, when this is a replantar. */}
          {item.repost_of && (
            <div className="mt-2.5 rounded-card border border-border p-3">
              <div className="flex items-center gap-2">
                <PipAvatar
                  pipStyle={item.repost_of.author?.pip_style}
                  avatarUrl={item.repost_of.author?.avatar_url}
                  name={item.repost_of.author?.display_name}
                  rankSlug={item.repost_of.author?.rank_slug}
                  size={24}
                />
                <span className="truncate text-caption font-semibold">
                  {item.repost_of.author?.display_name ?? 'Alguien'}
                </span>
                <span className="text-caption text-muted-foreground">
                  {relativeLabel(item.repost_of.created_at)}
                </span>
              </div>
              {item.repost_of.body && (
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-small leading-relaxed">
                  {item.repost_of.body}
                </p>
              )}
            </div>
          )}

          {/* The attached story. A real Card, because it is a separate object —
              and the source is never dropped: attribution plus a link out is
              what makes carrying someone else's journalism defensible (08 §2). */}
          {item.news && (
            <Link
              href={`/feed/n/${item.news.id}`}
              className="press group mt-2.5 block overflow-hidden rounded-card border border-border shadow-soft hover:border-primary/30 hover:shadow-lift"
            >
              {item.news.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.news.image_url}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
              <div className="p-3">
                <p className="eyebrow text-muted-foreground">
                  {item.news.source}
                  {item.news.published_at ? ` · ${relativeLabel(item.news.published_at)}` : ''}
                </p>
                <p className="mt-1 font-display text-body font-bold leading-snug">
                  <span className="link-underline">{item.news.title_es}</span>
                </p>
                {item.news.summary_es && (
                  <p className="mt-1 line-clamp-2 text-small leading-relaxed text-muted-foreground">
                    {item.news.summary_es}
                  </p>
                )}
                <span className="mt-1.5 inline-flex items-center gap-1 text-caption text-primary">
                  {t('readOn', { source: item.news.source ?? '' })} <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Link>
          )}

          {!readOnly && <ReactionBar item={item} onReply={onReply ? () => onReply(item) : undefined} />}
        </div>
      </div>
    </article>
  );
}

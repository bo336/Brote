'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ExternalLink, Share2, Sprout, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { SectionHeader } from '@/components/ui/section';
import { ActivityCard } from '@/components/acciones/ActivityCard';
import { Composer } from '@/components/feed/Composer';
import { ThreadReply } from '@/components/feed/ThreadReply';
import { ReactionBar } from '@/components/feed/ReactionBar';
import { getDomain } from '@/lib/domains';
import { BRAND } from '@/lib/brand';
import { fetchNewsItem, fetchDoSomething, fetchNewsPostId } from '@/lib/api/plaza';
import { fetchThread, deletePost, type FeedItem } from '@/lib/api/feed';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { AdSlot } from '@/components/ads/AdSlot';
import { useAds } from '@/components/ads/AdsProvider';

/**
 * A story, and what to do about it.
 *
 * Copyright rule, not a style choice (08 §2): headline, the stored summary,
 * the source and a link out. Never more of the article than that, never the
 * source line dropped, and the image is hot-linked from the publisher rather
 * than copied into our storage.
 *
 * Everything below the fold is the part that makes carrying news defensible in
 * the first place — two things you can do today and any open project nearby in
 * the same topic, then the conversation.
 */
export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('explorar');
  const tf = useTranslations('feed');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const { noteContentClosed } = useAds();
  const profile = useSession((s) => s.profile);
  const accountType = profile?.accountType ?? 'adult';
  const isKid = accountType === 'kid';
  const [replyTo, setReplyTo] = useState<FeedItem | null>(null);

  const q = useQuery({
    queryKey: ['news-item', params.id],
    queryFn: () => fetchNewsItem(params.id),
    enabled: !!params.id,
  });
  const item = q.data;

  const doQ = useQuery({
    queryKey: ['do-something', params.id, accountType],
    queryFn: () => fetchDoSomething(item!.domain_tags ?? [], accountType, profile?.id),
    enabled: !!item,
    staleTime: 5 * 60_000,
  });

  const postIdQ = useQuery({
    queryKey: ['news-post-id', params.id],
    queryFn: () => fetchNewsPostId(params.id),
    enabled: !!params.id,
  });
  const postId = postIdQ.data ?? null;

  const threadQ = useQuery({
    queryKey: ['feed-thread', postId],
    queryFn: () => fetchThread(postId!),
    enabled: !!postId,
  });

  // Finishing an article is a natural stopping point: it feeds the "moment"
  // counter (an ad may appear after the third one in a session).
  useEffect(() => {
    if (!item) return;
    return () => noteContentClosed();
  }, [item, noteContentClosed]);

  function refreshThread() {
    qc.invalidateQueries({ queryKey: ['feed-thread', postId] });
    setReplyTo(null);
  }

  async function removeReply(id: string) {
    const res = await deletePost(id);
    if (res.ok) refreshThread();
    else toast.error(tf('postFailed'), res.error);
  }

  async function share() {
    if (!item) return;
    const url = postId ? `${window.location.origin}/feed/p/${postId}` : window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: item.title_es ?? 'Brote', url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(tf('linkCopied'));
      }
    } catch {
      /* dismissed */
    }
  }

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos esa novedad.</p>
        <Button variant="secondary" asChild>
          <Link href="/feed">{tc('back')}</Link>
        </Button>
      </div>
    );
  }

  const when = item.published_at
    ? new Date(item.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const hasSomething = (doQ.data?.activities.length ?? 0) > 0 || (doQ.data?.projects.length ?? 0) > 0;

  return (
    <article className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {tc('back')}
        </button>
        <button
          onClick={share}
          aria-label={tf('share')}
          className="press rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {item.image_url && (
        // Hot-linked from the publisher on purpose — re-uploading press images
        // to our own storage is the part that would not be defensible (08 §2).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" className="h-52 w-full rounded-card object-cover" />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {item.domain_tags.map((d) => {
          const dom = getDomain(d);
          return dom ? (
            <Link key={d} href={`/feed?topic=${d}`}>
              <Pill color={dom.color} size="sm">
                {dom.name_es}
              </Pill>
            </Link>
          ) : null;
        })}
      </div>

      <h1 className="font-display text-h1 font-bold leading-tight">{item.title_es}</h1>
      <p className="text-caption text-muted-foreground">
        {item.source ? `${t('source')}: ${item.source}` : ''} {when && `· ${when}`}
      </p>

      {item.summary_es && <p className="text-body leading-relaxed">{item.summary_es}</p>}

      {/* Copyright: only the stored summary is shown; link out to the original. */}
      <Button variant="primary" asChild>
        <a href={item.source_url} target="_blank" rel="noopener nofollow">
          {t('openOriginal')} <ExternalLink className="h-4 w-4" />
        </a>
      </Button>

      {/* ── Hacer algo ─────────────────────────────────────────────────────── */}
      {hasSomething && (
        <section className="pt-2">
          <SectionHeader eyebrow={tf('doSomething')} title="Podés empezar por acá" />
          <div className="space-y-2">
            {doQ.data!.activities.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
            {doQ.data!.projects.map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="eyebrow block text-primary">Proyecto abierto</span>
                  <p className="truncate text-small font-semibold">{p.title}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {[p.city, p.participant_count > 0 ? `${p.participant_count} personas` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Attribution is not enough on its own: a rights holder needs somewhere
          to write to (08 §2). One line, under the article, always. */}
      <p className="text-caption leading-relaxed text-muted-foreground">
        {tf('takedown')}{' '}
        <a href={`mailto:${BRAND.contactEmail}`} className="link-underline text-primary">
          {BRAND.contactEmail}
        </a>
        .
      </p>

      {/* Below the content, never inside it — the reader finishes first. */}
      <AdSlot placement="news-article" className="pt-2" />

      {/* ── La conversación ───────────────────────────────────────────────── */}
      {postId && (
        <section className="pt-2">
          <SectionHeader eyebrow={tf('thread')} title={tf('replies')} />

          {threadQ.data?.post && !isKid && <ReactionBar item={threadQ.data.post} />}

          {!isKid && (
            <div className="mt-3">
              <Composer
                key={replyTo?.id ?? 'root'}
                parentId={postId}
                initialBody={replyTo?.author?.username ? `@${replyTo.author.username} ` : ''}
                placeholder={
                  replyTo?.author?.username
                    ? tf('inReplyTo', { handle: replyTo.author.username })
                    : tf('replyPlaceholder')
                }
                onPosted={refreshThread}
                compact
              />
            </div>
          )}

          <div className="mt-2 divide-y divide-hairline">
            {threadQ.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (threadQ.data?.replies.length ?? 0) === 0 ? (
              <p className="flex flex-col items-center gap-2 py-6 text-center text-small text-muted-foreground">
                <Sprout className="h-5 w-5 text-primary" />
                Todavía no hay comentarios. Estrenalo vos 🌱
              </p>
            ) : (
              threadQ.data!.replies.map((r) => (
                <ThreadReply
                  key={r.id}
                  reply={r}
                  onDelete={isKid ? undefined : removeReply}
                  onReply={isKid ? undefined : setReplyTo}
                />
              ))
            )}
          </div>
        </section>
      )}
    </article>
  );
}

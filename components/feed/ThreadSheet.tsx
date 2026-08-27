'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedCard } from './FeedCard';
import { Composer } from './Composer';
import { ThreadReply } from './ThreadReply';
import { fetchThread, deletePost, type FeedItem } from '@/lib/api/feed';
import { toast } from '@/stores/toast';

/**
 * The conversation under one item, opened as a sheet so reading a thread never
 * loses your place in the timeline. The permalink at /feed/p/[id] is the
 * shareable version — this is the in-feed one.
 */
export function ThreadSheet({ item, onClose }: { item: FeedItem | null; onClose: () => void }) {
  const t = useTranslations('feed');
  const qc = useQueryClient();
  const postId = item?.id ?? null;

  const q = useQuery({
    queryKey: ['feed-thread', postId],
    queryFn: () => fetchThread(postId!),
    enabled: !!postId,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ['feed-thread', postId] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  async function removeReply(id: string) {
    const res = await deletePost(id);
    if (res.ok) refresh();
    else toast.error(t('postFailed'), res.error);
  }

  return (
    <Sheet open={!!postId} onOpenChange={(v) => !v && onClose()} title={t('thread')}>
      {q.isLoading ? (
        <div className="space-y-3 p-1">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !q.data?.post ? (
        <p className="py-8 text-center text-small text-muted-foreground">{t('postNotFound')}</p>
      ) : (
        <div className="space-y-3">
          <div className="border-b border-border pb-1">
            <FeedCard item={q.data.post} />
          </div>

          {postId && (
            <Link
              href={`/feed/p/${postId}`}
              className="inline-flex items-center gap-1 text-caption font-medium text-primary transition-colors hover:text-brote-green-deep"
            >
              {t('thread')} <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}

          <Composer parentId={q.data.post.id} placeholder={t('replyPlaceholder')} onPosted={refresh} compact />

          <div className="divide-y divide-hairline">
            {q.data.replies.length === 0 ? (
              <p className="py-6 text-center text-small text-muted-foreground">
                Todavía no hay comentarios. Estrenalo vos 🌱
              </p>
            ) : (
              q.data.replies.map((r) => <ThreadReply key={r.id} reply={r} onDelete={removeReply} />)
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

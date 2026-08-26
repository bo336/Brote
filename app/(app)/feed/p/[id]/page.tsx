'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { FeedCard } from '@/components/feed/FeedCard';
import { Composer } from '@/components/feed/Composer';
import { ThreadReply } from '@/components/feed/ThreadReply';
import { fetchThread, deletePost } from '@/lib/api/feed';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

/**
 * Post permalink.
 *
 * This route exists in phase 1 because notifications, shares and deep links
 * all point at it — a conversation you cannot link to is a dead end, which is
 * exactly what the old sheet-only thread was. The richer treatment (OG tags,
 * nested "in reply to" resolution) is phase 2.
 */
export default function PostPermalinkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('feed');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const isKid = useSession((s) => s.profile?.accountType) === 'kid';

  const q = useQuery({ queryKey: ['feed-thread', id], queryFn: () => fetchThread(id), enabled: !!id });

  function refresh() {
    qc.invalidateQueries({ queryKey: ['feed-thread', id] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  async function removeReply(replyId: string) {
    const res = await deletePost(replyId);
    if (res.ok) refresh();
    else toast.error(t('postFailed'), res.error);
  }

  return (
    <div className="space-y-4 pb-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !q.data?.post ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Pip size={64} mood="neutral" />
          <p className="text-muted-foreground">{t('postNotFound')}</p>
          <Button variant="secondary" onClick={() => router.push('/feed')}>
            {t('title')}
          </Button>
        </div>
      ) : (
        <>
          <div className="border-b border-border pb-2">
            <FeedCard item={q.data.post} readOnly={isKid} />
          </div>

          {!isKid && (
            <Composer parentId={q.data.post.id} placeholder={t('replyPlaceholder')} onPosted={refresh} compact />
          )}

          <section>
            <span className="eyebrow block text-muted-foreground">{t('replies')}</span>
            <div className="mt-1 divide-y divide-hairline">
              {q.data.replies.length === 0 ? (
                <p className="py-6 text-center text-small text-muted-foreground">
                  Todavía no hay comentarios. Estrenalo vos 🌱
                </p>
              ) : (
                q.data.replies.map((r) => (
                  <ThreadReply key={r.id} reply={r} onDelete={isKid ? undefined : removeReply} />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

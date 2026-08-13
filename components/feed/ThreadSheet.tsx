'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { FeedCard } from './FeedCard';
import { Composer } from './Composer';
import { ReactionBar } from './ReactionBar';
import { fetchThread, deletePost } from '@/lib/api/feed';
import { relativeLabel } from '@/lib/utils/dates';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { Trash2 } from 'lucide-react';

/**
 * The conversation under one item, opened as a sheet so reading a thread never
 * loses your place in the timeline.
 */
export function ThreadSheet({
  postId,
  open,
  onClose,
}: {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const myId = useSession((s) => s.profile?.id);

  const q = useQuery({
    queryKey: ['feed-thread', postId],
    queryFn: () => fetchThread(postId!),
    enabled: !!postId && open,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ['feed-thread', postId] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  async function removeReply(id: string) {
    const res = await deletePost(id);
    if (res.ok) refresh();
    else toast.error('No se pudo borrar', res.error);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()} title="Conversación">
      {q.isLoading ? (
        <div className="space-y-3 p-1">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !q.data?.post ? (
        <p className="py-8 text-center text-small text-muted-foreground">Esta publicación ya no está disponible.</p>
      ) : (
        <div className="space-y-3">
          <div className="border-b border-border pb-1">
            <FeedCard item={q.data.post} />
          </div>

          <Composer
            parentId={q.data.post.id}
            placeholder="Sumá tu opinión…"
            onPosted={refresh}
            compact
          />

          <div className="divide-y divide-border">
            {q.data.replies.length === 0 ? (
              <p className="py-6 text-center text-small text-muted-foreground">
                Todavía no hay comentarios. Estrenalo vos 🌱
              </p>
            ) : (
              q.data.replies.map((r) => (
                <div key={r.id} className="flex gap-2.5 py-3">
                  <Avatar name={r.author?.display_name} src={r.author?.avatar_url} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {r.author?.display_name ?? r.author?.username ?? 'Alguien'}
                      </span>{' '}
                      · {relativeLabel(r.created_at)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-small leading-relaxed">{r.body}</p>
                    <ReactionBar
                      postId={r.id}
                      likes={r.like_count}
                      dislikes={r.dislike_count}
                      myReaction={r.my_reaction}
                      compact
                    />
                  </div>
                  {r.author?.id === myId && (
                    <button
                      onClick={() => removeReply(r.id)}
                      aria-label="Borrar comentario"
                      className="h-fit rounded-pill p-1.5 text-muted-foreground transition-colors hover:text-brote-coral"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

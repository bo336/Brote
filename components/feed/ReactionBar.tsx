'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { reactToPost } from '@/lib/api/feed';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Like / dislike / reply counts for one feed item.
 *
 * Reacts optimistically and reconciles with the server's authoritative counts,
 * because a reaction that visibly lags feels broken — and the server is the
 * only thing that knows whether tapping again cleared the reaction.
 */
export function ReactionBar({
  postId,
  likes,
  dislikes,
  replies,
  myReaction,
  onReply,
  compact = false,
}: {
  postId: string;
  likes: number;
  dislikes: number;
  replies?: number;
  myReaction: number | null;
  onReply?: () => void;
  compact?: boolean;
}) {
  const [state, setState] = useState({ likes, dislikes, mine: myReaction });
  const [busy, setBusy] = useState(false);

  async function react(value: 1 | -1) {
    if (busy) return;
    setBusy(true);
    haptic('light');

    // Optimistic: tapping the reaction you already hold removes it.
    const wasMine = state.mine;
    const nextMine = wasMine === value ? null : value;
    setState((s) => ({
      likes: s.likes + (nextMine === 1 ? 1 : 0) - (wasMine === 1 ? 1 : 0),
      dislikes: s.dislikes + (nextMine === -1 ? 1 : 0) - (wasMine === -1 ? 1 : 0),
      mine: nextMine,
    }));

    const res = await reactToPost(postId, value);
    if (res.ok && typeof res.like_count === 'number') {
      setState({ likes: res.like_count, dislikes: res.dislike_count ?? 0, mine: res.my_reaction ?? null });
    } else {
      setState({ likes, dislikes, mine: myReaction }); // roll back
    }
    setBusy(false);
  }

  const btn = 'inline-flex items-center gap-1.5 rounded-pill px-2 py-1 text-caption font-medium transition-colors';

  return (
    <div className={cn('flex items-center gap-1', compact ? 'mt-1' : 'mt-2')}>
      <button
        onClick={() => react(1)}
        aria-pressed={state.mine === 1}
        aria-label="Me gusta"
        className={cn(btn, state.mine === 1 ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}
      >
        <ThumbsUp className={cn('h-3.5 w-3.5', state.mine === 1 && 'fill-current')} />
        {state.likes > 0 && <span className="tnum">{state.likes}</span>}
      </button>

      <button
        onClick={() => react(-1)}
        aria-pressed={state.mine === -1}
        aria-label="No me gusta"
        className={cn(btn, state.mine === -1 ? 'bg-brote-coral/15 text-brote-coral' : 'text-muted-foreground hover:text-foreground')}
      >
        <ThumbsDown className={cn('h-3.5 w-3.5', state.mine === -1 && 'fill-current')} />
        {state.dislikes > 0 && <span className="tnum">{state.dislikes}</span>}
      </button>

      {onReply && (
        <button onClick={onReply} className={cn(btn, 'text-muted-foreground hover:text-foreground')} aria-label="Comentar">
          <MessageCircle className="h-3.5 w-3.5" />
          {(replies ?? 0) > 0 ? <span className="tnum">{replies}</span> : <span>Comentar</span>}
        </button>
      )}
    </div>
  );
}

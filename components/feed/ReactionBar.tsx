'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, ThumbsDown, MessageCircle, Repeat2, Bookmark, Share2 } from 'lucide-react';
import { reactToPost, toggleSave, createPost, unrepost, type FeedItem } from '@/lib/api/feed';
import { RepostSheet } from './RepostSheet';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Like / dislike / comment / replant / save / share.
 *
 * Reactions stay a two-way signal on purpose. An emoji palette would dilute
 * what the ranker reads and break the design system's restraint — the score
 * treats a like as meaning something, so it has to keep meaning one thing.
 *
 * Everything is optimistic and reconciles against the server's authoritative
 * counts, because the server is the only thing that knows whether tapping
 * again cleared the reaction.
 */
export function ReactionBar({ item, onReply }: { item: FeedItem; onReply?: () => void }) {
  const t = useTranslations('feed');
  const isKid = useSession((s) => s.profile?.accountType) === 'kid';

  const [state, setState] = useState({
    likes: item.like_count,
    dislikes: item.dislike_count,
    mine: item.my_reaction,
  });
  const [saved, setSaved] = useState(item.saved);
  const [reposts, setReposts] = useState(item.repost_count);
  const [reposted, setReposted] = useState(item.reposted);
  const [repostOpen, setRepostOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isKid) return null;

  async function react(value: 1 | -1) {
    if (busy) return;
    setBusy(true);
    haptic('light');

    const wasMine = state.mine;
    const nextMine = wasMine === value ? null : value;
    setState((s) => ({
      likes: s.likes + (nextMine === 1 ? 1 : 0) - (wasMine === 1 ? 1 : 0),
      dislikes: s.dislikes + (nextMine === -1 ? 1 : 0) - (wasMine === -1 ? 1 : 0),
      mine: nextMine,
    }));

    const res = await reactToPost(item.id, value);
    if (res.ok && typeof res.like_count === 'number') {
      setState({ likes: res.like_count, dislikes: res.dislike_count ?? 0, mine: res.my_reaction ?? null });
    } else {
      setState({ likes: item.like_count, dislikes: item.dislike_count, mine: item.my_reaction });
      if (res.error) toast.error(res.error);
    }
    setBusy(false);
  }

  async function save() {
    haptic('light');
    const next = !saved;
    setSaved(next);
    const res = await toggleSave(item.id);
    if (!res.ok) setSaved(!next);
    else setSaved(res.saved ?? next);
  }

  /**
   * The icon is a toggle, not an "add one more". Tapping it when you have
   * already replanted removes yours — otherwise the only way back would be
   * hunting your own repost down in your profile.
   */
  async function onRepostTap() {
    if (busy) return;
    if (!reposted) return setRepostOpen(true);

    setBusy(true);
    haptic('light');
    setReposted(false);
    setReposts((n) => Math.max(0, n - 1));
    const res = await unrepost(item.id);
    if (!res.ok) {
      setReposted(true);
      setReposts(item.repost_count);
      toast.error(t('postFailed'), res.error);
    } else {
      if (typeof res.repost_count === 'number') setReposts(res.repost_count);
      toast.success(t('repostUndone'));
    }
    setBusy(false);
  }

  async function repostPlain() {
    if (busy) return;
    setBusy(true);
    haptic('light');
    setRepostOpen(false);
    setReposted(true);
    setReposts((n) => n + 1);
    const res = await createPost({ body: '', repostOf: item.id });
    if (!res.ok) {
      setReposted(false);
      setReposts((n) => Math.max(0, n - 1));
      toast.error(t('postFailed'), res.error);
    } else {
      toast.success(t('repostDone'));
    }
    setBusy(false);
  }

  function onQuoted() {
    setRepostOpen(false);
    setReposted(true);
    setReposts((n) => n + 1);
  }

  async function share() {
    const url = `${window.location.origin}/feed/p/${item.id}`;
    const title = item.news?.title_es ?? item.body?.slice(0, 80) ?? 'Brote';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      }
    } catch {
      /* the user dismissed the share sheet */
    }
  }

  // p-2 -m-1 keeps the visual size tight while the tap target clears 44px.
  const btn =
    'group -m-1 inline-flex items-center gap-1.5 rounded-pill p-2 text-caption font-medium transition-colors';

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1">
      <button
        onClick={() => react(1)}
        aria-pressed={state.mine === 1}
        aria-label={t('like')}
        className={cn(btn, state.mine === 1 ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-transform duration-200 group-active:scale-125',
            state.mine === 1 && 'fill-current',
          )}
        />
        {state.likes > 0 && <span className="tnum">{state.likes}</span>}
      </button>

      <button
        onClick={() => react(-1)}
        aria-pressed={state.mine === -1}
        aria-label={t('dislike')}
        className={cn(
          btn,
          state.mine === -1 ? 'text-brote-coral' : 'text-muted-foreground hover:text-brote-coral',
        )}
      >
        <ThumbsDown className={cn('h-4 w-4', state.mine === -1 && 'fill-current')} />
        {state.dislikes > 0 && <span className="tnum">{state.dislikes}</span>}
      </button>

      {onReply && (
        <button onClick={onReply} aria-label={t('comment')} className={cn(btn, 'text-muted-foreground hover:text-foreground')}>
          <MessageCircle className="h-4 w-4" />
          {item.reply_count > 0 ? <span className="tnum">{item.reply_count}</span> : <span>{t('comment')}</span>}
        </button>
      )}

      <button
        onClick={onRepostTap}
        aria-pressed={reposted}
        aria-label={reposted ? t('repostDone') : t('repost')}
        className={cn(btn, reposted ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
      >
        <Repeat2 className="h-4 w-4" />
        {reposts > 0 && <span className="tnum">{reposts}</span>}
      </button>

      <button
        onClick={save}
        aria-pressed={saved}
        aria-label={saved ? t('savedState') : t('save')}
        className={cn(btn, saved ? 'text-brote-sun' : 'text-muted-foreground hover:text-brote-sun')}
      >
        <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
      </button>

      <button onClick={share} aria-label={t('share')} className={cn(btn, 'text-muted-foreground hover:text-foreground')}>
        <Share2 className="h-4 w-4" />
      </button>

      <RepostSheet
        item={item}
        open={repostOpen}
        onOpenChange={setRepostOpen}
        onPlain={repostPlain}
        onQuoted={onQuoted}
      />
    </div>
  );
}

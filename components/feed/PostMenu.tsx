'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, Link2, Flag, UserMinus, VolumeX, Ban, Trash2, UserPlus, Pencil } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { deletePost, canStillEdit, type FeedItem } from '@/lib/api/feed';
import { EditSheet } from './EditSheet';
import { blockUser, muteUser, reportContent, followUser, unfollowUser, REPORT_REASONS, type ReportReason } from '@/lib/api/social';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * The ⋯ menu on a feed item.
 *
 * Phase 1 keeps this a plain Sheet — the polish is phase 2 work — but the
 * actions themselves are real from day one, because "report" and "block" are
 * the two things a person needs the moment a feed has strangers in it, and
 * shipping a social surface without them is the actual risk.
 */
export function PostMenu({ item, isMine }: { item: FeedItem; isMine: boolean }) {
  const t = useTranslations('feed');
  const qc = useQueryClient();
  const me = useSession((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState(item.author?.is_following ?? false);

  const author = item.author;
  const canAct = !!author && author.id !== me?.id;

  // A post can be on screen in four places at once (timeline, thread sheet,
  // permalink, a profile tab). Invalidate all of them, or an edit "reverts"
  // the moment you navigate back.
  function refresh() {
    for (const key of ['feed', 'feed-thread', 'profile-posts', 'saved-posts']) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/feed/p/${item.id}`);
    toast.success(t('linkCopied'));
    setOpen(false);
  }

  async function onFollow() {
    if (!author || busy) return;
    setBusy(true);
    const next = !following;
    const res = next ? await followUser(author.id) : await unfollowUser(author.id);
    setBusy(false);
    if (!res.ok) return toast.error(t('followFailed'), res.error);
    setFollowing(next);
    refresh();
    setOpen(false);
  }

  async function onMute() {
    if (!author) return;
    const res = await muteUser(author.id, true);
    if (!res.ok) return toast.error(t('followFailed'), res.error);
    toast.success(t('mutedToast'));
    refresh();
    setOpen(false);
  }

  async function onBlock() {
    if (!author) return;
    const res = await blockUser(author.id, true);
    if (!res.ok) return toast.error(t('followFailed'), res.error);
    toast.success(t('blockedToast'));
    refresh();
    setOpen(false);
  }

  async function onDelete() {
    if (!confirm(t('deleteConfirm'))) return;
    const res = await deletePost(item.id);
    if (!res.ok) return toast.error(t('postFailed'), res.error);
    toast.success(t('deleted'));
    refresh();
    setOpen(false);
  }

  async function onReport(reason: ReportReason) {
    setBusy(true);
    const res = await reportContent({ postId: item.id, reason });
    setBusy(false);
    if (!res.ok) return toast.error(t('postFailed'), res.error);
    toast.success(res.already ? t('reportAlready') : t('reportSent'));
    setReporting(false);
    setOpen(false);
  }

  const row =
    'flex w-full items-center gap-3 rounded-button px-3 py-3 text-left text-small font-medium transition-colors hover:bg-surface-2';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('more')}
        className="-m-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setReporting(false);
        }}
        title={reporting ? t('reportTitle') : undefined}
      >
        {reporting ? (
          <div className="space-y-1">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                disabled={busy}
                onClick={() => onReport(r)}
                className={cn(row, 'disabled:opacity-50')}
              >
                {t(`reportReason${r.charAt(0).toUpperCase()}${r.slice(1)}` as never)}
              </button>
            ))}
            <Button variant="ghost" block className="mt-2" onClick={() => setReporting(false)}>
              Volver
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <button onClick={copyLink} className={row}>
              <Link2 className="h-4 w-4 text-muted-foreground" /> {t('share')}
            </button>

            {canAct && me?.accountType !== 'kid' && (
              <button onClick={onFollow} disabled={busy} className={row}>
                {following ? (
                  <>
                    <UserMinus className="h-4 w-4 text-muted-foreground" /> {t('unfollow')}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-muted-foreground" /> {t('follow')}
                  </>
                )}
              </button>
            )}

            {canAct && (
              <>
                <button onClick={onMute} className={row}>
                  <VolumeX className="h-4 w-4 text-muted-foreground" /> {t('mute')}
                </button>
                <button onClick={onBlock} className={cn(row, 'text-brote-coral')}>
                  <Ban className="h-4 w-4" /> {t('block')}
                </button>
              </>
            )}

            {/* Anyone can report, including kids and teens — one tap, no free
                text, which is the whole "notice and action" entry point. */}
            <button onClick={() => setReporting(true)} className={row}>
              <Flag className="h-4 w-4 text-muted-foreground" /> {t('report')}
            </button>

            {/* The 5-minute door. Hidden once it has closed rather than shown
                disabled: an option you cannot take is just noise. */}
            {isMine && item.kind !== 'repost' && canStillEdit(item.created_at) && (
              <button
                onClick={() => {
                  setOpen(false);
                  setEditing(true);
                }}
                className={row}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" /> {t('edit')}
              </button>
            )}

            {isMine && (
              <button onClick={onDelete} className={cn(row, 'text-brote-coral')}>
                <Trash2 className="h-4 w-4" /> {t('delete')}
              </button>
            )}
          </div>
        )}
      </Sheet>

      {isMine && <EditSheet item={item} open={editing} onOpenChange={setEditing} onEdited={refresh} />}
    </>
  );
}

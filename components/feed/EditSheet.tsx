'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { editPost, canStillEdit, type FeedItem } from '@/lib/api/feed';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const MAX = 1000;

/**
 * Fix a typo, within five minutes.
 *
 * Deliberately not a full composer: the image and the topics stay as they
 * were. A five-minute window is for repairing what you wrote, not for
 * swapping out a post that people have already reacted to — and `edited_at`
 * marks it either way, so nobody is reading a silently different post.
 *
 * The window is enforced by `edit_feed_post` on the server. This only hides
 * the door; `canStillEdit` re-checks on open in case the sheet was left sitting.
 */
export function EditSheet({
  item,
  open,
  onOpenChange,
  onEdited,
}: {
  item: FeedItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdited?: () => void;
}) {
  const t = useTranslations('feed');
  const [body, setBody] = useState(item.body ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setBody(item.body ?? '');
  }, [open, item.body]);

  const left = MAX - body.length;
  const unchanged = body.trim() === (item.body ?? '').trim();

  async function save() {
    const text = body.trim();
    if (!text || busy) return;
    if (!canStillEdit(item.created_at)) {
      toast.error(t('editTooLate'));
      onOpenChange(false);
      return;
    }
    setBusy(true);
    const res = await editPost(item.id, text);
    setBusy(false);
    if (!res.ok) return toast.error(t('postFailed'), res.error);
    toast.success(t('editSaved'));
    onOpenChange(false);
    onEdited?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('edit')}>
      <div className="space-y-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          rows={5}
          autoFocus
          aria-label={t('edit')}
        />
        <div className="flex items-center justify-between gap-3">
          <span className={cn('text-caption tnum', left < 50 ? 'text-brote-coral' : 'text-muted-foreground')}>
            {t('charsLeft', { n: left })}
          </span>
          <Button size="sm" loading={busy} disabled={!body.trim() || unchanged} onClick={save}>
            {t('publish')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

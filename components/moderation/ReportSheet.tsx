'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { reportContent, REPORT_REASONS, type ReportReason } from '@/lib/api/social';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

/**
 * Report a post or an account.
 *
 * Anyone can report, including kids and teens — that is the whole entry point
 * of the "notice and action" duty, and a minor who cannot report is a minor
 * with no way to ask for help. Kids and teens get one tap and no free-text box:
 * an open field invites them to write things they should not be publishing to
 * a stranger, and the reason code is what the queue actually acts on.
 */
export function ReportSheet({
  open,
  onOpenChange,
  postId,
  profileId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId?: string | null;
  profileId?: string | null;
  onDone?: () => void;
}) {
  const t = useTranslations('feed');
  const tm = useTranslations('moderacion');
  const accountType = useSession((s) => s.profile?.accountType);
  const isAdult = accountType === 'adult';

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(r: ReportReason) {
    if (busy) return;
    setBusy(true);
    const res = await reportContent({
      postId: postId ?? null,
      profileId: profileId ?? null,
      reason: r,
      note: isAdult && note.trim() ? note.trim() : null,
    });
    setBusy(false);
    if (!res.ok) return toast.error(t('postFailed'), res.error);
    toast.success(res.already ? t('reportAlready') : tm('thanks'), tm('thanksBody'));
    setReason(null);
    setNote('');
    onOpenChange(false);
    onDone?.();
  }

  const row =
    'flex w-full items-center justify-between gap-3 rounded-button px-3 py-3 text-left text-small font-medium transition-colors hover:bg-surface-2 disabled:opacity-50';

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('reportTitle')}>
      {/* Adults get an optional note; kids and teens report in one tap. */}
      {isAdult && reason ? (
        <div className="space-y-3">
          <p className="text-small text-muted-foreground">
            {t(`reportReason${reason.charAt(0).toUpperCase()}${reason.slice(1)}` as never)}
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder={tm('notePlaceholder')}
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="ghost" block onClick={() => setReason(null)}>
              Volver
            </Button>
            <Button variant="primary" block loading={busy} onClick={() => submit(reason)}>
              {tm('send')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              disabled={busy}
              onClick={() => (isAdult ? setReason(r) : submit(r))}
              className={row}
            >
              {t(`reportReason${r.charAt(0).toUpperCase()}${r.slice(1)}` as never)}
            </button>
          ))}
          <p className="px-3 pt-2 text-caption leading-relaxed text-muted-foreground">
            {tm('rulesHint')}{' '}
            <Link href="/legal/terminos" className="font-medium text-primary underline underline-offset-2">
              {tm('rulesLink')}
            </Link>
          </p>
        </div>
      )}
    </Sheet>
  );
}

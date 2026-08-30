'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertTriangle, EyeOff, Eye, X, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipRail } from '@/components/ui/chip-rail';
import { adminModerationQueue, adminModerate, type ModerationQueueItem } from '@/lib/api/admin';
import { relativeLabel } from '@/lib/utils/dates';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

type Status = 'open' | 'upheld' | 'dismissed';

/**
 * The report queue.
 *
 * Reporting already works end to end without this screen — three reports
 * auto-hide a post and the author is told. What was missing was the human at
 * the other end: somewhere to look at what was flagged, put it back if the
 * blocklist was wrong, and leave a record. `moderation_actions` is that record
 * and it is append-only by design (08 §4) — it is what makes an appeal
 * possible, so nothing here ever deletes a row.
 *
 * Resolved reports stay readable for the same reason.
 */
export function ModerationQueue({ pass }: { pass: string }) {
  const t = useTranslations('moderacion');
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('open');
  const [busy, setBusy] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['moderation-queue', status],
    queryFn: () => adminModerationQueue(pass, status),
    enabled: !!pass,
  });

  async function act(id: string, action: 'hide' | 'restore' | 'dismiss') {
    setBusy(id);
    const res = await adminModerate(pass, id, action);
    setBusy(null);
    if (!res.ok) return toast.error('No se pudo', res.error);
    qc.invalidateQueries({ queryKey: ['moderation-queue'] });
  }

  const items = q.data ?? [];

  return (
    <section>
      <h2 className="mb-2 font-display text-h3 font-bold">{t('queue')}</h2>

      {/* This is not a moderation decision and never becomes one. It sits above
          the queue so the person working it reads it before the first case. */}
      <div className="mb-3 flex items-start gap-2.5 rounded-card border border-brote-coral/40 bg-brote-coral/10 p-3.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brote-coral" />
        <p className="text-caption leading-relaxed text-brote-coral">{t('csamNotice')}</p>
      </div>

      <ChipRail
        layoutId="mod-status"
        value={status}
        onChange={(v) => setStatus(v as Status)}
        options={[
          { value: 'open', label: t('queueOpen') },
          // The chip names a state, not an action — the button below says
          // "Ocultar"; this filter shows what already is hidden.
          { value: 'upheld', label: t('queueUpheld') },
          { value: 'dismissed', label: t('queueResolved') },
        ]}
      />

      <div className="mt-3 space-y-2">
        {q.isLoading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : items.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-small text-muted-foreground">{t('queueEmpty')}</p>
          </Card>
        ) : (
          items.map((r) => (
            <ReportCard key={r.id} r={r} busy={busy === r.id} onAct={(a) => act(r.id, a)} />
          ))
        )}
      </div>
    </section>
  );
}

function ReportCard({
  r,
  busy,
  onAct,
}: {
  r: ModerationQueueItem;
  busy: boolean;
  onAct: (a: 'hide' | 'restore' | 'dismiss') => void;
}) {
  const t = useTranslations('moderacion');
  const tf = useTranslations('feed');

  const reasonLabel = tf(`reportReason${r.reason.charAt(0).toUpperCase()}${r.reason.slice(1)}` as never);

  return (
    <Card className="space-y-3 p-3.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-pill bg-brote-coral/15 px-2 py-0.5 text-caption font-semibold text-brote-coral">
          {reasonLabel}
        </span>
        <span className="text-caption text-muted-foreground">{t('reportsCount', { n: r.reports })}</span>
        <span className="text-caption text-muted-foreground">· {relativeLabel(r.created_at)}</span>
        {r.post_hidden && (
          <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-caption font-medium text-muted-foreground">
            {t('underReview')}
          </span>
        )}
      </div>

      {r.note && <p className="text-caption italic leading-relaxed text-muted-foreground">“{r.note}”</p>}

      {/* The reported words, verbatim. Judging a post from a summary of it is
          how a wrong call gets made. */}
      {r.post?.body && (
        <p className="whitespace-pre-wrap rounded-card border border-border bg-surface-2 p-3 text-small leading-relaxed">
          {r.post.body}
        </p>
      )}
      {r.post?.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.post.image_url} alt="" className="max-h-48 w-full rounded-card object-cover" />
      )}

      {r.author && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
          <span className="font-medium text-foreground">
            {r.author.display_name ?? r.author.username ?? 'Alguien'}
          </span>
          {r.author.username && (
            <Link href={`/perfil/${r.author.username}`} className="link-underline">
              @{r.author.username}
            </Link>
          )}
          <span>
            {t('trustScore')}: <span className="tnum">{(r.author.trust_score ?? 1).toFixed(2)}</span>
          </span>
          <span>
            {t('upheld30d')}: <span className="tnum">{r.author.upheld_30d}</span>
          </span>
          {r.author.suspended_until && (
            <span className="text-brote-coral">
              {t('suspendedUntil')} {new Date(r.author.suspended_until).toLocaleDateString('es-AR')}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {r.post && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/feed/p/${r.post.id}`} target="_blank">
              Ver <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          loading={busy}
          onClick={() => onAct(r.post_hidden ? 'restore' : 'hide')}
          className={cn(!r.post_hidden && 'text-brote-coral')}
        >
          {r.post_hidden ? (
            <>
              <Eye className="h-3.5 w-3.5" /> {t('restore')}
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" /> {t('hide')}
            </>
          )}
        </Button>
        {r.status === 'open' && (
          <Button variant="ghost" size="sm" loading={busy} onClick={() => onAct('dismiss')}>
            <X className="h-3.5 w-3.5" /> {t('dismiss')}
          </Button>
        )}
      </div>

      {r.status !== 'open' && (
        <p className="text-caption text-muted-foreground">
          {t('queueResolved')} · {r.resolved_at ? relativeLabel(r.resolved_at) : '—'}
          {r.resolution ? ` · ${r.resolution}` : ''}
        </p>
      )}
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Repeat2, Quote } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { Composer } from './Composer';
import { relativeLabel } from '@/lib/utils/dates';
import type { FeedItem } from '@/lib/api/feed';

/**
 * Replantar vs Citar.
 *
 * Two different acts that a single button would blur: passing something along
 * as-is, and passing it along *with something to say about it*. Keeping them
 * one tap apart means the quiet one stays quiet — most replants have nothing
 * to add, and forcing a composer on them turns a signal boost into a chore.
 */
export function RepostSheet({
  item,
  open,
  onOpenChange,
  onPlain,
  onQuoted,
}: {
  item: FeedItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPlain: () => void;
  onQuoted: () => void;
}) {
  const t = useTranslations('feed');
  const [quoting, setQuoting] = useState(false);

  const row =
    'flex w-full items-center gap-3 rounded-button px-3 py-3 text-left text-small font-medium transition-colors hover:bg-surface-2';

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setQuoting(false);
      }}
      title={quoting ? t('quote') : t('repost')}
    >
      {quoting ? (
        <div className="space-y-3">
          {/* The original stays visible while you write — you are commenting on
              a specific thing, and it should not be off-screen while you do. */}
          <div className="rounded-card border border-border p-3">
            <div className="flex items-center gap-2">
              <PipAvatar
                pipStyle={item.author?.pip_style}
                avatarUrl={item.author?.avatar_url}
                name={item.author?.display_name}
                rankSlug={item.author?.rank_slug}
                size={24}
              />
              <span className="truncate text-caption font-semibold">
                {item.author?.display_name ?? item.news?.source ?? 'Novedad'}
              </span>
              <span className="text-caption text-muted-foreground">{relativeLabel(item.created_at)}</span>
            </div>
            <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-small leading-relaxed">
              {item.body ?? item.news?.title_es}
            </p>
          </div>

          <Composer
            repostOf={item.id}
            placeholder={t('composerPlaceholder')}
            onPosted={() => {
              setQuoting(false);
              onQuoted();
            }}
            compact
          />
        </div>
      ) : (
        <div className="space-y-1">
          <button onClick={onPlain} className={row}>
            <Repeat2 className="h-4 w-4 text-primary" /> {t('repostPlain')}
          </button>
          <button onClick={() => setQuoting(true)} className={row}>
            <Quote className="h-4 w-4 text-muted-foreground" /> {t('quote')}
          </button>
        </div>
      )}
    </Sheet>
  );
}

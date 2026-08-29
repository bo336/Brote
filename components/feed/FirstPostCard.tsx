'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pip } from '@/components/pip/Pip';

/**
 * "Tu primera publicación 🌱 — así se ve en la Plaza."
 *
 * The gap between pressing Publicar and understanding that a real, linkable
 * page now exists with your words on it is where most people quietly decide the
 * feature is not for them. One card, once, that takes you to the thing you just
 * made.
 *
 * Dismissal is recorded server-side, so it does not come back on another device.
 */
export function FirstPostCard({ postId, onDismiss }: { postId: string; onDismiss: () => void }) {
  const t = useTranslations('feed');

  return (
    <Card className="my-3 flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
      <Pip size={44} mood="celebrating" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-small font-bold">{t('firstPostTitle')}</p>
        <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{t('firstPostBody')}</p>
        <Link
          href={`/feed/p/${postId}`}
          className="mt-1.5 inline-block text-caption font-medium text-primary link-underline"
        >
          {t('firstPostCta')}
        </Link>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Cerrar"
        className="-m-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}

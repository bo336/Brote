'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

const KEY = 'brote:milestone-explained';

/**
 * Shown once, the first time one of your own milestones turns up in the feed.
 *
 * Autoposting is opt-in and off by default, so nobody is surprised by the post
 * itself — but "I turned a switch on in Settings last week" and "there is a
 * post with my name on it in the Plaza" are far enough apart that the link
 * between them is worth drawing once, together with the way back.
 *
 * The flag lives in localStorage: it is an explainer, not a setting, and a
 * per-device memory is the right amount of memory for one. If storage is
 * unavailable the notice simply shows — which is the safe direction to fail.
 */
export function MilestoneNotice({ show }: { show: boolean }) {
  const t = useTranslations('feed');
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!show) return;
    try {
      setDismissed(localStorage.getItem(KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, [show]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* private mode — it will show again, which is harmless */
    }
  }

  if (!show || dismissed) return null;

  return (
    <Card className="my-3 flex items-start gap-3 border-brote-sun/40 bg-brote-sun/10 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brote-sun/20 text-brote-sun">
        <Trophy className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small leading-relaxed">{t('milestoneNotice')}</p>
        <Link
          href="/perfil/ajustes"
          className="mt-1 inline-block text-caption font-medium text-primary link-underline"
        >
          Ir a Ajustes
        </Link>
      </div>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="-m-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}

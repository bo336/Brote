'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { getDomain, getDomainColor } from '@/lib/domains';
import { suggestionFor } from '@/lib/world/journal';
import type { JournalEntry } from '@/lib/world/types';

/**
 * The app seam: completing a domain's species set surfaces **one** matching
 * real-action suggestion — "once, non-modal, dismissible, never repeated"
 * (`11-GAME-LOOP.md` §3.3, and §5 pillar 3).
 *
 * Every word of that is a constraint, and each is load-bearing:
 *
 *  - **one** — `suggestionFor` returns a single domain even when three sets
 *    finish together, because three stacked nudges is a notification centre;
 *  - **non-modal** — a strip inside the Bitácora they already opened, never an
 *    interruption, and it does not block the sheet behind it;
 *  - **dismissible** — "Ahora no" is a real button, the same size as "Ver";
 *  - **never repeated** — a dismissal is remembered, and this is the only
 *    reason this component has storage at all.
 *
 * **On `localStorage`.** `01-RULES.md` forbids it for authoritative state, and
 * a dismissal is not that: nothing in the world or the economy depends on it,
 * and the worst a lost one can do is offer the same suggestion once more on a
 * new device. A row in Postgres would be the stricter answer and there is no
 * RPC for it; that is recorded rather than quietly skipped.
 */
const DISMISSED_KEY = 'brote.mundo.domainSuggestion.';

function read(userId: string): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY + userId);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function remember(userId: string, slug: string): void {
  try {
    const next = [...new Set([...read(userId), slug])];
    localStorage.setItem(DISMISSED_KEY + userId, JSON.stringify(next));
  } catch {
    /* see `read` */
  }
}

export function DomainSuggestion({
  userId,
  tier,
  journal,
}: {
  userId: string;
  tier: number;
  journal: readonly JournalEntry[];
}) {
  const t = useTranslations('mundo.bitacora');
  const router = useRouter();
  const [dismissed, setDismissed] = useState<string[] | null>(null);
  /**
   * Answered once this visit, and that is the end of it.
   *
   * Without this, dismissing the suggestion for one completed set immediately
   * surfaces the next — which is a queue wearing a different hat. Somebody who
   * finishes three domains in one afternoon gets one nudge, and the other two
   * wait for another day.
   */
  const [answered, setAnswered] = useState(false);

  // Read once, on the client. Rendering nothing until then keeps a suggestion
  // from flashing up and vanishing for somebody who already said no.
  useEffect(() => setDismissed(read(userId)), [userId]);

  const slug = dismissed === null || answered ? null : suggestionFor(tier, journal, dismissed);

  const answer = useCallback(() => {
    if (!slug) return;
    remember(userId, slug);
    setDismissed((list) => [...(list ?? []), slug]);
    setAnswered(true);
  }, [slug, userId]);

  if (!slug) return null;
  const domain = getDomain(slug);
  if (!domain) return null;

  return (
    <div
      className="mt-4 rounded-2xl bg-brote-cream/[0.08] p-4"
      style={{ borderLeft: `3px solid ${getDomainColor(slug)}` }}
      role="status"
    >
      <p className="text-body text-brote-cream">
        {t('suggestion', { dominio: domain.name_es })}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            // Taking the suggestion is also answering it: it never comes back.
            answer();
            router.push('/acciones');
          }}
          className="rounded-pill bg-brote-green px-4 py-2 text-caption font-semibold text-white"
        >
          {t('suggestionGo')}
        </button>
        <button
          type="button"
          onClick={answer}
          className="rounded-pill px-4 py-2 text-caption font-semibold text-brote-cream/70 underline"
        >
          {t('suggestionNo')}
        </button>
      </div>
    </div>
  );
}

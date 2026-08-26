'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { localDate } from '@/lib/utils/dates';

/**
 * A quiet invitation to the feed after you have done something today (F14.9).
 *
 * The brief was "without bothering the user", so the restraint is the feature:
 *  · it only appears AFTER a completion, never on an untouched screen;
 *  · it waits a few seconds so it cannot step on the reward animation;
 *  · dismissing it silences it for the rest of the day;
 *  · it appears at most once per day even if you never dismiss it;
 *  · it sits above the nav and blocks nothing.
 */
const MESSAGES = [
  'Mientras tanto, pasaron cosas buenas en el mundo 🌎',
  '¿Viste lo que están haciendo en otros lados? 👀',
  'Hay novedades que te van a interesar 🌱',
  'Tres minutos de buenas noticias ambientales ☕',
  'Alguien más está haciendo algo parecido a lo tuyo 🤝',
  'Lo último en energía, reciclaje y bichos 🐝',
  'Historias que no salen en los diarios de siempre 📰',
  'Un invento nuevo que quizás no viste ⚡',
];

const KEY = 'brote.newsnudge.v1';

export function NewsNudge({ completionsToday }: { completionsToday: number }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]!);

  useEffect(() => {
    if (completionsToday < 1) return;
    const today = localDate();

    let seen: string | null = null;
    try {
      seen = localStorage.getItem(KEY);
    } catch {
      /* storage unavailable — behave as if not yet shown */
    }
    if (seen === today) return;

    // Rotate deterministically by date, so the message changes day to day but
    // does not flicker between renders.
    const idx = Math.abs([...today].reduce((a, c) => a + c.charCodeAt(0), 0)) % MESSAGES.length;
    setMessage(MESSAGES[idx]!);

    // Let the completion celebration finish first.
    const t = setTimeout(() => {
      setVisible(true);
      try {
        localStorage.setItem(KEY, today);
      } catch {
        /* it will simply appear again next session */
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [completionsToday]);

  /*
   * Deliberately NO entrance animation.
   *
   * Any fade-in — JS/rAF or CSS keyframes — begins at opacity 0, and an
   * animation that never progresses (throttled frame loop, backgrounded tab)
   * strands the element there. This nudge marks itself as "shown for today"
   * the moment it mounts, so a stranded animation would burn the one daily
   * appearance on something the user never saw. It is a small pill appearing
   * four seconds after an action; being reliably visible beats being pretty.
   */
  const shell =
    'pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-4';

  const inner = (
    <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-pill border border-border bg-surface/95 py-2 pl-4 pr-2 shadow-soft-lg backdrop-blur">
      <Link
        href="/feed"
        onClick={() => setVisible(false)}
        className="flex min-w-0 flex-1 items-center gap-2 text-small font-medium"
      >
        <span className="truncate">{message}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
      </Link>
      <button
        onClick={() => setVisible(false)}
        aria-label="Cerrar"
        className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (!visible) return null;
  return <div className={shell}>{inner}</div>;
}

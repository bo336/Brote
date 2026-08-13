'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Back to top, for long scrolling surfaces like the feed (F15.20).
 *
 * Appears only once there is a real distance to travel, so it never sits on a
 * short screen doing nothing. No entrance animation on purpose — an animated
 * initial state has stranded elements at opacity 0 twice in this codebase when
 * the frame loop was throttled, and a control that cannot be seen is worse
 * than one that appears abruptly.
 */
export function BackToTop({ threshold = 900 }: { threshold?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed bottom-24 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-soft-lg backdrop-blur transition-transform active:scale-95 lg:bottom-6"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * The three states that are not "playing": the connection is gone, the drawing
 * stopped, or this browser cannot draw at all.
 *
 * `20-ACCEPTANCE.md` 5D asks for all four states — loading, error, slow,
 * offline — to be tested by forcing each. Loading and slow live in
 * `LoadingState`; these are the other two, plus the one the spec names
 * separately: **`webglcontextlost` handled with one restore attempt before
 * falling back**.
 *
 * None of them is a dead end. Offline is a line that says the work is safe;
 * a lost context tries again once and then says where the island still is.
 */
export type WorldState = 'ok' | 'offline' | 'lost' | 'unsupported';

/**
 * Watch the connection and the drawing context.
 *
 * The restore attempt is **once**. A context that dies twice in a session is a
 * device that is out of memory, and retrying forever turns a recoverable
 * stumble into a battery drain with a black screen.
 */
export function useWorldState(canvas: HTMLCanvasElement | null): WorldState {
  const [state, setState] = useState<WorldState>('ok');
  const restored = useRef(false);

  useEffect(() => {
    const online = () => setState((s) => (s === 'offline' ? 'ok' : s));
    const offline = () => setState((s) => (s === 'ok' ? 'offline' : s));
    if (typeof navigator !== 'undefined' && !navigator.onLine) setState('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;
    const onLost = (e: Event) => {
      // Without `preventDefault` the browser will not fire `restored` at all.
      e.preventDefault();
      setState('lost');
    };
    const onRestored = () => {
      restored.current = true;
      setState('ok');
    };
    canvas.addEventListener('webglcontextlost', onLost as EventListener);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost as EventListener);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [canvas]);

  useEffect(() => {
    if (state !== 'lost') return;
    // One attempt. If it has already been restored once this session, the
    // device is telling us something and the answer is the poster, not a loop.
    if (restored.current) {
      setState('unsupported');
      return;
    }
    const id = setTimeout(() => {
      setState((s) => (s === 'lost' ? 'unsupported' : s));
    }, RESTORE_GRACE_MS);
    return () => clearTimeout(id);
  }, [state]);

  return state;
}

/** How long to wait for the browser to hand the context back. OURS. */
const RESTORE_GRACE_MS = 4000;

export function WorldStates({ state }: { state: WorldState }) {
  const t = useTranslations('mundo');
  if (state === 'ok') return null;

  // Offline is a strip, not a screen: the world keeps working, the outbox keeps
  // the writes, and interrupting play to say so would be the actual problem.
  if (state === 'offline') {
    return (
      <p
        className="pointer-events-none absolute inset-x-0 top-16 mx-auto w-fit max-w-[85%] rounded-pill bg-brote-ink/80 px-4 py-2 text-center text-caption text-brote-cream backdrop-blur-sm"
        role="status"
      >
        {t('offline')}
      </p>
    );
  }

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 bg-brote-ink/95 px-8 text-center"
      role="alert"
    >
      <p className="text-body text-brote-cream">
        {state === 'lost' ? t('error.lost') : t('error.webgl')}
      </p>
    </div>
  );
}

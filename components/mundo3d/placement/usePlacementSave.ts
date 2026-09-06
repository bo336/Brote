'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { PLACEMENT } from '@/lib/world/config';
import type { Placement } from '@/lib/world/types';

/**
 * Saving an arrangement, without ever making somebody wait for the network.
 *
 * Three rules, and the third is the one that matters:
 *
 *  1. **Optimistic.** The local arrangement is the truth on screen the instant
 *     a prop lands. The write follows.
 *  2. **Debounced.** Dragging a bench around for thirty seconds is one save,
 *     not fifty.
 *  3. **It survives a dropped connection.** A failed write is kept and retried,
 *     so closing a tunnel does not cost an afternoon of arranging.
 *
 * **On `localStorage`.** `01-RULES.md` forbids it for authoritative state, and
 * this does not break that: the server is the authority and always wins on
 * load. What is stored here is an *outbox* — a write that has not landed yet.
 * The alternative is losing it, and a queue that empties on the next successful
 * save is not a second source of truth.
 */
const OUTBOX_PREFIX = 'brote.mundo.outbox.';

export type SaveState = 'idle' | 'saving' | 'queued' | 'error';

interface Outbox {
  placements: Placement[];
  at: number;
}

function read(userId: string): Outbox | null {
  try {
    const raw = localStorage.getItem(OUTBOX_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Outbox;
    return Array.isArray(parsed.placements) ? parsed : null;
  } catch {
    // A private window, cleared site data, or storage the browser refuses to
    // hand over. Losing the outbox is survivable; throwing here is not.
    return null;
  }
}

function write(userId: string, outbox: Outbox | null): void {
  try {
    if (outbox) localStorage.setItem(OUTBOX_PREFIX + userId, JSON.stringify(outbox));
    else localStorage.removeItem(OUTBOX_PREFIX + userId);
  } catch {
    /* see `read` */
  }
}

export function usePlacementSave({
  userId,
  readOnly,
  onRejected,
}: {
  userId: string;
  /**
   * The bootstrap failed, so the arrangement on screen is a default and not
   * theirs. **Nothing may be written.** An empty list from a failed read looks
   * exactly like an island somebody cleared on purpose.
   */
  readOnly: boolean;
  onRejected?: (reason: string) => void;
}) {
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Placement[] | null>(null);

  const flush = useCallback(async () => {
    const batch = pending.current;
    if (!batch || readOnly) return;
    setState('saving');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('world_save_placements', {
        p_placements: batch,
      });
      if (error) throw error;
      const result = data as { ok?: boolean; reason?: string } | null;
      if (result && result.ok === false) {
        // The server refused on its own terms. Retrying will not help, so the
        // outbox is cleared and the caller is told why.
        pending.current = null;
        write(userId, null);
        setState('error');
        onRejected?.(result.reason ?? 'rejected');
        return;
      }
      pending.current = null;
      write(userId, null);
      setState('idle');
    } catch {
      // The network, not the rules. Keep it and try again later.
      write(userId, { placements: batch, at: Date.now() });
      setState('queued');
    }
  }, [userId, readOnly, onRejected]);

  /** Queue an arrangement. Cheap to call on every change. */
  const save = useCallback(
    (placements: Placement[]) => {
      if (readOnly) return;
      pending.current = placements;
      setState('queued');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), PLACEMENT.autosaveDebounceMs);
    },
    [flush, readOnly],
  );

  /** On mount, and whenever the connection comes back, drain what is waiting. */
  useEffect(() => {
    if (readOnly) return;
    const queued = read(userId);
    if (queued) {
      pending.current = queued.placements;
      setState('queued');
      void flush();
    }
    const onOnline = () => {
      if (pending.current) void flush();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [userId, readOnly, flush]);

  /** A pending write is flushed on the way out rather than dropped. */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current && !readOnly) void flush();
    },
    [flush, readOnly],
  );

  return { save, state };
}

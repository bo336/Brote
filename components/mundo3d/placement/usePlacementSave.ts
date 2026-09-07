'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { PLACEMENT } from '@/lib/world/config';
import {
  decide, readOutbox, writeOutbox,
  type Outbox, type OutboxStore, type SaveOutcome, type SaveState,
} from '@/lib/world/outbox';
import type { Placement } from '@/lib/world/types';

export type { SaveState };

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
/**
 * The browser's own storage, or nothing.
 *
 * Server-rendered or not, `localStorage` may simply not be there. The outbox
 * degrades to holding the batch in memory for this session, which is still
 * better than dropping it the moment a save fails.
 */
const browserStore: OutboxStore | null =
  typeof localStorage === 'undefined' ? null : localStorage;

const read = (userId: string) => (browserStore ? readOutbox(browserStore, userId) : null);
const write = (userId: string, outbox: Outbox | null) => {
  if (browserStore) writeOutbox(browserStore, userId, outbox);
};

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

  /**
   * Apply what `lib/world/outbox.ts` decided. The rule that matters is that a
   * batch the server *refused* is dropped while one that never *reached* it is
   * kept — see there for why conflating the two turns a queue into a loop.
   */
  const settle = useCallback(
    (outcome: SaveOutcome, batch: Placement[]) => {
      const next = decide(outcome);
      pending.current = next.keep ? batch : null;
      write(userId, next.keep ? { placements: batch, at: Date.now() } : null);
      setState(next.state);
      if (next.reason) onRejected?.(next.reason);
    },
    [userId, onRejected],
  );

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
      settle(
        result && result.ok === false
          ? { kind: 'rejected', reason: result.reason ?? 'rejected' }
          : { kind: 'saved' },
        batch,
      );
    } catch {
      // The network, not the rules. `decide` is what keeps this one.
      settle({ kind: 'offline' }, batch);
    }
  }, [readOnly, settle]);

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

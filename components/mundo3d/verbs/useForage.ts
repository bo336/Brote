'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { forageRipe } from '@/lib/world/growth';
import { usePlayerStore } from '../state/usePlayerStore';
// The count comes from where the nodes are actually placed, not a second copy.
import { FORAGE_NODES } from './register';

/**
 * Which foraging nodes are carrying something, and what happens when one is
 * picked.
 *
 * "The appointment loop: one real action, two app opens" (`11-GAME-LOOP.md`
 * §3.5). A node empties when it is picked and comes back on its own 4-8 hour
 * timer, staggered against the others, so there is usually something out there
 * and never everything at once.
 *
 * **Ripeness is derived, not stored** — see `lib/world/growth.ts` for why, and
 * for what protects the economy instead (`world_daily_chore` caps foraging at
 * eight a day and writes every award to the ledger).
 */
const PICKED_KEY = 'brote.mundo.forage.';

/** What this browser has picked and not yet seen come back. */
function readPicked(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(PICKED_KEY + userId);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writePicked(userId: string, picked: Record<string, number>): void {
  try {
    localStorage.setItem(PICKED_KEY + userId, JSON.stringify(picked));
  } catch {
    /* see `readPicked` */
  }
}

export function useForage({
  userId,
  seed,
  readOnly,
}: {
  userId: string;
  /** The island's seed: two islands ripen on different clocks. */
  seed: number;
  readOnly: boolean;
}): { empty: ReadonlySet<string>; pick: (nodeId: string) => void } {
  const setSemillas = usePlayerStore((s) => s.setSemillas);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const inFlight = useRef(false);

  useEffect(() => setPicked(readPicked(userId)), [userId]);

  /**
   * Empty nodes: the ones the clock says are between cycles, plus the ones
   * picked here whose cycle has not turned over yet.
   *
   * Recomputed when something is picked rather than on a timer. A node coming
   * back four hours later is not something anyone is watching for, and a
   * `setInterval` over six nodes to catch it would be a frame's work an hour
   * for a change nobody sees happen.
   */
  const empty = useMemo(() => {
    const now = Date.now();
    const out = new Set<string>();
    for (const [id, at] of Object.entries(picked)) {
      // Ripe again since it was picked? Then it is not empty any more.
      if (forageRipe(id, seed, now) && !forageRipe(id, seed, at)) continue;
      out.add(id);
    }
    return out;
  }, [picked, seed]);

  const pick = useCallback(
    (nodeId: string) => {
      /**
       * **The bush empties whether or not anything can be written.** This used to
       * return before touching the node on a read-only island, so a picked bush
       * stayed ripe, kept offering itself, and the objective card pointed at it
       * forever. Emptying a node is world state, not currency: only the award
       * below needs the server.
       */
      if (inFlight.current) return;
      const next = { ...(readOnly ? picked : readPicked(userId)), [nodeId]: Date.now() };
      if (!readOnly) writePicked(userId, next);
      setPicked(next);
      if (readOnly) return;
      inFlight.current = true;

      void (async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.rpc('world_daily_chore', { p_kind: 'forage' });
          if (error) return;
          const reply = data as { ok?: boolean; semillas?: number } | null;
          // The daily cap refusing is not a failure worth a message: the node
          // is still picked, it simply does not pay a ninth time today.
          if (reply?.ok && typeof reply.semillas === 'number') setSemillas(reply.semillas);
        } catch {
          /* one node's semillas, lost to a dropped connection. */
        } finally {
          inFlight.current = false;
        }
      })();
    },
    [userId, readOnly, setSemillas, picked],
  );

  /** Nodes the clock has emptied, whether or not this browser picked them. */
  const allEmpty = useMemo(() => {
    const now = Date.now();
    const out = new Set(empty);
    for (let i = 0; i < FORAGE_NODES; i++) {
      const id = `forage-${i}`;
      if (!forageRipe(id, seed, now)) out.add(id);
    }
    return out;
  }, [empty, seed]);

  return { empty: allEmpty, pick };
}

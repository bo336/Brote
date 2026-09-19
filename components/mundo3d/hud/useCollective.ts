'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * The collective counter — what everybody's real actions add up to.
 *
 * `13-IMPACT-MIRROR.md`: one line at El Mojón saying what the whole community
 * has saved, alongside what this player has. It is **not a leaderboard**: there
 * is no ranking, no comparison to anybody, and no name attached to any figure.
 * It is the only place the game says "you are not doing this alone", and it
 * says it with an aggregate.
 *
 * Fetched once, on load, and never during play — `world_collective_impact`
 * refreshes itself at most hourly server-side, so a second call would return
 * the same row.
 */
export function useCollective(readOnly: boolean): number {
  const [waterL, setWaterL] = useState(0);

  useEffect(() => {
    if (readOnly) return;
    let alive = true;
    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('world_collective_impact');
        if (error || !alive) return;
        const row = data as { water_l?: number } | null;
        if (typeof row?.water_l === 'number') setWaterL(Math.max(0, row.water_l));
      } catch {
        // No counter is better than a wrong counter: El Mojón simply omits the
        // collective line when this stays zero.
      }
    })();
    return () => {
      alive = false;
    };
  }, [readOnly]);

  return waterL;
}

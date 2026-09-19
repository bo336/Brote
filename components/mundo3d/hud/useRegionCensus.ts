'use client';

import { useEffect, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { RegionPage } from '@/lib/world/journal';

/**
 * Claiming the cosmetic a completed region census pays (`11-GAME-LOOP.md` §3.3).
 *
 * The client knows a region is complete because it draws the Bitácora — but
 * knowing is not claiming. `world_region_census` counts it again against
 * `world_species` and `world_journal` and hands over nothing if the count does
 * not hold. This only tells the server which region to look at.
 *
 * Idempotent on both sides: the RPC is `on conflict do nothing`, and this asks
 * once per region per session. Nothing here shows a reward — the cosmetic
 * appears in Pip's wardrobe, where cosmetics live, rather than as a popup over
 * a page somebody is reading.
 */
export function useRegionCensus({
  pages,
  open,
  readOnly,
}: {
  pages: readonly RegionPage[];
  /** Only while the Bitácora is up: this is not something to do in the background. */
  open: boolean;
  readOnly: boolean;
}): void {
  const claimed = useRef(new Set<string>());

  useEffect(() => {
    if (!open || readOnly) return;
    const fresh = pages.filter((p) => p.complete && !claimed.current.has(p.region));
    if (fresh.length === 0) return;
    for (const page of fresh) claimed.current.add(page.region);

    void (async () => {
      try {
        const supabase = createClient();
        // One at a time rather than in parallel: this is a reward nobody is
        // waiting on, and four simultaneous writes to the same table for the
        // same user is a lock contest for no reason.
        for (const page of fresh) {
          await supabase.rpc('world_region_census', { p_region: page.region });
        }
      } catch {
        // A dropped connection costs nothing: the region stays complete, and
        // the next time the Bitácora opens it asks again.
        for (const page of fresh) claimed.current.delete(page.region);
      }
    })();
  }, [pages, open, readOnly]);
}

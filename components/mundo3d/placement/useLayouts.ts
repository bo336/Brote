'use client';

import { useCallback, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { LAYOUTS } from '@/lib/world/config';
import { firstFreeSlot, loadable, slotName, slots } from '@/lib/world/layouts';
import type { Placement, RegionId, WorldLayout } from '@/lib/world/types';

/**
 * The saved arrangements, and the two things a player can do with them.
 *
 * Optimistic, like the autosave next door: the slot fills the moment they tap
 * it. `world_save_layout` validates the whole arrangement again and enforces
 * the plan's cap, and if it refuses, the slot quietly empties again — **no
 * message**. A full row of slots is the explanation; a modal saying "no podés
 * guardar más" in the middle of arranging an island is not.
 */
export function useLayouts({
  initial,
  readOnly,
}: {
  initial: readonly WorldLayout[];
  readOnly: boolean;
}) {
  const [saved, setSaved] = useState<WorldLayout[]>(() => [...initial]);
  /** One write at a time, so two fast taps cannot interleave into one slot. */
  const busy = useRef(false);

  const row = slots(saved, LAYOUTS.freeSlots);

  const save = useCallback(
    async (placements: readonly Placement[], slot?: number) => {
      if (readOnly || busy.current) return;
      const index = slot ?? firstFreeSlot(saved, LAYOUTS.freeSlots);
      if (index < 0) return;
      busy.current = true;

      const name = slotName(index);
      const next: WorldLayout = { name, placements: [...placements] };
      setSaved((list) => [...list.filter((l) => l.name !== name), next]);

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('world_save_layout', {
          p_name: name,
          p_placements: next.placements,
        });
        const ok = !error && (data as { ok?: boolean } | null)?.ok !== false;
        // Put the slot back the way it was. The server is the authority on the
        // cap and on whether an arrangement is legal.
        if (!ok) setSaved((list) => list.filter((l) => l.name !== name));
      } catch {
        setSaved((list) => list.filter((l) => l.name !== name));
      } finally {
        busy.current = false;
      }
    },
    [readOnly, saved],
  );

  /**
   * What loading a slot would put down. Returns null for an empty slot, so the
   * caller can tell "nothing saved here" from "saved, but nothing survived".
   */
  const load = useCallback(
    (
      slot: number,
      ctx: {
        tier: number;
        owned: readonly string[];
        regionAt: (x: number, z: number) => RegionId;
        isGround?: (x: number, z: number) => boolean;
      },
    ): Placement[] | null => {
      const layout = row[slot];
      return layout ? loadable(layout, ctx) : null;
    },
    [row],
  );

  return { row, save, load };
}

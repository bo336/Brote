'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { choreSpotsFor, type ChoreSpot } from '@/lib/world/chore-spots';
import { WATER_LEVEL } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { Placement, RegionId, WorldDailyState } from '@/lib/world/types';
import { PRIORITY, registerInteractable } from '../interaction/InteractableRegistry';
import { usePlayerStore } from '../state/usePlayerStore';

/**
 * The day's three chores, as places in the world.
 *
 * "The backbone of the 90-second session" (`11-GAME-LOOP.md` §3.4): three
 * rotating jobs from a pool of ten, drawn deterministically so the same player
 * sees the same three all day on every device.
 *
 * They are **interactables, not a quest list** — you walk past one and the
 * ordinary action button offers it. `world_daily_chore` is what pays, caps the
 * day at three, and writes the ledger row; nothing here decides an award.
 */
/**
 * Where somebody actually stands to do a chore.
 *
 * The terrain under a bridge is the riverbed — sampling it put "ajustar la soga
 * del puente" a metre and a half below the surface, with its cue glowing
 * underwater. You do that chore standing on the deck, and the deck is above the
 * water like every other walkable surface over it.
 */
function standingHeight(heightfield: Heightfield, x: number, z: number): number {
  return Math.max(sampleHeight(heightfield, x, z), WATER_LEVEL);
}

export function useChores({
  layout,
  heightfield,
  userId,
  localDate,
  unlockedRegions,
  placements,
  daily,
  readOnly,
  isGround,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  userId: string;
  /** The BA-local date from the server. Never derived on the client. */
  localDate: string;
  unlockedRegions: readonly RegionId[];
  placements: readonly Placement[];
  daily: WorldDailyState;
  readOnly: boolean;
  /** The renderer's own "can somebody stand here" test. */
  isGround?: (x: number, z: number) => boolean;
}): ChoreSpot[] {
  const setSemillas = usePlayerStore((s) => s.setSemillas);
  /**
   * Done this session, on top of whatever the server had already counted.
   *
   * Optimistic: the chore greys out the moment it is done rather than after a
   * round trip. The server still owns the cap — a fourth chore is refused
   * there, and refused quietly.
   */
  const [doneHere, setDoneHere] = useState(0);
  const inFlight = useRef(false);

  const spots = useMemo(() => {
    if (!layout || !heightfield) return [];
    return choreSpotsFor({
      userId,
      localDate,
      unlockedRegions,
      placements,
      choresDone: daily.chores_done + doneHere,
      anchors: layout.anchors,
      isGround,
    });
  }, [layout, heightfield, userId, localDate, unlockedRegions, placements, daily.chores_done, doneHere, isGround]);

  const complete = useCallback(
    (spot: ChoreSpot) => {
      if (spot.done || readOnly || inFlight.current) return;
      inFlight.current = true;
      setDoneHere((n) => n + 1);
      void (async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.rpc('world_daily_chore', { p_kind: 'chore' });
          if (error) return;
          const reply = data as { ok?: boolean; semillas?: number } | null;
          // A refusal is the cap, and the cap is not a failure worth a message:
          // the chore simply does not pay twice.
          if (reply?.ok && typeof reply.semillas === 'number') setSemillas(reply.semillas);
        } catch {
          // A dropped connection costs one chore's semillas. It is five of
          // them, not an afternoon of arranging, so there is no outbox here.
        } finally {
          inFlight.current = false;
        }
      })();
    },
    [readOnly, setSemillas],
  );

  useEffect(() => {
    if (!heightfield) return;
    const dispose = spots.map((spot) =>
      registerInteractable({
        id: `chore-${spot.id}`,
        position: [spot.x, standingHeight(heightfield, spot.x, spot.z), spot.z],
        radius: spot.radius,
        labelKey: spot.def.nameKey,
        priority: PRIORITY.chore,
        // A finished chore stays in the world and stops offering itself. Seeing
        // what you already did is a small win; being asked again is a nag.
        enabled: !spot.done,
        onInteract: () => complete(spot),
      }),
    );
    return () => dispose.forEach((fn) => fn());
  }, [spots, heightfield, complete]);

  return spots;
}

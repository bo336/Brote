'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { choreSpotsFor, type ChoreSpot } from '@/lib/world/chore-spots';
import { SEMILLAS, WATER_LEVEL } from '@/lib/world/config';
import { deckTopAt, decksFor, type Deck } from '@/lib/world/decks';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { FxKind } from '@/lib/render/fx';
import type { IslandLayout } from '@/lib/world/layout';
import type { ChoreId, Placement, RegionId, WorldDailyState } from '@/lib/world/types';
import { PRIORITY, registerInteractable } from '../interaction/InteractableRegistry';
import { celebrate } from '../state/feedback';
import { usePlayerStore } from '../state/usePlayerStore';

/** What each chore throws into the air when it is done. */
const CHORE_FX: Partial<Record<ChoreId, FxKind>> = {
  regar_canteros: 'water',
  limpiar_orilla: 'water',
  podar_seco: 'leaves',
  juntar_ramas: 'leaves',
  dar_vuelta_compost: 'leaves',
  llenar_comedero: 'berries',
  colgar_farol: 'stars',
  barrer_sendero: 'dust',
  ajustar_puente: 'dust',
  guiar_bicho: 'sparkle',
};

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
function standingHeight(heightfield: Heightfield, layout: IslandLayout | null, x: number, z: number): number {
  let decks = layout ? deckCache.get(layout) : undefined;
  if (layout && !decks) {
    decks = decksFor(layout, heightfield);
    deckCache.set(layout, decks);
  }
  return (decks ? deckTopAt(decks, x, z) : null) ?? Math.max(sampleHeight(heightfield, x, z), WATER_LEVEL);
}

/** The bridge's deck, per island: the same floor the movement solver stands Pip on. */
const deckCache = new WeakMap<IslandLayout, Deck[]>();

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
   * **Which** chores were done this session, on top of the server's count.
   *
   * It was a count, added to the server's, and the server's count marks the
   * *first* N of the day's list as done — so finishing the third chore greyed
   * out the first and left the one you just did still asking to be done.
   */
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set());
  const inFlight = useRef(false);

  const spots = useMemo(() => {
    if (!layout || !heightfield) return [];
    return choreSpotsFor({
      userId,
      localDate,
      unlockedRegions,
      placements,
      choresDone: daily.chores_done,
      anchors: layout.anchors,
      isGround,
    }).map((s) => (doneIds.has(s.id) ? { ...s, done: true } : s));
  }, [layout, heightfield, userId, localDate, unlockedRegions, placements, daily.chores_done, doneIds, isGround]);

  const complete = useCallback(
    (spot: ChoreSpot) => {
      if (spot.done || doneIds.has(spot.id)) return;
      setDoneIds((prev) => new Set(prev).add(spot.id));
      // Seen and heard first, paid second: the world answers even offline, and
      // even on a read-only island, where the preview is how the loop is judged.
      celebrate({
        titleKey: 'reward.chore',
        thingKey: spot.def.nameKey,
        semillas: SEMILLAS.chore,
        fx: CHORE_FX[spot.id] ?? 'sparkle',
        at: [spot.x, heightfield ? standingHeight(heightfield, layout, spot.x, spot.z) : 0, spot.z],
      });
      if (readOnly || inFlight.current) return;
      inFlight.current = true;
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
    [readOnly, setSemillas, doneIds, heightfield, layout],
  );

  useEffect(() => {
    if (!heightfield) return;
    const dispose = spots.map((spot) =>
      registerInteractable({
        id: `chore-${spot.id}`,
        position: [spot.x, standingHeight(heightfield, layout, spot.x, spot.z), spot.z],
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
  }, [spots, heightfield, layout, complete]);

  return spots;
}

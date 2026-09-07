'use client';

import { useEffect, useMemo, useRef } from 'react';

import { forageRipe, maturation } from '@/lib/world/growth';
import { returnLine, returnLineKey } from '@/lib/world/returns';
import { isPlantable, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { RawMarker } from '@/lib/world/markers';
import type { Placement, ProjectMarker, WorldConfig, WorldDailyState } from '@/lib/world/types';
import { useProjectMarkers } from '../interaction/useProjectMarkers';
import { useThingNotes } from '../interaction/useThingNotes';
import { FORAGE_NODES } from '../verbs/register';
import { useChores } from '../verbs/useChores';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Everything on the island you can walk up to, and the line it greets you with.
 *
 * `World` is the scene graph and the frame loop. This is the other half of what
 * makes the place inhabited: the day's chores, the description on every prop
 * and structure, the stone for every real project, and the one sentence the
 * island says when you arrive. Four systems, one lifetime, one place to look.
 */
export function useIslandLife({
  layout,
  heightfield,
  config,
  userId,
  localDate,
  placements,
  daily,
  readOnly,
  createdAt,
  liveliness,
  projectMarkers,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  config: WorldConfig;
  userId: string;
  localDate: string;
  placements: readonly Placement[];
  daily: WorldDailyState;
  readOnly: boolean;
  createdAt: number;
  liveliness: number;
  projectMarkers: readonly RawMarker[];
}): ProjectMarker[] {
  const setNote = useSessionStore((s) => s.setNote);

  /** The same test the scatter plants with, so a thing lands where grass does. */
  const isGround = useMemo(
    () => (layout ? (x: number, z: number) => isPlantable(x, z, layout.terrain) : undefined),
    [layout],
  );

  /**
   * The day's three chores, as places you walk past (`11-GAME-LOOP.md` §3.4).
   * The date comes from the same timezone helper every other daily surface in
   * the app uses, so the client and `world_daily_chore` agree on what "today"
   * is without a second definition.
   */
  useChores({
    layout,
    heightfield,
    userId,
    localDate,
    unlockedRegions: config.regions,
    // The server-known arrangement, not the editor's live one: a chore sits at
    // a prop that is actually down, never at one mid-drag.
    placements,
    daily,
    readOnly,
    isGround,
  });

  // A stone for every real project they went to — the one thing the island
  // remembers that did not happen on the island.
  const placedMarkers = useProjectMarkers({ layout, heightfield, markers: projectMarkers, isGround });

  // Every prop and every structure, readable. The density rule.
  useThingNotes({ layout, heightfield, placements });

  /**
   * Is anything out there to pick right now?
   *
   * Asked of the same clock the nodes answer to rather than of the hook that
   * owns them: the greeting needs the fact, not the state.
   */
  const forageRipeNow = useMemo(() => {
    if (!layout || !config.verbs.includes('forage')) return false;
    const now = Date.now();
    for (let i = 0; i < FORAGE_NODES; i++) {
      if (forageRipe(`forage-${i}`, layout.seed, now)) return true;
    }
    return false;
  }, [layout, config.verbs]);

  /**
   * The line the island greets you with (`14-CONTENT.md` §Return).
   *
   * Once, on arrival, in the same self-clearing slot everything else uses. It
   * doubles as the answer to the 90-second session test — "something new is
   * visible within 5 seconds of entering" — and it is only ever something that
   * is actually true, because a game whose premise is that the world reflects
   * something real cannot afford small lies about the world.
   */
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current || !layout || !heightfield) return;
    greeted.current = true;
    setNote(returnLineKey(returnLine({
      ripeForage: forageRipeNow,
      matured: maturation(createdAt, Date.now()),
      liveliness,
      hasRiver: config.features.includes('river'),
    })));
  }, [layout, heightfield, forageRipeNow, createdAt, liveliness, config.features, setNote]);

  return placedMarkers;
}

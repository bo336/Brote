'use client';

import { useEffect, useMemo, useRef } from 'react';

import { placeableProps } from '@/lib/world/placement';
import type { IslandLayout } from '@/lib/world/layout';
import type { Placement, PropId, WorldConfig } from '@/lib/world/types';
import { makeGroundTest } from './PlacementMode';
import { usePlacementEditor, type Ghost } from './usePlacementEditor';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The wire between the editor, which lives inside the canvas, and the bar,
 * which lives outside it.
 *
 * They meet through a **summary** in the session store rather than the editor
 * itself: the ghost is replaced on every pointer move, and handing that object
 * to a React tree outside the canvas would re-render the HUD sixty times a
 * second to change nothing on screen. Four booleans and a number make the trip;
 * the ghost stays here.
 */
export interface PlacementBridge {
  ghost: Ghost | null;
  placements: Placement[];
  editing: boolean;
  moveGhost: (x: number, z: number) => void;
  /** Handed to `PlacementMode`, which knows where "in front of Pip" is. */
  setPlaceInFront: (fn: (slug: PropId) => { x: number; z: number }) => void;
}

export function usePlacementBridge({
  layout,
  config,
  ownedCosmetics,
  placements,
  onPlacementsChanged,
}: {
  layout: IslandLayout | null;
  config: WorldConfig;
  ownedCosmetics: readonly string[];
  placements: readonly Placement[];
  onPlacementsChanged?: (placements: Placement[]) => void;
}): PlacementBridge {
  const isGround = useMemo(() => (layout ? makeGroundTest(layout) : undefined), [layout]);
  const editor = usePlacementEditor({
    layout,
    tier: config.tier,
    owned: ownedCosmetics,
    initial: placements,
    isGround,
  });

  const placeInFront = useRef<((slug: PropId) => { x: number; z: number }) | null>(null);
  const setPlacement = useSessionStore((s) => s.setPlacement);
  const setPlacementActions = useSessionStore((s) => s.setPlacementActions);
  const editing = useSessionStore((s) => s.hud) === 'placement';

  const tray = useMemo(
    () => placeableProps(ownedCosmetics, config.props),
    [ownedCosmetics, config.props],
  );

  useEffect(() => {
    setPlacement({
      hasGhost: editor.ghost !== null,
      rejected: editor.ghost?.rejection != null,
      remaining: editor.remaining,
      canUndo: editor.canUndo,
      props: tray,
    });
  }, [setPlacement, editor.ghost, editor.remaining, editor.canUndo, tray]);

  useEffect(() => {
    setPlacementActions({
      pick: (slug) => {
        const at = placeInFront.current?.(slug) ?? { x: 0, z: 0 };
        editor.begin(slug, at.x, at.z);
        editor.moveGhost(at.x, at.z);
      },
      rotate: () => editor.rotate(1),
      commit: () => editor.commit(),
      cancel: () => editor.cancel(),
      undo: () => editor.undo(),
    });
    return () => setPlacementActions(null);
  }, [setPlacementActions, editor]);

  // The arrangement is reported up whenever it settles, never mid-drag: the
  // ghost is not part of it until it is put down.
  const committed = editor.placements;
  useEffect(() => {
    if (!editing) return;
    onPlacementsChanged?.(committed);
  }, [committed, editing, onPlacementsChanged]);

  return {
    ghost: editor.ghost,
    placements: committed,
    editing,
    moveGhost: editor.moveGhost,
    setPlaceInFront: (fn) => {
      placeInFront.current = fn;
    },
  };
}

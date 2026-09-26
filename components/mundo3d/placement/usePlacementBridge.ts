'use client';

import { useEffect, useMemo, useRef } from 'react';

import { PROP_SPECS } from '@/lib/render/geometry/props';
import { isPlaceable } from '@/lib/world/game/shop';
import { placeableProps } from '@/lib/world/placement';
import { regionAt } from '@/lib/world/layout';
import type { IslandLayout } from '@/lib/world/layout';
import type { Placement, PropId, WorldConfig, WorldLayout } from '@/lib/world/types';
import { makeGroundTest } from './PlacementMode';
import { useLayouts } from './useLayouts';
import { usePlacementEditor, type Ghost } from './usePlacementEditor';
import { useSessionStore } from '../state/useSessionStore';
import { useGameStore } from '../game/useGameStore';

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
  /** Lift one that is already down. Moving a bench is not delete-and-place. */
  pickUp: (index: number) => void;
  /** Handed to `PlacementMode`, which knows where "in front of Pip" is. */
  setPlaceInFront: (fn: (slug: PropId) => { x: number; z: number }) => void;
}

const NO_LAYOUTS: readonly WorldLayout[] = [];

export function usePlacementBridge({
  layout,
  config,
  ownedCosmetics,
  placements,
  savedLayouts = NO_LAYOUTS,
  readOnly = false,
  onPlacementsChanged,
}: {
  layout: IslandLayout | null;
  config: WorldConfig;
  ownedCosmetics: readonly string[];
  placements: readonly Placement[];
  /** The saved arrangements from `world_bootstrap`. */
  savedLayouts?: readonly WorldLayout[];
  /** The bootstrap failed; the island on screen is a default. Never write. */
  readOnly?: boolean;
  onPlacementsChanged?: (placements: Placement[]) => void;
}): PlacementBridge {
  const layouts = useLayouts({ initial: savedLayouts, readOnly });
  const isGround = useMemo(() => (layout ? makeGroundTest(layout) : undefined), [layout]);

  /**
   * What can be put down: the old cosmetics from the app (as many as you like,
   * as before) and what the world's shop sold, as many as were bought. The
   * game's inventory is the count; the server checks the same (0115).
   */
  const inv = useGameStore((s) => s.state?.inv);
  const { owned, limits } = useMemo(() => {
    const lim: Record<string, number> = {};
    for (const [slug, n] of Object.entries(inv ?? {})) {
      if (n > 0 && isPlaceable(slug) && PROP_SPECS[slug]) lim[slug] = n;
    }
    for (const slug of ownedCosmetics) delete lim[slug];
    return { owned: [...new Set([...ownedCosmetics, ...Object.keys(lim)])], limits: lim };
  }, [inv, ownedCosmetics]);

  const editor = usePlacementEditor({
    layout,
    tier: config.tier,
    owned,
    limits,
    initial: placements,
    isGround,
  });

  const placeInFront = useRef<((slug: PropId) => { x: number; z: number }) | null>(null);
  const setPlacement = useSessionStore((s) => s.setPlacement);
  const setPlacementActions = useSessionStore((s) => s.setPlacementActions);
  const editing = useSessionStore((s) => s.hud) === 'placement';

  const left = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [slug, n] of Object.entries(limits)) {
      out[slug] = n - editor.placements.filter((p) => p.prop_slug === slug).length;
    }
    return out;
  }, [limits, editor.placements]);
  const tray = useMemo(
    () => [
      ...placeableProps(ownedCosmetics, config.props),
      ...Object.keys(left).filter((slug) => (left[slug] ?? 0) > 0),
    ],
    [ownedCosmetics, config.props, left],
  );

  /** Which slots hold something. The bar needs no more than that. */
  const filled = useMemo(() => layouts.row.map((l) => l !== null), [layouts.row]);

  useEffect(() => {
    setPlacement({
      hasGhost: editor.ghost !== null,
      rejected: editor.ghost?.rejection != null,
      remaining: editor.remaining,
      canUndo: editor.canUndo,
      props: tray,
      left,
      slots: filled,
    });
  }, [setPlacement, editor.ghost, editor.remaining, editor.canUndo, tray, left, filled]);

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
      // An empty slot saves what is on the island; a full one loads it back.
      // One tap either way, and no keyboard anywhere near the world.
      useSlot: (index) => {
        if (!layout) return;
        if (filled[index]) {
          const next = layouts.load(index, {
            tier: config.tier,
            owned,
            regionAt: (x, z) => regionAt(x, z, layout.regions),
            isGround,
          });
          if (next) editor.replaceAll(next);
          return;
        }
        void layouts.save(editor.placements, index);
      },
    });
    return () => setPlacementActions(null);
  }, [setPlacementActions, editor, layouts, filled, layout, config.tier, owned, isGround]);

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
    pickUp: editor.pickUp,
    setPlaceInFront: (fn) => {
      placeInFront.current = fn;
    },
  };
}

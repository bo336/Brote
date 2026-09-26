'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { propFootprint } from '@/lib/render/geometry';
import {
  checkPlacement, nudgeClear, regionOf, remainingSlots, snapRotation,
  type PlaceRejection,
} from '@/lib/world/placement';
import { PLACEMENT } from '@/lib/world/config';
import type { IslandLayout } from '@/lib/world/layout';
import type { Placement, PropId } from '@/lib/world/types';

/**
 * The editing model behind placement mode.
 *
 * `08-WORLD-AND-PROGRESSION.md` §8 asks for "a real editing UX: one-thumb drag,
 * confirm/cancel, undo". This is the state machine for that, kept out of the
 * component so the parts that decide anything are testable and the parts that
 * draw are not.
 *
 * **Nothing here is authoritative.** Every change is optimistic and every batch
 * goes to `world_save_placements`, which validates it again. What this does is
 * make the refusal happen before the drag ends rather than after the save.
 */
export interface Ghost {
  slug: PropId;
  x: number;
  z: number;
  rot: number;
  /** Why this spot will not take it, or null. Drives the ghost's colour. */
  rejection: PlaceRejection | null;
  /** The nudge moved it out of an overlap. */
  nudged: boolean;
}

export function usePlacementEditor({
  layout,
  tier,
  owned,
  limits,
  initial,
  isGround,
}: {
  layout: IslandLayout | null;
  tier: number;
  owned: readonly string[];
  /** Copies owned of what the world's shop sold (`checkPlacement`). */
  limits?: Readonly<Record<string, number>>;
  initial: readonly Placement[];
  /** The renderer's answer to "can something stand here". */
  isGround?: (x: number, z: number) => boolean;
}) {
  const [placements, setPlacements] = useState<Placement[]>(() => [...initial]);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  /**
   * One entry per committed change, holding the whole arrangement before it.
   *
   * A whole-array snapshot rather than a diff: arrangements are at most 37
   * items, undo has to be exactly right, and a diff would be a second model of
   * the same thing waiting to disagree with the first.
   */
  const history = useRef<Placement[][]>([]);

  const cap = remainingSlots(tier, placements.length);

  /** Everything already down, as circles, for the nudge to push against. */
  const obstacles = useMemo(
    () => placements.map((p) => ({ x: p.x, z: p.z, radius: propFootprint(p.prop_slug) })),
    [placements],
  );

  /** Pick up a prop. The ghost appears wherever the caller says. */
  const begin = useCallback((slug: PropId, x: number, z: number) => {
    setGhost({ slug, x, z, rot: 0, rejection: null, nudged: false });
  }, []);

  /**
   * Move the ghost. Called on every pointer move, so it does the cheap things:
   * a nudge against at most 37 circles and the same checks the RPC runs.
   */
  const moveGhost = useCallback(
    (x: number, z: number) => {
      setGhost((current) => {
        if (!current || !layout) return current;
        const radius = propFootprint(current.slug);
        const clear = nudgeClear(x, z, radius, obstacles);
        // Nowhere to go: hold the ghost where the finger is and let the colour
        // say no. Snapping it somewhere arbitrary would be worse than refusing.
        const at = clear ?? { x, z, moved: false };
        const region = regionOf(at.x, at.z, layout.regions);
        return {
          ...current,
          x: at.x,
          z: at.z,
          nudged: at.moved,
          rejection: checkPlacement(
            { prop_slug: current.slug, region, x: at.x, z: at.z },
            {
              tier, owned, placedCount: placements.length, isGround, limits,
              placedOf: placements.filter((p) => p.prop_slug === current.slug).length,
            },
          ),
        };
      });
    },
    [layout, obstacles, tier, owned, placements, isGround, limits],
  );

  /** One tap, one step. Free rotation would need a second thumb. */
  const rotate = useCallback((steps = 1) => {
    setGhost((current) =>
      current
        ? { ...current, rot: snapRotation(current.rot + (steps * PLACEMENT.rotationStepDeg * Math.PI) / 180) }
        : current,
    );
  }, []);

  /** Put it down. Refuses silently when the ghost is already saying no. */
  const commit = useCallback(() => {
    if (!ghost || ghost.rejection || !layout) return false;
    history.current.push(placements);
    setPlacements((list) => [
      ...list,
      {
        prop_slug: ghost.slug,
        region: regionOf(ghost.x, ghost.z, layout.regions),
        x: ghost.x,
        z: ghost.z,
        rot_y: ghost.rot,
        variant: 0,
      },
    ]);
    setGhost(null);
    return true;
  }, [ghost, layout, placements]);

  const cancel = useCallback(() => setGhost(null), []);

  /** Take one back. The ghost is dropped too — undo is about the island. */
  const undo = useCallback(() => {
    const previous = history.current.pop();
    if (!previous) return false;
    setPlacements(previous);
    setGhost(null);
    return true;
  }, []);

  /**
   * Swap the whole arrangement, for loading a saved layout.
   *
   * One history entry, not one per prop: undo after loading a layout has to
   * put back the island you had, not peel the new one off a bench at a time.
   */
  const replaceAll = useCallback(
    (next: readonly Placement[]) => {
      history.current.push(placements);
      setPlacements([...next]);
      setGhost(null);
    },
    [placements],
  );

  /** Lift one that is already down, so moving a bench is not delete-and-place. */
  const pickUp = useCallback(
    (index: number) => {
      const item = placements[index];
      if (!item) return;
      history.current.push(placements);
      setPlacements((list) => list.filter((_, i) => i !== index));
      setGhost({ slug: item.prop_slug, x: item.x, z: item.z, rot: item.rot_y, rejection: null, nudged: false });
    },
    [placements],
  );

  return {
    placements,
    ghost,
    remaining: cap,
    canUndo: history.current.length > 0,
    begin,
    moveGhost,
    rotate,
    commit,
    cancel,
    undo,
    pickUp,
    replaceAll,
  };
}

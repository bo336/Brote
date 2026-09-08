'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

import { createClient } from '@/lib/supabase/client';
import {
  hasMoved, needsFirstRun, nextBeat, plantSpot, propForChip,
  type BeatId, type CareChip,
} from '@/lib/world/onboarding';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { Placement } from '@/lib/world/types';
import { PRIORITY, registerInteractable } from '../interaction/InteractableRegistry';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The first three minutes, running.
 *
 * `11-GAME-LOOP.md` §7's beat sheet, with the four beats that happen inside the
 * world. Two rules hold the whole thing together:
 *
 *  - **Nothing is asked before something is given.** Movement, then a seed in
 *    the ground, and only then one question — whose every answer puts an object
 *    on the island immediately.
 *  - **No beat ends on a timer.** `move` ends when somebody has actually walked
 *    somewhere; `plant` ends when the seed is in. A beat that expires while you
 *    are still reading it is a beat that taught nothing.
 *
 * It is also skippable at every point, because it is a sequence of captions and
 * one button and never a modal over the world.
 */
export interface FirstRun {
  beat: BeatId | null;
  /** The tier-2 outline, drawn during the `promise` beat. */
  promiseRadius: number;
  choose: (chip: CareChip) => void;
  advance: () => void;
  skip: () => void;
}

const IDLE: FirstRun = {
  beat: null, promiseRadius: 0, choose: () => {}, advance: () => {}, skip: () => {},
};

export function useFirstRun({
  layout,
  heightfield,
  onboardedAt,
  tier,
  readOnly,
  onPlace,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  onboardedAt: number;
  tier: number;
  readOnly: boolean;
  /** Puts a prop on the island — the seed, and whatever the one question earns. */
  onPlace?: (placement: Placement) => void;
}): FirstRun {
  const wanted = !readOnly && needsFirstRun(onboardedAt, tier);
  const [beat, setBeat] = useState<BeatId | null>(wanted ? 'move' : null);
  const setNote = useSessionStore((s) => s.setNote);
  const start = useRef<{ x: number; z: number } | null>(null);

  /** Told once, at the end. Calling twice cannot move the date, but it can waste a trip. */
  const marked = useRef(false);
  const finish = useCallback(() => {
    setBeat(null);
    if (marked.current || readOnly) return;
    marked.current = true;
    void createClient().rpc('world_mark_onboarded');
  }, [readOnly]);

  const advance = useCallback(() => {
    setBeat((current) => {
      if (!current) return null;
      const next = nextBeat(current);
      if (!next) {
        finish();
        return null;
      }
      return next;
    });
  }, [finish]);

  // The caption is the beat. One line at a time, in the slot the world already
  // uses for everything it says.
  useEffect(() => {
    if (!beat) return;
    setNote(`first.${beat}`);
  }, [beat, setNote]);

  /**
   * `move` ends on distance walked from where they started, measured on the
   * ground. Cheap enough to run every frame and impossible to satisfy by
   * standing still and waiting, which is the failure mode of a timer.
   */
  useFrame(() => {
    if (beat !== 'move') return;
    if (!start.current) {
      start.current = { x: playerTransform.x, z: playerTransform.z };
      return;
    }
    const gone = Math.hypot(playerTransform.x - start.current.x, playerTransform.z - start.current.z);
    if (hasMoved(gone)) advance();
  });

  /**
   * The marked spot. A scripted interactable rather than the `plantar` verb:
   * the ladder decides which verbs somebody has, and the first session is not
   * allowed to hand out one of them early (`08-WORLD-AND-PROGRESSION.md` §3).
   */
  useEffect(() => {
    if (beat !== 'plant' || !layout || !heightfield) return;
    const [x, z] = plantSpot(layout.spawn[0], layout.spawn[1]);
    return registerInteractable({
      id: 'first-run-plant',
      position: [x, sampleHeight(heightfield, x, z), z],
      radius: 2,
      labelKey: 'first.plantAction',
      priority: PRIORITY.event,
      enabled: true,
      onInteract: () => advance(),
    });
  }, [beat, layout, heightfield, advance]);

  const choose = useCallback(
    (chip: CareChip) => {
      if (!layout) return;
      const [x, z] = plantSpot(layout.spawn[0], layout.spawn[1] + 3);
      onPlace?.({
        prop_slug: propForChip(chip),
        region: 'claro',
        x,
        z,
        rot_y: 0,
        variant: 0,
      });
      advance();
    },
    [layout, onPlace, advance],
  );

  if (!beat) return IDLE;
  return {
    beat,
    promiseRadius: beat === 'promise' ? 1 : 0,
    choose,
    advance,
    skip: finish,
  };
}

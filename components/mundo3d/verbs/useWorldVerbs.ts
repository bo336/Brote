'use client';

import { useCallback, useEffect, useMemo } from 'react';

import { INTERACT, SEMILLAS, VERB_TIMING } from '@/lib/world/config';
import { haptic } from '@/lib/utils/haptics';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { SeasonId, TimeOfDay, WorldConfig } from '@/lib/world/types';
import { registerInteractable } from '../interaction/InteractableRegistry';
import type { CharacterController } from '../control/CharacterController';
import { usePlayerStore } from '../state/usePlayerStore';
import { VerbRuntime, type VerbResult } from './runtime';
import { useVerbSpots, type VerbSpot } from './register';

/**
 * The verbs, and the one stone that is not a verb.
 *
 * Completing a verb pays **semillas and never XP** — the one-way valve is the
 * product's premise, and `no-xp.test.ts` greps this whole tree to keep it that
 * way (`11-GAME-LOOP.md` §1).
 */
export function useWorldVerbs({
  controller,
  layout,
  heightfield,
  config,
  timeOfDay,
  season,
  onAdvanceTime,
  onOpenMojon,
}: {
  controller: CharacterController | null;
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  config: WorldConfig;
  timeOfDay: TimeOfDay;
  season: SeasonId;
  onAdvanceTime?: () => void;
  onOpenMojon?: () => void;
}): VerbRuntime {
  const addSemillas = usePlayerStore((s) => s.addSemillas);
  const setVerb = usePlayerStore((s) => s.setVerb);

  const onVerbFinish = useCallback(
    (result: VerbResult) => {
      setVerb(null);
      controller?.setLocked(false);
      if (!result.success) return;
      // Sound, motion and haptic together: one alone reads as a bug (`10` §6).
      haptic(result.verb === 'fish' ? 'success' : 'medium');
      if (result.verb === 'forage') addSemillas(SEMILLAS.forageMin);
      if (result.verb === 'log') addSemillas(SEMILLAS.censusFirst);
    },
    [controller, setVerb, addSemillas],
  );

  const runtime = useMemo(() => new VerbRuntime(onVerbFinish), [onVerbFinish]);

  /**
   * Using a verb. `sail` and `rest` change how movement works rather than
   * pausing it, so they go to the controller; everything else is a timed action.
   */
  const onUseVerb = useCallback(
    (spot: VerbSpot) => {
      if (!controller) return;
      setVerb(spot.verb);
      if (spot.verb === 'sail') {
        controller.boardBoat();
        return;
      }
      if (spot.verb === 'rest') {
        // Resting advances the time of day one preset — the only control over
        // time the player has (`10-CONTROLS-AND-CAMERA.md` §3).
        controller.setLocked(true);
        window.setTimeout(() => {
          controller.setLocked(false);
          setVerb(null);
          onAdvanceTime?.();
        }, VERB_TIMING.restAdvanceS * 1000);
        return;
      }
      controller.setLocked(true);
      runtime.begin(spot.verb, spot.id);
    },
    [controller, runtime, setVerb, onAdvanceTime],
  );

  useVerbSpots(layout, heightfield, config, timeOfDay, season, onUseVerb);

  /**
   * El Mojón, the one place a number lives.
   *
   * It is not a verb — it is a stone you read — so it registers itself rather
   * than going through `buildVerbSpots`, and it carries no verb at all, which
   * is what makes it available from tier 1 with nothing to unlock.
   */
  useEffect(() => {
    if (!layout || !heightfield || !onOpenMojon) return;
    const anchor = layout.anchors.find((a) => a.feature === 'mojon');
    if (!anchor) return;
    return registerInteractable({
      id: 'mojon',
      position: [anchor.x, sampleHeight(heightfield, anchor.x, anchor.z), anchor.z],
      radius: INTERACT.defaultRadiusM,
      labelKey: 'accion.mojon',
      enabled: true,
      onInteract: onOpenMojon,
    });
  }, [layout, heightfield, onOpenMojon]);

  return runtime;
}

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { INTERACT, SEMILLAS, VERB_TIMING } from '@/lib/world/config';
import { createClient } from '@/lib/supabase/client';
import type { FxKind } from '@/lib/render/fx';
import { SPECIES_BY_SLUG } from '@/lib/world/species';
import type { VerbId } from '@/lib/world/types';
import { celebrate } from '../state/feedback';
import { useSessionStore } from '../state/useSessionStore';

/** What each verb throws into the air when it lands. */
const VERB_FX: Partial<Record<VerbId, FxKind>> = {
  plant: 'leaves', water: 'water', log: 'sparkle', forage: 'berries', fish: 'water',
  observe: 'stars', cave: 'dust', track: 'sparkle', mentor: 'stars',
};
/** What a verb shows on its card. The server pays; this only says so. */
const VERB_SEMILLAS: Partial<Record<VerbId, number>> = {
  log: SEMILLAS.censusFirst, forage: SEMILLAS.forageMin,
};
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { SeasonId, TimeOfDay, WorldConfig } from '@/lib/world/types';

import { registerInteractable } from '../interaction/InteractableRegistry';
import { useMicroFacts } from '../interaction/useMicroFacts';
import type { CharacterController } from '../control/CharacterController';
import { usePlayerStore } from '../state/usePlayerStore';
import { VerbRuntime, type VerbResult } from './runtime';
import { useVerbSpots, type VerbSpot } from './register';
import { useForage } from './useForage';

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
  readOnly = false,
  userId,
  seed,
  onAdvanceTime,
  onOpenMojon,
}: {
  controller: CharacterController | null;
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  config: WorldConfig;
  timeOfDay: TimeOfDay;
  season: SeasonId;
  /** The bootstrap failed and this island is a default. Nothing may write. */
  readOnly?: boolean;
  /** Whose island, and which one — foraging timers are per island. */
  userId: string;
  seed: number;
  onAdvanceTime?: () => void;
  onOpenMojon?: () => void;
}): VerbRuntime {
  const setSemillas = usePlayerStore((s) => s.setSemillas);
  const setVerb = usePlayerStore((s) => s.setVerb);

  /**
   * The spot the verb in flight belongs to.
   *
   * `VerbResult` carries only a target id, and filing a sighting needs the
   * species, the region and the time of day. A ref rather than state: it is
   * written on the way into a verb and read on the way out, and nothing
   * renders from it.
   */
  const inFlight = useRef<VerbSpot | null>(null);

  /** One sentence, in world space, at most a tenth of the session. */
  const facts = useMicroFacts();

  const onVerbFinish = useCallback(
    (result: VerbResult) => {
      const spot = inFlight.current;
      inFlight.current = null;
      setVerb(null);
      controller?.setLocked(false);
      if (!result.success) return;
      // Sound, motion and haptic together: one alone reads as a bug (`10` §6).
      // It used to be the haptic alone, which is the whole of why planting
      // "didn't work": it did, and nothing on screen said so.
      if (spot) {
        celebrate({
          titleKey: `reward.${result.verb}`,
          thingKey: result.verb === 'log' ? null : `verb.${result.verb}`,
          thingText: result.verb === 'log' && spot.speciesSlug ? SPECIES_BY_SLUG.get(spot.speciesSlug)?.name_es : undefined,
          semillas: VERB_SEMILLAS[result.verb] ?? 0,
          fx: VERB_FX[result.verb] ?? 'sparkle',
          sound: result.verb === 'fish' ? 'splash' : 'reward',
          at: spot.position,
        });
        if (result.verb === 'plant') useSessionStore.getState().addPlanting(spot.position);
      }

      /**
       * **Semillas come from the server or they do not come at all.**
       *
       * Every award writes a `semilla_ledger` row through
       * `brote_grant_semillas` (`15-DATA-MODEL.md` §4), and the balance shown
       * here is whatever that call returns. The client used to add the amount
       * to its own counter and tell nobody, which looked identical and was a
       * second currency path: the number went up, no row was written, and it
       * was gone on the next load. An unauditable economy is worse than a
       * slower one.
       */
      /**
       * Filing a sighting is the moment `12-LEARNING.md` §3.1 calls a learning
       * beat, so it is where a micro-fact is offered — through the budget,
       * which refuses most of the time by design. A refusal shows nothing
       * extra: the sighting landing in the Bitácora is its own feedback.
       */
      if (result.verb === 'log') facts.offer();

      if (result.verb === 'log' && spot?.speciesSlug && !readOnly) {
        void (async () => {
          try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc('world_log_species', {
              p_slug: spot.speciesSlug,
              p_region: spot.region,
              p_tod: timeOfDay,
            });
            if (error) return;
            const reply = data as { ok?: boolean; semillas?: number } | null;
            if (reply?.ok && typeof reply.semillas === 'number') setSemillas(reply.semillas);
          } catch {
            // The sighting is lost to a dropped connection. It is one row in a
            // journal, not an arrangement somebody spent an afternoon on, so
            // it is not worth an outbox of its own.
          }
        })();
      }
      // `forage` pays too, and its RPC does not exist yet (`0095` prices it and
      // nothing awards it). Until it does, foraging pays **nothing** rather
      // than a number this file made up.
    },
    [controller, setVerb, setSemillas, timeOfDay, readOnly, facts],
  );

  const runtime = useMemo(() => new VerbRuntime(onVerbFinish), [onVerbFinish]);

  /**
   * Using a verb. `sail` and `rest` change how movement works rather than
   * pausing it, so they go to the controller; everything else is a timed action.
   */
  /**
   * Foraging nodes empty when picked and come back on their own timers. An
   * empty one stays in the world and stops offering itself.
   */
  const forage = useForage({ userId, seed, readOnly });

  const onUseVerb = useCallback(
    (spot: VerbSpot) => {
      if (!controller) return;
      inFlight.current = spot;
      setVerb(spot.verb);
      if (spot.verb === 'sail') {
        controller.boardBoat();
        return;
      }
      if (spot.verb === 'forage') {
        // Picked here and paid for by the server, which owns the daily cap.
        forage.pick(spot.id);
      }
      if (spot.verb === 'rest') {
        // Resting advances the time of day one preset — the only control over
        // time the player has (`10-CONTROLS-AND-CAMERA.md` §3).
        controller.setLocked(true);
        window.setTimeout(() => {
          controller.setLocked(false);
          setVerb(null);
          onAdvanceTime?.();
          celebrate({ titleKey: 'reward.rest', fx: 'stars', at: spot.position });
        }, VERB_TIMING.restAdvanceS * 1000);
        return;
      }
      controller.setLocked(true);
      runtime.begin(spot.verb, spot.id);
    },
    [controller, runtime, setVerb, onAdvanceTime, forage],
  );

  useVerbSpots(layout, heightfield, config, timeOfDay, season, onUseVerb, forage.empty);

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

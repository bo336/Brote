'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { INTERACT } from '@/lib/world/config';
import { EVENT_SCRIPTS, payoutFor, type EventScript, type SpotAnchor } from '@/lib/world/event-script';
import { regionCentre } from '@/lib/world/regions';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { EventId, RegionId } from '@/lib/world/types';
import { PRIORITY, registerInteractable } from '../interaction/InteractableRegistry';
import { useSessionStore } from '../state/useSessionStore';
import { usePlayerStore } from '../state/usePlayerStore';

/**
 * Playing one of the six events.
 *
 * The script says which stages and which spots; this puts them in the world and
 * watches which one the player walks to. Nothing here decides an award — the
 * payout comes from `world_daily_chore('event')`, which caps the day and writes
 * the ledger row, and the script's own floor guarantees it is never zero.
 *
 * **A wrong turn is not a failure.** It costs the seconds the script says, the
 * line explains why rather than telling anyone off, and the stage stays open.
 * Nothing about an event can remove a species, a placement, or a region.
 */
export interface EventRun {
  script: EventScript | null;
  /** Which stage is live, or `stages.length` once the event is finished. */
  stage: number;
  /** Wrong turns so far. Costs seconds; never progress. */
  mistakes: number;
  done: boolean;
  /** Leave it. Every event is skippable, at every moment (§3.7). */
  skip: () => void;
}

/** Resolve a script's anchor against this particular island. */
function resolve(at: SpotAnchor, layout: IslandLayout): [number, number] {
  let cx = 0;
  let cz = 0;
  if (at.ref === 'spawn') {
    [cx, cz] = layout.spawn;
  } else if (at.ref === 'anchor') {
    const anchor = layout.anchors.find((a) => a.feature === at.id);
    if (anchor) {
      cx = anchor.x;
      cz = anchor.z;
    } else {
      // A feature this island does not have yet. The region it belongs to is
      // the honest fallback — never the origin, which is the middle of El Claro.
      [cx, cz] = regionCentre((at.id as RegionId) ?? 'claro');
    }
  } else {
    [cx, cz] = regionCentre((at.id as RegionId) ?? 'claro');
  }
  return [cx + Math.cos(at.angle) * at.dist, cz + Math.sin(at.angle) * at.dist];
}

export function useEventRuntime({
  layout,
  heightfield,
  readOnly,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  readOnly: boolean;
}): EventRun {
  const eventId = useSessionStore((s) => s.eventId);
  const endEvent = useSessionStore((s) => s.endEvent);
  const setNote = useSessionStore((s) => s.setNote);
  const setSemillas = usePlayerStore((s) => s.setSemillas);

  const [stage, setStage] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const paid = useRef(false);

  const script: EventScript | null = eventId ? EVENT_SCRIPTS[eventId] : null;

  // A new event starts clean.
  useEffect(() => {
    setStage(0);
    setMistakes(0);
    paid.current = false;
    if (script) setNote(script.startKey);
  }, [script, setNote]);

  const done = script !== null && stage >= script.stages.length;

  /** The payout, once, when the last stage closes. */
  useEffect(() => {
    if (!script || !done || paid.current) return;
    paid.current = true;
    setNote(script.learnKey ?? script.endKey);
    if (readOnly) return;
    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('world_daily_chore', { p_kind: 'event' });
        if (error) return;
        const reply = data as { ok?: boolean; semillas?: number } | null;
        if (reply?.ok && typeof reply.semillas === 'number') setSemillas(reply.semillas);
      } catch {
        /* an event's semillas, lost to a dropped connection. */
      }
    })();
  }, [script, done, readOnly, setNote, setSemillas]);

  /** Leaving. Always available, and it never costs anything. */
  const skip = useCallback(() => {
    setNote(null);
    endEvent();
  }, [endEvent, setNote]);

  const spots = useMemo(() => {
    if (!script || !layout || done) return [];
    const current = script.stages[stage];
    if (!current) return [];
    const wrongKey = current.wrongKey;
    return current.spots.map((spot) => {
      const [x, z] = resolve(spot.at, layout);
      return { ...spot, x, z, correct: current.correct.includes(spot.id), wrongKey };
    });
  }, [script, layout, stage, done]);

  useEffect(() => {
    if (!heightfield || spots.length === 0) return;
    const dispose = spots.map((spot) =>
      registerInteractable({
        id: `event-${spot.id}`,
        position: [spot.x, sampleHeight(heightfield, spot.x, spot.z), spot.z],
        radius: INTERACT.defaultRadiusM,
        labelKey: spot.labelKey,
        priority: PRIORITY.event,
        enabled: true,
        onInteract: () => {
          if (spot.correct) {
            setNote(null);
            setStage((n) => n + 1);
            return;
          }
          // Wrong: the line says why, the stage stays open, nothing is lost.
          setMistakes((n) => n + 1);
          if (spot.wrongKey) setNote(spot.wrongKey);
        },
      }),
    );
    return () => dispose.forEach((fn) => fn());
  }, [spots, heightfield, setNote]);

  /** The prompt for the live stage, refreshed whenever it changes. */
  useEffect(() => {
    if (!script || done) return;
    const current = script.stages[stage];
    if (current && stage > 0) setNote(current.promptKey);
  }, [script, stage, done, setNote]);

  return { script, stage, mistakes, done, skip };
}

/** What an event will pay, for the end card. Never zero. */
export function eventPayout(id: EventId, mistakes: number): number {
  return payoutFor(id, mistakes);
}

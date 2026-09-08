'use client';

import { useEffect, useMemo } from 'react';

import { INTERACT } from '@/lib/world/config';
import { markerLine, placeMarkers, type RawMarker } from '@/lib/world/markers';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { ProjectMarker } from '@/lib/world/types';
import { PRIORITY, registerInteractable } from './InteractableRegistry';
import { useSessionStore } from '../state/useSessionStore';

/**
 * A stone on the island for every real project the player actually went to.
 *
 * "The strongest emotional link in the design, and nearly free to build"
 * (`11-GAME-LOOP.md` §5 pillar 5). Walking up to one tells you what you did,
 * where, and when — in the same one-line slot everything else in the world uses.
 *
 * The line is **read**, not celebrated: no fanfare, no semillas, no counter.
 * It is a thing that happened, standing where you can walk past it.
 */
export function useProjectMarkers({
  layout,
  heightfield,
  markers,
  isGround,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  markers: readonly RawMarker[];
  isGround?: (x: number, z: number) => boolean;
}): ProjectMarker[] {
  const setNote = useSessionStore((s) => s.setNote);
  const setNoteValues = useSessionStore((s) => s.setNoteValues);

  const placed = useMemo(() => {
    if (!layout || markers.length === 0) return [];
    return placeMarkers({
      markers,
      seed: layout.seed,
      spawn: layout.spawn,
      radius: layout.radius,
      isGround,
    });
  }, [layout, markers, isGround]);

  useEffect(() => {
    if (!heightfield || placed.length === 0) return;
    const dispose = placed.map((m) =>
      registerInteractable({
        id: `marker-${m.id}`,
        position: [m.x, sampleHeight(heightfield, m.x, m.z), m.z],
        radius: INTERACT.defaultRadiusM,
        labelKey: 'marker.name',
        priority: PRIORITY.flavour,
        enabled: true,
        onInteract: () => {
          const line = markerLine(m);
          setNoteValues(line.values);
          setNote(line.key);
        },
      }),
    );
    return () => dispose.forEach((fn) => fn());
  }, [placed, heightfield, setNote, setNoteValues]);

  return placed;
}

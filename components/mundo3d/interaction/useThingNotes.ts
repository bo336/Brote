'use client';

import { useEffect } from 'react';

import { INTERACT } from '@/lib/world/config';
import { thingDescKey, thingNameKey, type ThingId } from '@/lib/world/things';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { Placement } from '@/lib/world/types';
import { registerInteractable } from './InteractableRegistry';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Walking up to a thing and being told what it is.
 *
 * The density rule (`11-GAME-LOOP.md` §3.3): every object in the world has a
 * name and a description, and this is where they are read. The action button
 * carries the **name**; interacting prints the **description** in the same
 * one-line slot a soft barrier uses, and it clears itself.
 *
 * No sheet, no modal, no panel. A line, and then the world again.
 */
export function useThingNotes({
  layout,
  heightfield,
  placements,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  placements: readonly Placement[];
}): void {
  const setNote = useSessionStore((s) => s.setNote);

  useEffect(() => {
    if (!layout || !heightfield) return;

    const register = (id: ThingId, key: string, x: number, z: number) =>
      registerInteractable({
        id: key,
        position: [x, sampleHeight(heightfield, x, z), z],
        radius: INTERACT.defaultRadiusM,
        labelKey: thingNameKey(id),
        // No verb: reading a thing is not one of the sixteen, which is also
        // what makes it available at every tier with nothing to unlock.
        enabled: true,
        onInteract: () => setNote(thingDescKey(id)),
      });

    const dispose = [
      // The island's own structures, from their anchors.
      ...layout.anchors
        // El Mojón registers itself, and it opens a sheet rather than a line.
        .filter((a) => a.feature !== 'mojon')
        .map((a) => register(a.feature, `thing-${a.id}`, a.x, a.z)),
      // …and everything the player put down themselves.
      ...placements.map((p, i) =>
        register(p.prop_slug as ThingId, `thing-placed-${i}`, p.x, p.z)),
    ];
    return () => dispose.forEach((fn) => fn());
  }, [layout, heightfield, placements, setNote]);
}

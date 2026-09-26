'use client';


import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import { GuideBeacon } from './GuideBeacon';
import { Saplings } from './Saplings';
import { WorldFx } from './WorldFx';

/**
 * Everything in the world that answers "what do I do, and did it work?"
 *
 * The objective is recomputed a couple of times a second from what the world
 * already offers (`lib/world/objectives.ts`); walking into a region for the
 * first time names it; bursts and saplings show what the player just did; and
 * the beacon and the arrow show where to go next.
 */
export function Guidance({ heightfield }: { layout: IslandLayout; heightfield: Heightfield }) {
  // The objective and the region titles belong to the game's mission guide now
  // (`game/scene/MissionGuide.tsx`); this keeps the three things that show them.
  return (
    <>
      <WorldFx />
      <Saplings />
      <GuideBeacon heightfield={heightfield} />
    </>
  );
}

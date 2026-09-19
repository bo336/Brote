'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { GUIDE } from '@/lib/world/config';
import type { IslandLayout } from '@/lib/world/layout';
import { DONE_NEAR_M, hasVisited, pickObjective } from '@/lib/world/objectives';
import type { Heightfield } from '@/lib/world/terrain';
import type { RegionId } from '@/lib/world/types';
import { listInteractables } from '../interaction/InteractableRegistry';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';
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
export function Guidance({ layout, heightfield }: { layout: IslandLayout; heightfield: Heightfield }) {
  const visited = useRef(new Set<RegionId>(['claro']));
  const since = useRef<number>(GUIDE.trackEveryS);
  /** What already paid out this session, so the card moves on (`pickObjective`'s `skip`). */
  const done = useRef(new Set<string>());
  const lastReward = useRef<number | null>(null);

  useFrame((_, dt) => {
    since.current += dt;
    if (since.current < GUIDE.trackEveryS) return;
    since.current = 0;
    const p = playerTransform;
    const store = useSessionStore.getState();
    // A reward card next to the thing the card pointed at is that thing done.
    const reward = store.reward;
    if (reward && reward.id !== lastReward.current) {
      lastReward.current = reward.id;
      const o = store.objective;
      if (o?.targetId && o.target && Math.hypot(o.target.x - p.x, o.target.z - p.z) < DONE_NEAR_M) {
        done.current.add(o.targetId);
      }
    }
    for (const region of layout.regions) {
      if (!region.unlocked || visited.current.has(region.id) || !hasVisited(region, p.x, p.z)) continue;
      visited.current.add(region.id);
      store.setRegionTitle(region.id);
    }
    store.setObjective(
      pickObjective({
        pip: p,
        things: listInteractables(),
        regions: layout.regions,
        visited: visited.current,
        firstRunBeat: store.firstRun?.beat ?? null,
        skip: done.current,
      }),
    );
  });

  return (
    <>
      <WorldFx />
      <Saplings />
      <GuideBeacon heightfield={heightfield} />
    </>
  );
}

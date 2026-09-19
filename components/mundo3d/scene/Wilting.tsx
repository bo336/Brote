'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { InstancePool } from '@/lib/render/instancing';
import { sprout } from '@/lib/render/geometry/scatter';
import { getClayMaterial } from '@/lib/render/materials';
import { CLAY } from '@/lib/render/palette';
import { INTERACT, LEARNING } from '@/lib/world/config';
import { wiltingVisible } from '@/lib/world/learning';
import { hashInt, mulberry32 } from '@/lib/world/rng';
import { record } from '@/lib/world/telemetry';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import { PRIORITY, registerInteractable } from '../interaction/InteractableRegistry';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Riego de saberes — spaced repetition as world maintenance
 * (`12-LEARNING.md` §3.3).
 *
 * Overdue Academia items manifest as physical objects: a plant in the garden
 * that has drooped. Walking up and interacting opens **one** review, through
 * the Academia's own door — §3.4, "the existing system, given one door", and
 * §5's first forbidden item, "a modal quiz that must be dismissed". There is no
 * quiz in the world; there is a plant, and a way to go and answer one thing.
 *
 * Four rules, and every one of them is about not becoming a chore list:
 *
 *  - **≤3 visible at once**, however many are actually due.
 *  - **Ignorable without punishment** — nothing here blocks anything.
 *  - **Decay is cosmetic and reversible only.** A wilting plant never dies,
 *    never disappears, and is never subtracted from anything.
 *  - **It recovers on its own after a week**, whatever the player does.
 *
 * The last one is why this component takes a count and not a list of chores:
 * the world's job is to show that something is due, not to keep score of it.
 */
const WILT_SCALE = 0.75;
/** How far from the garden's centre they stand. Close enough to notice. */
const SPREAD_M = 5;

export function Wilting({
  layout,
  heightfield,
  due,
}: {
  layout: IslandLayout;
  heightfield: Heightfield;
  /** How many Academia items are overdue. The cap is applied here, not by the caller. */
  due: number;
}) {
  const router = useRouter();
  const setNote = useSessionStore((s) => s.setNote);

  const count = wiltingVisible(due);

  // A drooping sprout, in the dulled green of something that wants water. The
  // same geometry the garden already grows, so nothing new is loaded to say
  // "this one needs you".
  const material = useMemo(
    () => getClayMaterial({ vertexColors: true, wind: true, wobble: true }),
    [],
  );
  const geometry = useMemo(() => sprout(7), []);
  const pool = useMemo(
    () => new InstancePool(geometry, material, LEARNING.wiltingVisibleMax, { name: 'wilting' }),
    [geometry, material],
  );

  const spots = useMemo(() => {
    const rng = mulberry32(hashInt(`wilting:${layout.seed}`));
    const centre = layout.regions.find((r) => r.id === 'jardin') ?? layout.regions[0];
    const cx = centre?.x ?? 0;
    const cz = centre?.z ?? 0;
    return Array.from({ length: count }, (_, i) => {
      const angle = rng() * Math.PI * 2;
      const dist = SPREAD_M * (0.4 + rng() * 0.6);
      return { i, x: cx + Math.cos(angle) * dist, z: cz + Math.sin(angle) * dist };
    });
  }, [layout, count]);

  useEffect(() => {
    for (const s of spots) {
      const i = pool.alloc();
      if (i < 0) break;
      // Tipped over, and smaller. It reads as thirsty rather than as broken.
      pool.place(i, s.x, sampleHeight(heightfield, s.x, s.z), s.z, 0, WILT_SCALE, 0.4, 0.2);
    }
    pool.resize(spots.length);
    pool.commit();
  }, [pool, spots, heightfield]);

  useEffect(() => {
    const dispose = spots.map((s) =>
      registerInteractable({
        id: `wilting-${s.i}`,
        position: [s.x, sampleHeight(heightfield, s.x, s.z), s.z],
        radius: INTERACT.defaultRadiusM,
        labelKey: 'learning.water',
        // Below a chore and far below an event: this is the most ignorable
        // thing on the island, and that is the point.
        priority: PRIORITY.flavour,
        enabled: true,
        onInteract: () => {
          record('learning_beat_shown');
          setNote('learning.opened');
          // One review, in the Academia, which already knows how to schedule
          // and mark them. The world never asks a question of its own.
          router.push('/academia');
        },
      }),
    );
    return () => dispose.forEach((fn) => fn());
  }, [spots, heightfield, router, setNote]);

  useEffect(() => () => pool.dispose(), [pool]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  if (count === 0) return null;
  return <primitive object={pool.mesh} />;
}

/** The dull green of something that wants water, for the paint pass to use. */
export const WILT_COLOR = CLAY.grassDeep;

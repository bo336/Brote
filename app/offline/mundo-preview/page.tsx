'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { playerTransform } from '@/components/mundo3d/state/usePlayerStore';
import { regionCentre } from '@/lib/world/regions';
import type { RegionId, TimeOfDay } from '@/lib/world/types';

/**
 * The world, without an account.
 *
 * `/mundo` needs a session, a profile and the `mundo_enabled()` flag, which
 * means the only people who can look at the 3D world are people who can sign
 * in. That makes it impossible to review — every art judgement in
 * `20-ACCEPTANCE.md` §2A and §3A is "look at it and say", and the person asking
 * for those judgements could not.
 *
 * So this route renders the same `MundoGame` against a fixed demo user with no
 * impact and no placements. It reads nothing and writes nothing: the id below
 * is a literal, the impact totals are zeros inside `MundoGame`, and there is no
 * Supabase call anywhere in the tree. What it exposes is the renderer.
 *
 * **It is under `/offline`, which `lib/supabase/middleware.ts` treats as
 * public.** That is deliberate and it is the whole point — but it does mean the
 * page ships. Phase 5's sweep should decide whether to keep it, gate it behind
 * an env var, or drop it once there is another way to review the world.
 *
 * Every parameter is in the URL so a screenshot can be reproduced exactly:
 *
 *   ?tier=1..11   the world tier (how much of the island exists)
 *   ?q=0..3       the quality tier, forced
 *   ?tod=         amanecer | dia | atardecer | noche
 *   ?world=       the world index, which picks the biome
 *   ?at=          a region id — drops Pip at its centre once the world is up
 *   ?props=1      lay one of each placeable prop out around the spawn
 */
const MundoGame = dynamic(() => import('@/components/mundo3d/MundoGame'), {
  ssr: false,
  loading: () => <LoadingState />,
});

function Preview() {
  const params = useSearchParams();
  const at = params.get('at') as RegionId | null;

  /**
   * `?at=` and a `window.__pipTo(region)` hook, for touring the island without
   * walking the whole way.
   *
   * **Prefer walking.** A jump moves `playerTransform` instantly while the rig
   * and the camera damp toward it, so for a second or two afterwards the camera
   * is aimed at one place and Pip is drawn in another. Screenshots taken in
   * that window are of a state the game never actually reaches — it is what
   * produced a run of "the camera is inside a tree" frames that turned out to
   * be nothing at all.
   */
  useEffect(() => {
    const w = window as unknown as { __pipTo?: (id: RegionId) => [number, number] };
    w.__pipTo = (id: RegionId) => {
      const [x, z] = regionCentre(id);
      playerTransform.x = x;
      playerTransform.z = z;
      return [x, z];
    };
    if (!at) return;
    // Re-applied on a timer: the world takes a moment to build and
    // `resetPlayerTransform` runs after it, so a single jump lands nowhere.
    const id = setInterval(() => w.__pipTo?.(at), 1500);
    return () => clearInterval(id);
  });

  return (
    <MundoGame
      perf
      forcedTier={Number(params.get('q') ?? '1')}
      userId="3f1c0e2a-0000-4000-8000-000000000001"
      tier={Number(params.get('tier') ?? '2')}
      worldIndex={Number(params.get('world') ?? '1')}
      liveliness={0.8}
      timeOfDay={(params.get('tod') as TimeOfDay | null) ?? 'dia'}
      demoProps={params.get('props') === '1'}
    />
  );
}

export default function MundoPreviewPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Preview />
    </Suspense>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { playerTransform } from '@/components/mundo3d/state/usePlayerStore';
import { useSessionStore } from '@/components/mundo3d/state/useSessionStore';
import { regionCentre } from '@/lib/world/regions';
import { parseWorldPayload } from '@/lib/world/payload';
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
 *   ?impact=N     fixture impact totals, to drive the mirror and El Mojón
 *
 * `?impact=` is how the four mirror channels get demonstrated without waiting
 * for somebody to log a year of real actions: 0 is a brand-new island, 1 is a
 * few weeks in, 2 is years of it. The figures are made up and stay in this
 * file — nothing else in the app may invent an impact number.
 */
const DEMO_USER = '3f1c0e2a-0000-4000-8000-000000000001';

const MundoGame = dynamic(() => import('@/components/mundo3d/MundoGame'), {
  ssr: false,
  loading: () => <LoadingState />,
});

/** Fixture totals, in the units `brote_user_impact` returns. */
const ZERO = { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 };
const IMPACT_FIXTURES = [
  ZERO,
  { water_l: 1240, co2_kg: 2.4, waste_kg: 3.1, energy_kwh: 12 },
  { water_l: 96000, co2_kg: 420, waste_kg: 310, energy_kwh: 2600 },
];

function Preview() {
  const params = useSearchParams();
  const at = params.get('at') as RegionId | null;
  const tier = Number(params.get('tier') ?? '2');

  /**
   * A payload built here rather than fetched, so the route needs no session.
   * It goes through the same parser the real page uses, which means the preview
   * cannot accidentally be looking at a shape the game will never receive.
   */
  const payload = useMemo(() => {
    const fixture = IMPACT_FIXTURES[Number(params.get('impact') ?? '0')] ?? ZERO;
    return parseWorldPayload(
      {
        userId: DEMO_USER,
        seed: 12345,
        world: { seed: 12345, celebrated_tier: tier, layouts: [] },
        mundo: {
          rankTier: tier,
          structuralElements: ['soil'],
          worldIndex: Number(params.get('world') ?? '1'),
          liveliness: 0.8,
          palette: 'default',
        },
        impact: fixture,
        collectiveWaterL: fixture.water_l * 1000,
        semillas: 120,
        placements: [],
        journal: [],
      },
      DEMO_USER,
    );
  }, [params, tier]);

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
    const w = window as unknown as {
      __pipTo?: (id: RegionId) => [number, number];
      __pipAt?: (x: number, z: number) => void;
      __hud?: (mode: string) => void;
    };
    w.__pipTo = (id: RegionId) => {
      const [x, z] = regionCentre(id);
      playerTransform.x = x;
      playerTransform.z = z;
      return [x, z];
    };
    // Anywhere, not only a region centre — the Mojón sits on the path between
    // two of them and there is no region id for a path.
    w.__pipAt = (x: number, z: number) => {
      playerTransform.x = x;
      playerTransform.z = z;
    };
    // And open a sheet without walking to it, for reviewing the panel itself.
    w.__hud = (mode: string) => useSessionStore.getState().setHud(mode as 'play');
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
      payload={payload}
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

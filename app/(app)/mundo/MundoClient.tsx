'use client';

import dynamic from 'next/dynamic';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { MundoSeguro } from '@/components/mundo3d/MundoSeguro';
import type { WorldPayload } from '@/lib/world/types';

/**
 * The code-split boundary.
 *
 * `three` and everything under `lib/render/**` are reached only from here, which
 * is what keeps them out of the shared chunk and off the home feed's critical
 * path (`07-RENDER-ARCHITECTURE.md` §3). `ssr: false` because WebGL has no
 * meaning on the server, and because the loading state is the design, not a
 * fallback.
 */
const MundoGame = dynamic(() => import('@/components/mundo3d/MundoGame'), {
  ssr: false,
  loading: () => <LoadingState />,
});

interface MundoClientProps {
  /** `?perf=1` — the measurement harness (`07-RENDER-ARCHITECTURE.md` §6). */
  perf: boolean;
  /** `?mundoTier=0..3` forces a quality tier, for testing. */
  forcedTier: number | null;
  /** One `world_bootstrap()` trip, parsed on the server. Read, never written. */
  payload: WorldPayload;
  /** The bootstrap failed and this is a filled-in default, not their island. */
  degraded?: boolean;
}

export function MundoClient({ perf, forcedTier, payload, degraded = false }: MundoClientProps) {
  // The guard checks WebGL 2 before the 3D chunk loads and catches anything
  // that breaks while it runs, so a phone that cannot draw the island gets a
  // clear screen with a light mode — not the app's generic error page.
  return (
    <MundoSeguro tier={payload.tier} snapshotUrl={payload.snapshotUrl}>
      <MundoGame perf={perf} forcedTier={forcedTier} payload={payload} readOnly={degraded} />
    </MundoSeguro>
  );
}

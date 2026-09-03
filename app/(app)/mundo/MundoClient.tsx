'use client';

import dynamic from 'next/dynamic';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';

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
  /** From `profiles.mundo_state`, read on the server. Never written from here. */
  userId: string;
  tier: number;
  worldIndex: number;
  liveliness: number;
}

export function MundoClient({ perf, forcedTier, userId, tier, worldIndex, liveliness }: MundoClientProps) {
  return (
    <MundoGame
      perf={perf}
      forcedTier={forcedTier}
      userId={userId}
      tier={tier}
      worldIndex={worldIndex}
      liveliness={liveliness}
    />
  );
}

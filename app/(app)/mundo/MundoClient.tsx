'use client';

import dynamic from 'next/dynamic';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { useSettings } from '@/stores/settings';

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
}

export function MundoClient({ perf, forcedTier }: MundoClientProps) {
  // The user's own quality setting always wins over any measurement we make.
  const detailMode = useSettings((s) => s.detailMode);
  return <MundoGame perf={perf} forcedTier={forcedTier} detailMode={detailMode} />;
}

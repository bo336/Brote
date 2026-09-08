'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { useVisit } from '@/components/mundo3d/visit/useVisit';
import { useWorldStore } from '@/components/mundo3d/state/useWorldStore';
import { payloadForVisit, type VisitPayload } from '@/lib/world/visit';

/**
 * The same code-split boundary as `/mundo` — `three` is reached only from here,
 * which is what keeps it off every other page's critical path.
 */
const MundoGame = dynamic(() => import('@/components/mundo3d/MundoGame'), {
  ssr: false,
  loading: () => <LoadingState />,
});

export function VisitClient({
  visit,
  myPip,
  gifts,
  perf,
}: {
  visit: VisitPayload;
  /** The visitor's own cosmetics: they arrive as themselves, not as a default. */
  myPip: Record<string, unknown> | null;
  /** `world_gift_options`' blob: what you own that they do not, and today's count. */
  gifts: unknown;
  perf: boolean;
}) {
  // The host's island, in the shape the world already knows how to build.
  const payload = useMemo(() => payloadForVisit(visit, myPip), [visit, myPip]);
  // The layout the game built from that payload, so a sticker knows which
  // region it landed in. Null until the world has been hydrated — the picker
  // is disabled for exactly that long.
  const layout = useWorldStore((s) => s.layout);
  const session = useVisit(visit, layout, gifts);

  return <MundoGame perf={perf} payload={payload} visit={session} />;
}

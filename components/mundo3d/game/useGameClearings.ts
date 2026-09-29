'use client';

import { useMemo } from 'react';

import { gameSpots } from '@/lib/world/game/spots';
import type { IslandLayout } from '@/lib/world/layout';

export interface Clearing {
  x: number;
  z: number;
  r: number;
}

const NONE: readonly Clearing[] = [];

/**
 * Where the game builds and where its people stand, as circles no tree may
 * grow in — or a station would stand inside a trunk (the mountain refuge did,
 * under a molle, in the first review).
 */
export function useGameClearings(userId: string, layout: IslandLayout | null): readonly Clearing[] {
  return useMemo(() => {
    if (!layout) return NONE;
    const spots = gameSpots(userId, layout);
    return [
      ...Object.values(spots.stations).map((s) => ({ x: s!.x, z: s!.z, r: 3.2 })),
      ...Object.values(spots.cast).map((s) => ({ x: s.x, z: s.z, r: 1.8 })),
      { x: spots.ceibo.x, z: spots.ceibo.z, r: 3.5 },
    ];
  }, [layout, userId]);
}

'use client';

import { create } from 'zustand';

import { cumulativeState } from '@/lib/world/progression';
import { buildLayout, type IslandLayout } from '@/lib/world/layout';
import { mirrorFrom, ZERO_MIRROR } from '@/lib/world/impact';
import { biomeConfig, type BiomeConfig } from '@/lib/world/biome';
import type { ImpactTotals, MirrorParams, WorldConfig } from '@/lib/world/types';

/**
 * The derived world: **read-only at runtime.**
 *
 * `mundo_state` is server state (`07-RENDER-ARCHITECTURE.md` §7). The world
 * reads it and never writes it. This store is recomputed only when that state
 * changes, which cannot happen while the player is inside `/mundo` — a real
 * action completes in the app, not in the game.
 *
 * The layout is a plain data object, not a `THREE.Object3D`, so it is safe to
 * hold here; the scene builds meshes from it and keeps those in refs.
 */
interface WorldStoreState {
  userId: string;
  tier: number;
  worldIndex: number;
  liveliness: number;
  config: WorldConfig;
  layout: IslandLayout | null;
  biome: BiomeConfig;
  mirror: MirrorParams;
  hydrate: (input: {
    userId: string;
    tier: number;
    worldIndex: number;
    liveliness: number;
    impact: ImpactTotals;
  }) => void;
}

const DEFAULT_TIER = 1;

export const useWorldStore = create<WorldStoreState>((set) => ({
  userId: '',
  tier: DEFAULT_TIER,
  worldIndex: 1,
  liveliness: 0.5,
  config: cumulativeState(DEFAULT_TIER),
  layout: null,
  biome: biomeConfig(1),
  mirror: ZERO_MIRROR,
  hydrate: ({ userId, tier, worldIndex, liveliness, impact }) => {
    const config = cumulativeState(tier);
    set({
      userId,
      tier: config.tier,
      worldIndex,
      liveliness,
      config,
      layout: buildLayout(userId, config),
      biome: biomeConfig(worldIndex),
      mirror: mirrorFrom(impact),
    });
  },
}));

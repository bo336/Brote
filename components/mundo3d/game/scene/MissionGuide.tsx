'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { create } from 'zustand';

import { missionView, type MissionView } from '@/lib/world/game/targets';
import type { Spawn } from '@/lib/world/game/spawns';
import type { GameSpots } from '@/lib/world/game/spots';
import type { IslandLayout } from '@/lib/world/layout';
import type { RegionId } from '@/lib/world/types';
import { hasVisited } from '@/lib/world/objectives';
import { playerTransform } from '../../state/usePlayerStore';
import { useSessionStore } from '../../state/useSessionStore';
import { useGameStore } from '../useGameStore';
import { waterSources } from './WaterSources';

/**
 * Keeps the mission card and the golden beacon pointed at the one next thing
 * (`lib/world/game/targets.ts`), a few times a second — not every frame: a
 * target that moved half a metre is the same target.
 *
 * It also notices when Pip walks into a region for the first time (the region
 * title) and every time Pip enters one (dailies like "pasá por La Pradera").
 */
export const useMissionView = create<{ view: MissionView | null; set: (v: MissionView | null) => void }>((set) => ({
  view: null,
  set: (view) => set({ view }),
}));

/** Where each character stands, written by `Cast`, read here. */
export const castPositions = new Map<string, { x: number; z: number }>();

const EVERY_S = 0.4;

export function MissionGuide({
  layout,
  spots,
  spawns,
}: {
  layout: IslandLayout;
  spots: GameSpots;
  spawns: readonly Spawn[];
}) {
  const since = useRef(EVERY_S);
  const inside = useRef<RegionId | null>(null);
  const titled = useRef(new Set<RegionId>(['claro']));

  useFrame((_, dt) => {
    since.current += dt;
    if (since.current < EVERY_S) return;
    since.current = 0;
    const store = useGameStore.getState();
    const s = store.state;
    const field = store.field;
    const ctx = store.ctx();
    if (!s || !field || !ctx) return;
    const p = playerTransform;

    // Regions: a title the first time, a "visited" every time you walk in.
    const here = layout.regions.find((r) => r.unlocked && r.id !== 'claro' && hasVisited(r, p.x, p.z))?.id ?? null;
    if (here !== inside.current) {
      inside.current = here;
      if (here) {
        if (!titled.current.has(here)) {
          titled.current.add(here);
          useSessionStore.getState().setRegionTitle(here);
        }
        store.dispatch({ t: 'visit', region: here });
      }
    }

    const water: { x: number; z: number; id: string }[] = [...waterSources(layout)];
    const tank = spots.stations.tanque;
    if (tank && (s.stations.tanque?.lvl ?? 0) >= 1) water.push({ x: tank.x, z: tank.z, id: 'game-station-tanque' });
    const view = missionView(s, { field }, ctx, { pip: p, spawns, spots, cast: castPositions, water });
    const prev = useMissionView.getState().view;
    if (!prev || prev.id !== view.id || prev.title !== view.title || prev.progress?.done !== view.progress?.done || prev.need !== view.need ||
      prev.target?.id !== view.target?.id || Math.abs((prev.target?.x ?? 0) - (view.target?.x ?? 0)) > 0.5) {
      useMissionView.getState().set(view);
    }
    const t = view.target;
    const session = useSessionStore.getState();
    const current = session.objective;
    const distanceM = t ? Math.hypot(t.x - p.x, t.z - p.z) : null;
    if (current?.targetId !== (t?.id ?? null) || Math.abs((current?.distanceM ?? 0) - (distanceM ?? 0)) > 1) {
      session.setObjective({
        kind: 'chore', titleKey: 'goal.free', thingKey: null,
        target: t ? { x: t.x, z: t.z } : null, targetId: t?.id ?? null,
        progress: view.progress, distanceM,
      });
    }
  });

  return null;
}

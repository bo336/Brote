'use client';

import { useEffect, useMemo } from 'react';

import type { IslandLayout } from '@/lib/world/layout';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { PRIORITY, registerInteractable } from '../../interaction/InteractableRegistry';
import { useGameStore } from '../useGameStore';

/**
 * Where the watering can is filled without a tank: the puddle of La Pradera
 * and the edge of every lake. The tank is the easy way (it is by the stations
 * and it collects rain on its own); these are always there and never run out.
 */
/** Every place the can fills for free, with the id its interactable is registered under. */
export function waterSources(layout: IslandLayout): { id: string; x: number; z: number }[] {
  const out: { id: string; x: number; z: number }[] = [];
  for (const a of layout.anchors) if (a.feature === 'puddle') out.push({ id: `game-water-${a.id}`, x: a.x + 1.2, z: a.z });
  for (const lake of layout.terrain.lakes) {
    out.push({ id: `game-water-${Math.round(lake.x)}-${Math.round(lake.z)}`, x: lake.x + lake.r * 1.05, z: lake.z });
  }
  return out;
}

export function WaterSources({ layout, heightfield }: { layout: IslandLayout; heightfield: Heightfield }) {
  const sources = useMemo(() => waterSources(layout), [layout]);

  useEffect(() => {
    const offs = sources.map((s) => registerInteractable({
      id: s.id,
      position: [s.x, sampleHeight(heightfield, s.x, s.z), s.z],
      radius: 2.2,
      labelKey: 'accion.mojon',
      label: 'Cargar la regadera',
      priority: PRIORITY.normal,
      enabled: true,
      onInteract: () => {
        const st = useGameStore.getState();
        st.dispatch({ t: 'fill' }, [s.x, 0, s.z]);
      },
    }));
    return () => offs.forEach((off) => off());
  }, [sources, heightfield]);

  return null;
}

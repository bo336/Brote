'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { create } from 'zustand';
import type * as THREE from 'three';

import { setGroundRestoration, updateReveal } from '@/lib/render/materials';
import { REVEAL_OFF } from '@/lib/render/reveal';
import {
  buildRestorationMap, commitRestoration, paintParcel, paintWave, type ParcelLook, type RestorationMap,
} from '@/lib/render/restoration';
import { starsOf } from '@/lib/world/game/care';
import { parcelRegion, parcelsAt } from '@/lib/world/game/parcels';
import type { IslandLayout } from '@/lib/world/layout';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { playSfx } from '../../audio/sfx';
import { emitFx } from '../../state/feedback';
import { useSessionStore } from '../../state/useSessionStore';
import { useGameStore } from '../useGameStore';

/**
 * Makes the parcels *show*: dry and sparse while wild, dark soil once
 * composted, green and full once alive (`lib/render/restoration.ts`).
 *
 * When a parcel changes stage its new look spreads out from the centre over a
 * second and a half — the grass rising through it, the flowers and saplings
 * springing up with the arrival shader's `grow` front — with a chime and a
 * burst of leaves. That wave is the reward the whole game is built around, so
 * it plays every time and it plays where you are standing.
 */
export const useRestorationTex = create<{ tex: THREE.Texture | null; set: (t: THREE.Texture | null) => void }>((set) => ({
  tex: null,
  set: (tex) => set({ tex }),
}));

const WAVE_S = 1.6;

interface Wave {
  i: number;
  from: ParcelLook;
  to: ParcelLook;
  t: number;
  x: number;
  y: number;
  z: number;
}

export function Restoration({ layout, heightfield }: { layout: IslandLayout; heightfield: Heightfield }) {
  const field = useGameStore((s) => s.field);
  const state = useGameStore((s) => s.state);
  const tier = useGameStore((s) => s.base?.tier ?? 1);
  const parcels = useMemo(() => (field ? parcelsAt(field, tier) : []), [field, tier]);

  const map = useMemo<RestorationMap | null>(
    () => (field ? buildRestorationMap(field, parcels, heightfield, layout) : null),
    [field, parcels, heightfield, layout],
  );
  const painted = useRef<ParcelLook[]>([]);
  const waves = useRef<Wave[]>([]);

  const lookOf = (id: string): ParcelLook => {
    const ps = state?.parcels[id];
    const p = field!.byId.get(id)!;
    return { stage: ps?.s ?? 0, region: parcelRegion(p, ps, tier), stars: starsOf(ps) };
  };

  // First paint: everything as it is, no waves.
  useEffect(() => {
    if (!map || !field) return;
    painted.current = map.parcels.map((p, i) => {
      const look = lookOf(p.id);
      paintParcel(map, i, look);
      return look;
    });
    commitRestoration(map);
    setGroundRestoration(map.tex);
    useRestorationTex.getState().set(map.tex);
    return () => useRestorationTex.getState().set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Every later change: a wave from the parcel's centre.
  useEffect(() => {
    if (!map || !field || !state) return;
    map.parcels.forEach((p, i) => {
      const to = lookOf(p.id);
      const from = painted.current[i];
      if (!from || (from.stage === to.stage && from.region === to.region && from.stars === to.stars)) return;
      painted.current[i] = to;
      const y = sampleHeight(heightfield, p.x, p.z);
      waves.current.push({ i, from, to, t: 0, x: p.x, y, z: p.z });
      if (to.stage > from.stage || to.stars > from.stars) {
        playSfx('grow');
        for (let k = 0; k < 5; k++) emitFx('leaves', p.x + (k - 2) * 0.8, y + 0.3, p.z + ((k * 37) % 5 - 2) * 0.6);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.parcels, map]);

  useFrame((s, dt) => {
    if (!map || waves.current.length === 0) return;
    const keep: Wave[] = [];
    let reveal: Wave | null = null;
    for (const w of waves.current) {
      w.t = Math.min(1, w.t + dt / WAVE_S);
      paintWave(map, w.i, w.from, w.to, w.t);
      if (w.t < 1) {
        keep.push(w);
        reveal = w;
      }
    }
    commitRestoration(map);
    waves.current = keep;
    // The arrival shader grows what stands in the parcel along with its grass —
    // unless a ceremony owns that uniform right now.
    if (!useSessionStore.getState().ceremony.request) {
      if (reveal && reveal.to.stage >= 3) {
        updateReveal({ mode: 'bloom', centre: [reveal.x, reveal.y, reveal.z], radius: 6.5, amount: reveal.t, bare: REVEAL_OFF.bare });
      } else if (!reveal) {
        updateReveal(REVEAL_OFF);
      }
    }
    s.invalidate();
  });

  return null;
}

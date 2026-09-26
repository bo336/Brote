'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  compostera, constructionSite, hotelInsectos, puntoLimpio, tanque, vivero,
} from '@/lib/render/geometry/stations-game';
import { getGeometry } from '@/lib/render/geometry';
import { getClayMaterial } from '@/lib/render/materials';
import type { BlobShadowPool } from '@/lib/render/shadows';
import { GAME } from '@/lib/world/game/config';
import { MATERIALS } from '@/lib/world/game/materials';
import { buildOpen } from '@/lib/world/game/missions';
import { missingFor, tickStation } from '@/lib/world/game/production';
import { named, nextCost, STATIONS } from '@/lib/world/game/stations';
import type { GameSpots } from '@/lib/world/game/spots';
import type { MaterialId, StationId } from '@/lib/world/game/types';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { PropCollider } from '../../control/CharacterController';
import { PRIORITY, registerInteractable } from '../../interaction/InteractableRegistry';
import { playSfx } from '../../audio/sfx';
import { emitFx } from '../../state/feedback';
import { playerTransform } from '../../state/usePlayerStore';
import { useSessionStore } from '../../state/useSessionStore';
import { useGameStore } from '../useGameStore';
import { useGameUi } from '../useGameUi';
import { useTags } from '../tags';

/**
 * The stations: a construction site until you build it, then the thing itself
 * at its level (`lib/world/game/stations.ts`).
 *
 * **Building is walking.** Stop on a site and what it needs flies out of the
 * backpack onto it, one piece at a time, each with its knock — the pad is the
 * whole interface. A built station is used with E / the action button, which
 * opens its panel. It has to be a stop, not a pass: walking across a pad on the
 * way to somewhere else must never empty the bag into it, and a site the story
 * has not asked for yet takes nothing at all (`buildOpen`).
 */
type Buildable = 'punto_limpio' | 'compostera' | 'tanque' | 'vivero' | 'hotel_insectos';
const BUILDERS: Record<Buildable, (lvl: number) => THREE.BufferGeometry> = {
  punto_limpio: puntoLimpio, compostera, tanque, vivero, hotel_insectos: hotelInsectos,
};
const ORDER = Object.keys(BUILDERS) as Buildable[];
/** How wide each built thing is to Pip and to the camera. */
const RADIUS: Record<Buildable, number> = {
  punto_limpio: 1.1, compostera: 0.9, tanque: 0.9, vivero: 1.3, hotel_insectos: 0.6,
};

function missingLines(id: StationId, lvl: number, paid: Partial<Record<MaterialId, number>>): string[] {
  const cost = nextCost(id, lvl);
  if (!cost) return [];
  const miss = missingFor({ lvl, paid, queue: 0, since: 0, out: 0 }, cost);
  const lines = Object.entries(miss).map(([k, n]) => `${n} ${MATERIALS[k as MaterialId].short.toLowerCase()}`);
  if (cost.semillas) lines.push(`${cost.semillas} semillas`);
  return lines;
}

export function Stations({
  spots,
  heightfield,
  tier,
  shadows,
  onColliders,
  enabled,
}: {
  spots: GameSpots;
  heightfield: Heightfield;
  tier: number;
  shadows?: BlobShadowPool;
  onColliders: (c: PropCollider[]) => void;
  enabled: boolean;
}) {
  const material = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: false }), []);
  const stations = useGameStore((s) => s.state?.stations);
  // The tags need the story too: a site nobody asked for yet says so.
  const game = useGameStore((s) => s.state);
  const setTag = useTags((s) => s.set);
  const removeTag = useTags((s) => s.remove);

  const visible = useMemo(
    () => ORDER.filter((id) => STATIONS[id].tier <= tier && spots.stations[id])
      .map((id) => {
        const spot = spots.stations[id]!;
        return { id, spot, y: sampleHeight(heightfield, spot.x, spot.z) };
      }),
    [spots, tier, heightfield],
  );

  // Colliders and ground shadows follow what is built.
  const builtKey = visible.map((v) => `${v.id}:${stations?.[v.id]?.lvl ?? 0}`).join(',');
  useEffect(() => {
    const colliders: PropCollider[] = [];
    const slots: number[] = [];
    for (const v of visible) {
      const lvl = stations?.[v.id]?.lvl ?? 0;
      if (lvl < 1) continue;
      colliders.push({ x: v.spot.x, z: v.spot.z, radius: RADIUS[v.id], cameraRadius: RADIUS[v.id] + 0.3 });
      if (shadows) {
        const slot = shadows.addStatic(heightfield, v.spot.x, v.spot.z, RADIUS[v.id] * 1.3);
        if (slot >= 0) slots.push(slot);
      }
    }
    onColliders(colliders);
    return () => {
      for (const s of slots) shadows?.releaseStatic(s);
    };
    // `builtKey` is the whole dependency: it changes exactly when a level does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtKey, visible, heightfield, shadows, onColliders]);

  // A built station answers E: its panel. A site does not — you build it by standing on it.
  useEffect(() => {
    const offs: (() => void)[] = [];
    for (const v of visible) {
      const lvl = stations?.[v.id]?.lvl ?? 0;
      if (lvl < 1) continue;
      const def = STATIONS[v.id];
      offs.push(registerInteractable({
        id: `game-station-${v.id}`,
        position: [v.spot.x, v.y, v.spot.z],
        radius: RADIUS[v.id] + 1.6,
        labelKey: 'accion.mojon',
        label: v.id === 'punto_limpio' ? 'Separar residuos' : `Usar ${named(v.id)}`,
        priority: PRIORITY.chore,
        enabled: true,
        onInteract: () => {
          if (v.id === 'punto_limpio') useGameUi.getState().open({ kind: 'separar' });
          else useGameUi.getState().open({ kind: 'estacion', station: v.id });
        },
      }));
    }
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtKey, visible]);

  // Tags: a site says what it still needs; a producer says what is ready.
  useEffect(() => {
    for (const v of visible) {
      const st = stations?.[v.id];
      const lvl = st?.lvl ?? 0;
      const id = `st:${v.id}`;
      const def = STATIONS[v.id];
      if (lvl < 1 && game && !buildOpen(game, v.id)) {
        setTag({ id, x: v.spot.x, y: v.y + 1.1, z: v.spot.z, tone: 'site', within: 7, title: def.name, lines: ['Más adelante'] });
        continue;
      }
      if (lvl < 1) {
        setTag({
          id, x: v.spot.x, y: v.y + 1.1, z: v.spot.z, tone: 'site', within: 16,
          title: `Construí ${named(v.id)}`,
          lines: missingLines(v.id, 0, st?.paid ?? {}),
        });
        continue;
      }
      const ready = st?.out ?? 0;
      const makes = def.makes;
      if (makes && ready > 0) {
        const what = makes.output === 'agua' ? 'agua' : MATERIALS[makes.output].short.toLowerCase();
        setTag({ id, x: v.spot.x, y: v.y + 2.1, z: v.spot.z, tone: 'alert', within: 22, title: `${ready} de ${what} listo${ready > 1 ? 's' : ''}` });
      } else {
        setTag({ id, x: v.spot.x, y: v.y + 2.1, z: v.spot.z, tone: 'station', within: 9, title: def.name });
      }
    }
    return () => {
      for (const v of visible) removeTag(`st:${v.id}`);
    };
  }, [visible, stations, game, setTag, removeTag]);

  // Standing on a site: one piece every beat, until nothing in the bag is needed.
  const lastDrop = useRef(0);
  const lastTick = useRef(0);
  useFrame((state) => {
    if (!enabled || useSessionStore.getState().hud !== 'play') return;
    const now = performance.now();
    const store = useGameStore.getState();
    // Producers advance on the clock; nudge the store now and then so tags update.
    if (now - lastTick.current > 5000) {
      lastTick.current = now;
      const st = store.state;
      if (st) {
        for (const v of visible) {
          const s = st.stations[v.id];
          if (!s || s.lvl < 1 || !STATIONS[v.id].makes) continue;
          const copy = { ...s };
          tickStation(copy, v.id, Date.now());
          if (copy.out !== s.out || (copy.since === 0) !== (s.since === 0)) {
            store.dispatch({ t: 'tick' });
            break;
          }
        }
      }
    }
    if (now - lastDrop.current < GAME.padDropMs) return;
    const p = playerTransform;
    // A drain starts only once Pip has stopped; then it keeps going while they stay.
    const draining = now - lastDrop.current < GAME.padDropMs * 4;
    if (!draining && p.speed > GAME.padStillSpeed) return;
    for (const v of visible) {
      if ((store.state?.stations[v.id]?.lvl ?? 0) >= 1) continue;
      if (Math.hypot(v.spot.x - p.x, v.spot.z - p.z) > GAME.padRadiusM + 0.6) continue;
      if (store.state && !buildOpen(store.state, v.id)) continue;
      const events = store.dispatch({ t: 'deliver', station: v.id }, [v.spot.x, v.y, v.spot.z]);
      if (events.some((e) => e.type === 'delivered')) {
        lastDrop.current = now;
        playSfx('deliver');
        emitFx('dust', v.spot.x + (Math.random() - 0.5) * 0.6, v.y + 0.2, v.spot.z + (Math.random() - 0.5) * 0.6);
        state.invalidate();
      }
      break;
    }
  });

  return (
    <group name="stations">
      {visible.map((v) => {
        const lvl = stations?.[v.id]?.lvl ?? 0;
        const geo = lvl >= 1
          ? getGeometry(`station:${v.id}:${lvl}`, () => BUILDERS[v.id](lvl))
          : getGeometry('station:site', () => constructionSite());
        return (
          <mesh
            key={`${v.id}:${lvl}`}
            geometry={geo}
            material={material}
            position={[v.spot.x, v.y, v.spot.z]}
            rotation={[0, v.spot.rotY, 0]}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
}

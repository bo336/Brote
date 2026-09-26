'use client';

import { useCallback, useMemo, useRef } from 'react';

import type { BlobShadowPool } from '@/lib/render/shadows';
import { parcelsAt } from '@/lib/world/game/parcels';
import { dailySpawns, parcelLitter } from '@/lib/world/game/spawns';
import { gameSpots } from '@/lib/world/game/spots';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import type { PropCollider } from '../../control/CharacterController';
import type { Colliders } from '../../scene/useColliders';
import { useGameStore } from '../useGameStore';
import { Cast } from './Cast';
import { MissionGuide } from './MissionGuide';
import { Parcels } from './Parcels';
import { Pickups } from './Pickups';
import { Restoration } from './Restoration';
import { Stations } from './Stations';
import { TagProjector } from './TagProjector';
import { WaterSources } from './WaterSources';

/**
 * Everything the game adds to the island (`docs/MUNDO_JUEGO.md` §3): what lies
 * around to pick up, the parcels and their state, the stations, the four
 * characters, the restoration you can see, and the guide to the next thing.
 *
 * Mounted by `World` once the island and the game's save both exist. On a
 * visit it draws the host's parcels and stations and nothing you can touch.
 */
export function GameLayer({
  layout,
  heightfield,
  shadows,
  colliders,
  interactive,
}: {
  layout: IslandLayout;
  heightfield: Heightfield;
  shadows?: BlobShadowPool;
  colliders: Colliders;
  /** False on a visit: the host's island is looked at, not played. */
  interactive: boolean;
}) {
  const base = useGameStore((s) => s.base);
  const field = useGameStore((s) => s.field);
  const day = useGameStore((s) => s.state?.today.day ?? '');
  const picked = useGameStore((s) => s.state?.today.picked);
  const parcelStates = useGameStore((s) => s.state?.parcels);
  const tier = base?.tier ?? 1;

  const spots = useMemo(() => gameSpots(base?.who ?? 'demo', layout), [base?.who, layout]);

  const daily = useMemo(() => {
    if (!day) return [];
    const keepClear = [
      ...Object.values(spots.stations).map((s) => ({ x: s!.x, z: s!.z, r: 2.4 })),
      ...Object.values(spots.cast).map((s) => ({ x: s.x, z: s.z, r: 1.2 })),
      { x: spots.ceibo.x, z: spots.ceibo.z, r: 3 },
    ];
    return dailySpawns({ seed: layout.seed, day, tier, terrain: layout.terrain, coastline: layout.coastline, keepClear });
  }, [layout, day, tier, spots]);

  const spawns = useMemo(() => {
    if (!field || !interactive) return [];
    const taken = new Set(picked ?? []);
    const today = daily.filter((sp) => !taken.has(sp.id));
    const litter = parcelsAt(field, tier).flatMap((p) => parcelLitter(p, parcelStates?.[p.id]));
    return [...today, ...litter];
  }, [field, interactive, picked, daily, tier, parcelStates]);

  // Stations and characters both stand in the way; one list for the controller.
  const fromStations = useRef<PropCollider[]>([]);
  const fromCast = useRef<PropCollider[]>([]);
  const onStations = useCallback((c: PropCollider[]) => {
    fromStations.current = c;
    colliders.onGame([...fromStations.current, ...fromCast.current]);
  }, [colliders]);
  const onCast = useCallback((c: PropCollider[]) => {
    fromCast.current = c;
    colliders.onGame([...fromStations.current, ...fromCast.current]);
  }, [colliders]);

  if (!base || !field) return null;
  return (
    <>
      <Restoration layout={layout} heightfield={heightfield} />
      {interactive && <Pickups spawns={spawns} heightfield={heightfield} enabled={interactive} />}
      {interactive && <Parcels heightfield={heightfield} />}
      <Stations spots={spots} heightfield={heightfield} tier={tier} shadows={shadows} onColliders={onStations} enabled={interactive} />
      {interactive && <Cast spots={spots} heightfield={heightfield} terrain={layout.terrain} tier={tier} onColliders={onCast} />}
      {interactive && <MissionGuide layout={layout} spots={spots} spawns={spawns} />}
      {interactive && <WaterSources layout={layout} heightfield={heightfield} />}
      <TagProjector />
    </>
  );
}

'use client';

import { useEffect, useMemo } from 'react';

import { INTERACT } from '@/lib/world/config';
import { regionCentre } from '@/lib/world/layout';
import type { IslandLayout } from '@/lib/world/layout';
import { mulberry32, hashInt } from '@/lib/world/rng';
import { speciesFor } from '@/lib/world/species';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { VERB_TABLE } from '@/lib/world/verbs';
import type { RegionId, SeasonId, TimeOfDay, VerbId, WorldConfig } from '@/lib/world/types';
import { registerInteractable, type RegisteredInteractable } from '../interaction/InteractableRegistry';

/**
 * Where every verb can actually be used.
 *
 * The rule this file exists to keep: **a verb is only offered where it makes
 * sense, and only once the tier has granted it.** Everything is derived from the
 * layout, so it is as deterministic as the island — the fishing spot is in the
 * same place on every device, and so is the chain of tracks in the snow.
 *
 * Movement verbs are absent on purpose. `caminar`, `trepar`, `escalar`,
 * `planear`, `nadar` and `navegar` are conditions of the ground, not things you
 * walk up to and press a button on — they live in `CharacterController` and
 * `verbs/traversal.ts`.
 */
export interface VerbSpot {
  id: string;
  verb: VerbId;
  position: [number, number, number];
  radius: number;
  region: RegionId;
  /** For `registrar`: which species this sighting files. */
  speciesSlug?: string;
  /** For `rastrear`: this print's place in the chain, 0-based. */
  trackIndex?: number;
}

/** How many foraging nodes a region carries at once (`11-GAME-LOOP.md` §3.5). */
const FORAGE_NODES = 6;
/** Prints in a tracking chain. The last one is where the animal is.  */
const TRACK_CHAIN = 5;
const TRACK_STRIDE_M = 3.2;

function anchorSpot(
  layout: IslandLayout,
  heightfield: Heightfield,
  feature: string,
  verb: VerbId,
  radiusScale = 1,
): VerbSpot | null {
  const anchor = layout.anchors.find((a) => a.feature === feature);
  if (!anchor) return null;
  return {
    id: `${verb}-${anchor.id}`,
    verb,
    position: [anchor.x, sampleHeight(heightfield, anchor.x, anchor.z), anchor.z],
    radius: INTERACT.defaultRadiusM * radiusScale,
    region: 'claro',
  };
}

/**
 * Build every spot for the tier. Pure and deterministic: same island, same
 * spots, in the same order.
 */
export function buildVerbSpots(
  layout: IslandLayout,
  heightfield: Heightfield,
  config: WorldConfig,
  timeOfDay: TimeOfDay,
  season: SeasonId,
): VerbSpot[] {
  const spots: VerbSpot[] = [];
  const has = (v: VerbId) => config.verbs.includes(v);
  const push = (spot: VerbSpot | null) => {
    if (spot) spots.push(spot);
  };

  // ── plantar: the stone seed-spot in El Claro, from tier 1.
  if (has('plant')) {
    const [sx, sz] = layout.spawn;
    const x = sx + 1.6;
    const z = sz + 0.9;
    spots.push({
      id: 'seed-spot', verb: 'plant', region: 'claro',
      position: [x, sampleHeight(heightfield, x, z), z], radius: INTERACT.defaultRadiusM,
    });
  }

  // ── regar: any water you can reach — the puddle first, the lagoon later.
  if (has('water')) {
    push(anchorSpot(layout, heightfield, 'puddle', 'water', 1.4));
    for (const lake of layout.terrain.lakes) {
      const x = lake.x + lake.r * 1.1;
      spots.push({
        id: `water-${Math.round(lake.x)}-${Math.round(lake.z)}`, verb: 'water', region: 'rio',
        position: [x, sampleHeight(heightfield, x, lake.z), lake.z], radius: INTERACT.defaultRadiusM * 1.3,
      });
    }
  }

  // ── registrar: the census. One spot per species that could be seen here now,
  //    placed on a scatter point inside its own region.
  if (has('log')) {
    for (const region of layout.regions) {
      if (!region.unlocked) continue;
      const candidates = layout.scatter.filter((p) => p.region === region.id);
      if (candidates.length === 0) continue;
      const visible = speciesFor(region.id, config.tier, timeOfDay, season);
      visible.forEach((species, i) => {
        const point = candidates[(i * 37) % candidates.length]!;
        spots.push({
          id: `log-${species.slug}`, verb: 'log', region: region.id, speciesSlug: species.slug,
          position: [point.x, sampleHeight(heightfield, point.x, point.z), point.z],
          radius: INTERACT.defaultRadiusM,
        });
      });
    }
  }

  // ── recolectar: berry and seed nodes in La Arboleda, from tier 5.
  if (has('forage')) {
    const candidates = layout.scatter.filter((p) => p.region === 'arboleda');
    for (let i = 0; i < Math.min(FORAGE_NODES, candidates.length); i++) {
      const point = candidates[Math.floor((i / FORAGE_NODES) * candidates.length)]!;
      spots.push({
        id: `forage-${i}`, verb: 'forage', region: 'arboleda',
        position: [point.x, sampleHeight(heightfield, point.x, point.z), point.z],
        radius: INTERACT.defaultRadiusM,
      });
    }
  }

  // ── pescar: marked spots on the lagoon's bank, from tier 7.
  if (has('fish')) {
    const lagoon = layout.terrain.lakes[layout.terrain.lakes.length - 1];
    if (lagoon) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.6;
        const x = lagoon.x + Math.cos(a) * lagoon.r * 1.15;
        const z = lagoon.z + Math.sin(a) * lagoon.r * 1.15;
        spots.push({
          id: `fish-${i}`, verb: 'fish', region: 'rio',
          position: [x, sampleHeight(heightfield, x, z), z], radius: INTERACT.defaultRadiusM,
        });
      }
    }
  }

  // ── descansar: the bench, the hammock and the treehouse.
  if (has('rest')) {
    push(anchorSpot(layout, heightfield, 'bench', 'rest'));
    push(anchorSpot(layout, heightfield, 'hammock', 'rest'));
    push(anchorSpot(layout, heightfield, 'treehouse', 'rest', 1.5));
  }

  // ── explorar la cueva, navegar, observar, sembrar en otro mundo: one each.
  if (has('cave')) push(anchorSpot(layout, heightfield, 'cave', 'cave', 1.6));
  if (has('sail')) push(anchorSpot(layout, heightfield, 'boat', 'sail', 1.4));
  if (has('observe')) push(anchorSpot(layout, heightfield, 'telescope', 'observe'));
  if (has('mentor')) push(anchorSpot(layout, heightfield, 'monument', 'mentor', 1.4));

  // ── rastrear: a real chain of prints in the snow, ending where the animal is.
  //    Each print points at the next; the last one is the sighting.
  if (has('track')) {
    const [cx, cz] = regionCentre('cumbre');
    const rng = mulberry32(hashInt(`tracks:${layout.seed}`));
    let x = cx;
    let z = cz;
    let heading = rng() * Math.PI * 2;
    for (let i = 0; i < TRACK_CHAIN; i++) {
      spots.push({
        id: `track-${i}`, verb: 'track', region: 'cumbre', trackIndex: i,
        position: [x, sampleHeight(heightfield, x, z), z], radius: INTERACT.defaultRadiusM,
      });
      heading += (rng() - 0.5) * 0.9;
      x += Math.sin(heading) * TRACK_STRIDE_M;
      z += Math.cos(heading) * TRACK_STRIDE_M;
    }
  }

  return spots;
}

/**
 * Register every spot with the proximity system, and unregister them all on
 * unmount. `onUse` is the one door back into the game: it receives the verb and
 * the spot, and decides what actually happens.
 */
export function useVerbSpots(
  layout: IslandLayout | null,
  heightfield: Heightfield | null,
  config: WorldConfig,
  timeOfDay: TimeOfDay,
  season: SeasonId,
  onUse: (spot: VerbSpot) => void,
): VerbSpot[] {
  const spots = useMemo(
    () => (layout && heightfield ? buildVerbSpots(layout, heightfield, config, timeOfDay, season) : []),
    [layout, heightfield, config, timeOfDay, season],
  );

  useEffect(() => {
    const dispose = spots.map((spot) => {
      const item: RegisteredInteractable = {
        id: spot.id,
        position: spot.position,
        radius: spot.radius,
        labelKey: VERB_TABLE[spot.verb].labelKey,
        verb: spot.verb,
        enabled: true,
        onInteract: () => onUse(spot),
      };
      return registerInteractable(item);
    });
    return () => dispose.forEach((fn) => fn());
  }, [spots, onUse]);

  return spots;
}

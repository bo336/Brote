'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import {
  buildProp, buildMovingPart, buildStructure, getTree, propFootprint, PROP_IDS, PROP_SPECS,
} from '@/lib/render/geometry';
import { buildLeafAtlas } from '@/lib/render/geometry/leaf-atlas';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import { MOORING, SCALE_REFERENCE, WATER_LEVEL, WIND } from '@/lib/world/config';
import { bridgeDeck } from '@/lib/world/decks';
import type { IslandLayout } from '@/lib/world/layout';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { MirrorParams, Placement, PropId, TimeOfDay } from '@/lib/world/types';
import type { BlobShadowPool } from '@/lib/render/shadows';
import type { PropCollider } from '../control/CharacterController';

/**
 * The fixed structures the ladder puts on the island, and the props the player
 * places on it.
 *
 * **The Spanish descriptions are the specification** (`14-CONTENT.md` §3). The
 * windmill turns, and faster when it blows — its RPM is real kWh not spent. The
 * lanterns light at night. The hammock sways on the same wind term as the
 * foliage. A prop whose description promises motion and does not move is a bug.
 */
const SWAY_HZ = WIND.hz * 0.6;
const SWAY_AMPLITUDE = 0.06;
/** Where the demo set is laid out, in metres from the spawn. */
const DEMO_RING_M = 4.2;
/** Blob footprint for a fixed structure, in metres. Props use their own. */
const STRUCTURE_SHADOW = 0.55;
/** Where along its height an ombú forks, as a fraction — the treehouse deck sits there. */
const TREEHOUSE_FORK = 0.6;

/** Where each prop's moving part is mounted, relative to the prop's origin. */
const MOVING_MOUNTS: Partial<Record<PropId, [number, number, number]>> = {
  mundo_molino: [0, 2.4, 0.22],
};

interface PropsProps {
  heightfield: Heightfield;
  layout: IslandLayout;
  mirror: MirrorParams;
  timeOfDay: TimeOfDay;
  placements: readonly Placement[];
  /**
   * Lay one of each prop out around the spawn. Phase 3 has no server placements
   * yet, and the ten props have to be visible to be judged; phase 4 replaces
   * this entirely with `world_placements`.
   */
  demo?: boolean;
  onColliders?: (colliders: PropCollider[]) => void;
  /** Structures and props take a static blob, so they sit on the ground. */
  shadows?: BlobShadowPool;
}

interface Placed {
  key: string;
  slug: PropId;
  geometry: THREE.BufferGeometry;
  moving: THREE.BufferGeometry | null;
  movingMount: [number, number, number];
  position: [number, number, number];
  rotY: number;
  animates: (typeof PROP_SPECS)[PropId]['animates'];
}

export function Props({
  heightfield, layout, mirror, timeOfDay, placements, demo = false, onColliders, shadows,
}: PropsProps) {
  // Wood, stone and cloth all sit still: they take the wobble, never the wind.
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true, built: true }), []);
  const movingRefs = useRef<(THREE.Object3D | null)[]>([]);
  const swayRefs = useRef<(THREE.Object3D | null)[]>([]);
  /** The same leaf material and shadow cut-out as the island's trees (`Vegetation.tsx`). */
  const canopy = useMemo(
    () => getClayMaterial({
      vertexColors: true, wind: true, wobble: false, side: THREE.DoubleSide, alphaTest: 0.5,
      map: getTexture('leaf-atlas', buildLeafAtlas),
    }),
    [],
  );
  const canopyDepth = useMemo(
    () => new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: getTexture('leaf-atlas', buildLeafAtlas), alphaTest: 0.5,
    }),
    [],
  );
  useEffect(() => () => canopyDepth.dispose(), [canopyDepth]);
  /** The treehouse's ombú, scaled so its fork meets the deck. */
  const treehouseTree = useMemo(() => {
    // `oak` is the ombú's shape in the tree builder: the broad umbrella crown.
    const built = getTree('oak', 1, 0);
    if (!built.wood.boundingBox) built.wood.computeBoundingBox();
    const height = built.wood.boundingBox!.max.y || 1;
    return { ...built, scale: (SCALE_REFERENCE.fullTreeM * 0.62) / (height * TREEHOUSE_FORK) };
  }, []);

  /** The fixed structures: one per feature the tier has actually granted. */
  const structures = useMemo(() => {
    return layout.anchors
      .map((anchor) => {
        const geometry = buildStructure(anchor.feature, anchor.span);
        if (!geometry) return null;
        const walkable = anchor.feature === 'bridge';
        const ground = sampleHeight(heightfield, anchor.x, anchor.z);
        // The bridge rests on its banks, not on the riverbed under its middle —
        // the same height the movement solver stands Pip on (`decks.ts`). The
        // boat floats at the water line, whatever the bottom under it does.
        const y = walkable
          ? bridgeDeck(anchor, heightfield).baseY
          : anchor.feature === 'boat' ? WATER_LEVEL - MOORING.floatM : ground;
        return {
          key: anchor.id,
          geometry,
          position: [anchor.x, y, anchor.z] as [number, number, number],
          rotY: anchor.rotY,
          sways: anchor.feature === 'hammock',
          walkable,
          // The treehouse had a platform and a ladder and no tree: a deck floating
          // in the air. It grows its own ombú, sized so the deck sits in the fork.
          tree: anchor.feature === 'treehouse' ? treehouseTree : null,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [layout, heightfield, treehouseTree]);

  /** The placed props — the player's, or the demo ring while there are none. */
  const placed = useMemo<Placed[]>(() => {
    const source: { slug: PropId; x: number; z: number; rotY: number }[] = demo
      ? PROP_IDS.map((slug, i) => {
          const a = (i / PROP_IDS.length) * Math.PI * 2;
          return {
            slug,
            x: layout.spawn[0] + Math.cos(a) * DEMO_RING_M,
            z: layout.spawn[1] + Math.sin(a) * DEMO_RING_M,
            rotY: -a,
          };
        })
      : placements.map((p) => ({ slug: p.prop_slug, x: p.x, z: p.z, rotY: p.rot_y }));

    return source
      .map((p, i) => {
        const geometry = buildProp(p.slug);
        if (!geometry) return null;
        return {
          key: `${p.slug}-${i}`,
          slug: p.slug,
          geometry,
          moving: buildMovingPart(p.slug),
          movingMount: MOVING_MOUNTS[p.slug] ?? [0, 0, 0],
          position: [p.x, sampleHeight(heightfield, p.x, p.z), p.z] as [number, number, number],
          rotY: p.rotY,
          animates: PROP_SPECS[p.slug]?.animates ?? null,
        };
      })
      .filter((p): p is Placed => p !== null);
  }, [demo, placements, layout, heightfield]);

  /**
   * Ground everything. A bench with no shadow reads as a bench hovering over a
   * lawn, and the whole island looked like a sticker sheet until this existed.
   */
  useEffect(() => {
    if (!shadows) return;
    const placedShadows: number[] = [];
    for (const st of structures) {
      // A blob under a bridge would lie on the riverbed; its own planks shade it.
      if (st.walkable) continue;
      const slot = shadows.addStatic(heightfield, st.position[0], st.position[2], STRUCTURE_SHADOW);
      if (slot >= 0) placedShadows.push(slot);
    }
    for (const p of placed) {
      const slot = shadows.addStatic(heightfield, p.position[0], p.position[2], propFootprint(p.slug));
      if (slot >= 0) placedShadows.push(slot);
    }
    return () => {
      for (const slot of placedShadows) shadows.releaseStatic(slot);
    };
  }, [shadows, structures, placed, heightfield]);

  /** Everything solid becomes a collider, so props are things you walk around. */
  useEffect(() => {
    if (!onColliders) return;
    const colliders: PropCollider[] = [
      // A bridge is walked over, so it is a deck, never a post in the way.
      ...structures.filter((s) => !s.walkable).map((s) => ({ x: s.position[0], z: s.position[2], radius: 0.6 })),
      ...placed.map((p) => ({ x: p.position[0], z: p.position[2], radius: propFootprint(p.slug) })),
    ];
    onColliders(colliders);
  }, [structures, placed, onColliders]);

  const night = timeOfDay === 'noche';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // The windmill: revolutions per minute straight from the impact mirror.
    const radiansPerSecond = (mirror.windmillRPM / 60) * Math.PI * 2;
    for (let i = 0; i < movingRefs.current.length; i++) {
      const part = movingRefs.current[i];
      if (part) part.rotation.z = t * radiansPerSecond;
    }
    // The hammock: the same low sine the foliage sways on, so they agree.
    for (const sway of swayRefs.current) {
      if (sway) sway.rotation.z = Math.sin(t * SWAY_HZ * Math.PI * 2) * SWAY_AMPLITUDE;
    }
  });

  return (
    <group name="props">
      {structures.map((s, i) => (
        <group
          key={s.key}
          position={s.position}
          rotation={[0, s.rotY, 0]}
          ref={(node) => {
            if (s.sways) swayRefs.current[i] = node;
          }}
        >
          <mesh geometry={s.geometry} material={solid} castShadow receiveShadow />
          {s.tree && (
            <group scale={s.tree.scale}>
              <mesh geometry={s.tree.wood} material={solid} castShadow receiveShadow />
              <mesh
                geometry={s.tree.leaves}
                material={canopy}
                customDepthMaterial={canopyDepth}
                castShadow
                receiveShadow
              />
            </group>
          )}
        </group>
      ))}

      {placed.map((p, i) => (
        <group key={p.key} position={p.position} rotation={[0, p.rotY, 0]}>
          <mesh geometry={p.geometry} material={solid} castShadow receiveShadow />
          {p.moving && (
            <group
              position={p.movingMount}
              ref={(node) => {
                movingRefs.current[i] = node;
              }}
            >
              <mesh geometry={p.moving} material={solid} />
            </group>
          )}
          {/* The lanterns light at night — the one prop whose description is a
              lighting promise. A small unlit sphere is cheaper and calmer than
              a real light, and the budget has no room for a fifth light. */}
          {p.animates === 'lantern' && night && (
            <pointLight
              color={DOMAIN_COLORS.energia}
              intensity={Math.min(1, mirror.lanternCount / 8)}
              distance={5}
              position={[1.1, 1.5, 0]}
            />
          )}
        </group>
      ))}
    </group>
  );
}

/** Re-exported so the controller and the placement validator agree on footprints. */
export { propFootprint };
export type { PropCollider };

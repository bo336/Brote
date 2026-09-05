'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildProp, buildMovingPart, buildStructure, propFootprint, PROP_IDS, PROP_SPECS } from '@/lib/render/geometry';
import { getClayMaterial } from '@/lib/render/materials';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import { WIND } from '@/lib/world/config';
import type { IslandLayout } from '@/lib/world/layout';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { MirrorParams, Placement, PropId, TimeOfDay } from '@/lib/world/types';
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
  heightfield, layout, mirror, timeOfDay, placements, demo = false, onColliders,
}: PropsProps) {
  // Wood, stone and cloth all sit still: they take the wobble, never the wind.
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);
  const movingRefs = useRef<(THREE.Object3D | null)[]>([]);
  const swayRefs = useRef<(THREE.Object3D | null)[]>([]);

  /** The fixed structures: one per feature the tier has actually granted. */
  const structures = useMemo(() => {
    return layout.anchors
      .map((anchor) => {
        const geometry = buildStructure(anchor.feature);
        if (!geometry) return null;
        return {
          key: anchor.id,
          geometry,
          position: [anchor.x, sampleHeight(heightfield, anchor.x, anchor.z), anchor.z] as [number, number, number],
          rotY: anchor.rotY,
          sways: anchor.feature === 'hammock',
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [layout, heightfield]);

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

  /** Everything solid becomes a collider, so props are things you walk around. */
  useEffect(() => {
    if (!onColliders) return;
    const colliders: PropCollider[] = [
      ...structures.map((s) => ({ x: s.position[0], z: s.position[2], radius: 0.6 })),
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
          <mesh geometry={s.geometry} material={solid} />
        </group>
      ))}

      {placed.map((p, i) => (
        <group key={p.key} position={p.position} rotation={[0, p.rotY, 0]}>
          <mesh geometry={p.geometry} material={solid} />
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

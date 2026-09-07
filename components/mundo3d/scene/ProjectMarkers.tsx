'use client';

import { useEffect, useMemo } from 'react';

import { InstancePool } from '@/lib/render/instancing';
import { buildProp } from '@/lib/render/geometry';
import { getClayMaterial } from '@/lib/render/materials';
import { MARKERS } from '@/lib/world/config';
import { sampleHeight, sampleSlope, type Heightfield } from '@/lib/world/terrain';
import type { ProjectMarker } from '@/lib/world/types';

/**
 * The stones themselves.
 *
 * A small cairn for each real project — the same stacked-stone shape the player
 * can buy as a `tótem`, at half size, because a commemorative marker should
 * look like something somebody piled up rather than like a monument the game
 * issued.
 *
 * One instanced mesh for all twelve: one draw call, one material, and the same
 * pool every other repeated thing on the island goes through.
 */
const MARKER_SCALE = 0.5;

export function ProjectMarkers({
  markers,
  heightfield,
}: {
  markers: readonly ProjectMarker[];
  heightfield: Heightfield;
}) {
  // The cairn shares the props' material — placement is not a different art
  // style, and neither is memory.
  const material = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);
  const geometry = useMemo(() => buildProp('mundo_totem'), []);

  const pool = useMemo(
    () => (geometry ? new InstancePool(geometry, material, MARKERS.max, { name: 'projectMarkers' }) : null),
    [geometry, material],
  );

  useEffect(() => {
    if (!pool) return;
    for (const m of markers) {
      const i = pool.alloc();
      if (i < 0) break;
      const y = sampleHeight(heightfield, m.x, m.z);
      const slope = sampleSlope(heightfield, m.x, m.z);
      // Facing is derived from the stone's own position, so the path does not
      // read as a row of identical objects placed by a machine.
      const yaw = Math.atan2(m.x, m.z);
      pool.place(i, m.x, y, m.z, yaw, MARKER_SCALE, slope * 0.4, 0);
    }
    pool.resize(markers.length);
    pool.commit();
  }, [pool, markers, heightfield]);

  useEffect(() => () => pool?.dispose(), [pool]);

  if (!pool) return null;
  return <primitive object={pool.mesh} />;
}

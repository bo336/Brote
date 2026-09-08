'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { getGeometry } from '@/lib/render/geometry';
import { stickerGeometry, STICKER_KINDS, type StickerKind } from '@/lib/render/geometry/sticker';
import { getClayMaterial } from '@/lib/render/materials';
import { InstancePool } from '@/lib/render/instancing';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { Sticker } from '@/lib/world/visit';

/**
 * Every sticker anyone has left on this island, in the last month.
 *
 * One pool per kind rather than one mesh per sticker: there are eight shapes
 * and an unbounded number of tokens, and an island somebody visits a lot would
 * otherwise be eight hundred draw calls of medallion.
 *
 * They lie flat and they do not sway. A sticker is a thing somebody put down,
 * not a thing that grows, and the wind chunk on a two-centimetre disc reads as
 * a bug rather than as life.
 */
const MAX_PER_KIND = 24;

export function Stickers({
  stickers,
  heightfield,
}: {
  stickers: readonly Sticker[];
  heightfield: Heightfield;
}) {
  const material = useMemo(
    () => getClayMaterial({ vertexColors: true, wind: false, wobble: false }),
    [],
  );

  const pools = useMemo(
    () =>
      STICKER_KINDS.map((kind) =>
        new InstancePool(
          getGeometry(`sticker:${kind}`, () => stickerGeometry(kind as StickerKind)),
          material,
          MAX_PER_KIND,
          { name: `sticker_${kind}` },
        ),
      ),
    [material],
  );

  useEffect(() => {
    for (const pool of pools) pool.reset();
    for (const s of stickers) {
      const k = STICKER_KINDS.indexOf(s.sticker);
      const pool = pools[k];
      if (!pool) continue;
      const i = pool.alloc();
      if (i < 0) continue;
      // Sunk a few millimetres so the rim meets the ground instead of hovering
      // over the bumps in it.
      pool.place(i, s.x, sampleHeight(heightfield, s.x, s.z) - 0.01, s.z, s.x * 1.7 + s.z, 1);
    }
    for (const pool of pools) pool.commit();
  }, [pools, stickers, heightfield]);

  useEffect(() => () => pools.forEach((p) => p.dispose()), [pools]);

  return (
    <group name="stickers">
      {pools.map((pool) => (
        <primitive key={pool.mesh.name} object={pool.mesh as THREE.Object3D} />
      ))}
    </group>
  );
}

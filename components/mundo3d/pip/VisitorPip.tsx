'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

import { applyCosmetics, applyStage, buildPip, disposePip } from '@/lib/render/geometry/pip';
import { getClayMaterial, getOverlayMaterial } from '@/lib/render/materials';
import { pipStageForTier } from '@/lib/mundo';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { PipCosmetics } from '@/lib/world/types';
import { PipRig } from './PipRig';

/**
 * The host's Pip, standing on their own island while somebody visits.
 *
 * **LOD 1** (`09-PIP.md` §2): there are two Pips on screen and only one of them
 * is the camera's subject. It idles and never walks — a visit is a snapshot,
 * and a second Pip that wandered would imply the other player is there.
 *
 * It carries no pattern material. A pattern is a texture, and spending one on
 * a figure standing still at the far end of the island is not a trade worth
 * making; the palette, the hat, the glasses and the stage all still read.
 */
export function VisitorPip({
  layout,
  heightfield,
  cosmetics,
  tier,
}: {
  layout: IslandLayout;
  heightfield: Heightfield;
  cosmetics: PipCosmetics;
  /** Their rank, which is what decides whether Pip has leaves yet. */
  tier: number;
}) {
  const solid = useMemo(
    () => getClayMaterial({ vertexColors: true, wobble: false, wind: false, ao: false }),
    [],
  );
  const overlay = useMemo(() => getOverlayMaterial(), []);
  const root = useMemo(() => buildPip(1), []);
  const rig = useMemo(() => new PipRig(root), [root]);

  useEffect(() => () => disposePip(root), [root]);

  useEffect(() => {
    applyCosmetics(root, cosmetics, { solid, overlay });
    applyStage(root, pipStageForTier(tier));
  }, [root, cosmetics, tier, solid, overlay]);

  useEffect(() => {
    // Standing a couple of metres off the spawn, so a visitor arriving does not
    // land inside them.
    const [sx, sz] = layout.spawn;
    const x = sx + 2.2;
    const z = sz + 1.4;
    root.position.set(x, sampleHeight(heightfield, x, z), z);
    root.rotation.y = Math.PI * 0.75;
    rig.setState('idle');
  }, [root, rig, layout, heightfield]);

  useFrame((_, delta) => rig.update(delta, performance.now() / 1000));

  return <primitive object={root} />;
}

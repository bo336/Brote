'use client';

import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';

import { BLOB_SHADOW, PIP_HEIGHT_M } from '@/lib/world/config';
import { getFlatMaterial, getTexture } from '@/lib/render/materials';
import { BlobShadowPool, buildBlobTexture } from '@/lib/render/shadows';
import { TIERS } from '@/lib/render/quality';
import type { QualityTier } from '@/lib/world/types';
import type { PipHandle } from '../pip/Pip';

/**
 * Every shadow in the game: one instanced mesh, one draw call.
 *
 * Sized once at the T3 ceiling, like every other pool, so changing quality tier
 * never allocates. Split out of `World` for the 400-line rule; it is one system
 * with one lifetime, which is exactly the seam worth cutting on.
 */

/**
 * Static slots: the T3 tree and rock budgets, plus the structures and placed
 * props.
 */
const STATIC_SHADOWS = TIERS[3].trees + TIERS[3].rocks + 64;
/**
 * Moving slots: Pip, plus the two ground-walking fauna kinds at their T3 cap.
 * Fliers and fish get none — a bird at 2.4 m is most of the way through the
 * height fade already, and the fish are under the water.
 */
const MOVING_SHADOWS = TIERS[3].fauna * 2 + 4;

export function useBlobShadows(pipRef: React.MutableRefObject<PipHandle>, tier: QualityTier): BlobShadowPool {
  const scene = useThree((s) => s.scene);

  const shadowMaterial = useMemo(() => {
    const map = getTexture('blob-shadow', buildBlobTexture);
    return getFlatMaterial({
      map, transparent: true, opacity: BLOB_SHADOW.maxOpacity, depthWrite: false, polygonOffset: -4,
    });
  }, []);

  const shadows = useMemo(
    () => new BlobShadowPool(shadowMaterial, MOVING_SHADOWS, STATIC_SHADOWS),
    [shadowMaterial],
  );

  useEffect(() => {
    scene.add(shadows.mesh);
    return () => {
      scene.remove(shadows.mesh);
      shadows.dispose();
    };
  }, [scene, shadows]);

  // Where the sun casts real shadows, a blob under every tree is a second shadow.
  useEffect(() => {
    shadows.mesh.visible = !TIERS[tier].realShadows;
  }, [shadows, tier]);

  useEffect(() => {
    const root = pipRef.current.root;
    if (!root) return;
    // A touch wider than Pip is, so the shadow reads past his own silhouette —
    // from behind at -28 degrees his body covers most of what sits under him.
    const slot = shadows.attach(root, PIP_HEIGHT_M * 0.5);
    return () => shadows.detach(slot);
  }, [shadows, pipRef]);

  return shadows;
}

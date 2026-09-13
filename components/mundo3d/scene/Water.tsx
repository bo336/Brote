'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { buildOpenSea, buildWaterMeshes } from '@/lib/render/geometry/terrain';
import { buildRiverMeshes } from '@/lib/render/geometry/river';
import { heightInfo, heightTextureFor } from '@/lib/render/height-texture';
import * as THREE from 'three';

import { currentSun, getWaterMaterial, tickWaterMaterials } from '@/lib/render/materials';
import { applyWaterLight, setWaterTier } from '@/lib/render/materials/water';
import type { WorldPalette } from '@/lib/render/palette';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import { SEA_DEPTH_M, WATER } from '@/lib/world/config';
import type { QualityTier } from '@/lib/world/types';

/**
 * Water — the one reflective surface in the game, and therefore the thing the
 * eye goes to. That is deliberate (`06-ART-DIRECTION.md` §2 rule 6).
 *
 * Two kinds. The **inland** bodies — the puddle, the lagoon — are carved by the
 * same height function as everything else, so `isWater`, `isPlantable` and
 * these meshes all agree about where the water is without a line of
 * special-casing. And the **open sea**, which is not carved by anything,
 * because the height function says the world outside the coastline is dry land
 * that simply is not drawn. It is the horizon, and without it the island is a
 * disc floating in the sky dome.
 *
 * `flow` comes from `MirrorParams.riverFlow` — real litres not spent, made
 * visible as the speed of the surface.
 */
export function Water({
  heightfield,
  layout,
  palette,
  tier,
  flow,
}: {
  heightfield: Heightfield;
  layout: IslandLayout;
  palette: WorldPalette;
  tier: QualityTier;
  flow: number;
}) {
  // Basins, and the river running down its channel (`geometry/river.ts`).
  const meshes = useMemo(
    () => [...buildWaterMeshes(layout.terrain, heightfield), ...buildRiverMeshes(layout.terrain, heightfield)],
    [layout, heightfield],
  );
  /**
   * **The deepest body, not the first one.**
   *
   * `meshes[0]` is whichever lake the layout happened to list first, and on
   * every island that is La Pradera's puddle — a few centimetres deep. The
   * lagoon was being normalised against a puddle, so it rendered as uniformly
   * deep, and the open sea inherited a depth of about nine centimetres, which
   * is inside the foam width: the whole ocean came out speckled with surf.
   */
  const depthScale = meshes.reduce((deepest, m) => Math.max(deepest, m.maxDepth), 1);
  /**
   * The sea is simply deep. The shader clamps `depth / depthScale` at one, so
   * any value past the deepest lake reads as "as deep as water gets" — no
   * bottom, and comfortably past the foam width, which is what keeps surf at
   * the shore instead of scattered over the whole ocean.
   */
  const sea = useMemo(() => buildOpenSea(layout, SEA_DEPTH_M), [layout]);
  // Built once. A tier change retunes three uniforms rather than compiling a
  // second water shader (`07-RENDER-ARCHITECTURE.md` §4.3).
  const initialTier = useRef(tier).current;
  const material = useMemo(
    () => getWaterMaterial({ tier: initialTier, color: palette.water, depthScale }),
    [initialTier, palette.water, depthScale],
  );
  // A puddle is not a shore (`WATER.puddleRadiusM`): its own material, with no
  // surf, a thin wet line, and colour measured against its own few centimetres.
  const puddleMaterial = useMemo(
    () => getWaterMaterial({
      tier: initialTier, color: palette.water, depthScale: WATER.puddleDepthScaleM, foamWidth: WATER.puddleFoamM,
    }),
    [initialTier, palette.water],
  );
  useEffect(() => {
    setWaterTier(material, tier);
    setWaterTier(puddleMaterial, tier);
  }, [material, puddleMaterial, tier]);
  // The ground's height, so the surface measures its true depth per pixel and
  // its shoreline is the ground's own curve rather than its mesh's grid.
  useEffect(() => {
    for (const mat of [material, puddleMaterial]) {
      const u = mat.waterUniforms;
      u.uHeightTex!.value = heightTextureFor(heightfield);
      heightInfo(heightfield, u.uHeightInfo!.value as THREE.Vector4);
    }
  }, [material, puddleMaterial, heightfield]);

  useEffect(() => () => meshes.forEach((m) => m.geometry.dispose()), [meshes]);
  useEffect(() => () => sea.geometry.dispose(), [sea]);

  // The sky it reflects, from the palette; the sun, from the same place the lights put it.
  const zenith = useMemo(() => new THREE.Color(palette.skyTop), [palette.skyTop]);
  const horizon = useMemo(() => new THREE.Color(palette.skyHorizon), [palette.skyHorizon]);
  useFrame(({ clock }) => {
    tickWaterMaterials(clock.elapsedTime, flow);
    const sun = currentSun();
    applyWaterLight(material, sun.dir, sun.color, zenith, horizon);
    applyWaterLight(puddleMaterial, sun.dir, sun.color, zenith, horizon);
  });

  return (
    <group name="water">
      {/* The sea first, and behind everything: it is the furthest thing in the
          world that is not the sky. */}
      <mesh name="openSea" geometry={sea.geometry} material={material} renderOrder={1} />
      {meshes.map((m, i) => (
        <mesh key={i} geometry={m.geometry} material={m.puddle ? puddleMaterial : material} renderOrder={2} />
      ))}
    </group>
  );
}

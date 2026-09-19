'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { getOverlayMaterial } from '@/lib/render/materials';
import { coastRadiusAt, type IslandLayout } from '@/lib/world/layout';
import { tierForRegion } from '@/lib/world/progression';
import type { WorldPalette } from '@/lib/render/palette';
import type { WorldConfig } from '@/lib/world/types';

/**
 * The mist wall, and the ghost behind it.
 *
 * **The player can always see the future** (`08-WORLD-AND-PROGRESSION.md` §1).
 * A locked region is not an invisible wall and not a black void: it is a bank
 * of low mist at the boundary, with the faint silhouette of what is coming
 * still readable behind it.
 *
 * One geometry, vertex-coloured, sharing the sky's flat material — it costs one
 * draw call and no texture.
 */
const BAND_HEIGHT = 1.9;
const BAND_SEGMENTS = 72;
/** How far past the unlocked ground the mist sits. */
const BAND_INSET = 0.94;
/** Peak opacity at the base of the band, facing a locked region. */
const MIST_OPACITY = 0.6;
/** The band never disappears entirely while anything is locked. */
const MIST_BASE = 0.35;
/** The ghosted silhouette behind it — readable, never solid. */
const GHOST_OPACITY = 0.2;
/** A low mound on the horizon, not a dome over the island. */
const GHOST_SCALE = 0.3;
const GHOST_LIFT = 0.4;

export function MistWall({
  layout,
  config,
  palette,
}: {
  layout: IslandLayout;
  config: WorldConfig;
  palette: WorldPalette;
}) {
  const material = useMemo(() => getOverlayMaterial(), []);

  /**
   * The band covers only the arcs that face a locked region, so an island whose
   * every region is unlocked shows no mist at all rather than a ring of haze
   * around a finished world.
   */
  const geometry = useMemo(() => {
    const locked = layout.regions.filter((r) => !r.unlocked);
    if (locked.length === 0) return null;

    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const fog = new THREE.Color(palette.fog);

    for (let s = 0; s <= BAND_SEGMENTS; s++) {
      const angle = (s / BAND_SEGMENTS) * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      // The band rings the whole coastline, and thickens toward the direction a
      // locked region is actually waiting in — so the mist reads as "the island
      // continues over there" rather than as a wall around a finished world.
      let nearestAngle = Math.PI;
      for (const region of locked) {
        const toRegion = Math.atan2(region.z, region.x);
        const d = Math.abs(Math.atan2(Math.sin(angle - toRegion), Math.cos(angle - toRegion)));
        nearestAngle = Math.min(nearestAngle, d);
      }
      const density = MIST_BASE + (1 - MIST_BASE) * Math.max(0, 1 - nearestAngle / (Math.PI / 2));
      const rim = coastRadiusAt(layout.coastline, angle) * BAND_INSET;

      positions.push(x * rim, 0, z * rim, x * rim, BAND_HEIGHT, z * rim);
      // Four components: the alpha is what makes this a bank of LOW mist that
      // only exists where the island stops, rather than a ring of haze around
      // a finished world. Dense at the base, gone at the top.
      colors.push(fog.r, fog.g, fog.b, density * MIST_OPACITY);
      colors.push(fog.r, fog.g, fog.b, 0);
      if (s < BAND_SEGMENTS) {
        const a = s * 2;
        indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [layout, palette.fog]);

  /**
   * The ghost: the silhouette of the region one tier away, faint but readable.
   * It carries its own alpha in the same colour attribute, so it shares the
   * mist's material rather than needing one of its own.
   */
  const ghosts = useMemo(() => {
    const fog = new THREE.Color(palette.fog);
    return layout.regions
      .filter((r) => {
        if (r.unlocked || tierForRegion(r.id) !== config.tier + 1) return false;
        // Only ghost what is genuinely BEYOND the coastline. A region whose
        // centre already sits on walkable ground is not "coming over there" —
        // it is right here, and drawing a translucent dome over it reads as a
        // rendering fault rather than as a promise.
        return Math.hypot(r.x, r.z) > layout.radius;
      })
      .map((r) => {
        const geo = new THREE.SphereGeometry(r.radius * GHOST_SCALE, 10, 6);
        const count = (geo.attributes.position as THREE.BufferAttribute).count;
        const colors = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          colors[i * 4] = fog.r;
          colors[i * 4 + 1] = fog.g;
          colors[i * 4 + 2] = fog.b;
          colors[i * 4 + 3] = GHOST_OPACITY;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        return { id: r.id, geometry: geo, position: [r.x, GHOST_LIFT, r.z] as [number, number, number] };
      });
  }, [layout, config.tier, palette.fog]);

  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => ghosts.forEach((g) => g.geometry.dispose()), [ghosts]);

  if (!geometry) return null;
  return (
    <group name="mistWall">
      <mesh geometry={geometry} material={material} renderOrder={3} />
      {/* The ghost: the silhouette of the next region, faintly, behind the mist. */}
      {ghosts.map((g) => (
        <mesh key={g.id} geometry={g.geometry} material={material} position={g.position} renderOrder={2} />
      ))}
    </group>
  );
}

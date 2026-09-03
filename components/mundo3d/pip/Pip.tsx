'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { applyCosmetics, applyStage, buildPatternAtlas, buildPip, disposePip } from '@/lib/render/geometry/pip';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { usePlayerStore } from '../state/usePlayerStore';
import { PipRig } from './PipRig';

/**
 * Pip in the world.
 *
 * Mounts the procedural root, hands it to `PipRig` — **the one owner of the
 * transform** — and subscribes to the cosmetics store so equipping is instant
 * and optimistic.
 *
 * Two materials, both shared and both cached: a solid vertex-coloured clay for
 * the body, leaves, face and every hat, and one atlas-mapped clay for the
 * pattern shell. Changing a palette repaints a colour attribute; it never
 * compiles a shader (`09-PIP.md` §4).
 *
 * **Pip moves, so Pip does not wobble.** The handmade wobble is deterministic
 * from world position, which means it would shimmer on anything that travels
 * (`06-ART-DIRECTION.md` §5).
 */
export interface PipHandle {
  root: THREE.Object3D | null;
  rig: PipRig | null;
}

interface PipProps {
  /** Filled in on mount so the camera and the shadow pool can follow it. */
  handle?: React.MutableRefObject<PipHandle>;
  lod?: 0 | 1 | 2;
}

export function Pip({ handle, lod = 0 }: PipProps) {
  const cosmetics = usePlayerStore((s) => s.cosmetics);
  const stage = usePlayerStore((s) => s.stage);
  const golden = usePlayerStore((s) => s.golden);
  const aura = usePlayerStore((s) => s.aura);
  const state = usePlayerStore((s) => s.state);
  const rigRef = useRef<PipRig | null>(null);

  // The two materials Pip is drawn with, both from the shared cache.
  const solid = useMemo(
    () => getClayMaterial({ vertexColors: true, wobble: false, wind: false, ao: false }),
    [],
  );
  /**
   * Built **only when a pattern is actually equipped**. Most Pips have none, and
   * a material that exists for nothing still counts against the budget of eight.
   * The atlas is an alpha mask over the body's own colour: one texture, moved by
   * UV offset, for all seven patterns.
   */
  const hasPattern = !!cosmetics.pattern && cosmetics.pattern !== 'ninguno';
  const patternMaterial = useMemo(() => {
    if (!hasPattern) return undefined;
    const texture = getTexture('pip-patterns', () => {
      const tex = new THREE.CanvasTexture(buildPatternAtlas());
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.name = 'pipPatterns';
      return tex;
    });
    return getClayMaterial({
      vertexColors: true, wobble: false, wind: false, ao: false, transparent: true, alphaMap: texture,
    });
  }, [hasPattern]);

  const root = useMemo(() => buildPip(lod), [lod]);

  useEffect(() => {
    const rig = new PipRig(root);
    rigRef.current = rig;
    if (handle) handle.current = { root, rig };
    return () => {
      rigRef.current = null;
      if (handle) handle.current = { root: null, rig: null };
      disposePip(root);
    };
  }, [root, handle]);

  // Equipping is a repaint and a `visible` toggle — never a load, never a
  // network round trip, never a material.
  useEffect(() => {
    applyCosmetics(root, cosmetics, { golden, aura, solid, patternMaterial });
    applyStage(root, stage);
  }, [root, cosmetics, golden, aura, stage, solid, patternMaterial]);

  useEffect(() => {
    rigRef.current?.setState(state);
  }, [state]);

  useFrame((_, delta) => {
    rigRef.current?.update(delta, performance.now() / 1000);
  });

  return <primitive object={root} />;
}

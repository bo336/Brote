'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

import { isPlantable } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { Heightfield } from '@/lib/world/terrain';
import type { Placement, PropId } from '@/lib/world/types';
import { PlacementGhost, useGroundPointer } from './PlacementGhost';
import { playerTransform } from '../state/usePlayerStore';
import type { Ghost } from './usePlacementEditor';

/**
 * The in-canvas half of placement mode: the ghost, and the drag that moves it.
 *
 * It lives inside `<Canvas>` because that is the only place the camera is, and
 * the drag needs the camera to turn a finger into a point on the ground. The
 * controls are in the HUD, outside; the two halves talk through the editor hook
 * that the parent owns.
 */
export function PlacementMode({
  layout,
  heightfield,
  ghost,
  onMove,
  onReady,
}: {
  layout: IslandLayout;
  heightfield: Heightfield;
  ghost: Ghost | null;
  onMove: (x: number, z: number) => void;
  /**
   * Handed up so the HUD can put a newly picked prop somewhere sensible: in
   * front of Pip, which is where somebody looking at their island expects the
   * thing they just tapped to appear.
   */
  onReady: (place: (slug: PropId) => { x: number; z: number }) => void;
}) {
  const gl = useThree((s) => s.gl);
  const toGround = useGroundPointer(heightfield);
  const dragging = useRef(false);

  /** A couple of metres ahead of Pip, on the ground. */
  const inFrontOfPip = useCallback(() => {
    const p = playerTransform;
    const ahead = 1.8;
    return { x: p.x + Math.sin(p.yaw) * ahead, z: p.z + Math.cos(p.yaw) * ahead };
  }, []);

  useEffect(() => {
    onReady(() => inFrontOfPip());
  }, [onReady, inFrontOfPip]);

  /**
   * Dragging the ghost.
   *
   * Bound to the canvas rather than to React's synthetic events because the
   * joystick and the camera drag are already on the same surface: placement
   * mode suspends both, and taking the pointer here keeps that unambiguous.
   */
  useEffect(() => {
    if (!ghost) return;
    const canvas = gl.domElement;

    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect = canvas.getBoundingClientRect();
      const hit = toGround(e.clientX, e.clientY, rect, playerTransform.y);
      if (hit) onMove(hit[0], hit[1]);
    };
    const down = (e: PointerEvent) => {
      dragging.current = true;
      move(e);
    };
    const up = () => {
      dragging.current = false;
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      dragging.current = false;
    };
  }, [ghost, gl, toGround, onMove]);

  return <PlacementGhost ghost={ghost} heightfield={heightfield} />;
}

/** Can something stand here? The same test the scatter uses to plant. */
export function makeGroundTest(layout: IslandLayout) {
  return (x: number, z: number) => isPlantable(x, z, layout.terrain);
}

/** Where the props already down are, for the editor to nudge against. */
export function placementsOf(list: readonly Placement[]): Placement[] {
  return [...list];
}

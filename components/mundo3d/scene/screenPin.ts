'use client';

import * as THREE from 'three';

import { GUIDE } from '@/lib/world/config';

const v = new THREE.Vector3();

/**
 * Hang a DOM label over a point in the world, from the frame loop.
 *
 * With an `arrow`, a point off screen or behind the lens keeps its label just
 * inside the nearest edge, and the arrow turns to point the way — the pattern
 * every game uses for "your quest is over there". Without one, the label simply
 * hides. Returns whether the point itself is on screen.
 *
 * Only a transform string is built, and only while there is a label to move.
 */
export function pinToScreen(
  el: HTMLElement,
  camera: THREE.Camera,
  size: { width: number; height: number },
  x: number, y: number, z: number,
  arrow: HTMLElement | null,
): boolean {
  v.set(x, y, z).project(camera);
  const w = size.width;
  const h = size.height;
  const behind = v.z > 1;
  let sx = (v.x * 0.5 + 0.5) * w;
  let sy = (-v.y * 0.5 + 0.5) * h;
  const side = GUIDE.pinEdgeSidePx;
  const top = GUIDE.pinEdgeTopPx;
  const bottom = GUIDE.pinEdgeBottomPx;
  const onScreen = !behind && sx >= side && sx <= w - side && sy >= top && sy <= h - bottom;
  if (!onScreen && !arrow) {
    el.style.opacity = '0';
    return false;
  }
  if (!onScreen && arrow) {
    // From the middle of the free area toward the point, out to its edge.
    const cx = w / 2;
    const cy = (top + h - bottom) / 2;
    let dx = sx - cx;
    let dy = sy - cy;
    // Behind the lens the projection mirrors: flip it, and lean it toward the bottom edge.
    if (behind) {
      dx = -dx;
      dy = Math.abs(dy) + h * 0.25;
    }
    const kx = (w / 2 - side) / Math.max(1e-3, Math.abs(dx));
    const ky = (dy < 0 ? cy - top : h - bottom - cy) / Math.max(1e-3, Math.abs(dy));
    const k = Math.max(0, Math.min(kx, ky));
    sx = cx + dx * k;
    sy = cy + dy * k;
    arrow.style.opacity = '1';
    arrow.style.transform = `rotate(${Math.round(Math.atan2(dy, dx) * 100) / 100}rad)`;
  } else if (arrow) {
    arrow.style.opacity = '0';
  }
  el.style.opacity = '1';
  el.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0)`;
  return onScreen;
}

/** Hide a pinned label (and its arrow). */
export function hidePin(el: HTMLElement | null, arrow: HTMLElement | null = null): void {
  if (el) el.style.opacity = '0';
  if (arrow) arrow.style.opacity = '0';
}

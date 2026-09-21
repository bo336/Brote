'use client';

import * as THREE from 'three';

import { GUIDE } from '@/lib/world/config';
import type { PinPlace } from '../hud/labelSlots';

const v = new THREE.Vector3();
/** A label with no size to keep on screen: shared, so a call without one allocates nothing. */
const NO_EXTENT = { w: 0, h: 0 } as const;

/**
 * Hang a DOM label over a point in the world, from the frame loop.
 *
 * With an `arrow`, a point off screen or behind the lens keeps its whole label
 * (`extent`, its size) inside the free part of the screen — below the goal card
 * and the zoom buttons, above the thumbs' buttons — and the arrow turns to point
 * the way: the pattern every game uses for "your quest is over there". Without
 * one, the label shows wherever the point is on screen and hides when it is not.
 * Returns whether the point itself is inside the free area.
 *
 * Only a transform string is built, and only while there is a label to move.
 */
export function pinToScreen(
  el: HTMLElement,
  camera: THREE.Camera,
  size: { width: number; height: number },
  x: number, y: number, z: number,
  arrow: HTMLElement | null,
  extent: { w: number; h: number } = NO_EXTENT,
  out: PinPlace | null = null,
): boolean {
  v.set(x, y, z).project(camera);
  const w = size.width;
  const h = size.height;
  const behind = v.z > 1;
  let sx = (v.x * 0.5 + 0.5) * w;
  let sy = (-v.y * 0.5 + 0.5) * h;

  if (!arrow) {
    const visible = !behind && sx >= 0 && sx <= w && sy >= 0 && sy <= h;
    el.style.opacity = visible ? '1' : '0';
    if (visible) el.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0)`;
    if (out) {
      out.x = sx;
      out.y = sy;
      out.shown = visible;
    }
    return visible;
  }

  // Where the label's anchor (its bottom centre) may sit with all of it on screen.
  const xMin = GUIDE.pinEdgeSidePx + extent.w / 2;
  const xMax = Math.max(xMin, w - GUIDE.pinEdgeSidePx - extent.w / 2);
  const yMin = GUIDE.pinEdgeTopPx + extent.h;
  const yMax = Math.max(yMin, h - GUIDE.pinEdgeBottomPx);
  const onScreen = !behind && sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax;
  if (!onScreen) {
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    let dx = sx - cx;
    let dy = sy - cy;
    // Behind the lens the projection mirrors: flip it, and lean it toward the bottom edge.
    if (behind) {
      dx = -dx;
      dy = Math.abs(dy) + h * 0.25;
    }
    const kx = (xMax - cx) / Math.max(1e-3, Math.abs(dx));
    const ky = (dy < 0 ? cy - yMin : yMax - cy) / Math.max(1e-3, Math.abs(dy));
    const k = Math.max(0, Math.min(kx, ky));
    sx = cx + dx * k;
    sy = cy + dy * k;
    arrow.style.opacity = '1';
    arrow.style.transform = `rotate(${Math.round(Math.atan2(dy, dx) * 100) / 100}rad)`;
  } else {
    arrow.style.opacity = '0';
  }
  el.style.opacity = '1';
  el.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0)`;
  if (out) {
    out.x = sx;
    out.y = sy;
    out.shown = true;
  }
  return onScreen;
}

/**
 * The pin steps below the prompt when the two would overlap — on a phone the
 * task's pin at the screen edge and the "E · Regar" over Pip land at the same
 * height, and two labels drawn over each other say nothing.
 */
export function avoidPrompt(pin: HTMLElement, at: PinPlace, pinSize: { w: number; h: number },
  prompt: PinPlace, promptSize: { w: number; h: number }): void {
  if (!at.shown || !prompt.shown) return;
  const gap = GUIDE.labelGapPx;
  const apartX = Math.abs(at.x - prompt.x) >= (pinSize.w + promptSize.w) / 2 + gap;
  const apartY = Math.abs(at.y - pinSize.h / 2 - (prompt.y - promptSize.h / 2)) >= (pinSize.h + promptSize.h) / 2 + gap;
  if (apartX || apartY) return;
  at.y = prompt.y + pinSize.h + gap;
  pin.style.transform = `translate3d(${Math.round(at.x)}px, ${Math.round(at.y)}px, 0)`;
}

/** Hide a pinned label (and its arrow). */
export function hidePin(el: HTMLElement | null, arrow: HTMLElement | null = null, out: PinPlace | null = null): void {
  if (el) el.style.opacity = '0';
  if (arrow) arrow.style.opacity = '0';
  if (out) out.shown = false;
}

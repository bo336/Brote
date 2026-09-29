'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { BRIDGE, CAMERA } from '@/lib/world/config';
import { deckTopAt, type Deck } from '@/lib/world/decks';
import { playerTransform } from '../state/usePlayerStore';
import { blocksLens, nextFade } from './useCanopyFade';

/** One prop or structure that can dither out, and the fade of each of its meshes. */
export interface FadeTarget {
  x: number;
  z: number;
  /** How wide it stands in the lens's way, in metres. */
  radius: number;
  fade: number;
  attrs: THREE.InstancedBufferAttribute[];
  /**
   * A thing that is walked on: never faded while Pip stands on it (a floor that
   * stipples under him reads as no floor), faded like anything else when he is
   * beside it or swimming under it.
   */
  deck?: readonly Deck[];
  /** A bridge's rails: in the way only across the line from Pip to the lens, or right against it. */
  rails?: Deck;
}

/**
 * A shared geometry, seen through a new one that owns only its `aFade`.
 *
 * The clay shader's dither lives behind `USE_INSTANCING` (`chunks.ts`), so a
 * prop that fades is drawn as a one-instance `InstancedMesh`. Its geometry is
 * the cached build every copy of that prop shares — and the treehouse's ombú is
 * the very geometry La Arboleda's pool fades — so the fade cannot live on it.
 * The view shares every buffer and adds one float.
 *
 * **Never dispose a view**: three releases a geometry's buffers with it, and
 * these buffers belong to the source. All a view owns is that one float.
 */
export function fadeView(src: THREE.BufferGeometry): { geometry: THREE.BufferGeometry; fade: THREE.InstancedBufferAttribute } {
  const geometry = new THREE.BufferGeometry();
  for (const name of Object.keys(src.attributes)) {
    if (name !== 'aFade') geometry.setAttribute(name, src.attributes[name]!);
  }
  geometry.setIndex(src.index);
  for (const g of src.groups) geometry.addGroup(g.start, g.count, g.materialIndex);
  if (!src.boundingSphere) src.computeBoundingSphere();
  if (!src.boundingBox) src.computeBoundingBox();
  geometry.boundingSphere = src.boundingSphere!.clone();
  geometry.boundingBox = src.boundingBox!.clone();
  const fade = new THREE.InstancedBufferAttribute(new Float32Array([1]), 1);
  fade.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('aFade', fade);
  return { geometry, fade };
}

/**
 * **Props and structures dither out of the lens's way**, as the trees do
 * (`useCanopyFade.ts`). The boom never comes closer than `CAMERA.occlusionMinM`,
 * so backing Pip up to the tent parked the lens inside the canvas, and the
 * windmill's tower filled the frame. Allocates nothing.
 */
export function usePropFade(targets: readonly FadeTarget[]): void {
  useFrame(({ camera }, delta) => {
    if (targets.length === 0) return;
    const p = playerTransform;
    const cx = camera.position.x;
    const cz = camera.position.z;
    let ax = cx - p.x;
    let az = cz - p.z;
    const len = Math.hypot(ax, az);
    if (len < 0.001) return;
    ax /= len;
    az /= len;
    const kIn = 1 - Math.exp(-CAMERA.fadeInLambda * delta);
    const kOut = 1 - Math.exp(-CAMERA.fadeOutLambda * delta);
    for (const t of targets) {
      let blocking: boolean;
      if (t.rails) {
        blocking = railsBlock(t.rails, p.x, p.z, cx, camera.position.y, cz);
      } else {
        const top = t.deck ? deckTopAt(t.deck, p.x, p.z) : null;
        const onDeck = top !== null && p.y > top - BRIDGE.stepUpM;
        blocking = !onDeck && blocksLens(t.x, t.z, t.radius, p.x, p.z, ax, az, len, cx, cz);
      }
      const next = nextFade(t.fade, blocking, kIn, kOut);
      if (next === t.fade) continue;
      t.fade = next;
      for (const a of t.attrs) {
        a.setX(0, next);
        a.needsUpdate = true;
      }
    }
  });
}

/**
 * A bridge's rails stand in the lens's way when the line from Pip to the lens
 * crosses either of them along the span, or the lens is right against one — and
 * only below their top: a lens looking down over a rail sees past it. The deck
 * is not a circle, and a circle faded the rails on every walk across.
 */
function railsBlock(d: Deck, px: number, pz: number, cx: number, cy: number, cz: number): boolean {
  if (cy > d.baseY + BRIDGE.deckTopM + BRIDGE.camberM + BRIDGE.railTopM + CAMERA.fadeMarginM) return false;
  const c = Math.cos(d.rotY);
  const s = Math.sin(d.rotY);
  const plx = (px - d.x) * c - (pz - d.z) * s;
  const plz = (px - d.x) * s + (pz - d.z) * c;
  const clx = (cx - d.x) * c - (cz - d.z) * s;
  const clz = (cx - d.x) * s + (cz - d.z) * c;
  const reach = d.halfSpan + CAMERA.fadeMarginM;
  for (let side = -1; side <= 1; side += 2) {
    const line = side * d.halfWidth;
    if (Math.abs(clz - line) < CAMERA.fadeMarginM && Math.abs(clx) < reach) return true;
    const a = plz - line;
    const b = clz - line;
    if (a * b < 0 && Math.abs(plx + (clx - plx) * (a / (a - b))) < reach) return true;
  }
  return false;
}

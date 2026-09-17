'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { SNAPSHOT } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';
import { composerHandle } from './PostFx';
import type { PosterCrop } from '../poster/useSnapshot';

/**
 * When, and how, the poster is taken.
 *
 * **Every poster was black.** There is no `preserveDrawingBuffer`, so the canvas
 * holds an image only in the tick right after something is drawn into it — and
 * the shot was read from a frame callback, which runs *before* that frame is
 * drawn, from a buffer the browser had already cleared. The home feed's card was
 * a black rectangle with a growth bar on it.
 *
 * So the shot draws its own frame: the lens is moved to the poster's framing (a
 * little higher and farther than play, looking at Pip from where the player was
 * looking), one frame is rendered through the same lens and grade the player
 * sees, the canvas is read in that same tick, and the lens goes back — all before
 * this frame's real render, so nothing on screen ever shows the poster's angle.
 *
 * It is taken at the two moments the island is both settled and worth a picture:
 *
 *  - a few seconds after arriving;
 *  - and again on leaving placement mode, because arranging is the one thing a
 *    player does that is *meant* to change how their island looks.
 *
 * The world's guidance — the golden light, the green ring — is left out of the
 * picture: it is a poster of the island, not of today's to-do list. On a tall
 * phone screen the poster is drawn as a wide band of its own, because the card
 * is wide and a crop of a portrait frame was a thin strip of path.
 *
 * A frame that still comes out blank is not uploaded, and is tried again.
 *
 * It lives here rather than in `poster/` because it runs inside the canvas, and
 * that directory is fenced off from `three` by eslint: `MundoPoster` is loaded
 * by the home feed, and one three import there would pull the whole renderer
 * into everyone's first paint. The upload half stays in `poster/useSnapshot.ts`.
 */
const size = new THREE.Vector2();
const savedPos = new THREE.Vector3();
const savedQuat = new THREE.Quaternion();
const look = new THREE.Vector3();

export function PosterShot({
  onShoot,
  heightfield,
}: {
  /** Reads the canvas in the same tick; returns false if the frame was blank. */
  onShoot: (canvas: HTMLCanvasElement, crop?: PosterCrop) => boolean;
  heightfield: Heightfield;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const ready = useSessionStore((s) => s.ready);
  const hud = useSessionStore((s) => s.hud);

  const since = useRef(0);
  const settled = useRef(false);
  const tries = useRef(0);
  /** Placement mode was open. Leaving it earns a fresh poster. */
  const arranged = useRef(false);

  const shoot = (delta: number): boolean => {
    savedPos.copy(camera.position);
    savedQuat.copy(camera.quaternion);
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.visible && o.userData.posterHidden) {
        o.visible = false;
        hidden.push(o);
      }
    });
    const composer = composerHandle.current;
    const aspect = camera.aspect;
    let crop: PosterCrop | undefined;
    const pixelRatio = gl.getPixelRatio();
    if (!composer && aspect < SNAPSHOT.bandBelowAspect) {
      // A wide band across the middle of the canvas, through a wide lens, at a
      // pixel ratio a card can use. The buffer is resized for this one frame.
      if (pixelRatio < SNAPSHOT.bandPixelRatio) gl.setPixelRatio(SNAPSHOT.bandPixelRatio);
      gl.getSize(size);
      const bandH = Math.round(size.x / SNAPSHOT.bandAspect);
      const bandY = Math.round((size.y - bandH) / 2);
      camera.aspect = size.x / bandH;
      camera.updateProjectionMatrix();
      frame(camera, heightfield);
      gl.setViewport(0, bandY, size.x, bandH);
      gl.setScissor(0, bandY, size.x, bandH);
      gl.setScissorTest(true);
      gl.render(scene, camera);
      gl.setScissorTest(false);
      gl.setViewport(0, 0, size.x, size.y);
      const pr = gl.getPixelRatio();
      crop = { x: 0, y: Math.round(bandY * pr), w: Math.round(size.x * pr), h: Math.round(bandH * pr) };
    } else {
      frame(camera, heightfield);
      if (composer) composer.render(delta);
      else gl.render(scene, camera);
    }
    const ok = onShoot(gl.domElement, crop);
    if (gl.getPixelRatio() !== pixelRatio) gl.setPixelRatio(pixelRatio);
    for (const o of hidden) o.visible = true;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.position.copy(savedPos);
    camera.quaternion.copy(savedQuat);
    camera.updateMatrixWorld();
    return ok;
  };

  useFrame((_, delta) => {
    if (!ready) return;
    if (hud === 'placement') {
      arranged.current = true;
      return;
    }
    // A cutscene frames a mountain, not an island. Never the poster.
    if (hud !== 'play') return;

    since.current += delta;
    if (!settled.current && since.current >= SNAPSHOT.settleS) {
      if (shoot(delta) || ++tries.current >= SNAPSHOT.maxTries) settled.current = true;
      else since.current = SNAPSHOT.settleS - SNAPSHOT.retryS;
      return;
    }
    if (settled.current && arranged.current && since.current >= SNAPSHOT.settleS) {
      arranged.current = false;
      since.current = 0;
      shoot(delta);
    }
  });

  return null;
}

/** The poster's framing: behind Pip along the player's own view, higher and farther than play. */
function frame(camera: THREE.PerspectiveCamera, hf: Heightfield): void {
  const p = playerTransform;
  let dx = camera.position.x - p.x;
  let dz = camera.position.z - p.z;
  const h = Math.hypot(dx, dz);
  if (h < 1e-3) {
    dx = -Math.sin(p.yaw);
    dz = -Math.cos(p.yaw);
  } else {
    dx /= h;
    dz /= h;
  }
  const d = SNAPSHOT.distanceM * (camera.aspect < 1 ? SNAPSHOT.portraitDistanceScale : 1);
  const pitch = (SNAPSHOT.pitchDeg * Math.PI) / 180;
  const x = p.x + dx * d * Math.cos(pitch);
  const z = p.z + dz * d * Math.cos(pitch);
  const y = Math.max(p.y + SNAPSHOT.lookHeightM + d * Math.sin(pitch), sampleHeight(hf, x, z) + SNAPSHOT.clearanceM);
  camera.position.set(x, y, z);
  camera.lookAt(look.set(p.x, p.y + SNAPSHOT.lookHeightM, p.z));
  camera.updateMatrixWorld();
}

'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { SNAPSHOT } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';

/**
 * When, and how, the poster is taken.
 *
 * **Every poster was black** — the owner's saved one is a 1920×991 JPEG of pure
 * black. There is no `preserveDrawingBuffer`, so the canvas holds an image only
 * in the task right after something is drawn into it, and the shot used to be
 * read from a frame callback: that runs *before* the frame is drawn, from a
 * buffer the browser already cleared after presenting the last one. Measured in
 * headless Chrome: reading the canvas outside a draw gives brightness 0;
 * drawing and reading in the same task gives the real frame.
 *
 * So the shot draws **its own frame** and reads it in the same tick: a camera
 * of its own (behind Pip along the player's view, higher and farther than
 * play), a wide band of the canvas through viewport and scissor, one plain
 * render, one synchronous read, and everything put back — all inside this
 * frame callback, before the frame's real render, so nothing on screen ever
 * shows the poster's angle. The band is 2:1 because the card is wide; a crop of
 * a portrait phone frame was a thin strip of path.
 *
 * It skips the post-processing pass on purpose: the composer draws full-screen
 * quads that ignore a scissor band, and the renderer tone-maps on its own.
 *
 * A frame that still comes out blank is never uploaded, and is tried again.
 *
 * Guidance (the golden light, the ring, labels) is hidden for the picture:
 * anything with `userData.posterHidden` is switched off for that one render.
 */
const size = new THREE.Vector2();
const look = new THREE.Vector3();
const posterCam = new THREE.PerspectiveCamera(SNAPSHOT.fovDeg, SNAPSHOT.aspect, 0.1, 600);

export interface PosterFrame {
  canvas: HTMLCanvasElement;
  /** The band, in canvas pixels, top-left origin. */
  crop: { x: number; y: number; w: number; h: number };
}

export function PosterShot({
  onShoot,
  heightfield,
}: {
  /** Reads the band in the same tick; returns false when the frame was blank. */
  onShoot: (frame: PosterFrame) => boolean;
  heightfield: Heightfield;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const ready = useSessionStore((s) => s.ready);
  const hud = useSessionStore((s) => s.hud);

  const since = useRef(0);
  const settled = useRef(false);
  const tries = useRef(0);
  /** Placement mode was open. Leaving it earns a fresh poster. */
  const arranged = useRef(false);

  const shoot = (): boolean => {
    frame(camera, heightfield);
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.visible && o.userData.posterHidden) {
        o.visible = false;
        hidden.push(o);
      }
    });
    gl.getSize(size);
    const pr = gl.getPixelRatio();
    const bandH = Math.min(size.y, Math.round(size.x / SNAPSHOT.aspect));
    const bandY = Math.round((size.y - bandH) / 2);
    posterCam.aspect = size.x / bandH;
    posterCam.updateProjectionMatrix();

    const autoClear = gl.autoClear;
    gl.autoClear = true;
    gl.setViewport(0, bandY, size.x, bandH);
    gl.setScissor(0, bandY, size.x, bandH);
    gl.setScissorTest(true);
    gl.render(scene, posterCam);
    let ok = false;
    try {
      ok = onShoot({
        canvas: gl.domElement,
        // `setViewport` counts from the bottom; a 2D crop counts from the top.
        crop: {
          x: 0,
          y: Math.round((size.y - bandY - bandH) * pr),
          w: Math.round(size.x * pr),
          h: Math.round(bandH * pr),
        },
      });
    } finally {
      gl.setScissorTest(false);
      gl.setViewport(0, 0, size.x, size.y);
      gl.autoClear = autoClear;
      for (const o of hidden) o.visible = true;
    }
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
    // Under `frameloop="demand"` a quiet island stops drawing; the poster still
    // needs its frame, so it asks for one while it is waiting to be taken.
    if (!settled.current || arranged.current) invalidate();
    if (!settled.current && since.current >= SNAPSHOT.settleS) {
      if (shoot() || ++tries.current >= SNAPSHOT.maxTries) settled.current = true;
      else since.current = SNAPSHOT.settleS - SNAPSHOT.retryS;
      return;
    }
    if (settled.current && arranged.current && since.current >= SNAPSHOT.settleS) {
      arranged.current = false;
      since.current = 0;
      shoot();
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
    dx = 0;
    dz = 1;
  } else {
    dx /= h;
    dz /= h;
  }
  const x = p.x + dx * SNAPSHOT.backM;
  const z = p.z + dz * SNAPSHOT.backM;
  // Never under the hillside behind Pip: the lens stays clear of the ground it stands over.
  const ground = sampleHeight(hf, x, z);
  const y = Math.max(p.y + SNAPSHOT.upM, ground + 2);
  posterCam.position.set(x, y, z);
  look.set(p.x - dx * SNAPSHOT.lookAheadM, p.y + SNAPSHOT.lookUpM, p.z - dz * SNAPSHOT.lookAheadM);
  posterCam.lookAt(look);
  posterCam.updateMatrixWorld();
}

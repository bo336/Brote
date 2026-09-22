'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import { SNAPSHOT } from '@/lib/world/config';
import { useSessionStore } from '../state/useSessionStore';

/**
 * When the poster is taken.
 *
 * It has to happen **inside a frame**: there is no `preserveDrawingBuffer`, so
 * the only moment the canvas holds an image is the tick right after it was
 * drawn. That rules out capturing from an unmount effect, a `pagehide`
 * listener, or a click handler — all of which run when the buffer is already
 * empty, and all of which would have produced a black poster.
 *
 * So the shot is taken from the render loop, at the two moments the island is
 * both settled and worth a picture:
 *
 *  - a few seconds after arriving, once the camera has damped in behind Pip;
 *  - and again on leaving placement mode, because arranging is the one thing
 *    a player does that is *meant* to change how their island looks.
 *
 * It lives here rather than in `poster/` because it runs inside the canvas, and
 * that directory is fenced off from `three` by eslint: `MundoPoster` is loaded
 * by the home feed, and one three import there would pull the whole renderer
 * into everyone's first paint. The upload half — which touches no geometry —
 * stays next to the card, in `poster/useSnapshot.ts`.
 */
export function PosterShot({ onShoot }: { onShoot: (canvas: HTMLCanvasElement) => void }) {
  const gl = useThree((s) => s.gl);
  const ready = useSessionStore((s) => s.ready);
  const hud = useSessionStore((s) => s.hud);

  const since = useRef(0);
  const settled = useRef(false);
  /** Placement mode was open. Leaving it earns a fresh poster. */
  const arranged = useRef(false);

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
      settled.current = true;
      onShoot(gl.domElement);
      return;
    }
    if (settled.current && arranged.current && since.current >= SNAPSHOT.settleS) {
      arranged.current = false;
      since.current = 0;
      onShoot(gl.domElement);
    }
  });

  return null;
}

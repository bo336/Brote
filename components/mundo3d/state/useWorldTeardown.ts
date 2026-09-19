'use client';

import { useEffect } from 'react';
import type * as THREE from 'three';

import { disposeAll as disposeGeometry } from '@/lib/render/geometry';
import { disposeAll as disposeMaterials } from '@/lib/render/materials';
import { resetInput } from '../control/useInput';
import { clearInteractables } from '../interaction/InteractableRegistry';

/**
 * Everything is disposed.
 *
 * The old world leaked its module caches for the app's lifetime across route
 * changes (`02-AUDIT.md` §7); this hook and the assertion inside it are how
 * that does not happen again. It runs once, on the way out of `/mundo`.
 */
/**
 * Takes a getter rather than the ref itself. The renderer is handed over
 * asynchronously, after mount, so a value read when this effect *runs* is
 * always null — the cleanup has to ask at the moment it fires.
 */
export function useWorldTeardown(getRenderer: () => THREE.WebGLRenderer | null): void {
  useEffect(() => {
    return () => {
      clearInteractables();
      resetInput();
      disposeMaterials();
      disposeGeometry();
      const gl = getRenderer();
      // Development only: the assertion is a warning to whoever is working on
      // the scene, not something to run in a player's console.
      //
      // **Deferred by a task.** React tears an unmounting tree down parent
      // first, so this cleanup runs BEFORE the scene components' own — and
      // reading `gl.info.memory` here counted every geometry that was about to
      // be disposed a moment later. It reported ten leaked geometries on every
      // single unmount, which is worse than no assertion: an alarm that always
      // fires is an alarm nobody reads.
      if (gl && process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
          const { geometries, textures } = gl.info.memory;
          if (geometries !== 0 || textures !== 0) {
            console.warn(`[mundo] leak on unmount: ${geometries} geometries, ${textures} textures`);
          }
        }, 0);
      }
    };
  }, [getRenderer]);
}

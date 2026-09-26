'use client';

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { playerTransform } from '../../state/usePlayerStore';
import { tagElements, useTags } from '../tags';

/**
 * Puts every world tag where its thing is on screen, every frame.
 *
 * Writes `transform` and `opacity` on elements the HUD registered in
 * `tagElements` — no React state, no re-render. A tag behind the camera, past
 * its range or crowded by a nearer one of the same kind is hidden; one near
 * the edge of its range fades rather than popping.
 */
const v = new THREE.Vector3();

export function TagProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useFrame(() => {
    const tags = useTags.getState().tags;
    const p = playerTransform;
    for (const [id, tag] of tags) {
      const el = tagElements.get(id);
      if (!el) continue;
      const d = Math.hypot(tag.x - p.x, tag.z - p.z);
      if (d > tag.within) {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        continue;
      }
      v.set(tag.x, tag.y, tag.z).project(camera);
      if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        continue;
      }
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      const fade = Math.min(1, (tag.within - d) / Math.max(1, tag.within * 0.25));
      // Nearer tags draw over farther ones.
      el.style.zIndex = String(1000 - Math.round(d * 10));
      el.style.visibility = 'visible';
      el.style.opacity = String(Math.round(fade * 100) / 100);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  });

  return null;
}

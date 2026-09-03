'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { INTERACT } from '@/lib/world/config';
import type { VerbId } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';
import { findActive } from './InteractableRegistry';

/**
 * The proximity scan: **every third frame, exactly one active interactable**
 * (`10-CONTROLS-AND-CAMERA.md` §5). Never two prompts at once.
 *
 * The store's setter is identity-comparing, so a scan that finds the same
 * object as last time causes no re-render at all — which is what makes running
 * this at 20 Hz free.
 */
export function ProximityDetector({ verbs }: { verbs: readonly VerbId[] }) {
  const frame = useRef(0);
  const setActive = useSessionStore((s) => s.setActive);

  useFrame(() => {
    frame.current += 1;
    if (frame.current % INTERACT.scanEveryNFrames !== 0) return;
    const p = playerTransform;
    setActive(findActive(p.x, p.z, p.yaw, verbs));
  });

  return null;
}

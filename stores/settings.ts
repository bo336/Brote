'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DetailMode = 'auto' | 'high' | 'low';

interface SettingsState {
  /** Tu Mundo render mode (BUILD_SPEC §9.1 low-detail fallback). */
  detailMode: DetailMode;
  setDetailMode: (m: DetailMode) => void;
}

/** Non-critical UI prefs may live in localStorage (BUILD_SPEC §1.4). */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      detailMode: 'auto',
      setDetailMode: (detailMode) => set({ detailMode }),
    }),
    { name: 'brote-settings' },
  ),
);

/** Heuristic: should we render the full 3D world on this device? */
export function shouldRender3D(detailMode: DetailMode): boolean {
  if (detailMode === 'high') return true;
  if (detailMode === 'low') return false;
  if (typeof navigator === 'undefined') return true;
  // Auto: skip 3D on very low-core devices or when the user prefers reduced motion.
  const cores = navigator.hardwareConcurrency ?? 4;
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return cores >= 4 && !reduced;
}

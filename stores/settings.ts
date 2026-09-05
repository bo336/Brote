'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** `mid` was added for the world's four quality tiers; the other three predate it. */
type DetailMode = 'auto' | 'high' | 'mid' | 'low';

/**
 * The Mundo settings group (`16-UI-AUDIO-A11Y.md` §4). Strings live in
 * `messages/es.json` under `mundo.set.*`; nothing here is user-facing text.
 *
 * Every one of these is an accessibility control as much as a preference:
 * reduced motion, auto-centring and camera sensitivity are Xbox Accessibility
 * Guideline 117, and the quality toggle is what lets somebody on a slow phone
 * play at all.
 */
interface MundoSettings {
  /** Follows `prefers-reduced-motion` until the player says otherwise. */
  reduceMotion: boolean | null;
  /** XAG 117: auto-centring must be switchable off. */
  autoCamera: boolean;
  cameraSensitivityX: number;
  cameraSensitivityY: number;
  /** Muted by default on mobile, on by default on desktop. */
  sound: boolean | null;
  music: boolean | null;
  largeText: boolean;
  vibrate: boolean;
}

interface SettingsState extends MundoSettings {
  /** Tu Mundo render mode (BUILD_SPEC §9.1 low-detail fallback). */
  detailMode: DetailMode;
  setDetailMode: (m: DetailMode) => void;
  setMundo: (patch: Partial<MundoSettings>) => void;
}

/** Non-critical UI prefs may live in localStorage (BUILD_SPEC §1.4). */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      detailMode: 'auto',
      reduceMotion: null,
      autoCamera: true,
      cameraSensitivityX: 1,
      cameraSensitivityY: 1,
      sound: null,
      music: null,
      largeText: false,
      vibrate: true,
      setDetailMode: (detailMode) => set({ detailMode }),
      setMundo: (patch) => set(patch),
    }),
    { name: 'brote-settings' },
  ),
);

/** Heuristic: should we render the full 3D world on this device? */
export function shouldRender3D(detailMode: DetailMode): boolean {
  if (detailMode === 'high' || detailMode === 'mid') return true;
  if (detailMode === 'low') return false;
  if (typeof navigator === 'undefined') return true;
  // Auto: skip 3D on very low-core devices or when the user prefers reduced motion.
  const cores = navigator.hardwareConcurrency ?? 4;
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return cores >= 4 && !reduced;
}

/**
 * The quality tier the world should START at, from the saved setting. `auto`
 * means "measure, do not guess" — the frame-time monitor takes it from there
 * (`07-RENDER-ARCHITECTURE.md` §4).
 */
export function detailModeToTier(detailMode: DetailMode): 0 | 1 | 2 | 3 | null {
  if (detailMode === 'low') return 0;
  if (detailMode === 'mid') return 2;
  if (detailMode === 'high') return 3;
  return null;
}

/** `prefers-reduced-motion` unless the player has explicitly chosen. */
export function prefersReducedMotion(setting: boolean | null): boolean {
  if (setting !== null) return setting;
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

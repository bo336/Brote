'use client';

import { create } from 'zustand';

import type { Interactable, QualityTier, TimeOfDay } from '@/lib/world/types';

/** What the HUD is showing. Sheets pause the world and drop to `demand`. */
export type HudMode = 'play' | 'bitacora' | 'placement' | 'settings' | 'cutscene';

/**
 * Session ephemera: the things that change during play and that React genuinely
 * needs to know about — which interactable is active, which sheet is open, what
 * quality tier the monitor settled on, what time of day it is.
 *
 * Everything here is deliberately low-frequency. The per-frame state lives in
 * `playerTransform`, which is not a store at all.
 */
interface SessionStoreState {
  ready: boolean;
  /** Exactly one at a time. **Never show two prompts** (`10-CONTROLS` §5.3). */
  active: Interactable | null;
  hud: HudMode;
  tier: QualityTier;
  timeOfDay: TimeOfDay;
  /** `prefers-reduced-motion`, or the in-game toggle. */
  reducedMotion: boolean;
  setReady: (ready: boolean) => void;
  setActive: (active: Interactable | null) => void;
  setHud: (hud: HudMode) => void;
  setTier: (tier: QualityTier) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  ready: false,
  active: null,
  hud: 'play',
  tier: 1,
  timeOfDay: 'dia',
  reducedMotion: false,
  setReady: (ready) => set({ ready }),
  setActive: (active) =>
    set((s) => (s.active?.id === active?.id ? s : { active })),
  setHud: (hud) => set({ hud }),
  setTier: (tier) => set({ tier }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));

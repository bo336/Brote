'use client';

import { create } from 'zustand';

import type { Interactable, PropId, QualityTier, TimeOfDay, VerbId } from '@/lib/world/types';

/** What the HUD is showing. Sheets pause the world and drop to `demand`. */
export type HudMode = 'play' | 'bitacora' | 'placement' | 'settings' | 'cutscene' | 'mojon';

/**
 * Session ephemera: the things that change during play and that React genuinely
 * needs to know about — which interactable is active, which sheet is open, what
 * quality tier the monitor settled on, what time of day it is.
 *
 * Everything here is deliberately low-frequency. The per-frame state lives in
 * `playerTransform`, which is not a store at all.
 */
/**
 * What the HUD needs to know about placement mode, and what it can do to it.
 *
 * The editor itself lives inside `<Canvas>`, because that is where the layout,
 * the heightfield and the camera are. The controls live outside it. This is the
 * seam between them, and it carries **a summary, not the ghost**: the ghost
 * moves with a finger and pushing it through a store would re-render the HUD
 * sixty times a second to change nothing anyone can see. What the buttons
 * actually need is whether there is a ghost and whether it can be put down.
 */
export interface PlacementSummary {
  hasGhost: boolean;
  /** The spot refuses it. Greys the confirm and turns the ring coral. */
  rejected: boolean;
  remaining: number;
  canUndo: boolean;
  props: PropId[];
}

export interface PlacementActions {
  pick: (slug: PropId) => void;
  rotate: () => void;
  commit: () => void;
  cancel: () => void;
  undo: () => void;
}

const EMPTY_PLACEMENT: PlacementSummary = {
  hasGhost: false,
  rejected: false,
  remaining: 0,
  canUndo: false,
  props: [],
};

interface SessionStoreState {
  ready: boolean;
  /** Exactly one at a time. **Never show two prompts** (`10-CONTROLS` §5.3). */
  active: Interactable | null;
  hud: HudMode;
  tier: QualityTier;
  timeOfDay: TimeOfDay;
  /** `prefers-reduced-motion`, or the in-game toggle. */
  reducedMotion: boolean;
  /**
   * The verb the player just needed and does not have. Drives the one-line
   * hint at a soft barrier; cleared after a few seconds by the HUD.
   */
  lockedHint: VerbId | null;
  placement: PlacementSummary;
  placementActions: PlacementActions | null;
  setPlacement: (summary: PlacementSummary) => void;
  setPlacementActions: (actions: PlacementActions | null) => void;
  setReady: (ready: boolean) => void;
  setActive: (active: Interactable | null) => void;
  setHud: (hud: HudMode) => void;
  setTier: (tier: QualityTier) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setLockedHint: (verb: VerbId | null) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  ready: false,
  active: null,
  hud: 'play',
  tier: 1,
  timeOfDay: 'dia',
  reducedMotion: false,
  lockedHint: null,
  placement: EMPTY_PLACEMENT,
  placementActions: null,
  // Compared field by field: the editor recomputes this on every change, and
  // most changes do not alter anything the buttons render.
  setPlacement: (placement) =>
    set((s) =>
      s.placement.hasGhost === placement.hasGhost &&
      s.placement.rejected === placement.rejected &&
      s.placement.remaining === placement.remaining &&
      s.placement.canUndo === placement.canUndo &&
      s.placement.props.length === placement.props.length
        ? s
        : { placement },
    ),
  setPlacementActions: (placementActions) => set({ placementActions }),
  setReady: (ready) => set({ ready }),
  setActive: (active) =>
    set((s) => (s.active?.id === active?.id ? s : { active })),
  setHud: (hud) => set({ hud }),
  setTier: (tier) => set({ tier }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLockedHint: (lockedHint) => set((s) => (s.lockedHint === lockedHint ? s : { lockedHint })),
}));

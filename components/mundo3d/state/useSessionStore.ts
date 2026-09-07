'use client';

import { create } from 'zustand';

import type { BeatId, CeremonyRequest } from '@/lib/world/ceremony';
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
  /** Which saved-layout slots hold something. Length is how many are drawn. */
  slots: boolean[];
}

export interface PlacementActions {
  pick: (slug: PropId) => void;
  rotate: () => void;
  commit: () => void;
  cancel: () => void;
  undo: () => void;
  /** Save into an empty slot, or load a full one. */
  useSlot: (index: number) => void;
}

/**
 * The tier-up ceremony, as the HUD sees it.
 *
 * Same seam as placement, for the same reason: the beat clock ticks inside
 * `<Canvas>` at frame rate and the cards live outside it. What crosses is the
 * **beat**, which changes six times in forty seconds — not the elapsed time,
 * which changes sixty times a second and would re-render a title card that
 * says the same thing.
 */
export interface CeremonyStatus {
  /** What is being celebrated, or null when nothing is playing. */
  request: CeremonyRequest | null;
  beat: BeatId;
  /** The before-shot, as a data URL, once beat 2 has taken it. */
  before: string | null;
  /** Skipping is a HUD button and a runner behaviour; this is the wire. */
  skipped: boolean;
}

const NO_CEREMONY: CeremonyStatus = { request: null, beat: 'camera', before: null, skipped: false };

const EMPTY_PLACEMENT: PlacementSummary = {
  hasGhost: false,
  rejected: false,
  remaining: 0,
  canUndo: false,
  props: [],
  slots: [],
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
  /**
   * A line about the thing the player just read, as an i18n key.
   *
   * The density rule's other half (`11-GAME-LOOP.md` §3.3): every object has a
   * description, and this is where it goes. Same one-line slot as a soft
   * barrier, same self-clearing behaviour — a line, and then the world again.
   */
  note: string | null;
  /**
   * Values a note's copy interpolates — a project marker's title, place and
   * date. Empty for the lines that take none, which is most of them.
   */
  noteValues: Record<string, string>;
  placement: PlacementSummary;
  placementActions: PlacementActions | null;
  /**
   * The queue of tiers reached but not yet celebrated, oldest first
   * (`08-WORLD-AND-PROGRESSION.md` §5: "ceremonies queue and play in order").
   */
  ceremonyQueue: CeremonyRequest[];
  ceremony: CeremonyStatus;
  queueCeremonies: (requests: readonly CeremonyRequest[]) => void;
  /** Start the next queued one, or clear when the queue is empty. */
  nextCeremony: () => void;
  setCeremonyBeat: (beat: BeatId) => void;
  setCeremonyBefore: (before: string | null) => void;
  skipCeremony: () => void;
  setPlacement: (summary: PlacementSummary) => void;
  setPlacementActions: (actions: PlacementActions | null) => void;
  setReady: (ready: boolean) => void;
  setActive: (active: Interactable | null) => void;
  setHud: (hud: HudMode) => void;
  setTier: (tier: QualityTier) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setLockedHint: (verb: VerbId | null) => void;
  setNote: (key: string | null) => void;
  setNoteValues: (values: Record<string, string>) => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  ready: false,
  active: null,
  hud: 'play',
  tier: 1,
  timeOfDay: 'dia',
  reducedMotion: false,
  lockedHint: null,
  note: null,
  noteValues: {},
  placement: EMPTY_PLACEMENT,
  placementActions: null,
  ceremonyQueue: [],
  ceremony: NO_CEREMONY,
  queueCeremonies: (requests) =>
    set((s) => (s.ceremonyQueue.length > 0 || requests.length === 0 ? s : { ceremonyQueue: [...requests] })),
  nextCeremony: () =>
    set((s) => {
      const [next, ...rest] = s.ceremonyQueue;
      if (next === undefined) return { ceremony: NO_CEREMONY, ceremonyQueue: [], hud: 'play' as const };
      // The before-shot belongs to the ceremony that took it, so it is dropped
      // here rather than carried into the next one's card.
      return {
        ceremonyQueue: rest,
        ceremony: { request: next, beat: 'camera' as const, before: null, skipped: false },
        hud: 'cutscene' as const,
      };
    }),
  setCeremonyBeat: (beat) =>
    set((s) => (s.ceremony.beat === beat ? s : { ceremony: { ...s.ceremony, beat } })),
  setCeremonyBefore: (before) => set((s) => ({ ceremony: { ...s.ceremony, before } })),
  // Never force it twice (§5): skipping is remembered for this ceremony only,
  // and the card is still made — the runner reads this and jumps, it does not
  // tear the sequence down.
  skipCeremony: () =>
    set((s) => (s.ceremony.skipped ? s : { ceremony: { ...s.ceremony, skipped: true } })),
  // Compared field by field: the editor recomputes this on every change, and
  // most changes do not alter anything the buttons render.
  setPlacement: (placement) =>
    set((s) =>
      s.placement.hasGhost === placement.hasGhost &&
      s.placement.rejected === placement.rejected &&
      s.placement.remaining === placement.remaining &&
      s.placement.canUndo === placement.canUndo &&
      s.placement.props.length === placement.props.length &&
      s.placement.slots.length === placement.slots.length &&
      s.placement.slots.every((v, i) => v === placement.slots[i])
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
  setNote: (note) => set((s) => (s.note === note ? s : { note })),
  setNoteValues: (noteValues) => set({ noteValues }),
}));

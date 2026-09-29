'use client';

import { create } from 'zustand';

import { localDate } from '@/lib/utils/dates';
import { GAME } from '@/lib/world/game/config';
import { buildParcels, type ParcelField } from '@/lib/world/game/parcels';
import { reduce, type GameAction } from '@/lib/world/game/reduce';
import { newGame, sanitize } from '@/lib/world/game/state';
import type { GameContext, GameEvent, GameState } from '@/lib/world/game/types';
import { hashInt } from '@/lib/world/rng';
import { loadLocal, saveLocal, saveServer } from './persist';

/**
 * The game's state on the client: one `GameState`, one reducer, one door.
 *
 * Everything the player does in the world is a `dispatch`. The reducer is the
 * same pure function the tests and the 60-day simulation run, so what happens
 * on screen is what was balanced. The store keeps the last batch of events for
 * the HUD and the scene to react to (a card, a burst, a line from a character),
 * and saves: to this device on every change, to the server a few seconds after
 * the last one.
 */
export interface GameBase {
  who: string;
  tier: number;
  div: number;
}

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'offline' | 'local';

interface GameStore {
  state: GameState | null;
  field: ParcelField | null;
  base: GameBase | null;
  /** No server writes: a visit, a failed bootstrap, the account-less preview. */
  readOnly: boolean;
  rev: number;
  dirty: boolean;
  status: SaveStatus;
  /** The events of the last action, and a counter so a subscriber sees each batch once. */
  events: GameEvent[];
  /** Where the last action happened, for bursts and floating numbers. */
  at: readonly [number, number, number] | null;
  seq: number;
  /**
   * `persist: false` for a visit: the host's parcels are shown, never saved on
   * the visitor's device and never mixed with the visitor's own save.
   */
  init: (o: { base: GameBase; server?: { state: unknown; rev: number } | null; readOnly: boolean; reset?: boolean; persist?: boolean }) => void;
  ctx: () => GameContext | null;
  dispatch: (action: GameAction, at?: readonly [number, number, number]) => GameEvent[];
  /** Replace the state with the server's (another device saved first). */
  adopt: (state: unknown, rev: number) => void;
  setStatus: (s: SaveStatus) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
/** Off for a visit: nothing about someone else's island is written anywhere. */
let persistOn = true;
let firstPendingAt = 0;
let saving = false;

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  field: null,
  base: null,
  readOnly: true,
  rev: 0,
  dirty: false,
  status: 'local',
  events: [],
  at: null,
  seq: 0,

  init: ({ base, server, readOnly, reset, persist = true }) => {
    persistOn = persist;
    const ctx = contextFor(base);
    const field = buildParcels(hashInt(base.who));
    const local = reset || !persist ? null : loadLocal(base.who);
    let state: GameState;
    let rev = 0;
    let dirty = false;
    if (server && server.state && Object.keys(server.state as object).length > 0) {
      // The device copy wins only when it is the same revision plus unsent work.
      if (local && local.dirty && local.rev === server.rev) {
        state = sanitize(local.state, ctx);
        dirty = true;
      } else {
        state = sanitize(server.state, ctx);
      }
      rev = server.rev;
    } else if (local) {
      state = sanitize(local.state, ctx);
      rev = local.rev;
      dirty = !readOnly;
    } else {
      state = newGame(ctx);
      dirty = !readOnly;
    }
    // Let the clock catch up at once: a new day, what the stations made overnight.
    const r = reduce(state, { t: 'tick' }, ctx, { field });
    set({
      state: r.state, field, base, readOnly, rev, dirty,
      status: readOnly ? 'local' : dirty ? 'pending' : 'saved',
      events: r.events, at: null, seq: get().seq + 1,
    });
    if (persist) saveLocal(base.who, { state: r.state, rev, dirty });
    if (dirty && !readOnly) schedule();
  },

  ctx: () => {
    const base = get().base;
    return base ? contextFor(base) : null;
  },

  dispatch: (action, at) => {
    const { state, field, base } = get();
    if (!state || !field || !base) return [];
    const r = reduce(state, action, contextFor(base), { field });
    const changed = r.events.length > 0 || JSON.stringify(r.state) !== JSON.stringify(state);
    set({ state: r.state, events: r.events, at: at ?? null, seq: get().seq + 1, dirty: get().dirty || changed });
    if (changed && persistOn) {
      saveLocal(base.who, { state: r.state, rev: get().rev, dirty: !get().readOnly });
      if (!get().readOnly) schedule();
    }
    return r.events;
  },

  adopt: (raw, rev) => {
    const base = get().base;
    const field = get().field;
    if (!base || !field) return;
    const ctx = contextFor(base);
    const r = reduce(sanitize(raw, ctx), { t: 'tick' }, ctx, { field });
    set({ state: r.state, rev, dirty: false, status: 'saved', events: [], seq: get().seq + 1 });
    saveLocal(base.who, { state: r.state, rev, dirty: false });
  },

  setStatus: (status) => set({ status }),
}));

function contextFor(base: GameBase): GameContext {
  return { now: Date.now(), day: localDate(), tier: base.tier, div: base.div, who: base.who };
}

/** Debounced, with a ceiling: a steady stream of pickups still saves every 15 s. */
function schedule(): void {
  const now = Date.now();
  if (!firstPendingAt) firstPendingAt = now;
  if (saveTimer) clearTimeout(saveTimer);
  const wait = Math.max(0, Math.min(GAME.saveDebounceMs, firstPendingAt + GAME.saveMaxWaitMs - now));
  useGameStore.getState().setStatus('pending');
  saveTimer = setTimeout(() => void flushGame(), wait);
}

/** Send what is pending. Safe to call any time; one save in flight at most. */
export async function flushGame(): Promise<void> {
  const st = useGameStore.getState();
  if (st.readOnly || !st.dirty || !st.state || !st.base) return;
  if (saving) {
    schedule();
    return;
  }
  saving = true;
  firstPendingAt = 0;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  st.setStatus('saving');
  const sent = st.state;
  const res = await saveServer(sent, st.rev);
  saving = false;
  const now = useGameStore.getState();
  if (res.ok) {
    // Changes made while the save was in flight are still pending.
    const stillDirty = now.state !== sent;
    useGameStore.setState({ rev: res.rev, dirty: stillDirty, status: stillDirty ? 'pending' : 'saved' });
    if (now.base) saveLocal(now.base.who, { state: now.state!, rev: res.rev, dirty: stillDirty });
    if (stillDirty) schedule();
    return;
  }
  if (res.reason === 'conflict' && 'state' in res) {
    // Another device saved first. Its island wins; this one reloads quietly.
    now.adopt(res.state, res.rev);
    return;
  }
  // Offline or a transient failure: keep it on this device and try again later.
  if (res.reason === 'offline' || res.reason === 'error') {
    useGameStore.setState({ status: res.reason === 'offline' ? 'offline' : 'pending' });
    saveTimer = setTimeout(() => void flushGame(), GAME.saveMaxWaitMs);
    return;
  }
  // A refusal on the server's own terms (a cap, an item the rank has not
  // discovered) will be refused identically forever: stop asking, keep the
  // device copy, and say nothing — there is nothing here for a player to fix.
  useGameStore.setState({ status: 'local' });
}

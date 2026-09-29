'use client';

import { create } from 'zustand';

import type { StationId } from '@/lib/world/game/types';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Which of the game's screens is up, if any: the island sheet (missions, bag,
 * shop, guide), a station's panel, the sorting game, or a character talking.
 *
 * Opening any of them sets the session HUD to `juego`, which is what stops the
 * joystick, the pickups and the pads while a sheet is in front of the world —
 * the same rule every other sheet follows.
 */
export type IslaTab = 'misiones' | 'mochila' | 'tienda' | 'guia' | 'camino';

export interface Dialog {
  who: string;
  lines: string[];
  /** Shown as the button that closes it. */
  close?: string;
}

type Screen =
  | { kind: 'isla'; tab: IslaTab }
  | { kind: 'estacion'; station: StationId }
  | { kind: 'separar' }
  | { kind: 'dialogo'; dialog: Dialog };

interface GameUi {
  screen: Screen | null;
  open: (screen: Screen) => void;
  close: () => void;
}

export const useGameUi = create<GameUi>((set) => ({
  screen: null,
  open: (screen) => {
    useSessionStore.getState().setHud('juego');
    set({ screen });
  },
  close: () => {
    set({ screen: null });
    if (useSessionStore.getState().hud === 'juego') useSessionStore.getState().setHud('play');
  },
}));

'use client';

import { create } from 'zustand';

import { MATERIALS, WASTE } from '@/lib/world/game/materials';
import type { MaterialId, WasteKind } from '@/lib/world/game/types';

/**
 * The little "+1 rama" that floats up when something lands in the backpack.
 *
 * A short list, newest last, trimmed as it goes: the HUD draws whatever is in
 * it and each entry removes itself when its float is over. Consecutive gains of
 * the same thing merge into one growing number instead of stacking a column of
 * "+1" — the run reads as a run.
 */
export interface Gain {
  id: number;
  text: string;
  color: string;
  n: number;
  key: string;
  at: number;
}

interface GainStore {
  gains: Gain[];
  push: (key: string, one: string, many: string, color: string, n: number) => void;
  drop: (id: number) => void;
}

let nextId = 1;
const MERGE_MS = 900;
const MAX = 5;

export const useGains = create<GainStore>((set, get) => ({
  gains: [],
  push: (key, one, many, color, n) => {
    const now = Date.now();
    const last = get().gains.at(-1);
    if (last && last.key === key && now - last.at < MERGE_MS) {
      const merged = { ...last, n: last.n + n, text: `+${last.n + n} ${many}`, at: now };
      set({ gains: [...get().gains.slice(0, -1), merged] });
      return;
    }
    const gain = { id: nextId++, key, text: `+${n} ${n === 1 ? one : many}`, color, n, at: now };
    set({ gains: [...get().gains, gain].slice(-MAX) });
  },
  drop: (id) => set({ gains: get().gains.filter((g) => g.id !== id) }),
}));

/** A single piece says what it was ("+1 lata de aluminio"); a run says how many. */
export function pushGain(material: MaterialId, n: number, waste?: WasteKind): void {
  if (n <= 0) return;
  const def = MATERIALS[material];
  const many = def.short.toLowerCase();
  const one = waste ? WASTE[waste].name.toLowerCase() : many;
  useGains.getState().push(material, one, many, def.color, n);
}

export function pushWater(n: number): void {
  if (n <= 0) return;
  useGains.getState().push('agua', 'de agua', 'de agua', '#2DB4D4', n);
}

export function pushSemillas(n: number): void {
  if (n <= 0) return;
  useGains.getState().push('semillas', 'semilla', 'semillas', '#F2B53A', n);
}

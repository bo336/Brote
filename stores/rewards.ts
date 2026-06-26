import { create } from 'zustand';

export type RewardEvent =
  | { id: string; kind: 'rankUp'; rankSlug: string }
  | { id: string; kind: 'divisionUp'; label: string }
  | { id: string; kind: 'title'; name: string; rarity: string }
  | { id: string; kind: 'badge'; name: string; rarity: string }
  | { id: string; kind: 'sessionBonus'; points: number }
  | { id: string; kind: 'firstAction' };

/** Distributive Omit so each union member keeps its discriminant-specific props. */
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export type RewardInput = DistributiveOmit<RewardEvent, 'id'>;

interface RewardState {
  queue: RewardEvent[];
  enqueue: (events: RewardInput[]) => void;
  next: () => void;
}

let n = 0;

export const useRewards = create<RewardState>((set) => ({
  queue: [],
  enqueue: (events) =>
    set((s) => ({
      queue: [...s.queue, ...events.map((e) => ({ ...e, id: `r${++n}` }) as RewardEvent)],
    })),
  next: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

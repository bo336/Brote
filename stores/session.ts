import { create } from 'zustand';
import type { ProfileSummary } from '@/lib/types';

interface SessionState {
  profile: ProfileSummary | null;
  unreadNotifications: number;
  setProfile: (p: ProfileSummary | null) => void;
  /** Apply a server-confirmed XP/streak delta after a completion. */
  applyCompletion: (patch: { totalXp: number; streak: number }) => void;
  setUnread: (n: number) => void;
}

/**
 * Client mirror of the current user's progression summary. Hydrated from the
 * server on app load (step 2/4) and patched optimistically by the core loop so
 * the top bar + world update instantly.
 */
export const useSession = create<SessionState>((set) => ({
  profile: null,
  unreadNotifications: 0,
  setProfile: (profile) => set({ profile }),
  applyCompletion: ({ totalXp, streak }) =>
    set((s) => (s.profile ? { profile: { ...s.profile, totalXp, currentStreak: streak } } : s)),
  setUnread: (unreadNotifications) => set({ unreadNotifications }),
}));

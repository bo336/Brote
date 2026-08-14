import { create } from 'zustand';
import type { ProfileSummary } from '@/lib/types';

interface SessionState {
  profile: ProfileSummary | null;
  unreadNotifications: number;
  setProfile: (p: ProfileSummary | null) => void;
  /**
   * Apply a server-confirmed XP/streak delta after a completion.
   * `streakDate` marks today as kept, which is what dismisses the
   * "streak at risk" warning (F15.8).
   */
  applyCompletion: (patch: { totalXp: number; streak: number; streakDate?: string }) => void;
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
  applyCompletion: ({ totalXp, streak, streakDate }) =>
    set((s) =>
      s.profile
        ? {
            profile: {
              ...s.profile,
              totalXp,
              currentStreak: streak,
              // Without this the "racha en riesgo" banner stayed on screen
              // after you had just saved the streak, because it is derived
              // from lastStreakDate and nothing updated it.
              lastStreakDate: streakDate ?? s.profile.lastStreakDate,
            },
          }
        : s,
    ),
  setUnread: (unreadNotifications) => set({ unreadNotifications }),
}));

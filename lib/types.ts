/** Shared app-level types (kept separate from generated DB types). */
import type { MundoState } from './mundo';

/** Compact profile summary used by the top bar, world, and reward logic. */
export interface ProfileSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  neighborhood: string | null;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  streakFreezes: number;
  equippedTitle: string | null;
  mundoState: MundoState | null;
  interests: string[];
  onboardingCompleted: boolean;
  language: 'es' | 'en';
}

/** Payload returned by the `complete_activity` RPC (BUILD_SPEC §4.3). */
export interface CompleteActivityResult {
  points_awarded: number;
  new_total: number;
  rank_up: boolean;
  new_rank_slug: string | null;
  division_up: boolean;
  new_titles: { slug: string; name_es: string; rarity: string }[];
  new_badges: { slug: string; name_es: string; rarity: string }[];
  streak: number;
  streak_incremented: boolean;
  daily_set_complete: boolean;
  session_bonus: number;
  first_time: boolean;
  status: 'honor' | 'pending' | 'verified' | 'rejected';
  mundo_delta: { liveliness?: number; new_elements?: string[] } | null;
}

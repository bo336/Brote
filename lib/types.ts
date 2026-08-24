/** Shared app-level types (kept separate from generated DB types). */
import type { MundoState } from './mundo';

/** Compact profile summary used by the top bar, world, and reward logic. */
export interface ProfileSummary {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  neighborhood: string | null;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  streakFreezes: number;
  /** Soft currency spent in the tienda on cosmetics (F11.2). Never buys rank. */
  semillas: number;
  equippedTitle: string | null;
  mundoState: MundoState | null;
  /** Lifetime scoring completions — drives per-completion world micro-growth. */
  completionsCount?: number;
  /** Onboarding personal context (balcon/jardin/auto/bici/mascota/compra). */
  context?: Record<string, unknown> | null;
  /** Pip avatar customization (body palette + accessories). */
  pipStyle?: { body?: string; hat?: string; glasses?: string; pattern?: string } | null;
  /** Account type — gates which actions/news/competitions are shown. */
  accountType?: 'kid' | 'teen' | 'adult';
  /** Organization (school/club) the user belongs to, if any. */
  orgId?: string | null;
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
  /** Fresh server-computed world state (authoritative — replaces optimistic client recompute). */
  mundo: MundoState | null;
  /** Lifetime scoring completions — drives per-completion world micro-growth. */
  completions_count: number;
  /** Challenges newly completed by this action (already rewarded server-side). */
  challenges_completed: { title_es: string; reward_points: number; type: string }[];
  /** Set when this completion finished a world (Mundo Infinito ceremony). */
  world_completed: { completed_index: number; new_index: number } | null;
  /** Real resources saved by THIS action (F12.2). */
  impact?: { water_l: number; co2_kg: number; waste_kg: number; energy_kwh: number } | null;
  /** Set when the action is a tracked habit (F12.6). */
  habit?: { streak: number; bonus: number } | null;
  /** Semillas granted by THIS action (milestones only — see migration 0038). */
  semillas_earned?: number;
  /** Balance after the grant, straight from the server. */
  semillas_balance?: number;
  mundo_delta: { liveliness?: number; new_elements?: string[] } | null;
}

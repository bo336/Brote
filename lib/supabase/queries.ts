import 'server-only';

import { createClient } from './server';
import { parseMundoState } from '@/lib/mundo';
import type { ProfileSummary } from '@/lib/types';

export interface SessionData {
  profile: ProfileSummary | null;
  unread: number;
}

interface ProfileQueryRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
  total_xp: number | string;
  current_streak: number;
  longest_streak: number;
  last_streak_date: string | null;
  streak_freezes: number;
  mundo_state: unknown;
  interests: string[] | null;
  onboarding_completed: boolean;
  language: string;
  equipped_title: { name_es: string } | null;
}

/**
 * Loads the current user's profile + unread notification count for the app
 * shell (BUILD_SPEC §8.1). Returns `{ profile: null }` when signed out.
 */
export async function getSessionData(): Promise<SessionData> {
  const supabase = createClient();
  // Middleware already validated + refreshed the session via getUser() on this
  // request; here we just read it locally (no extra auth round-trip) to get the
  // user id. This avoids a second cross-region call and the getUser() flakiness
  // that caused redirect loops.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { profile: null, unread: 0 };

  const [profRes, notifRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, username, display_name, avatar_url, neighborhood, total_xp, current_streak, longest_streak, last_streak_date, streak_freezes, mundo_state, interests, onboarding_completed, language, equipped_title:titles(name_es)',
      )
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ]);

  const row = profRes.data as ProfileQueryRow | null;
  const count = notifRes.count;
  if (!row) return { profile: null, unread: 0 };

  const profile: ProfileSummary = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    neighborhood: row.neighborhood,
    totalXp: Number(row.total_xp ?? 0),
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastStreakDate: row.last_streak_date,
    streakFreezes: row.streak_freezes ?? 0,
    equippedTitle: (row.equipped_title as { name_es: string } | null)?.name_es ?? null,
    mundoState: parseMundoState(row.mundo_state),
    interests: row.interests ?? [],
    onboardingCompleted: row.onboarding_completed ?? false,
    language: (row.language as 'es' | 'en') ?? 'es',
  };

  return { profile, unread: count ?? 0 };
}

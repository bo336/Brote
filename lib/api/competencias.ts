'use client';

import { createClient } from '@/lib/supabase/client';

/** null = the competition never ends. */
export type ResetPeriod = 'weekly' | 'monthly' | null;

export interface CompetitionSummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_public?: boolean;
  /** null = open-ended. */
  ends_at: string | null;
  reset_period?: ResetPeriod;
  reset_anchor?: number | null;
  members: number;
  active?: boolean;
  /** Whether the current user is already a member (public listings). */
  joined?: boolean;
}

export interface CompetitionBoard {
  ok: boolean;
  name: string;
  code: string;
  is_public: boolean;
  starts_at: string;
  ends_at: string | null;
  reset_period: ResetPeriod;
  reset_anchor: number | null;
  /** Start of the current scoring period (equals starts_at when no reset). */
  period_start: string;
  rows: {
    pos: number;
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    /** Points in the CURRENT period. */
    xp: number;
    /** Points since the competition began. */
    total_xp: number;
    actions: number;
  }[];
}

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Human sentence describing when the board resets, e.g. "Reinicia cada lunes". */
export function resetLabel(period: ResetPeriod, anchor?: number | null): string | null {
  if (!period) return null;
  if (period === 'weekly') return `Reinicia cada ${DAYS_ES[anchor ?? 1] ?? 'lunes'}`;
  return `Reinicia el ${anchor ?? 1} de cada mes`;
}

export async function fetchMyCompetitions(): Promise<CompetitionSummary[]> {
  const { data, error } = await createClient().rpc('my_competitions');
  if (error) throw error;
  return (data ?? []) as CompetitionSummary[];
}

export async function fetchPublicCompetitions(): Promise<CompetitionSummary[]> {
  const { data, error } = await createClient().rpc('public_competitions', { p_limit: 20 });
  if (error) throw error;
  return (data ?? []) as CompetitionSummary[];
}

export async function fetchCompetitionBoard(id: string): Promise<CompetitionBoard> {
  const { data, error } = await createClient().rpc('competition_leaderboard', { p_competition_id: id });
  if (error) throw error;
  return data as CompetitionBoard;
}

export async function createCompetition(
  name: string,
  description: string,
  isPublic: boolean,
  /** null or 0 creates an open-ended competition with no end date. */
  days: number | null,
  resetPeriod: ResetPeriod = null,
  resetAnchor: number | null = null,
): Promise<{ id: string; code: string }> {
  const { data, error } = await createClient().rpc('create_competition', {
    p_name: name,
    p_description: description,
    p_is_public: isPublic,
    p_days: days,
    p_reset_period: resetPeriod,
    p_reset_anchor: resetAnchor,
  });
  if (error) throw error;
  return data as { id: string; code: string };
}

/** Anything joinable must be leavable (F15.10). */
export async function leaveCompetition(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('leave_competition', { p_competition_id: id });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function joinCompetition(code: string): Promise<{ ok: boolean; error?: string; name?: string }> {
  const { data, error } = await createClient().rpc('join_competition', { p_code: code });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; name?: string };
}

// ── Habits ──────────────────────────────────────────────────────────────────

export interface Habit {
  activity_id: string;
  title_es: string;
  domain_slug: string;
  base_points: number;
  cadence: string;
  current_streak: number;
  longest_streak: number;
  done_today: boolean;
}

export interface RoutineSuggestion {
  activity_id: string;
  slug: string;
  title_es: string;
  short_es: string | null;
  domain_slug: string;
  base_points: number;
}

/**
 * Routine-eligible actions not yet pinned. Only a curated subset qualifies —
 * see the routine_eligible column and F14.5.
 */
export async function fetchRoutineSuggestions(limit = 12): Promise<RoutineSuggestion[]> {
  const { data, error } = await createClient().rpc('routine_suggestions', { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as RoutineSuggestion[];
}

export async function fetchMyHabits(): Promise<Habit[]> {
  const { data, error } = await createClient().rpc('my_habits');
  if (error) throw error;
  return (data ?? []) as Habit[];
}

export async function addHabit(activityId: string, cadence = 'daily'): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('add_habit', { p_activity_id: activityId, p_cadence: cadence });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function removeHabit(activityId: string): Promise<void> {
  const { error } = await createClient().rpc('remove_habit', { p_activity_id: activityId });
  if (error) throw error;
}

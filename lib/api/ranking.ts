'use client';

import { createClient } from '@/lib/supabase/client';
import type { LeaderboardEntry } from '@/lib/supabase/rows';

export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('global_leaderboard', { p_limit: 100, p_offset: 0 });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('weekly_leaderboard', { p_limit: 100 });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

/**
 * Every board can be viewed for the rolling week or for all time. Weekly is
 * the default across the app so newcomers are never permanently buried under
 * veterans' lifetime totals.
 */
export type Period = 'semana' | 'historico';

/** Which field carries the score for a given period. */
export function metricFor(period: Period): 'xp' | 'total_xp' {
  return period === 'semana' ? 'xp' : 'total_xp';
}

export async function fetchCityLeaderboardWeekly(city: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('city_leaderboard_weekly', { p_city: city, p_limit: 100 });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchFriendLeaderboardWeekly(userId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('friend_leaderboard_weekly', { p_uid: userId });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchDomainLeaderboardWeekly(domain: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('domain_leaderboard_weekly', {
    p_domain: domain,
    p_limit: 100,
    p_offset: 0,
  });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

/**
 * Your position, for the period actually being shown. The lifetime and weekly
 * boards rank by different fields, so asking only the lifetime RPC left the
 * number frozen when the toggle changed.
 */
export async function fetchMyPositionFor(userId: string, period: Period): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    period === 'semana' ? 'get_user_weekly_position' : 'get_user_global_position',
    { p_uid: userId },
  );
  if (error) throw error;
  return Number(data ?? 0);
}

export async function fetchCityLeaderboard(city: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('city_leaderboard', {
    p_city: city,
    p_limit: 100,
  });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchFriendLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('friend_leaderboard', { p_uid: userId });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchDomainLeaderboard(domain: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('domain_leaderboard', { p_domain: domain, p_limit: 100, p_offset: 0 });
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export interface WeeklyLeague {
  league: string;
  group_index: number;
  my_pos: number;
  week_start: string;
  rows: {
    pos: number;
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    rank_slug: string;
    division: number;
    xp: number;
  }[];
}

/** Duolingo-style weekly league: your cohort of 20 ranked by this week's XP. */
export async function fetchWeeklyLeague(userId: string): Promise<WeeklyLeague> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('weekly_league', { p_uid: userId });
  if (error) throw error;
  return data as WeeklyLeague;
}

export async function fetchMyPosition(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_user_global_position', { p_uid: userId });
  if (error) throw error;
  return Number(data ?? 0);
}

/** Your shareable invite code, created on first request (F15.11). */
export async function fetchMyFriendCode(): Promise<string> {
  const { data, error } = await createClient().rpc('my_friend_code');
  if (error) throw error;
  return String(data ?? '');
}

/**
 * Send a friend request from a code. Returns `accepted` when the other person
 * had already requested you, in which case the match completes immediately.
 */
export async function addFriendByCode(
  code: string,
): Promise<{ ok: boolean; error?: string; name?: string; accepted?: boolean; pending?: boolean; message?: string }> {
  const { data, error } = await createClient().rpc('add_friend_by_code', { p_code: code });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; name?: string };
}

export interface FriendRequest {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  rank_slug: string | null;
  requested_at: string;
}

/** Requests waiting for MY answer (F: friend requests). */
export async function fetchFriendRequests(): Promise<FriendRequest[]> {
  const { data, error } = await createClient().rpc('my_friend_requests');
  if (error) throw error;
  return (data ?? []) as FriendRequest[];
}

export async function acceptFriendRequest(requesterId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('accept_friend_request', { p_requester: requesterId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function rejectFriendRequest(requesterId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('reject_friend_request', { p_requester: requesterId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function removeFriend(friendId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('remove_friend', { p_friend_id: friendId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/** Add a friend by username (creates an accepted friendship). */
export async function addFriendByUsername(username: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: profiles } = await supabase.rpc('get_public_profile', { p_username: username.trim() });
  const friend = (profiles ?? [])[0] as { id: string } | undefined;
  if (!friend) return { ok: false, error: 'No encontramos a esa persona' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado' };
  if (friend.id === user.id) return { ok: false, error: 'Ese sos vos 🙂' };

  const { error } = await supabase
    .from('friendships')
    .upsert({ user_id: user.id, friend_id: friend.id, status: 'accepted' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

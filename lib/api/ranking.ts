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

export async function fetchNeighborhoodLeaderboard(neighborhood: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('neighborhood_leaderboard', {
    p_neighborhood: neighborhood,
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

export async function fetchMyPosition(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_user_global_position', { p_uid: userId });
  if (error) throw error;
  return Number(data ?? 0);
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

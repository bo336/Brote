'use client';

import { createClient } from '@/lib/supabase/client';
import type { PipStyle } from '@/components/pip/Pip';

/**
 * The social graph.
 *
 * Following is asymmetric and instant, and is a different thing from
 * `friendships` (mutual, request/accept, powers the Amigos leaderboard). They
 * are deliberately not merged: a friend is not a follower.
 */

export interface SocialAccount {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  pip_style: PipStyle | null;
  rank_slug: string | null;
  is_verified: boolean;
  followers_count: number;
  city: string | null;
  bio?: string | null;
  is_following?: boolean;
}

export interface FollowResult {
  ok: boolean;
  following?: boolean;
  followers?: number;
  error?: string;
}

export async function followUser(targetId: string): Promise<FollowResult> {
  const { data, error } = await createClient().rpc('follow_user', { p_target: targetId });
  if (error) return { ok: false, error: error.message };
  return data as FollowResult;
}

export async function unfollowUser(targetId: string): Promise<FollowResult> {
  const { data, error } = await createClient().rpc('unfollow_user', { p_target: targetId });
  if (error) return { ok: false, error: error.message };
  return data as FollowResult;
}

/** Ids I follow. Cheap enough to hold in the query cache and reuse everywhere. */
export async function fetchMyFollowingIds(): Promise<string[]> {
  const { data, error } = await createClient().rpc('my_following_ids');
  if (error) return [];
  return (data ?? []) as string[];
}

/**
 * Real accounts worth following. The server excludes kids, private profiles,
 * blocked accounts and anyone already followed — and it can never return a
 * simulated player, because those only exist as leaderboard rows and are not
 * in `profiles` at all.
 */
export async function fetchSuggestedAccounts(limit = 6): Promise<SocialAccount[]> {
  const { data, error } = await createClient().rpc('suggested_accounts', { p_limit: limit });
  if (error) return [];
  return (data ?? []) as SocialAccount[];
}

export async function searchProfiles(q: string, limit = 20): Promise<SocialAccount[]> {
  if (q.trim().length < 2) return [];
  const { data, error } = await createClient().rpc('search_profiles', { p_q: q.trim(), p_limit: limit });
  if (error) return [];
  return (data ?? []) as SocialAccount[];
}

// ── Protecting yourself, without waiting for moderation ─────────────────────

export async function blockUser(targetId: string, on = true): Promise<{ ok: boolean; blocked?: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('block_user', { p_target: targetId, p_on: on });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; blocked?: boolean; error?: string };
}

export async function muteUser(targetId: string, on = true): Promise<{ ok: boolean; muted?: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('mute_user', { p_target: targetId, p_on: on });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; muted?: boolean; error?: string };
}

/** The reasons a report can carry. Kept in sync with the DB check constraint. */
export const REPORT_REASONS = [
  'spam',
  'odio',
  'acoso',
  'desinformacion',
  'sexual',
  'violencia',
  'menores',
  'otro',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export async function reportContent(input: {
  postId?: string | null;
  profileId?: string | null;
  reason: ReportReason;
  note?: string | null;
}): Promise<{ ok: boolean; already?: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('report_content', {
    p_post_id: input.postId ?? null,
    p_profile_id: input.profileId ?? null,
    p_reason: input.reason,
    p_note: input.note ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; already?: boolean; error?: string };
}

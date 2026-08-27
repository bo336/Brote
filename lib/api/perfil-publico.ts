'use client';

import { createClient } from '@/lib/supabase/client';
import type { PipStyle } from '@/components/pip/Pip';
import type { FeedItem } from './feed';
import type { SocialAccount } from './social';

/**
 * Profiles v2 — "the account is the receipt".
 *
 * One call returns everything the profile renders, and the visibility gate is
 * decided server-side. When `viewer.can_see` is false the payload genuinely
 * omits `stats` and `recent` rather than sending them for the UI to hide, so a
 * private profile cannot be read out of the network tab.
 */

export interface PublicProfileV2 {
  id: string;
  username: string | null;
  display_name: string | null;
  bio?: string | null;
  city?: string | null;
  avatar_url: string | null;
  pip_style: PipStyle | null;
  account_type?: 'kid' | 'teen' | 'adult';
  rank_slug: string | null;
  division: number | null;
  rank_tier?: number;
  total_xp?: number;
  current_streak?: number;
  longest_streak?: number;
  streak_freezes?: number;
  equipped_title?: string | null;
  is_verified: boolean;
  is_creator: boolean;
  plan?: 'free' | 'plus';
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  profile_visibility: 'public' | 'followers' | 'private';
  mundo_state?: unknown;
}

export interface ProfileViewer {
  is_me: boolean;
  is_following: boolean;
  follows_me: boolean;
  is_blocked: boolean;
  /** False = the header is all you get. Decided by the RPC, never here. */
  can_see: boolean;
}

export interface ProfileImpact {
  water_l: number;
  co2_kg: number;
  waste_kg: number;
  energy_kwh: number;
  actions: number;
}

export interface ProfileStats {
  completions_total: number;
  completions_30d: number;
  domain_points: Record<string, number>;
  impact: ProfileImpact;
  impact_30d: ProfileImpact;
  badges: { slug: string; name_es: string; rarity: string; icon: string | null; earned_at: string }[];
  titles: { slug: string; name_es: string; rarity: string; equipped: boolean }[];
  league: { name: string; tier: number; group_index: number; last_result: string | null } | null;
  global_position: number;
  weekly_position: number;
  projects_created: number;
  projects_joined: number;
  sessions_attended: number;
  habits_active: number;
  lessons_completed: number;
}

export interface PublicProfileResult {
  ok: boolean;
  error?: string;
  profile?: PublicProfileV2;
  viewer?: ProfileViewer;
  stats?: ProfileStats | null;
  recent?: { posts: FeedItem[] } | null;
}

export async function fetchPublicProfileV2(username: string): Promise<PublicProfileResult> {
  const { data, error } = await createClient().rpc('get_public_profile_v2', { p_username: username });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false }) as PublicProfileResult;
}

export interface PostsPage {
  items: FeedItem[];
  next_cursor: string | null;
}

export async function fetchProfilePosts(
  userId: string,
  kind: 'posts' | 'replies' = 'posts',
  cursor: string | null = null,
  limit = 20,
): Promise<PostsPage> {
  const { data, error } = await createClient().rpc('profile_posts', {
    p_user: userId,
    p_kind: kind,
    p_cursor: cursor,
    p_limit: limit,
  });
  if (error) throw error;
  const d = (data ?? {}) as Partial<PostsPage>;
  return { items: d.items ?? [], next_cursor: d.next_cursor ?? null };
}

/** Your own bookmarks. Private — nobody else can see them or their count. */
export async function fetchSavedPosts(cursor: string | null = null, limit = 20): Promise<PostsPage> {
  const { data, error } = await createClient().rpc('my_saved_posts', { p_cursor: cursor, p_limit: limit });
  if (error) throw error;
  const d = (data ?? {}) as Partial<PostsPage>;
  return { items: d.items ?? [], next_cursor: d.next_cursor ?? null };
}

export interface AccountsPage {
  items: SocialAccount[];
  next_cursor: string | null;
}

export async function fetchFollowers(userId: string, cursor: string | null = null, limit = 30): Promise<AccountsPage> {
  const { data, error } = await createClient().rpc('followers_of', {
    p_user: userId,
    p_cursor: cursor,
    p_limit: limit,
  });
  if (error) throw error;
  const d = (data ?? {}) as Partial<AccountsPage>;
  return { items: d.items ?? [], next_cursor: d.next_cursor ?? null };
}

export async function fetchFollowing(userId: string, cursor: string | null = null, limit = 30): Promise<AccountsPage> {
  const { data, error } = await createClient().rpc('following_of', {
    p_user: userId,
    p_cursor: cursor,
    p_limit: limit,
  });
  if (error) throw error;
  const d = (data ?? {}) as Partial<AccountsPage>;
  return { items: d.items ?? [], next_cursor: d.next_cursor ?? null };
}

/** Change your own @handle. The server owns uniqueness and the charset rule. */
export async function setMyUsername(username: string): Promise<{ ok: boolean; username?: string; error?: string }> {
  const { data, error } = await createClient().rpc('set_my_username', { p_username: username });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; username?: string; error?: string };
}

export interface BlockedAndMuted {
  blocked: SocialAccount[];
  muted: SocialAccount[];
}

export async function fetchBlocksAndMutes(): Promise<BlockedAndMuted> {
  const { data, error } = await createClient().rpc('my_blocks_and_mutes');
  if (error) return { blocked: [], muted: [] };
  const d = (data ?? {}) as Partial<BlockedAndMuted>;
  return { blocked: d.blocked ?? [], muted: d.muted ?? [] };
}

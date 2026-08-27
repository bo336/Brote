'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type { PipStyle } from '@/components/pip/Pip';

/** The three timeline tabs. Kids are forced to `novedades` server-side. */
export type FeedTab = 'para_vos' | 'siguiendo' | 'novedades';

export interface FeedAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  /** The customised mascot — this is the identity, not the photo. */
  pip_style: PipStyle | null;
  rank_slug: string | null;
  is_verified: boolean;
  city: string | null;
  total_xp: number | null;
  is_following: boolean;
}

export interface FeedNews {
  id: string;
  title_es: string | null;
  summary_es: string | null;
  image_url: string | null;
  source: string | null;
  source_url: string;
  published_at: string | null;
}

/** The original post behind a "replantar". */
export interface FeedRepostOf {
  id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  author: Pick<FeedAuthor, 'id' | 'username' | 'display_name' | 'pip_style' | 'avatar_url' | 'rank_slug'> | null;
}

export interface FeedItem {
  id: string;
  kind: 'news' | 'post' | 'reply' | 'repost' | 'milestone';
  created_at: string;
  edited_at: string | null;
  body: string | null;
  image_url: string | null;
  domain_tags: string[];
  like_count: number;
  dislike_count: number;
  reply_count: number;
  repost_count: number;
  /** 1 = liked, -1 = disliked, null = no reaction from this user. */
  my_reaction: number | null;
  saved: boolean;
  /** Whether *you* have already replanted this one — drives the toggle. */
  reposted: boolean;
  /**
   * Held by the word list, pending review. Only ever true on your own profile:
   * every other surface filters hidden posts out before they reach here.
   */
  hidden: boolean;
  author: FeedAuthor | null;
  news: FeedNews | null;
  repost_of: FeedRepostOf | null;
}

/**
 * Keyset cursor. Carried back verbatim on the next page, together with the
 * same `now`, so the ranking cannot reshuffle under the reader mid-scroll.
 */
export interface FeedCursor {
  score: number;
  created_at: string;
  id: string;
}

export interface FeedPage {
  items: FeedItem[];
  next_cursor: FeedCursor | null;
}

export interface FeedThread {
  post: FeedItem | null;
  replies: FeedItem[];
}

/** Real counts for the live strip. Never a number that isn't in the database. */
export interface FeedPulse {
  today: number;
  total: number;
  trending: string | null;
  topics: string[];
}

/**
 * One page of the timeline.
 *
 * `now` is the timestamp of the FIRST page of a scroll and must be passed
 * unchanged on every subsequent page — recency decay is part of the score, so
 * a fresh `now` per page would re-rank items the reader already passed.
 */
export async function fetchFeedPage(
  tab: FeedTab,
  topic: string | null,
  cursor: FeedCursor | null,
  now: string,
  limit = 20,
): Promise<FeedPage> {
  const { data, error } = await createClient().rpc('feed_timeline_v2', {
    p_tab: tab,
    p_topic: topic && topic !== 'all' ? topic : null,
    p_limit: limit,
    p_now: now,
    p_cursor_score: cursor?.score ?? null,
    p_cursor_created: cursor?.created_at ?? null,
    p_cursor_id: cursor?.id ?? null,
  });
  if (error) throw error;
  const d = (data ?? {}) as Partial<FeedPage>;
  return { items: d.items ?? [], next_cursor: d.next_cursor ?? null };
}

export async function fetchPulse(): Promise<FeedPulse> {
  const { data, error } = await createClient().rpc('feed_pulse');
  if (error) throw error;
  const d = (data ?? {}) as Partial<FeedPulse>;
  return { today: d.today ?? 0, total: d.total ?? 0, trending: d.trending ?? null, topics: d.topics ?? [] };
}

export async function fetchThread(postId: string): Promise<FeedThread> {
  const { data, error } = await createClient().rpc('feed_thread_v2', { p_post_id: postId });
  if (error) throw error;
  const d = (data ?? {}) as Partial<FeedThread>;
  return { post: d.post ?? null, replies: d.replies ?? [] };
}

export interface CreatePostInput {
  body: string;
  parentId?: string | null;
  newsId?: string | null;
  imageUrl?: string | null;
  repostOf?: string | null;
}

/**
 * `held` means the text tripped the word list and went in hidden, pending
 * review. It is deliberately not an error: silently eating someone's post is
 * worse than delaying it, so the UI tells them it is being looked at.
 */
export async function createPost(
  input: CreatePostInput,
): Promise<{ ok: boolean; id?: string; held?: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('create_feed_post_v2', {
    p_body: input.body,
    p_parent_id: input.parentId ?? null,
    p_news_id: input.newsId ?? null,
    p_image_url: input.imageUrl ?? null,
    p_repost_of: input.repostOf ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; id?: string; held?: boolean; error?: string };
}

/** Max bytes accepted before compression. Mirrors the bucket's own limit. */
export const MAX_FEED_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Compress and upload one post image.
 *
 * The canvas re-encode in `compressImage` drops all EXIF, including GPS —
 * that is a privacy property of this path, not an optimisation. Do not
 * "improve" it by uploading the original file.
 */
export async function uploadFeedImage(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const blob = await compressImage(file, 1600, 0.8);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('feed').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('feed').getPublicUrl(path).data.publicUrl;
}

export async function reactToPost(
  postId: string,
  value: 1 | -1,
): Promise<{ ok: boolean; like_count?: number; dislike_count?: number; my_reaction?: number | null; error?: string }> {
  const { data, error } = await createClient().rpc('react_to_post', { p_post_id: postId, p_value: value });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; like_count?: number; dislike_count?: number; my_reaction?: number | null };
}

export async function deletePost(postId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('delete_feed_post', { p_post_id: postId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/**
 * Undo your own replant.
 *
 * A dedicated RPC rather than "find my repost id, then call deletePost":
 * one round trip instead of two, and the `author_id = auth.uid()` filter
 * lives on the server, so there is no window in which the id being deleted
 * could be somebody else's.
 */
export async function unrepost(
  postId: string,
): Promise<{ ok: boolean; removed?: number; repost_count?: number; error?: string }> {
  const { data, error } = await createClient().rpc('unrepost', { p_post_id: postId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; removed?: number; repost_count?: number };
}

/** The server allows edits for 5 minutes; the UI hides the option after that. */
export const EDIT_WINDOW_MS = 5 * 60 * 1000;

export function canStillEdit(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
}

export async function editPost(postId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('edit_feed_post', { p_post_id: postId, p_body: body });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function toggleSave(postId: string): Promise<{ ok: boolean; saved?: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('toggle_save_post', { p_post_id: postId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; saved?: boolean; error?: string };
}

/**
 * Record impressions so the ranker can push down what you already scrolled
 * past. Fire-and-forget on purpose: a failure here must never interrupt a
 * scroll, and the worst case is seeing an item twice.
 */
export async function markSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await createClient().rpc('mark_feed_seen', { p_ids: ids });
  } catch {
    /* ignore */
  }
}

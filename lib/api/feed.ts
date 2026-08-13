'use client';

import { createClient } from '@/lib/supabase/client';

export interface FeedAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rank_slug: string | null;
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

export interface FeedItem {
  id: string;
  kind: 'news' | 'post' | 'reply';
  created_at: string;
  body: string | null;
  domain_tags: string[];
  like_count: number;
  dislike_count: number;
  reply_count: number;
  /** 1 = liked, -1 = disliked, null = no reaction from this user. */
  my_reaction: number | null;
  author: FeedAuthor | null;
  news: FeedNews | null;
}

export interface FeedThread {
  post: FeedItem | null;
  replies: FeedItem[];
}

export async function fetchFeed(topic: string | null, limit = 40, offset = 0): Promise<FeedItem[]> {
  const { data, error } = await createClient().rpc('feed_timeline', {
    p_limit: limit,
    p_offset: offset,
    p_topic: topic && topic !== 'all' ? topic : null,
  });
  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

export async function fetchThread(postId: string): Promise<FeedThread> {
  const { data, error } = await createClient().rpc('feed_thread', { p_post_id: postId });
  if (error) throw error;
  const d = (data ?? {}) as Partial<FeedThread>;
  return { post: d.post ?? null, replies: d.replies ?? [] };
}

export async function createPost(
  body: string,
  parentId?: string | null,
  newsId?: string | null,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await createClient().rpc('create_feed_post', {
    p_body: body,
    p_parent_id: parentId ?? null,
    p_news_id: newsId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; id?: string; error?: string };
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

'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type { ProjectRow, NewsRow } from '@/lib/supabase/rows';

export interface ProjectWithMeta extends ProjectRow {
  participant_count: number;
  joined: boolean;
  upvoted: boolean;
}

export interface ProfileBrief {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rank_slug: string;
  division: number;
}

/** Project feed with participant counts + the user's joined/upvoted state. */
export async function fetchProjects(userId?: string): Promise<ProjectWithMeta[]> {
  const supabase = createClient();
  const [{ data: projects, error }, { data: parts }, { data: mine }, { data: ups }] = await Promise.all([
    supabase.from('projects').select('*').neq('status', 'cancelled').order('event_date', { ascending: true }),
    supabase.from('project_participants').select('project_id'),
    userId
      ? supabase.from('project_participants').select('project_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { project_id: string }[] }),
    userId
      ? supabase.from('project_upvotes').select('project_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { project_id: string }[] }),
  ]);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const p of (parts ?? []) as { project_id: string }[]) counts.set(p.project_id, (counts.get(p.project_id) ?? 0) + 1);
  const joined = new Set((mine ?? []).map((p: { project_id: string }) => p.project_id));
  const upvoted = new Set((ups ?? []).map((p: { project_id: string }) => p.project_id));

  return ((projects ?? []) as ProjectRow[]).map((p) => ({
    ...p,
    participant_count: counts.get(p.id) ?? 0,
    joined: joined.has(p.id),
    upvoted: upvoted.has(p.id),
  }));
}

export async function fetchProject(id: string, userId?: string): Promise<ProjectWithMeta | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [{ count }, { data: mine }, { data: up }] = await Promise.all([
    supabase.from('project_participants').select('user_id', { count: 'exact', head: true }).eq('project_id', id),
    userId
      ? supabase.from('project_participants').select('user_id').eq('project_id', id).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
    userId
      ? supabase.from('project_upvotes').select('user_id').eq('project_id', id).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    ...(data as ProjectRow),
    participant_count: count ?? 0,
    joined: !!mine,
    upvoted: !!up,
  };
}

export async function fetchProjectParticipants(projectId: string): Promise<ProfileBrief[]> {
  const supabase = createClient();
  const { data: parts } = await supabase
    .from('project_participants')
    .select('user_id')
    .eq('project_id', projectId)
    .limit(50);
  const ids = (parts ?? []).map((p: { user_id: string }) => p.user_id);
  if (ids.length === 0) return [];
  const { data } = await supabase.rpc('get_profiles_brief', { p_ids: ids });
  return (data ?? []) as ProfileBrief[];
}

export async function joinProject(projectId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('join_project', { p_project_id: projectId });
  if (error) throw error;
}

export async function upvoteProject(projectId: string): Promise<{ upvoted: boolean; upvotes: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('upvote_project', { p_project_id: projectId });
  if (error) throw error;
  return data as { upvoted: boolean; upvotes: number };
}

export interface CreateProjectInput {
  title: string;
  description: string;
  type: string;
  domain: string;
  neighborhood: string;
  locationText: string;
  lat: number | null;
  lng: number | null;
  eventDate: string | null;
  maxParticipants: number | null;
  imageUrl: string | null;
  minRank: string;
}

export async function createProject(input: CreateProjectInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_project', {
    p_title: input.title,
    p_description: input.description,
    p_type: input.type,
    p_domain: input.domain,
    p_neighborhood: input.neighborhood,
    p_location_text: input.locationText,
    p_lat: input.lat,
    p_lng: input.lng,
    p_event_date: input.eventDate,
    p_max_participants: input.maxParticipants,
    p_image_url: input.imageUrl,
    p_min_rank: input.minRank,
  });
  if (error) throw error;
  return data as string;
}

export async function uploadProjectImage(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const blob = await compressImage(file, 1600, 0.82);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('projects').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('projects').getPublicUrl(path).data.publicUrl;
}

/** News feed, personalized by interest match + interest score + recency (§8.5). */
export async function fetchNews(interests: string[]): Promise<NewsRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('active', true)
    .order('published_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  const rows = (data ?? []) as NewsRow[];
  // Personalized blend: interest-domain match + interest_score + recency.
  return rows
    .map((n) => {
      const match = n.domain_tags.some((d) => interests.includes(d)) ? 30 : 0;
      const recency = n.published_at ? Math.max(0, 20 - (Date.now() - new Date(n.published_at).getTime()) / 86400000) : 0;
      return { n, score: match + n.interest_score * 0.5 + recency };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.n);
}

export async function fetchNewsItem(id: string): Promise<NewsRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('news').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as NewsRow | null) ?? null;
}

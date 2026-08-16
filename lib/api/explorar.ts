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

export interface ProjectSession {
  id: string;
  title: string;
  notes: string | null;
  held_at: string;
  points_each: number;
  attendees: number;
  i_was_there: boolean;
}

/** Work sessions ("jornadas") already held for a project (F14.8). */
export async function fetchProjectSessions(projectId: string): Promise<ProjectSession[]> {
  const { data, error } = await createClient().rpc('project_sessions_list', { p_project_id: projectId });
  if (error) throw error;
  return (data ?? []) as ProjectSession[];
}

/**
 * Close a work session and credit everyone who turned out. Organiser only —
 * enforced server-side too. Repeatable, so a project can run in phases. Points
 * per person are a single fixed, admin-set amount — same for every project,
 * every group size, every time (no per-project or turnout variance).
 */
export async function completeProjectSession(
  projectId: string,
  title: string,
  notes?: string | null,
  attendeeIds?: string[] | null,
): Promise<{ ok: boolean; error?: string; attendees?: number; points_each?: number }> {
  const { data, error } = await createClient().rpc('complete_project_session', {
    p_project_id: projectId,
    p_title: title,
    p_attendee_ids: attendeeIds ?? null,
    p_notes: notes ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; attendees?: number; points_each?: number; multiplier?: number };
}

/** Leave a project you joined. Organisers cannot abandon their own (F15.10). */
export async function leaveProject(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('leave_project', { p_project_id: projectId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
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
  /** How people reach the organiser to coordinate (F14.8). */
  contactInfo?: string | null;
  contactKind?: 'whatsapp' | 'email' | 'instagram' | 'telegram' | 'otro' | null;
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
    p_contact_info: input.contactInfo ?? null,
    p_contact_kind: input.contactKind ?? null,
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

/**
 * News feed, personalized per user (IMPROVEMENT_PLAN A1):
 *   score = quality × recencyDecay × (1 + affinity)
 * - quality: the AI/heuristic interest_score (0-100).
 * - recencyDecay: exponential half-life of 48h (a 4-day-old piece is worth ~25%
 *   of a fresh one), floored so a sparse feed still surfaces older gems.
 * - affinity: graded overlap between the item's domain tags and the user's
 *   interests (first match counts full, extra matches add a little).
 * Then a greedy source-diversity re-rank so one outlet never floods the top.
 */
export async function fetchNews(interests: string[], accountType: 'kid' | 'teen' | 'adult' = 'adult'): Promise<NewsRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('active', true)
    // Age-appropriate feed (PLAN F12.1).
    .contains('age_groups', [accountType])
    .order('published_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  const rows = (data ?? []) as NewsRow[];
  const interestSet = new Set(interests);

  const scored = rows.map((n) => {
    const ageHours = n.published_at ? Math.max(0, (Date.now() - new Date(n.published_at).getTime()) / 3_600_000) : 96;
    const recency = Math.max(0.05, Math.pow(0.5, ageHours / 48));
    const matches = n.domain_tags.filter((d) => interestSet.has(d)).length;
    const affinity = matches === 0 ? 0 : 0.6 + Math.min(2, matches - 1) * 0.15;
    return { n, score: Math.max(1, n.interest_score) * recency * (1 + affinity) };
  });

  // Greedy pick with a per-source repetition penalty (0.7^timesPicked).
  const out: NewsRow[] = [];
  const bySource = new Map<string, number>();
  const pool = [...scored];
  while (pool.length > 0) {
    let bestIdx = 0;
    let bestEff = -1;
    for (let i = 0; i < pool.length; i++) {
      const src = pool[i]!.n.source ?? '';
      const eff = pool[i]!.score * Math.pow(0.7, bySource.get(src) ?? 0);
      if (eff > bestEff) {
        bestEff = eff;
        bestIdx = i;
      }
    }
    const picked = pool.splice(bestIdx, 1)[0]!;
    const src = picked.n.source ?? '';
    bySource.set(src, (bySource.get(src) ?? 0) + 1);
    out.push(picked.n);
  }
  return out;
}

export async function fetchNewsItem(id: string): Promise<NewsRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('news').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as NewsRow | null) ?? null;
}

'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type { ActivityRow, CompletionStatus } from '@/lib/supabase/rows';
import type { DomainSlug } from '@/lib/domains';

/** All active catalog activities (RLS already scopes to active=true). */
/**
 * The full action library.
 *
 * Previously this filtered to `type = 'catalog'`, which hid every daily action
 * from browsing and search — with 122 daily actions in the catalogue, someone
 * searching "agua" saw a fraction of what exists. The daily SET is still a
 * curated five per day; this is the library behind it, so everything is
 * findable.
 *
 * Also age-gated, which it previously was not: a kid account could browse
 * adult-only actions here even though the daily set correctly excluded them.
 */
export async function fetchCatalog(accountType: 'kid' | 'teen' | 'adult' = 'adult'): Promise<ActivityRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('active', true)
    .in('type', ['catalog', 'daily'])
    .contains('age_groups', [accountType])
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

/** Best-effort cold-start trigger of the recommendations Edge Function (§10.2). */
export async function triggerRecommendations(): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || !session) return;
    await fetch(`${url}/functions/v1/recommend-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: '{}',
    });
  } catch {
    /* ignore — content-based feed handles it */
  }
}

/** Cached Gemini recommendations for the current user (BUILD_SPEC §10.2). */
export async function fetchMyRecommendations(): Promise<{ slug: string; reason: string }[]> {
  const supabase = createClient();
  const { data } = await supabase.rpc('get_my_recommendations');
  return (data ?? []) as { slug: string; reason: string }[];
}

export async function fetchActivityBySlug(slug: string): Promise<ActivityRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('activities').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return (data as ActivityRow | null) ?? null;
}

export interface CompletionInfo {
  status: CompletionStatus;
  completed_at: string;
  /** When it can be done again. null for genuinely once-in-a-lifetime actions. */
  available_at?: string | null;
  /** True when the action is never repeatable (a solar-panel install). */
  permanent?: boolean;
}

/**
 * Actions that are currently NOT doable — either still cooling down or truly
 * one-off (F15.14).
 *
 * The map deliberately contains only what is unavailable RIGHT NOW. Previously
 * it held every completion ever, so an action finished weeks ago stayed ticked
 * off forever and the pool of things to do could only shrink. Callers already
 * treat "present in the map" as "done", so honouring the cooldown here fixes
 * every screen at once.
 */
export async function fetchCatalogCompletions(_userId: string): Promise<Map<string, CompletionInfo>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('my_activity_states');
  if (error) throw error;

  const states = (data ?? {}) as Record<
    string,
    { last_done: string; available_at: string | null; permanent: boolean }
  >;
  const now = Date.now();
  const map = new Map<string, CompletionInfo>();

  for (const [activityId, s] of Object.entries(states)) {
    const stillLocked = s.permanent || (s.available_at ? new Date(s.available_at).getTime() > now : false);
    if (!stillLocked) continue; // cooled down — available again
    map.set(activityId, {
      status: 'honor' as CompletionStatus,
      completed_at: s.last_done,
      available_at: s.available_at,
      permanent: s.permanent,
    });
  }
  return map;
}

/** Kept for callers that genuinely want raw history rather than availability. */
export async function fetchRawCompletions(userId: string): Promise<Map<string, CompletionInfo>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activity_completions')
    .select('activity_id, status, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  const map = new Map<string, CompletionInfo>();
  for (const r of (data ?? []) as { activity_id: string; status: CompletionStatus; completed_at: string }[]) {
    if (!map.has(r.activity_id)) map.set(r.activity_id, { status: r.status, completed_at: r.completed_at });
  }
  return map;
}

export async function fetchDomainPoints(userId: string): Promise<Partial<Record<DomainSlug, number>>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_domain_points')
    .select('domain_slug, points')
    .eq('user_id', userId);
  if (error) throw error;
  const out: Partial<Record<DomainSlug, number>> = {};
  for (const r of (data ?? []) as { domain_slug: DomainSlug; points: number }[]) out[r.domain_slug] = r.points;
  return out;
}

/** Compress + upload a verification photo to the private bucket (§11.3). */
export async function uploadVerificationPhoto(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const blob = await compressImage(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('verifications').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/**
 * Best-effort trigger of the Gemini verification Edge Function (§10.1).
 * Never throws — if the function/quota is unavailable the completion stays
 * `pending` and the scheduled fallback auto-approves at honor level (§11.3).
 */
export async function triggerVerification(activityId: string): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || !session) return;
    await fetch(`${url}/functions/v1/verify-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      // The function resolves the newest pending completion for this user+activity.
      body: JSON.stringify({ activity_id: activityId }),
    });
  } catch {
    /* ignore — fallback handles it */
  }
}

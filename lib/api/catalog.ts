'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type { ActivityRow, CompletionStatus } from '@/lib/supabase/rows';
import type { DomainSlug } from '@/lib/domains';

/** All active catalog activities (RLS already scopes to active=true). */
export async function fetchCatalog(): Promise<ActivityRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('type', 'catalog')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
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
}

/** Map of catalog activity_id -> latest completion (for done/cooldown state). */
export async function fetchCatalogCompletions(userId: string): Promise<Map<string, CompletionInfo>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activity_completions')
    .select('activity_id, status, completed_at')
    .eq('user_id', userId)
    .eq('activity_type', 'catalog')
    .order('completed_at', { ascending: false });
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

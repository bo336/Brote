'use client';

import { createClient } from '@/lib/supabase/client';
import { localDate } from '@/lib/utils/dates';
import type { ActivityRow } from '@/lib/supabase/rows';
import type { CompleteActivityResult } from '@/lib/types';

/** Fetch (or lazily generate) today's Daily Set (BUILD_SPEC §7.3, §13.1). */
export async function fetchDailySet(): Promise<ActivityRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('ensure_daily_set');
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

/** Activity ids the user has already completed today (for done state). */
export async function fetchTodayCompletions(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activity_completions')
    .select('activity_id')
    .eq('local_date', localDate());
  if (error) throw error;
  return new Set((data ?? []).map((r: { activity_id: string }) => r.activity_id));
}

/** The full daily-action pool (for the "más acciones diarias" expander). */
export async function fetchDailyPool(): Promise<ActivityRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('type', 'daily')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

/**
 * The core completion call. All awards computed server-side. `cantidad` is for
 * measurable actions (0123): the server bounds it and computes the impact.
 */
export async function completeActivity(
  activityId: string,
  photoUrl?: string | null,
  note?: string | null,
  cantidad?: number | null,
): Promise<CompleteActivityResult> {
  const supabase = createClient();
  const args: Record<string, unknown> = {
    p_activity_id: activityId,
    p_photo_url: photoUrl ?? null,
    p_note: note ?? null,
  };
  if (cantidad != null) args.p_cantidad = cantidad;
  const { data, error } = await supabase.rpc('complete_activity', args);
  if (error) {
    // A database without 0123 does not know p_cantidad yet: complete without it.
    if (cantidad != null && (error.code === 'PGRST202' || /could not find the function/i.test(error.message))) {
      return completeActivity(activityId, photoUrl, note, null);
    }
    throw error;
  }
  return data as CompleteActivityResult;
}

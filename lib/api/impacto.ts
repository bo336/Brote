'use client';

import { createClient } from '@/lib/supabase/client';
import { parseImpact, type ImpactTotals } from '@/lib/impact';

/** Lifetime real impact (litres, kg CO₂, kg waste, kWh). */
export async function fetchMyImpact(): Promise<ImpactTotals> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return parseImpact(null);
  const { data, error } = await supabase.rpc('brote_user_impact', { p_uid: user.id });
  if (error) throw error;
  return parseImpact(data);
}

/** Impact within the last N days (default 7) — powers "tu semana". */
export async function fetchMyImpactSince(days = 7): Promise<ImpactTotals> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return parseImpact(null);
  const { data, error } = await supabase.rpc('brote_user_impact_since', { p_uid: user.id, p_days: days });
  if (error) throw error;
  return parseImpact(data);
}

export interface WeeklyPoints {
  points: number;
  actions: number;
  since: string;
}

/** Competition points for the rolling week (never lifetime XP). */
export async function fetchMyWeeklyPoints(): Promise<WeeklyPoints> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('my_weekly_points');
  if (error) throw error;
  const d = (data ?? {}) as Partial<WeeklyPoints>;
  return { points: Number(d.points ?? 0), actions: Number(d.actions ?? 0), since: String(d.since ?? '') };
}

'use client';

import { createClient } from '@/lib/supabase/client';
import type { TitleRow, BadgeRow, GoalRow } from '@/lib/supabase/rows';
import type { DomainSlug } from '@/lib/domains';

export interface ImpactData {
  totalCompletions: number;
  byDomain: Partial<Record<DomainSlug, number>>;
  /** Playful, clearly-estimated handprint metrics (BUILD_SPEC §8.7). */
  handprint: { label: string; value: number; unit: string; glyph: string }[];
}

export async function fetchImpact(userId: string): Promise<ImpactData> {
  const supabase = createClient();
  const [{ data: comps }, { data: dp }] = await Promise.all([
    supabase.from('activity_completions').select('domain_slug').eq('user_id', userId).in('status', ['honor', 'verified']),
    supabase.from('user_domain_points').select('domain_slug, points').eq('user_id', userId),
  ]);

  const byDomainCount: Partial<Record<DomainSlug, number>> = {};
  for (const c of (comps ?? []) as { domain_slug: DomainSlug }[]) {
    byDomainCount[c.domain_slug] = (byDomainCount[c.domain_slug] ?? 0) + 1;
  }
  const byDomain: Partial<Record<DomainSlug, number>> = {};
  for (const r of (dp ?? []) as { domain_slug: DomainSlug; points: number }[]) byDomain[r.domain_slug] = r.points;

  const c = (d: DomainSlug) => byDomainCount[d] ?? 0;
  const handprint = [
    { label: 'Agua ahorrada', value: c('agua') * 50, unit: 'L', glyph: '💧' },
    { label: 'Residuos desviados', value: c('residuos') * 3, unit: 'kg', glyph: '♻️' },
    { label: 'Comidas veggie', value: c('alimentacion'), unit: '', glyph: '🥗' },
    { label: 'Plantas y verde', value: c('plantas'), unit: '', glyph: '🌱' },
    { label: 'Km sin auto', value: c('movilidad') * 5, unit: 'km', glyph: '🚲' },
    { label: 'Fauna ayudada', value: c('animales'), unit: '', glyph: '🐦' },
  ].filter((m) => m.value > 0);

  return { totalCompletions: (comps ?? []).length, byDomain, handprint };
}

export interface TitleWithState extends TitleRow {
  earned: boolean;
  equipped: boolean;
}

export async function fetchTitles(userId: string, equippedTitleId?: string | null): Promise<TitleWithState[]> {
  const supabase = createClient();
  const [{ data: titles }, { data: earned }] = await Promise.all([
    supabase.from('titles').select('*').order('rarity'),
    supabase.from('user_titles').select('title_id').eq('user_id', userId),
  ]);
  const earnedSet = new Set((earned ?? []).map((e: { title_id: string }) => e.title_id));
  return ((titles ?? []) as TitleRow[]).map((t) => ({
    ...t,
    earned: earnedSet.has(t.id),
    equipped: t.id === equippedTitleId,
  }));
}

export interface BadgeWithState extends BadgeRow {
  earned: boolean;
}

export async function fetchBadges(userId: string): Promise<BadgeWithState[]> {
  const supabase = createClient();
  const [{ data: badges }, { data: earned }] = await Promise.all([
    supabase.from('badges').select('*'),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
  ]);
  const earnedSet = new Set((earned ?? []).map((e: { badge_id: string }) => e.badge_id));
  return ((badges ?? []) as BadgeRow[]).map((b) => ({ ...b, earned: earnedSet.has(b.id) }));
}

export async function equipTitle(titleId: string | null): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { error } = await supabase.from('profiles').update({ equipped_title_id: titleId }).eq('id', user.id);
  if (error) throw error;
}

export async function fetchGoals(userId: string): Promise<GoalRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GoalRow[];
}

export interface NewGoalInput {
  titleEs: string;
  metric: string;
  domainSlug: string | null;
  targetValue: number;
  period: 'weekly' | 'monthly';
}

export async function createGoal(userId: string, input: NewGoalInput): Promise<void> {
  const supabase = createClient();
  const now = new Date();
  const ends = new Date(now);
  if (input.period === 'weekly') ends.setDate(ends.getDate() + 7);
  else ends.setMonth(ends.getMonth() + 1);
  const reward = input.period === 'weekly' ? 500 : 1500;

  const { error } = await supabase.from('goals').insert({
    user_id: userId,
    title_es: input.titleEs,
    metric: input.metric,
    domain_slug: input.domainSlug,
    target_value: input.targetValue,
    period: input.period,
    starts_at: now.toISOString().slice(0, 10),
    ends_at: ends.toISOString().slice(0, 10),
    is_custom: true,
    reward_points: reward,
  });
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

/** Export the user's own data as a JSON blob (privacy-friendly, §8.1). */
export async function exportMyData(userId: string): Promise<Record<string, unknown>> {
  const supabase = createClient();
  const [profile, completions, goals, titles, badges] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('activity_completions').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('user_titles').select('*').eq('user_id', userId),
    supabase.from('user_badges').select('*').eq('user_id', userId),
  ]);
  return {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    completions: completions.data,
    goals: goals.data,
    titles: titles.data,
    badges: badges.data,
  };
}

export async function deleteMyAccount(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}

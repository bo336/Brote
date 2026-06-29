'use client';

import { createClient } from '@/lib/supabase/client';
import type { ChallengeRow } from '@/lib/supabase/rows';

export interface DailyChallengeView {
  challenge: ChallengeRow;
  progress: number;
}

/** The rotating daily challenge + the user's progress (BUILD_SPEC §8.9). */
export async function fetchDailyChallenge(): Promise<DailyChallengeView | null> {
  const supabase = createClient();

  const { data: stateRow } = await supabase
    .from('app_state')
    .select('value')
    .eq('key', 'current_daily_challenge')
    .maybeSingle();

  const pointedId = (stateRow?.value as { id?: string } | null)?.id;

  let challenge: ChallengeRow | null = null;
  if (pointedId) {
    const { data } = await supabase.from('challenges').select('*').eq('id', pointedId).maybeSingle();
    challenge = data as ChallengeRow | null;
  }
  if (!challenge) {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('type', 'daily')
      .eq('active', true)
      .limit(1)
      .maybeSingle();
    challenge = data as ChallengeRow | null;
  }
  if (!challenge) return null;

  const { data: uc } = await supabase
    .from('user_challenges')
    .select('progress')
    .eq('challenge_id', challenge.id)
    .maybeSingle();

  return { challenge, progress: (uc as { progress: number } | null)?.progress ?? 0 };
}

export interface ImpactStats {
  completions: number;
  domainsTouched: number;
}

/** Lightweight impact summary for the Hoy peek (full handprint is on Profile). */
export async function fetchImpactStats(): Promise<ImpactStats> {
  const supabase = createClient();
  const [{ count }, { data: domains }] = await Promise.all([
    supabase.from('activity_completions').select('id', { count: 'exact', head: true }),
    supabase.from('user_domain_points').select('domain_slug'),
  ]);
  return { completions: count ?? 0, domainsTouched: (domains ?? []).length };
}

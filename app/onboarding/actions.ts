'use server';

import { createClient } from '@/lib/supabase/server';

export interface OnboardingProfileInput {
  displayName: string;
  city: string;
  /** Gates which actions/news/competitions the user sees (PLAN F12.1). */
  accountType?: 'kid' | 'teen' | 'adult';
  interests: string[];
  context: Record<string, unknown>;
}

/** Persist onboarding answers (name, city, interests, context). */
export async function saveOnboardingProfile(input: OnboardingProfileInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado' };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName.trim() || null,
      city: input.city.trim() || 'Buenos Aires',
      account_type: input.accountType ?? 'adult',
      interests: input.interests,
      context: input.context,
    })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Mark onboarding complete (after the first daily action). */
export async function finishOnboarding(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado' };

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';

export interface OnboardingProfileInput {
  displayName: string;
  city: string;
  /** Gates which actions/news/competitions the user sees (PLAN F12.1). */
  accountType?: 'kid' | 'teen' | 'adult';
  interests: string[];
  /** Sólo cuando la persona contestó "Tu casa y tu día": si no, no se toca. */
  context?: Record<string, unknown>;
}

/**
 * A function that does not exist yet answers PGRST202 (or 42883 from Postgres).
 * Only used while migration 0117 may not be applied: before it, the old direct
 * update is the only path; after it, the direct update is refused and the
 * function is the only path.
 */
function faltaFuncion(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST202' || error.code === '42883' || /could not find the function/i.test(error.message ?? '');
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
      interests: input.interests,
      ...(input.context ? { context: input.context } : {}),
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  // The account type is not a column the client may write (0117): a kid
  // account could otherwise make itself adult from the browser console. It is
  // chosen once, here, through a function that refuses after onboarding.
  const tipo = input.accountType ?? 'adult';
  const r = await supabase.rpc('brote_set_account_type', { p_type: tipo });
  if (faltaFuncion(r.error)) {
    const legacy = await supabase.from('profiles').update({ account_type: tipo }).eq('id', user.id);
    if (legacy.error) return { ok: false, error: legacy.error.message };
    return { ok: true };
  }
  if (r.error) return { ok: false, error: r.error.message };
  const res = r.data as { ok?: boolean; mensaje?: string } | null;
  if (res && res.ok === false) return { ok: false, error: res.mensaje ?? 'No se pudo guardar el tipo de cuenta' };
  return { ok: true };
}

/** Mark onboarding complete (after the first daily action). */
export async function finishOnboarding(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado' };

  const r = await supabase.rpc('brote_finish_onboarding');
  if (faltaFuncion(r.error)) {
    const legacy = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    if (legacy.error) return { ok: false, error: legacy.error.message };
    return { ok: true };
  }
  if (r.error) return { ok: false, error: r.error.message };
  return { ok: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';

export interface OnboardingProfileInput {
  displayName: string;
  /** Provincia. A un chico no se le pregunta (0145): sin este campo, no se toca. */
  city?: string;
  /** Gates which actions/news/competitions the user sees (PLAN F12.1). */
  accountType?: 'kid' | 'teen' | 'adult';
  interests?: string[];
  /** Lo de la casa y el ritmo. Pasa por `acciones_guardar_contexto`, que valida cada clave. */
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

/** Persist onboarding answers (name, province, account type, interests, context). */
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
      ...(input.city !== undefined ? { city: input.city.trim() || 'Buenos Aires' } : {}),
      ...(input.interests ? { interests: input.interests } : {}),
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  if (input.context) {
    const c = await supabase.rpc('acciones_guardar_contexto', { p_ctx: input.context });
    if (c.error && !faltaFuncion(c.error)) return { ok: false, error: c.error.message };
  }

  // The account type is not a column the client may write (0117): a kid
  // account could otherwise make itself adult from the browser console. It is
  // chosen once, here, through a function that refuses after onboarding.
  if (!input.accountType) return { ok: true };
  const r = await supabase.rpc('brote_set_account_type', { p_type: input.accountType });
  if (faltaFuncion(r.error)) {
    const legacy = await supabase.from('profiles').update({ account_type: input.accountType }).eq('id', user.id);
    if (legacy.error) return { ok: false, error: legacy.error.message };
    return { ok: true };
  }
  if (r.error) return { ok: false, error: r.error.message };
  const res = r.data as { ok?: boolean; mensaje?: string } | null;
  if (res && res.ok === false) return { ok: false, error: res.mensaje ?? 'No se pudo guardar el tipo de cuenta' };
  return { ok: true };
}

/**
 * La autorización de una persona adulta para una cuenta de chico (0145): sin
 * ella el onboarding no termina. Se guarda quién, su vínculo y la fecha.
 */
export async function autorizarCuentaChico(
  nombre: string,
  vinculo: 'madre_padre' | 'tutor' | 'otro_familiar',
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('cuenta_autorizacion_adulta', { p_nombre: nombre.trim(), p_vinculo: vinculo });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok?: boolean; error?: string } | null;
  return r?.ok ? { ok: true } : { ok: false, error: r?.error ?? 'error' };
}

/** Mark onboarding complete. A kid account needs the adult authorization first. */
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
  const res = r.data as { ok?: boolean; error?: string } | null;
  if (res && res.ok === false) return { ok: false, error: res.error ?? 'error' };
  return { ok: true };
}

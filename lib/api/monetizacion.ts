'use client';

import { createClient } from '@/lib/supabase/client';

/** Start a Brote+ subscription; returns the MercadoPago URL to redirect to. */
export async function startSubscription(): Promise<{ ok: boolean; init_point?: string; error?: string; message?: string }> {
  const { data, error } = await createClient().functions.invoke('mp-subscribe', { body: {} });
  if (error) {
    // Supabase wraps non-2xx as an error; surface the function's own message.
    let message = 'No pudimos iniciar la suscripción.';
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const body = await ctx.json();
        message = body?.message ?? body?.detail ?? message;
      }
    } catch {
      /* keep the default message */
    }
    return { ok: false, error: 'invoke_failed', message };
  }
  const res = data as { ok?: boolean; init_point?: string; message?: string; error?: string };
  if (!res?.init_point) return { ok: false, error: res?.error ?? 'no_init_point', message: res?.message };
  return { ok: true, init_point: res.init_point };
}

/** Record the user's ad-personalization choice. */
export async function setAdsConsent(value: boolean): Promise<void> {
  await createClient().rpc('set_ads_consent', { p_value: value });
}

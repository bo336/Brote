'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function getOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export interface AuthActionState {
  ok: boolean;
  error?: string;
  sent?: boolean;
  email?: string;
}

/** Send a passwordless magic link (email OTP). Works on the free tier. */
export async function signInWithOtp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const next = String(formData.get('next') ?? '/');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'Ingresá un correo válido.' };
  }
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, sent: true, email };
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con ese correo. Probá ingresar.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Confirmá tu correo antes de ingresar (revisá tu casilla).';
  if (m.includes('for security purposes')) return 'Esperá unos segundos antes de reintentar.';
  return message;
}

/** Sign in with email + password. */
export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');
  if (!email || !password) return { ok: false, error: 'Completá tu correo y contraseña.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  redirect(next);
}

/** Create an account with email + password. */
export async function signUpWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'Ingresá un correo válido.' };
  }
  if (password.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${getOrigin()}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };

  // If email confirmation is disabled in Supabase, we get a session immediately.
  if (data.session) redirect(next);
  // Otherwise a confirmation email was sent.
  return { ok: true, sent: true, email };
}

/** Begin Google OAuth — redirects to Google's consent screen. */
export async function signInWithGoogle(next: string = '/') {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw error;
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/supabase/route';

/**
 * The origin auth links must come back to.
 *
 * Prefers the ACTUAL host of the incoming request over NEXT_PUBLIC_APP_URL
 * whenever the two disagree. A stale env var — the classic case being a
 * production deploy still carrying `http://localhost:3000` copied from a local
 * file — otherwise sends every Google/magic-link round trip to a domain the
 * user is not on, so the session is written somewhere they never land and the
 * login appears to loop forever. The request's own host is always right for
 * the environment actually being used.
 */
function getOrigin(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  const fromRequest = host ? `${proto}://${host}` : null;

  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || null;
  if (!env) return fromRequest ?? 'http://localhost:3000';
  if (!fromRequest) return env;

  try {
    if (new URL(env).host === new URL(fromRequest).host) return env;
  } catch {
    return fromRequest;
  }
  // Configured URL belongs to a different environment than this request.
  return fromRequest;
}

export interface AuthActionState {
  ok: boolean;
  error?: string;
  /** Which field the error belongs to, so the form can mark it. */
  field?: 'email' | 'password' | 'password2';
  sent?: boolean;
  email?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Supabase's own minimum. The form asks for more, but never refuses less than the server accepts. */
const MIN_PASSWORD = 6;

function readEmail(formData: FormData): string {
  return String(formData.get('email') ?? '').trim().toLowerCase();
}

/**
 * Every message Supabase Auth sends back, said in Brote's voice. Unknown ones
 * fall through to a generic sentence: the raw English text is for the logs,
 * not for somebody trying to sign in.
 */
function friendlyAuthError(message: string, code?: string): string {
  const m = `${code ?? ''} ${message}`.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials'))
    return 'El correo o la contraseña no coinciden.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user_already_exists'))
    return 'Ya hay una cuenta con ese correo. Probá ingresar, o recuperá la contraseña.';
  if (m.includes('password should be at least') || m.includes('weak_password') || m.includes('weak password'))
    return 'Elegí una contraseña más larga: al menos 8 caracteres, mejor si mezcla letras y números.';
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed'))
    return 'Todavía no confirmaste tu correo. Abrí el mail que te mandamos (mirá también en spam).';
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit') || m.includes('too many'))
    return 'Mandamos varios correos seguidos. Esperá unos minutos y probá de nuevo.';
  if (m.includes('for security purposes') || m.includes('over_request_rate_limit'))
    return 'Esperá unos segundos antes de volver a intentar.';
  if (m.includes('signups not allowed') || m.includes('signup_disabled'))
    return 'Por ahora no estamos abriendo cuentas nuevas con correo. Probá con Google.';
  if (m.includes('should be different') || m.includes('same_password'))
    return 'La contraseña nueva tiene que ser distinta de la anterior.';
  if (m.includes('invalid format') || m.includes('email_address_invalid') || m.includes('unable to validate email'))
    return 'Ese correo no parece válido. Revisalo.';
  if (m.includes('expired') || m.includes('otp_expired'))
    return 'El enlace venció. Pedí uno nuevo.';
  if (m.includes('fetch failed') || m.includes('network'))
    return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
  return 'No pudimos completar el ingreso. Probá de nuevo en un momento.';
}

/** Send a passwordless magic link (email OTP). Works on the free tier. */
export async function signInWithOtp(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  const next = safeNext(String(formData.get('next') ?? '/'));
  if (!EMAIL_RE.test(email)) return { ok: false, field: 'email', error: 'Ingresá un correo válido.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${getOrigin()}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message, error.code) };
  return { ok: true, sent: true, email };
}

/** Sign in with email + password. */
export async function signInWithPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = String(formData.get('password') ?? '');
  const next = safeNext(String(formData.get('next') ?? '/'));
  if (!EMAIL_RE.test(email)) return { ok: false, field: 'email', error: 'Ingresá un correo válido.' };
  if (!password) return { ok: false, field: 'password', error: 'Escribí tu contraseña.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, field: 'password', error: friendlyAuthError(error.message, error.code), email };
  redirect(next);
}

/** Create an account with email + password. */
export async function signUpWithPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = String(formData.get('password') ?? '');
  const next = safeNext(String(formData.get('next') ?? '/'));
  if (!EMAIL_RE.test(email)) return { ok: false, field: 'email', error: 'Ingresá un correo válido.' };
  if (password.length < MIN_PASSWORD)
    return { ok: false, field: 'password', error: 'Elegí una contraseña de al menos 8 caracteres.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${getOrigin()}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message, error.code), email };

  // If email confirmation is disabled in Supabase, we get a session immediately.
  if (data.session) redirect(next);
  // Otherwise a confirmation email was sent.
  return { ok: true, sent: true, email };
}

/**
 * "Olvidé mi contraseña": sends a recovery link that lands on
 * `/auth/nueva-clave` with a session already open.
 *
 * Always answers "sent", whether or not the address has an account: telling
 * the difference would let anyone check which emails are registered.
 */
export async function requestPasswordReset(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = readEmail(formData);
  if (!EMAIL_RE.test(email)) return { ok: false, field: 'email', error: 'Ingresá un correo válido.' };

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getOrigin()}/auth/confirm?next=${encodeURIComponent('/auth/nueva-clave')}`,
  });
  // Only a rate limit is worth surfacing; anything else still reads as "sent".
  if (error && /rate|too many|security purposes/i.test(`${error.code ?? ''} ${error.message}`)) {
    return { ok: false, error: friendlyAuthError(error.message, error.code), email };
  }
  return { ok: true, sent: true, email };
}

/** Sets the new password for the session opened by the recovery link. */
export async function updatePassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get('password') ?? '');
  const password2 = String(formData.get('password2') ?? '');
  if (password.length < 8)
    return { ok: false, field: 'password', error: 'Elegí una contraseña de al menos 8 caracteres.' };
  if (password !== password2) return { ok: false, field: 'password2', error: 'Las dos contraseñas no coinciden.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'El enlace venció. Pedí uno nuevo desde la pantalla de ingreso.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, field: 'password', error: friendlyAuthError(error.message, error.code) };
  redirect('/?clave=nueva');
}

/** Begin Google OAuth — redirects to Google's consent screen. */
export async function signInWithGoogle(next: string = '/') {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  // A thrown error here used to land on the generic error page; the login
  // screen already knows how to explain a provider failure.
  if (error || !data.url) redirect('/auth/login?error=provider');
  redirect(data.url);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

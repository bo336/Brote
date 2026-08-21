'use client';

import { Suspense, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  signInWithOtp,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  type AuthActionState,
} from '../actions';

type Mode = 'signin' | 'signup' | 'magic';
const initialState: AuthActionState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" block loading={pending}>
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LoginInner />
    </Suspense>
  );
}

/**
 * Human-readable explanations for every way a sign-in can fail. Previously a
 * failed OAuth/magic-link round trip just dropped the user back here with no
 * message at all, which read as an unexplained login loop.
 */
const ERROR_MESSAGES: Record<string, string> = {
  provider: 'Google no pudo completar el ingreso. Probá de nuevo o usá tu correo.',
  nocode: 'El ingreso volvió sin credenciales. Suele pasar cuando la URL de retorno no está habilitada en el servidor.',
  exchange: 'No pudimos validar tu ingreso. Probá de nuevo; si sigue igual, entrá con tu correo.',
  link: 'Ese enlace ya no sirve: los enlaces mágicos se usan una sola vez y vencen en una hora. Pedí uno nuevo.',
  nolink: 'El enlace está incompleto. Pedí uno nuevo desde acá abajo.',
  auth: 'No pudimos completar el ingreso. Probá de nuevo.',
};

function LoginInner() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [mode, setMode] = useState<Mode>('signin');

  const errorKey = params.get('error');
  const errorDetail = params.get('detail');
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.auth) : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/*
        Two offset washes rather than one centred blob: a single symmetrical
        glow behind a centred card is the default template look. Offsetting
        them, in the two brand colours, gives the screen a light direction.
      */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-[70%] rounded-full bg-primary/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-brote-sun/15 blur-[100px]" />

      <div className="z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Pip size={104} mood="happy" />
          <span className="eyebrow mt-4 text-primary">Bitácora viva</span>
          <h1 className="mt-1.5 text-balance font-display text-display-l font-extrabold leading-[1.05]">
            {t('welcome', { app: BRAND.name })}
          </h1>
          <p className="mt-2 text-balance leading-relaxed text-muted-foreground">{t('subtitle')}</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex gap-3 rounded-card border border-brote-coral/40 bg-brote-coral/10 p-3.5 text-small text-foreground"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brote-coral" />
            <div className="min-w-0">
            <p className="font-semibold text-brote-coral">No pudimos iniciar tu sesión</p>
            <p className="mt-1 leading-relaxed">{errorMessage}</p>
            {/* The provider's raw text is for us, not for the person trying to
                sign in (F15.5). It stays in the URL and the console for
                debugging, but is only rendered outside production. */}
            {errorDetail && process.env.NODE_ENV !== 'production' && (
              <p className="mt-1.5 break-words text-caption text-muted-foreground">Detalle técnico: {errorDetail}</p>
            )}
            </div>
          </div>
        )}

        <Card className="space-y-4 p-5 shadow-soft-lg">
          <form action={signInWithGoogle.bind(null, next)}>
            <Button type="submit" variant="secondary" block size="lg">
              <GoogleGlyph />
              {t('google')}
            </Button>
          </form>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="eyebrow text-muted-foreground">{t('orEmail')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Keyed so form state resets when the mode changes. */}
          <AuthForm key={mode} mode={mode} next={next} onSwitch={setMode} />
        </Card>

        {/*
          The terms must be readable BEFORE accepting them, so both documents
          are real, reachable pages rather than plain unclickable text.
        */}
        <p className="mt-5 text-center text-caption leading-relaxed text-muted-foreground">
          Al continuar aceptás nuestros{' '}
          <Link href="/legal/terminos" className="font-medium text-primary underline underline-offset-2">
            Términos y Condiciones
          </Link>{' '}
          y nuestra{' '}
          <Link href="/legal/privacidad" className="font-medium text-primary underline underline-offset-2">
            Política de Privacidad
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function AuthForm({ mode, next, onSwitch }: { mode: Mode; next: string; onSwitch: (m: Mode) => void }) {
  const t = useTranslations('auth');
  const action = mode === 'signin' ? signInWithPassword : mode === 'signup' ? signUpWithPassword : signInWithOtp;
  const [state, formAction] = useFormState(action, initialState);

  if (state.sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary shadow-glow">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="text-balance text-body font-medium leading-relaxed">
          {mode === 'signup'
            ? t('signupConfirm', { email: state.email ?? '' })
            : t('magicSent', { email: state.email ?? '' })}
        </p>
        <p className="text-caption text-muted-foreground">Revisá también la carpeta de spam.</p>
      </div>
    );
  }

  const submitLabel = mode === 'signin' ? t('signIn') : mode === 'signup' ? t('signUp') : t('magicLink');

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="sr-only">
          {t('emailLabel')}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            icon
            placeholder={t('emailPlaceholder')}
          />
        </div>
      </div>

      {mode !== 'magic' && (
        <div>
          <label htmlFor="password" className="sr-only">
            {t('passwordLabel')}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              icon
              placeholder={t('passwordPlaceholder')}
            />
          </div>
        </div>
      )}

      {state.error && <p className="text-small text-brote-coral">{state.error}</p>}

      <SubmitButton label={submitLabel} />

      <div className="flex flex-col items-center gap-2 pt-1.5 text-center text-small">
        {mode === 'signin' && (
          <>
            <SwitchLink onClick={() => onSwitch('signup')} primary>
              {t('createAccountCta')}
            </SwitchLink>
            <SwitchLink onClick={() => onSwitch('magic')}>{t('useMagic')}</SwitchLink>
          </>
        )}
        {mode === 'signup' && (
          <SwitchLink onClick={() => onSwitch('signin')} primary>
            {t('haveAccountCta')}
          </SwitchLink>
        )}
        {mode === 'magic' && <SwitchLink onClick={() => onSwitch('signin')}>{t('usePassword')}</SwitchLink>}
      </div>
    </form>
  );
}

/** Mode switcher. Was a bare text button with no hover state at all (§5.1). */
function SwitchLink({
  onClick,
  primary,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group rounded-sm px-1 py-0.5 transition-colors duration-150 ' +
        (primary ? 'font-medium text-primary hover:text-brote-green-deep' : 'text-muted-foreground hover:text-foreground')
      }
    >
      <span className="link-underline">{children}</span>
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.48 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.67 2.84C6.71 6.68 9.14 4.75 12 4.75Z" />
    </svg>
  );
}

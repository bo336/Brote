'use client';

import { Suspense, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Sparkles, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

function LoginInner() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [mode, setMode] = useState<Mode>('signin');

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Pip size={104} mood="happy" />
          <h1 className="mt-4 font-display text-display-l font-extrabold">{t('welcome', { app: BRAND.name })}</h1>
          <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Card className="space-y-4 p-5">
          <form action={signInWithGoogle.bind(null, next)}>
            <Button type="submit" variant="secondary" block>
              <GoogleGlyph />
              {t('google')}
            </Button>
          </form>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption text-muted-foreground">{t('orEmail')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Keyed so form state resets when the mode changes. */}
          <AuthForm key={mode} mode={mode} next={next} onSwitch={setMode} />
        </Card>

        <p className="mt-5 text-center text-caption text-muted-foreground">{t('terms')}</p>
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
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="text-body font-medium">
          {mode === 'signup'
            ? t('signupConfirm', { email: state.email ?? '' })
            : t('magicSent', { email: state.email ?? '' })}
        </p>
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
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={t('emailPlaceholder')}
            className="w-full rounded-button border border-border bg-surface-2 py-3 pl-9 pr-4 text-body outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {mode !== 'magic' && (
        <div>
          <label htmlFor="password" className="sr-only">
            {t('passwordLabel')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            placeholder={t('passwordPlaceholder')}
            className="w-full rounded-button border border-border bg-surface-2 px-4 py-3 text-body outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {state.error && <p className="text-small text-brote-coral">{state.error}</p>}

      <SubmitButton label={submitLabel} />

      <div className="flex flex-col items-center gap-1.5 pt-1 text-center text-small">
        {mode === 'signin' && (
          <>
            <button type="button" onClick={() => onSwitch('signup')} className="font-medium text-primary">
              {t('createAccountCta')}
            </button>
            <button type="button" onClick={() => onSwitch('magic')} className="text-muted-foreground">
              {t('useMagic')}
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button type="button" onClick={() => onSwitch('signin')} className="font-medium text-primary">
            {t('haveAccountCta')}
          </button>
        )}
        {mode === 'magic' && (
          <button type="button" onClick={() => onSwitch('signin')} className="text-muted-foreground">
            {t('usePassword')}
          </button>
        )}
      </div>
    </form>
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

'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Droplets,
  Leaf,
  Mail,
  MailCheck,
  Sprout,
  Users,
  Wind,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { formatCo2, formatWater, formatWhole } from '@/lib/impact';
import { LogoMark } from '@/components/brand/Logo';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountUp } from '@/components/ui/count-up';
import { CampoClave, MedidorClave } from '@/components/auth/CampoClave';
import { cn } from '@/lib/utils/cn';
import {
  requestPasswordReset,
  signInWithGoogle,
  signInWithOtp,
  signInWithPassword,
  signUpWithPassword,
  type AuthActionState,
} from '@/app/(auth)/auth/actions';

export type ModoAcceso = 'entrar' | 'crear' | 'enlace' | 'recuperar';

export interface PulsoPublico {
  personas: number;
  acciones: number;
  acciones_hoy: number;
  agua_l: number;
  co2_kg: number;
}

/**
 * Below this, the live strip is not drawn: three small numbers on the first
 * screen of a product read as "nobody is here", and the design system forbids
 * dressing them up. The value proposition carries the panel until then.
 */
const PULSO_MINIMO = 300;

/**
 * Human-readable explanations for every way a sign-in can fail. Previously a
 * failed OAuth/magic-link round trip just dropped the user back here with no
 * message at all, which read as an unexplained login loop.
 */
const ERROR_MESSAGES: Record<string, string> = {
  provider: 'Google no pudo completar el ingreso. Probá de nuevo o usá tu correo.',
  nocode: 'El ingreso volvió sin credenciales. Probá de nuevo; si sigue igual, entrá con tu correo.',
  exchange: 'No pudimos validar tu ingreso. Probá de nuevo; si sigue igual, entrá con tu correo.',
  link: 'Ese enlace ya no sirve: se usan una sola vez y vencen en una hora. Pedí uno nuevo.',
  nolink: 'El enlace está incompleto. Pedí uno nuevo desde acá abajo.',
  auth: 'No pudimos completar el ingreso. Probá de nuevo.',
};

const initialState: AuthActionState = { ok: false };

export function PantallaAcceso({
  pulso,
  next,
  modoInicial,
  errorKey,
  errorDetail,
}: {
  pulso: PulsoPublico | null;
  next: string;
  modoInicial: ModoAcceso;
  errorKey: string | null;
  errorDetail: string | null;
}) {
  const t = useTranslations('auth');
  const [modo, setModo] = useState<ModoAcceso>(modoInicial);
  // The address survives switching modes: somebody who typed it, then tapped
  // "olvidé mi contraseña", should not have to type it again.
  const [email, setEmail] = useState('');
  // Bumped by "usar otro correo" so the form remounts empty even in the same mode.
  const [intento, setIntento] = useState(0);
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.auth) : null;
  const conPulso = !!pulso && pulso.acciones >= PULSO_MINIMO;

  const titulo =
    modo === 'crear'
      ? t('titleSignUp')
      : modo === 'recuperar'
        ? t('resetTitle')
        : modo === 'enlace'
          ? t('magicTitle')
          : t('titleSignIn', { app: BRAND.name });
  const bajada =
    modo === 'crear'
      ? t('subSignUp')
      : modo === 'recuperar'
        ? t('resetBody')
        : modo === 'enlace'
          ? t('magicBody')
          : t('subSignIn');

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <PanelMarca pulso={conPulso ? pulso : null} />

      {/* Phone header: the same identity, compressed to what fits above the fold. */}
      <header className="relative overflow-hidden bg-brote-ink px-5 pb-14 pt-[max(env(safe-area-inset-top),1.25rem)] text-brote-cream lg:hidden">
        <Image
          src="/mundo/poster-t9.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_45%] opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brote-ink/60 via-brote-ink/75 to-brote-ink" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-display text-h3 font-extrabold tracking-tight">{BRAND.name}</span>
          </div>
          <h1 className="mt-7 max-w-[19rem] text-balance font-display text-display-l font-extrabold leading-[1.04]">
            {t('heroA')}{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">{t('heroB')}</span>
          </h1>
          {conPulso ? (
            <p className="mt-3 flex items-center gap-2 text-small text-brote-cream/75">
              <span className="h-2 w-2 shrink-0 animate-live-pulse rounded-full bg-primary" aria-hidden />
              {t('pulseShort', { n: formatWhole(pulso!.acciones) })}
            </p>
          ) : (
            <p className="mt-3 max-w-[20rem] text-small leading-relaxed text-brote-cream/75">{t('heroBodyShort')}</p>
          )}
        </div>
      </header>

      <main className="relative -mt-8 flex min-h-[calc(100dvh-14rem)] flex-col rounded-t-sheet border-t border-white/0 bg-background shadow-[0_-12px_32px_-12px_rgb(0_0_0_/_0.35)] dark:border-white/10 lg:border-t-0 lg:shadow-none px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-7 lg:mt-0 lg:min-h-dvh lg:items-center lg:justify-center lg:rounded-none lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-[400px]">
          {(modo === 'enlace' || modo === 'recuperar') && (
            <button
              type="button"
              onClick={() => setModo('entrar')}
              className="group mb-4 inline-flex items-center gap-1.5 rounded-sm text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              {t('back')}
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <Pip size={52} mood={modo === 'crear' ? 'celebrating' : 'happy'} className="hidden shrink-0 sm:block" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-h1 font-bold leading-tight">{titulo}</h2>
              <p className="mt-1 text-small leading-relaxed text-muted-foreground">{bajada}</p>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-card border border-brote-coral/40 bg-brote-coral/10 p-3.5 text-small text-foreground"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brote-coral" />
              <div className="min-w-0">
                <p className="font-semibold text-brote-coral">No pudimos iniciar tu sesión</p>
                <p className="mt-1 leading-relaxed">{errorMessage}</p>
                {/* The provider's raw text is for us, not for the person trying
                    to sign in (F15.5): only rendered outside production. */}
                {errorDetail && process.env.NODE_ENV !== 'production' && (
                  <p className="mt-1.5 break-words text-caption text-muted-foreground">Detalle técnico: {errorDetail}</p>
                )}
              </div>
            </div>
          )}

          {(modo === 'entrar' || modo === 'crear') && (
            <>
              <Pestanas modo={modo} onCambiar={setModo} />
              <form action={signInWithGoogle.bind(null, next)} className="mt-5">
                <BotonGoogle />
              </form>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="eyebrow text-muted-foreground">{t('orEmail')}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {/* Keyed so the form state (sent / error) resets when the mode changes. */}
          <FormularioCorreo
            key={`${modo}-${intento}`}
            modo={modo}
            next={next}
            email={email}
            onEmail={setEmail}
            onModo={setModo}
            onReiniciar={() => setIntento((n) => n + 1)}
            className={modo === 'enlace' || modo === 'recuperar' ? 'mt-6' : undefined}
          />

          {/*
            The terms must be readable BEFORE accepting them, so both documents
            are real, reachable pages rather than plain unclickable text.
          */}
          <p className="mt-8 text-caption leading-relaxed text-muted-foreground">
            Al continuar aceptás nuestros{' '}
            <Link href="/legal/terminos" className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-primary">
              Términos y Condiciones
            </Link>{' '}
            y nuestra{' '}
            <Link href="/legal/privacidad" className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-primary">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

/* ── The brand panel (desktop) ─────────────────────────────────────────────── */

function PanelMarca({ pulso }: { pulso: PulsoPublico | null }) {
  const t = useTranslations('auth');
  const pilares = [
    { Icon: Leaf, titulo: t('pillar1Title'), cuerpo: t('pillar1Body'), tinte: '#1FB57A' },
    { Icon: Sprout, titulo: t('pillar2Title'), cuerpo: t('pillar2Body'), tinte: '#FFB23E' },
    { Icon: Users, titulo: t('pillar3Title'), cuerpo: t('pillar3Body'), tinte: '#2DB4D4' },
  ];

  return (
    <section className="relative hidden min-h-dvh overflow-hidden bg-brote-ink text-brote-cream lg:flex">
      {/* A real frame of the game, not a stock photo: what the world can become. */}
      <Image
        src="/mundo/poster-t9.jpg"
        alt=""
        fill
        priority
        sizes="55vw"
        className="object-cover object-[45%_40%]"
      />
      {/* The island stays visible up top and sinks into ink where the words are. */}
      <div className="absolute inset-0 bg-gradient-to-t from-brote-ink from-[38%] via-brote-ink/80 via-[62%] to-brote-ink/10" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brote-ink/70 to-transparent" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-10 p-10 xl:p-14">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-display text-h2 font-extrabold tracking-tight">{BRAND.name}</span>
        </div>

        <div className="mt-auto max-w-xl">
          <span className="eyebrow text-brote-lime">{t('eyebrow')}</span>
          <h1 className="mt-3 text-balance font-display text-hero font-extrabold">
            {t('heroA')}{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">{t('heroB')}</span>
          </h1>
          <p className="mt-4 max-w-md text-body leading-relaxed text-brote-cream/75">{t('heroBody')}</p>

          <ul className="mt-9 max-w-md divide-y divide-white/10 border-y border-white/10">
            {pilares.map(({ Icon, titulo, cuerpo, tinte }) => (
              <li key={titulo} className="flex items-start gap-3.5 py-3.5">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ backgroundColor: `${tinte}26`, color: tinte }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-small font-semibold">{titulo}</span>
                  <span className="mt-0.5 block text-caption leading-relaxed text-brote-cream/65">{cuerpo}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {pulso && <TiraPulso pulso={pulso} />}
      </div>
    </section>
  );
}

/** The live terminal strip (BROTE_DESIGN_SYSTEM §0): only real, current totals. */
function TiraPulso({ pulso }: { pulso: PulsoPublico }) {
  const t = useTranslations('auth');
  const datos = [
    { Icon: Leaf, valor: pulso.acciones, fmt: formatWhole, etiqueta: t('pulseActions') },
    { Icon: Droplets, valor: pulso.agua_l, fmt: formatWater, etiqueta: t('pulseWater') },
    { Icon: Wind, valor: pulso.co2_kg, fmt: formatCo2, etiqueta: t('pulseCo2') },
  ].filter((d) => d.valor > 0);

  return (
    <div className="max-w-xl">
      <p className="eyebrow flex items-center gap-2 text-brote-cream/70">
        <span className="h-2 w-2 animate-live-pulse rounded-full bg-primary" aria-hidden />
        {t('pulseLive')}
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-5 border-t border-white/10 pt-4">
        {datos.map(({ Icon, valor, fmt, etiqueta }) => (
          <div key={etiqueta} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-caption text-brote-cream/60">
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{etiqueta}</span>
            </dt>
            <dd className="mt-1 font-display text-h1 font-bold tnum">
              <CountUp value={valor} format={fmt} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function Pestanas({ modo, onCambiar }: { modo: ModoAcceso; onCambiar: (m: ModoAcceso) => void }) {
  const t = useTranslations('auth');
  const reduce = useReducedMotion();
  const opciones: { key: ModoAcceso; label: string }[] = [
    { key: 'entrar', label: t('tabSignIn') },
    { key: 'crear', label: t('tabSignUp') },
  ];
  return (
    <div role="tablist" aria-label={t('tabsLabel')} className="mt-6 grid grid-cols-2 rounded-pill bg-surface-2 p-1">
      {opciones.map((o) => {
        const activo = modo === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => onCambiar(o.key)}
            className={cn(
              'relative h-10 rounded-pill text-small font-semibold transition-colors duration-150',
              activo ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {activo && (
              <motion.span
                layoutId="acceso-pestana"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-pill bg-surface shadow-soft"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function BotonGoogle() {
  const t = useTranslations('auth');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" block size="lg" loading={pending} className="bg-surface">
      <GoogleGlyph />
      {t('google')}
    </Button>
  );
}

function BotonEnviar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" block size="lg" loading={pending} className="rounded-pill">
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

/* ── The email form, one per mode ─────────────────────────────────────────── */

function FormularioCorreo({
  modo,
  next,
  email,
  onEmail,
  onModo,
  onReiniciar,
  className,
}: {
  modo: ModoAcceso;
  next: string;
  email: string;
  onEmail: (v: string) => void;
  onModo: (m: ModoAcceso) => void;
  onReiniciar: () => void;
  className?: string;
}) {
  const t = useTranslations('auth');
  const action =
    modo === 'entrar'
      ? signInWithPassword
      : modo === 'crear'
        ? signUpWithPassword
        : modo === 'recuperar'
          ? requestPasswordReset
          : signInWithOtp;
  const [state, formAction] = useFormState(action, initialState);
  const [clave, setClave] = useState('');

  if (state.sent) {
    return (
      <CorreoEnviado
        modo={modo}
        email={state.email ?? email}
        next={next}
        onOtro={() => {
          onEmail('');
          onReiniciar();
        }}
      />
    );
  }

  const submitLabel =
    modo === 'entrar'
      ? t('signIn')
      : modo === 'crear'
        ? t('signUp')
        : modo === 'recuperar'
          ? t('resetCta')
          : t('magicLink');

  const errorEmail = state.field === 'email';
  const errorClave = state.field === 'password';

  return (
    <form action={formAction} className={cn('space-y-3', className)} noValidate>
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            icon
            invalid={errorEmail}
            aria-describedby={state.error ? 'acceso-error' : undefined}
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            autoFocus={modo === 'recuperar' || modo === 'enlace'}
          />
        </div>
      </div>

      {(modo === 'entrar' || modo === 'crear') && (
        <div>
          <CampoClave
            id="password"
            name="password"
            label={t('passwordLabel')}
            placeholder={modo === 'crear' ? t('passwordPlaceholderNew') : t('passwordLabel')}
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
            invalid={errorClave}
            describedBy={modo === 'crear' ? 'clave-fuerza' : undefined}
            value={clave}
            onChange={setClave}
          />
          {modo === 'crear' && <MedidorClave clave={clave} id="clave-fuerza" />}
          {modo === 'entrar' && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onModo('recuperar')}
                className="rounded-sm text-small font-medium text-primary transition-colors duration-150 hover:text-brote-green-deep"
              >
                <span className="link-underline">{t('forgot')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <p id="acceso-error" role="alert" className="flex items-start gap-2 text-small text-brote-coral">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </p>
      )}

      <div className="pt-1">
        <BotonEnviar label={submitLabel} />
      </div>

      {modo === 'entrar' && (
        <p className="pt-1 text-center text-small text-muted-foreground">
          <button
            type="button"
            onClick={() => onModo('enlace')}
            className="rounded-sm transition-colors duration-150 hover:text-foreground"
          >
            <span className="link-underline">{t('useMagic')}</span>
          </button>
        </p>
      )}
    </form>
  );
}

/* ── "Revisá tu correo" ───────────────────────────────────────────────────── */

const ESPERA_REENVIO = 60;

function CorreoEnviado({
  modo,
  email,
  next,
  onOtro,
}: {
  modo: ModoAcceso;
  email: string;
  next: string;
  onOtro: () => void;
}) {
  const t = useTranslations('auth');
  const [espera, setEspera] = useState(ESPERA_REENVIO);
  const [reenviando, setReenviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (espera <= 0) return;
    const id = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [espera]);

  const cuerpo =
    modo === 'crear'
      ? t('signupConfirm', { email })
      : modo === 'recuperar'
        ? t('resetSent', { email })
        : t('magicSent', { email });

  async function reenviar() {
    if (espera > 0 || reenviando) return;
    setReenviando(true);
    setAviso(null);
    const fd = new FormData();
    fd.set('email', email);
    fd.set('next', next);
    // Re-sending a sign-up confirmation goes through the magic link: it
    // confirms the address and signs in, without asking for the password again.
    const r = modo === 'recuperar' ? await requestPasswordReset(initialState, fd) : await signInWithOtp(initialState, fd);
    setReenviando(false);
    setEspera(ESPERA_REENVIO);
    setAviso(r.ok ? t('resent') : (r.error ?? null));
  }

  return (
    <div className="mt-2 rounded-card border border-border bg-surface p-5 shadow-soft" role="status">
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
        <MailCheck className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-h2 font-bold">{t('sentTitle')}</h3>
      <p className="mt-1.5 text-small leading-relaxed text-foreground">{cuerpo}</p>
      <p className="mt-2 text-caption leading-relaxed text-muted-foreground">{t('spamHint')}</p>
      {aviso && <p className="mt-3 text-caption text-primary">{aviso}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={reenviar} loading={reenviando} disabled={espera > 0}>
          {espera > 0 ? t('resendIn', { s: espera }) : t('resend')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onOtro}>
          {t('otherEmail')}
        </Button>
      </div>
    </div>
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

'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  Check,
  Leaf,
  ListChecks,
  Sprout,
  TreeDeciduous,
  Globe2,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { DOMAINS } from '@/lib/domains';
import { CITIES, OTHER_CITY } from '@/lib/data/cities';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { DailyActionRow } from '@/components/acciones/DailyActionRow';
import { ContextoChips, contextoRespondido } from '@/components/acciones/ContextoChips';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { LogoMark } from '@/components/brand/Logo';
import { fetchSuggestedAccounts, followUser, type SocialAccount } from '@/lib/api/social';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { completeActivity } from '@/lib/api/activities';
import { triggerRecommendations } from '@/lib/api/catalog';
import { pushSupported, subscribeToPush } from '@/lib/api/push';
import { celebrateCompletion } from '@/lib/rewards';
import { toast } from '@/stores/toast';
import { saveOnboardingProfile, finishOnboarding } from '@/app/onboarding/actions';
import type { ActivityRow } from '@/lib/supabase/rows';

/**
 * 0 bienvenida · 1 vos · 2 intereses · 3 a quién seguir · 4 tu casa ·
 * 5 tu mundo · 6 primera acción (+ avisos).
 *
 * El paso 3 no existe para una cuenta infantil: no sigue a nadie, no aparece
 * en sugerencias, y ofrecerle gente sería ofrecerle algo que el servidor le va
 * a negar. Por eso los pasos se saltean en vez de esconderse, y la barra de
 * progreso cuenta los que esa cuenta realmente va a ver.
 *
 * Cada paso tiene la misma forma: título con Pip arriba, contenido que puede
 * desplazarse, y UNA barra de acción fija abajo (con el margen seguro del
 * teléfono). Antes cada paso ponía su botón donde caía, y en pantallas bajas
 * el "Continuar" quedaba fuera de vista.
 */
const STEPS = 7;
const FOLLOW_STEP = 3;

type Edad = 'kid' | 'teen' | 'adult';

const EDADES: { key: Edad; label: string; detalle: string; Icon: typeof Sprout }[] = [
  { key: 'kid', label: 'Hasta 12', detalle: 'Cuenta cuidada: sin chat con desconocidos ni publicidad.', Icon: Sprout },
  { key: 'teen', label: '13 a 17', detalle: 'Publicás y te sumás a proyectos, con cuidados.', Icon: Leaf },
  { key: 'adult', label: '18 o más', detalle: 'Todo Brote: proyectos, Mercado y más.', Icon: TreeDeciduous },
];

/** The two server calls, injectable so a fixture route can walk the flow without an account. */
export interface OnboardingAcciones {
  guardar: typeof saveOnboardingProfile;
  terminar: typeof finishOnboarding;
}
const ACCIONES_REALES: OnboardingAcciones = { guardar: saveOnboardingProfile, terminar: finishOnboarding };

export function OnboardingFlow({
  initialName,
  acciones = ACCIONES_REALES,
}: {
  initialName: string;
  acciones?: OnboardingAcciones;
}) {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState(initialName);
  const [accountType, setAccountType] = useState<Edad>('adult');
  const [city, setCity] = useState('');
  const [otherCity, setOtherCity] = useState('');
  const [interests, setInterests] = useState<Set<string>>(new Set());
  // "Tu casa y tu día" (docs/ACCIONES.md §3) + cómo compra la comida.
  const [ctx, setCtx] = useState<Record<string, unknown>>({});
  const [suggested, setSuggested] = useState<SocialAccount[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState(false);
  const [firstAction, setFirstAction] = useState<ActivityRow | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avisos, setAvisos] = useState<'pregunta' | 'activando' | 'listo' | 'no'>('pregunta');
  const [pending, startTransition] = useTransition();

  // The first action is one anybody can do right now, from the sofa, at any
  // age: unplug the chargers left alone. Falls back to any easy daily one.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('activities')
      .select('*')
      .eq('slug', 'energia-desenchufar-cargadores')
      .eq('active', true)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) return setFirstAction(data as ActivityRow);
        const r = await supabase
          .from('activities')
          .select('*')
          .eq('type', 'daily')
          .eq('effort', 'easy')
          .eq('active', true)
          .order('sort_order')
          .limit(1)
          .maybeSingle();
        setFirstAction((r.data as ActivityRow | null) ?? null);
      });
  }, []);

  const isKid = accountType === 'kid';
  const visibles = useMemo(
    () => Array.from({ length: STEPS }, (_, i) => i).filter((i) => !(isKid && i === FOLLOW_STEP)),
    [isKid],
  );
  const posicion = Math.max(0, visibles.indexOf(step));

  // Asked for when the step opens, not on mount: `suggested_accounts` reads the
  // saved profile, and until step 2 persists there is nothing to match on.
  useEffect(() => {
    if (step !== FOLLOW_STEP || suggested !== null) return;
    fetchSuggestedAccounts(6)
      .then(setSuggested)
      .catch(() => setSuggested([]));
  }, [step, suggested]);

  function go(to: number) {
    setDir(to > step ? 1 : -1);
    setStep(to);
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /**
   * The single highest-leverage step in the whole flow: an account that follows
   * nobody on day one sees a feed with no people in it, and never comes back.
   * Failures are swallowed on purpose — a follow that does not stick must not
   * trap somebody inside onboarding.
   */
  async function followPicked() {
    if (following) return;
    setFollowing(true);
    await Promise.all(Array.from(picked).map((id) => followUser(id).catch(() => null)));
    setFollowing(false);
    go(FOLLOW_STEP + 1);
  }

  function toggleInterest(slug: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  /**
   * Saves what was answered so far. It used to fire and forget: if the save
   * failed, the person walked on through the flow with nothing stored — no
   * interests, no age — and the app recommended blind from day one. Now a
   * failure stops on the step and says so.
   *
   * `contexto`: sólo cuando contestó el paso 4 (saltearlo no marca todo como "no").
   */
  async function persist(contexto?: Record<string, unknown>): Promise<boolean> {
    const resolvedCity = city === OTHER_CITY ? otherCity : city;
    setSaving(true);
    const r = await acciones.guardar({
      displayName: name,
      city: resolvedCity,
      accountType,
      interests: Array.from(interests),
      ...(contexto ? { context: contexto } : {}),
    }).catch(() => ({ ok: false, error: undefined as string | undefined }));
    setSaving(false);
    if (!r.ok) {
      toast.error('No pudimos guardar', 'Revisá tu conexión y tocá Continuar de nuevo.');
      return false;
    }
    return true;
  }

  async function nextFrom(current: number) {
    if (current === 1 && !name.trim()) return;
    if (current === 2) {
      if (interests.size < 3) {
        toast.warning(t('interestsMin'));
        return;
      }
      // Save here so the account type and interests are real by the time
      // `suggested_accounts` runs on the next step.
      if (!(await persist())) return;
      go(isKid ? FOLLOW_STEP + 1 : FOLLOW_STEP);
      return;
    }
    if (current === 4) {
      if (!(await persist(contextoRespondido(ctx, accountType)))) return;
    }
    go(Math.min(STEPS - 1, current + 1));
  }

  function back() {
    // Walking backwards has to skip the same step going the other way.
    go(isKid && step === FOLLOW_STEP + 1 ? step - 2 : step - 1);
  }

  async function doFirstAction() {
    if (!firstAction || actionDone) return;
    setActionDone(true);
    try {
      const result = await completeActivity(firstAction.id);
      celebrateCompletion(result);
    } catch {
      // Even if it was already done, proceed — onboarding shouldn't get stuck.
    }
    void triggerRecommendations(); // cold-start AI recs (best-effort)
    // Without push on this device (an iPhone outside the installed app, an
    // old browser) there is nothing to ask: straight in.
    if (!pushSupported() || (typeof Notification !== 'undefined' && Notification.permission === 'denied')) {
      setAvisos('no');
      finish();
    }
  }

  async function activarAvisos() {
    setAvisos('activando');
    const {
      data: { user },
    } = await createClient().auth.getUser();
    const r = user ? await subscribeToPush(user.id) : { ok: false };
    setAvisos(r.ok ? 'listo' : 'no');
    if (r.ok) toast.success('Avisos activados', 'Te aviso antes de que se corte tu racha. Nada más que eso, salvo que elijas.');
    finish();
  }

  function finish() {
    startTransition(async () => {
      const r = await acciones.terminar().catch(() => ({ ok: false }));
      if (!r.ok) {
        toast.error('No pudimos terminar', 'Probá de nuevo en un momento.');
        return;
      }
      router.push('/');
      router.refresh();
    });
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -28 }),
  };

  const showChrome = step > 0;

  // `overflow-x-clip`, not `overflow-hidden`: hidden makes this div a scroll
  // container, and then neither the sticky header nor the sticky action bar
  // sticks to the screen — the bar fell below the fold on long steps.
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      {/* Two offset washes in the two brand colours: a light direction, not a centred blob. */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-[75%] rounded-full bg-primary/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-brote-sun/10 blur-[110px]" />

      {showChrome && (
        <header className="sticky top-0 z-20 bg-gradient-to-b from-background from-60% to-background/0 px-5 pb-4 pt-[max(env(safe-area-inset-top),0.9rem)]">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            {step < STEPS - 1 ? (
              <button
                onClick={back}
                aria-label={tc('back')}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="w-7" />
            )}
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-muted-foreground">
                Paso {posicion} de {visibles.length - 1}
              </p>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-border"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={visibles.length - 1}
                aria-valuenow={posicion}
              >
                <motion.div
                  className="h-full rounded-pill bg-primary"
                  initial={false}
                  animate={{ width: `${(posicion / (visibles.length - 1)) * 100}%` }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 32 }}
                />
              </div>
            </div>
            <span className="w-7" />
          </div>
        </header>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <div className="flex flex-1 flex-col pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.5rem)]">
                <div className="flex items-center gap-2">
                  <LogoMark size={24} />
                  <span className="font-display text-h3 font-extrabold tracking-tight">{BRAND.name}</span>
                </div>
                <div className="flex flex-1 flex-col justify-center py-8">
                  <Pip size={112} mood="happy" />
                  <span className="eyebrow mt-6 text-primary">Bienvenida</span>
                  <h1 className="mt-2 text-balance font-display text-display-l font-extrabold leading-[1.05]">
                    {t('welcomeTitle', { mascot: BRAND.mascot })}
                  </h1>
                  <p className="mt-3 max-w-sm text-balance leading-relaxed text-muted-foreground">{t('welcomeBody')}</p>
                  <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
                    {[
                      { Icon: ListChecks, txt: 'Te hago unas preguntas cortas para recomendarte bien.' },
                      { Icon: Leaf, txt: 'Hacés tu primera acción real, ahora mismo.' },
                      { Icon: Globe2, txt: 'Arranca tu mundo, que crece con cada cosa que hacés.' },
                    ].map(({ Icon, txt }) => (
                      <li key={txt} className="flex items-center gap-3 py-3 text-small">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        {txt}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button block size="lg" variant="primary" className="rounded-pill" onClick={() => go(1)}>
                  {t('start')} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <Paso
                titulo={t('nameTitle')}
                bajada="Tu nombre y tu provincia los cambiás cuando quieras desde Ajustes."
                accion={
                  <Button block size="lg" variant="primary" className="rounded-pill" disabled={!name.trim()} onClick={() => nextFrom(1)}>
                    {tc('continue')} <ArrowRight className="h-4 w-4" />
                  </Button>
                }
              >
                <div className="space-y-5">
                  <Field label={t('nameLabel')}>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      autoComplete="given-name"
                      maxLength={40}
                      autoFocus
                    />
                  </Field>
                  <Field label="¿Qué edad tenés?" help="Decide qué te mostramos. No se puede cambiar después, así que contestá con la verdad.">
                    {/*
                      Age is the single most consequential answer in onboarding
                      — it decides the whole content gate — so each option says
                      what it means and the chosen one gets a real selected
                      state (ring + check), not just a faint tint.
                    */}
                    <div className="grid gap-2" role="radiogroup" aria-label="Edad">
                      {EDADES.map((o) => {
                        const on = accountType === o.key;
                        return (
                          <button
                            key={o.key}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setAccountType(o.key)}
                            className={cn(
                              'press flex items-center gap-3 rounded-card border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150',
                              on
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/25'
                                : 'border-border bg-surface hover:border-primary/40',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-colors',
                                on ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-muted-foreground',
                              )}
                            >
                              <o.Icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-small font-semibold">{o.label}</span>
                              <span className="block text-caption leading-snug text-muted-foreground">{o.detalle}</span>
                            </span>
                            <span
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                              )}
                            >
                              {on && <Check className="h-3 w-3" strokeWidth={3} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label={t('cityLabel')} help={t('cityHelp')}>
                    <Select value={city} onChange={(e) => setCity(e.target.value)}>
                      <option value="" disabled>
                        {t('cityPlaceholder')}
                      </option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value={OTHER_CITY}>{t('cityOther')}</option>
                    </Select>
                    {city === OTHER_CITY && (
                      <Input
                        value={otherCity}
                        onChange={(e) => setOtherCity(e.target.value)}
                        placeholder={t('cityOtherPlaceholder')}
                        className="mt-2"
                        autoFocus
                      />
                    )}
                  </Field>
                </div>
              </Paso>
            )}

            {step === 2 && (
              <Paso
                titulo={t('interestsTitle')}
                bajada={t('interestsHelp')}
                accion={
                  <Button
                    block
                    size="lg"
                    variant="primary"
                    className="rounded-pill"
                    disabled={interests.size < 3}
                    loading={saving}
                    onClick={() => nextFrom(2)}
                  >
                    {interests.size < 3 ? `Elegí ${3 - interests.size} más` : tc('continue')}
                    {interests.size >= 3 && <ArrowRight className="h-4 w-4" />}
                  </Button>
                }
              >
                <p className="mb-3 text-caption text-muted-foreground tnum" aria-live="polite">
                  {interests.size} de {DOMAINS.length} elegidos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DOMAINS.map((d) => {
                    const active = interests.has(d.slug);
                    return (
                      <button
                        key={d.slug}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleInterest(d.slug)}
                        className={cn(
                          'press relative flex items-center gap-2.5 overflow-hidden rounded-card border p-2.5 text-left transition-[border-color,background-color] duration-150',
                          active ? 'bg-surface' : 'border-border bg-surface hover:border-border/60 hover:bg-surface-2',
                        )}
                        style={active ? { borderColor: d.color, backgroundColor: `${d.color}14` } : undefined}
                      >
                        <DomainIcon domain={d.slug} size={34} />
                        <span className="min-w-0 flex-1 text-small font-medium leading-tight">{d.name_es}</span>
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            active ? 'text-white' : 'border-border',
                          )}
                          style={active ? { backgroundColor: d.color, borderColor: d.color } : undefined}
                        >
                          {active && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Paso>
            )}

            {step === FOLLOW_STEP && (
              <Paso
                titulo={t('followTitle')}
                bajada={t('followHelp')}
                accion={
                  <div className="flex gap-3">
                    <Button variant="ghost" size="lg" className="flex-1" onClick={() => go(FOLLOW_STEP + 1)}>
                      {t('followSkip')}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-[2] rounded-pill"
                      loading={following}
                      disabled={picked.size === 0}
                      onClick={followPicked}
                    >
                      {t('followCta', { n: picked.size })}
                    </Button>
                  </div>
                }
              >
                <div className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
                  {suggested === null ? (
                    [0, 1, 2].map((i) => <div key={i} className="skeleton m-3 h-[52px] rounded-button" />)
                  ) : suggested.length === 0 ? (
                    <p className="p-4 text-small leading-relaxed text-muted-foreground">{t('followEmpty')}</p>
                  ) : (
                    suggested.map((a) => {
                      const active = picked.has(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => togglePick(a.id)}
                          aria-pressed={active}
                          className={cn(
                            'flex w-full items-center gap-3 p-3 text-left transition-colors duration-150',
                            active ? 'bg-primary/10' : 'hover:bg-surface-2',
                          )}
                        >
                          <PipAvatar
                            pipStyle={a.pip_style}
                            avatarUrl={a.avatar_url}
                            name={a.display_name}
                            rankSlug={a.rank_slug}
                            size={40}
                            ring
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-small font-semibold">{a.display_name ?? a.username}</span>
                            <span className="eyebrow block truncate text-muted-foreground">
                              {['@' + (a.username ?? ''), a.city].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'inline-flex h-8 shrink-0 items-center rounded-pill border px-3 text-caption font-semibold transition-colors',
                              active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground',
                            )}
                          >
                            {active ? 'Siguiendo' : 'Seguir'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </Paso>
            )}

            {step === 4 && (
              <Paso
                titulo={t('contextTitle')}
                bajada={t('contextHelp')}
                accion={
                  <div className="flex gap-3">
                    <Button variant="ghost" size="lg" className="flex-1" onClick={() => go(5)}>
                      {tc('skip')}
                    </Button>
                    <Button variant="primary" size="lg" className="flex-[2] rounded-pill" loading={saving} onClick={() => nextFrom(4)}>
                      {tc('continue')} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                }
              >
                <ContextoChips cuenta={accountType} valor={ctx} onChange={setCtx} />
                <p className="mb-2 mt-6 text-small font-semibold">{t('compraQuestion')}</p>
                <div className="flex flex-wrap gap-2">
                  {(['super', 'mixto', 'local'] as const).map((d) => (
                    <Chip key={d} active={ctx.compra === d} onClick={() => setCtx((c) => ({ ...c, compra: d }))}>
                      {t(`compra${d[0]!.toUpperCase()}${d.slice(1)}` as never)}
                    </Chip>
                  ))}
                </div>
              </Paso>
            )}

            {step === 5 && (
              <Paso
                titulo={t('mundoTitle')}
                bajada={t('mundoBody')}
                accion={
                  <Button block size="lg" variant="primary" className="rounded-pill" onClick={() => go(6)}>
                    {tc('continue')} <ArrowRight className="h-4 w-4" />
                  </Button>
                }
              >
                {/* Real frames of the game at three points of the journey, not illustrations. */}
                <figure className="leaf-clip relative overflow-hidden rounded-card shadow-soft-lg">
                  <Image
                    src="/mundo/poster-t1.jpg"
                    alt="Tu mundo el primer día: pasto, un pozo de agua y Pip"
                    width={1200}
                    height={600}
                    className="aspect-[16/10] w-full object-cover"
                    priority
                  />
                  <figcaption className="absolute bottom-3 left-3 rounded-pill bg-brote-ink/75 px-3 py-1 text-caption font-semibold text-brote-cream backdrop-blur">
                    Hoy
                  </figcaption>
                </figure>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { src: '/mundo/poster-t5.jpg', label: 'Con constancia', alt: 'Tu mundo después de algunas semanas' },
                    { src: '/mundo/poster-t9.jpg', label: 'Más adelante', alt: 'Tu mundo lleno de árboles en flor y agua' },
                  ].map((f) => (
                    <figure key={f.src} className="relative overflow-hidden rounded-card">
                      <Image src={f.src} alt={f.alt} width={600} height={300} className="aspect-[16/10] w-full object-cover" />
                      <figcaption className="absolute bottom-2 left-2 rounded-pill bg-brote-ink/75 px-2.5 py-0.5 text-caption font-semibold text-brote-cream backdrop-blur">
                        {f.label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <p className="mt-4 text-caption leading-relaxed text-muted-foreground">
                  Lo que construís en tu mundo no se pierde nunca: crece con tus acciones y te espera si un día no entrás.
                </p>
              </Paso>
            )}

            {step === 6 && (
              <Paso
                pip={actionDone ? 'celebrating' : 'happy'}
                titulo={actionDone ? '¡Listo, tu primera acción!' : t('firstActionTitle')}
                bajada={actionDone ? 'Ya empezó tu racha. Mañana, otra.' : t('firstActionBody')}
                accion={
                  actionDone && avisos === 'pregunta' ? (
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="flex-1"
                        onClick={() => {
                          setAvisos('no');
                          finish();
                        }}
                      >
                        Ahora no
                      </Button>
                      <Button variant="primary" size="lg" className="flex-[2] rounded-pill" onClick={activarAvisos}>
                        <Bell className="h-4 w-4" /> Avisame
                      </Button>
                    </div>
                  ) : actionDone ? (
                    <Button block size="lg" variant="primary" className="rounded-pill" loading>
                      {t('finishing')}
                    </Button>
                  ) : null
                }
              >
                {firstAction ? (
                  <DailyActionRow
                    title={firstAction.title_es}
                    domain={firstAction.domain_slug}
                    points={firstAction.base_points}
                    done={actionDone}
                    loading={pending}
                    onComplete={doFirstAction}
                  />
                ) : (
                  <div className="skeleton h-[68px] rounded-card" />
                )}
                {!actionDone && (
                  <p className="mt-3 text-caption leading-relaxed text-muted-foreground">
                    Tocala cuando la hagas. Brote funciona por confianza: lo que marcás es lo que hiciste.
                  </p>
                )}

                <AnimatePresence>
                  {actionDone && avisos !== 'no' && (
                    <motion.div
                      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.35, duration: 0.3 }}
                      className="mt-6 rounded-card border border-border bg-surface p-4 shadow-soft"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brote-sun/15 text-brote-sun">
                          <BellRing className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-small font-semibold">¿Te aviso antes de que se corte tu racha?</p>
                          <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
                            Un aviso a la noche sólo si ese día no hiciste nada. En Ajustes elegís qué más te llega, y a
                            la noche nunca suena.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Paso>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * One step: title + Pip on top, content that scrolls, the action pinned at the
 * bottom above the phone's safe area.
 */
function Paso({
  titulo,
  bajada,
  pip = 'happy',
  accion,
  children,
}: {
  titulo: string;
  bajada?: string;
  pip?: 'happy' | 'celebrating';
  accion: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start gap-3 pt-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-balance font-display text-h1 font-bold leading-tight">{titulo}</h1>
          {bajada && <p className="mt-1.5 text-balance text-small leading-relaxed text-muted-foreground">{bajada}</p>}
        </div>
        <Pip size={52} mood={pip} className="shrink-0" />
      </div>
      <div className="flex-1 pb-6 pt-5">{children}</div>
      {accion && (
        <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-background via-background to-background/0 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
          {accion}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'press inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border px-4 py-2 text-small font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary/40',
      )}
    >
      {active && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

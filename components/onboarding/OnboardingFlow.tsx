'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Sprout, Leaf, TreeDeciduous } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { DOMAINS } from '@/lib/domains';
import { CITIES, OTHER_CITY } from '@/lib/data/cities';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Mundo } from '@/components/mundo/Mundo';
import { DailyActionRow } from '@/components/acciones/DailyActionRow';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { fetchSuggestedAccounts, followUser, type SocialAccount } from '@/lib/api/social';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { completeActivity } from '@/lib/api/activities';
import { triggerRecommendations } from '@/lib/api/catalog';
import { celebrateCompletion } from '@/lib/rewards';
import { toast } from '@/stores/toast';
import { saveOnboardingProfile, finishOnboarding } from '@/app/onboarding/actions';
import type { ActivityRow } from '@/lib/supabase/rows';

/**
 * 0 bienvenida · 1 nombre/provincia/tipo · 2 intereses · 3 a quién seguir ·
 * 4 contexto · 5 tu mundo · 6 primera acción.
 *
 * El paso 3 no existe para una cuenta infantil: no sigue a nadie, no aparece
 * en sugerencias, y ofrecerle gente sería ofrecerle algo que el servidor le va
 * a negar. Por eso los pasos se saltean en vez de esconderse, y los puntitos de
 * progreso cuentan los que esa cuenta realmente va a ver.
 */
const STEPS = 7;
const FOLLOW_STEP = 3;

interface Ctx {
  balcon: boolean;
  jardin: boolean;
  auto: boolean;
  bici: boolean;
  mascota: boolean;
  /** How they usually shop for food — personalizes seasonal/local recs. */
  compra: 'super' | 'mixto' | 'local' | null;
}

export function OnboardingFlow({ initialName }: { initialName: string }) {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [accountType, setAccountType] = useState<'kid' | 'teen' | 'adult'>('adult');
  const [city, setCity] = useState('');
  const [otherCity, setOtherCity] = useState('');
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [ctx, setCtx] = useState<Ctx>({ balcon: false, jardin: false, auto: false, bici: false, mascota: false, compra: null });
  const [suggested, setSuggested] = useState<SocialAccount[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState(false);
  const [firstAction, setFirstAction] = useState<ActivityRow | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Preload an easy first daily action for the final step.
  useEffect(() => {
    createClient()
      .from('activities')
      .select('*')
      .eq('type', 'daily')
      .eq('effort', 'easy')
      .order('sort_order')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setFirstAction((data as ActivityRow | null) ?? null));
  }, []);

  const isKid = accountType === 'kid';

  // Asked for when the step opens, not on mount: `suggested_accounts` reads the
  // saved profile, and until step 2 persists there is nothing to match on.
  useEffect(() => {
    if (step !== FOLLOW_STEP || suggested !== null) return;
    fetchSuggestedAccounts(6).then(setSuggested).catch(() => setSuggested([]));
  }, [step, suggested]);

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
    setStep(FOLLOW_STEP + 1);
  }

  function toggleInterest(slug: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  function persist() {
    const resolvedCity = city === OTHER_CITY ? otherCity : city;
    startTransition(async () => {
      await saveOnboardingProfile({
        displayName: name,
        city: resolvedCity,
        accountType,
        interests: Array.from(interests),
        context: ctx as unknown as Record<string, unknown>,
      });
    });
  }

  function nextFrom(current: number) {
    if (current === 1 && !name.trim()) return;
    if (current === 2) {
      if (interests.size < 3) {
        toast.warning(t('interestsMin'));
        return;
      }
      // Save here so the account type and interests are real by the time
      // `suggested_accounts` runs on the next step.
      persist();
      setStep(isKid ? FOLLOW_STEP + 1 : FOLLOW_STEP);
      return;
    }
    if (current === 4) persist(); // save the context before showing the world
    setStep((s) => Math.min(STEPS - 1, s + 1));
  }

  function back() {
    // Walking backwards has to skip the same step going the other way.
    setStep((s) => (isKid && s === FOLLOW_STEP + 1 ? s - 2 : s - 1));
  }

  async function doFirstAction() {
    if (!firstAction || actionDone) return;
    setActionDone(true);
    try {
      const result = await completeActivity(firstAction.id);
      celebrateCompletion(result);
    } catch (e) {
      // Even if it was already done, proceed — onboarding shouldn't get stuck.
    }
    void triggerRecommendations(); // cold-start AI recs (best-effort)
    startTransition(async () => {
      await finishOnboarding();
      router.push('/');
      router.refresh();
    });
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-6">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      {/* Progress dots + back */}
      <div className="z-10 mb-4 flex items-center gap-3">
        {step > 0 && step < STEPS - 1 && (
          <button onClick={back} aria-label={tc('back')} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {Array.from({ length: STEPS })
            .map((_, i) => i)
            .filter((i) => !(isKid && i === FOLLOW_STEP))
            .map((i) => (
              <span
                key={i}
                className={cn('h-1.5 rounded-pill transition-all', i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border')}
              />
            ))}
        </div>
        <div className="w-5" />
      </div>

      <div className="z-10 flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <Centered>
                <Pip size={120} mood="happy" />
                <h1 className="mt-4 font-display text-display-l font-extrabold">{t('welcomeTitle', { mascot: BRAND.mascot })}</h1>
                <p className="mt-2 max-w-sm text-balance text-muted-foreground">{t('welcomeBody')}</p>
                <Button block variant="primary" className="mt-8 max-w-xs" onClick={() => setStep(1)}>
                  {t('start')}
                </Button>
              </Centered>
            )}

            {step === 1 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('nameTitle')} />
                <div className="mt-6 space-y-4">
                  <Field label={t('nameLabel')}>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      autoFocus
                    />
                  </Field>
                  <Field label="¿Qué edad tenés?" help="Con esto te mostramos acciones que podés hacer de verdad.">
                    {/*
                      Age is the single most consequential answer in onboarding
                      — it decides the whole content gate — so the selected
                      option gets a real selected state (ring + check), not
                      just a faint tint that is easy to misread.
                    */}
                    <div className="flex gap-2">
                      {([
                        { key: 'kid', label: 'Hasta 12', Icon: Sprout },
                        { key: 'teen', label: '13 a 17', Icon: Leaf },
                        { key: 'adult', label: '18 o más', Icon: TreeDeciduous },
                      ] as const).map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          aria-pressed={accountType === o.key}
                          onClick={() => setAccountType(o.key)}
                          className={cn(
                            'press relative flex-1 rounded-button border px-2 py-3 text-center',
                            accountType === o.key
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                              : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground',
                          )}
                        >
                          <o.Icon className="mx-auto h-5 w-5" />
                          <span className="mt-1.5 block text-caption font-medium">{o.label}</span>
                        </button>
                      ))}
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
                <Spacer />
                <Button block variant="primary" disabled={!name.trim()} onClick={() => nextFrom(1)}>
                  {tc('continue')}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('interestsTitle')} subtitle={t('interestsHelp')} />
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {DOMAINS.map((d) => {
                    const active = interests.has(d.slug);
                    return (
                      <button
                        key={d.slug}
                        onClick={() => toggleInterest(d.slug)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-card border p-3 text-left transition-all',
                          active ? 'bg-primary/10' : 'border-border bg-surface',
                        )}
                        style={active ? { borderColor: d.color } : undefined}
                      >
                        <DomainIcon domain={d.slug} size={36} />
                        <span className="flex-1 text-small font-medium leading-tight">{d.name_es}</span>
                        {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                <Spacer />
                <Button block variant="primary" disabled={interests.size < 3} onClick={() => nextFrom(2)}>
                  {tc('continue')} {interests.size > 0 && `(${interests.size})`}
                </Button>
              </div>
            )}

            {step === FOLLOW_STEP && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('followTitle')} subtitle={t('followHelp')} />
                <div className="mt-5 space-y-2">
                  {suggested === null ? (
                    [0, 1, 2].map((i) => <div key={i} className="skeleton h-[68px] rounded-card" />)
                  ) : suggested.length === 0 ? (
                    <p className="text-small leading-relaxed text-muted-foreground">{t('followEmpty')}</p>
                  ) : (
                    suggested.map((a) => {
                      const active = picked.has(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => togglePick(a.id)}
                          aria-pressed={active}
                          className={cn(
                            'press flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors',
                            active
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-surface hover:border-primary/30',
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
                            <span className="block truncate text-small font-semibold">
                              {a.display_name ?? a.username}
                            </span>
                            <span className="eyebrow block truncate text-muted-foreground">
                              {['@' + (a.username ?? ''), a.city].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                              active ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                            )}
                          >
                            {active && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <Spacer />
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(FOLLOW_STEP + 1)}>
                    {t('followSkip')}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-[2]"
                    loading={following}
                    disabled={picked.size === 0}
                    onClick={followPicked}
                  >
                    {t('followCta', { n: picked.size })}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('contextTitle')} subtitle={t('contextHelp')} />
                <div className="mt-5 flex flex-wrap gap-2">
                  {(['balcon', 'jardin', 'auto', 'bici', 'mascota'] as const).map((k) => (
                    <Chip key={k} active={ctx[k]} onClick={() => setCtx((c) => ({ ...c, [k]: !c[k] }))}>
                      {t(`has${k[0]!.toUpperCase()}${k.slice(1)}` as never)}
                    </Chip>
                  ))}
                </div>
                <p className="mt-6 mb-2 text-small font-medium">{t('compraQuestion')}</p>
                <div className="flex gap-2">
                  {(['super', 'mixto', 'local'] as const).map((d) => (
                    <Chip key={d} active={ctx.compra === d} onClick={() => setCtx((c) => ({ ...c, compra: d }))}>
                      {t(`compra${d[0]!.toUpperCase()}${d.slice(1)}` as never)}
                    </Chip>
                  ))}
                </div>
                <Spacer />
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => nextFrom(4)}>
                    {tc('skip')}
                  </Button>
                  <Button variant="primary" className="flex-[2]" onClick={() => nextFrom(4)}>
                    {tc('continue')}
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('mundoTitle')} subtitle={t('mundoBody')} />
                <div className="mt-5">
                  <Mundo height={280} interactive={false} />
                </div>
                <Spacer />
                <Button block variant="primary" onClick={() => setStep(6)}>
                  {tc('continue')}
                </Button>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="celebrating" title={t('firstActionTitle')} subtitle={t('firstActionBody')} />
                <div className="mt-6">
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
                </div>
                <Spacer />
                {actionDone && (
                  <p className="text-center text-small text-muted-foreground">{t('finishing')}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center text-center">{children}</div>;
}
function Spacer() {
  return <div className="flex-1" />;
}
function StepTitle({ title, subtitle, pip }: { title: string; subtitle?: string; pip?: 'happy' | 'celebrating' }) {
  return (
    <div className="flex items-start gap-3">
      <Pip size={48} mood={pip ?? 'happy'} />
      <div>
        <h1 className="font-display text-h1 font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-small text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-pill border px-4 py-2 text-small font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground',
      )}
    >
      {children}
    </button>
  );
}

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { DOMAINS } from '@/lib/domains';
import { BARRIOS } from '@/lib/data/barrios';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { MundoHeroFallback } from '@/components/mundo/MundoHeroFallback';
import { DailyActionRow } from '@/components/acciones/DailyActionRow';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { completeActivity } from '@/lib/api/activities';
import { celebrateCompletion } from '@/lib/rewards';
import { toast } from '@/stores/toast';
import { saveOnboardingProfile, finishOnboarding } from '@/app/onboarding/actions';
import type { ActivityRow } from '@/lib/supabase/rows';

const STEPS = 6;

interface Ctx {
  balcon: boolean;
  jardin: boolean;
  auto: boolean;
  bici: boolean;
  mascota: boolean;
  diet: 'never' | 'sometimes' | 'often' | null;
}

export function OnboardingFlow({ initialName }: { initialName: string }) {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [barrio, setBarrio] = useState('');
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [ctx, setCtx] = useState<Ctx>({ balcon: false, jardin: false, auto: false, bici: false, mascota: false, diet: null });
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

  function toggleInterest(slug: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  function persist() {
    startTransition(async () => {
      await saveOnboardingProfile({
        displayName: name,
        neighborhood: barrio,
        interests: Array.from(interests),
        context: ctx as unknown as Record<string, unknown>,
      });
    });
  }

  function nextFrom(current: number) {
    if (current === 1 && !name.trim()) return;
    if (current === 2 && interests.size < 3) {
      toast.warning(t('interestsMin'));
      return;
    }
    if (current === 3) persist(); // save before showing the world
    setStep((s) => Math.min(STEPS - 1, s + 1));
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
          <button onClick={() => setStep((s) => s - 1)} aria-label={tc('back')} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {Array.from({ length: STEPS }).map((_, i) => (
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
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      className={inputCls}
                      autoFocus
                    />
                  </Field>
                  <Field label={t('barrioLabel')} help={t('barrioHelp')}>
                    <input
                      value={barrio}
                      onChange={(e) => setBarrio(e.target.value)}
                      placeholder={t('barrioPlaceholder')}
                      list="barrios"
                      className={inputCls}
                    />
                    <datalist id="barrios">
                      {BARRIOS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
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

            {step === 3 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('contextTitle')} subtitle={t('contextHelp')} />
                <div className="mt-5 flex flex-wrap gap-2">
                  {(['balcon', 'jardin', 'auto', 'bici', 'mascota'] as const).map((k) => (
                    <Chip key={k} active={ctx[k]} onClick={() => setCtx((c) => ({ ...c, [k]: !c[k] }))}>
                      {t(`has${k[0]!.toUpperCase()}${k.slice(1)}` as never)}
                    </Chip>
                  ))}
                </div>
                <p className="mt-6 mb-2 text-small font-medium">{t('dietQuestion')}</p>
                <div className="flex gap-2">
                  {(['never', 'sometimes', 'often'] as const).map((d) => (
                    <Chip key={d} active={ctx.diet === d} onClick={() => setCtx((c) => ({ ...c, diet: d }))}>
                      {t(`diet${d[0]!.toUpperCase()}${d.slice(1)}` as never)}
                    </Chip>
                  ))}
                </div>
                <Spacer />
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => nextFrom(3)}>
                    {tc('skip')}
                  </Button>
                  <Button variant="primary" className="flex-[2]" onClick={() => nextFrom(3)}>
                    {tc('continue')}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-1 flex-col">
                <StepTitle pip="happy" title={t('mundoTitle')} subtitle={t('mundoBody')} />
                <div className="mt-5">
                  <MundoHeroFallback height={260} />
                </div>
                <Spacer />
                <Button block variant="primary" onClick={() => setStep(5)}>
                  {tc('continue')}
                </Button>
              </div>
            )}

            {step === 5 && (
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

const inputCls =
  'w-full rounded-button border border-border bg-surface px-4 py-3 text-body outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

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
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-small font-medium">{label}</span>
      {children}
      {help && <span className="mt-1 block text-caption text-muted-foreground">{help}</span>}
    </label>
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

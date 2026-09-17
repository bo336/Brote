'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { CalendarDays, Sprout } from 'lucide-react';

import { MAX_TIER } from '@/lib/world/progression';
import { cn } from '@/lib/utils/cn';
import { useSessionStore } from '../state/useSessionStore';

/**
 * **How to play, in four short steps** — shown once, on the first visit, and
 * again from the "?" at any time.
 *
 * The 2026-09-16 playtest: "everyone has to understand the objective, how to
 * play it, when they can do things, what will improve, and what requires real
 * world actions". The controls strip answered only the keys. This answers the
 * rest, in the order a player needs it:
 *
 *  1. **Out there** — the island grows with real actions logged in Brote; that
 *     is what levels it up and opens regions, animals and structures. With where
 *     this player is on that path, right now.
 *  2. **In here** — today's tasks, the golden light that leads to them, the
 *     green ring and E, and what doing them gives back.
 *  3. **What the marks mean** — the light, the ring, the button, the seeds, and
 *     that tasks come back every day.
 *  4. **The controls**, for this device.
 *
 * Not during the first session's own guided beats, which already lead by the
 * hand; it waits until they are done.
 */
const SEEN_KEY = 'brote.mundo.howto.v1';

const CONTROLS: { keys: string; touch: string; label: string }[] = [
  { keys: 'guide.keys.move', touch: 'guide.touch.move', label: 'guide.label.move' },
  { keys: 'guide.keys.run', touch: 'guide.touch.run', label: 'guide.label.run' },
  { keys: 'guide.keys.jump', touch: 'guide.touch.jump', label: 'guide.label.jump' },
  { keys: 'guide.keys.use', touch: 'guide.touch.use', label: 'guide.label.use' },
  { keys: 'guide.keys.look', touch: 'guide.touch.look', label: 'guide.label.look' },
  { keys: 'guide.keys.zoom', touch: 'guide.touch.zoom', label: 'guide.label.zoom' },
];

const STEPS = ['real', 'island', 'legend', 'controls'] as const;

export function HowToPlay({
  tier,
  worldIndex,
  worldGrowth,
  worldGoal,
  firstRunActive,
}: {
  tier: number;
  worldIndex: number;
  worldGrowth: number;
  worldGoal: number;
  firstRunActive: boolean;
}) {
  const t = useTranslations('mundo');
  const open = useSessionStore((s) => s.helpOpen);
  const setOpen = useSessionStore((s) => s.setHelpOpen);
  const ready = useSessionStore((s) => s.ready);
  const hud = useSessionStore((s) => s.hud);
  const [step, setStep] = useState(0);
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(window.matchMedia?.('(pointer: coarse)')?.matches ?? false), []);

  // The first visit opens it, once the island is up and nothing else is leading.
  useEffect(() => {
    if (!ready || firstRunActive || hud !== 'play') return;
    try {
      if (window.localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    setStep(0);
    setOpen(true);
  }, [ready, firstRunActive, hud, setOpen]);

  const close = () => {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Private mode: it simply opens again next time.
    }
    setOpen(false);
    setStep(0);
  };

  const id = STEPS[step] ?? 'real';
  const last = step === STEPS.length - 1;
  const pct = Math.min(100, Math.round((worldGrowth / Math.max(1, worldGoal)) * 100));

  return (
    <AnimatePresence>
      {open && hud === 'play' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center bg-brote-ink/40 px-3 pb-[max(env(safe-area-inset-bottom),16px)] backdrop-blur-[2px] sm:items-center"
          onPointerDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={t('guide.title')}
        >
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="w-full max-w-md rounded-3xl bg-brote-cream p-5 text-brote-ink shadow-soft-lg"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'rounded-pill px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]',
                  id === 'real' ? 'bg-brote-green/15 text-brote-green-deep' : 'bg-brote-sun/20 text-brote-ink',
                )}
              >
                {t(`howto.${id}.tag`)}
              </span>
              <span className="tnum text-caption text-brote-ink/50">
                {t('howto.step', { n: step + 1, total: STEPS.length })}
              </span>
            </div>
            <h2 className="mt-2 font-display text-[20px] font-semibold leading-tight">{t(`howto.${id}.title`)}</h2>

            {id === 'real' && (
              <>
                <p className="mt-2 text-small text-brote-ink/80">{t('howto.real.body')}</p>
                <div className="mt-3 rounded-2xl bg-white/70 p-3">
                  <div className="flex items-center justify-between text-caption font-semibold">
                    <span>{t('howto.real.level', { tier, max: MAX_TIER })}</span>
                    <span className="tnum text-brote-ink/60">
                      {t('howto.real.world', { n: worldIndex, growth: worldGrowth, goal: worldGoal })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-brote-ink/10">
                    <div className="h-full rounded-pill bg-brand-gradient" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-caption text-brote-ink/60">{t('howto.real.hint')}</p>
                </div>
              </>
            )}

            {id === 'island' && (
              <ol className="mt-2 space-y-2 text-small text-brote-ink/80">
                {(['one', 'two', 'three'] as const).map((k, i) => (
                  <li key={k} className="flex gap-2.5">
                    <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brote-ink text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{t(`howto.island.${k}${k === 'two' && touch ? 'Touch' : ''}`)}</span>
                  </li>
                ))}
              </ol>
            )}

            {id === 'legend' && (
              <ul className="mt-3 space-y-2.5 text-small text-brote-ink/80">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-end justify-center rounded-xl bg-brote-ink/85 pb-1">
                    <span className="h-7 w-2 rounded-full bg-gradient-to-t from-brote-sun to-brote-sun/0" />
                  </span>
                  {t('howto.legend.beam')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brote-ink/85">
                    <span className="h-4 w-7 rounded-[50%] border-2 border-brote-green" />
                  </span>
                  {t('howto.legend.ring')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-soft">
                    <kbd className="rounded-md border border-brote-ink/30 px-1.5 font-sans text-[11px] font-bold leading-5">
                      {touch ? '●' : 'E'}
                    </kbd>
                  </span>
                  {t(touch ? 'howto.legend.buttonTouch' : 'howto.legend.button')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brote-ink/85 text-white">
                    <Sprout className="h-4 w-4" aria-hidden />
                  </span>
                  {t('howto.legend.seeds')}
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brote-ink/85 text-white">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                  </span>
                  {t('howto.legend.daily')}
                </li>
              </ul>
            )}

            {id === 'controls' && (
              <ul className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2 min-[420px]:grid-cols-2">
                {CONTROLS.map((row) => (
                  <li key={row.label} className="flex items-center gap-2 text-small">
                    <kbd className="min-w-[2.5rem] whitespace-nowrap rounded-md border border-brote-ink/25 bg-white px-1.5 text-center font-sans text-[11px] font-bold leading-6">
                      {t(touch ? row.touch : row.keys)}
                    </kbd>
                    <span className="text-brote-ink/80">{t(row.label)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={close} className="text-caption font-semibold text-brote-ink/55">
                {t('howto.skip')}
              </button>
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <span key={s} className={cn('h-1.5 rounded-pill transition-all', i === step ? 'w-4 bg-brote-ink' : 'w-1.5 bg-brote-ink/20')} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="rounded-pill px-3 py-2 text-caption font-semibold text-brote-ink/70"
                  >
                    {t('howto.back')}
                  </button>
                )}
                <button
                  type="button"
                  // Focused, so Enter and Space turn the page rather than reaching the game.
                  autoFocus
                  onClick={() => (last ? close() : setStep(step + 1))}
                  className="rounded-pill bg-brote-ink px-4 py-2 text-caption font-bold text-white transition-transform active:scale-95"
                >
                  {last ? t('howto.start') : t('howto.next')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

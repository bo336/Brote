'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { BookOpen, Gift, Hammer, Sparkles, Sprout, Star, Sun, ShoppingBag } from 'lucide-react';

import { castName } from '@/lib/world/game/texto/guia';
import { useFeedback, type Toast, type ToastTone } from '../useGameFeedback';
import { useGains } from '../gains';

/**
 * The game's moments, stacked at the top right under the wallet, and the one
 * line of explanation at the bottom when something could not be done.
 *
 * Toasts leave by themselves (a chapter closing stays longer: it carries the
 * character's line, which is the lesson). Nothing here blocks the world.
 */
const ICON: Record<ToastTone, typeof Sprout> = {
  mission: Sparkles, daily: Sun, stage: Sprout, build: Hammer, card: BookOpen, gift: Gift, star: Star, buy: ShoppingBag,
};
const LIFE_MS: Record<ToastTone, number> = {
  mission: 7000, daily: 3800, stage: 3800, build: 4800, card: 6500, gift: 5200, star: 4000, buy: 2600,
};

function ToastCard({ toast }: { toast: Toast }) {
  const t = useTranslations('mundo.juego.toast');
  const drop = useFeedback((s) => s.drop);
  useEffect(() => {
    const id = setTimeout(() => drop(toast.id), LIFE_MS[toast.tone]);
    return () => clearTimeout(id);
  }, [toast, drop]);
  const Icon = ICON[toast.tone];
  const big = toast.tone === 'mission';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onClick={() => drop(toast.id)}
      className={`pointer-events-auto w-full cursor-pointer rounded-2xl px-3.5 py-2.5 shadow-soft-lg backdrop-blur-md ${
        big ? 'bg-brote-cream text-brote-ink' : 'bg-brote-ink/70 text-white'
      }`}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${big ? 'bg-brote-sun/90 text-brote-ink' : 'bg-white/15'}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {big && <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brote-green-deep">{t('cumplida')}</p>}
          <p className="font-display text-[14px] font-semibold leading-snug">{toast.title}</p>
          {toast.body && (
            <p className={`mt-0.5 text-[12.5px] leading-snug ${big ? 'text-brote-ink/80' : 'text-white/80'}`}>
              {toast.who && <span className="font-semibold">{castName(toast.who)}: </span>}
              {toast.body}
            </p>
          )}
        </div>
        {toast.semillas ? (
          <span className={`tnum shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold ${big ? 'bg-brote-green/15 text-brote-green-deep' : 'bg-brote-sun/25 text-brote-sun'}`}>
            +{toast.semillas}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

export function Toasts({ top }: { top: string }) {
  const toasts = useFeedback((s) => s.toasts);
  const line = useFeedback((s) => s.line);
  const clearLine = useFeedback((s) => s.clearLine);
  useEffect(() => {
    if (!line) return;
    const id = setTimeout(clearLine, 3600);
    return () => clearTimeout(id);
  }, [line, clearLine]);

  return (
    <>
      <div className="pointer-events-none absolute right-3 flex w-[min(20rem,78vw)] flex-col gap-2" style={{ top }}>
        <AnimatePresence initial={false}>
          {toasts.map((t) => <ToastCard key={t.id} toast={t} />)}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {line && (
          <motion.p
            key={line.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-40 mx-auto w-fit max-w-[84%] rounded-2xl bg-brote-ink/80 px-4 py-2 text-center text-[13px] leading-snug text-white backdrop-blur-sm"
            role="status"
          >
            {line.text}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}

/** "+1 rama": floats up from the middle of the screen, merges into runs, fades. */
export function Gains() {
  const gains = useGains((s) => s.gains);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[38%] flex flex-col items-center gap-1">
      <AnimatePresence>
        {gains.map((g) => <GainChip key={g.id} id={g.id} at={g.at} text={g.text} color={g.color} />)}
      </AnimatePresence>
    </div>
  );
}

/** Each chip leaves 1.4 s after its last gain — a run that keeps going keeps it up. */
function GainChip({ id, at, text, color }: { id: number; at: number; text: string; color: string }) {
  const drop = useGains((s) => s.drop);
  useEffect(() => {
    const t = setTimeout(() => drop(id), 1400);
    return () => clearTimeout(t);
  }, [id, at, drop]);
  return (
    <motion.span
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="tnum rounded-full bg-brote-ink/55 px-2.5 py-0.5 text-[13px] font-bold shadow backdrop-blur-sm"
      style={{ color }}
    >
      {text}
    </motion.span>
  );
}

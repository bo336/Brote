'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useSessionStore } from '../state/useSessionStore';

/**
 * "You did that." The card that closes the loop on every action.
 *
 * Doing a chore used to change nothing on screen. With the burst in the world
 * and Pip's hop, this is the third of the three things `10` §6 asks for — and
 * the only one that says *what* happened in words.
 */
const REWARD_MS = 2400;
const SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const;

export function RewardToast() {
  const reward = useSessionStore((s) => s.reward);
  const clear = useSessionStore((s) => s.clearReward);
  const t = useTranslations('mundo');

  useEffect(() => {
    if (!reward) return;
    const id = setTimeout(clear, REWARD_MS);
    return () => clearTimeout(id);
  }, [reward, clear]);

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={SPRING}
          className="pointer-events-none absolute inset-x-0 top-[24%] mx-auto w-fit max-w-[86vw] rounded-3xl bg-brote-cream/95 px-6 py-3.5 text-center text-brote-ink shadow-soft-lg"
          role="status"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brote-green">{t('reward.eyebrow')}</p>
          <p className="font-display text-xl font-bold leading-tight">{t(reward.titleKey)}</p>
          {(reward.thingText || reward.thingKey) && (
            <p className="mt-0.5 text-small text-brote-ink/70">{reward.thingText ?? t(reward.thingKey!)}</p>
          )}
          {reward.semillas > 0 && (
            <span className="tnum mt-2 inline-flex items-center gap-1 rounded-pill bg-brote-green/15 px-2.5 py-0.5 text-caption font-bold text-brote-green">
              <Sprout className="h-3.5 w-3.5" aria-hidden />
              {t('reward.semillas', { n: reward.semillas })}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

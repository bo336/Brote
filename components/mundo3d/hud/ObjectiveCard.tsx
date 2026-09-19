'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { JOYSTICK } from '@/lib/world/config';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The one next thing to do, under the back button (`lib/world/objectives.ts`).
 *
 * The playtest said "I don't know what to do". This is not a quest log — it is
 * one line, the Bitácora Viva eyebrow over it, and how far away the thing is.
 * The beacon in the world shows where.
 */
const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const;
/** Closer than this the distance is noise: you are already there. */
const SHOW_DISTANCE_OVER_M = 6;
/** Below the back button's 48 px, with a little air. */
const BELOW_BACK_PX = 60;

export function ObjectiveCard() {
  const objective = useSessionStore((s) => s.objective);
  const t = useTranslations('mundo');
  if (!objective) return null;
  const thing = objective.thingKey ? t(objective.thingKey) : '';

  return (
    <div
      className="pointer-events-none absolute left-4 max-w-[min(20rem,64vw)]"
      style={{ top: `calc(max(env(safe-area-inset-top), ${JOYSTICK.safeAreaMinPx}px) + ${BELOW_BACK_PX}px)` }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${objective.titleKey}:${objective.targetId ?? '-'}`}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={SPRING}
          className="rounded-2xl bg-brote-ink/60 px-3.5 py-2.5 text-white shadow-soft-lg backdrop-blur-md"
          role="status"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brote-sun">
            <Compass className="h-3.5 w-3.5" aria-hidden />
            {t('goal.eyebrow')}
          </p>
          <p className="mt-0.5 font-display text-[15px] font-semibold leading-snug">
            {t(objective.titleKey, { thing })}
          </p>
          {(objective.progress || (objective.distanceM ?? 0) > SHOW_DISTANCE_OVER_M) && (
            <p className="tnum mt-1 flex items-center gap-3 text-caption text-white/70">
              {objective.progress && (
                <span>{t('goal.progress', { done: objective.progress.done, total: objective.progress.total })}</span>
              )}
              {(objective.distanceM ?? 0) > SHOW_DISTANCE_OVER_M && (
                <span>{t('goal.distance', { m: Math.round(objective.distanceM ?? 0) })}</span>
              )}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

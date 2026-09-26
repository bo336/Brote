'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Sun } from 'lucide-react';

import { JOYSTICK } from '@/lib/world/config';
import { useSessionStore } from '../../state/useSessionStore';
import { useMissionView } from '../scene/MissionGuide';
import { useGameUi } from '../useGameUi';

/**
 * The one next thing, under the back button: the current chapter of the story
 * (who asks, where), or today's mission, or simply what the island most needs.
 *
 * One card, never a list — the list is one tap away (the card opens the
 * missions tab). The beacon in the world shows where; the card says what,
 * how far along, and how far away.
 */
const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const;
const BELOW_BACK_PX = 60;

export function MissionCard() {
  const view = useMissionView((s) => s.view);
  const distance = useSessionStore((s) => s.objective?.distanceM ?? null);
  if (!view) return null;
  const pct = view.progress ? Math.round((view.progress.done / Math.max(1, view.progress.total)) * 100) : null;
  const Icon = view.kind === 'daily' ? Sun : Compass;

  return (
    <div
      className="pointer-events-auto absolute left-4 max-w-[min(21rem,68vw)]"
      style={{ top: `calc(max(env(safe-area-inset-top), ${JOYSTICK.safeAreaMinPx}px) + ${BELOW_BACK_PX}px)` }}
    >
      <AnimatePresence mode="wait">
        <motion.button
          type="button"
          key={view.id}
          onClick={() => useGameUi.getState().open({ kind: 'isla', tab: 'misiones' })}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={SPRING}
          className="block w-full rounded-2xl bg-brote-ink/65 px-3.5 py-2.5 text-left text-white shadow-soft-lg backdrop-blur-md active:scale-[0.99]"
          aria-label={`Misión: ${view.title}`}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brote-sun">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {view.eyebrow}
          </p>
          <p className="mt-0.5 font-display text-[15px] font-semibold leading-snug">{view.title}</p>
          {view.ask && <p className="mt-0.5 text-[12.5px] leading-snug text-white/80">{view.ask}</p>}
          {(pct !== null || (distance ?? 0) > 6) && (
            <div className="mt-1.5 flex items-center gap-2.5">
              {pct !== null && (
                <>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-brote-sun transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tnum text-[11px] text-white/75">{view.progress!.done}/{view.progress!.total}</span>
                </>
              )}
              {(distance ?? 0) > 6 && <span className="tnum text-[11px] text-white/70">{Math.round(distance!)} m</span>}
            </div>
          )}
        </motion.button>
      </AnimatePresence>
    </div>
  );
}

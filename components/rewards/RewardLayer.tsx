'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Pip } from '@/components/pip/Pip';
import { Confetti } from './Confetti';
import { useRewards, type RewardEvent } from '@/stores/rewards';
import { RANK_BY_SLUG } from '@/lib/ranks';
import { haptic } from '@/lib/utils/haptics';
import { formatPoints } from '@/lib/points';

/**
 * Renders the reward queue (BUILD_SPEC §5.3, §6.2). Rank-ups get a full-screen
 * celebration; titles/badges/session bonus get a compact card. Auto-advances.
 */
export function RewardLayer() {
  const event = useRewards((s) => s.queue[0]);
  const next = useRewards((s) => s.next);

  useEffect(() => {
    if (!event) return;
    haptic('success');
    const ms = event.kind === 'rankUp' ? 4200 : 2600;
    const id = setTimeout(next, ms);
    return () => clearTimeout(id);
  }, [event, next]);

  return (
    <AnimatePresence mode="wait">
      {event && (
        <motion.div
          key={event.id}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-brote-ink/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={next}
          role="dialog"
          aria-live="assertive"
        >
          <Confetti count={event.kind === 'rankUp' ? 40 : 20} />
          <RewardContent event={event} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RewardContent({ event }: { event: RewardEvent }) {
  const t = useTranslations('rewards');

  if (event.kind === 'rankUp') {
    const rank = RANK_BY_SLUG[event.rankSlug];
    return (
      <motion.div
        className="relative z-10 flex flex-col items-center px-8 text-center"
        initial={{ scale: 0.6, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      >
        <Pip size={140} mood="celebrating" aura golden={event.rankSlug === 'gaia'} />
        <p className="mt-4 text-small font-semibold uppercase tracking-widest text-brote-sun">
          ¡Nuevo rango!
        </p>
        <h2 className="mt-1 font-display text-display-xl font-extrabold text-white" style={{ color: rank?.color }}>
          {rank?.name_es ?? event.rankSlug}
        </h2>
        {rank?.unlock_es && (
          <p className="mt-2 max-w-xs text-balance text-small text-white/80">{rank.unlock_es}</p>
        )}
        <p className="mt-6 text-caption text-white/50">Tocá para continuar</p>
      </motion.div>
    );
  }

  const map = {
    divisionUp: { glyph: '⬆️', title: event.kind === 'divisionUp' ? event.label : '', sub: '' },
    title: { glyph: '🏅', title: t('newTitle', { title: event.kind === 'title' ? event.name : '' }), sub: '' },
    badge: { glyph: '🎖️', title: t('newBadge', { badge: event.kind === 'badge' ? event.name : '' }), sub: '' },
    sessionBonus: {
      glyph: '🎉',
      title: t('sessionBonus', { points: event.kind === 'sessionBonus' ? formatPoints(event.points) : '' }),
      sub: '',
    },
    firstAction: { glyph: '🌱', title: t('firstAction'), sub: t('keepGrowing') },
  } as const;
  const c = map[event.kind as keyof typeof map];

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center rounded-sheet bg-surface px-8 py-7 text-center shadow-soft-lg"
      initial={{ scale: 0.7, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className="text-5xl">{c.glyph}</span>
      <h2 className="mt-3 max-w-xs text-balance font-display text-h2 font-bold">{c.title}</h2>
      {c.sub && <p className="mt-1 text-small text-muted-foreground">{c.sub}</p>}
    </motion.div>
  );
}

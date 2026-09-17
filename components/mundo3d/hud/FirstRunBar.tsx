'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { CARE_CHIPS } from '@/lib/world/onboarding';
import type { FirstRunSummary } from '../state/useSessionStore';

/**
 * What the first session puts on screen, which is as close to nothing as the
 * beat allows (`11-GAME-LOOP.md` §7).
 *
 * `move` and `plant` get **no controls at all** — the caption slot says the one
 * sentence and the world does the rest. Only the three beats that genuinely
 * need an answer draw anything, and the one question in the whole sequence has
 * three answers, each of which puts an object on the island immediately.
 *
 * There is a way out of every beat. A first session you cannot leave is a
 * modal, and the sequence is deliberately not one.
 */
export function FirstRunBar({ run }: { run: FirstRunSummary }) {
  const t = useTranslations('mundo.first');

  if (run.beat === 'move' || run.beat === 'plant') return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-6">
      {run.beat === 'care' && (
        <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
          {CARE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => run.choose(chip)}
              className="rounded-pill bg-brote-green px-5 py-2.5 text-small font-bold text-white shadow-lg transition-transform active:scale-95"
            >
              {t(`chip.${chip}`)}
            </button>
          ))}
        </div>
      )}

      {run.beat === 'promise' && (
        <button
          type="button"
          onClick={run.advance}
          className="pointer-events-auto rounded-pill bg-brote-green px-6 py-3 text-small font-bold text-white shadow-lg transition-transform active:scale-95"
        >
          {t('continue')}
        </button>
      )}

      {/* The last beat is the only ask in the sequence, and it is a link out of
          the game rather than a gate inside it: the world never blocks on a
          real action (`11-GAME-LOOP.md` §5, "explicitly not seams"). */}
      {run.beat === 'act' && (
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <Link
            href="/acciones"
            className="rounded-pill bg-brote-green px-6 py-3 text-small font-bold text-white shadow-lg transition-transform active:scale-95"
          >
            {t('log')}
          </Link>
          <button
            type="button"
            onClick={run.skip}
            className="rounded-pill px-4 py-2 text-caption font-semibold text-white/70"
          >
            {t('later')}
          </button>
        </div>
      )}

      {run.beat !== 'act' && (
        <button
          type="button"
          onClick={run.skip}
          className="pointer-events-auto rounded-pill px-4 py-1.5 text-caption font-semibold text-white/60"
        >
          {t('skip')}
        </button>
      )}
    </div>
  );
}

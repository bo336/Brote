'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { eventPayout } from '../events/useEventRuntime';
import type { EventRun } from '../events/useEventRuntime';

/**
 * What an event puts on screen, which is almost nothing.
 *
 * The prompts, the wrong-turn lines and the closing line all go through the
 * same self-clearing caption everything else in the world uses — an event is
 * played by walking, so the screen stays out of the way while it happens.
 *
 * Two things live here. A **leave** control, present the whole time, because
 * every event is skippable at every moment (`11-GAME-LOOP.md` §3.7) and a skip
 * you have to hunt for is not one. And the **closing card**, which names what
 * it paid and — for the events that teach — says the one thing it taught.
 *
 * There is no score, no grade and no tally of wrong turns. A mis-sorted bottle
 * earns the reason it belongs elsewhere, never a mark against the player.
 */
export function EventCard({ run }: { run: EventRun }) {
  const t = useTranslations('mundo.event');
  const tHud = useTranslations('mundo');
  if (!run.script) return null;

  const { script, done, mistakes } = run;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6">
      {/* Leaving. Always there, never in the way, and it costs nothing. */}
      {!done && (
        <button
          type="button"
          onClick={run.skip}
          aria-label={tHud('tierup.skip')}
          className="pointer-events-auto absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-pill bg-brote-ink/60 text-brote-cream"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}

      {done && (
        <div className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl bg-brote-ink/85 p-5 backdrop-blur-sm">
          <h2 className="text-h3 font-semibold text-brote-cream">{t(`${script.id}.title`)}</h2>
          <p className="mt-1.5 text-body text-brote-cream/90">{t(`${script.id}.end`)}</p>
          {/* The one line it taught, for the events that teach. */}
          {script.learnKey && (
            <p className="mt-3 rounded-2xl bg-brote-green/15 p-3 text-small leading-relaxed text-brote-lime">
              {t(script.learnKey.replace('event.', ''))}
            </p>
          )}
          <p className="mt-3 text-caption text-brote-cream/70">
            {tHud('event.paid', { n: eventPayout(script.id, mistakes) })}
          </p>
          <button
            type="button"
            onClick={run.skip}
            className="mt-4 rounded-pill bg-brote-green px-5 py-3 text-body font-semibold text-white"
          >
            {tHud('tierup.volver')}
          </button>
        </div>
      )}
    </div>
  );
}

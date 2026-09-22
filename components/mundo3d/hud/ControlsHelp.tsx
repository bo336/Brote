'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils/cn';
import { useSessionStore, type ControlKind } from '../state/useSessionStore';

/**
 * How to play, on screen, until you have played.
 *
 * The playtest: "I don't know how to play." Every control is listed — with the
 * keys on a keyboard, with the gesture on a phone — and each one crosses itself
 * out the first time it is used. When all four have been, or after a while, the
 * strip steps aside; the "?" beside the counter brings it back.
 */
const AUTO_HIDE_MS = 30000;

const ROWS: { kind: ControlKind | 'run' | 'zoom'; keys: string; touch: string; label: string }[] = [
  { kind: 'move', keys: 'guide.keys.move', touch: 'guide.touch.move', label: 'guide.label.move' },
  { kind: 'run', keys: 'guide.keys.run', touch: 'guide.touch.run', label: 'guide.label.run' },
  { kind: 'jump', keys: 'guide.keys.jump', touch: 'guide.touch.jump', label: 'guide.label.jump' },
  { kind: 'use', keys: 'guide.keys.use', touch: 'guide.touch.use', label: 'guide.label.use' },
  { kind: 'look', keys: 'guide.keys.look', touch: 'guide.touch.look', label: 'guide.label.look' },
  { kind: 'zoom', keys: 'guide.keys.zoom', touch: 'guide.touch.zoom', label: 'guide.label.zoom' },
];

export function ControlsHelp() {
  const used = useSessionStore((s) => s.controlsUsed);
  const open = useSessionStore((s) => s.helpOpen);
  const setOpen = useSessionStore((s) => s.setHelpOpen);
  const t = useTranslations('mundo');
  const [touch, setTouch] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia?.('(pointer: coarse)')?.matches ?? false);
    const id = setTimeout(() => setExpired(true), AUTO_HIDE_MS);
    return () => clearTimeout(id);
  }, []);

  const allUsed = used.move && used.look && used.jump && used.use;
  const visible = open || (!allUsed && !expired);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          // At the bottom edge on a desktop, clear of Pip in the middle of the frame;
          // on a phone the bottom corners belong to the thumbs, so under the goal card.
          className="pointer-events-auto absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[94vw] rounded-2xl bg-brote-ink/65 px-3.5 py-2.5 text-white backdrop-blur-md [@media(pointer:coarse)]:bottom-auto [@media(pointer:coarse)]:top-[24%]"
        >
          <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-brote-sun">{t('guide.title')}</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {ROWS.map((row) => {
              const done = row.kind !== 'run' && row.kind !== 'zoom' && used[row.kind];
              return (
                <li key={row.kind} className={cn('flex items-center gap-1.5 text-caption transition-opacity', done && 'opacity-40')}>
                  <kbd className="rounded-md border border-white/30 bg-white/10 px-1.5 font-sans text-[11px] font-bold leading-5">
                    {t(touch ? row.touch : row.keys)}
                  </kbd>
                  <span className={cn(done && 'line-through')}>{t(row.label)}</span>
                </li>
              );
            })}
          </ul>
          {open && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mx-auto mt-2 block rounded-pill bg-white/15 px-3 py-1 text-caption font-semibold transition-transform active:scale-95"
            >
              {t('guide.close')}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

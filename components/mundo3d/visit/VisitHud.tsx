'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sticker as StickerIcon } from 'lucide-react';

import { INTERACT, JOYSTICK } from '@/lib/world/config';
import { STICKER_IDS, type StickerId } from '@/lib/world/visit';
import { Joystick } from '../control/Joystick';
import type { VisitSession } from './useVisit';

/**
 * The whole of a visitor's HUD: walk, leave, go back.
 *
 * `18-DECISIONS.md` D8 makes the *absence* here the feature. There is no
 * census, no Mojón, no placement, no shop, no counter and no figure of any
 * kind — not hidden behind a check, but simply not built into this screen.
 * A visitor sees somebody's island and can put one small thing on it.
 *
 * The picker is eight buttons and no text field, which is the entire
 * moderation surface of the social layer.
 */
export function VisitHud({ visit }: { visit: VisitSession }) {
  const t = useTranslations('mundo');
  const tv = useTranslations('mundo.visit');
  const router = useRouter();
  const [picking, setPicking] = useState(false);

  const choose = (sticker: StickerId) => {
    visit.leave(sticker);
    setPicking(false);
  };

  const safeTop = { top: `max(env(safe-area-inset-top), ${JOYSTICK.safeAreaMinPx}px)` };

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="pointer-events-auto">
        <Joystick enabled={!picking} />
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        aria-label={t('exit')}
        className="pointer-events-auto absolute left-4 flex items-center justify-center rounded-full bg-brote-ink/50 text-white backdrop-blur-sm transition-transform active:scale-95"
        style={{ ...safeTop, width: INTERACT.buttonMinPx, height: INTERACT.buttonMinPx }}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </button>

      {/* Whose island this is. A display name and nothing else — no rank, no
          figures, no "since". */}
      <p
        className="absolute inset-x-0 mx-auto w-fit max-w-[70%] truncate rounded-pill bg-brote-ink/50 px-4 py-1.5 text-center text-small font-semibold text-white backdrop-blur-sm"
        style={safeTop}
      >
        {tv('title', { name: visit.displayName })}
      </p>

      {picking && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-28 mx-auto grid w-fit grid-cols-4 gap-2 rounded-3xl bg-brote-ink/70 p-3 backdrop-blur-sm">
          {STICKER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-caption font-semibold text-white transition-transform active:scale-95"
            >
              {tv(`sticker.${id}`)}
            </button>
          ))}
        </div>
      )}

      {/* One per island per day. Once it is spent the button says so rather
          than disappearing — a control that vanishes reads as a bug. */}
      <button
        type="button"
        disabled={!visit.canLeave}
        onClick={() => setPicking((open) => !open)}
        className="pointer-events-auto absolute bottom-8 right-6 flex items-center gap-2 rounded-pill bg-brote-leaf px-5 py-3 text-small font-bold text-white shadow-lg transition-transform active:scale-95 disabled:bg-brote-ink/40 disabled:text-white/60"
      >
        <StickerIcon className="h-4 w-4" aria-hidden />
        {visit.canLeave ? tv('leave') : tv('left')}
      </button>
    </div>
  );
}

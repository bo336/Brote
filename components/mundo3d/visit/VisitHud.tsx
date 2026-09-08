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
  /**
   * Two things you can leave, one button, one sheet. The island stays
   * sticker-only (`18-DECISIONS.md` D8) — a gift lands in their account, not
   * on their ground — and neither tab has anywhere to type.
   */
  const [tab, setTab] = useState<'sticker' | 'gift'>('sticker');

  const choose = (sticker: StickerId) => {
    visit.leave(sticker);
    setPicking(false);
  };

  const send = (slug: string) => {
    visit.gift(slug);
    setPicking(false);
  };

  const canOpen = visit.canLeave || visit.canGift;

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
        <div className="pointer-events-auto absolute inset-x-0 bottom-28 mx-auto w-fit max-w-[92%] rounded-3xl bg-brote-ink/70 p-3 backdrop-blur-sm">
          {visit.canGift && (
            <div className="mb-2 flex gap-1 rounded-pill bg-white/10 p-1">
              {(['sticker', 'gift'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-pill px-3 py-1 text-caption font-semibold transition-colors ${
                    tab === id ? 'bg-white/25 text-white' : 'text-white/70'
                  }`}
                >
                  {tv(`tab.${id}`)}
                </button>
              ))}
            </div>
          )}

          {tab === 'sticker' || !visit.canGift ? (
            <div className="grid grid-cols-4 gap-2">
              {STICKER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={!visit.canLeave}
                  onClick={() => choose(id)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-caption font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
                >
                  {tv(`sticker.${id}`)}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {visit.giftable.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => send(item.slug)}
                  className="rounded-2xl bg-white/10 px-4 py-2 text-left text-caption font-semibold text-white transition-transform active:scale-95"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* The one refusal worth a sentence: you can only give to somebody who
          follows you back. The rest are states the button already prevented. */}
      {visit.giftRefusal === 'not_friends' && (
        <p
          className="absolute inset-x-0 bottom-24 mx-auto w-fit max-w-[80%] rounded-pill bg-brote-ink/70 px-4 py-2 text-center text-small text-white backdrop-blur-sm"
          role="status"
        >
          {tv('notFriends')}
        </p>
      )}

      {/* One per island per day. Once it is spent the button says so rather
          than disappearing — a control that vanishes reads as a bug. */}
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => setPicking((open) => !open)}
        className="pointer-events-auto absolute bottom-8 right-6 flex items-center gap-2 rounded-pill bg-brote-leaf px-5 py-3 text-small font-bold text-white shadow-lg transition-transform active:scale-95 disabled:bg-brote-ink/40 disabled:text-white/60"
      >
        <StickerIcon className="h-4 w-4" aria-hidden />
        {canOpen ? tv('leave') : tv('left')}
      </button>
    </div>
  );
}

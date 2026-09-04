'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings2, Sprout } from 'lucide-react';

import { useEffect } from 'react';

import { INTERACT, JOYSTICK } from '@/lib/world/config';
import { ActionButton } from '../interaction/ActionButton';
import { Joystick } from '../control/Joystick';
import { usePlayerStore } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The HUD is **nearly empty**, and that is the design (`16-UI-AUDIO-A11Y.md` §1).
 *
 * Four elements during normal play and no fifth: the invisible joystick zone,
 * the action button when something is interactable, the exit affordance, and
 * the semillas counter. A game HUD covered in meters is the fastest way to make
 * this feel like an app again.
 *
 * **Not here:** XP, rank progress, streak, impact numbers, quest lists, a
 * minimap, notifications, any upsell. Those live in the app, at the Mojón, or
 * in the Bitácora.
 */
/** How long a locked-verb hint stays on screen. */
const HINT_MS = 2600;

export function HUD({ onOpenSettings }: { onOpenSettings: () => void }) {
  const t = useTranslations('mundo');
  const router = useRouter();
  const semillas = usePlayerStore((s) => s.semillas);
  const hud = useSessionStore((s) => s.hud);
  const lockedHint = useSessionStore((s) => s.lockedHint);
  const setLockedHint = useSessionStore((s) => s.setLockedHint);
  const playing = hud === 'play';

  /**
   * A soft barrier says one sentence and then gets out of the way. Never a
   * modal, never a nag, and never an invisible wall with no explanation
   * (`10-CONTROLS-AND-CAMERA.md` §2.6).
   */
  useEffect(() => {
    if (!lockedHint) return;
    const id = setTimeout(() => setLockedHint(null), HINT_MS);
    return () => clearTimeout(id);
  }, [lockedHint, setLockedHint]);

  const safeTop = { top: `max(env(safe-area-inset-top), ${JOYSTICK.safeAreaMinPx}px)` };

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* The joystick zone: invisible until a thumb lands in it. */}
      <div className="pointer-events-auto">
        <Joystick enabled={playing} />
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

      <div
        className="absolute right-4 flex items-center gap-3"
        style={safeTop}
      >
        {/* Semillas: small, and it fades back after a gain. */}
        <span className="tnum flex items-center gap-1.5 rounded-pill bg-brote-ink/40 px-3 py-1.5 text-caption font-bold text-white backdrop-blur-sm">
          <Sprout className="h-3.5 w-3.5" aria-hidden />
          {semillas}
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t('set.quality.label')}
          className="pointer-events-auto flex items-center justify-center rounded-full bg-brote-ink/50 text-white backdrop-blur-sm transition-transform active:scale-95"
          style={{ width: INTERACT.buttonMinPx, height: INTERACT.buttonMinPx }}
        >
          <Settings2 className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {lockedHint && (
        <p
          className="absolute inset-x-0 bottom-32 mx-auto w-fit rounded-pill bg-brote-ink/70 px-4 py-2 text-center text-small text-white backdrop-blur-sm"
          role="status"
        >
          {t(`locked.${lockedHint === 'swim' ? 'swim' : 'climb'}`)}
        </p>
      )}

      {playing && (
        <div className="pointer-events-auto">
          <ActionButton />
        </div>
      )}
    </div>
  );
}

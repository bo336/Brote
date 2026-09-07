'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutGrid, Settings2, Sprout } from 'lucide-react';

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
/** A description is longer than a barrier's sentence, so it stays longer. */
const NOTE_MS = 4200;

export function HUD({
  onOpenSettings,
  onArrange,
  onOpenBitacora,
}: {
  onOpenSettings: () => void;
  /** Enter placement mode. Absent before tier 2, when there is nothing to place. */
  onArrange?: () => void;
  /** Open the census. The semillas counter is the door; `Tab` is the other. */
  onOpenBitacora: () => void;
}) {
  const t = useTranslations('mundo');
  const tBitacora = useTranslations('mundo.bitacora');
  const router = useRouter();
  const semillas = usePlayerStore((s) => s.semillas);
  const hud = useSessionStore((s) => s.hud);
  const lockedHint = useSessionStore((s) => s.lockedHint);
  const setLockedHint = useSessionStore((s) => s.setLockedHint);
  const note = useSessionStore((s) => s.note);
  const noteValues = useSessionStore((s) => s.noteValues);
  const setNote = useSessionStore((s) => s.setNote);
  const placementProps = useSessionStore((s) => s.placement.props.length);
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

  /** A description clears itself too, and gets longer to read than a barrier. */
  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), NOTE_MS);
    return () => clearTimeout(id);
  }, [note, setNote]);

  /**
   * `Tab` opens the Bitácora on desktop (`16-UI-AUDIO-A11Y.md` §3). Bound only
   * while playing, so it cannot fight a sheet's own focus traversal — which is
   * the other thing `Tab` has to keep doing.
   */
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      onOpenBitacora();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, onOpenBitacora]);

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
{/* Semillas: small, and it fades back after a gain.

            **It is also how the Bitácora opens.** `16-UI-AUDIO-A11Y.md` §1
            allows four elements on screen during play and a Bitácora button is
            not one of them — but the counter already is, and tapping the thing
            that counts what you have collected to see what you have collected
            costs no fifth element and needs no explaining. `Tab` does the same
            on desktop (§3). */}
        <button
          type="button"
          onClick={onOpenBitacora}
          aria-label={tBitacora('title')}
          className="tnum pointer-events-auto flex items-center gap-1.5 rounded-pill bg-brote-ink/40 px-3 py-1.5 text-caption font-bold text-white backdrop-blur-sm transition-transform active:scale-95"
        >
          <Sprout className="h-3.5 w-3.5" aria-hidden />
          {semillas}
        </button>
        {/* Placement mode. Present only when there is something to arrange —
            a button that opens an empty tray is a promise the game breaks. */}
        {onArrange && placementProps > 0 && (
          <button
            type="button"
            onClick={onArrange}
            aria-label={t('placement.modo')}
            className="pointer-events-auto flex items-center justify-center rounded-full bg-brote-ink/50 text-white backdrop-blur-sm transition-transform active:scale-95"
            style={{ width: INTERACT.buttonMinPx, height: INTERACT.buttonMinPx }}
          >
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </button>
        )}
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

      {/* One line at a time. A soft barrier and a thing you just read share
          the slot, and the barrier wins — it is answering something you tried
          to do, which is more urgent than something you chose to read. */}
      {(lockedHint || note) && (
        <p
          className="absolute inset-x-0 bottom-32 mx-auto w-fit max-w-[80%] rounded-pill bg-brote-ink/70 px-4 py-2 text-center text-small text-white backdrop-blur-sm"
          role="status"
        >
          {lockedHint ? t(`locked.${lockedHint === 'swim' ? 'swim' : 'climb'}`) : t(note!, noteValues)}
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

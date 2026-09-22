'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronsUp, HelpCircle, Sprout } from 'lucide-react';

import { useEffect } from 'react';

import { INTERACT, JOYSTICK } from '@/lib/world/config';
import { haptic } from '@/lib/utils/haptics';
import { ActionButton } from '../interaction/ActionButton';
import { Joystick } from '../control/Joystick';
import { requestJump } from '../control/useInput';
import { usePlayerStore } from '../state/usePlayerStore';
import { record } from '@/lib/world/telemetry';
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
/** Slack so a note cleared by its own timer never counts as a skip. */
const CLEAR_SLOP_MS = 250;
/** A visitor's line is the longest thing the world says, so it stays longest. */
const CAST_MS = 9000;
/** The jump button: a thumb-sized circle, stacked above the action button's slot. */
const JUMP_BUTTON_PX = 60;
const JUMP_BUTTON_LIFT_PX = 76;

export function HUD({ onOpenBitacora }: {
  /**
   * Open the census. **The only thing this HUD opens.**
   *
   * `16-UI-AUDIO-A11Y.md` §1 permits four elements during play — joystick,
   * action button, back, semillas counter — and a settings gear and a placement
   * button used to sit here as a fifth and a sixth. Both are sheets, and §1
   * lists sheets as things you reach *through* something rather than as HUD.
   * They open from inside the Bitácora now, which the counter opens: everything
   * is one tap further away, and the HUD is four.
   */
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
  const castBeat = useSessionStore((s) => s.castBeat);
  const setCastBeat = useSessionStore((s) => s.setCastBeat);
  const setNote = useSessionStore((s) => s.setNote);
  const helpOpen = useSessionStore((s) => s.helpOpen);
  const setHelpOpen = useSessionStore((s) => s.setHelpOpen);
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

  /** The day's beat clears itself too, after long enough to read it twice. */
  useEffect(() => {
    if (!castBeat) return;
    const id = setTimeout(() => setCastBeat(null), CAST_MS);
    return () => clearTimeout(id);
  }, [castBeat, setCastBeat]);

  /**
   * A description clears itself too, and gets longer to read than a barrier.
   *
   * **A learning beat that leaves early is a skip.** `12-LEARNING.md` §2 asks
   * for `learning_beat_shown` and `learning_beat_skipped`, and this is where
   * the second one happens: the note was replaced or the player walked into
   * something else before it had been on screen long enough to read. Above a
   * 20% skip rate the instruction is to shorten the copy, not to conclude
   * anything about whether people like learning.
   */
  useEffect(() => {
    if (!note) return;
    const isLearning = note.startsWith('fact.');
    const shownAt = Date.now();
    const id = setTimeout(() => setNote(null), NOTE_MS);
    return () => {
      clearTimeout(id);
      if (isLearning && Date.now() - shownAt < NOTE_MS - CLEAR_SLOP_MS) {
        record('learning_beat_skipped');
      }
    };
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
        {/* How to play, again — the help strip hides once every control is used. */}
        <button
          type="button"
          onClick={() => setHelpOpen(!helpOpen)}
          aria-label={t('guide.open')}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-brote-ink/40 text-white backdrop-blur-sm transition-transform active:scale-95"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
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
      </div>

      {/* The day's visitor. Below the caption slot, never in it: it is the one
          thing on screen nobody asked for, so it never displaces something
          they did. */}
      {castBeat && !lockedHint && !note && (
        <p
          className="absolute inset-x-0 bottom-44 mx-auto w-fit max-w-[80%] rounded-2xl bg-brote-ink/60 px-4 py-2 text-center text-small text-brote-cream backdrop-blur-sm"
          role="status"
        >
          <span className="font-semibold">{t(castBeat.nameKey)}: </span>
          {t(castBeat.key)}
        </p>
      )}

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
          {/* The jump, for a thumb. A keyboard has Space; a fine pointer never sees this. */}
          <button
            type="button"
            aria-label={t('controls.jump')}
            onPointerDown={(e) => {
              e.stopPropagation();
              haptic('light');
              requestJump();
            }}
            className="absolute right-6 flex items-center justify-center rounded-full bg-brote-ink/45 text-white backdrop-blur-sm transition-transform active:scale-90 [@media(pointer:fine)]:hidden"
            style={{
              bottom: `calc(max(env(safe-area-inset-bottom), ${JOYSTICK.safeAreaMinPx}px) + ${JUMP_BUTTON_LIFT_PX}px)`,
              width: JUMP_BUTTON_PX,
              height: JUMP_BUTTON_PX,
            }}
          >
            <ChevronsUp className="h-6 w-6" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

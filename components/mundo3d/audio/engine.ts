'use client';

import { AUDIO_BUDGET } from '@/lib/world/audio';

/**
 * The one `AudioContext` in the application.
 *
 * `16-UI-AUDIO-A11Y.md` §2: **"one global `AudioContext`… never create a second
 * context."** iOS hands a page a small number of them and then stops handing
 * them out, so a second one is not a leak — it is silence for the rest of the
 * session, on the platform where audio is hardest to get right.
 *
 * Three things this handles that are easy to leave until a bug report:
 *
 *  - **The iOS unlock.** A context created before a gesture starts suspended.
 *    On the first `pointerdown` anywhere, resume it and play one silent sample;
 *    without that sample some iOS versions stay silent even after resuming.
 *  - **`visibilitychange`.** Suspend on background and resume on foreground, or
 *    iOS leaves the page mute after a screen lock and never says why.
 *  - **Muted by default on mobile**, on by default on desktop, and the choice
 *    is remembered. §2 again, and it is a courtesy rather than a preference:
 *    a game that starts making noise on a phone on a bus is a game people close.
 */
let ctx: AudioContext | null = null;
let unlocked = false;
let masterGain: GainNode | null = null;

const MUTED_KEY = 'brote.mundo.audio.muted';

/** Coarse, and only used to pick a default. A tablet counts as mobile here. */
function isTouchFirst(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
}

/** The remembered choice, or the platform default. */
export function startsMuted(): boolean {
  try {
    const saved = localStorage.getItem(MUTED_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    /* a private window; fall through to the default */
  }
  return isTouchFirst();
}

export function rememberMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    /* see `startsMuted` */
  }
}

/**
 * The context, created at most once.
 *
 * Returns null where there is no Web Audio at all — an old browser, or a test
 * runner. Every caller treats that as "no sound", never as an error: audio is
 * the one part of this world that is allowed to simply not be there.
 */
export function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = startsMuted() ? 0 : 1;
  masterGain.connect(ctx.destination);
  return ctx;
}

export function master(): GainNode | null {
  if (!ctx) audioContext();
  return masterGain;
}

export function setMuted(muted: boolean): void {
  rememberMuted(muted);
  const gain = master();
  if (!gain || !ctx) return;
  // A ramp rather than a jump: an instant gain change on a live loop clicks.
  gain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
}

/**
 * Wire the unlock and the visibility handling. Idempotent, and safe to call
 * from an effect that runs more than once.
 */
export function installAudioLifecycle(): () => void {
  if (typeof window === 'undefined') return () => {};

  const unlock = () => {
    if (unlocked) return;
    const context = audioContext();
    if (!context) return;
    unlocked = true;
    void context.resume();
    // One silent sample. Some iOS versions stay quiet after `resume()` alone.
    const buffer = context.createBuffer(1, 1, context.sampleRate);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
  };

  const onVisibility = () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (unlocked) void ctx.resume();
  };

  window.addEventListener('pointerdown', unlock, { once: false, passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('pointerdown', unlock);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/**
 * How many positional sources may play at once.
 *
 * Re-exported so a scene that spawns ambience does not have to reach past this
 * module for the number it is bounded by.
 */
export const MAX_POSITIONAL = AUDIO_BUDGET.maxPositionalSources;

/** Development only: lets the tests and the perf overlay see the singleton. */
export function audioDebugState(): { created: boolean; unlocked: boolean; state: string | null } {
  return { created: ctx !== null, unlocked, state: ctx?.state ?? null };
}

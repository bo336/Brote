/**
 * Opening the world on a phone without it dying (R10, second round).
 *
 * The first round fixed the silent redirect. What was left could not be seen
 * in an emulator, because an emulator does not run out of memory: a fast phone
 * started at T1, the quality monitor saw headroom and promoted it to T2 (a
 * second render pass, real shadows, 1.25× resolution) within a minute and to T3
 * (ambient occlusion, a 2048 shadow map, 1.75×) a minute later — exactly the
 * kind of jump after which iOS Safari kills the tab and reloads it. To the
 * player that is "the world does not open", over and over.
 *
 * Three rules, all decided here so they can be tested without a GPU:
 *
 *   1. **A touch device never promotes itself past T2**, and never gets the
 *      post-processing lens unless the player chose "Alta" by hand. The phone
 *      look is T1/T2; T3 is a decision the player makes, not one we make.
 *   2. **A crash leaves a mark.** Opening writes a timestamp; a clean exit (or
 *      going to the background) clears it. Finding it on the next open means
 *      the last attempt died, so this one starts light and stays there.
 *   3. **Two failures in a row go to T0**, the floor, rather than trying the
 *      same thing a third time.
 *
 * Pure: storage is passed in, so tests can run it.
 */
import type { QualityTier } from './types';

/** What a phone can reach on its own. */
export const MAX_AUTO_TIER_TOUCH: QualityTier = 2;
export const MAX_AUTO_TIER_DESKTOP: QualityTier = 3;

/** A mark older than this is not a crash, it is yesterday. */
export const CRASH_MARK_TTL_MS = 10 * 60_000;

/** Failures expire too: a phone that failed last week deserves a fresh try. */
export const FAILURES_TTL_MS = 3 * 24 * 60 * 60_000;

const KEY_OPEN = 'brote.mundo.abriendo';
const KEY_FAILS = 'brote.mundo.fallos';

export interface KeyValue {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export function maxAutoTier(coarsePointer: boolean): QualityTier {
  return coarsePointer ? MAX_AUTO_TIER_TOUCH : MAX_AUTO_TIER_DESKTOP;
}

/** The lens (EffectComposer) runs on a phone only when the player asked for "Alta". */
export function lensAllowed(coarsePointer: boolean, detailMode: 'auto' | 'high' | 'mid' | 'low'): boolean {
  return !coarsePointer || detailMode === 'high';
}

interface Fails {
  n: number;
  at: number;
}

function readFails(store: KeyValue, now: number): Fails {
  try {
    const raw = store.getItem(KEY_FAILS);
    if (!raw) return { n: 0, at: 0 };
    const f = JSON.parse(raw) as Partial<Fails>;
    const n = Number(f.n) || 0;
    const at = Number(f.at) || 0;
    if (now - at > FAILURES_TTL_MS) return { n: 0, at: 0 };
    return { n, at };
  } catch {
    return { n: 0, at: 0 };
  }
}

export interface Arranque {
  /** How many recent openings died. */
  fallos: number;
  /**
   * The tier to hold for this session, or null to let the monitor decide.
   * Set when a previous opening died: 1 after one failure, 0 after two.
   */
  liviano: QualityTier | null;
}

/**
 * Called once when the world mounts. Reads (and counts) a crash left by the
 * previous opening, then leaves this opening's own mark.
 */
export function abrir(store: KeyValue | null, now: number): Arranque {
  if (!store) return { fallos: 0, liviano: null };
  let fails = readFails(store, now);
  try {
    const mark = Number(store.getItem(KEY_OPEN));
    if (mark && now - mark < CRASH_MARK_TTL_MS) {
      fails = { n: fails.n + 1, at: now };
      store.setItem(KEY_FAILS, JSON.stringify(fails));
    }
    store.setItem(KEY_OPEN, String(now));
  } catch {
    /* no storage: nothing to remember, nothing to guard */
  }
  return { fallos: fails.n, liviano: fails.n >= 2 ? 0 : fails.n === 1 ? 1 : null };
}

/** Clean exit, or the page went to the background: not a crash. */
export function cerrarLimpio(store: KeyValue | null): void {
  try {
    store?.removeItem(KEY_OPEN);
  } catch {
    /* ignore */
  }
}

/** Back in the foreground: a crash from here on counts again. */
export function volverAlFrente(store: KeyValue | null, now: number): void {
  try {
    store?.setItem(KEY_OPEN, String(now));
  } catch {
    /* ignore */
  }
}

/** The world ran for a while without dying: forget past failures. */
export function marcarEstable(store: KeyValue | null): void {
  try {
    store?.removeItem(KEY_FAILS);
  } catch {
    /* ignore */
  }
}

/** A failure we saw happen (lost context, render error): count it now. */
export function registrarFallo(store: KeyValue | null, now: number): number {
  if (!store) return 0;
  const f = readFails(store, now);
  const next = { n: f.n + 1, at: now };
  try {
    store.setItem(KEY_FAILS, JSON.stringify(next));
    store.removeItem(KEY_OPEN);
  } catch {
    /* ignore */
  }
  return next.n;
}

/** The player asked to try the full world again. */
export function olvidarFallos(store: KeyValue | null): void {
  try {
    store?.removeItem(KEY_FAILS);
  } catch {
    /* ignore */
  }
}

/** How long the world must run before it counts as stable. */
export const STABLE_AFTER_MS = 90_000;

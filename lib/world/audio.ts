/**
 * The audio budget and its rules, as data.
 *
 * `16-UI-AUDIO-A11Y.md` §2 and `03-RESEARCH-TECH.md` §11. Kept apart from the
 * engine so the caps can be tested against whatever actually ships in
 * `public/mundo/`, rather than being asserted in a comment above a loader.
 *
 * The three that matter most, and why:
 *
 *  - **One music loop, varied by filtering.** A low-pass at night and a duck
 *    inside the cave, never a second track. Shipping more audio is the easiest
 *    way to blow a 4 MB budget and the least noticeable way to spend it.
 *  - **One `AudioContext`, ever.** iOS gives a page a small number of them and
 *    then stops; a second one is silence for the rest of the session.
 *  - **Never CC-BY-NC.** Brote monetises, so a non-commercial licence anywhere
 *    in the tree is a legal problem rather than an attribution one.
 */

export const AUDIO_BUDGET = {
  /** Bytes that may load before the world is playable. */
  initialBytes: 1_500_000,
  /** Bytes of audio in total, ever. */
  totalBytes: 4_000_000,
  /** Concurrent positional sources: river, waterfall, campfire, summit wind. */
  maxPositionalSources: 4,
  /** Seconds of music. One loop, seamless. */
  musicLoopSecondsMin: 60,
  musicLoopSecondsMax: 90,
  /** How many distinct sound effects the cue list allows. */
  sfxCount: 25,
} as const;

/**
 * Licences a file may ship under.
 *
 * **CC0 only, in practice.** CC-BY is listed because it is legally fine with
 * attribution and the credits file exists to carry it; anything with `NC` in it
 * is not on this list and never will be while the product charges money.
 */
export const ALLOWED_LICENCES = ['CC0', 'CC-BY', 'CC-BY-SA', 'Public Domain'] as const;
export type Licence = (typeof ALLOWED_LICENCES)[number];

/** A licence string is acceptable only if it is on the list and says nothing about NC. */
export function licenceAllowed(raw: string): boolean {
  const trimmed = raw.trim();
  if (/\bNC\b|non-?commercial/i.test(trimmed)) return false;
  return (ALLOWED_LICENCES as readonly string[]).includes(trimmed);
}

/** Is the world within its concurrent-source cap? */
export function withinSourceCap(active: number): boolean {
  return active <= AUDIO_BUDGET.maxPositionalSources;
}

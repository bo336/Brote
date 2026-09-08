/**
 * Counting what the learning layer actually did.
 *
 * `12-LEARNING.md` §2: **"Instrument it: log `learning_beat_shown` and
 * `learning_beat_skipped`. A skip rate above 20% on micro-facts means the copy
 * is too long, not that users dislike learning. Shorten before concluding
 * anything else."**
 *
 * That instruction is the reason this exists and the reason it is this small.
 * The number is only useful if it is read against that rule, so the rule is
 * written here next to it, and `skipRate()` is the only derived figure — there
 * is no dashboard to build and no funnel to draw.
 *
 * **Counts only, in memory, and nothing leaves the device.** Nothing here
 * identifies anybody, nothing is persisted, and nothing is sent: it answers
 * "what happened in this session" for whoever is holding the phone during a
 * play test. Shipping it anywhere is a decision with its own consent
 * questions, and it is not one this module makes quietly.
 */

export type LearningEvent =
  | 'learning_beat_shown'
  | 'learning_beat_skipped'
  | 'learning_beat_refused';

const counts = new Map<string, number>();

export function record(event: LearningEvent, reason?: string): void {
  const key = reason ? `${event}:${reason}` : event;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

export function snapshot(): Record<string, number> {
  return Object.fromEntries(counts);
}

/**
 * Shown versus skipped, 0..1, or null when nothing has been shown yet.
 *
 * **Above 0.2, shorten the copy.** That is the spec's own instruction and it is
 * the only conclusion this number licenses.
 */
export function skipRate(): number | null {
  const shown = counts.get('learning_beat_shown') ?? 0;
  const skipped = counts.get('learning_beat_skipped') ?? 0;
  const total = shown + skipped;
  return total === 0 ? null : skipped / total;
}

export function resetTelemetry(): void {
  counts.clear();
}

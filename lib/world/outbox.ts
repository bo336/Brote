/**
 * The outbox — how an arrangement survives a dropped connection.
 *
 * `20-ACCEPTANCE.md` 4E asks that placements "survive a dropped connection and
 * sync on reconnect", and that is a claim, not a feeling. It used to live
 * inside the autosave hook, tangled with React state and `localStorage`, where
 * the only way to check it was to believe it. Here it is a decision table over
 * a storage interface, so a test can drop the connection.
 *
 * **On `localStorage`.** `01-RULES.md` forbids it for authoritative state, and
 * this does not break that: the server is the authority and always wins on
 * load. What is stored here is a *write that has not landed yet*. The
 * alternative is losing it, and a queue that empties on the next successful
 * save is not a second source of truth.
 */
import type { Placement } from './types';

const OUTBOX_PREFIX = 'brote.mundo.outbox.';

export interface Outbox {
  placements: Placement[];
  /** When it was queued, in epoch ms. */
  at: number;
}

/**
 * The bit of `localStorage` this needs, as an interface.
 *
 * Not because anyone will swap the implementation, but because a test cannot
 * drop a connection against a global that may not exist — and the acceptance
 * item is specifically about what happens when things fail.
 */
export interface OutboxStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** One outbox per user: two accounts on one phone must not share a queue. */
export function outboxKey(userId: string): string {
  return OUTBOX_PREFIX + userId;
}

/**
 * What is waiting, or null.
 *
 * Every failure mode returns null rather than throwing: a private window,
 * cleared site data, storage the browser refuses to hand over, or a value some
 * other version of the app wrote. Losing the outbox is survivable. Throwing on
 * the way into the world is not.
 */
export function readOutbox(store: OutboxStore, userId: string): Outbox | null {
  try {
    const raw = store.getItem(outboxKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Outbox>;
    if (!Array.isArray(parsed.placements)) return null;
    return { placements: parsed.placements, at: typeof parsed.at === 'number' ? parsed.at : 0 };
  } catch {
    return null;
  }
}

export function writeOutbox(store: OutboxStore, userId: string, outbox: Outbox | null): void {
  try {
    if (outbox) store.setItem(outboxKey(userId), JSON.stringify(outbox));
    else store.removeItem(outboxKey(userId));
  } catch {
    /* see `readOutbox` */
  }
}

/** What a save attempt actually did. */
export type SaveOutcome =
  /** The server took it. */
  | { kind: 'saved' }
  /**
   * The server refused on its own terms — over the cap, a locked region, a prop
   * they do not own. Retrying sends the same rejected batch forever.
   */
  | { kind: 'rejected'; reason: string }
  /** The network, not the rules. This is the one worth keeping. */
  | { kind: 'offline' };

export type SaveState = 'idle' | 'saving' | 'queued' | 'error';

export interface SaveDecision {
  state: SaveState;
  /** Whether the batch stays in the outbox to be tried again. */
  keep: boolean;
  /** Why the server said no, for the caller to surface. */
  reason?: string;
}

/**
 * What to do after an attempt.
 *
 * The distinction that matters is **rejected vs offline**. Both failed, and
 * treating them the same is how a queue becomes a loop: a batch the server has
 * already refused on its own terms will be refused identically forever, so it
 * is dropped and the reason reported. Only a batch that never reached the
 * server is worth keeping.
 */
export function decide(outcome: SaveOutcome): SaveDecision {
  switch (outcome.kind) {
    case 'saved':
      return { state: 'idle', keep: false };
    case 'rejected':
      return { state: 'error', keep: false, reason: outcome.reason };
    case 'offline':
      return { state: 'queued', keep: true };
  }
}

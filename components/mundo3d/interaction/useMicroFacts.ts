'use client';

import { useCallback, useRef } from 'react';

import { mayShowFact, nextFact } from '@/lib/world/learning';
import { record } from '@/lib/world/telemetry';
import { useSessionStore } from '../state/useSessionStore';

/**
 * Micro-facts: one sentence, in world space, at most a tenth of the session.
 *
 * `12-LEARNING.md` §3.1 — "surfaced as a world-space caption near the object.
 * **Never modal. Never blocking. Dismissed by walking away.** One per
 * interaction, and the same fact is never shown twice."
 *
 * Every one of those clauses is already how the caption slot works, which is
 * why a micro-fact is not a new piece of UI: it is the same line the world uses
 * for everything else, drawn from a different pool and passed through a budget.
 *
 * The budget refusing is the normal case, not an error. A player who interacts
 * with twenty things in a minute gets two facts and eighteen descriptions, and
 * that is the design working.
 */
const FACT_POOL_SIZE = 24;
/** How long a fact occupies the slot, for the share-of-session sum. */
const FACT_MS = 4200;

export function useMicroFacts(): { offer: () => boolean } {
  const setNote = useSessionStore((s) => s.setNote);

  const seen = useRef(new Set<string>());
  const startedAt = useRef(Date.now());
  const learningMs = useRef(0);
  const lastWasLearning = useRef(false);

  /**
   * Offer a fact. Returns whether one was shown, so the caller can fall back to
   * whatever it would otherwise have said.
   */
  const offer = useCallback(() => {
    const state = {
      sessionMs: Date.now() - startedAt.current,
      learningMs: learningMs.current,
      lastWasLearning: lastWasLearning.current,
      reviewsToday: 0,
    };
    const refusal = mayShowFact(state, FACT_MS);
    if (refusal) {
      record('learning_beat_refused', refusal);
      // A refusal is not a skip: nobody was shown anything to skip.
      lastWasLearning.current = false;
      return false;
    }

    const pool = Array.from({ length: FACT_POOL_SIZE }, (_, i) => `fact.${i}`);
    const key = nextFact(pool, seen.current);
    if (!key) return false;

    seen.current.add(key);
    learningMs.current += FACT_MS;
    lastWasLearning.current = true;
    record('learning_beat_shown');
    setNote(key);
    return true;
  }, [setNote]);

  return { offer };
}

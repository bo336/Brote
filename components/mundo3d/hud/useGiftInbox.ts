'use client';

import { useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { parseArrivedGifts } from '@/lib/world/gift';
import { useSessionStore } from '../state/useSessionStore';

/**
 * A gift that arrived while you were away, said once.
 *
 * **The world sends no notifications** (`04-RESEARCH-DESIGN.md` §9.9), so there
 * is no push, no badge and no red dot. But a gift nobody ever sees is not a
 * gift, so it is told the way the island tells you anything else: one line, in
 * the caption slot, on the way in. The read marks it seen in the same round
 * trip, which is why it can never nag — there is no second chance to show it,
 * and that is the correct trade against a notification that follows you.
 *
 * More than one waiting collapses into a count. Somebody who was away a month
 * gets a sentence, not a queue.
 */
export function useGiftInbox(readOnly: boolean): void {
  const setNote = useSessionStore((s) => s.setNote);
  const setNoteValues = useSessionStore((s) => s.setNoteValues);

  useEffect(() => {
    if (readOnly) return;
    let alive = true;
    void createClient()
      .rpc('world_gifts_unseen')
      .then(({ data, error }) => {
        if (!alive || error) return;
        const gifts = parseArrivedGifts(data);
        const first = gifts[0];
        if (!first) return;
        setNoteValues(
          gifts.length === 1
            ? { name: first.name, from: first.from }
            : { count: String(gifts.length) },
        );
        setNote(gifts.length === 1 ? 'gift.one' : 'gift.many');
      });
    return () => {
      alive = false;
    };
  }, [readOnly, setNote, setNoteValues]);
}

'use client';

import { useEffect } from 'react';

import type { WorldPayload } from '@/lib/world/types';
import { flushGame, useGameStore } from './useGameStore';

/**
 * The game (`lib/world/game`) for one visit to `/mundo`: its save from the
 * server when there is one, this device's copy otherwise — never written from
 * a visit, never sent to the server when the island is not theirs to write
 * (`frozen`) — and whatever is pending sent on the way out.
 */
export function useGameSession({
  who, tier, payload, frozen, visit,
}: {
  who: string;
  tier: number;
  payload?: WorldPayload;
  frozen: boolean;
  visit: boolean;
}): void {
  // `?div=` only where nothing is saved to a server (the account-less preview).
  const division = (frozen ? previewDivision() : null) ?? payload?.division ?? 1;
  const gameSave = payload?.game ?? null;
  useEffect(() => {
    const reset = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === '1';
    useGameStore.getState().init({
      base: { who, tier, div: division },
      server: gameSave,
      readOnly: frozen || !payload,
      persist: !visit,
      reset,
    });
  }, [who, tier, division, gameSave, frozen, payload, visit]);

  // Leaving sends what is pending: a tab switch, a closed tab, a phone locking.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushGame();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      void flushGame();
    };
  }, []);
}

/** The account-less preview asks for a division with `?div=`. */
function previewDivision(): number | null {
  if (typeof window === 'undefined') return null;
  const n = Number(new URLSearchParams(window.location.search).get('div'));
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

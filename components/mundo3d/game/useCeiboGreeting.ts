'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { ceiboShape } from '@/lib/world/game/ceibo';
import { gameSpots } from '@/lib/world/game/spots';
import { emitFx } from '../state/feedback';
import { useWorldStore } from '../state/useWorldStore';
import { useFeedback } from './useGameFeedback';
import { useGameStore } from './useGameStore';

/** Per player: the action count the ceibo last showed them. */
const KEY = 'brote.mundo.ceibo.v1:';
const PETAL_BURSTS = 4;
const BURST_GAP_MS = 380;
const DELAY_MS = 1800;

/**
 * Coming back after doing real things: petals fall out of the ceibo and one
 * line says how many actions flowered since last time. Three seconds, no
 * stopping, and only when there is something new — the first visit gets the
 * one sentence that explains what the flowers are.
 */
export function useCeiboGreeting(): void {
  const t = useTranslations('mundo.juego.ceibo');
  const actions = useWorldStore((s) => s.impact.actions ?? 0);
  const layout = useWorldStore((s) => s.layout);
  const who = useGameStore((s) => s.base?.who ?? null);
  const readOnly = useGameStore((s) => s.readOnly && s.base?.who !== 'demo');

  useEffect(() => {
    if (!who || !layout || readOnly) return;
    let seen: number | null = null;
    try {
      const raw = window.localStorage.getItem(KEY + who);
      seen = raw === null ? null : Number(raw);
    } catch {
      // Private mode: every visit is a first one, which is harmless.
    }
    const remember = () => {
      try {
        window.localStorage.setItem(KEY + who, String(actions));
      } catch {
        // Same.
      }
    };
    const fresh = seen === null ? null : actions - seen;
    if (fresh !== null && fresh <= 0) {
      remember();
      return;
    }
    const spot = gameSpots(who, layout).ceibo;
    // Out of the top of the crown, whatever size it has reached.
    const top = 0.4 + 3 * ceiboShape(useWorldStore.getState().impact).scale;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Remembered when shown, not when scheduled: a remount in between must not eat it.
    timers.push(setTimeout(() => {
      remember();
      useFeedback.getState().say(fresh === null ? t('primera') : t('nuevas', { n: fresh }));
      for (let i = 0; i < PETAL_BURSTS; i++) {
        timers.push(setTimeout(() => emitFx('petals', spot.x + (i % 2 ? 0.6 : -0.5), top, spot.z + (i > 1 ? 0.5 : -0.4)), i * BURST_GAP_MS));
      }
    }, DELAY_MS));
    return () => timers.forEach(clearTimeout);
    // Once per entry: the count does not change while the player is inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, layout, readOnly]);
}

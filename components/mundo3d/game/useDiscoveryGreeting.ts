'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { discoveriesAt, type Discovery } from '@/lib/world/game/discoveries';
import { useFeedback } from './useGameFeedback';
import { useGameStore } from './useGameStore';

/** After the arrival line and the ceibo's petals have had their moment. */
const DELAY_MS = 5200;

/**
 * The real axis, between rank-ups. A rank-up has its ceremony and its
 * "Descubriste" card; a new **division** (a fifth of a rank, weeks apart) was
 * silent — and it is what makes the app's side show up in the game every ten
 * days or so. On entry, if the division moved since the last visit, one toast
 * names what it revealed. Then the save remembers what was seen.
 */
export function useDiscoveryGreeting(): void {
  const t = useTranslations('mundo.juego.toast');
  const ready = useGameStore((s) => !!s.state && !!s.base);

  useEffect(() => {
    if (!ready) return;
    const store = useGameStore.getState();
    const s = store.state;
    const ctx = store.ctx();
    if (!s || !ctx) return;
    // Someone else's island: nothing of theirs is ours to mark as seen.
    if (store.readOnly && store.base?.who !== 'demo') return;
    const seen = s.seen;
    if (seen.tier === ctx.tier && seen.div === ctx.div) return;
    const items: Discovery[] = [];
    // A new rank has its own ceremony, which shows its list; a first visit has nothing to compare.
    if (seen.tier > 0 && seen.tier === ctx.tier && ctx.div > seen.div) {
      for (let d = seen.div + 1; d <= ctx.div; d++) items.push(...discoveriesAt(ctx.tier, d));
    }
    const id = setTimeout(() => {
      useGameStore.getState().dispatch({ t: 'seen', tier: ctx.tier, div: ctx.div });
      if (items.length > 0) {
        useFeedback.getState().push({
          tone: 'discover',
          title: t('division'),
          body: items.map((d) => d.name).join(' · '),
        });
      }
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, [ready, t]);
}

'use client';

import { useEffect } from 'react';

import { haptic } from '@/lib/utils/haptics';
import type { VerbRuntime } from '../verbs/runtime';
import { useSessionStore } from '../state/useSessionStore';
import { getInteractable } from './InteractableRegistry';

/**
 * One door for "use the thing in front of me", whichever hand pressed it.
 *
 * The keyboard, the action button and a tap all end here, so they cannot drift
 * apart again. A verb already in flight owns the press — the fishing tug is
 * caught with it, and a hold is let go — and a press with nothing in reach says
 * so instead of doing nothing, which is what read as "E does not work".
 */
export function useInteractBridge(runtime: VerbRuntime): void {
  const setInteract = useSessionStore((s) => s.setInteract);
  useEffect(() => {
    setInteract(() => {
      if (runtime.busy) {
        runtime.release();
        return;
      }
      const store = useSessionStore.getState();
      const target = store.active ? getInteractable(store.active.id) : undefined;
      if (!target) {
        store.setNote('controls.nothingNear');
        return;
      }
      haptic('medium');
      target.onInteract();
    });
    return () => setInteract(null);
  }, [runtime, setInteract]);
}

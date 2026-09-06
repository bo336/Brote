'use client';

import { useCallback, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * Marking a ceremony as shown.
 *
 * `user_world.celebrated_tier` is what stops a tier-up playing twice — and §5 is
 * explicit that it must not ("never force it twice"). The write is `greatest()`
 * server-side, so it is idempotent and a retry can never walk the marker
 * backwards.
 *
 * **The ceremony does not wait for it.** The sequence has already played by the
 * time this is called; blocking the return of control on a round trip would
 * mean a player on a bad connection stands frozen in their own island. A failed
 * write costs one replayed ceremony on the next visit, which is a far smaller
 * harm than a locked world — so it is retried once and then let go.
 */
export function useCelebrate({
  readOnly,
  worldIndex,
}: {
  /** The bootstrap failed and the world on screen is a default. Never write. */
  readOnly: boolean;
  worldIndex: number;
}): (tier: number) => void {
  /** The highest tier already sent, so a re-render cannot resend it. */
  const sent = useRef(0);

  return useCallback(
    (tier: number) => {
      if (readOnly || tier <= sent.current) return;
      sent.current = tier;
      const send = async (): Promise<boolean> => {
        const supabase = createClient();
        const { error } = await supabase.rpc('world_mark_celebrated', {
          p_tier: tier,
          p_world: worldIndex,
        });
        return !error;
      };
      void send().then((ok) => {
        if (!ok) void send();
      });
    },
    [readOnly, worldIndex],
  );
}

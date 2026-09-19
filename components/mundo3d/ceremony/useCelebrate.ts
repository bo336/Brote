'use client';

import { useCallback, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { CeremonyScript } from '@/lib/world/ceremony';

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
}: {
  /** The bootstrap failed and the world on screen is a default. Never write. */
  readOnly: boolean;
}): (script: CeremonyScript) => void {
  /** The highest of each already sent, so a re-render cannot resend it. */
  const sent = useRef({ tier: 0, world: 0 });

  return useCallback(
    (script: CeremonyScript) => {
      if (readOnly) return;
      const key = script.kind === 'world' ? 'world' : 'tier';
      if (script.tier <= sent.current[key]) return;
      sent.current[key] = script.tier;

      // **Only the one that played.** The RPC takes both and applies
      // `greatest()` to each, so passing the current world index alongside a
      // rank-up would silently mark a world completion as already celebrated
      // and the player would never see it.
      const send = async (): Promise<boolean> => {
        const supabase = createClient();
        const { error } = await supabase.rpc('world_mark_celebrated', {
          p_tier: script.kind === 'tier' ? script.tier : 0,
          p_world: script.kind === 'world' ? script.tier : 0,
        });
        return !error;
      };
      void send().then((ok) => {
        if (!ok) void send();
      });
    },
    [readOnly],
  );
}

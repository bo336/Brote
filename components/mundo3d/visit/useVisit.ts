'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { mayLeaveSticker, stickerSpot, type StickerId, type Sticker, type VisitPayload } from '@/lib/world/visit';
import { regionAt } from '@/lib/world/layout';
import type { IslandLayout } from '@/lib/world/layout';
import type { PipCosmetics } from '@/lib/world/types';
import { playerTransform } from '../state/usePlayerStore';

/**
 * What a visit is, from the HUD's side.
 *
 * Deliberately four nouns and one verb. Everything a visitor could otherwise
 * reach — the census, El Mojón, placement, the chores, the shop — is simply
 * not in this object, which is a stronger guarantee than a flag on each of
 * them: there is nothing to forget to check.
 */
export interface VisitSession {
  username: string;
  displayName: string;
  hostPip: PipCosmetics;
  hostTier: number;
  stickers: readonly Sticker[];
  /** False once today's one sticker has been left here. */
  canLeave: boolean;
  leave: (sticker: StickerId) => void;
}

/**
 * The one write a visitor is allowed.
 *
 * Optimistic, because the sticker is the whole point of the tap and a round
 * trip is a beat too long for it to feel like putting something down. If the
 * server disagrees — already left one today, or the host is no longer visible
 * — the token is taken back off the island and the picker closes; there is
 * nothing here for a player to fix, so there is nothing to tell them.
 */
export function useVisit(initial: VisitPayload, layout: IslandLayout | null): VisitSession {
  const [stickers, setStickers] = useState<readonly Sticker[]>(initial.stickers);
  const [leftToday, setLeftToday] = useState(initial.leftToday);

  const leave = useCallback(
    (sticker: StickerId) => {
      if (!layout || !mayLeaveSticker(leftToday)) return;
      const [x, z] = stickerSpot(playerTransform.x, playerTransform.z, playerTransform.yaw);
      const region = regionAt(x, z, layout.regions);
      const optimistic: Sticker = { byMe: true, sticker, region, x, z };
      setStickers((list) => [...list, optimistic]);
      setLeftToday((n) => n + 1);

      void createClient()
        .rpc('world_leave_sticker', {
          p_username: initial.username, p_sticker: sticker, p_region: region, p_x: x, p_z: z,
        })
        .then(({ data, error }) => {
          const ok = !error && (data as { ok?: boolean } | null)?.ok === true;
          if (ok) return;
          setStickers((list) => list.filter((s) => s !== optimistic));
        });
    },
    [initial.username, layout, leftToday],
  );

  return {
    username: initial.username,
    displayName: initial.displayName,
    hostPip: initial.pip,
    hostTier: initial.tier,
    stickers,
    canLeave: mayLeaveSticker(leftToday),
    leave,
  };
}

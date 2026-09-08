'use client';

import { useCallback, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { maySendGift, parseGiftOptions, refusalOf, type Giftable, type GiftRefusal } from '@/lib/world/gift';
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
  /**
   * Regalar (`11-GAME-LOOP.md` §8): one item a day, from your own set, to
   * somebody who follows you back.
   *
   * `giftable` is what **you own and they do not**, worked out on the server.
   * The visitor never receives the other person's inventory — only the part of
   * their own that would not be wasted.
   */
  giftable: readonly Giftable[];
  canGift: boolean;
  giftRefusal: GiftRefusal | null;
  gift: (slug: string) => void;
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
export function useVisit(
  initial: VisitPayload,
  layout: IslandLayout | null,
  gifts: unknown = null,
): VisitSession {
  const [stickers, setStickers] = useState<readonly Sticker[]>(initial.stickers);
  const [leftToday, setLeftToday] = useState(initial.leftToday);
  const options = useMemo(() => parseGiftOptions(gifts), [gifts]);
  const [giftable, setGiftable] = useState<readonly Giftable[]>(options.slugs);
  const [sentToday, setSentToday] = useState(options.sentToday);
  const [giftRefusal, setGiftRefusal] = useState<GiftRefusal | null>(null);

  /**
   * Not optimistic, unlike a sticker.
   *
   * A sticker is yours to place and the island is right there; a gift lands in
   * somebody else's account and can be refused for a reason the client cannot
   * see (they stopped following back between the page loading and the tap).
   * Showing "sent" and then quietly un-sending it would be worse than a beat
   * of waiting.
   */
  const gift = useCallback(
    (slug: string) => {
      if (!maySendGift(sentToday)) return;
      setGiftRefusal(null);
      void createClient()
        .rpc('world_send_gift', { p_username: initial.username, p_slug: slug })
        .then(({ data, error }) => {
          const refusal = refusalOf(data, error);
          setGiftRefusal(refusal);
          if (refusal) return;
          setSentToday((n) => n + 1);
          setGiftable((list) => list.filter((g) => g.slug !== slug));
        });
    },
    [initial.username, sentToday],
  );

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
    giftable,
    canGift: maySendGift(sentToday) && giftable.length > 0,
    giftRefusal,
    gift,
  };
}

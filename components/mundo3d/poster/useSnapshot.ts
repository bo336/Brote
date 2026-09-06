'use client';

import { useCallback, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';
import { SNAPSHOT } from '@/lib/world/config';

/**
 * The poster: one picture of this island, taken on the way out.
 *
 * Every other screen in the app shows `<MundoPoster/>` rather than a second
 * WebGL context (`07-RENDER-ARCHITECTURE.md` §1), and until this exists that
 * card is a generated SVG of an island nobody owns. This is what makes it
 * **theirs** — the feed card, both profiles and onboarding all start showing
 * the actual world the player last stood in.
 *
 * Three things it must not do, all of them from `15-DATA-MODEL.md` §6:
 *
 *  1. **Never block leaving.** The capture and the upload happen after the
 *     player has already asked to go; a poster is not worth one frozen tap.
 *  2. **Never fail loudly.** If Storage is unavailable the card falls back to
 *     the SVG, forever, and the game is unchanged. There is nothing here for a
 *     player to fix, so there is nothing to tell them.
 *  3. **Never write when the world is not theirs.** `readOnly` means the
 *     bootstrap failed and the island on screen is a default; publishing a
 *     picture of it as somebody's own island would be a lie with a URL.
 */
export function useSnapshot({
  userId,
  readOnly,
}: {
  userId: string;
  readOnly: boolean;
}): (canvas: HTMLCanvasElement | null) => void {
  /** How many this visit has uploaded. A poster is a souvenir, not a stream. */
  const taken = useRef(0);

  return useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || readOnly || taken.current >= SNAPSHOT.maxPerVisit) return;
      taken.current += 1;

      // Read the buffer **synchronously**, in the same tick the caller was
      // handed a freshly drawn frame. There is no `preserveDrawingBuffer`, so
      // waiting even one microtask leaves nothing to read
      // (`07-RENDER-ARCHITECTURE.md` §5).
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', SNAPSHOT.quality);
      } catch {
        return;
      }

      void upload(userId, dataUrl);
    },
    [userId, readOnly],
  );
}

/**
 * The path is `<user_id>/poster.png` and it is overwritten every visit, which
 * is why the RPC checks the prefix: without it anyone could point their poster
 * at somebody else's file.
 */
async function upload(userId: string, dataUrl: string): Promise<void> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const supabase = createClient();
    const path = `${userId}/poster.png`;
    const { error } = await supabase.storage
      .from(SNAPSHOT.bucket)
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' });
    if (error) return;

    const { data } = supabase.storage.from(SNAPSHOT.bucket).getPublicUrl(path);
    if (!data?.publicUrl) return;
    // A cache-buster, because the path never changes and the browser would
    // otherwise show last week's island for as long as it kept the file.
    await supabase.rpc('world_set_snapshot', { p_url: `${data.publicUrl}?v=${Date.now()}` });
  } catch {
    // Storage is optional, by design. See the note at the top.
  }
}

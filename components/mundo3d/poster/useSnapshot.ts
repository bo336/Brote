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
/** A band of the canvas, in drawing-buffer pixels, when the poster was drawn into one. */
export interface PosterCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useSnapshot({
  userId,
  readOnly,
}: {
  userId: string;
  readOnly: boolean;
}): (canvas: HTMLCanvasElement | null, crop?: PosterCrop) => boolean {
  /** How many this visit has uploaded. A poster is a souvenir, not a stream. */
  const taken = useRef(0);

  return useCallback(
    (canvas: HTMLCanvasElement | null, crop?: PosterCrop) => {
      // Nothing to take is not a blank frame: report success so nobody retries.
      if (!canvas || taken.current >= SNAPSHOT.maxPerVisit) return true;
      // A world that is not theirs is never published. A test harness may still
      // ask to see the frame (`window.__posterSink`), which is how the black
      // posters were caught and how their fix is checked.
      const sink = readOnly ? (window as { __posterSink?: string[] }).__posterSink : undefined;
      if (readOnly && !sink) return true;

      // Read the buffer **synchronously**, in the same tick the caller drew a
      // frame into it. There is no `preserveDrawingBuffer`, so waiting even one
      // microtask leaves nothing to read (`07-RENDER-ARCHITECTURE.md` §5).
      let dataUrl: string;
      try {
        const source = crop ? cut(canvas, crop) : canvas;
        if (looksBlank(source)) return false;
        dataUrl = source.toDataURL('image/jpeg', SNAPSHOT.quality);
      } catch {
        return true;
      }

      taken.current += 1;
      if (sink) sink.push(dataUrl);
      else void upload(userId, dataUrl);
      return true;
    },
    [userId, readOnly],
  );
}

/** The band the poster was drawn into, as its own canvas. */
function cut(canvas: HTMLCanvasElement, crop: PosterCrop): HTMLCanvasElement {
  const band = document.createElement('canvas');
  band.width = crop.w;
  band.height = crop.h;
  band.getContext('2d')?.drawImage(canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  return band;
}

/**
 * Is this frame a picture of anything? Every poster was once black, read from a
 * cleared buffer, and a black card is worse than the drawn fallback. A 16×16
 * copy is enough to know, and costs nothing next to the JPEG encode.
 */
function looksBlank(canvas: HTMLCanvasElement): boolean {
  const probe = document.createElement('canvas');
  probe.width = 16;
  probe.height = 16;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(canvas, 0, 0, 16, 16);
  const px = ctx.getImageData(0, 0, 16, 16).data;
  let luma = 0;
  for (let i = 0; i < px.length; i += 4) luma += px[i]! * 0.2126 + px[i + 1]! * 0.7152 + px[i + 2]! * 0.0722;
  return luma / 256 < SNAPSHOT.minLuma;
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

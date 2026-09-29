'use client';

import { useCallback, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';
import { SNAPSHOT } from '@/lib/world/config';

/**
 * The poster: one picture of this island, taken while playing.
 *
 * Every other screen in the app shows `<MundoPoster/>` rather than a second
 * WebGL context (`07-RENDER-ARCHITECTURE.md` §1). This is what makes that card
 * **theirs** — the feed card and the profile show the world the player last
 * stood in.
 *
 * Three things it must not do:
 *
 *  1. **Never block play.** The copy is synchronous (it has to be: the buffer
 *     is gone a microtask later) but small; the upload is fire-and-forget.
 *  2. **Never fail loudly.** If Storage is unavailable the card keeps showing
 *     what it showed before. There is nothing here for a player to fix.
 *  3. **Never write when the world is not theirs.** `readOnly` means the
 *     bootstrap failed, or it is a visit, or it is the account-less preview.
 *
 * And the one it now also refuses: **never upload a blank frame.** The owner's
 * saved poster was pure black for a week, and the card showed it.
 */
export interface PosterFrameInput {
  canvas: HTMLCanvasElement;
  crop: { x: number; y: number; w: number; h: number };
}

export function useSnapshot({
  userId,
  readOnly,
}: {
  userId: string;
  readOnly: boolean;
}): (frame: PosterFrameInput) => boolean {
  /** How many this visit has uploaded. A poster is a souvenir, not a stream. */
  const taken = useRef(0);

  return useCallback(
    (frame: PosterFrameInput) => {
      if (taken.current >= SNAPSHOT.maxPerVisit) return true;
      const dataUrl = copyBand(frame);
      if (!dataUrl) return false;
      taken.current += 1;
      // The account-less preview has nowhere to upload to; it hands the picture
      // to whoever is reviewing it instead, so the capture can be checked.
      const sink = (window as unknown as { __posterSink?: (u: string) => void }).__posterSink;
      if (sink) sink(dataUrl);
      if (!readOnly) void upload(userId, dataUrl);
      return true;
    },
    [userId, readOnly],
  );
}

/**
 * Copy the band out of the WebGL canvas **now**, scale it to the poster size,
 * and check it is a picture. Returns null for a blank frame.
 */
function copyBand({ canvas, crop }: PosterFrameInput): string | null {
  try {
    const w = SNAPSHOT.width;
    const h = Math.round(w / SNAPSHOT.aspect);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (!ctx || crop.w <= 0 || crop.h <= 0) return null;
    // The WebGL canvas may carry alpha; JPEG has none, and would turn every
    // translucent pixel toward black. Paint an opaque ground first.
    ctx.fillStyle = '#9fb7c8';
    ctx.fillRect(0, 0, w, h);
    // Fill the poster: scale the band to cover, centred.
    const scale = Math.max(w / crop.w, h / crop.h);
    const sw = w / scale;
    const sh = h / scale;
    const sx = crop.x + (crop.w - sw) / 2;
    const sy = crop.y + (crop.h - sh) / 2;
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, w, h);
    if (!looksLikeAPicture(ctx, w, h)) return null;
    return out.toDataURL('image/jpeg', SNAPSHOT.quality);
  } catch {
    return null;
  }
}

/** Mean brightness and spread on a coarse grid: a cleared buffer is flat and dark. */
function looksLikeAPicture(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const probe = document.createElement('canvas');
  probe.width = 32;
  probe.height = 16;
  const p = probe.getContext('2d');
  if (!p) return false;
  p.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, 32, 16);
  const d = p.getImageData(0, 0, 32, 16).data;
  let sum = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i]! + d[i + 1]! + d[i + 2]!) / 3;
    sum += l;
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const mean = sum / (d.length / 4);
  return mean >= SNAPSHOT.minMean && max - min >= SNAPSHOT.minSpread;
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

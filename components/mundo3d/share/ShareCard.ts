/**
 * The share-card composer, ported from the old `Mundo.tsx`'s `shareWorld`.
 *
 * It worked and it is worth keeping (`02-AUDIT.md` §8). What changed: it is a
 * pure function of `(canvas, meta)` rather than a closure over component state,
 * it returns the `Blob` instead of deciding what to do with it, and it can
 * compose the 1:1 variant the tier-up ceremony needs alongside the 9:16 one.
 *
 * **No `preserveDrawingBuffer`.** The caller renders one extra frame on demand
 * and reads it in the same tick (`07-RENDER-ARCHITECTURE.md` §5).
 */
import { SHARE_CARD } from '@/lib/world/config';
import { BRAND, CLAY } from '@/lib/render/palette';

export interface ShareMeta {
  worldIndex: number;
  biomeName: string;
  growth: number;
  goal: number;
  streakDays?: number;
  /** One line, already translated, e.g. the ceremony's `medido` figure. */
  line?: string;
  /** The shareable URL printed on the card. */
  siteLabel: string;
}

export type ShareFormat = 'portrait' | 'square';

const FONT_STACK = 'system-ui, sans-serif';

/**
 * Compose the card. `canvas` is the live WebGL canvas, already holding the frame
 * to publish — this function never triggers a render of its own.
 */
export function composeShareCard(
  canvas: HTMLCanvasElement,
  meta: ShareMeta,
  format: ShareFormat = 'portrait',
): Promise<Blob | null> {
  const W = format === 'square' ? SHARE_CARD.squareSize : SHARE_CARD.width;
  const H = format === 'square' ? SHARE_CARD.squareSize : SHARE_CARD.height;

  const card = document.createElement('canvas');
  card.width = W;
  card.height = H;
  const ctx = card.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  // The world shot, cover-fitted into the top of the card.
  const shotH = Math.round(H * SHARE_CARD.shotHeightPct);
  const scale = Math.max(W / canvas.width, shotH / canvas.height);
  const dw = canvas.width * scale;
  const dh = canvas.height * scale;
  ctx.fillStyle = BRAND.ink;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(canvas, (W - dw) / 2, (shotH - dh) / 2, dw, dh);

  // The brand band, faded up out of the shot so nothing is cut off hard.
  const fade = SHARE_CARD.bandFadeStartPx;
  const grad = ctx.createLinearGradient(0, shotH - fade, 0, H);
  grad.addColorStop(0, 'rgba(12,26,19,0)');
  grad.addColorStop(0.35, 'rgba(12,26,19,0.96)');
  grad.addColorStop(1, BRAND.ink);
  ctx.fillStyle = grad;
  ctx.fillRect(0, shotH - fade, W, H - shotH + fade);

  const pad = Math.round(W * 0.059);
  ctx.fillStyle = BRAND.cream;
  ctx.font = `bold ${Math.round(W * 0.059)}px ${FONT_STACK}`;
  ctx.fillText(`Mundo ${meta.worldIndex} · ${meta.biomeName}`, pad, shotH + Math.round(H * 0.044));

  ctx.fillStyle = CLAY.sand;
  ctx.font = `${Math.round(W * 0.041)}px ${FONT_STACK}`;
  const growth = `${meta.growth}/${meta.goal}`;
  const streak = meta.streakDays ? ` · ${meta.streakDays} días` : '';
  ctx.fillText(growth + streak, pad, shotH + Math.round(H * 0.096));

  if (meta.line) {
    ctx.fillStyle = CLAY.sand;
    ctx.font = `${Math.round(W * 0.034)}px ${FONT_STACK}`;
    ctx.fillText(meta.line, pad, shotH + Math.round(H * 0.142));
  }

  ctx.fillStyle = BRAND.green;
  ctx.font = `bold ${Math.round(W * 0.044)}px ${FONT_STACK}`;
  ctx.fillText('Brote', pad, H - Math.round(H * 0.053));
  ctx.fillStyle = CLAY.sand;
  ctx.font = `${Math.round(W * 0.033)}px ${FONT_STACK}`;
  ctx.fillText(meta.siteLabel, pad, H - Math.round(H * 0.018));

  return new Promise((resolve) => card.toBlob(resolve, 'image/png'));
}

/**
 * Hand the card to the OS share sheet, falling back to a download. Kept next to
 * the composer because they were one function before and the fallback is the
 * part everyone forgets.
 */
export async function shareCard(blob: Blob, fileName = 'mi-isla-brote.png'): Promise<boolean> {
  const file = new File([blob], fileName, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return true;
    }
  } catch {
    // The user cancelled the sheet. That is not a failure worth reporting.
    return false;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

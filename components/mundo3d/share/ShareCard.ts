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
  /** Already-translated captions for the tier-up card's two shots. */
  beforeLabel?: string;
  afterLabel?: string;
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
  ctx.fillStyle = BRAND.ink;
  ctx.fillRect(0, 0, W, H);
  drawCover(ctx, canvas, 0, 0, W, shotH);
  paintBand(ctx, meta, W, H, shotH);

  return new Promise((resolve) => card.toBlob(resolve, 'image/png'));
}

/**
 * The brand band under the shot: world, growth, the ceremony's line, the mark.
 *
 * Shared by both cards so the two can never drift into looking like they came
 * from different products.
 */
function paintBand(
  ctx: CanvasRenderingContext2D,
  meta: ShareMeta,
  W: number,
  H: number,
  shotH: number,
): void {
  // Faded up out of the shot so nothing is cut off hard.
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

/**
 * The tier-up card: the same island, before and after.
 *
 * `08-WORLD-AND-PROGRESSION.md` §5 beat 6 asks for an auto-composed before/after
 * in 9:16 and 1:1, one tap to share, **no upsell and no interstitial**. The two
 * shots are stacked inside the same shot area the single-shot card uses, from
 * the same framed camera position, so the only thing that changes between them
 * is the world.
 *
 * `before` is a data URL taken during beat 2. When it is missing — a tainted
 * canvas, a ceremony resumed after a reload — this degrades to the ordinary
 * card rather than failing: a card of the finished island is still worth having.
 */
export async function composeTierUpCard(
  canvas: HTMLCanvasElement,
  before: string | null,
  meta: ShareMeta,
  format: ShareFormat = 'portrait',
): Promise<Blob | null> {
  if (!before) return composeShareCard(canvas, meta, format);

  const shot = await loadImage(before);
  if (!shot) return composeShareCard(canvas, meta, format);

  const W = format === 'square' ? SHARE_CARD.squareSize : SHARE_CARD.width;
  const H = format === 'square' ? SHARE_CARD.squareSize : SHARE_CARD.height;
  const card = document.createElement('canvas');
  card.width = W;
  card.height = H;
  const ctx = card.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = BRAND.ink;
  ctx.fillRect(0, 0, W, H);

  const shotH = Math.round(H * SHARE_CARD.shotHeightPct);
  const half = Math.floor(shotH / 2);
  drawCover(ctx, shot, 0, 0, W, half);
  drawCover(ctx, canvas, 0, half, W, shotH - half);

  // A hairline between them, so the join is a decision rather than an artefact.
  ctx.fillStyle = BRAND.ink;
  ctx.fillRect(0, half - 1, W, 2);

  const label = Math.round(W * 0.030);
  ctx.font = `bold ${label}px ${FONT_STACK}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(meta.beforeLabel ?? '', Math.round(W * 0.035), Math.round(W * 0.035) + label);
  ctx.fillText(meta.afterLabel ?? '', Math.round(W * 0.035), half + Math.round(W * 0.035) + label);

  paintBand(ctx, meta, W, H, shotH);
  return new Promise((resolve) => card.toBlob(resolve, 'image/png'));
}

/** Cover-fit a source into a box, cropping the overflow rather than squashing. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / src.width, h / src.height);
  const dw = src.width * scale;
  const dh = src.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

'use client';

import { forwardRef, useCallback, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { ImageOff, Leaf, type LucideIcon } from 'lucide-react';
import { imagenSegura } from '@/lib/imagen-segura';
import { cn } from '@/lib/utils/cn';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined;
  /**
   * What to show instead of the browser's broken-image icon.
   * - a node: rendered in place of the `<img>` (keep the same box).
   * - `null`: render nothing at all — for images that are decoration on a card
   *   that already says everything in text.
   * Defaults to `<ImagenFallback>` filling the same classes.
   */
  fallback?: ReactNode | null;
};

/**
 * An `<img>` that never shows a broken picture.
 *
 * Three things go wrong with pictures from outside (RSS feeds, old uploads):
 * the URL is not an image at all (a video player, an emoji sprite), the host
 * refuses it, or the file was deleted. The first is caught before any request
 * by `imagenSegura`; the other two by `onError`. `onError` alone is not enough
 * with server rendering: when the request fails before React hydrates, the
 * event has already fired and nobody heard it — so on mount the element is
 * checked too (`complete` with no pixels means it failed). A 1×1 tracking
 * pixel counts as missing.
 */
export const SafeImage = forwardRef<HTMLImageElement, Props>(function SafeImage(
  { src, fallback, className, style, onError, onLoad, alt = '', ...rest },
  forwarded,
) {
  const safe = imagenSegura(src);
  // Keyed by the URL that failed, so a new src gets a fresh chance without an
  // effect that would also wipe a failure detected at mount.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc !== null && failedSrc === safe;
  const setFailed = useCallback(() => setFailedSrc(safe), [safe]);

  const ref = useCallback(
    (el: HTMLImageElement | null) => {
      if (typeof forwarded === 'function') forwarded(el);
      else if (forwarded) forwarded.current = el;
      if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) setFailed();
    },
    [forwarded, setFailed],
  );

  if (!safe || failed) {
    if (fallback === null) return null;
    return <>{fallback ?? <ImagenFallback className={className} style={style} />}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      ref={ref}
      src={safe}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy={rest.referrerPolicy ?? 'no-referrer'}
      onError={(e) => {
        setFailed();
        onError?.(e);
      }}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 2 && img.naturalHeight <= 2) setFailed();
        onLoad?.(e);
      }}
    />
  );
});

/**
 * The stand-in for a missing picture: the colour of what the card is about
 * (a domain, a section) with its icon, quiet. It is meant to read as a
 * designed tile, not as an error — the card around it still says what it is.
 */
export function ImagenFallback({
  color = '#1FB57A',
  icon: Icon = Leaf,
  label,
  className,
  style,
  iconSize = 28,
}: {
  color?: string;
  icon?: LucideIcon;
  /** Only for large boxes, where an empty tile would look like a bug. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
}) {
  return (
    <span
      role="img"
      aria-label={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={cn('relative flex flex-col items-center justify-center gap-1.5 overflow-hidden', className)}
      style={{
        background: `radial-gradient(120% 90% at 20% 10%, ${color}33 0%, ${color}14 45%, ${color}08 100%)`,
        ...style,
      }}
    >
      <Icon style={{ color, width: iconSize, height: iconSize }} strokeWidth={1.75} className="opacity-70" aria-hidden />
      {label && <span className="px-3 text-center text-caption font-medium text-muted-foreground">{label}</span>}
    </span>
  );
}

/** For a user's own upload that is gone: said plainly, in the post's box. */
export function ImagenNoDisponible({ className }: { className?: string }) {
  return <ImagenFallback icon={ImageOff} color="#8A8F98" label="La imagen ya no está disponible" className={className} iconSize={24} />;
}

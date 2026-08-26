'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Pip, type PipStyle } from './Pip';
import { RANK_BY_SLUG } from '@/lib/ranks';
import { cn } from '@/lib/utils/cn';

export interface PipAvatarProps {
  /** profiles.pip_style — the mascot the person actually customised. */
  pipStyle?: PipStyle | null;
  /** A real photo wins only if the user deliberately set one. */
  avatarUrl?: string | null;
  name?: string | null;
  /** Drives the ring colour. Falls back to the first rank. */
  rankSlug?: string | null;
  /** 28 compact · 40 feed · 56 thread head · 88 profile. */
  size?: number;
  /** Rank-coloured ring. Off by default so small lists stay calm. */
  ring?: boolean;
  /** The Guardián+ glow that <Pip> already knows how to draw. */
  aura?: boolean;
  /** Organisations read as a rounded square, people as a circle. */
  org?: boolean;
  href?: string;
  className?: string;
  /** Only the profile header should animate; 20 bobbing avatars is noise. */
  animate?: boolean;
}

/**
 * The identity component.
 *
 * Brote's users spend real time customising a mascot in /perfil/pip and then
 * never see it anywhere. This is what puts it next to everything they say —
 * and it is the single thing that makes the feed look like Brote instead of a
 * timeline template.
 *
 * Fallback chain, in order: photo → their Pip → a neutral Pip. There is no
 * broken-image and no empty circle state, because both look like a bug.
 *
 * The ring is drawn with two stacked box-shadows so there is a 2px gap in the
 * page colour between avatar and ring — without the gap it reads as a border
 * and the rank colour muddies against the artwork.
 */
function PipAvatarInner({
  pipStyle,
  avatarUrl,
  name,
  rankSlug,
  size = 40,
  ring,
  aura,
  org,
  href,
  className,
  animate = false,
}: PipAvatarProps) {
  const rank = (rankSlug && RANK_BY_SLUG[rankSlug]) || null;
  const ringColor = rank?.color ?? '#1FB57A';
  const shape = org ? 'rounded-[30%]' : 'rounded-full';

  const inner = (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-2',
        shape,
        className,
      )}
      style={{
        width: size,
        height: size,
        ...(ring
          ? { boxShadow: `0 0 0 2px rgb(var(--bg)), 0 0 0 4px ${ringColor}` }
          : {}),
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name ?? ''}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <Pip size={size * 0.92} pipStyle={pipStyle ?? undefined} animate={animate} aura={aura} />
      )}
    </span>
  );

  if (!href) return inner;

  return (
    <Link
      href={href}
      aria-label={name ? `Ver el perfil de ${name}` : 'Ver perfil'}
      className={cn(
        'inline-flex shrink-0 rounded-full transition-transform duration-200 hover:scale-105',
        ring && 'my-1',
      )}
    >
      {inner}
    </Link>
  );
}

/**
 * Memoised on the style payload: <Pip> is inline SVG and a feed page can hold
 * 20+ of them, so re-rendering the whole set on every parent state change is
 * the difference between a smooth scroll and a janky one.
 */
export const PipAvatar = memo(PipAvatarInner, (a, b) => {
  return (
    a.size === b.size &&
    a.ring === b.ring &&
    a.aura === b.aura &&
    a.org === b.org &&
    a.href === b.href &&
    a.name === b.name &&
    a.avatarUrl === b.avatarUrl &&
    a.rankSlug === b.rankSlug &&
    a.animate === b.animate &&
    a.className === b.className &&
    JSON.stringify(a.pipStyle ?? null) === JSON.stringify(b.pipStyle ?? null)
  );
});
PipAvatar.displayName = 'PipAvatar';

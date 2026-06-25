'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

/** Initials-fallback avatar. */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initials =
    (name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '🌱';

  return (
    <AvatarPrimitive.Root
      className={cn('inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-2', className)}
      style={{ width: size, height: size }}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name ?? ''} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center bg-primary/15 font-semibold text-primary"
        style={{ fontSize: size * 0.4 }}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

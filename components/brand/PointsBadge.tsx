'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPoints } from '@/lib/points';

interface PointsBadgeProps {
  value: number;
  /** Animate counting up from the previous value. */
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

/** The amber points/XP counter with a count-up animation (BUILD_SPEC §2.7). */
export function PointsBadge({ value, animate = true, size = 'md', className, showIcon = true }: PointsBadgeProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const from = prev.current;
    const to = value;
    if (from === to) return;
    const duration = 700;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  const sizes = {
    sm: 'text-small px-2 py-0.5 gap-1',
    md: 'text-body px-2.5 py-1 gap-1.5',
    lg: 'text-h2 px-3 py-1.5 gap-2 font-display',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill bg-brote-sun/15 font-semibold text-brote-sun tnum',
        sizes[size],
        className,
      )}
    >
      {showIcon && <Sparkles className={cn(size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5')} />}
      {formatPoints(display)}
    </span>
  );
}

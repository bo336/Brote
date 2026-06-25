'use client';

import { cn } from '@/lib/utils/cn';

interface StreakFlameProps {
  count: number;
  /** When true, the streak is at risk → flame turns coral and droops. */
  atRisk?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

/**
 * Animated streak flame whose intensity scales with streak length
 * (BUILD_SPEC §2.7). Longer streak → bigger, warmer flame.
 */
export function StreakFlame({ count, atRisk, size = 'md', showCount = true, className }: StreakFlameProps) {
  const dim = { sm: 18, md: 24, lg: 40 }[size];
  // Intensity 0..1 from the streak length (saturates around 60 days).
  const intensity = Math.min(1, count / 60);
  const inner = atRisk ? '#FF6B5E' : count === 0 ? '#9FB0A6' : '#FFB23E';
  const outer = atRisk ? '#FF8A3D' : count === 0 ? '#C7CFC9' : '#FF8A3D';

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('relative inline-flex', count > 0 && !atRisk && 'animate-flame-flicker')}
        style={{ width: dim, height: dim }}
      >
        <svg viewBox="0 0 24 24" width={dim} height={dim} fill="none" aria-hidden>
          <path
            d="M12 2c1.5 3 5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.6-2.8 1.4-3.7C8.9 8.6 9.7 9.3 10 10c.2-2.4 1-4.2 2-8Z"
            fill={outer}
            opacity={0.55 + intensity * 0.35}
          />
          <path
            d="M12 8c.9 1.8 3 2.8 3 5.4a3 3 0 0 1-6 0c0-1.2.6-2.1 1.3-2.7.3.5.6.9.7 1.3.2-1.5.7-2.6 1-4Z"
            fill={inner}
          />
        </svg>
      </span>
      {showCount && (
        <span
          className={cn(
            'font-display font-bold tnum',
            size === 'lg' ? 'text-h2' : size === 'md' ? 'text-body' : 'text-small',
            atRisk ? 'text-brote-coral' : count === 0 ? 'text-muted-foreground' : 'text-brote-sun',
          )}
        >
          {count}
        </span>
      )}
    </span>
  );
}

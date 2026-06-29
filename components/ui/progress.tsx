'use client';

import { cn } from '@/lib/utils/cn';

interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
}

/** A circular progress ring (used by RankBadge + profile). */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  color = 'rgb(var(--primary))',
  trackColor = 'rgb(var(--border))',
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const dash = circumference * clamped;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: string;
  className?: string;
  height?: number;
}

export function ProgressBar({ value, color = 'rgb(var(--primary))', className, height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-pill bg-muted', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-pill transition-[width] duration-700 ease-out"
        style={{ width: `${clamped * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

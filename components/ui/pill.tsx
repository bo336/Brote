import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Domain accent color hex; tints the pill subtly. */
  color?: string;
  active?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Domain-colored chip/pill. When `color` is set it uses a soft tinted
 * background; when `active` it fills with the color.
 */
export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ className, color, active, size = 'md', style, children, ...props }, ref) => {
    const tinted = color
      ? active
        ? { backgroundColor: color, color: '#fff', borderColor: color }
        : { backgroundColor: `${color}1f`, color, borderColor: `${color}40` }
      : undefined;
    return (
      <span
        ref={ref}
        style={{ ...tinted, ...style }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-pill border font-medium',
          size === 'sm' ? 'px-2.5 py-0.5 text-caption' : 'px-3 py-1 text-small',
          !color && (active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface-2 text-muted-foreground'),
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);
Pill.displayName = 'Pill';

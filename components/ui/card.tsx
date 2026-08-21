import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The card is itself a control (a link or button wraps it). Adds the lift +
   * press feedback §5 requires on every clickable, so individual screens stop
   * inventing their own hover treatment — several had none at all.
   */
  interactive?: boolean;
  /** Removes the shadow, for cards sitting inside an already-elevated surface. */
  flat?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, flat, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-surface',
        flat ? 'shadow-none' : 'shadow-soft',
        interactive &&
          'press cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:-translate-y-0.5 focus-visible:shadow-lift',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-4', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-display text-h3 font-bold', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

/**
 * §2 micro-label — the tracked uppercase eyebrow that sits above a headline
 * or names a group of rows. `tone` keeps a domain colour when one applies.
 */
export function Eyebrow({
  children,
  className,
  color,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={cn('eyebrow text-muted-foreground', className)}
      style={color ? { color } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}

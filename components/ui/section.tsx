import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /**
   * §2 micro-label above the title. Every section heading that names a group
   * of rows should carry one — it is what lets the layout stay dense without
   * drawing a border around everything.
   */
  eyebrow?: string;
  /** Colour for the eyebrow, when the section belongs to a domain. */
  eyebrowColor?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  eyebrow,
  eyebrowColor,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <span
            className="eyebrow mb-1 block text-muted-foreground"
            style={eyebrowColor ? { color: eyebrowColor } : undefined}
          >
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-h2 font-bold leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

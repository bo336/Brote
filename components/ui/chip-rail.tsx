'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface ChipOption {
  value: string;
  label: string;
  /** Domain/identity accent — tints the filled pill when this chip is active. */
  color?: string;
}

/**
 * A horizontal filter rail whose active pill slides between positions with a
 * shared-layout spring instead of repainting instantly (BROTE_DESIGN_SYSTEM.md
 * §5, tab/filter switches). `layoutId` must be unique per rail on a page.
 */
export function ChipRail({
  options,
  value,
  onChange,
  layoutId,
  className,
}: {
  options: ChipOption[];
  value: string | null;
  onChange: (v: string) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1', className)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative shrink-0 rounded-pill px-3.5 py-1.5 text-small font-medium transition-colors duration-150',
              active ? 'text-white' : 'border border-border bg-surface-2 text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-pill"
                style={{ background: o.color ?? 'rgb(var(--primary))' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

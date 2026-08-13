'use client';

import { motion } from 'framer-motion';
import type { Period } from '@/lib/api/ranking';
import { cn } from '@/lib/utils/cn';

/**
 * Semana / Histórico switch, shared by every leaderboard (F14.1).
 *
 * Weekly is the default everywhere: a lifetime board permanently favours
 * whoever joined first, so a newcomer has nothing to play for. `layoutId` must
 * be unique per rendered toggle, otherwise two toggles on the same page fight
 * over the sliding pill.
 */
export function PeriodToggle({
  value,
  onChange,
  layoutId,
  className,
}: {
  value: Period;
  onChange: (p: Period) => void;
  layoutId: string;
  className?: string;
}) {
  const options: { value: Period; label: string }[] = [
    { value: 'semana', label: 'Semana' },
    { value: 'historico', label: 'Histórico' },
  ];

  return (
    <div className={cn('inline-flex rounded-pill border border-border bg-surface-2 p-1', className)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative rounded-pill px-3 py-1 text-small font-medium transition-colors duration-150',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-pill bg-primary"
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

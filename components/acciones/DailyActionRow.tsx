'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/haptics';

export interface DailyActionRowProps {
  title: string;
  domain: string;
  points: number;
  done?: boolean;
  loading?: boolean;
  onComplete?: () => void;
}

/**
 * A checkable daily streak action (BUILD_SPEC §2.7 / §7.3). Tapping fires an
 * optimistic check; the parent calls `complete_activity`. Persists "done" until
 * the 00:00 reset (handled by date-scoped queries).
 */
export function DailyActionRow({ title, domain, points, done, loading, onComplete }: DailyActionRowProps) {
  return (
    <button
      type="button"
      disabled={done || loading}
      onClick={() => {
        if (done || loading) return;
        haptic('success');
        onComplete?.();
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors',
        done ? 'border-brote-green/30 bg-primary/5' : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      <DomainIcon domain={domain} size={42} />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-body font-medium', done && 'text-muted-foreground line-through')}>
          {title}
        </p>
        <span className="text-small font-semibold text-brote-sun tnum">+{points}</span>
      </div>
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          done ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )}
      >
        {done && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        )}
      </span>
    </button>
  );
}

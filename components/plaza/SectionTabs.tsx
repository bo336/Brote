'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

/**
 * Big editorial-style section switch — bold text with a sliding underline,
 * not a pill segmented control. Reserved for primary section navigation
 * (Novedades / Proyectos); filters use <ChipRail> instead.
 */
export function SectionTabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-border">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative pb-3 font-display text-h1 font-extrabold transition-colors duration-150',
              active ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground',
            )}
          >
            {o.label}
            {active && (
              <motion.span
                layoutId="explorar-tab-underline"
                className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brote-green"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

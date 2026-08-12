'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Scroll-triggered fade + rise, staggered by index (BROTE_DESIGN_SYSTEM.md
 * §5). Wrap any section or list item that should animate into view instead
 * of appearing flat. `once` so re-scrolling never re-triggers.
 */
export function Reveal({
  children,
  index = 0,
  className,
  y = 16,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 10) * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

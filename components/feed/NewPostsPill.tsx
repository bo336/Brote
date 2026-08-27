'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowUp } from 'lucide-react';

/**
 * The pill that appears when the river moved while you were reading.
 *
 * It floats over the feed rather than pushing it down — inserting a row would
 * shift everything below it, which is exactly the disturbance the pill exists
 * to avoid. Tapping it scrolls to the top and refetches; ignoring it costs
 * nothing.
 */
export function NewPostsPill({ count, onClick }: { count: number; onClick: () => void }) {
  const t = useTranslations('feed');

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.94 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none sticky top-16 z-20 flex justify-center"
        >
          <button
            onClick={onClick}
            className="press pointer-events-auto inline-flex items-center gap-1.5 rounded-pill bg-primary px-4 py-2 text-caption font-semibold text-primary-foreground shadow-lift"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            {t('newPostsPill', { n: count })}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

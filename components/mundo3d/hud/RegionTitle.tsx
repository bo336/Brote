'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { useSessionStore } from '../state/useSessionStore';

/**
 * Walking into a region for the first time names it — the way a game tells you
 * a place is a place. Large, brief, and gone before it is in the way.
 */
const TITLE_MS = 2800;

export function RegionTitle() {
  const region = useSessionStore((s) => s.regionTitle);
  const setRegionTitle = useSessionStore((s) => s.setRegionTitle);
  const t = useTranslations('mundo');

  useEffect(() => {
    if (!region) return;
    const id = setTimeout(() => setRegionTitle(null), TITLE_MS);
    return () => clearTimeout(id);
  }, [region, setRegionTitle]);

  return (
    <AnimatePresence>
      {region && (
        <motion.div
          key={region}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none absolute inset-x-0 top-[11%] text-center text-white [text-shadow:0_2px_14px_rgba(12,26,19,0.45)]"
          role="status"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">{t('guide.arrive')}</p>
          <p className="font-display text-display-l font-bold">{t(`region.${region}`)}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

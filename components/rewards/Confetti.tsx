'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const GLYPHS = ['🌿', '🍃', '✨', '🌱', '⭐'];

/** Cheap 2D leaf/sparkle burst (BUILD_SPEC §9.6 — reserve real 3D for the world). */
export function Confetti({ count = 24 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: -120 - Math.random() * 220,
        rot: (Math.random() - 0.5) * 360,
        delay: Math.random() * 0.2,
        glyph: GLYPHS[i % GLYPHS.length],
        scale: 0.7 + Math.random() * 0.8,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute text-2xl"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 1, 0], x: b.x, y: b.y, rotate: b.rot, scale: b.scale }}
          transition={{ duration: 1.6, delay: b.delay, ease: 'easeOut' }}
        >
          {b.glyph}
        </motion.span>
      ))}
    </div>
  );
}

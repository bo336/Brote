'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * A real number that animates from what it showed before to what it is now.
 *
 * `<CountUp>` always starts from 0, which is right the first time a stat
 * appears and wrong when it CHANGES: marking an action would drop the impact
 * panel to zero and climb back. This keeps the previous value and runs only
 * the difference — the thing the person just did, visibly adding up.
 * Decimals survive (3,4 kg), because the formatter gets the raw number.
 */
export function NumeroVivo({
  value,
  format,
  duration = 900,
  className,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    // The first real value arrives after a loading state of 0: count up to it
    // once. Every later change animates from the last value on screen.
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (reduce || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (value - start) * eased;
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // A background tab never runs rAF: land on the real value regardless.
    const safety = setTimeout(() => {
      from.current = value;
      setShown(value);
    }, duration + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [value, duration, reduce]);

  return <span className={className}>{format(shown)}</span>;
}

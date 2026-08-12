'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * A number that counts up from 0 the moment it scrolls into view — used for
 * every KPI/stat in the app rather than a static digit (BROTE_DESIGN_SYSTEM.md
 * §5). Only real, current values should be passed in — never a fabricated one.
 */
export function CountUp({
  value,
  duration = 900,
  className,
  format,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const settled = useRef(false);

  useEffect(() => {
    // `reduce` is null until framer-motion's matchMedia listener settles, so
    // it must be re-checked here rather than only in the initial state —
    // otherwise a reduced-motion browser shows 0 forever instead of `value`.
    if (reduce) {
      setDisplay(value);
      settled.current = true;
      return;
    }
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else settled.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  // Safety net: backgrounded tabs and throttled/low-power browsers can delay
  // or never fire the IntersectionObserver callback that drives `inView`. A
  // real stat must never stay stuck at 0 because of that — force it after a
  // short grace period if the animation hasn't started on its own.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!settled.current) {
        settled.current = true;
        setDisplay(value);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {format ? format(display) : display}
    </span>
  );
}

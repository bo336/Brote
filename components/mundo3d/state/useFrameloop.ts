'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { RENDER_LOOP } from '@/lib/world/config';
import { hasHeldInput } from '../control/useInput';

/**
 * The render loop's sleep and wake.
 *
 * Continuous rendering when nothing moves is the cheapest waste there is, so
 * the loop drops to `frameloop="demand"` after `RENDER_LOOP.idleDemandDelayS`
 * of idleness — **but idle has to mean nobody is playing.** Only clicks used to
 * wake it, so four seconds after the page opened the loop slept, `useFrame`
 * stopped, and holding W walked nowhere. Every input wakes it now, and it
 * refuses to sleep while a key or the stick is still held.
 */
export function useFrameloop(): { frameloop: 'always' | 'demand'; wake: () => void } {
  const [frameloop, setFrameloop] = useState<'always' | 'demand'>('always');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wake = useCallback(() => {
    setFrameloop('always');
    if (idleTimer.current) clearTimeout(idleTimer.current);
    const arm = () => {
      idleTimer.current = setTimeout(() => {
        if (hasHeldInput()) arm();
        else setFrameloop('demand');
      }, RENDER_LOOP.idleDemandDelayS * 1000);
    };
    arm();
  }, []);

  useEffect(() => {
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [wake]);

  return { frameloop, wake };
}

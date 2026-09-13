'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

import { FxPool } from '@/lib/render/fx';
import { drainFx, hasQueuedFx } from '../state/feedback';

/** Every burst in the world, in one draw call (`lib/render/fx.ts`). */
export function WorldFx() {
  const pool = useMemo(() => new FxPool(), []);
  useEffect(() => () => pool.dispose(), [pool]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    pool.setTime(t);
    if (hasQueuedFx()) drainFx((r) => pool.emit(r.kind, r.x, r.y, r.z, t));
  });

  return <primitive object={pool.mesh} />;
}

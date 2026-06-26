'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { MundoHeroFallback } from './MundoHeroFallback';
import { Pip } from '@/components/pip/Pip';
import { useSettings, shouldRender3D } from '@/stores/settings';
import { isNight, dayProgress } from '@/lib/utils/dates';
import { computeMundoState, type MundoState } from '@/lib/mundo';
import { cn } from '@/lib/utils/cn';

// Lazily import the 3D canvas so three.js never blocks first paint (§9.1).
const MundoCanvas = dynamic(() => import('./MundoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Pip size={72} mood="sleepy" />
    </div>
  ),
});

interface MundoProps {
  mundo?: MundoState | null;
  height?: number;
  className?: string;
}

/**
 * "Tu Mundo" — renders the full 3D world on capable devices, or the flat
 * illustrated fallback (also the loading skeleton) on weak devices / reduced
 * motion (BUILD_SPEC §9.1). Deterministic from `mundo_state`.
 */
export function Mundo({ mundo, height = 240, className }: MundoProps) {
  const detailMode = useSettings((s) => s.detailMode);
  const [mounted, setMounted] = useState(false);
  const [night, setNight] = useState(false);
  const [dayT, setDayT] = useState(0.5);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setNight(isNight());
      setDayT(dayProgress());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const state = mundo ?? computeMundoState({ totalXp: 0, currentStreak: 0 });
  const want3D = mounted && shouldRender3D(detailMode);

  if (!want3D) {
    return <MundoHeroFallback mundo={mundo} height={height} className={className} />;
  }

  const golden = state.palette === 'golden';
  const sky = night
    ? 'linear-gradient(180deg, #0b1f3a 0%, #16261D 75%)'
    : golden
      ? 'linear-gradient(180deg, #FFE3A8 0%, #FFC36B 60%, #BfE6C8 100%)'
      : 'linear-gradient(180deg, #BFE8FF 0%, #DFF3E4 55%, #CDEBD2 100%)';

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-card border border-border', className)}
      style={{ height, background: sky }}
    >
      {night && (
        <div className="pointer-events-none absolute inset-0 opacity-70">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 55}%`, left: `${(i * 53) % 100}%` }}
            />
          ))}
        </div>
      )}
      <MundoCanvas mundo={state} night={night} dayT={dayT} />
    </div>
  );
}

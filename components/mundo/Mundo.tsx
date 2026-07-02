'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { MundoHeroFallback } from './MundoHeroFallback';
import { Pip } from '@/components/pip/Pip';
import { useSettings, shouldRender3D } from '@/stores/settings';
import { isNight, dayProgress } from '@/lib/utils/dates';
import { computeMundoState, biomeFor, type MundoState } from '@/lib/mundo';
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
  /** Hide the biome/growth overlay (e.g. tiny embeds). */
  hideOverlay?: boolean;
}

/**
 * "Tu Mundo" — renders the full 3D world on capable devices, or the flat
 * illustrated fallback (also the loading skeleton) on weak devices / reduced
 * motion (BUILD_SPEC §9.1). Deterministic from `mundo_state`. Shows the
 * Mundo Infinito overlay: biome name, world number and growth progress.
 */
export function Mundo({ mundo, height = 240, className, hideOverlay = false }: MundoProps) {
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

  const state = mundo ?? computeMundoState({ totalXp: 0, currentStreak: 0, completionsCount: 0 });
  const want3D = mounted && shouldRender3D(detailMode);

  if (!want3D) {
    return <MundoHeroFallback mundo={mundo} height={height} className={className} />;
  }

  const golden = state.palette === 'golden';
  const biome = biomeFor(state.worldIndex ?? 1);
  const sky = night
    ? 'linear-gradient(180deg, #0b1f3a 0%, #16261D 75%)'
    : golden
      ? 'linear-gradient(180deg, #FFE3A8 0%, #FFC36B 60%, #BfE6C8 100%)'
      : `linear-gradient(180deg, ${biome.skyTop} 0%, ${biome.skyHorizon} 62%, ${biome.skyHorizon} 100%)`;

  const growth = state.worldGrowth ?? 0;
  const goal = state.worldGoal ?? 40;
  const pct = Math.min(100, Math.round((growth / Math.max(1, goal)) * 100));

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

      {!hideOverlay && (
        <>
          {/* Biome chip */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-pill bg-black/25 px-3 py-1 backdrop-blur-sm">
            <span className="text-caption font-bold text-white/95">Mundo {state.worldIndex ?? 1}</span>
            <span className="text-caption text-white/70">· {biome.name}</span>
          </div>

          {/* Growth bar */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3">
            <div className="rounded-pill bg-black/25 px-3 py-1.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-caption text-white/90">
                <span className="font-semibold">🌱 {growth}/{goal}</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-white/20">
                <div
                  className="h-full rounded-pill bg-gradient-to-r from-brote-green to-brote-sun transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

import { Pip, type PipMood } from '@/components/pip/Pip';
import { isNight } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import type { MundoState } from '@/lib/mundo';

/**
 * The poster's no-snapshot fallback — the old `MundoHeroFallback`, moved and
 * re-skinned to the clay palette.
 *
 * It is what the feed shows before the player's first visit to `/mundo`, and it
 * is the reduced-motion and no-WebGL path forever. One `<div>` tree and one
 * inline SVG set: no canvas, no WebGL context, no three.js
 * (`07-RENDER-ARCHITECTURE.md` §1).
 *
 * The ramp below is copied from `06-ART-DIRECTION.md` §3 rather than imported,
 * because `components/mundo3d/poster/**` may not import `lib/render/**` — that
 * import is exactly what would drag the renderer into the home feed's bundle.
 * If the art direction's ramp changes, change both.
 */
const CLAY = {
  soil: '#B08A63',
  soilDeep: '#8A6A49',
  grass: '#6FBF73',
  grassDeep: '#3E8C5C',
  leaf: '#3CB371',
  leafDeep: '#0E7A52',
  bark: '#8C6E52',
  sand: '#D9C9A8',
  cream: '#F7F5EF',
  sun: '#FFB23E',
  accent: '#E8638C',
  night: '#16261D',
  nightSky: '#2A3A54',
  nightMoon: '#8FA8D8',
} as const;

interface PosterFallbackProps {
  mundo?: MundoState | null;
  pipMood?: PipMood;
  className?: string;
  height?: number;
}

/** Warmth only. `liveliness` never removes anything (`01-RULES.md` §4.2). */
function warmth(liveliness: number): number {
  return Math.max(0, Math.min(1, (liveliness - 0.35) / 0.65));
}

export function PosterFallback({ mundo, pipMood = 'happy', className, height = 240 }: PosterFallbackProps) {
  const [night, setNight] = useState(false);
  useEffect(() => {
    setNight(isNight());
    const id = setInterval(() => setNight(isNight()), 60_000);
    return () => clearInterval(id);
  }, []);

  const tier = mundo?.rankTier ?? 1;
  const live = warmth(mundo?.liveliness ?? 0.5);
  const golden = mundo?.palette === 'golden';

  const sky = night
    ? `linear-gradient(180deg, ${CLAY.nightSky} 0%, ${CLAY.night} 72%)`
    : golden
      ? `linear-gradient(180deg, #FFE3A8 0%, ${CLAY.sun} 58%, ${CLAY.sand} 100%)`
      : `linear-gradient(180deg, #BFE8FF 0%, ${CLAY.cream} 56%, ${CLAY.sand} 100%)`;

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-card border border-border', className)}
      style={{ height }}
    >
      <div className="absolute inset-0" style={{ background: sky }} />

      {/* Sun or moon. One warm key, one cool night key — the whole light model. */}
      <div
        className="absolute right-8 top-6 h-12 w-12 rounded-full"
        style={{
          background: night ? CLAY.nightMoon : CLAY.sun,
          boxShadow: night ? `0 0 24px ${CLAY.nightMoon}` : `0 0 36px ${CLAY.sun}`,
        }}
      />

      {night && (
        <div className="absolute inset-0 opacity-70">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 60}%`, left: `${(i * 53) % 100}%`, opacity: 0.5 + ((i * 7) % 5) / 10 }}
            />
          ))}
        </div>
      )}

      {/* The island body: bare warm earth at tier 1, grass from tier 2. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            tier >= 2
              ? `linear-gradient(180deg, ${CLAY.grass} 0%, ${CLAY.grassDeep} ${100 - live * 26}%)`
              : `linear-gradient(180deg, ${CLAY.soil} 0%, ${CLAY.soilDeep} 100%)`,
        }}
      />

      {/* The unlock ladder, read as a silhouette. */}
      <div className="absolute inset-x-0 bottom-[26%] flex items-end justify-center gap-4 px-8">
        {tier >= 4 && <Tree height={48} />}
        {tier >= 2 && <Sprout />}
        {tier >= 3 && <Flower color={CLAY.accent} />}
        {tier >= 6 && <Tree height={64} />}
        {tier >= 3 && <Flower color={CLAY.sun} />}
      </div>

      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2">
        <Pip size={88} mood={night ? 'sleepy' : pipMood} aura={tier >= 8} golden={golden} />
      </div>
    </div>
  );
}

function Sprout() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" aria-hidden>
      <path d="M12 22V12" stroke={CLAY.leafDeep} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 14C12 14 6 14 5 9C10 8 12 11 12 14Z" fill={CLAY.leaf} />
      <path d="M12 13C12 13 18 12 19 7C14 6 12 10 12 13Z" fill={CLAY.grass} />
    </svg>
  );
}

function Flower({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={28} fill="none" aria-hidden>
      <path d="M12 26V14" stroke={CLAY.grassDeep} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="9" r="3" fill={CLAY.sun} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="4.5" rx="2.2" ry="3.4" fill={color} transform={`rotate(${a} 12 9)`} />
      ))}
    </svg>
  );
}

function Tree({ height }: { height: number }) {
  return (
    <svg viewBox="0 0 40 56" width={height * 0.7} height={height} fill="none" aria-hidden>
      <rect x="17" y="34" width="6" height="20" rx="3" fill={CLAY.bark} />
      <circle cx="20" cy="22" r="16" fill={CLAY.leaf} />
      <circle cx="12" cy="26" r="10" fill={CLAY.leafDeep} />
      <circle cx="28" cy="26" r="10" fill={CLAY.grass} />
    </svg>
  );
}

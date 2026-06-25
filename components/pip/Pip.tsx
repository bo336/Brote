'use client';

import { cn } from '@/lib/utils/cn';

export type PipMood = 'happy' | 'celebrating' | 'sleepy' | 'worried' | 'neutral';

interface PipProps {
  size?: number;
  mood?: PipMood;
  /** Adds the cosmetic Guardián glow aura (rank ≥ Guardián). */
  aura?: boolean;
  /** Golden Gaia variant. */
  golden?: boolean;
  className?: string;
  /** Subtle idle bob animation. */
  animate?: boolean;
}

/**
 * Pip — the seed-sprout mascot (BUILD_SPEC §2.1). A small, friendly, slightly
 * glowing creature with one expressive leaf and large warm eyes. Authored as an
 * inline SVG so it themes with the brand and needs no paid assets.
 */
export function Pip({ size = 96, mood = 'happy', aura, golden, className, animate = true }: PipProps) {
  const body = golden ? '#FFD27A' : '#9CC93B';
  const bodyDeep = golden ? '#F4A62A' : '#6FBF73';
  const leaf = golden ? '#FFB23E' : '#1FB57A';
  const leafDeep = golden ? '#E8950E' : '#0E7A52';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', animate && 'animate-pip-bob', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Pip"
    >
      {aura && (
        <span
          className="absolute inset-0 -z-10 rounded-full blur-xl"
          style={{ background: golden ? 'rgba(255,178,62,0.5)' : 'rgba(31,181,122,0.4)' }}
          aria-hidden
        />
      )}
      <svg viewBox="0 0 120 120" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* soft ground shadow */}
        <ellipse cx="60" cy="110" rx="28" ry="6" fill="#000" opacity="0.12" />

        {/* stem */}
        <rect x="56" y="64" width="8" height="34" rx="4" fill={bodyDeep} />

        {/* the expressive leaf */}
        <g
          style={{ transformOrigin: '60px 64px' }}
          className={cn(mood === 'worried' && 'opacity-90')}
        >
          <path
            d="M62 60 C 86 50, 100 60, 102 40 C 80 36, 64 44, 62 60 Z"
            fill={leaf}
            transform={mood === 'worried' || mood === 'sleepy' ? 'rotate(18 62 60)' : 'rotate(0 62 60)'}
          />
          <path
            d="M64 58 C 82 50, 92 54, 99 43"
            stroke={leafDeep}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
            transform={mood === 'worried' || mood === 'sleepy' ? 'rotate(18 62 60)' : 'rotate(0 62 60)'}
          />
        </g>

        {/* body — the seed */}
        <path
          d="M60 38 C 40 38, 30 54, 30 72 C 30 92, 44 102, 60 102 C 76 102, 90 92, 90 72 C 90 54, 80 38, 60 38 Z"
          fill={body}
        />
        <path
          d="M60 38 C 48 38, 40 48, 38 60 C 46 52, 54 50, 60 50 Z"
          fill="#fff"
          opacity="0.25"
        />

        {/* cheeks */}
        <circle cx="44" cy="80" r="6" fill="#FF8FA3" opacity="0.5" />
        <circle cx="76" cy="80" r="6" fill="#FF8FA3" opacity="0.5" />

        {/* eyes */}
        {mood === 'sleepy' ? (
          <>
            <path d="M44 70 q 6 5 12 0" stroke="#0C1A13" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M64 70 q 6 5 12 0" stroke="#0C1A13" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : mood === 'worried' ? (
          <>
            <circle cx="50" cy="71" r="4.5" fill="#0C1A13" />
            <circle cx="70" cy="71" r="4.5" fill="#0C1A13" />
            <path d="M44 63 l 10 3" stroke="#0C1A13" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M76 63 l -10 3" stroke="#0C1A13" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="50" cy="70" r="5.5" fill="#0C1A13" />
            <circle cx="70" cy="70" r="5.5" fill="#0C1A13" />
            <circle cx="52" cy="68" r="1.8" fill="#fff" />
            <circle cx="72" cy="68" r="1.8" fill="#fff" />
          </>
        )}

        {/* mouth */}
        {mood === 'celebrating' ? (
          <path d="M50 84 q 10 12 20 0 q -10 4 -20 0 Z" fill="#0C1A13" />
        ) : mood === 'worried' ? (
          <path d="M52 88 q 8 -6 16 0" stroke="#0C1A13" strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M52 84 q 8 8 16 0" stroke="#0C1A13" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </div>
  );
}

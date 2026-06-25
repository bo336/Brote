'use client';

import { useEffect, useState } from 'react';
import { Pip, type PipMood } from '@/components/pip/Pip';
import { isNight } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import type { MundoState } from '@/lib/mundo';

interface MundoHeroFallbackProps {
  mundo?: MundoState | null;
  pipMood?: PipMood;
  className?: string;
  /** Shown as the 3D <Suspense> skeleton AND the low-detail still (§9.1). */
  height?: number;
}

/**
 * Flat illustrated preview of "Tu Mundo" — a day/night-aware diorama with Pip.
 * Serves as the branded skeleton while the 3D canvas loads and as the
 * low-detail fallback on weak devices (BUILD_SPEC §9.1).
 */
export function MundoHeroFallback({ mundo, pipMood = 'happy', className, height = 240 }: MundoHeroFallbackProps) {
  const [night, setNight] = useState(false);
  useEffect(() => {
    setNight(isNight());
    const id = setInterval(() => setNight(isNight()), 60_000);
    return () => clearInterval(id);
  }, []);

  const tier = mundo?.rankTier ?? 1;
  const liveliness = mundo?.liveliness ?? 0.5;
  const golden = mundo?.palette === 'golden';

  // Sky gradient by time of day.
  const sky = night
    ? 'linear-gradient(180deg, #0b1f3a 0%, #16261D 70%)'
    : golden
      ? 'linear-gradient(180deg, #FFE3A8 0%, #FFC36B 60%, #BfE6C8 100%)'
      : 'linear-gradient(180deg, #BFE8FF 0%, #DFF3E4 55%, #CDEBD2 100%)';

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-card border border-border', className)}
      style={{ height }}
    >
      <div className="absolute inset-0" style={{ background: sky }} />

      {/* sun / moon */}
      <div
        className={cn('absolute right-8 top-6 h-12 w-12 rounded-full blur-[1px]', night ? 'bg-[#E8EEF7]' : 'bg-brote-sun')}
        style={{ boxShadow: night ? '0 0 24px #c9d6ea' : '0 0 36px #FFCF7A' }}
      />

      {/* stars at night */}
      {night && (
        <div className="absolute inset-0 opacity-70">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 60}%`, left: `${(i * 53) % 100}%`, opacity: 0.5 + ((i * 7) % 5) / 10 }}
            />
          ))}
        </div>
      )}

      {/* ground */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-card"
        style={{
          background:
            tier >= 2
              ? `linear-gradient(180deg, #3CB371 0%, #2f7d4f ${100 - liveliness * 30}%)`
              : 'linear-gradient(180deg, #A38B6D 0%, #7c6750 100%)',
        }}
      />

      {/* simple flora that appears with rank tiers */}
      <div className="absolute inset-x-0 bottom-[26%] flex items-end justify-center gap-4 px-8">
        {tier >= 4 && <Tree height={48} />}
        {tier >= 2 && <Sprout />}
        {tier >= 3 && <Flower color="#E8638C" />}
        {tier >= 6 && <Tree height={64} />}
        {tier >= 3 && <Flower color="#FFB23E" />}
      </div>

      {/* Pip lives here */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2">
        <Pip size={88} mood={night ? 'sleepy' : pipMood} aura={tier >= 8} golden={golden} />
      </div>
    </div>
  );
}

function Sprout() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} fill="none" aria-hidden>
      <path d="M12 22V12" stroke="#0E7A52" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 14C12 14 6 14 5 9C10 8 12 11 12 14Z" fill="#1FB57A" />
      <path d="M12 13C12 13 18 12 19 7C14 6 12 10 12 13Z" fill="#9CC93B" />
    </svg>
  );
}

function Flower({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={28} fill="none" aria-hidden>
      <path d="M12 26V14" stroke="#2f7d4f" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="9" r="3" fill="#FFB23E" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="4.5" rx="2.2" ry="3.4" fill={color} transform={`rotate(${a} 12 9)`} />
      ))}
    </svg>
  );
}

function Tree({ height }: { height: number }) {
  return (
    <svg viewBox="0 0 40 56" width={height * 0.7} height={height} fill="none" aria-hidden>
      <rect x="17" y="34" width="6" height="20" rx="2" fill="#7c5a3a" />
      <circle cx="20" cy="22" r="16" fill="#3CB371" />
      <circle cx="12" cy="26" r="10" fill="#2f9c5f" />
      <circle cx="28" cy="26" r="10" fill="#46b877" />
    </svg>
  );
}

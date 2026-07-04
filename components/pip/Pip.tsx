'use client';

import { cn } from '@/lib/utils/cn';

export type PipMood = 'happy' | 'celebrating' | 'sleepy' | 'worried' | 'neutral';

/** Avatar customization payload (profiles.pip_style). */
export interface PipStyle {
  body?: string;
  hat?: string;
  glasses?: string;
  pattern?: string;
}

/** Body palettes (F9.1): key → [body, bodyDeep, leaf, leafDeep]. */
export const PIP_PALETTES: Record<string, [string, string, string, string]> = {
  clasico: ['#9CC93B', '#6FBF73', '#1FB57A', '#0E7A52'],
  cielo: ['#7EC8E3', '#4FA3C7', '#2DB4D4', '#1E88A8'],
  coral: ['#FF8A76', '#E86A5A', '#FF6B5E', '#C74A3E'],
  lavanda: ['#B99AE8', '#9A7BD0', '#B07CD6', '#8A5CB8'],
  sol: ['#FFD27A', '#F4A62A', '#FFB23E', '#E8950E'],
  noche: ['#7B8AF5', '#5B6CF0', '#6FBF73', '#0E7A52'],
};

export const PIP_HATS = ['ninguno', 'brotecito', 'flor', 'gorro', 'corona', 'hongo', 'mono', 'vincha', 'estrella'] as const;
export const PIP_GLASSES = ['ninguno', 'redondos', 'sol', 'corazones'] as const;
export const PIP_PATTERNS = ['ninguno', 'pecas', 'lunares', 'rayitas'] as const;

interface PipProps {
  size?: number;
  mood?: PipMood;
  /** Adds the cosmetic Guardián glow aura (rank ≥ Guardián). */
  aura?: boolean;
  /** Golden Gaia variant. */
  golden?: boolean;
  /** Avatar customization (body palette + hat). */
  pipStyle?: PipStyle | null;
  className?: string;
  /** Subtle idle bob animation. */
  animate?: boolean;
}

/**
 * Pip — the seed-sprout mascot (BUILD_SPEC §2.1). A small, friendly, slightly
 * glowing creature with one expressive leaf and large warm eyes. Authored as an
 * inline SVG so it themes with the brand and needs no paid assets.
 */
export function Pip({ size = 96, mood = 'happy', aura, golden, pipStyle, className, animate = true }: PipProps) {
  const palette = (!golden && pipStyle?.body && PIP_PALETTES[pipStyle.body]) || null;
  const body = golden ? '#FFD27A' : palette ? palette[0] : '#9CC93B';
  const bodyDeep = golden ? '#F4A62A' : palette ? palette[1] : '#6FBF73';
  const leaf = golden ? '#FFB23E' : palette ? palette[2] : '#1FB57A';
  const leafDeep = golden ? '#E8950E' : palette ? palette[3] : '#0E7A52';
  const hat = pipStyle?.hat && pipStyle.hat !== 'ninguno' ? pipStyle.hat : null;
  const glasses = pipStyle?.glasses && pipStyle.glasses !== 'ninguno' ? pipStyle.glasses : null;
  const pattern = pipStyle?.pattern && pipStyle.pattern !== 'ninguno' ? pipStyle.pattern : null;

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

        {/* body patterns */}
        {pattern === 'pecas' && (
          <g fill={bodyDeep} opacity="0.55">
            <circle cx="46" cy="90" r="1.8" /><circle cx="52" cy="94" r="1.5" /><circle cx="60" cy="92" r="1.8" />
            <circle cx="68" cy="94" r="1.5" /><circle cx="74" cy="90" r="1.8" />
          </g>
        )}
        {pattern === 'lunares' && (
          <g fill="#fff" opacity="0.35">
            <circle cx="42" cy="66" r="3.4" /><circle cx="78" cy="62" r="2.8" /><circle cx="48" cy="94" r="3.2" />
            <circle cx="70" cy="96" r="2.6" /><circle cx="60" cy="58" r="2.4" />
          </g>
        )}
        {pattern === 'rayitas' && (
          <g stroke={bodyDeep} strokeWidth="2.4" strokeLinecap="round" opacity="0.45" fill="none">
            <path d="M36 74 q 4 6 0 12" /><path d="M84 74 q -4 6 0 12" /><path d="M60 96 q 6 3 12 0" />
          </g>
        )}

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

        {/* hats (F9.1 accessories) */}
        {hat === 'brotecito' && (
          <g>
            <rect x="58" y="30" width="4" height="10" rx="2" fill={leafDeep} />
            <path d="M60 30 C 52 22, 44 24, 42 16 C 52 15, 59 20, 60 30 Z" fill={leaf} />
            <path d="M60 30 C 68 22, 76 24, 78 16 C 68 15, 61 20, 60 30 Z" fill={leaf} />
          </g>
        )}
        {hat === 'flor' && (
          <g>
            {[0, 1, 2, 3, 4].map((i) => {
              const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
              return <circle key={i} cx={60 + Math.cos(a) * 8} cy={32 + Math.sin(a) * 8} r="5.5" fill="#FF8FA3" />;
            })}
            <circle cx="60" cy="32" r="4.5" fill="#FFD87A" />
          </g>
        )}
        {hat === 'gorro' && (
          <g>
            <path d="M38 44 C 40 26, 80 26, 82 44 L 82 48 L 38 48 Z" fill="#E8638C" />
            <rect x="36" y="44" width="48" height="7" rx="3.5" fill="#fff" opacity="0.9" />
            <circle cx="60" cy="24" r="5" fill="#fff" />
          </g>
        )}
        {hat === 'corona' && (
          <g>
            <path d="M42 42 L 46 28 L 54 38 L 60 24 L 66 38 L 74 28 L 78 42 Z" fill="#FFD24A" stroke="#E8A80E" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="60" cy="24" r="2.6" fill="#FF6B5E" />
          </g>
        )}
        {hat === 'hongo' && (
          <g>
            <path d="M38 42 C 40 24, 80 24, 82 42 Z" fill="#d0543a" />
            <circle cx="50" cy="33" r="3" fill="#fff" opacity="0.9" />
            <circle cx="64" cy="29" r="2.4" fill="#fff" opacity="0.9" />
            <circle cx="73" cy="36" r="2.6" fill="#fff" opacity="0.9" />
          </g>
        )}
        {hat === 'mono' && (
          <g>
            <path d="M52 34 L 38 26 L 40 40 Z" fill="#E8638C" />
            <path d="M52 34 L 66 26 L 64 40 Z" fill="#E8638C" />
            <circle cx="52" cy="34" r="4.5" fill="#C74A72" />
          </g>
        )}
        {hat === 'vincha' && (
          <g>
            <path d="M36 46 C 44 36, 76 36, 84 46" stroke="#2DB4D4" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="76" cy="40" r="4.5" fill="#FFD87A" />
          </g>
        )}
        {hat === 'estrella' && (
          <g>
            <path d="M60 40 L 60 22" stroke={leafDeep} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 12 L 62.4 18 L 68 18.6 L 63.8 22.6 L 65 28.4 L 60 25.4 L 55 28.4 L 56.2 22.6 L 52 18.6 L 57.6 18 Z" fill="#FFD24A" />
          </g>
        )}

        {/* glasses */}
        {glasses === 'redondos' && (
          <g stroke="#0C1A13" strokeWidth="2.5" fill="none">
            <circle cx="50" cy="70" r="9" /><circle cx="70" cy="70" r="9" />
            <path d="M59 70 L 61 70" />
          </g>
        )}
        {glasses === 'sol' && (
          <g>
            <rect x="41" y="63" width="17" height="13" rx="6" fill="#1c2a22" />
            <rect x="62" y="63" width="17" height="13" rx="6" fill="#1c2a22" />
            <path d="M58 69 L 62 69" stroke="#1c2a22" strokeWidth="2.5" />
            <circle cx="47" cy="67" r="2" fill="#fff" opacity="0.5" />
            <circle cx="68" cy="67" r="2" fill="#fff" opacity="0.5" />
          </g>
        )}
        {glasses === 'corazones' && (
          <g fill="#FF5F8A">
            <path d="M50 76 C 42 70, 42 62, 48 62 C 50 62, 50 64, 50 64 C 50 64, 50 62, 52 62 C 58 62, 58 70, 50 76 Z" />
            <path d="M70 76 C 62 70, 62 62, 68 62 C 70 62, 70 64, 70 64 C 70 64, 70 62, 72 62 C 78 62, 78 70, 70 76 Z" />
          </g>
        )}
      </svg>
    </div>
  );
}

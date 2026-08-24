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
  // Premium (tienda, migración 0038). El servidor valida la propiedad antes de
  // dejar guardar cualquiera de estos en profiles.pip_style.
  aurora: ['#8EDCC9', '#4FA894', '#A97BE8', '#6E4BB8'],
  bosque: ['#4E8C5A', '#33643E', '#2E7D4F', '#17452C'],
  atardecer: ['#FFB07A', '#E8804F', '#FF8A5B', '#C4522A'],
  glaciar: ['#BFE4F0', '#8CBBD0', '#DCF2F8', '#7FA8BC'],
  cosmos: ['#6B5CE0', '#4536A8', '#9B7BF0', '#5E3FB0'],
};

export const PIP_HATS = ['ninguno', 'brotecito', 'flor', 'gorro', 'corona', 'hongo', 'mono', 'vincha', 'estrella',
  'sombrero', 'casco', 'visera', 'aureola'] as const;
export const PIP_GLASSES = ['ninguno', 'redondos', 'sol', 'corazones', 'aviador', 'pixel'] as const;
export const PIP_PATTERNS = ['ninguno', 'pecas', 'lunares', 'rayitas', 'hojitas', 'estrellitas', 'olitas'] as const;

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
        {pattern === 'hojitas' && (
          <g fill={leafDeep} opacity="0.45">
            {([[42, 88, -25], [56, 96, 10], [72, 90, 30], [78, 66, -15], [38, 64, 20]] as const).map(([x, y, r], i) => (
              <path
                key={i}
                d="M0 0 C 5 -4, 9 -1, 9 4 C 4 6, 0 4, 0 0 Z"
                transform={`translate(${x} ${y}) rotate(${r})`}
              />
            ))}
          </g>
        )}
        {pattern === 'estrellitas' && (
          <g fill="#fff" opacity="0.6">
            {([[44, 66, 2.6], [74, 72, 2], [50, 92, 2.4], [70, 94, 1.8], [61, 60, 1.6]] as const).map(([x, y, r], i) => (
              <path
                key={i}
                d={`M${x} ${y - r * 2} L${x + r * 0.6} ${y - r * 0.6} L${x + r * 2} ${y} L${x + r * 0.6} ${y + r * 0.6} L${x} ${y + r * 2} L${x - r * 0.6} ${y + r * 0.6} L${x - r * 2} ${y} L${x - r * 0.6} ${y - r * 0.6} Z`}
              />
            ))}
          </g>
        )}
        {pattern === 'olitas' && (
          <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" fill="none">
            <path d="M38 72 q 5 -4 10 0 t 10 0 t 10 0 t 10 0" />
            <path d="M40 84 q 5 -4 10 0 t 10 0 t 10 0 t 8 0" />
            <path d="M44 96 q 5 -4 10 0 t 10 0 t 10 0" />
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
        {hat === 'sombrero' && (
          <g>
            <ellipse cx="60" cy="45" rx="30" ry="8" fill="#E8C87A" />
            <ellipse cx="60" cy="44" rx="30" ry="7" fill="#F2D992" />
            <path d="M46 44 C 47 30, 73 30, 74 44 Z" fill="#E8C87A" />
            <path d="M46 41 q 14 5 28 0" stroke="#B8934A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}
        {hat === 'casco' && (
          <g>
            <path d="M36 46 C 36 27, 84 27, 84 46 Z" fill="#2DB4D4" />
            <path d="M36 46 C 36 27, 84 27, 84 46 Z" fill="#fff" opacity="0.12" />
            <g stroke="#1E88A8" strokeWidth="3" strokeLinecap="round">
              <path d="M50 42 L 52 31" /><path d="M60 42 L 60 30" /><path d="M70 42 L 68 31" />
            </g>
            <path d="M36 46 L 84 46" stroke="#1E88A8" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}
        {hat === 'visera' && (
          <g>
            <path d="M40 45 C 41 29, 79 29, 80 45 Z" fill="#E8638C" />
            <path d="M40 45 C 30 45, 26 50, 26 52 C 40 54, 52 50, 52 45 Z" fill="#C74A72" />
            <circle cx="60" cy="29" r="3" fill="#C74A72" />
          </g>
        )}
        {hat === 'aureola' && (
          <g>
            <ellipse cx="60" cy="22" rx="18" ry="5.5" fill="none" stroke="#FFE08A" strokeWidth="9" opacity="0.25" />
            <ellipse cx="60" cy="22" rx="18" ry="5.5" fill="none" stroke="#FFD24A" strokeWidth="4" />
            <ellipse cx="60" cy="22" rx="18" ry="5.5" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.75" />
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
        {glasses === 'aviador' && (
          <g>
            <path d="M41 65 C 41 63, 57 63, 57 65 C 57 74, 51 78, 47 78 C 43 78, 41 72, 41 65 Z" fill="#3A4A55" opacity="0.9" />
            <path d="M63 65 C 63 63, 79 63, 79 65 C 79 72, 77 78, 73 78 C 69 78, 63 74, 63 65 Z" fill="#3A4A55" opacity="0.9" />
            <path d="M57 66 q 3 -2 6 0" stroke="#C9D6DE" strokeWidth="2.2" fill="none" />
            <path d="M43 68 l 6 6" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
            <path d="M65 68 l 6 6" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
          </g>
        )}
        {glasses === 'pixel' && (
          <g fill="#0C1A13">
            <rect x="40" y="62" width="18" height="6" /><rect x="40" y="68" width="6" height="6" />
            <rect x="52" y="68" width="6" height="6" />
            <rect x="62" y="62" width="18" height="6" /><rect x="62" y="68" width="6" height="6" />
            <rect x="74" y="68" width="6" height="6" />
            <rect x="58" y="62" width="4" height="4" />
          </g>
        )}
      </svg>
    </div>
  );
}

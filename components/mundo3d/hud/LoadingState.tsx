'use client';

import { useTranslations } from 'next-intl';

import { BRAND } from '@/lib/render/palette';

/**
 * The designed loading screen. **Never a spinner, never a percentage that lies**
 * (`16-UI-AUDIO-A11Y.md` §5).
 *
 * A clay island silhouette, a thin progress line in `brote-green`, and one line
 * of Spanish. It is the first thing anyone sees of the world, so it is authored
 * rather than defaulted — and it is pure DOM and SVG, so it paints long before
 * the 3D chunk has finished downloading.
 */
export function LoadingState({ slow = false }: { slow?: boolean }) {
  const t = useTranslations('mundo');
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-6 bg-brote-ink px-8"
      role="status"
      aria-live="polite"
    >
      <svg viewBox="0 0 200 90" width={200} height={90} fill="none" aria-hidden>
        {/* The island, as a silhouette: the one shape this whole build is about. */}
        <path
          d="M18 66 C22 44 44 30 74 28 C92 27 104 18 118 20 C142 23 160 38 172 58 C178 68 176 76 164 78 L34 78 C20 78 16 74 18 66 Z"
          fill={BRAND.inkSoft}
        />
        <ellipse cx="100" cy="80" rx="86" ry="7" fill={BRAND.inkSoft} opacity="0.5" />
      </svg>

      <div className="h-1 w-40 overflow-hidden rounded-pill bg-white/10">
        <div className="h-full w-1/3 animate-[loadingline_1.4s_ease-in-out_infinite] rounded-pill bg-brote-green" />
      </div>

      <p className="text-center text-small text-brote-cream/80">{slow ? t('loading.slow') : t('loading.title')}</p>

      <style>{`
        @keyframes loadingline {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[loadingline_1\\.4s_ease-in-out_infinite\\] {
            animation: none;
            width: 100%;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

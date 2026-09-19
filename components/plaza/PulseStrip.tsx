'use client';

import { CountUp } from '@/components/ui/count-up';

/**
 * A dark "section break" strip (BROTE_DESIGN_SYSTEM.md §1: canvas → ink →
 * canvas rhythm) borrowed from financial-terminal language — a live dot and
 * tabular counters — deliberately unlike any other environmental app. Every
 * number here must be real; there is no reading-time or fake-precision stat.
 */
export function PulseStrip({
  today,
  total,
  trendingLabel,
  trendingColor,
}: {
  today: number;
  total: number;
  trendingLabel: string | null;
  trendingColor?: string;
}) {
  return (
    <div className="-mx-4 flex items-center gap-5 overflow-x-auto bg-brote-ink px-4 py-3 text-brote-cream no-scrollbar lg:mx-0 lg:rounded-card">
      <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brote-green">
        <span className="h-1.5 w-1.5 rounded-full bg-brote-green animate-live-pulse" aria-hidden />
        En vivo
      </span>
      <span className="shrink-0 whitespace-nowrap text-small text-brote-cream/70">
        <CountUp value={today} className="tnum font-display font-bold text-brote-cream" /> historias hoy
      </span>
      <span className="hidden shrink-0 whitespace-nowrap text-small text-brote-cream/70 sm:inline">
        <CountUp value={total} className="tnum font-display font-bold text-brote-cream" /> en tu radar
      </span>
      {trendingLabel && (
        <span
          className="ml-auto shrink-0 whitespace-nowrap text-small font-semibold"
          style={{ color: trendingColor ?? '#1FB57A' }}
        >
          ▲ En alza · {trendingLabel}
        </span>
      )}
    </div>
  );
}

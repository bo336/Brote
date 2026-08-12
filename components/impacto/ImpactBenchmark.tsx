'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMyImpactSince } from '@/lib/api/impacto';
import { BENCHMARKS, benchmarkComparisons, impactLines } from '@/lib/impact';
import { cn } from '@/lib/utils/cn';

/**
 * "Vos vs. una persona promedio" (user request 2026-08-12).
 *
 * The motivational half of the impact feature. A raw number ("ahorraste 900
 * litros") means nothing on its own; what lands is the same number set beside
 * what an ordinary person simply consumes over the same days. Two bars, one
 * sentence — and a collapsed panel underneath with the arithmetic for people
 * who want it. Simple by default, deep on demand.
 */
/** Percentage of an average person's consumption, never shown as a flat 0%. */
function formatRatio(ratio: number): string {
  const pct = ratio * 100;
  if (pct >= 10) return `${Math.round(pct)}%`;
  if (pct >= 1) return `${Math.round(pct * 10) / 10}%`.replace('.', ',');
  return '<1%';
}

export function ImpactBenchmark({ days = 30, className }: { days?: number; className?: string }) {
  const [openDetail, setOpenDetail] = useState(false);
  const q = useQuery({
    queryKey: ['impact-since', days],
    queryFn: () => fetchMyImpactSince(days),
    staleTime: 60_000,
  });

  if (q.isLoading) return <Skeleton className={cn('h-64 w-full', className)} />;

  const totals = q.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 };
  const rows = benchmarkComparisons(totals, days);
  const lines = impactLines(totals);

  if (rows.length === 0) {
    return (
      <Card className={cn('p-5 text-center', className)}>
        <p className="text-small text-muted-foreground">
          Cuando completes tus primeras acciones vas a ver acá cuánto ahorraste{' '}
          <span className="font-semibold text-foreground">comparado con una persona promedio</span>. 🌍
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="border-b border-border p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Últimos {days} días
        </p>
        <h3 className="mt-1 font-display text-h2 font-bold leading-tight">Vos vs. una persona promedio</h3>
        <p className="mt-1 text-small text-muted-foreground">
          Lo que ahorraste, al lado de lo que gasta alguien común en el mismo tiempo.
        </p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((r) => {
          // Bars are scaled against the larger of the two so a user who beats
          // the average still fills the track instead of overflowing it.
          const max = Math.max(r.saved, r.average) || 1;
          const savedPct = (r.saved / max) * 100;
          const avgPct = (r.average / max) * 100;
          return (
            <div key={r.key} className="p-4">
              <div className="mb-2.5 flex items-baseline gap-2">
                <span className="text-lg leading-none" aria-hidden>
                  {r.emoji}
                </span>
                <span className="font-display text-h3 font-bold">{r.label}</span>
                {/*
                  Never render a bare "0%": a real saving that happens to be
                  small next to a month of average consumption would look like
                  the feature is broken, and like the person achieved nothing.
                */}
                <span className="ml-auto text-caption font-semibold" style={{ color: r.color }}>
                  {formatRatio(r.ratio)}
                </span>
              </div>

              {/* Your saving */}
              <div className="mb-1.5">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-caption font-semibold">Ahorraste vos</span>
                  <span className="tnum text-small font-bold" style={{ color: r.color }}>
                    {r.savedLabel}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-pill bg-surface-2">
                  <div
                    className="h-full rounded-pill transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.max(savedPct, 2)}%`, background: r.color }}
                  />
                </div>
              </div>

              {/* The average person's consumption */}
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-caption text-muted-foreground">Gasta una persona promedio</span>
                  <span className="tnum text-small text-muted-foreground">{r.averageLabel}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-pill bg-surface-2">
                  <div
                    className="h-full rounded-pill bg-muted-foreground/35 transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.max(avgPct, 2)}%` }}
                  />
                </div>
              </div>

              <p className="mt-2.5 text-small font-medium">{r.headline} 💪</p>
            </div>
          );
        })}
      </div>

      {/* Depth for people who want the arithmetic, hidden for everyone else. */}
      <button
        onClick={() => setOpenDetail((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border p-3 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={openDetail}
      >
        Cómo calculamos esto
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', openDetail && 'rotate-180')} />
      </button>

      {openDetail && (
        <div className="space-y-3 border-t border-border bg-surface-2/50 p-4 text-caption leading-relaxed text-muted-foreground">
          <p>
            Cada acción de Brote tiene asociados factores de ahorro tomados de literatura ambiental publicada. Sumamos
            los de todas las acciones que registraste en los últimos {days} días.
          </p>
          <div>
            <p className="mb-1.5 font-semibold text-foreground">Consumo diario de referencia (persona promedio):</p>
            <table className="w-full">
              <tbody>
                {BENCHMARKS.map((b) => (
                  <tr key={b.key} className="border-b border-border/60 last:border-0">
                    <td className="py-1">{b.label}</td>
                    <td className="py-1 text-right tnum">
                      {b.format(b.perDay)} <span className="text-muted-foreground/70">/ día</span>
                    </td>
                    <td className="py-1 pl-3 text-right tnum">
                      × {days} d = {b.format(b.perDay * days)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lines.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-foreground">Tu ahorro acumulado en el período:</p>
              <ul className="space-y-0.5">
                {lines.map((l) => (
                  <li key={l.key} className="flex justify-between gap-2">
                    <span>{l.label}</span>
                    <span className="tnum">{l.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p>
            Los valores de referencia son estimaciones de orden de magnitud para Argentina (uso doméstico de agua,
            huella per cápita, residuos sólidos urbanos y electricidad residencial). Sirven para dimensionar tu
            esfuerzo, no como una medición certificada.
          </p>
        </div>
      )}
    </Card>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Lock, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipRail } from '@/components/ui/chip-rail';
import { fetchImpactoMensual, type MesImpacto } from '@/lib/api/plus';
import { formatCo2, formatEnergy, formatWaste, formatWater, formatWhole } from '@/lib/impact';

/**
 * "Tu impacto mes a mes" — el beneficio de Brote+ que se promete en la pantalla
 * de suscripción (0131, `mi_impacto_mensual`). Una medida por gráfico (nunca
 * dos ejes): se elige cuál con los chips. Sin Brote+, una vista borrosa y el
 * enlace, nunca datos inventados.
 */
const MEDIDAS = [
  { value: 'acciones', label: 'Acciones', color: '#1FB57A', fmt: (n: number) => formatWhole(n) },
  { value: 'agua_l', label: 'Agua', color: '#2DB4D4', fmt: formatWater },
  { value: 'co2_kg', label: 'CO₂', color: '#5B6CF0', fmt: formatCo2 },
  { value: 'residuos_kg', label: 'Residuos', color: '#C2703D', fmt: formatWaste },
  { value: 'energia_kwh', label: 'Energía', color: '#F4A62A', fmt: formatEnergy },
] as const;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function ImpactoMensual() {
  const q = useQuery({ queryKey: ['impacto-mensual'], queryFn: fetchImpactoMensual, staleTime: 5 * 60_000 });
  const [medida, setMedida] = useState<(typeof MEDIDAS)[number]['value']>('acciones');
  const def = MEDIDAS.find((m) => m.value === medida)!;

  const filas = useMemo(
    () =>
      (q.data?.meses ?? []).map((m: MesImpacto) => ({
        ...m,
        etiqueta: MESES[Number(m.mes.slice(5, 7)) - 1] ?? m.mes,
      })),
    [q.data],
  );
  const total = filas.reduce((t, f) => t + Number(f[medida] ?? 0), 0);

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-h3 font-bold">Tu impacto mes a mes</h2>
        <span className="inline-flex items-center gap-1 rounded-pill bg-brote-sun/15 px-2 py-0.5 text-caption font-semibold text-brote-sun">
          <Sparkles className="h-3 w-3" /> Brote+
        </span>
      </div>
      {q.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !q.data?.plus ? (
        <Card className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-x-4 top-4 flex h-28 items-end gap-2 opacity-40 blur-[3px]" aria-hidden>
            {[30, 45, 38, 60, 52, 70, 64, 80, 72, 88, 76, 95].map((h, i) => (
              <span key={i} className="flex-1 rounded-t-[4px] bg-primary/50" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="relative mt-28 flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-small font-semibold">Los últimos 12 meses, mes por mes</p>
              <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
                Agua, CO₂, residuos y energía que ahorraste cada mes, y en qué tema hiciste más. Viene con Brote+.
              </p>
              <Link href="/brote-plus" className="mt-2 inline-block text-small font-semibold text-primary hover:underline">
                Conocer Brote+
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <ChipRail options={MEDIDAS.map(({ value, label }) => ({ value, label }))} value={medida} onChange={(v) => setMedida(v as typeof medida)} layoutId="impacto-mensual" />
          <p className="mt-3 text-caption text-muted-foreground">
            En 12 meses: <span className="font-semibold text-foreground">{def.fmt(total)}</span>
          </p>
          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filas} margin={{ top: 6, right: 6, bottom: 0, left: -14 }} barCategoryGap={4}>
                <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: 'rgb(var(--muted-fg))' }} tickLine={false} axisLine={{ stroke: 'rgb(var(--border))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-fg))' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--fg) / 0.05)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))', color: 'rgb(var(--fg))', fontSize: 12 }}
                  formatter={(v: number) => [def.fmt(v), def.label]}
                />
                <Bar isAnimationActive={false} dataKey={medida} fill={def.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </section>
  );
}

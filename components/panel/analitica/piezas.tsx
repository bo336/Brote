'use client';

import { useId } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils/cn';

/**
 * Las piezas de /panel/analitica. Reglas que siguen todas (skill dataviz):
 *   · un gráfico = una medida (nunca dos ejes); varias medidas = varios gráficos;
 *   · un solo tono, el verde de marca, para todo lo que es "cuánto";
 *   · marcas finas, rejilla de un pixel, sin animación de entrada (tiene que
 *     estar dibujado aunque el navegador estrangule los cuadros);
 *   · los números van en tinta, nunca en el color de la marca;
 *   · todo valor que muestra un gráfico también está en texto o en una tabla.
 */

export const VERDE = '#1FB57A';
const fmt = new Intl.NumberFormat('es-AR');
export const n = (v: number | null | undefined) => fmt.format(Math.round(Number(v ?? 0)));
export const pct = (a: number, b: number) => (b > 0 ? `${Math.round((100 * a) / b)} %` : '—');

const tooltipEstilo = {
  borderRadius: 12,
  border: '1px solid rgb(var(--border))',
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
  fontSize: 12,
  boxShadow: '0 8px 24px -12px rgb(0 0 0 / 0.25)',
};

function etiquetaDia(dia: string) {
  const [, m, d] = dia.split('-');
  return `${d}/${m}`;
}

/** Un número protagonista con su etiqueta y, si hay, una línea de contexto. */
export function Cifra({ etiqueta, valor, detalle, destacada }: { etiqueta: string; valor: string; detalle?: string; destacada?: boolean }) {
  return (
    <div className="min-w-0 p-3.5">
      <p className="truncate text-caption text-muted-foreground">{etiqueta}</p>
      <p
        className={cn(
          'mt-0.5 font-display font-bold tnum',
          destacada ? 'bg-brand-gradient bg-clip-text text-display-l text-transparent' : 'text-h1',
        )}
      >
        {valor}
      </p>
      {detalle && <p className="mt-0.5 truncate text-caption text-muted-foreground">{detalle}</p>}
    </div>
  );
}

/** Una serie por día: área para lo continuo (activas), columnas para lo que se cuenta (altas, acciones). */
export function SerieDiaria({
  titulo,
  datos,
  clave,
  forma,
  total,
}: {
  titulo: string;
  datos: { dia: string; [k: string]: number | string }[];
  clave: string;
  forma: 'area' | 'columnas';
  total?: string;
}) {
  const gid = useId().replace(/:/g, '');
  const filas = datos.map((d) => ({ ...d, etiqueta: etiquetaDia(String(d.dia)) }));
  const comun = (
    <>
      <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
      <XAxis
        dataKey="etiqueta"
        tick={{ fontSize: 11, fill: 'rgb(var(--muted-fg))' }}
        tickLine={false}
        axisLine={{ stroke: 'rgb(var(--border))' }}
        interval="preserveStartEnd"
        minTickGap={28}
      />
      <YAxis
        tick={{ fontSize: 11, fill: 'rgb(var(--muted-fg))' }}
        tickLine={false}
        axisLine={false}
        allowDecimals={false}
        width={36}
      />
      <Tooltip
        contentStyle={tooltipEstilo}
        cursor={forma === 'area' ? { stroke: 'rgb(var(--muted-fg))', strokeWidth: 1 } : { fill: 'rgb(var(--fg) / 0.05)' }}
        formatter={(v: number) => [n(v), titulo]}
        labelFormatter={(l) => `Día ${l}`}
      />
    </>
  );
  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-2 px-1">
        <span className="text-small font-semibold">{titulo}</span>
        {total && <span className="text-caption text-muted-foreground tnum">{total}</span>}
      </figcaption>
      <div className="mt-2 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {forma === 'area' ? (
            <AreaChart data={filas} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VERDE} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={VERDE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {comun}
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey={clave}
                stroke={VERDE}
                strokeWidth={2}
                fill={`url(#${gid})`}
                activeDot={{ r: 4, stroke: 'rgb(var(--surface))', strokeWidth: 2, fill: VERDE }}
              />
            </AreaChart>
          ) : (
            <BarChart data={filas} margin={{ top: 6, right: 6, bottom: 0, left: -12 }} barCategoryGap={2}>
              {comun}
              <Bar isAnimationActive={false} dataKey={clave} fill={VERDE} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** Barras horizontales en HTML: una fila por cosa, el número en tinta al final. */
export function Barras({
  filas,
  max,
  vacio = 'Todavía no hay datos.',
}: {
  filas: { etiqueta: string; valor: number; detalle?: string }[];
  max?: number;
  vacio?: string;
}) {
  const tope = max ?? Math.max(1, ...filas.map((f) => f.valor));
  if (filas.length === 0) return <p className="py-3 text-small text-muted-foreground">{vacio}</p>;
  return (
    <ul className="space-y-2.5">
      {filas.map((f) => (
        <li key={f.etiqueta} className="group" title={`${f.etiqueta}: ${n(f.valor)}${f.detalle ? ` · ${f.detalle}` : ''}`}>
          <div className="flex items-baseline justify-between gap-3 text-small">
            <span className="min-w-0 truncate">{f.etiqueta}</span>
            <span className="shrink-0 font-semibold tnum">
              {n(f.valor)}
              {f.detalle && <span className="ml-1.5 font-normal text-muted-foreground">{f.detalle}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-pill bg-surface-2">
            <div
              className="h-2 rounded-pill transition-[filter] duration-150 group-hover:brightness-110"
              style={{ width: `${Math.max(f.valor > 0 ? 2 : 0, (100 * f.valor) / tope)}%`, backgroundColor: VERDE }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * La tabla de cohortes: una fila por semana de alta, una columna por semana
 * siguiente. El tono es UNO (verde) de claro a oscuro según el porcentaje; el
 * número siempre está escrito en la celda, así el color nunca es lo único.
 */
export function Cohortes({ filas }: { filas: { semana: string; tamano: number; retencion: (number | null)[] }[] }) {
  if (filas.length === 0) return <p className="py-3 text-small text-muted-foreground">Todavía no hay altas suficientes.</p>;
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[520px] border-separate border-spacing-[2px] text-caption">
        <thead>
          <tr className="text-muted-foreground">
            <th className="px-2 py-1.5 text-left font-medium">Semana de alta</th>
            <th className="px-2 py-1.5 text-right font-medium">Personas</th>
            {Array.from({ length: 7 }, (_, i) => (
              <th key={i} className="px-1 py-1.5 text-center font-medium">
                S{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.semana}>
              <td className="whitespace-nowrap px-2 py-1.5 text-small">{etiquetaDia(f.semana)}</td>
              <td className="px-2 py-1.5 text-right text-small font-semibold tnum">{n(f.tamano)}</td>
              {f.retencion.map((v, i) => (
                <td
                  key={i}
                  className="h-8 min-w-[44px] rounded-[6px] text-center tnum"
                  style={
                    v === null
                      ? undefined
                      : {
                          backgroundColor: `rgb(31 181 122 / ${0.08 + (0.82 * v) / 100})`,
                          color: v >= 55 ? '#06291B' : undefined,
                        }
                  }
                  title={v === null ? 'Esa semana todavía no llegó' : `${v} % volvió en la semana ${i + 1}`}
                >
                  {v === null ? <span className="text-muted-foreground/50">·</span> : `${v}%`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Una tarjeta de sección del tablero, con eyebrow y título. */
export function Bloque({ eyebrow, titulo, children, className }: { eyebrow?: string; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-card border border-border bg-surface p-4 shadow-soft', className)}>
      {eyebrow && <p className="eyebrow text-muted-foreground">{eyebrow}</p>}
      <h2 className="mb-3 mt-0.5 font-display text-h3 font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Circle, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils/cn';

/**
 * Las piezas de las que está hecho el panel. Una sola manera de mostrar un
 * número, una tabla o un estado, para que moverse entre secciones no sea
 * aprender otra pantalla:
 *   · los números grandes y en tinta, con qué son y contra qué se comparan;
 *   · cada dato con su unidad o su contexto: un número suelto no dice nada;
 *   · el color sólo significa algo (verde bien, coral mal, sol atención).
 */

const fmt = new Intl.NumberFormat('es-AR');
export const num = (v: number | string | null | undefined) => fmt.format(Math.round(Number(v ?? 0)));
export const pesos = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
export const fecha = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—');
export const fechaHora = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const hace = (v: string | null | undefined) => {
  if (!v) return 'nunca';
  const min = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (min < 2) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-hairline pb-5">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
        <h1 className="mt-0.5 font-display text-[1.85rem] font-extrabold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
  sinPadding,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Para tablas que van de borde a borde. */
  sinPadding?: boolean;
}) {
  return (
    <section className={cn('min-w-0 overflow-hidden rounded-card border border-border bg-surface', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-h3 font-bold leading-snug">{title}</h2>}
            {description && <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={sinPadding ? undefined : 'p-5'}>{children}</div>
    </section>
  );
}

/** Cuánto cambió contra el período anterior. Sube en verde, baja en coral. */
export function Delta({ actual, previo, sufijo }: { actual: number; previo: number; sufijo?: string }) {
  const a = Number(actual ?? 0);
  const p = Number(previo ?? 0);
  if (a === p) {
    return (
      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
        <Minus className="h-3 w-3" /> igual{sufijo ? ` ${sufijo}` : ''}
      </span>
    );
  }
  const sube = a > p;
  const texto = p === 0 ? `+${num(a)}` : `${sube ? '+' : '−'}${Math.round((Math.abs(a - p) / p) * 100)} %`;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap text-caption font-semibold', sube ? 'text-brote-green' : 'text-brote-coral')}>
      <Icono className="h-3.5 w-3.5" /> {texto}
      {sufijo && <span className="ml-1 font-normal text-muted-foreground">{sufijo}</span>}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  delta,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: ReactNode;
  href?: string;
  tone?: 'bien' | 'atencion' | 'mal';
}) {
  const cuerpo = (
    <>
      <p className="text-small font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-[2.1rem] font-extrabold leading-none tracking-tight tnum',
          typeof value === 'string' && value.length > 7 && 'max-sm:text-[1.4rem]',
          tone === 'bien' && 'text-brote-green',
          tone === 'atencion' && 'text-brote-sun',
          tone === 'mal' && 'text-brote-coral',
        )}
      >
        {value}
      </p>
      {(delta || hint) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption leading-snug text-muted-foreground">
          {delta}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </>
  );
  const clase = 'block min-w-0 rounded-card border border-border bg-surface p-5';
  return href ? (
    <Link href={href} className={cn(clase, 'transition-colors hover:border-primary/40')}>
      {cuerpo}
    </Link>
  ) : (
    <div className={clase}>{cuerpo}</div>
  );
}

export function StatGrid({ children, columnas = 4 }: { children: ReactNode; columnas?: 2 | 3 | 4 | 5 }) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        columnas === 2 && 'grid-cols-1 sm:grid-cols-2',
        columnas === 3 && 'grid-cols-2 lg:grid-cols-3',
        columnas === 4 && 'grid-cols-2 lg:grid-cols-4',
        columnas === 5 && 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
      )}
    >
      {children}
    </div>
  );
}

export type Tono = 'ok' | 'atencion' | 'mal' | 'neutro' | 'info';

export function Etiqueta({ tono = 'neutro', children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-caption font-semibold',
        tono === 'ok' && 'bg-brote-green/15 text-brote-green',
        tono === 'atencion' && 'bg-brote-sun/20 text-brote-sun',
        tono === 'mal' && 'bg-brote-coral/15 text-brote-coral',
        tono === 'info' && 'bg-brote-aqua/15 text-brote-aqua',
        tono === 'neutro' && 'bg-surface-2 text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** La tabla del panel: se desplaza sola en el teléfono, nunca rompe la página. */
export function Tabla({ children, minimo = 640 }: { children: ReactNode; minimo?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-small" style={{ minWidth: minimo }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, derecha, className }: { children?: ReactNode; derecha?: boolean; className?: string }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-hairline bg-surface-2/60 px-4 py-2.5 text-caption font-semibold text-muted-foreground',
        derecha ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, derecha, className, colSpan }: { children?: ReactNode; derecha?: boolean; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn('border-b border-hairline px-4 py-3 align-middle', derecha && 'text-right tnum', className)}>{children}</td>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-small text-muted-foreground">{children}</p>;
}

export function Cargando({ alto = 'h-40', filas = 3 }: { alto?: string; filas?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className={cn('w-full rounded-card', alto)} />
      ))}
    </div>
  );
}

export function ErrorCarga({ onReintentar, mensaje }: { onReintentar?: () => void; mensaje?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-12 text-center">
      <AlertTriangle className="h-7 w-7 text-brote-sun" />
      <p className="max-w-md text-small text-muted-foreground">{mensaje ?? 'No se pudieron traer estos datos. Puede ser la conexión.'}</p>
      {onReintentar && (
        <Button variant="secondary" size="sm" onClick={onReintentar}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      )}
    </div>
  );
}

export function Actualizar({ onClick, cargando }: { onClick: () => void; cargando?: boolean }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick} loading={cargando}>
      <RefreshCw className="h-4 w-4" /> Actualizar
    </Button>
  );
}

/** Un interruptor con qué hace, de una sola forma en todo el panel. */
export function FilaInterruptor({
  titulo,
  detalle,
  valor,
  onCambiar,
  deshabilitado,
}: {
  titulo: string;
  detalle?: string;
  valor: boolean;
  onCambiar: (v: boolean) => void;
  deshabilitado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-small font-semibold">{titulo}</p>
        {detalle && <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{detalle}</p>}
      </div>
      <Switch checked={valor} onCheckedChange={onCambiar} disabled={deshabilitado} aria-label={titulo} />
    </div>
  );
}

/** Un paso de una lista de "lo que falta": hecho o no, sin vueltas. */
export function Requisito({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-small">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className={ok ? '' : 'text-muted-foreground'}>{children}</span>
    </li>
  );
}

/** Una barra de cuánto se usó de un tope. */
export function Medidor({ usado, tope, etiqueta, detalle }: { usado: number; tope: number; etiqueta: string; detalle?: string }) {
  const p = tope > 0 ? Math.min(100, (usado / tope) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-small">
        <span className="font-medium">{etiqueta}</span>
        <span className="font-semibold tnum">{Math.round(p)} %</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-pill bg-surface-2">
        <div
          className={cn('h-full rounded-pill', p >= 85 ? 'bg-brote-coral' : p >= 65 ? 'bg-brote-sun' : 'bg-brote-green')}
          style={{ width: `${Math.max(p, 1)}%` }}
        />
      </div>
      {detalle && <p className="mt-1 text-caption text-muted-foreground">{detalle}</p>}
    </div>
  );
}

/** Pestañas simples dentro de una página. */
export function Pestanas<T extends string>({
  valor,
  onCambiar,
  opciones,
}: {
  valor: T;
  onCambiar: (v: T) => void;
  opciones: { value: T; label: string; badge?: number }[];
}) {
  return (
    <div role="tablist" className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-hairline px-1">
      {opciones.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={valor === o.value}
          onClick={() => onCambiar(o.value)}
          className={cn(
            '-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-small font-semibold transition-colors',
            valor === o.value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
          {o.badge ? <span className="rounded-pill bg-brote-coral px-1.5 text-caption font-bold text-white tnum">{o.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

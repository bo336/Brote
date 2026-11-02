'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCupoProyectos, useMiRango } from '@/hooks/use-rango';
import type { MiRango, RangoCompleto } from '@/lib/api/rangos';
import { ETIQUETA_REQUISITO, ORDEN_REQUISITOS, type ClaveRequisito } from '@/lib/rangos';
import { cn } from '@/lib/utils/cn';

/**
 * Tu rango de este período: quién sos ahora, a qué vas camino y exactamente qué
 * falta. El puesto en la tabla no decide nada; deciden estos requisitos.
 */

function diasTexto(n: number) {
  return n <= 1 ? 'Termina hoy' : `Quedan ${n} días`;
}

/** Lo que conviene mirar: sostener lo que tenés si venís abajo, o el próximo. */
function objetivo(d: MiRango): { rango: RangoCompleto | null; modo: 'sostener' | 'subir' | 'tope' } {
  const por = (t: number) => d.rangos.find((r) => r.tier === t) ?? null;
  if (d.camino < d.tier) return { rango: por(d.tier), modo: 'sostener' };
  if (d.camino >= 7) return { rango: por(7), modo: 'tope' };
  return { rango: por(d.camino + 1), modo: 'subir' };
}

export function TuRango() {
  const q = useMiRango();
  const cupo = useCupoProyectos();
  const [escalera, setEscalera] = useState(false);

  if (q.isLoading) return <Skeleton className="h-52 w-full" />;
  const d = q.data;
  if (!d) return null;

  const actual = d.rangos.find((r) => r.tier === d.tier);
  const camino = d.rangos.find((r) => r.tier === d.camino);
  const { rango: meta, modo } = objetivo(d);
  const periodo = d.periodo.tipo === 'mes' ? 'este mes' : 'esta semana';
  const claves = meta ? ORDEN_REQUISITOS.filter((k: ClaveRequisito) => (meta.requisitos[k] ?? 0) > 0) : [];
  const previoFalta = meta?.previo != null && d.tier < meta.previo ? d.rangos.find((r) => r.tier === meta.previo) : null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-4" style={{ background: actual ? `${actual.color}14` : undefined }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="eyebrow block text-muted-foreground">Tu rango</span>
            <p className="mt-0.5 font-display text-h2 font-extrabold leading-tight" style={{ color: actual?.color }}>
              {actual?.nombre}
            </p>
          </div>
          <span className="shrink-0 rounded-pill border border-border bg-surface px-2.5 py-1 text-caption font-medium">
            {diasTexto(d.periodo.quedan)}
          </span>
        </div>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{actual?.descripcion}</p>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-small font-semibold">
          {modo === 'tope'
            ? `Vas camino a ${camino?.nombre}, lo más alto de Brote.`
            : modo === 'sostener'
              ? `Para seguir siendo ${meta?.nombre} ${periodo}:`
              : `Para llegar a ${meta?.nombre} ${periodo}:`}
        </p>

        {modo !== 'tope' && (
          <ul className="space-y-2.5">
            {claves.map((k) => {
              const pide = meta?.requisitos[k] ?? 0;
              const hizo = Number(d.metricas[k] ?? 0);
              const listo = hizo >= pide;
              return (
                <li key={k}>
                  <div className="flex items-baseline justify-between gap-3 text-caption">
                    <span className="min-w-0 text-muted-foreground">{ETIQUETA_REQUISITO[k].larga}</span>
                    <span className={cn('shrink-0 font-semibold tnum', listo && 'text-brote-green')}>
                      {Math.min(hizo, pide)} de {pide}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-2">
                    <div
                      className={cn('h-full rounded-pill', listo ? 'bg-brote-green' : 'bg-primary')}
                      style={{ width: `${pide > 0 ? Math.min(100, (hizo / pide) * 100) : 0}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {previoFalta && (
          <p className="text-caption leading-relaxed text-muted-foreground">
            {meta?.nombre} también pide haber cerrado el período anterior como {previoFalta.nombre}.
          </p>
        )}
        {d.tier > 1 && (
          <p className="text-caption leading-relaxed text-muted-foreground">
            {d.margen_usado
              ? 'Ya usaste tu margen: si este período no llegás, bajás.'
              : 'Si un período te quedás justo abajo, no bajás de una: tenés un período de margen.'}
          </p>
        )}
        {cupo.data?.adulto && (
          <p className="text-caption leading-relaxed text-muted-foreground">
            {cupo.data.cupo > 0
              ? `Como ${cupo.data.efectivo_nombre} podés organizar ${cupo.data.cupo === 1 ? '1 proyecto' : `${cupo.data.cupo} proyectos`} a la vez.`
              : `Desde ${cupo.data.min_nombre} podés organizar proyectos.`}
          </p>
        )}

        <button
          type="button"
          onClick={() => setEscalera((v) => !v)}
          aria-expanded={escalera}
          className="flex w-full items-center justify-between gap-2 border-t border-hairline pt-3 text-small font-medium"
        >
          Los siete rangos
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', escalera && 'rotate-180')} />
        </button>
        {escalera && (
          <ol className="space-y-2">
            {[...d.rangos].reverse().map((r) => (
              <li key={r.tier} className={cn('rounded-button border border-border p-3', r.tier === d.tier && 'border-primary/40 bg-primary/5')}>
                <p className="flex items-center gap-2 text-small font-semibold">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
                  {r.nombre}
                  {r.tier === d.tier && <span className="text-caption font-normal text-muted-foreground">· vos</span>}
                </p>
                <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{r.descripcion}</p>
                {Object.keys(r.requisitos).length > 0 && (
                  <p className="mt-1 text-caption leading-relaxed">
                    {ORDEN_REQUISITOS.filter((k) => (r.requisitos[k] ?? 0) > 0)
                      .map((k) => `${r.requisitos[k]} ${ETIQUETA_REQUISITO[k].corta}`)
                      .join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="text-caption leading-relaxed text-muted-foreground">
          Tu rango dice qué hiciste en el último período y se sostiene haciendo. Tu nivel (Semilla, Brote…) es por todos tus puntos y nunca baja.
        </p>
      </div>
    </Card>
  );
}

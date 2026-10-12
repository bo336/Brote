'use client';

import { Minus, Plus } from 'lucide-react';
import { pistaDeImpacto } from '@/lib/inicio/impacto';
import { acotar, cantidadTexto, impactoDeCantidad, type Medida } from '@/lib/acciones/presentar';
import { cn } from '@/lib/utils/cn';

/**
 * "¿Cuántas cuadras caminaste?" — un contador con atajos y lo que suma esa
 * cantidad, en vivo. El servidor acota igual; acá sólo se muestra.
 */
export function CantidadSelector({
  medida,
  valor,
  onChange,
  dominio,
}: {
  medida: Medida;
  valor: number;
  onChange: (n: number) => void;
  dominio?: string;
}) {
  const paso = medida.paso || 1;
  const atajos = Array.from(new Set([medida.min, medida.def, Math.round(medida.def * 2), medida.max]))
    .map((n) => acotar(medida, n))
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .sort((a, b) => a - b)
    .slice(0, 4);
  const imp = impactoDeCantidad(medida, valor);
  const pista = pistaDeImpacto({ ...imp, actions: 1 }, dominio);

  return (
    <div className="rounded-card border border-border bg-surface-2/50 p-3.5">
      <p className="text-small font-semibold">{medida.pregunta}</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onChange(acotar(medida, valor - paso))}
          disabled={valor <= medida.min}
          aria-label="Menos"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-40"
        >
          <Minus className="h-5 w-5" aria-hidden />
        </button>
        <span className="min-w-[7.5rem] text-center font-display text-h2 font-bold tnum" aria-live="polite">
          {cantidadTexto(medida, valor)}
        </span>
        <button
          type="button"
          onClick={() => onChange(acotar(medida, valor + paso))}
          disabled={valor >= medida.max}
          aria-label="Más"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-40"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {atajos.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={n === valor}
            className={cn(
              'rounded-pill border px-3 py-1 text-caption font-medium tnum transition-colors',
              n === valor ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-muted-foreground hover:text-foreground',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {pista && (
        <p className="mt-3 text-center text-small font-semibold tnum" style={{ color: pista.color }}>
          Suma {pista.texto}
        </p>
      )}
    </div>
  );
}

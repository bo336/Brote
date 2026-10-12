'use client';

import { Check } from 'lucide-react';
import { CONTEXTO, GRUPOS_CONTEXTO, type TipoCuenta } from '@/lib/acciones/reglas';
import { cn } from '@/lib/utils/cn';

/**
 * "Tu casa y tu día": lo que tiene la persona, en chips agrupados. Lo usan el
 * onboarding, Ajustes y la tarjeta de Inicio. Las claves que se deducen
 * (mascota) o se ganan haciendo (compostera, huerta: también se pueden marcar
 * acá) no se esconden salvo la deducida; a un chico no se le pregunta por auto,
 * hijos ni trabajo.
 */
export function ContextoChips({
  cuenta,
  valor,
  onChange,
}: {
  cuenta: TipoCuenta;
  valor: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const visibles = CONTEXTO.filter((c) => !c.derivada && !(cuenta === 'kid' && c.adultos));
  return (
    <div className="space-y-4">
      {GRUPOS_CONTEXTO.map((g) => {
        const items = visibles.filter((c) => c.grupo === g.grupo);
        if (items.length === 0) return null;
        return (
          <div key={g.grupo}>
            <p className="mb-2 text-small font-semibold">{g.titulo}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((c) => {
                const on = valor[c.clave] === true;
                return (
                  <button
                    key={c.clave}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ ...valor, [c.clave]: !on })}
                    className={cn(
                      'press inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border px-3.5 py-2 text-small font-medium transition-colors',
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-foreground hover:border-primary/40',
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Pasa el contexto a "respondido" con un false explícito en lo no marcado. */
export function contextoRespondido(valor: Record<string, unknown>, cuenta: TipoCuenta): Record<string, unknown> {
  const out: Record<string, unknown> = { respondido: true };
  for (const c of CONTEXTO) {
    if (c.derivada || (cuenta === 'kid' && c.adultos)) continue;
    out[c.clave] = valor[c.clave] === true;
  }
  if (typeof valor.compra === 'string') out.compra = valor.compra;
  return out;
}

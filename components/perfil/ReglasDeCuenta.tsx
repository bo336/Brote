'use client';

import { useState } from 'react';
import { Check, ChevronDown, ShieldCheck } from 'lucide-react';
import { ACCOUNT_TYPES, type AccountType } from '@/components/perfil/AccountTypeBadge';
import { EXPLICACION } from '@/lib/cuentas/reglas';
import { cn } from '@/lib/utils/cn';

/**
 * Lo que puede hacer esta cuenta, y cómo la cuida Brote — dicho en la cuenta
 * misma. El tipo cambia en silencio qué acciones, noticias, secciones y
 * publicidad aparecen; si no se explica, nadie entiende por qué no ve el
 * Mercado o no puede crear un proyecto. Las otras dos cuentas se pueden abrir
 * para comparar (una familia con chicos lo pregunta).
 */
export function ReglasDeCuenta({ tipo }: { tipo: AccountType | undefined }) {
  const propio = tipo ?? 'adult';
  const [abierta, setAbierta] = useState<AccountType | null>(null);
  const otros = (['kid', 'teen', 'adult'] as AccountType[]).filter((t) => t !== propio);

  return (
    <div className="space-y-3">
      <Bloque tipo={propio} />
      <div className="border-t border-hairline pt-2">
        {otros.map((t) => (
          <div key={t}>
            <button
              type="button"
              onClick={() => setAbierta((a) => (a === t ? null : t))}
              aria-expanded={abierta === t}
              className="flex w-full items-center justify-between gap-2 py-2 text-left text-small text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Cómo es una {ACCOUNT_TYPES[t].label.toLowerCase()}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', abierta === t && 'rotate-180')} />
            </button>
            {abierta === t && (
              <div className="pb-2">
                <Bloque tipo={t} compacto />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bloque({ tipo, compacto = false }: { tipo: AccountType; compacto?: boolean }) {
  const e = EXPLICACION[tipo];
  const color = ACCOUNT_TYPES[tipo].color;
  return (
    <div className={cn('grid gap-3', !compacto && 'sm:grid-cols-2')}>
      <div>
        <p className="eyebrow mb-1.5" style={{ color }}>
          Podés
        </p>
        <ul className="space-y-1.5">
          {e.podes.map((x) => (
            <li key={x} className="flex items-start gap-2 text-small leading-snug">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} aria-hidden />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-1.5 text-muted-foreground">Así te cuidamos</p>
        <ul className="space-y-1.5">
          {e.cuidado.map((x) => (
            <li key={x} className="flex items-start gap-2 text-small leading-snug text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

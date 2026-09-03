'use client';

import { useTranslations } from 'next-intl';
import { CountUp } from '@/components/ui/count-up';
import type { PayloadDatoVivo, PayloadMicrolectura } from '@/lib/academia/types';
import { Enunciado } from './piezas';

/**
 * Los dos pasos que no se corrigen.
 *
 * No tienen `entrega_id` y por eso no pueden quedar "sin responder" trabando el
 * cierre de la sesión. Son el momento en que se enseña algo antes de pedirlo:
 * sin ellos la Academia sería un examen, no una clase.
 */

export function Microlectura({ payload }: { payload: PayloadMicrolectura }) {
  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda} />
      <div className="space-y-3 text-body leading-relaxed">
        {payload.cuerpo.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {payload.destacado ? (
        <p className="mt-4 border-l-2 border-primary pl-3 font-display text-h3 font-bold leading-snug text-primary">
          {payload.destacado}
        </p>
      ) : null}
    </div>
  );
}

export function DatoVivo({ payload }: { payload: PayloadDatoVivo }) {
  const t = useTranslations('academia');
  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda} />
      <p className="font-display text-display-l font-extrabold leading-none">
        <CountUp
          value={payload.valor}
          className="tnum"
          format={(n) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)}
        />
        <span className="ml-1.5 text-h2 font-bold text-muted-foreground">{payload.unidad}</span>
      </p>
      <p className="mt-3 text-body leading-relaxed">{payload.que_significa}</p>
      <span className="sr-only">
        {t('tuValor', { valor: payload.valor, unidad: payload.unidad })}
      </span>
    </div>
  );
}

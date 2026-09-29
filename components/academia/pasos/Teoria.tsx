'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Calculator, Lightbulb } from 'lucide-react';
import type { PayloadEjemplo, PayloadTeoria } from '@/lib/academia/modelo';
import { Grafico } from './piezas';

/**
 * Las tarjetas que enseñan. Son la diferencia entre una lección y un
 * cuestionario: cada idea se presenta antes de pedirle a alguien que la use.
 *
 * Tipografía de lectura (Inter, renglón generoso, ancho de columna cómodo) y
 * un solo elemento que destaca por tarjeta: el dato clave, la lista o el
 * ejemplo. Nunca un muro de texto sin jerarquía.
 */
export function Teoria({ payload, color }: { payload: PayloadTeoria; color: string }) {
  const t = useTranslations('arbol');
  const quieto = useReducedMotion();
  return (
    <article>
      <p className="eyebrow flex items-center gap-1.5" style={{ color }}>
        <Lightbulb className="h-3.5 w-3.5" aria-hidden />
        {t('idea')}
      </p>
      <h2 className="mt-1.5 text-balance font-display text-h1 font-extrabold leading-tight">{payload.titulo}</h2>

      {payload.destacado ? (
        <motion.div
          className="mt-4 flex items-baseline gap-3 rounded-card p-4"
          style={{ backgroundColor: `${color}14`, border: `1px solid ${color}40` }}
          initial={quieto ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="tnum shrink-0 font-display text-display-l font-extrabold leading-none" style={{ color }}>
            {payload.destacado.valor}
          </span>
          <span className="text-small leading-snug">{payload.destacado.texto}</span>
        </motion.div>
      ) : null}

      <div className="mt-4 space-y-3.5">
        {payload.cuerpo.map((p, i) => (
          <p key={i} className="max-w-prose text-body leading-relaxed">
            {p}
          </p>
        ))}
      </div>

      {payload.lista?.length ? (
        <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
          {payload.lista.map((x, i) => (
            <li key={i} className="flex items-start gap-2.5 text-small leading-relaxed">
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              {x}
            </li>
          ))}
        </ul>
      ) : null}

      {payload.datos ? (
        <div className="mt-4">
          <Grafico datos={payload.datos} color={color} />
        </div>
      ) : null}

      {payload.nota ? (
        <p className="mt-4 border-l-2 pl-3 text-small italic leading-relaxed text-muted-foreground" style={{ borderColor: color }}>
          {payload.nota}
        </p>
      ) : null}
    </article>
  );
}

/**
 * Un ejemplo resuelto: el planteo, cada paso numerado y el resultado. Es lo
 * que se muestra antes del primer cálculo de una sesión, así nadie tiene que
 * adivinar el método en el momento de ser evaluado.
 */
export function Ejemplo({ payload, color }: { payload: PayloadEjemplo; color: string }) {
  const t = useTranslations('arbol');
  return (
    <article>
      <p className="eyebrow flex items-center gap-1.5" style={{ color }}>
        <Calculator className="h-3.5 w-3.5" aria-hidden />
        {t('ejemploResuelto')}
      </p>
      <h2 className="mt-1.5 text-balance font-display text-h1 font-extrabold leading-tight">{payload.titulo}</h2>
      <p className="mt-3 max-w-prose rounded-card bg-surface-2 p-4 text-body leading-relaxed">{payload.planteo}</p>
      {payload.datos ? (
        <div className="mt-4">
          <Grafico datos={payload.datos} color={color} />
        </div>
      ) : null}
      <ol className="mt-4 space-y-3">
        {payload.pasos.map((p, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-small font-extrabold text-white"
              style={{ backgroundColor: color }}
              aria-hidden
            >
              {i + 1}
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-body leading-relaxed">
              <span className="sr-only">{t('pasoN', { n: i + 1 })}: </span>
              {p}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-card border-2 p-4 text-body font-semibold leading-relaxed" style={{ borderColor: color }}>
        {payload.resultado}
      </p>
    </article>
  );
}

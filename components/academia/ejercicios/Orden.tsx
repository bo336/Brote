'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { getDomainColor } from '@/lib/domains';
import type {
  Opcion,
  PayloadCadenaCausal,
  PayloadOrdenarSecuencia,
  PayloadRankingImpacto,
  RespuestaCorregida,
  RespuestaEnviada,
} from '@/lib/academia/types';
import {
  Enunciado,
  Ficha,
  ItemAnimado,
  Ranura,
  claveArray,
  useAnuncio,
  useReportar,
  type Marca,
  type PropsEjercicio,
} from './piezas';
import { cn } from '@/lib/utils/cn';

/**
 * Los tres tipos que se resuelven poniendo cosas en orden.
 *
 * Sin arrastre. Se toca un fragmento y va a la primera ranura libre; se toca
 * uno ya puesto y vuelve al banco. Dos toques, cero gestos finos, y funciona
 * igual con teclado que con el pulgar — que era el punto.
 *
 * El movimiento lo hace `layout` de framer-motion sobre cada ítem: la ficha
 * viaja del banco a su ranura en vez de desaparecer de un lado y aparecer del
 * otro, que es lo que hace que se entienda qué pasó.
 */

interface PropsSecuenciador {
  fragmentos: Opcion[];
  /** Cuántas ranuras hay. Menos que `fragmentos` ⇒ el resto son señuelos. */
  ranuras: number;
  bloqueado: boolean;
  correccion: RespuestaCorregida | null;
  /**
   * El `onCambio` del padre, tal cual. NO un envoltorio: un arrow nuevo por
   * render entra en las dependencias del efecto, el efecto vuelve a llamar a
   * `onCambio` con un objeto nuevo, el padre re-renderiza y arranca de nuevo —
   * un bucle infinito en cuanto se completa el orden. El nombre del campo va
   * aparte justamente para que la función pueda ser estable.
   */
  onCambio: (r: RespuestaEnviada | null) => void;
  campo: 'orden' | 'cadena';
  /** Chip de dominio al lado del texto, solo en `ranking_impacto`. */
  conDominio?: boolean;
  idAnimacion: string;
}

function Secuenciador({
  fragmentos,
  ranuras,
  bloqueado,
  correccion,
  onCambio,
  campo,
  conDominio,
  idAnimacion,
}: PropsSecuenciador) {
  const t = useTranslations('academia');
  const { anunciar, region } = useAnuncio();
  const [puestos, setPuestos] = useState<string[]>([]);

  const porId = useMemo(() => new Map(fragmentos.map((f) => [f.id, f])), [fragmentos]);
  const banco = fragmentos.filter((f) => !puestos.includes(f.id));
  const clave = claveArray(correccion);
  const hayCorreccion = correccion !== null;

  useReportar(onCambio, puestos.length === ranuras ? ({ [campo]: puestos } as RespuestaEnviada) : null);

  function poner(id: string) {
    if (bloqueado || puestos.length >= ranuras) return;
    setPuestos((p) => [...p, id]);
    anunciar(t('colocado', { cosa: porId.get(id)?.texto ?? '', lugar: t('puesto', { n: puestos.length + 1 }) }));
  }

  function sacar(id: string) {
    if (bloqueado) return;
    setPuestos((p) => p.filter((x) => x !== id));
    anunciar(t('quitado', { cosa: porId.get(id)?.texto ?? '' }));
  }

  const marcaDePosicion = (i: number, id: string): Marca => {
    if (!hayCorreccion || clave.length === 0) return 'ninguna';
    return clave[i] === id ? 'bien' : 'mal';
  };

  return (
    <div>
      {region}

      <ol className="grid gap-2">
        {Array.from({ length: ranuras }, (_, i) => {
          const id = puestos[i];
          const frag = id ? porId.get(id) : undefined;
          return (
            <li key={i}>
              <ItemAnimado id={id ? `${idAnimacion}-${id}` : `${idAnimacion}-hueco-${i}`}>
                <Ranura
                  vacia={!id}
                  disabled={bloqueado || !id}
                  marca={id ? marcaDePosicion(i, id) : 'ninguna'}
                  onClick={() => id && sacar(id)}
                  className="flex w-full items-center gap-2.5"
                  aria-label={
                    frag
                      ? `${t('puesto', { n: i + 1 })}: ${frag.texto}. ${t('quitar')}`
                      : `${t('puesto', { n: i + 1 })}. ${t('sinPoner')}`
                  }
                >
                  <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-bold">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">{frag?.texto ?? t('sinPoner')}</span>
                  {conDominio && frag?.dominio ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: getDomainColor(frag.dominio) }}
                      aria-hidden
                    />
                  ) : null}
                  {frag && !bloqueado ? (
                    <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : null}
                </Ranura>
              </ItemAnimado>
            </li>
          );
        })}
      </ol>

      {banco.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
          {banco.map((f) => (
            <ItemAnimado key={f.id} id={`${idAnimacion}-${f.id}`}>
              <Ficha disabled={bloqueado} onClick={() => poner(f.id)} className="flex items-center gap-2">
                {conDominio && f.dominio ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getDomainColor(f.dominio) }}
                    aria-hidden
                  />
                ) : null}
                {f.texto}
              </Ficha>
            </ItemAnimado>
          ))}
        </div>
      ) : null}

      {/* El orden correcto, cuando ya se respondió. Marcar el error sin mostrar
          cuál era deja a la persona sabiendo que falló y nada más. */}
      {hayCorreccion && clave.length > 0 && !correccion.correcto ? (
        <ol className="mt-4 space-y-1 border-t border-hairline pt-3">
          {clave.map((id, i) => (
            <li key={id} className="flex items-start gap-2 text-small">
              <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brote-green/15 text-caption font-bold text-brote-green">
                {i + 1}
              </span>
              <span className={cn('min-w-0 flex-1', puestos[i] === id && 'text-muted-foreground')}>
                {porId.get(id)?.texto ?? id}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function OrdenarSecuencia({
  payload,
  onCambio,
  bloqueado,
  correccion,
}: PropsEjercicio<PayloadOrdenarSecuencia>) {
  const t = useTranslations('academia');
  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaOrdenar')} />
      <p className="mb-3 text-small font-medium">{payload.consigna}</p>
      <Secuenciador
        idAnimacion="sec"
        fragmentos={payload.fragmentos}
        ranuras={payload.fragmentos.length}
        bloqueado={bloqueado}
        correccion={correccion}
        onCambio={onCambio}
        campo="orden"
      />
    </div>
  );
}

export function RankingImpacto({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadRankingImpacto>) {
  const t = useTranslations('academia');
  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaRanking')} />
      <p className="mb-3 text-small font-medium">{payload.consigna}</p>
      <Secuenciador
        idAnimacion="rank"
        conDominio
        fragmentos={payload.opciones}
        ranuras={payload.opciones.length}
        bloqueado={bloqueado}
        correccion={correccion}
        onCambio={onCambio}
        campo="orden"
      />
    </div>
  );
}

export function CadenaCausal({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadCadenaCausal>) {
  const t = useTranslations('academia');
  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaCadena')} />
      <Secuenciador
        idAnimacion="cadena"
        fragmentos={payload.fragmentos}
        ranuras={payload.largo_cadena}
        bloqueado={bloqueado}
        correccion={correccion}
        onCambio={onCambio}
        campo="cadena"
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  PayloadElegirLaAccion,
  PayloadMitoODato,
  PayloadOpcionMultiple,
} from '@/lib/academia/types';
import { Enunciado, Ficha, claveArray, useReportar, type Marca, type PropsEjercicio } from './piezas';

/**
 * Los tres tipos de una sola elección.
 *
 * Comparten el mismo esqueleto y la misma corrección: se marca lo que se eligió
 * y, si estuvo mal, se marca además cuál era. Marcar solo el error deja a la
 * persona sabiendo que se equivocó y sin saber en qué.
 */

function marcaDe(token: string, elegido: string | null, clave: string[], hayCorreccion: boolean): Marca {
  if (!hayCorreccion) return 'ninguna';
  const esClave = clave.includes(token);
  if (token === elegido) return esClave ? 'bien' : 'mal';
  return esClave ? 'era' : 'ninguna';
}

function ListaDeOpciones({
  opciones,
  elegido,
  setElegido,
  bloqueado,
  clave,
  hayCorreccion,
}: {
  opciones: { id: string; texto: string }[];
  elegido: string | null;
  setElegido: (id: string) => void;
  bloqueado: boolean;
  clave: string[];
  hayCorreccion: boolean;
}) {
  return (
    <div role="radiogroup" className="grid gap-2">
      {opciones.map((o) => (
        <Ficha
          key={o.id}
          role="radio"
          aria-checked={elegido === o.id}
          seleccionada={elegido === o.id}
          marca={marcaDe(o.id, elegido, clave, hayCorreccion)}
          disabled={bloqueado}
          onClick={() => setElegido(o.id)}
          className="w-full"
        >
          {o.texto}
        </Ficha>
      ))}
    </div>
  );
}

export function OpcionMultiple({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadOpcionMultiple>) {
  const t = useTranslations('academia');
  const [elegido, setElegido] = useState<string | null>(null);
  useReportar(onCambio, elegido ? { elegido } : null);

  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaElegir')} />
      <ListaDeOpciones
        opciones={payload.opciones}
        elegido={elegido}
        setElegido={setElegido}
        bloqueado={bloqueado}
        clave={claveArray(correccion)}
        hayCorreccion={correccion !== null}
      />
    </div>
  );
}

export function ElegirLaAccion({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadElegirLaAccion>) {
  const t = useTranslations('academia');
  const [elegido, setElegido] = useState<string | null>(null);
  useReportar(onCambio, elegido ? { elegido } : null);

  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaElegir')} />
      {/* El escenario primero y aparte: es la situación, no la pregunta. */}
      <p className="mb-4 rounded-card border border-hairline bg-surface-2 p-3.5 text-small leading-relaxed">
        {payload.escenario}
      </p>
      <ListaDeOpciones
        opciones={payload.opciones}
        elegido={elegido}
        setElegido={setElegido}
        bloqueado={bloqueado}
        clave={claveArray(correccion)}
        hayCorreccion={correccion !== null}
      />
    </div>
  );
}

export function MitoODato({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadMitoODato>) {
  const t = useTranslations('academia');
  const [esDato, setEsDato] = useState<boolean | null>(null);
  useReportar(onCambio, esDato === null ? null : { es_dato: esDato });

  // Este tipo no tiene colección de tokens, así que la clave viaja cruda.
  const claveCruda = correccion?.clave_cruda;
  const correcta =
    typeof claveCruda === 'boolean'
      ? claveCruda
      : claveCruda && typeof claveCruda === 'object' && 'es_dato' in claveCruda
        ? Boolean((claveCruda as { es_dato: unknown }).es_dato)
        : null;

  const marca = (valor: boolean): Marca => {
    if (!correccion) return 'ninguna';
    if (correcta === null) return esDato === valor ? (correccion.correcto ? 'bien' : 'mal') : 'ninguna';
    if (valor === esDato) return valor === correcta ? 'bien' : 'mal';
    return valor === correcta ? 'era' : 'ninguna';
  };

  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaMito')} />
      <p className="mb-5 border-l-2 border-brote-sun pl-3 font-display text-h3 font-bold leading-snug">
        {payload.afirmacion}
      </p>
      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        <Ficha
          role="radio"
          aria-checked={esDato === false}
          seleccionada={esDato === false}
          marca={marca(false)}
          disabled={bloqueado}
          onClick={() => setEsDato(false)}
          className="justify-center text-center font-semibold"
        >
          {t('esMito')}
        </Ficha>
        <Ficha
          role="radio"
          aria-checked={esDato === true}
          seleccionada={esDato === true}
          marca={marca(true)}
          disabled={bloqueado}
          onClick={() => setEsDato(true)}
          className="justify-center text-center font-semibold"
        >
          {t('esDato')}
        </Ficha>
      </div>
    </div>
  );
}

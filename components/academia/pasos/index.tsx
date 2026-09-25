'use client';

import type { Correccion, Payload, Respuesta } from '@/lib/academia/modelo';
import { Ejemplo, Teoria } from './Teoria';
import { Multiple, Opcion, VF } from './Eleccion';
import { Cadena, Ordenar } from './Orden';
import { Clasificar, Emparejar } from './Agrupar';
import { Completar, Detectar, Estimar, Numero } from './Precision';

/**
 * El despachador de los catorce tipos de paso del Árbol.
 *
 * Agregar un tipo es exactamente: su forma en `lib/academia/modelo.ts` y
 * `validar.ts`, un constructor en `scripts/academia-arbol/dsl.mjs`, un
 * renderer acá, y una rama en `ac_corregir` (0110). Nada más.
 *
 * El `default` no existe a propósito: un tipo nuevo sin renderer rompe la
 * compilación en vez de dejar una pantalla en blanco en producción.
 */
export function PasoVista({
  payload,
  onCambio,
  bloqueado,
  correccion,
  color,
}: {
  payload: Payload;
  onCambio: (r: Respuesta | null) => void;
  bloqueado: boolean;
  correccion: Correccion | null;
  color: string;
}) {
  const p = { onCambio, bloqueado, correccion, color };
  switch (payload.tipo) {
    case 'teoria':
      return <Teoria payload={payload} color={color} />;
    case 'ejemplo':
      return <Ejemplo payload={payload} color={color} />;
    case 'opcion':
      return <Opcion payload={payload} {...p} />;
    case 'multiple':
      return <Multiple payload={payload} {...p} />;
    case 'vf':
      return <VF payload={payload} {...p} />;
    case 'ordenar':
    case 'ranking':
      return <Ordenar payload={payload} {...p} />;
    case 'cadena':
      return <Cadena payload={payload} {...p} />;
    case 'clasificar':
      return <Clasificar payload={payload} {...p} />;
    case 'emparejar':
      return <Emparejar payload={payload} {...p} />;
    case 'completar':
      return <Completar payload={payload} {...p} />;
    case 'numero':
      return <Numero payload={payload} {...p} />;
    case 'estimar':
      return <Estimar payload={payload} {...p} />;
    case 'detectar':
      return <Detectar payload={payload} {...p} />;
  }
}

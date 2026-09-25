'use client';

import type { PayloadEjercicio, RespuestaCorregida, RespuestaEnviada } from '@/lib/academia/types';
import { DatoVivo, Microlectura } from './Presentacion';
import { ElegirLaAccion, MitoODato, OpcionMultiple } from './Eleccion';
import { CadenaCausal, OrdenarSecuencia, RankingImpacto } from './Orden';
import { ClasificarEnCestos, Emparejar } from './Agrupar';
import { CompletarFrase, DetectarGreenwashing, EstimacionNumerica, MapaLocalizar } from './Precision';

export type { PropsEjercicio } from './piezas';

/**
 * El despachador de los catorce tipos.
 *
 * Agregar un tipo nuevo es exactamente: un esquema en `lib/academia/schemas.ts`,
 * un renderer acá, y una rama en el corrector SQL. Nada más
 * (11-exercise-types.md §6). Este `switch` es la tercera parte de esa promesa.
 *
 * El `default` no existe a propósito: si aparece un tipo que no está acá,
 * TypeScript rompe la compilación en vez de dejar una pantalla en blanco en
 * producción.
 */
export function Ejercicio({
  payload,
  onCambio,
  bloqueado,
  correccion,
}: {
  payload: PayloadEjercicio;
  onCambio: (r: RespuestaEnviada | null) => void;
  bloqueado: boolean;
  correccion: RespuestaCorregida | null;
}) {
  const p = { onCambio, bloqueado, correccion };
  switch (payload.tipo) {
    case 'microlectura':
      return <Microlectura payload={payload} />;
    case 'dato_vivo':
      return <DatoVivo payload={payload} />;
    case 'opcion_multiple':
      return <OpcionMultiple payload={payload} {...p} />;
    case 'elegir_la_accion':
      return <ElegirLaAccion payload={payload} {...p} />;
    case 'mito_o_dato':
      return <MitoODato payload={payload} {...p} />;
    case 'ordenar_secuencia':
      return <OrdenarSecuencia payload={payload} {...p} />;
    case 'ranking_impacto':
      return <RankingImpacto payload={payload} {...p} />;
    case 'cadena_causal':
      return <CadenaCausal payload={payload} {...p} />;
    case 'clasificar_en_cestos':
      return <ClasificarEnCestos payload={payload} {...p} />;
    case 'emparejar':
      return <Emparejar payload={payload} {...p} />;
    case 'estimacion_numerica':
      return <EstimacionNumerica payload={payload} {...p} />;
    case 'detectar_greenwashing':
      return <DetectarGreenwashing payload={payload} {...p} />;
    case 'mapa_localizar':
      return <MapaLocalizar payload={payload} {...p} />;
    case 'completar_frase':
      return <CompletarFrase payload={payload} {...p} />;
  }
}

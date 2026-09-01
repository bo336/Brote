'use client';

/**
 * Envoltorios tipados sobre los RPC de la Academia (El Bosque).
 *
 * Misma forma que `lib/api/aprender.ts`, que es el que esto va a reemplazar
 * cuando la fase 3 retire la pantalla vieja. Hasta entonces conviven: `lessons`
 * y sus tres RPC siguen en pie como camino de rollback.
 *
 * Toda la lógica vive en el servidor. Acá no se calcula ni un punto, ni una
 * semilla, ni si una respuesta estuvo bien: eso lo decide Postgres y este
 * archivo solo lo transporta.
 */

import { createClient } from '@/lib/supabase/client';
import { parsearPaso } from '@/lib/academia/schemas';
import type {
  Arbol,
  DetalleGajo,
  EstadoAcademia,
  FalloAcademia,
  PasoSesion,
  Resultado,
  RespuestaCorregida,
  RespuestaEnviada,
  ResultadoSesion,
  Sesion,
  AccionSugerida,
} from '@/lib/academia/types';

/**
 * Un error de red o de Postgres se convierte en el mismo `{ ok: false }` que
 * devuelven los RPC cuando dicen que no. La pantalla maneja UN solo caso de
 * fallo, no dos.
 */
function fallo(mensaje: string, codigo = 'error'): FalloAcademia {
  return { ok: false, error: codigo, mensaje };
}

async function rpc<T>(nombre: string, args?: Record<string, unknown>): Promise<Resultado<T>> {
  const { data, error } = await createClient().rpc(nombre, args ?? {});
  if (error) return fallo(error.message);
  if (data == null) return fallo('El servidor no devolvió nada.');
  return data as Resultado<T>;
}

/**
 * El árbol entero, en UNA sola llamada.
 *
 * Si esta pantalla alguna vez necesita una segunda consulta, el que está mal es
 * el RPC y se arregla el RPC (15-ui-motion.md §1).
 */
export function fetchArbol(): Promise<Resultado<Arbol>> {
  return rpc<Arbol>('academia_arbol');
}

/** Savia, racha y semillas del día. Barato: lo consulta el encabezado. */
export function fetchEstadoAcademia(): Promise<Resultado<EstadoAcademia>> {
  return rpc<EstadoAcademia>('academia_estado');
}

/** Las hojas de un gajo, con la fuerza real de cada concepto que enseña. */
export function fetchGajo(slug: string): Promise<Resultado<DetalleGajo>> {
  return rpc<DetalleGajo>('academia_gajo', { p_slug: slug });
}

/**
 * Arranca una hoja. Consume savia al EMPEZAR, no al terminar: si se cobrara al
 * final, abandonar sería gratis y el límite no existiría.
 *
 * Los pasos vuelven ya validados: un paso con el payload roto —o que traiga la
 * solución— se descarta acá y no llega a ningún renderer.
 */
export async function empezarHoja(hojaId: string): Promise<Resultado<Sesion>> {
  const r = await rpc<Sesion>('academia_start_session', { p_hoja_id: hojaId, p_tipo: 'hoja' });
  return r.ok ? validarPasos(r) : r;
}

/** El riego es gratis y siempre lo va a ser: el límite nunca bloquea repasar. */
export async function empezarRiego(): Promise<Resultado<Sesion>> {
  const r = await rpc<Sesion>('academia_riego');
  return r.ok ? validarPasos(r) : r;
}

function validarPasos(sesion: Sesion): Sesion {
  const pasos: PasoSesion[] = [];
  for (const paso of sesion.pasos) {
    const v = parsearPaso(paso.payload);
    if (!v.ok) {
      // Un paso roto no tumba la sesión: se saltea y se deja rastro. Es lo que
      // va a pasar el día que la fase 3 genere algo mal formado.
      console.error(`[academia] paso ${paso.orden} descartado: ${v.motivo}`);
      continue;
    }
    pasos.push({ ...paso, payload: v.payload });
  }
  return { ...sesion, pasos };
}

/**
 * Corrige un paso. De un solo uso: reintentar la misma entrega devuelve
 * `ya_respondida`, no una segunda corrección.
 *
 * La explicación y la fuente llegan ACÁ, nunca antes: la explicación es el
 * contenido del ejercicio, no un premio por acertar.
 */
export function responder(
  entregaId: string,
  respuesta: RespuestaEnviada,
): Promise<Resultado<RespuestaCorregida>> {
  return rpc<RespuestaCorregida>('academia_answer', {
    p_entrega_id: entregaId,
    p_respuesta: respuesta,
  });
}

/**
 * Cierra la sesión: puntaje, XP, semillas, racha y el gancho de acción.
 *
 * Falla con `incompleta` si queda algún paso sin responder — si no, terminar en
 * el paso 1 sería una sesión completa con puntaje perfecto.
 */
export function terminarSesion(sesionId: string): Promise<Resultado<ResultadoSesion>> {
  return rpc<ResultadoSesion>('academia_finish_session', { p_sesion_id: sesionId });
}

/**
 * Salir sin haber empezado no puede costar savia. Devuelve `reembolso: true`
 * cuando se abandonó dentro del primer minuto y sin haber respondido nada.
 */
export function abandonarSesion(sesionId: string): Promise<Resultado<{ ok: true; reembolso: boolean }>> {
  return rpc<{ ok: true; reembolso: boolean }>('academia_abandonar', { p_sesion_id: sesionId });
}

/**
 * El gancho de acción de una hoja.
 *
 * Devuelve `null` —no un error— cuando no hay ninguna acción elegible: una
 * acción en enfriamiento o fuera de rango sería un link roto disfrazado de
 * sugerencia. Nunca se inventa una acción.
 */
export async function fetchAccionSugerida(hojaId: string): Promise<AccionSugerida | null> {
  const { data, error } = await createClient().rpc('academia_accion_sugerida', { p_hoja_id: hojaId });
  if (error) return null;
  return (data ?? null) as AccionSugerida | null;
}

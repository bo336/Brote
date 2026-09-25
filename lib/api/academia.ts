'use client';

/**
 * Los RPC del Árbol de la Academia, tipados.
 *
 * Acá no se calcula nada: ni un punto, ni una semilla, ni si una respuesta
 * estuvo bien. Eso lo decide Postgres (0110 y 0111) y este archivo solo lo
 * transporta. Lo único que agrega es la frontera: cada paso que llega se
 * valida antes de tocar un renderer (`lib/academia/validar.ts`).
 */

import { createClient } from '@/lib/supabase/client';
import { validarPayload } from '@/lib/academia/validar';
import type {
  Correccion,
  DetalleUnidad,
  EstadoAcademia,
  Fallo,
  Mapa,
  Paso,
  Res,
  Respuesta,
  Resultado,
  Sesion,
} from '@/lib/academia/modelo';

/**
 * Un error de red o de Postgres se convierte en el mismo `{ ok: false }` que
 * devuelven los RPC cuando dicen que no: la pantalla maneja UN solo caso.
 */
function fallo(mensaje: string, codigo = 'error'): Fallo {
  return { ok: false, error: codigo, mensaje };
}

async function rpc<T>(nombre: string, args?: Record<string, unknown>): Promise<Res<T>> {
  try {
    const { data, error } = await createClient().rpc(nombre, args ?? {});
    if (error) return fallo(error.message);
    if (data == null) return fallo('El servidor no devolvió nada.');
    return data as Res<T>;
  } catch (e) {
    return fallo(e instanceof Error ? e.message : 'No hay conexión.', 'red');
  }
}

/** El árbol entero, en UNA llamada. */
export function fetchMapa(): Promise<Res<Mapa>> {
  return rpc<Mapa>('academia_mapa');
}

/** Savia, racha y semillas. Barato: lo usa la entrada desde Hoy. */
export function fetchEstadoAcademia(): Promise<Res<EstadoAcademia>> {
  return rpc<EstadoAcademia>('academia_estado');
}

/** Una unidad por dentro: sus sesiones, sus objetivos y qué repasa. */
export function fetchUnidad(slug: string): Promise<Res<DetalleUnidad>> {
  return rpc<DetalleUnidad>('academia_unidad', { p_slug: slug });
}

/**
 * Empieza una sesión. Cobra la savia al EMPEZAR si es territorio nuevo;
 * rehacer, practicar y repasar no cuestan.
 */
export async function empezarSesion(leccionId: string): Promise<Res<Sesion>> {
  const r = await rpc<Sesion>('academia_empezar', { p_leccion_id: leccionId });
  return r.ok ? validarPasos(r) : r;
}

/** Un repaso libre de lo que se está olvidando. Gratis siempre. */
export async function empezarRepaso(): Promise<Res<Sesion>> {
  const r = await rpc<Sesion>('academia_repasar');
  return r.ok ? validarPasos(r) : r;
}

/**
 * Relee una sesión que ya existe, con las correcciones de lo respondido.
 * No empieza nada ni cobra: sirve para un F5, una pestaña cerrada, y para
 * traer el paso que el servidor re-encola cuando algo sale mal.
 */
export async function retomarSesion(intentoId: string): Promise<Res<Sesion>> {
  const r = await rpc<Sesion>('academia_retomar', { p_intento_id: intentoId });
  return r.ok ? validarPasos(r) : r;
}

function validarPasos(s: Sesion): Sesion {
  const pasos: Paso[] = [];
  for (const p of s.pasos) {
    const v = validarPayload(p.payload);
    if (!v.ok) {
      // Un paso roto no tumba la sesión: se saltea y queda rastro.
      console.error(`[academia] paso ${p.orden} descartado: ${v.motivo}`);
      continue;
    }
    pasos.push({ ...p, payload: v.payload });
  }
  return { ...s, pasos };
}

/** Corrige un paso. De un solo uso: reintentar devuelve `ya_respondida`. */
export function responder(entregaId: string, respuesta: Respuesta): Promise<Res<Correccion & { ok: true }>> {
  return rpc<Correccion & { ok: true }>('academia_responder', { p_entrega_id: entregaId, p_respuesta: respuesta });
}

/** Cierra la sesión. Falla con `incompleta` si queda algo sin responder. */
export function terminarSesion(intentoId: string): Promise<Res<Resultado>> {
  return rpc<Resultado>('academia_terminar', { p_intento_id: intentoId });
}

/** Salir. Devuelve la savia si no se respondió nada en el primer minuto y medio. */
export function salirDeSesion(intentoId: string): Promise<Res<{ ok: true; reembolso: boolean }>> {
  return rpc<{ ok: true; reembolso: boolean }>('academia_salir', { p_intento_id: intentoId });
}

/**
 * Deja constancia de que el gancho de acción se mostró o se tocó. Medir no
 * puede romper la pantalla: si falla, se pierde una medición y nada más.
 */
export async function marcarGancho(intentoId: string, accionId: string, evento: 'mostrado' | 'tocado'): Promise<void> {
  try {
    await createClient().rpc('academia_gancho_intento', {
      p_intento_id: intentoId,
      p_accion_id: accionId,
      p_evento: evento,
    });
  } catch {
    /* ídem */
  }
}

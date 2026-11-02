'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Lo que se rompió en el teléfono de alguien llega a `/panel/salud` (0138). El
 * texto del error y la ruta sin ids: nada de la persona.
 */

const YA_ENVIADOS = new Set<string>();
const MAXIMO_POR_VISITA = 10;

/** Ruido del navegador, de extensiones o de terceros: no dice nada de Brote. */
const RUIDO = [/ResizeObserver loop/i, /^Script error\.?$/i, /extension:\/\//i, /adsbygoogle/i, /AbortError/i, /Load failed$/i, /Failed to fetch$/i];

export function reportarError(mensaje: unknown): void {
  try {
    const texto = (mensaje instanceof Error ? mensaje.message : String(mensaje ?? '')).trim();
    if (!texto || RUIDO.some((r) => r.test(texto))) return;
    if (YA_ENVIADOS.has(texto) || YA_ENVIADOS.size >= MAXIMO_POR_VISITA) return;
    YA_ENVIADOS.add(texto);
    void createClient()
      .rpc('registrar_error', { p_mensaje: texto.slice(0, 300), p_ruta: window.location.pathname })
      .then(undefined, () => undefined);
  } catch {
    // Reportar un error nunca puede ser otro error.
  }
}

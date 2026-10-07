'use client';

import { createClient } from '@/lib/supabase/client';
import type { ActivityRow } from '@/lib/supabase/rows';
import type { Razon } from '@/lib/acciones/reglas';
import type { MotivoCambio } from '@/lib/acciones/reglas';
import type { EfemerideHoy } from '@/lib/acciones/presentar';

/** Una acción tal como la devuelve la base para hoy: con su porqué. */
export type AccionConRazon = ActivityRow & { razon?: Razon | null };

export interface DiaDeAcciones {
  fecha: string;
  acciones: AccionConRazon[];
  cambiosRestantes: number;
  efemeride: (EfemerideHoy & { slug: string; dominios: string[]; tags: string[] }) | null;
  estacion: string | null;
}

/** PostgREST: la función todavía no existe (deploy antes que la migración). */
function faltaFuncion(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? ''));
}

/**
 * El día completo (0123). Si la base todavía no tiene `acciones_de_hoy`, cae
 * al `ensure_daily_set` de siempre: así el deploy no depende del orden.
 */
export async function fetchAccionesDeHoy(): Promise<DiaDeAcciones> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('acciones_de_hoy');
  if (!error && data) {
    const d = data as {
      fecha: string;
      acciones: AccionConRazon[];
      cambios_restantes: number;
      efemeride: DiaDeAcciones['efemeride'];
      estacion: string | null;
    };
    return {
      fecha: d.fecha,
      acciones: d.acciones ?? [],
      cambiosRestantes: d.cambios_restantes ?? 0,
      efemeride: d.efemeride ?? null,
      estacion: d.estacion ?? null,
    };
  }
  if (!faltaFuncion(error)) throw error;
  const viejo = await supabase.rpc('ensure_daily_set');
  if (viejo.error) throw viejo.error;
  return { fecha: '', acciones: (viejo.data ?? []) as AccionConRazon[], cambiosRestantes: 0, efemeride: null, estacion: null };
}

export interface ResultadoCambio {
  ok: boolean;
  error?: string;
  nueva?: AccionConRazon | null;
  cambiosRestantes?: number;
  sugerirRutina?: boolean;
  contextoActualizado?: boolean;
}

export async function cambiarAccion(
  activityId: string,
  motivo: MotivoCambio,
  contexto?: string | null,
): Promise<ResultadoCambio> {
  const { data, error } = await createClient().rpc('acciones_cambiar', {
    p_activity_id: activityId,
    p_motivo: motivo,
    p_contexto: contexto ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const d = data as {
    ok: boolean;
    error?: string;
    nueva?: AccionConRazon | null;
    cambios_restantes?: number;
    sugerir_rutina?: boolean;
    contexto_actualizado?: boolean;
  };
  return {
    ok: d.ok,
    error: d.error,
    nueva: d.nueva ?? null,
    cambiosRestantes: d.cambios_restantes,
    sugerirRutina: d.sugerir_rutina,
    contextoActualizado: d.contexto_actualizado,
  };
}

/** Más para hoy ('daily') o del catálogo ('catalog'), con la misma regla que el día. */
export async function fetchSugeridas(tipo: 'daily' | 'catalog', limit = 6): Promise<AccionConRazon[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('acciones_sugeridas', { p_tipo: tipo, p_limit: limit });
  if (!error) return (data ?? []) as AccionConRazon[];
  if (!faltaFuncion(error)) throw error;
  if (tipo === 'catalog') return [];
  // Base vieja: el pool de siempre, al menos con la edad bien filtrada.
  const viejo = await supabase.from('activities').select('*').eq('type', 'daily').eq('active', true).order('sort_order').limit(limit);
  if (viejo.error) throw viejo.error;
  return (viejo.data ?? []) as AccionConRazon[];
}

export async function ocultarAccion(
  activityId: string,
  motivo: 'no_aplica' | 'no_me_gusta' | 'ya_lo_hago',
  contexto?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('acciones_ocultar', {
    p_activity_id: activityId,
    p_motivo: motivo,
    p_contexto: contexto ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export interface AccionOculta {
  activity_id: string;
  slug: string;
  title_es: string;
  domain_slug: string;
  motivo: 'no_aplica' | 'no_me_gusta' | 'ya_lo_hago';
  fecha: string;
}

export async function fetchOcultas(): Promise<AccionOculta[]> {
  const { data, error } = await createClient().rpc('mis_acciones_ocultas');
  if (error) throw error;
  return (data ?? []) as AccionOculta[];
}

export async function mostrarDeNuevo(activityId: string): Promise<void> {
  const { error } = await createClient().rpc('acciones_mostrar_de_nuevo', { p_activity_id: activityId });
  if (error) throw error;
}

export interface Camino {
  slug: string;
  titulo_es: string;
  descripcion_es: string;
  domain_slug: string;
  recompensa_puntos: number;
  completado: boolean;
  pasos: { id: string; slug: string; title_es: string; paso: number; hecho: boolean }[];
}

export async function fetchMisCaminos(): Promise<Camino[]> {
  const { data, error } = await createClient().rpc('mis_caminos');
  if (error) {
    if (faltaFuncion(error)) return [];
    throw error;
  }
  return (data ?? []) as Camino[];
}

/** Guarda respuestas de contexto mezclándolas en el servidor (nunca pisa la Plaza). */
export async function guardarContexto(ctx: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const { data, error } = await createClient().rpc('acciones_guardar_contexto', { p_ctx: ctx });
  if (error) throw error;
  const d = data as { ok: boolean; error?: string; context?: Record<string, unknown> };
  if (!d.ok) throw new Error(d.error ?? 'No se pudo guardar');
  return d.context ?? null;
}

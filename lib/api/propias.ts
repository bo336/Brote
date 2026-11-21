'use client';

import { createClient } from '@/lib/supabase/client';
import { REGLAS_PROPIAS, type MotivoPropia, type ReglasPropias } from '@/lib/acciones/propias';

/** Acciones propias (0150). */

export interface AccionPropia {
  id: string;
  titulo: string;
  dominio: string;
  nota: string | null;
  fecha: string;
  puntos: number;
  created_at: string;
  borrable: boolean;
}

export interface MisPropias {
  reglas: ReglasPropias;
  hoy: { fecha: string; cargadas: number; con_puntos_restantes: number; restantes: number };
  acciones: AccionPropia[];
}

export interface ResultadoPropia {
  ok: boolean;
  error?: MotivoPropia;
  id?: string;
  puntos?: number;
  con_puntos_restantes?: number;
  restantes?: number;
  new_total?: number;
  rank_up?: boolean;
  new_rank_slug?: string | null;
}

function faltaFuncion(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? ''));
}

/** Lo cargado y cómo viene el día. Antes de 0150, un día vacío: nada se rompe. */
export async function fetchMisPropias(limite = 30): Promise<MisPropias> {
  const { data, error } = await createClient().rpc('mis_acciones_propias', { p_limite: limite });
  if (error || !data || (data as { ok?: boolean }).ok === false) {
    if (error && !faltaFuncion(error)) throw error;
    return {
      reglas: { ...REGLAS_PROPIAS },
      hoy: { fecha: '', cargadas: 0, con_puntos_restantes: REGLAS_PROPIAS.con_puntos_por_dia, restantes: REGLAS_PROPIAS.max_por_dia },
      acciones: [],
    };
  }
  return data as MisPropias;
}

export async function registrarPropia(titulo: string, dominio: string, nota?: string | null): Promise<ResultadoPropia> {
  const { data, error } = await createClient().rpc('accion_propia_registrar', {
    p_titulo: titulo,
    p_dominio: dominio,
    p_nota: nota ?? null,
  });
  if (error) return { ok: false, error: 'no_disponible' };
  return data as ResultadoPropia;
}

export async function borrarPropia(id: string): Promise<{ ok: boolean; error?: string; puntos?: number }> {
  const { data, error } = await createClient().rpc('accion_propia_borrar', { p_id: id });
  if (error) return { ok: false, error: 'no_disponible' };
  return data as { ok: boolean; error?: string; puntos?: number };
}

// ── Panel ───────────────────────────────────────────────────────────────────

export interface PanelPropias {
  ok: true;
  reglas: ReglasPropias;
  semana: { cargadas: number; personas: number; puntos: number };
  repetidas: { titulo_norm: string; ejemplo: string; dominio: string; veces: number; personas: number }[];
  ultimas: {
    id: string;
    titulo: string;
    dominio: string;
    puntos: number;
    fecha: string;
    created_at: string;
    borrada: boolean;
    usuario: string | null;
    cuenta: 'kid' | 'teen' | 'adult';
  }[];
}

export async function adminPropias(pass: string): Promise<PanelPropias | { ok: false; error: string }> {
  const { data, error } = await createClient().rpc('admin_acciones_propias', { p_pass: pass });
  if (error) return { ok: false, error: faltaFuncion(error) ? 'Falta aplicar la migración 0150.' : error.message };
  return data as PanelPropias | { ok: false; error: string };
}

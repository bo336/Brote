'use client';

import { createClient } from '@/lib/supabase/client';
import type { ClaveRequisito, Requisitos } from '@/lib/rangos';

/**
 * Los rangos del período (0133): lo que le corresponde a cada persona, los
 * tableros de esta semana o este mes, y el cupo de proyectos que da (0137).
 */

export interface RangoCompleto {
  tier: number;
  slug: string;
  nombre: string;
  descripcion: string;
  color: string;
  previo: number | null;
  /** Lo que pide en ESTE período (ya prorrateado). */
  requisitos: Requisitos;
  por_semana: Requisitos;
}

export interface PeriodoRango {
  id: number;
  tipo: 'semana' | 'mes';
  inicio: string;
  fin: string;
  dias: number;
  quedan: number;
  proximo_tipo: 'semana' | 'mes';
}

export interface MiRango {
  ok: true;
  periodo: PeriodoRango;
  tier: number;
  margen_usado: boolean;
  /** El rango que ya cumple con lo que lleva hecho este período. */
  camino: number;
  metricas: Record<ClaveRequisito | 'puntos', number>;
  rangos: RangoCompleto[];
  historial: { inicio: string; fin: string; tipo: string; previo: number; nuevo: number; resultado: 'sube' | 'mantiene' | 'margen' | 'baja' }[];
}

export async function fetchMiRango(): Promise<MiRango | null> {
  const { data, error } = await createClient().rpc('mi_rango');
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as MiRango;
}

export type AmbitoRanking = 'global' | 'ciudad' | 'amigos' | 'rango';

export interface FilaRanking {
  pos: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  puntos: number;
  tier: number;
  nivel: string;
}

export interface TableroPeriodo {
  ok: true;
  ambito: AmbitoRanking;
  periodo: { tipo: 'semana' | 'mes'; inicio: string; fin: string };
  filas: FilaRanking[];
  yo: { puntos: number; pos: number | null; tier: number };
}

export async function fetchRankingPeriodo(ambito: AmbitoRanking, limite = 50): Promise<TableroPeriodo | null> {
  const { data, error } = await createClient().rpc('ranking_periodo', { p_ambito: ambito, p_limite: limite });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as TableroPeriodo;
}

/** El rango de otra persona, para su perfil. */
export async function fetchRangoDe(userId: string): Promise<number | null> {
  const { data, error } = await createClient().rpc('rangos_de', { p_usuarios: [userId] });
  if (error || !data) return null;
  return Number((data as Record<string, number>)[userId] ?? 1);
}

// ── Proyectos: lo que cada rango deja organizar (0137) ──────────────────────

export interface CupoProyectos {
  ok: true;
  tier: number;
  camino: number;
  efectivo: number;
  efectivo_nombre: string;
  cupo: number;
  activos: number;
  libres: number;
  min_tier: number;
  min_nombre: string;
  cupos: Record<string, number>;
  gracia_dias: number;
  adulto: boolean;
}

export async function fetchCupoProyectos(): Promise<CupoProyectos | null> {
  const { data, error } = await createClient().rpc('proyecto_cupo');
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as CupoProyectos;
}

export interface OrganizacionProyecto {
  ok: boolean;
  cupo?: CupoProyectos;
  pausado_at?: string | null;
  bajo_desde?: string | null;
  dias_restantes?: number | null;
  candidatos?: { user_id: string; nombre: string }[];
}

export async function fetchOrganizacionProyecto(id: string): Promise<OrganizacionProyecto | null> {
  const { data, error } = await createClient().rpc('proyecto_organizacion', { p_project: id });
  if (error || !data) return null;
  return data as OrganizacionProyecto;
}

export async function cederProyecto(id: string, usuario: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('proyecto_ceder', { p_project: id, p_user: usuario });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

// ── El panel ────────────────────────────────────────────────────────────────

export interface PanelRangos {
  ok: true;
  tipo: 'semana' | 'mes';
  periodo: { id: number; tipo: 'semana' | 'mes'; inicio: string; fin: string };
  rangos: { tier: number; slug: string; nombre: string; descripcion: string; color: string; requisitos: Requisitos; previo: number | null }[];
  distribucion: Record<string, number>;
  cierres: { inicio: string; fin: string; tipo: string; suben: number; mantienen: number; margen: number; bajan: number }[];
  activos_periodo: number;
}

export async function adminRangos(pass: string): Promise<PanelRangos | null> {
  const { data, error } = await createClient().rpc('admin_rangos', { p_pass: pass });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as PanelRangos;
}

export async function adminRangoGuardar(
  pass: string,
  tier: number,
  nombre: string,
  descripcion: string,
  requisitos: Requisitos,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_rango_guardar', {
    p_pass: pass,
    p_tier: tier,
    p_nombre: nombre,
    p_descripcion: descripcion,
    p_requisitos: requisitos,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminRangoPeriodo(pass: string, tipo: 'semana' | 'mes'): Promise<{ ok: boolean; error?: string; desde?: string }> {
  const { data, error } = await createClient().rpc('admin_rango_periodo', { p_pass: pass, p_tipo: tipo });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; desde?: string };
}

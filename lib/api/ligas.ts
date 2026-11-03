'use client';

import { createClient } from '@/lib/supabase/client';
import type { ReglasLiga } from '@/lib/ligas';

/**
 * Las ligas de la semana (0142): en cuál estás, tu grupo, los tableros de esta
 * semana y lo que la liga deja organizar en proyectos.
 */

export interface LigaCompleta {
  tier: number;
  slug: string;
  nombre: string;
  descripcion: string;
  color: string;
  mantener: number;
  subir: number | null;
}

export interface PeriodoLiga {
  id: number;
  tipo: 'semana' | 'mes';
  inicio: string;
  fin: string;
  dias: number;
  quedan: number;
  proximo_tipo: 'semana' | 'mes';
}

export interface FilaGrupo {
  pos: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rank_slug: string;
  division: number;
  puntos: number;
}

export interface MiLiga {
  ok: true;
  periodo: PeriodoLiga;
  tier: number;
  puntos: number;
  /** Lo que sumó hoy, antes del tope. */
  hoy: number;
  grupo: number;
  en_grupo: boolean;
  pos: number | null;
  tam: number;
  filas: FilaGrupo[];
  reglas: ReglasLiga;
  ligas: LigaCompleta[];
  historial: { inicio: string; fin: string; tipo: string; previo: number; nuevo: number; resultado: 'sube' | 'mantiene' | 'margen' | 'baja'; puntos: number | null }[];
}

export async function fetchMiLiga(): Promise<MiLiga | null> {
  const { data, error } = await createClient().rpc('mi_liga');
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as MiLiga;
}

export type AmbitoRanking = 'global' | 'ciudad' | 'amigos';

export interface FilaRanking {
  pos: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  puntos: number;
  /** La liga. Null en un jugador simulado. */
  tier: number | null;
  nivel: string;
  division: number | null;
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

/** La liga de otra persona, para su perfil. */
export async function fetchLigaDe(userId: string): Promise<number | null> {
  const { data, error } = await createClient().rpc('rangos_de', { p_usuarios: [userId] });
  if (error || !data) return null;
  return Number((data as Record<string, number>)[userId] ?? 1);
}

// ── Proyectos: lo que cada liga deja organizar (0137, 0142) ─────────────────

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

export interface PanelLigas {
  ok: true;
  tipo: 'semana' | 'mes';
  reglas: ReglasLiga;
  periodo: { id: number; tipo: 'semana' | 'mes'; inicio: string; fin: string };
  ligas: LigaCompleta[];
  distribucion: Record<string, number>;
  cierres: { inicio: string; fin: string; tipo: string; suben: number; mantienen: number; bajan: number; promedio: number }[];
  activos_periodo: number;
}

export async function adminLigas(pass: string): Promise<PanelLigas | null> {
  const { data, error } = await createClient().rpc('admin_ligas', { p_pass: pass });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as PanelLigas;
}

export async function adminLigaGuardar(
  pass: string,
  tier: number,
  nombre: string,
  descripcion: string,
  mantener: number,
  subir: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_liga_guardar', {
    p_pass: pass,
    p_tier: tier,
    p_nombre: nombre,
    p_descripcion: descripcion,
    p_mantener: mantener,
    p_subir: subir,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminLigaReglas(pass: string, r: ReglasLiga): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_liga_reglas_guardar', {
    p_pass: pass,
    p_tope: r.tope_diario,
    p_tamano: r.tamano_grupo,
    p_top: r.top_suben,
    p_minimo: r.grupo_minimo,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminLigaPeriodo(pass: string, tipo: 'semana' | 'mes'): Promise<{ ok: boolean; error?: string; desde?: string }> {
  const { data, error } = await createClient().rpc('admin_rango_periodo', { p_pass: pass, p_tipo: tipo });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; desde?: string };
}

export async function adminPersonaLiga(pass: string, usuario: string, tier: number): Promise<{ ok: boolean; error?: string; nombre?: string }> {
  const { data, error } = await createClient().rpc('admin_persona_liga', { p_pass: pass, p_user: usuario, p_tier: tier });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; nombre?: string };
}

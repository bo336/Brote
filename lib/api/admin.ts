'use client';

import { createClient } from '@/lib/supabase/client';
import type { FeedItem } from '@/lib/api/feed';

export interface AdminSetting {
  value: boolean | number | string;
  description: string | null;
}

export interface AdminDashboard {
  ok: boolean;
  error?: string;
  settings: Record<string, AdminSetting>;
  stats: Record<string, number>;
}

export async function adminIsConfigured(): Promise<boolean> {
  const { data, error } = await createClient().rpc('admin_is_configured');
  if (error) return false;
  return Boolean(data);
}

/** First run sets the passphrase; later changes require the current one. */
export async function adminSetPassword(next: string, current?: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_set_password', {
    p_new: next,
    p_current: current ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminDashboard(pass: string): Promise<AdminDashboard> {
  const { data, error } = await createClient().rpc('admin_dashboard', { p_pass: pass });
  if (error) return { ok: false, error: error.message, settings: {}, stats: {} };
  return data as AdminDashboard;
}

export async function adminSetSetting(
  pass: string,
  key: string,
  value: boolean | number | string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_set_setting', {
    p_pass: pass,
    p_key: key,
    p_value: value,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminSetSimulatedCount(
  pass: string,
  target: number,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  const { data, error } = await createClient().rpc('admin_set_simulated_count', {
    p_pass: pass,
    p_target: target,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; count?: number };
}

export interface ModerationQueueItem {
  id: string;
  reason: string;
  note: string | null;
  status: 'open' | 'upheld' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
  reports: number;
  post: FeedItem | null;
  post_hidden: boolean | null;
  author: {
    id: string;
    username: string | null;
    display_name: string | null;
    trust_score: number | null;
    suspended_until: string | null;
    upheld_30d: number;
  } | null;
}

/**
 * The report queue. The passphrase goes with every call, not just the first —
 * a tab left open on a shared screen should not be a standing key.
 */
export async function adminModerationQueue(
  pass: string,
  status: 'open' | 'upheld' | 'dismissed' = 'open',
): Promise<ModerationQueueItem[]> {
  const { data, error } = await createClient().rpc('admin_moderation_queue', {
    p_pass: pass,
    p_status: status,
  });
  if (error) throw error;
  return (data ?? []) as ModerationQueueItem[];
}

export async function adminModerate(
  pass: string,
  reportId: string,
  action: 'hide' | 'restore' | 'dismiss',
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_moderate', {
    p_pass: pass,
    p_report_id: reportId,
    p_action: action,
    p_note: note ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

// ── Pruebas (0119, 0122) ────────────────────────────────────────────────────

export interface CuentaPrueba {
  email: string;
  usuario: string | null;
  nombre: string | null;
  tipo: 'kid' | 'teen' | 'adult';
  rango: string;
  tier: number;
  negocios: { nombre: string; objetivo: string }[];
}

type Res<T> = ({ ok: true } & T) | { ok: false; error: string };

/** Turn an account the owner created (email with a "+") into a test account of a given type and rank. */
export async function adminCuentaPrueba(
  pass: string,
  email: string,
  tipo: 'kid' | 'teen' | 'adult',
  tier: number,
  negocio: 'ninguno' | 'vender' | 'mejorar' | 'ambos',
): Promise<Res<{ usuario: string | null; rango: string }>> {
  const { data, error } = await createClient().rpc('admin_cuenta_prueba', {
    p_pass: pass,
    p_email: email,
    p_tipo: tipo,
    p_tier: tier,
    p_negocio: negocio,
  });
  if (error) return { ok: false, error: error.message };
  return data as Res<{ usuario: string | null; rango: string }>;
}

export async function adminCuentasPrueba(pass: string): Promise<Res<{ cuentas: CuentaPrueba[] }>> {
  const { data, error } = await createClient().rpc('admin_cuentas_prueba', { p_pass: pass });
  if (error) return { ok: false, error: error.message };
  return data as Res<{ cuentas: CuentaPrueba[] }>;
}

export async function adminCuentaPruebaBorrar(pass: string, email: string): Promise<Res<object>> {
  const { data, error } = await createClient().rpc('admin_cuenta_prueba_borrar', { p_pass: pass, p_email: email });
  if (error) return { ok: false, error: error.message };
  return data as Res<object>;
}

export interface ErrorMundo {
  kind: string;
  message: string;
  info: Record<string, unknown>;
  at: string;
  usuario: string | null;
}

/** What failed when the world did not open on someone's phone (0119). */
export async function adminMundoErrores(pass: string): Promise<Res<{ resumen: Record<string, number>; filas: ErrorMundo[] }>> {
  const { data, error } = await createClient().rpc('admin_mundo_errores', { p_pass: pass, p_limit: 60 });
  if (error) return { ok: false, error: error.message };
  return data as Res<{ resumen: Record<string, number>; filas: ErrorMundo[] }>;
}

// ── Acciones (0125) ─────────────────────────────────────────────────────────

export interface FilaAccionPanel {
  slug: string;
  titulo: string;
  dominio?: string;
  total?: number;
  hoy_no?: number;
  no_aplica?: number;
  ya_lo_hago?: number;
  no_me_gusta?: number;
  ofrecida?: number;
  hecha?: number;
  tasa?: number;
}

export interface PanelAcciones {
  reglas: import('@/lib/acciones/reglas').Reglas;
  reglas_guardadas: Record<string, unknown>;
  catalogo: { dominio: string; dia: number; catalogo: number; chicos: number; con_contexto: number; de_temporada: number }[];
  cambiadas: FilaAccionPanel[];
  ofrecidas: { menos_hechas: FilaAccionPanel[]; mas_hechas: FilaAccionPanel[]; sets: number; cambios: number };
  contexto: { personas: number; respondieron: number; claves: Record<string, number> };
  caminos: { slug: string; titulo: string; terminados: number }[];
}

/** Cómo funcionan las acciones de verdad: catálogo, cambios, ofrecidas vs hechas, contexto. */
export async function adminAcciones(pass: string): Promise<Res<PanelAcciones>> {
  const { data, error } = await createClient().rpc('admin_acciones', { p_pass: pass });
  if (error) return { ok: false, error: error.message };
  return data as Res<PanelAcciones>;
}

/** Guarda las reglas del día (sólo claves conocidas, en rangos sanos). */
export async function adminAccionesReglasGuardar(
  pass: string,
  reglas: Record<string, unknown>,
): Promise<Res<{ reglas: PanelAcciones['reglas'] }>> {
  const { data, error } = await createClient().rpc('admin_acciones_reglas_guardar', { p_pass: pass, p_reglas: reglas });
  if (error) return { ok: false, error: error.message };
  return data as Res<{ reglas: PanelAcciones['reglas'] }>;
}

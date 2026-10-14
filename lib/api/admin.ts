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

// ── Cuentas del panel (0127) ────────────────────────────────────────────────

export interface EstadoAcceso {
  configurado: boolean;
  con_cuentas: boolean;
  soy_admin: boolean;
  ingreso_reciente: boolean;
}

export async function adminEstadoAcceso(): Promise<EstadoAcceso | null> {
  const { data, error } = await createClient().rpc('admin_estado_acceso');
  if (error) return null;
  return data as EstadoAcceso;
}

export async function adminRecuperarClave(nueva: string): Promise<{ ok: boolean; error?: string; reingresar?: boolean }> {
  const { data, error } = await createClient().rpc('admin_recuperar_clave', { p_nueva: nueva });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; reingresar?: boolean };
}

export interface CuentaPanel {
  user_id: string;
  email: string;
  nombre: string | null;
  username: string | null;
  vinculado_at: string;
  soy_yo: boolean;
  avisos: boolean;
}

export async function adminCuentas(pass: string): Promise<{ ok: boolean; error?: string; cuentas?: CuentaPanel[] }> {
  const { data, error } = await createClient().rpc('admin_cuentas', { p_pass: pass });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; cuentas?: CuentaPanel[] };
}

export async function adminVincularCuenta(pass: string, email?: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_vincular_cuenta', { p_pass: pass, p_email: email ?? null });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminDesvincularCuenta(pass: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_desvincular_cuenta', { p_pass: pass, p_user: userId });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

// ── Bandeja y analítica (0128) ──────────────────────────────────────────────

export async function adminPendientes(pass: string): Promise<Record<string, number> | null> {
  const { data, error } = await createClient().rpc('admin_pendientes', { p_pass: pass });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  const resto = { ...(data as Record<string, number>) };
  delete resto.ok;
  return resto;
}

export interface FilaSerie {
  dia: string;
  altas: number;
  activos: number;
  acciones: number;
}

export interface Analitica {
  ok: boolean;
  error?: string;
  hoy: string;
  dias: number;
  resumen: {
    usuarios: number;
    nuevos_hoy: number;
    nuevos_7d: number;
    nuevos_30d: number;
    onboarding: number;
    activos_hoy: number;
    activos_7d: number;
    activos_30d: number;
    con_avisos: number;
    app_instalada: number;
    brote_plus: number;
    acciones_hoy: number;
    acciones_7d: number;
    empresas_mejora: number;
    tiendas: number;
    empresas_en_alta: number;
  };
  serie: FilaSerie[];
  cohortes: { semana: string; tamano: number; retencion: (number | null)[] }[];
  embudo: {
    registrados: number;
    onboarding: number;
    primera_accion: number;
    volvio: number;
    siete_dias: number;
    racha_7: number;
  };
  secciones: { clave: string; usuarios_7d: number; usuarios_30d: number; vistas_7d: number }[];
  eventos: { clave: string; usuarios_7d: number; usuarios_30d: number; veces_30d: number }[];
  segmentos: {
    tipo: Record<string, number>;
    ciudad: { ciudad: string; usuarios: number }[];
    plataforma: Record<string, number>;
    sistema: Record<string, number>;
    navegador: Record<string, number>;
  };
  contenido: {
    acciones_top: { titulo: string; dominio: string; veces: number; personas: number }[];
    dominios: Record<string, number>;
    academia_sesiones_7d: number;
    academia_personas_7d: number;
    plaza_publicaciones_7d: number;
    plaza_autores_7d: number;
    plaza_reacciones_7d: number;
    mercado_clics_7d: number;
    mercado_impresiones_7d: number;
    mundo_jugadores_7d: number;
    proyectos_sumados_7d: number;
  };
  rachas: { cero: number; de_1_a_2: number; de_3_a_6: number; de_7_a_29: number; de_30_mas: number };
  niveles: Record<string, number>;
  avisos_7d: Record<string, number>;
  recientes: {
    id: string;
    username: string | null;
    display_name: string | null;
    alta_at: string;
    account_type: string;
    city: string | null;
    onboarding: boolean;
    acciones: number;
    ultimo_dia: string | null;
  }[];
}

export async function adminAnalitica(pass: string, dias = 30): Promise<Analitica | null> {
  const { data, error } = await createClient().rpc('admin_analitica', { p_pass: pass, p_dias: dias });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as Analitica;
}

export interface UsuarioAnalitica {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  alta_at: string;
  account_type: string;
  city: string | null;
  plan: string;
  es_prueba: boolean;
  onboarding: boolean;
  racha: number;
  nivel: string;
  puntos: number;
  ultima_vez: string | null;
  plataforma: string | null;
  sistema: string | null;
  instalada: boolean | null;
  avisos: boolean;
  dias_activos_30d: number;
  acciones_30d: number;
  secciones_30d: Record<string, number>;
  negocios: number;
}

export async function adminAnaliticaUsuarios(
  pass: string,
  q: string,
  orden: 'recientes' | 'activos' | 'inactivos',
  limite = 50,
): Promise<UsuarioAnalitica[] | null> {
  const { data, error } = await createClient().rpc('admin_analitica_usuarios', {
    p_pass: pass,
    p_q: q || null,
    p_orden: orden,
    p_limite: limite,
  });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return ((data as { usuarios?: UsuarioAnalitica[] }).usuarios ?? []) as UsuarioAnalitica[];
}

// ── Avisos (0129) ───────────────────────────────────────────────────────────

export interface EstadoAvisos {
  ok: boolean;
  claves: boolean;
  clave_origen: 'generada' | 'secretos' | null;
  dispositivos: number;
  personas_con_avisos: number;
  pendientes: number;
  vencidas: number;
  enviadas_24h: number;
  fallidas_24h: number;
  omitidas_24h: number;
  por_categoria_7d: Record<string, number>;
}

export async function adminAvisosEstado(pass: string): Promise<EstadoAvisos | null> {
  const { data, error } = await createClient().rpc('admin_avisos_estado', { p_pass: pass });
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as EstadoAvisos;
}

'use client';

/**
 * Los RPC del panel para la Academia.
 *
 * Mismo patrón que `lib/api/admin.ts`: la contraseña viaja en CADA llamada,
 * lectura o escritura, y la verifica `admin_check` del lado del servidor. Una
 * pestaña abierta desde ayer no puede seguir aprobando contenido.
 */

import { createClient } from '@/lib/supabase/client';
import type { PayloadEjercicio, TipoEjercicio } from '@/lib/academia/types';

export interface MotivoRechazo {
  codigo: string;
  etiqueta: string;
  descripcion: string | null;
}

export interface ItemEnRevision {
  id: string;
  tipo: TipoEjercicio;
  payload_publico: PayloadEjercicio;
  /** Acá SÍ viaja la solución: quien revisa tiene que poder juzgarla. */
  solucion: Record<string, unknown>;
  age_groups: string[];
  dificultad: number;
  status: string;
  plantilla: { id: string; titulo_interno: string; version: number; tipo: TipoEjercicio };
  conceptos: { slug: string; titulo_es: string; sensible: boolean; enunciado_es: string }[] | null;
  fuentes: { id: string; organizacion: string; titulo: string; url: string; contenido: string }[] | null;
}

export interface PropuestaEnRevision {
  id: string;
  rama_slug: string;
  anillo: number;
  payload: {
    gajos?: {
      slug: string;
      titulo_es: string;
      bajada_es?: string;
      conceptos?: { slug: string; titulo_es?: string; enunciado_es: string; prereq?: string[] }[];
    }[];
  };
  problemas: string[];
  estado: string;
}

export interface FilaRevision {
  id: string;
  clase: 'item' | 'plantilla' | 'propuesta';
  motivos: string[];
  juez: Record<string, unknown> | null;
  afirmaciones: { claim: string; fuente_id: string; cita: string }[] | null;
  prioridad: number;
  estado: string;
  created_at: string;
  motivo_rechazo: string | null;
  nota: string | null;
  item: ItemEnRevision | null;
  propuesta: PropuestaEnRevision | null;
  procedencia: {
    prompt_version: string;
    model_version: string;
    temperatura: number;
    intento: number;
    cost_cents: number;
    created_at: string;
  } | null;
}

export interface ColaAcademia {
  ok: boolean;
  error?: string;
  motivos: MotivoRechazo[];
  pendientes: number;
  items: FilaRevision[];
}

export async function academiaCola(pass: string, estado = 'pendiente'): Promise<ColaAcademia> {
  const { data, error } = await createClient().rpc('academia_admin_cola', {
    p_pass: pass,
    p_estado: estado,
    p_limite: 50,
  });
  if (error) return { ok: false, error: error.message, motivos: [], pendientes: 0, items: [] };
  return data as ColaAcademia;
}

export async function academiaRevisar(
  pass: string,
  id: string,
  accion: 'aprobar' | 'editar' | 'rechazar',
  opts?: { motivo?: string; nota?: string; payload?: unknown },
): Promise<{ ok: boolean; error?: string; estado?: string }> {
  const { data, error } = await createClient().rpc('academia_admin_revisar', {
    p_pass: pass,
    p_id: id,
    p_accion: accion,
    p_motivo: opts?.motivo ?? null,
    p_nota: opts?.nota ?? null,
    p_payload: opts?.payload ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; estado?: string };
}

/** Todo lo que hace falta para saber si la sección está sana. */
export interface MetricasAcademia {
  ok: boolean;
  error?: string;
  ventana_dias: number;
  sesiones: { total: number; terminadas: number; abandonadas: number; riego: number; por_dia: number };
  acierto_primera: { n: number; mediana: number | null; media: number | null };
  savia: { personas_con_uso: number; agotaron: number; tasa_agotamiento: number | null };
  semillas: { otorgadas: number; tope_diario: number; dias_en_tope: number };
  gancho: { mostrado: number; tocado: number; tasa: number | null };
  pool: { pares_concepto_tipo: number; bajo_piso: number; mediana_vivos: number | null };
  items: { aprobados: number; en_revision: number; retirados: number; con_embedding: number };
  generacion: {
    solicitudes: number; ingeridas: number; dead_letter: number;
    aceptados: number; rechazados: number; tokens_in: number; tokens_out: number;
  };
  presupuesto: {
    mes: string; tope_centavos: number; gastado_centavos: number;
    restante_centavos: number; habilitado: boolean; detenido_at: string | null;
  };
  revision: {
    pendientes: number; mas_vieja_horas: number | null;
    aprobados: number; editados: number; rechazados: number;
  };
  motivos_rechazo: { codigo: string; etiqueta: string; n: number }[];
  propuestas: { propuestas: number; aplicadas: number; rechazadas: number };
}

export async function academiaMetricas(pass: string): Promise<MetricasAcademia | { ok: false; error: string }> {
  const { data, error } = await createClient().rpc('academia_admin_metricas', { p_pass: pass });
  if (error) return { ok: false, error: error.message };
  return data as MetricasAcademia;
}

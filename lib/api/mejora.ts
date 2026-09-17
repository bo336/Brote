'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type { ColaObjetivos } from '@/lib/supabase/rows-negocio';

/** Llamadas de cliente de Mejora: evidencia de cierre y la cola del revisor. */

const LIMITE_BYTES = 5 * 1024 * 1024;

/**
 * Sube un archivo de evidencia al bucket privado. Las imágenes se comprimen
 * con el mismo helper que ya usa la app; un PDF va tal cual.
 */
export async function subirEvidencia(
  negocioId: string,
  archivo: File,
): Promise<{ ok: true; ruta: string } | { ok: false; error: string }> {
  const esPdf = archivo.type === 'application/pdf';
  const cuerpo: Blob = esPdf ? archivo : await compressImage(archivo, 1600, 0.85);
  if (cuerpo.size > LIMITE_BYTES) return { ok: false, error: 'archivo_grande' };

  const ext = esPdf ? 'pdf' : 'jpg';
  const ruta = `${negocioId}/objetivos/${crypto.randomUUID()}.${ext}`;
  const { error } = await createClient()
    .storage.from('business-evidence')
    .upload(ruta, cuerpo, { contentType: esPdf ? 'application/pdf' : 'image/jpeg', upsert: false });
  if (error) return { ok: false, error: 'archivo_rechazado' };
  return { ok: true, ruta };
}

// ── Panel ───────────────────────────────────────────────────────────────────

export async function objetivosCola(pass: string): Promise<ColaObjetivos> {
  const { data, error } = await createClient().rpc('admin_objetivos_cola', { p_pass: pass });
  if (error) return { ok: false, error: error.message, pendientes: 0, items: [] };
  return data as ColaObjetivos;
}

export async function objetivoRevisar(
  pass: string,
  goalId: string,
  accion: 'aprobar' | 'parcial' | 'corregir',
  nota: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_objetivo_revisar', {
    p_pass: pass,
    p_goal: goalId,
    p_accion: accion,
    p_nota: nota || null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/** Pendientes de cierre, para el contador de `/panel`. */
export async function objetivosPendientes(pass: string): Promise<number | null> {
  const r = await objetivosCola(pass);
  return r.ok ? r.pendientes : null;
}

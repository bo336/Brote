'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type {
  ColaNegocios,
  FiltroCola,
  RevisionNegocio,
  VerificationMethod,
} from '@/lib/supabase/rows-negocio';

/**
 * Llamadas de cliente del lado empresa y de la cola del panel.
 *
 * `verify-business` se llama solo en respuesta a un clic (03 §5, "regla de
 * oro"): nunca durante el render de una página.
 */

export interface ResultadoVerificacion {
  ok: boolean;
  /** Código de negocio (`sin_permiso`, `falta_sitio`…) cuando `ok` es false. */
  error?: string;
  status?: 'verificado' | 'fallido' | 'esperar' | 'limite';
  /** Mensaje humano y accionable (fase 1 §6.2). Nunca un código HTTP. */
  mensaje?: string;
  reintentar_en_min?: number;
}

export async function verificarNegocio(
  negocioId: string,
  metodo: VerificationMethod,
): Promise<ResultadoVerificacion> {
  const { data, error } = await createClient().functions.invoke('verify-business', {
    body: { business_id: negocioId, method: metodo },
  });
  if (error) return { ok: false, error: 'error' };
  return data as ResultadoVerificacion;
}

/** Sube la captura del método de Instagram. Devuelve la ruta en `business-evidence`. */
export async function subirCaptura(
  negocioId: string,
  archivo: File,
): Promise<{ ok: true; ruta: string } | { ok: false; error: string }> {
  const blob = await compressImage(archivo, 1600, 0.85);
  if (blob.size > 5 * 1024 * 1024) return { ok: false, error: 'archivo_grande' };
  const ruta = `${negocioId}/verificacion/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient()
    .storage.from('business-evidence')
    .upload(ruta, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) return { ok: false, error: 'ruta_invalida' };
  return { ok: true, ruta };
}

// ── Panel (contraseña en cada llamada, igual que el resto de /panel) ────────

export async function negociosCola(pass: string, filtro: FiltroCola): Promise<ColaNegocios> {
  const { data, error } = await createClient().rpc('admin_negocios_cola', { p_pass: pass, p_filtro: filtro });
  if (error) {
    return { ok: false, error: error.message, contadores: { pendientes: 0, observadas: 0, rechazadas: 0, todas: 0 }, items: [] };
  }
  return data as ColaNegocios;
}

export async function negocioRevision(pass: string, id: string): Promise<RevisionNegocio | { ok: false; error: string }> {
  const { data, error } = await createClient().rpc('admin_negocio_detalle', { p_pass: pass, p_id: id });
  if (error) return { ok: false, error: error.message };
  return data as RevisionNegocio | { ok: false; error: string };
}

export async function negocioRevisar(
  pass: string,
  id: string,
  accion: 'aprobar' | 'pedir_datos' | 'rechazar',
  nota: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_negocio_revisar', {
    p_pass: pass,
    p_id: id,
    p_accion: accion,
    p_nota: nota || null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/** Chequea que el sitio responda, a pedido del revisor. */
export async function probarSitio(pass: string, id: string): Promise<{ ok: boolean; sitio_estado?: 'ok' | 'caido' }> {
  const { data, error } = await createClient().functions.invoke('verify-business', {
    body: { action: 'sitio', pass, business_id: id },
  });
  if (error) return { ok: false };
  return data as { ok: boolean; sitio_estado?: 'ok' | 'caido' };
}

/** URL firmada de 60 segundos para ver una captura de verificación. */
export async function firmarEvidencia(pass: string, id: string, ruta: string): Promise<string | null> {
  const { data, error } = await createClient().functions.invoke('verify-business', {
    body: { action: 'firmar', pass, business_id: id, path: ruta },
  });
  if (error) return null;
  return (data as { url?: string })?.url ?? null;
}

/** Pendientes para el contador de `/panel`. */
export async function negociosPendientes(pass: string): Promise<number | null> {
  const r = await negociosCola(pass, 'pendientes');
  return r.ok ? r.contadores.pendientes : null;
}

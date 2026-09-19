'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';
import type { ColaListados, ColaReportes, RevisionListado } from '@/lib/supabase/rows-mercado';

/**
 * Llamadas de cliente del Mercado: subidas a Storage (con el negocio como
 * primer segmento de la ruta, que es lo que miran las policies) y las colas del
 * panel (contraseña en cada llamada, como el resto de `/panel`).
 */

type Subida = { ok: true; ruta: string } | { ok: false; error: string };

/** Una imagen de listado: comprimida, ≤ 2 MB (el tope del bucket). */
export async function subirImagenListado(negocioId: string, listingId: string, archivo: File): Promise<Subida> {
  const blob = await compressImage(archivo, 1600, 0.85);
  if (blob.size > 2 * 1024 * 1024) return { ok: false, error: 'archivo_grande' };
  const ruta = `${negocioId}/${listingId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient()
    .storage.from('listing-images')
    .upload(ruta, blob, { contentType: 'image/jpeg', upsert: false });
  return error ? { ok: false, error: 'archivo_rechazado' } : { ok: true, ruta };
}

/** El documento de una afirmación o de un descargo: privado, ≤ 5 MB. */
export async function subirDocumento(negocioId: string, carpeta: 'afirmaciones' | 'reportes', archivo: File): Promise<Subida> {
  const esPdf = archivo.type === 'application/pdf';
  const cuerpo: Blob = esPdf ? archivo : await compressImage(archivo, 1800, 0.85);
  if (cuerpo.size > 5 * 1024 * 1024) return { ok: false, error: 'archivo_grande' };
  const ruta = `${negocioId}/${carpeta}/${crypto.randomUUID()}.${esPdf ? 'pdf' : 'jpg'}`;
  const { error } = await createClient()
    .storage.from('business-evidence')
    .upload(ruta, cuerpo, { contentType: esPdf ? 'application/pdf' : 'image/jpeg', upsert: false });
  return error ? { ok: false, error: 'archivo_rechazado' } : { ok: true, ruta };
}

// ── Panel ───────────────────────────────────────────────────────────────────

async function rpc<T>(nombre: string, args: Record<string, unknown>): Promise<T | { ok: false; error: string }> {
  const { data, error } = await createClient().rpc(nombre, args);
  if (error) return { ok: false, error: error.message };
  return data as T;
}

export async function listadosCola(pass: string, modo: 'pendientes' | 'auditoria'): Promise<ColaListados> {
  const r = await rpc<ColaListados>('admin_listados_cola', { p_pass: pass, p_modo: modo });
  return 'contadores' in r ? r : { ok: false, error: r.error, contadores: { pendientes: 0, auditoria: 0, reportes: 0 }, items: [] };
}

export function listadoRevision(pass: string, id: string) {
  return rpc<RevisionListado | { ok: false; error: string }>('admin_listado_detalle', { p_pass: pass, p_id: id });
}

export function listadoRevisar(
  pass: string,
  id: string,
  accion: 'publicar' | 'cambios' | 'rechazar',
  nota: string,
  afirmaciones: { id: string; decision: 'aprobar' | 'rechazar'; nota?: string }[],
) {
  return rpc<{ ok: boolean; error?: string }>('admin_listado_revisar', {
    p_pass: pass, p_id: id, p_accion: accion, p_nota: nota || null, p_claims: afirmaciones,
  });
}

export function listadoDespublicar(pass: string, id: string, nota: string) {
  return rpc<{ ok: boolean; error?: string }>('admin_listado_despublicar', { p_pass: pass, p_id: id, p_nota: nota || null });
}

export function listadoAuditar(pass: string, id: string) {
  return rpc<{ ok: boolean; error?: string }>('admin_listado_auditar', { p_pass: pass, p_id: id });
}

export function afirmacionDesenganchar(pass: string, listingId: string, claimId: string) {
  return rpc<{ ok: boolean; error?: string }>('admin_claim_desenganchar', { p_pass: pass, p_listing: listingId, p_claim: claimId });
}

export function notaCorreccion(pass: string, negocioId: string, texto: string) {
  return rpc<{ ok: boolean; error?: string }>('admin_nota_correccion', { p_pass: pass, p_business: negocioId, p_texto: texto });
}

export async function reportesCola(pass: string, estado: 'abierto' | 'confirmado' | 'desestimado'): Promise<ColaReportes> {
  const r = await rpc<ColaReportes>('admin_reportes_cola', { p_pass: pass, p_estado: estado });
  return 'contadores' in r ? r : { ok: false, error: r.error, contadores: { abierto: 0, confirmado: 0, desestimado: 0 }, items: [] };
}

export function reporteResolver(pass: string, id: string, accion: 'confirmar' | 'desestimar', nota: string) {
  return rpc<{ ok: boolean; error?: string; hasta?: string }>('admin_reporte_resolver', {
    p_pass: pass, p_id: id, p_accion: accion, p_nota: nota || null,
  });
}

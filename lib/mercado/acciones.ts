'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CLAIMS, alcanceDe, validarAfirmacion, type Afirmacion, type CertInfo, type ClaimKind, type Datos } from '@/lib/mercado/claims';
import { verificarUrl, normalizarUrl } from '@/lib/mercado/url';
import { validarListado, type ErrorListado } from '@/lib/mercado/validador';
import {
  buscar,
  getCatalogo,
  getCertificaciones,
  getCuentaMercado,
  getPuente,
  type Cursor,
  type FiltrosBusqueda,
  type FiltrosCatalogo,
  type PaginaCatalogo,
  type Puente,
} from '@/lib/mercado/servidor';
import { nivelAfirmacion } from '@/lib/negocio/niveles';
import { getNegocioDetalle } from '@/lib/negocio/context';
import type { Busqueda, ListadoDetalle, PreguntaPublica, ReportReason, Sugerencias, TarjetaMercado } from '@/lib/supabase/rows-mercado';

/**
 * Server actions del Mercado. Cada escritura termina en una RPC que vuelve a
 * chequear lo que importa: estas acciones agregan lo que la base no puede hacer
 * sola (el validador con sus schemas, la URL viva, el screening de IA), no la
 * reemplazan.
 */

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string; errores?: ErrorListado[] };

function resultado(data: unknown, error: { message: string } | null): { ok: boolean; error?: string } & Record<string, unknown> {
  if (error) return { ok: false, error: 'error' };
  return (data ?? { ok: false, error: 'error' }) as { ok: boolean; error?: string } & Record<string, unknown>;
}

function certInfo(c: { slug: string; nombre: string; emisor: string; claims: ClaimKind[]; tiene_numero: boolean; vence: boolean }): CertInfo {
  return { slug: c.slug, nombre: c.nombre, emisor: c.emisor, claims: c.claims, tiene_numero: c.tiene_numero, vence: c.vence };
}

// ── Listado ─────────────────────────────────────────────────────────────────

export interface DatosListado {
  titulo?: string;
  descripcion?: string;
  tipo?: 'producto' | 'servicio';
  categoria?: string;
  dominios?: string[];
  precio_referencia?: number | null;
  url_destino?: string;
  disponibilidad?: 'online' | 'local' | 'ambas';
  zonas?: string[];
  // Mercado v2
  subcategoria?: string | null;
  condicion?: 'nuevo' | 'usado' | 'reacondicionado';
  contacto?: 'web' | 'whatsapp' | 'instagram';
}

export async function guardarListado(negocioId: string, listingId: string | null, datos: DatosListado): Promise<Resultado<{ id: string; slug: string }>> {
  const limpio: DatosListado = { ...datos };
  if (typeof datos.url_destino === 'string') {
    // Normaliza a https (fase 3 §5.1); vacío se guarda vacío.
    limpio.url_destino = datos.url_destino.trim() ? normalizarUrl(datos.url_destino) ?? datos.url_destino.trim() : '';
  }
  const { data, error } = await createClient().rpc('listado_guardar', {
    p_business: negocioId,
    p_listing: listingId,
    p_datos: limpio as Record<string, unknown>,
  });
  const r = resultado(data, error);
  if (!r.ok) {
    return {
      ok: false,
      error: r.error ?? 'error',
      ...(r.termino ? { errores: [{ campo: 'descripcion', codigo: String(r.error), detalle: String(r.termino) }] } : {}),
    };
  }
  revalidatePath('/negocio/listados');
  // Un publicado editado en vivo: la ficha pública cambia en el acto.
  if (r.status === 'publicado') revalidatePath(`/mercado/${String(r.slug)}`);
  return { ok: true, id: String(r.id), slug: String(r.slug) };
}

export async function guardarImagenes(listingId: string, rutas: string[]): Promise<Resultado> {
  const { data, error } = await createClient().rpc('listado_imagenes', { p_listing: listingId, p_paths: rutas });
  const r = resultado(data, error);
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

/** Chequea la URL de destino en vivo, con el estado visible en el formulario. */
export async function verificarDestino(negocioId: string, url: string): Promise<Resultado<{ final: string }>> {
  const negocio = await getNegocioDetalle(negocioId);
  if (!negocio) return { ok: false, error: 'sin_permiso' };
  const r = await verificarUrl(url, negocio.sitio_web ? [new URL(normalizarUrl(negocio.sitio_web) ?? 'https://x.invalid').hostname] : []);
  return r.ok ? { ok: true, final: r.final } : { ok: false, error: r.codigo };
}

// ── Afirmaciones ────────────────────────────────────────────────────────────

export interface DatosAfirmacion {
  kind: ClaimKind;
  alcance: string;
  datos: Datos;
  cert_slug: string | null;
  cert_numero: string | null;
  cert_vence: string | null;
  evidencia_path: string | null;
  /** La categoría del listado, para los pares irrelevantes de `libre_de`. */
  categoria: string | null;
}

export async function guardarAfirmacion(
  negocioId: string,
  claimId: string | null,
  a: DatosAfirmacion,
): Promise<Resultado<{ id: string }>> {
  const certs = (await getCertificaciones()).map(certInfo);
  const alcance = alcanceDe(a.kind, a.alcance, a.datos);
  const afirmacion: Afirmacion = {
    kind: a.kind,
    alcance,
    datos: a.datos,
    cert_slug: a.cert_slug,
    cert_numero: a.cert_numero,
    cert_vence: a.cert_vence,
    evidencia: !!a.evidencia_path,
  };
  const errores = validarAfirmacion(afirmacion, { categoria: a.categoria, certs });
  if (errores.length > 0) {
    return { ok: false, error: errores[0]!.codigo, errores: errores.map((e) => ({ campo: e.campo, codigo: e.codigo })) };
  }

  // El texto exacto que se va a publicar si se aprueba, con el nivel que tendría
  // (08 §5.2, art. 21: con qué texto exacto). Lo guarda la base para la historia.
  const cert = certs.find((c) => c.slug === a.cert_slug) ?? null;
  const negocio = await getNegocioDetalle(negocioId);
  const fuerte = !!negocio?.verificaciones?.some(
    (v) => v.status === 'verificado' && ['dominio_meta', 'dominio_dns', 'dominio_archivo', 'email_dominio'].includes(v.method),
  );
  const nivel = nivelAfirmacion(afirmacion, { aprobada: true, cert, verificacionFuerte: fuerte });
  const enunciado = CLAIMS[a.kind].textoPublico({ ...afirmacion, cert: cert ? { nombre: cert.nombre, emisor: cert.emisor } : null }, nivel);

  const { data, error } = await createClient().rpc('claim_guardar', {
    p_business: negocioId,
    p_claim: claimId,
    p_kind: a.kind,
    p_alcance: alcance,
    p_datos: a.datos,
    p_cert_slug: a.cert_slug,
    p_cert_numero: a.cert_numero,
    p_cert_vence: a.cert_vence,
    p_evidencia: a.evidencia_path,
    p_enunciado: enunciado,
  });
  const r = resultado(data, error);
  return r.ok ? { ok: true, id: String(r.id) } : { ok: false, error: r.error ?? 'error' };
}

export async function engancharAfirmaciones(listingId: string, ids: string[]): Promise<Resultado> {
  const { data, error } = await createClient().rpc('listado_claims', { p_listing: listingId, p_claims: ids });
  const r = resultado(data, error);
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

// ── Enviar ──────────────────────────────────────────────────────────────────

/**
 * 1. Validador determinista (siempre, con o sin IA).
 * 2. URL viva.
 * 3. Screening de IA — nunca falla: sin IA queda "revisado solo por reglas".
 * 4. `listado_enviar`, que vuelve a chequear lo legal en la base.
 */
export async function enviarListado(listingId: string): Promise<Resultado<{ status: string }>> {
  const supabase = createClient();
  const { data: d } = await supabase.rpc('listado_detalle', { p_listing: listingId });
  const detalle = d as ListadoDetalle | null;
  if (!detalle) return { ok: false, error: 'sin_permiso' };
  const l = detalle.listado;

  const certs = (await getCertificaciones()).map(certInfo);
  const modelo = detalle.negocio?.modelo ?? 'legacy';
  const contacto = modelo === 'vendedor' ? l.contacto ?? 'web' : 'web';
  const v = validarListado(
    {
      titulo: l.titulo,
      descripcion: l.descripcion,
      categoria: l.categoria,
      dominios: l.dominios,
      precio_referencia: l.precio_referencia === null ? null : Number(l.precio_referencia),
      url_destino: l.url_destino,
      imagenes: l.imagenes.length,
      tipo: l.tipo,
      contacto,
      afirmaciones: detalle.afirmaciones.map((c) => ({
        kind: c.kind,
        alcance: c.alcance,
        datos: c.datos,
        cert_slug: c.cert_slug,
        cert_numero: c.cert_numero,
        cert_vence: c.cert_vence,
        evidencia: c.evidencia,
      })),
    },
    { certs, modelo },
  );
  if (!v.ok) return { ok: false, error: 'validacion', errores: v.errores };

  // La URL viva solo cuando el producto sale a un sitio: WhatsApp e Instagram
  // se arman en el momento con el dato de la tienda.
  if (contacto === 'web') {
    const negocio = await getNegocioDetalle(l.business_id);
    const declarado = negocio?.sitio_web ? normalizarUrl(negocio.sitio_web) : null;
    const url = await verificarUrl(l.url_destino, declarado ? [new URL(declarado).hostname] : []);
    if (!url.ok) return { ok: false, error: url.codigo };
  }

  await supabase.functions.invoke('screen-listing', { body: { listing_id: listingId } }).catch(() => null);

  const { data, error } = await supabase.rpc('listado_enviar', {
    p_listing: listingId,
    p_validacion: { banderas: v.banderas, validado_at: new Date().toISOString() },
  });
  const r = resultado(data, error);
  if (!r.ok) return { ok: false, error: r.error ?? 'error' };
  revalidatePath('/negocio/listados');
  return { ok: true, status: String(r.status) };
}

export async function retirarListado(listingId: string): Promise<Resultado<{ status: string }>> {
  const { data, error } = await createClient().rpc('listado_retirar', { p_listing: listingId });
  const r = resultado(data, error);
  if (!r.ok) return { ok: false, error: r.error ?? 'error' };
  revalidatePath('/negocio/listados');
  return { ok: true, status: String(r.status) };
}

export async function enviarDescargo(reporteId: string, texto: string, ruta: string | null): Promise<Resultado> {
  const { data, error } = await createClient().rpc('listado_descargo', { p_report: reporteId, p_texto: texto, p_path: ruta });
  const r = resultado(data, error);
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

// ── Público ─────────────────────────────────────────────────────────────────

/**
 * Registra el clic y RECIÉN AHÍ devuelve la dirección: ninguna salida puede
 * saltearse el interstitial (fase 3 §7.4). El user agent se guarda hasheado.
 */
export async function registrarSalida(listingId: string, origen: string): Promise<Resultado<{ url: string }>> {
  const ua = headers().get('user-agent') ?? '';
  const uaHash = ua ? createHash('sha256').update(ua).digest('hex').slice(0, 32) : null;
  const { data, error } = await createClient().rpc('mercado_salir', {
    p_listing: listingId,
    p_origen: origen,
    p_ua_hash: uaHash,
  });
  const r = resultado(data, error);
  return r.ok ? { ok: true, url: String(r.url) } : { ok: false, error: r.error ?? 'error' };
}

export async function reportarListado(listingId: string, motivo: ReportReason, detalle: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('mercado_reportar', {
    p_listing: listingId,
    p_motivo: motivo,
    p_detalle: detalle.trim() || null,
  });
  const r = resultado(data, error);
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

export async function cargarMasCatalogo(f: FiltrosCatalogo, cursor: Cursor): Promise<PaginaCatalogo> {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') return { items: [], cursor: null };
  return getCatalogo(f, cursor, cuenta);
}

/**
 * Impresiones, para el CTR y para la analítica (fase 4 §3.2). Se cuenta cuando
 * la tarjeta ENTRA EN PANTALLA, una vez por sesión del lado del cliente y una
 * vez por persona y día del lado de la base. `origen` dice desde qué pantalla
 * la vio, que es lo que después responde "de dónde vinieron".
 */
export type OrigenVista = 'catalogo' | 'accion' | 'plaza' | 'perfil_negocio';

/**
 * El módulo "Dónde conseguirlo" de una acción. Se pide desde el cliente porque
 * la ficha de la acción es un Client Component; la base decide si hay algo que
 * mostrar (y para `kid` nunca lo hay).
 */
export async function getPuenteAccion(slugAccion: string): Promise<Puente | null> {
  return getPuente(slugAccion);
}

/**
 * Los mejores del momento, para la pestaña Mercado de la Plaza (02 §6.2) y el
 * módulo del inicio. Con `dominio`, los de un tema de Brote (la Academia).
 */
export async function getMercadoDestacado(limite = 6, dominio: string | null = null): Promise<TarjetaMercado[]> {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') return [];
  const r = await buscar(
    {
      q: null, categoria: null, subcategoria: null, nivel: null, zona: null, modalidad: null, condicion: null,
      precioMin: null, precioMax: null, orden: 'recomendados', dominio,
    },
    0,
    cuenta,
  );
  return r.items.slice(0, limite);
}

// ── Mercado v2: buscar, guardar, seguir, preguntar ──────────────────────────

/** La página siguiente de una búsqueda (scroll infinito). */
export async function buscarPagina(f: FiltrosBusqueda, offset: number): Promise<Busqueda> {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') return { items: [], total: 0, offset: 0, orden: 'recomendados', facetas: {} };
  return buscar(f, Math.max(0, Math.min(offset, 960)), cuenta);
}

export async function sugerir(q: string): Promise<Sugerencias> {
  const texto = q.trim().slice(0, 80);
  if (texto.length < 2) return { productos: [], tiendas: [] };
  const { data, error } = await createClient().rpc('mercado_sugerencias', { p_q: texto });
  if (error) return { productos: [], tiendas: [] };
  return (data ?? { productos: [], tiendas: [] }) as Sugerencias;
}

export async function alternarFavorito(listingId: string, on: boolean): Promise<Resultado<{ favorito: boolean; favoritos: number }>> {
  const { data, error } = await createClient().rpc('mercado_favorito', { p_listing: listingId, p_on: on });
  const r = resultado(data, error);
  if (!r.ok) return { ok: false, error: r.error ?? 'error' };
  return { ok: true, favorito: !!r.favorito, favoritos: Number(r.favoritos ?? 0) };
}

export async function alternarSeguir(negocioId: string, on: boolean): Promise<Resultado<{ seguida: boolean; seguidores: number }>> {
  const { data, error } = await createClient().rpc('mercado_seguir', { p_business: negocioId, p_on: on });
  const r = resultado(data, error);
  if (!r.ok) return { ok: false, error: r.error ?? 'error' };
  return { ok: true, seguida: !!r.seguida, seguidores: Number(r.seguidores ?? 0) };
}

export async function preguntar(listingId: string, texto: string): Promise<Resultado<{ id: string }>> {
  const { data, error } = await createClient().rpc('mercado_preguntar', { p_listing: listingId, p_texto: texto });
  const r = resultado(data, error);
  return r.ok ? { ok: true, id: String(r.id) } : { ok: false, error: r.error ?? 'error' };
}

export async function masPreguntas(listingId: string, offset: number): Promise<PreguntaPublica[]> {
  const { data, error } = await createClient().rpc('mercado_preguntas', { p_listing: listingId, p_offset: offset });
  if (error) return [];
  return (data ?? []) as PreguntaPublica[];
}

/** La tienda responde. La base aplica la misma lista negra que a la descripción. */
export async function responderPregunta(preguntaId: string, texto: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('tienda_responder', { p_pregunta: preguntaId, p_texto: texto });
  const r = resultado(data, error);
  if (!r.ok) return { ok: false, error: r.error ?? 'error' };
  revalidatePath('/negocio/preguntas');
  return { ok: true };
}

export async function ocultarPregunta(preguntaId: string, ocultar: boolean): Promise<Resultado> {
  const { data, error } = await createClient().rpc('tienda_pregunta_ocultar', { p_pregunta: preguntaId, p_ocultar: ocultar });
  const r = resultado(data, error);
  if (!r.ok) return { ok: false, error: r.error ?? 'error' };
  revalidatePath('/negocio/preguntas');
  return { ok: true };
}

export async function marcarVistas(ids: string[], origen: OrigenVista = 'catalogo'): Promise<void> {
  if (ids.length === 0) return;
  await createClient().rpc('mercado_vistas', { p_ids: ids.slice(0, 48), p_origen: origen });
}

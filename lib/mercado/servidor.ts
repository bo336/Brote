import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fit, reordenarPorDiversidad, scoreEnVivo, type Persona } from '@/lib/mercado/ranking';
import type { Nivel } from '@/lib/mercado/claims';
import type { Condicion, OrdenBusqueda } from '@/lib/mercado/categorias';
import type {
  AfirmacionFila,
  Busqueda,
  CertificacionFila,
  FichaMercado,
  Guardados,
  InicioMercado,
  ListadoDetalle,
  MisListados,
  NegocioPublico,
  PreguntasTienda,
  Salida,
  TarjetaMercado,
} from '@/lib/supabase/rows-mercado';

/**
 * Lecturas del Mercado en el servidor. Todo pasa por RPC: la base decide qué
 * ve cada cuenta (menores incluidos) y qué columnas salen (el precio, la URL).
 */

export type CuentaMercado = {
  id: string;
  tipo: 'kid' | 'teen' | 'adult';
  persona: Persona;
} | null;

/** La cuenta que mira: tipo (menores), intereses y provincia (para el fit). */
export const getCuentaMercado = cache(async (): Promise<CuentaMercado> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, account_type, interests, city')
    .eq('id', session.user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    tipo: ((data.account_type as string | null) ?? 'adult') as 'kid' | 'teen' | 'adult',
    persona: {
      intereses: Array.isArray(data.interests) ? (data.interests as string[]) : [],
      provincia: (data.city as string | null) ?? null,
    },
  };
});

export const getCertificaciones = cache(async (): Promise<CertificacionFila[]> => {
  const { data } = await createClient()
    .from('certifications')
    .select('slug, nombre, emisor, pais, claims, tiene_numero, vence, url_registro, nota')
    .order('nombre');
  return (data ?? []) as CertificacionFila[];
});

// ── Catálogo ────────────────────────────────────────────────────────────────

export interface FiltrosCatalogo {
  categoria: string | null;
  dominio: string | null;
  nivel: Nivel | null;
  zona: string | null;
  modalidad: 'online' | 'local' | null;
  orden: 'recomendados' | 'nivel';
  negocio?: string | null;
}

export interface Cursor {
  tier: Nivel;
  score: number;
  id: string;
}

export interface PaginaCatalogo {
  items: TarjetaMercado[];
  cursor: Cursor | null;
}

export const TAMANO_PAGINA = 24;

/**
 * Una página del catálogo: el RPC trae los candidatos ordenados por el puntaje
 * materializado (por cursor, nunca por offset); acá se suma el fit de la
 * persona (0.25·F) y se re-ordena por diversidad, SOBRE esa página (05 §4.7).
 * El cursor sale del orden de la base, no del re-ordenado: así la página
 * siguiente arranca donde terminó esta.
 */
export async function getCatalogo(f: FiltrosCatalogo, cursor: Cursor | null, cuenta: CuentaMercado): Promise<PaginaCatalogo> {
  const { data, error } = await createClient().rpc('mercado_listados', {
    p_categoria: f.categoria,
    p_dominio: f.dominio,
    p_tier_min: f.nivel ?? 'e1',
    p_zona: f.zona,
    p_modalidad: f.modalidad,
    p_orden: f.orden,
    p_cursor_tier: cursor?.tier ?? null,
    p_cursor_score: cursor?.score ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: TAMANO_PAGINA,
    p_negocio: f.negocio ?? null,
  });
  if (error) throw new Error(`mercado_listados: ${error.message}`);
  const filas = (data ?? []) as TarjetaMercado[];
  const ultimo = filas[filas.length - 1];

  let items = filas;
  if (f.orden === 'recomendados') {
    const conFit = filas.map((t) => ({
      ...t,
      score: scoreEnVivo(
        Number(t.score),
        fit(
          {
            dominios: t.dominios,
            disponibilidad: t.disponibilidad,
            zonas: t.zonas,
            categoria: t.categoria,
            negocio: { provincia: t.negocio.provincia },
            tieneImagen: !!t.imagen,
            descripcionLargo: t.descripcion_largo,
            tienePrecio: t.tiene_precio,
          },
          cuenta?.persona ?? null,
          f.categoria,
        ),
      ),
    }));
    items = reordenarPorDiversidad(conFit);
  }

  return {
    items,
    cursor: filas.length === TAMANO_PAGINA && ultimo ? { tier: ultimo.tier, score: Number(ultimo.score), id: ultimo.id } : null,
  };
}

export const getFicha = cache(async (slug: string): Promise<FichaMercado | null> => {
  const { data, error } = await createClient().rpc('mercado_listado', { p_slug: slug });
  if (error) throw new Error(`mercado_listado: ${error.message}`);
  return (data ?? null) as FichaMercado | null;
});

export const getNegocioPublico = cache(async (slug: string): Promise<NegocioPublico | null> => {
  const { data, error } = await createClient().rpc('mercado_negocio', { p_slug: slug });
  if (error) throw new Error(`mercado_negocio: ${error.message}`);
  return (data ?? null) as NegocioPublico | null;
});

/**
 * "Dónde conseguirlo" de una acción (02 §6.1). Las cinco reglas duras las
 * aplica `mercado_para_accion` en la base: menores, categorías sensibles, el
 * mínimo de 3 listados y uno por empresa. Acá no se decide nada.
 */
export interface Puente {
  texto: string | null;
  categoria: string;
  items: TarjetaMercado[];
}

export const getPuente = cache(async (slugAccion: string): Promise<Puente | null> => {
  const { data, error } = await createClient().rpc('mercado_para_accion', { p_slug: slugAccion, p_limit: 3 });
  if (error) return null;
  return (data ?? null) as Puente | null;
});

// ── Mercado v2 (0113) ───────────────────────────────────────────────────────

/** Lo que la búsqueda acepta: todo opcional, todo validado antes de llegar acá. */
export interface FiltrosBusqueda {
  q: string | null;
  categoria: string | null;
  subcategoria: string | null;
  nivel: Nivel | null;
  zona: string | null;
  modalidad: 'online' | 'local' | null;
  condicion: Condicion | null;
  precioMin: number | null;
  precioMax: number | null;
  orden: OrdenBusqueda | null;
  negocio?: string | null;
  dominio?: string | null;
}

export const PAGINA_BUSQUEDA = 24;

/**
 * Una página de la búsqueda. Con el orden "recomendados" en la primera página
 * se suma el fit de la persona y se reordena por diversidad (05 §4.7), igual
 * que el catálogo de 0107; con cualquier otro orden, lo que dice la base.
 */
export async function buscar(f: FiltrosBusqueda, offset: number, cuenta: CuentaMercado): Promise<Busqueda> {
  const { data, error } = await createClient().rpc('mercado_buscar', {
    p_q: f.q,
    p_categoria: f.categoria,
    p_subcategoria: f.subcategoria,
    p_tier_min: f.nivel ?? 'e0',
    p_zona: f.zona,
    p_modalidad: f.modalidad,
    p_condicion: f.condicion,
    p_precio_min: f.precioMin,
    p_precio_max: f.precioMax,
    p_orden: f.orden,
    p_negocio: f.negocio ?? null,
    p_offset: offset,
    p_limit: PAGINA_BUSQUEDA,
    p_dominio: f.dominio ?? null,
  });
  if (error) throw new Error(`mercado_buscar: ${error.message}`);
  const r = (data ?? { items: [], total: 0, offset: 0, orden: 'recomendados', facetas: {} }) as Busqueda;
  if (r.orden === 'recomendados' && offset === 0 && cuenta) {
    const conFit = r.items.map((t) => ({
      ...t,
      score: scoreEnVivo(
        Number(t.score),
        fit(
          {
            dominios: t.dominios,
            disponibilidad: t.disponibilidad,
            zonas: t.zonas,
            categoria: t.categoria,
            negocio: { provincia: t.negocio.provincia },
            tieneImagen: !!t.imagen,
            descripcionLargo: t.descripcion_largo,
            tienePrecio: t.tiene_precio,
          },
          cuenta.persona,
          f.categoria,
        ),
      ),
    }));
    return { ...r, items: reordenarPorDiversidad(conFit) };
  }
  return r;
}

export const getInicio = cache(async (): Promise<InicioMercado | null> => {
  const { data, error } = await createClient().rpc('mercado_inicio');
  if (error) throw new Error(`mercado_inicio: ${error.message}`);
  return (data ?? null) as InicioMercado | null;
});

export const getGuardados = cache(async (): Promise<Guardados | null> => {
  const { data, error } = await createClient().rpc('mercado_guardados');
  if (error) throw new Error(`mercado_guardados: ${error.message}`);
  return (data ?? null) as Guardados | null;
});

export async function getPreguntasTienda(negocioId: string, estado: 'pendientes' | 'respondidas' | 'ocultas'): Promise<PreguntasTienda | null> {
  const { data, error } = await createClient().rpc('tienda_preguntas', { p_business: negocioId, p_estado: estado });
  if (error) throw new Error(`tienda_preguntas: ${error.message}`);
  return (data ?? null) as PreguntasTienda | null;
}

export async function getSalida(id: string): Promise<Salida | null> {
  const { data, error } = await createClient().rpc('mercado_salida', { p_listing: id });
  if (error) throw new Error(`mercado_salida: ${error.message}`);
  return (data ?? null) as Salida | null;
}

// ── Negocio ─────────────────────────────────────────────────────────────────

export const getMisListados = cache(async (negocioId: string): Promise<MisListados | null> => {
  const { data, error } = await createClient().rpc('mis_listados', { p_business: negocioId });
  if (error) throw new Error(`mis_listados: ${error.message}`);
  return (data ?? null) as MisListados | null;
});

export const getListadoDetalle = cache(async (id: string): Promise<ListadoDetalle | null> => {
  const { data, error } = await createClient().rpc('listado_detalle', { p_listing: id });
  if (error) throw new Error(`listado_detalle: ${error.message}`);
  return (data ?? null) as ListadoDetalle | null;
});

export const getMisAfirmaciones = cache(async (negocioId: string): Promise<AfirmacionFila[]> => {
  const { data, error } = await createClient().rpc('mis_afirmaciones', { p_business: negocioId });
  if (error) throw new Error(`mis_afirmaciones: ${error.message}`);
  return (data ?? []) as AfirmacionFila[];
});

import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fit, reordenarPorDiversidad, scoreEnVivo, type Persona } from '@/lib/mercado/ranking';
import type { Nivel } from '@/lib/mercado/claims';
import type {
  AfirmacionFila,
  CertificacionFila,
  FichaMercado,
  ListadoDetalle,
  MisListados,
  NegocioPublico,
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

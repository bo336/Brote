import type { ClaimKind, Datos, Nivel } from '@/lib/mercado/claims';
import type { BusinessRole, BusinessStatus } from '@/lib/supabase/rows-negocio';

/**
 * Las formas que devuelven las RPC del Mercado (`0107_mercado.sql`). Las
 * uniones de literales son las de los enums de esa migración: si cambian allá,
 * cambian acá.
 */

/** `listing_status` (0107). */
export type ListingStatus = 'draft' | 'pendiente' | 'publicado' | 'despublicado' | 'rechazado' | 'removido';
/** `claim_status` (0107). */
export type ClaimStatus = 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'vencida';
/** `report_reason` (0107). */
export type ReportReason = 'afirmacion_falsa' | 'enlace_roto' | 'no_es_el_producto' | 'precio_muy_distinto' | 'no_responde' | 'otro';
export type Fuerza = 'fuerte' | 'media' | null;

export const MOTIVOS_REPORTE: ReportReason[] = [
  'afirmacion_falsa', 'enlace_roto', 'no_es_el_producto', 'precio_muy_distinto', 'no_responde', 'otro',
];

/** Una fila de `certifications`. */
export interface CertificacionFila {
  slug: string;
  nombre: string;
  emisor: string;
  pais: string | null;
  claims: ClaimKind[];
  tiene_numero: boolean;
  vence: boolean;
  url_registro: string | null;
  nota: string | null;
}

/** `brote_claim_json`: una afirmación como la ve su empresa. */
export interface AfirmacionFila {
  id: string;
  kind: ClaimKind;
  alcance: string;
  enunciado: string;
  datos: Datos;
  cert_slug: string | null;
  cert_numero: string | null;
  cert_vence: string | null;
  cert: { slug: string; nombre: string; emisor: string } | null;
  evidencia: boolean;
  tier: Nivel;
  status: ClaimStatus;
  observacion: string | null;
  updated_at: string;
  listados: number;
}

/** Una fila de `mis_listados().listados`. */
export interface ListadoFila {
  id: string;
  slug: string;
  titulo: string;
  tipo: 'producto' | 'servicio';
  categoria: string;
  imagen: string | null;
  status: ListingStatus;
  tier_efectivo: Nivel;
  observacion: string | null;
  updated_at: string;
  publicado_at: string | null;
  afirmaciones: number;
  reportes_abiertos: number;
  clics_30d: number;
}

export interface MisListados {
  rol: BusinessRole;
  negocio: { id: string; slug: string; nombre: string; status: BusinessStatus; tier: Nivel; sitio_web: string | null; verificacion: Fuerza };
  listados: ListadoFila[];
}

export interface SugerenciaIA {
  claim_id: string;
  nivel_sugerido: 'e1' | 'e2' | 'e3' | 'rechazar';
  problemas: string[];
  calificador_faltante: string | null;
  texto_sugerido: string;
  alcance_real: string;
}

export interface ReporteNegocio {
  id: string;
  motivo: ReportReason;
  detalle: string | null;
  estado: 'abierto' | 'confirmado' | 'desestimado';
  descargo: string | null;
  descargo_at: string | null;
  descargo_vence: string;
  corregir_hasta: string | null;
  nota: string | null;
  created_at: string;
}

/** `listado_detalle(p_listing)`. */
export interface ListadoDetalle {
  rol: BusinessRole;
  verificacion: Fuerza;
  listado: {
    id: string;
    business_id: string;
    slug: string;
    tipo: 'producto' | 'servicio';
    titulo: string;
    descripcion: string;
    imagenes: string[];
    categoria: string;
    dominios: string[];
    precio_referencia: number | null;
    moneda: string;
    url_destino: string;
    disponibilidad: 'online' | 'local' | 'ambas';
    zonas: string[];
    status: ListingStatus;
    tier_efectivo: Nivel;
    observacion: string | null;
    acelerada: boolean;
    despublicado_por: string | null;
    publicado_at: string | null;
    enviado_at: string | null;
    updated_at: string;
    sugerencias: { banderas_texto: string[]; afirmaciones: SugerenciaIA[] } | null;
  };
  afirmaciones: AfirmacionFila[];
  reportes: ReporteNegocio[];
}

/** La tarjeta del catálogo (`brote_listado_tarjeta`). */
export interface TarjetaMercado {
  id: string;
  slug: string;
  titulo: string;
  tipo: 'producto' | 'servicio';
  imagen: string | null;
  categoria: string;
  dominios: string[];
  /** Solo para adultos: null para un teen, aunque exista. */
  precio: number | null;
  moneda: string;
  tier: Nivel;
  score: number;
  disponibilidad: 'online' | 'local' | 'ambas';
  zonas: string[];
  tiene_precio: boolean;
  descripcion_largo: number;
  updated_at: string;
  negocio: { id: string; slug: string; nombre: string; logo: string | null; tier: Nivel; provincia: string | null; ciudad: string | null };
}

/** Una afirmación pública, en la ficha. */
export interface AfirmacionPublica {
  id: string;
  kind: ClaimKind;
  alcance: string;
  datos: Datos;
  tier: Nivel;
  cert_numero: string | null;
  cert_vence: string | null;
  cert: { nombre: string; emisor: string } | null;
}

/** `mercado_listado(p_slug)`. */
export interface FichaMercado extends Omit<TarjetaMercado, 'negocio'> {
  descripcion: string;
  imagenes: string[];
  status: ListingStatus;
  vista_previa: boolean;
  dominio_destino: string | null;
  publicado_at: string | null;
  negocio: TarjetaMercado['negocio'] & { verificacion: Fuerza; nota_correccion: string | null };
  afirmaciones: AfirmacionPublica[];
  ya_reportado: boolean;
}

/** `mercado_negocio(p_slug)`. */
export interface NegocioPublico {
  negocio: {
    id: string; slug: string; nombre: string; rubro: string; descripcion: string | null;
    logo: string | null; portada: string | null; provincia: string | null; ciudad: string | null;
    sitio_web: string | null; tier: Nivel; progreso_mejora: number; verificacion: Fuerza;
    nota_correccion: string | null; nota_correccion_at: string | null; fundador: boolean; desde: string;
  };
  mejora: { titulo: string; dominio: string | null; unidad: string; linea_base: number | null; valor_final: number | null; cerrado_at: string }[];
}

/** `mercado_salida(p_listing)`: lo que muestra el interstitial, sin la URL. */
export interface Salida {
  listado: string;
  slug: string;
  dominio: string | null;
  comercio: string;
  logo: string | null;
  vistas_30d: number;
}

// ── Panel ───────────────────────────────────────────────────────────────────

export interface ColaListados {
  ok: boolean;
  error?: string;
  contadores: { pendientes: number; auditoria: number; reportes: number };
  items: {
    id: string; titulo: string; categoria: string; imagen: string | null;
    enviado_at: string | null; publicado_at: string | null;
    negocio: { id: string; nombre: string; tier: Nivel; verificacion: Fuerza };
    afirmaciones: number;
    ia: { puntaje: number; recomendacion: string; riesgo: string } | null;
  }[];
}

export interface AfirmacionRevision extends AfirmacionFila {
  evidencia_path: string | null;
  cert_desconocida: string | null;
  cert_url: string | null;
  cert_nota: string | null;
  nivel_si_aprueba: Nivel;
  auto_aprobada: boolean;
  categoria_origen: string | null;
  alerta_halo: boolean;
  enganchada_en: { id: string; titulo: string; categoria: string; status: ListingStatus }[];
}

export interface ScreeningIA {
  por: 'ia' | 'reglas';
  nota?: string;
  motivo?: string;
  puntaje?: number;
  recomendacion?: string;
  resumen?: string;
  afirmaciones?: SugerenciaIA[];
  banderas_texto?: string[];
  riesgo_greenwashing?: 'bajo' | 'medio' | 'alto';
  nota_al_revisor?: string;
}

export interface RevisionListado {
  ok: true;
  listado: ListadoDetalle['listado'] & {
    screening_ia: ScreeningIA | null;
    validacion: { banderas?: { campo: string; termino: string }[] } | null;
    revisado_at: string | null;
    auditado_at: string | null;
    link_fallos: number;
    score: number;
  };
  negocio: { id: string; slug: string; nombre: string; rubro: string; tier: Nivel; sitio_web: string | null; provincia: string | null; ciudad: string | null; verificacion: Fuerza; reportes_confirmados: number };
  afirmaciones: AfirmacionRevision[];
  reportes: (ReporteNegocio & { descargo_path: string | null })[];
  anterior: string | null;
  siguiente: string | null;
}

export interface ColaReportes {
  ok: boolean;
  error?: string;
  contadores: { abierto: number; confirmado: number; desestimado: number };
  items: (ReporteNegocio & {
    descargo_path: string | null;
    resuelto_at: string | null;
    reportante: string | null;
    reportes_del_listado: number;
    listado: { id: string; slug: string; titulo: string; status: ListingStatus; imagen: string | null; despublicado_por: string | null };
    negocio: { id: string; nombre: string };
  })[];
}

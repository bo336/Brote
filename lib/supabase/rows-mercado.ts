import type { ClaimKind, Datos, Nivel } from '@/lib/mercado/claims';
import type { Condicion, Contacto, OrdenBusqueda } from '@/lib/mercado/categorias';
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
  // Mercado v2
  subcategoria?: string | null;
  condicion?: Condicion;
  precio?: number | null;
  favoritos?: number;
  preguntas_pendientes?: number;
}

export interface MisListados {
  rol: BusinessRole;
  negocio: {
    id: string; slug: string; nombre: string; status: BusinessStatus; tier: Nivel; sitio_web: string | null; verificacion: Fuerza;
    modelo?: 'vendedor' | 'legacy'; whatsapp?: boolean; instagram?: boolean;
  };
  listados: ListadoFila[];
  preguntas_pendientes?: number;
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
  /** Mercado v2: qué canales tiene cargados la tienda (solo si existen). */
  negocio?: {
    modelo: 'vendedor' | 'legacy';
    whatsapp: boolean;
    instagram: boolean;
    sitio_web: string | null;
    contacto_preferido: Contacto | null;
    provincia: string | null;
  };
  listado: {
    id: string;
    business_id: string;
    slug: string;
    tipo: 'producto' | 'servicio';
    titulo: string;
    descripcion: string;
    imagenes: string[];
    categoria: string;
    subcategoria?: string | null;
    condicion?: Condicion;
    contacto?: Contacto;
    favoritos?: number;
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
  // Mercado v2 (0113). Opcionales: la tarjeta de 0107 no los traía.
  subcategoria?: string | null;
  imagenes_n?: number;
  /** El precio de referencia anterior, SOLO si bajó en los últimos 30 días. */
  precio_anterior?: number | null;
  condicion?: Condicion;
  /** Cuántas personas lo guardaron. Un número cierto, nunca inventado. */
  favoritos?: number;
  publicado_at?: string | null;
  /** Si quien mira lo guardó (solo en los estantes y en guardados). */
  favorito?: boolean;
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

/** Un compromiso de tienda, como se muestra en público. */
export interface CompromisoPublico {
  practica: string;
  /** Ruta en listing-images, o null si esa práctica no tiene foto. */
  foto: string | null;
  revisado: boolean;
}

/** Una pregunta pública (la respuesta es pública; quién preguntó, no). */
export interface PreguntaPublica {
  id: string;
  texto: string;
  respuesta: string | null;
  respondida_at: string | null;
  created_at: string;
  /** La hizo quien mira: las sin responder solo las ve quien preguntó. */
  propia: boolean;
}

/** `mercado_listado(p_slug)`. */
export interface FichaMercado extends Omit<TarjetaMercado, 'negocio'> {
  descripcion: string;
  imagenes: string[];
  status: ListingStatus;
  vista_previa: boolean;
  dominio_destino: string | null;
  publicado_at: string | null;
  negocio: TarjetaMercado['negocio'] & {
    verificacion: Fuerza;
    nota_correccion: string | null;
    // Mercado v2
    tipo?: 'persona' | 'empresa';
    desde?: string;
    mp_vinculado?: boolean;
    productos?: number;
    seguidores?: number;
    seguida?: boolean;
    compromisos?: CompromisoPublico[];
  };
  afirmaciones: AfirmacionPublica[];
  ya_reportado: boolean;
  // Mercado v2
  /** Quien mira es de la tienda: no se pregunta ni se sigue a sí misma. */
  propia?: boolean;
  contacto?: Contacto;
  favorito?: boolean;
  preguntas?: PreguntaPublica[];
  preguntas_total?: number;
  mas_de_la_tienda?: TarjetaMercado[];
  parecidos?: TarjetaMercado[];
}

/** `mercado_negocio(p_slug)`. */
export interface NegocioPublico {
  negocio: {
    id: string; slug: string; nombre: string; rubro: string; descripcion: string | null;
    logo: string | null; portada: string | null; provincia: string | null; ciudad: string | null;
    sitio_web: string | null; tier: Nivel; progreso_mejora: number; verificacion: Fuerza;
    nota_correccion: string | null; nota_correccion_at: string | null; fundador: boolean; desde: string;
    // Mercado v2 (0113)
    tipo?: 'persona' | 'empresa';
    modelo?: 'vendedor' | 'legacy';
    categoria_principal?: string | null;
    mp_vinculado?: boolean;
    compromisos?: CompromisoPublico[];
    seguidores?: number;
    seguida?: boolean;
    propia?: boolean;
    productos?: number;
    categorias?: Record<string, number>;
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
  /** Mercado v2: por dónde sale (WhatsApp, Instagram o el sitio). */
  canal?: Contacto;
}

// ── Mercado v2 (0113) ───────────────────────────────────────────────────────

/** `mercado_buscar(...)`: una página, el total (tope 1001) y las facetas. */
export interface Busqueda {
  items: TarjetaMercado[];
  total: number;
  offset: number;
  orden: OrdenBusqueda;
  facetas: {
    categorias?: Record<string, number>;
    /** '_' = sin subcategoría. */
    subcategorias?: Record<string, number>;
    condicion?: Record<string, number>;
  };
}

/** `mercado_sugerencias(q)`. */
export interface Sugerencias {
  productos: { slug: string; titulo: string; imagen: string | null; categoria: string }[];
  tiendas: { slug: string; nombre: string; logo: string | null }[];
}

export type ClaveEstante =
  | 'seguir_viendo'
  | 'para_vos'
  | 'porque_hiciste'
  | 'aprendiendo'
  | 'cerca'
  | 'bajaron'
  | 'nuevos'
  | 'segunda_vida'
  | 'documentados';

export interface Estante {
  clave: ClaveEstante;
  /** Acción, rama o provincia, según el estante. */
  param?: string;
  accion?: string;
  categoria?: string;
  items: TarjetaMercado[];
}

export interface TiendaResumen {
  id: string;
  slug: string;
  nombre: string;
  logo: string | null;
  provincia: string | null;
  ciudad: string | null;
  tier?: Nivel;
  productos: number;
  seguidores?: number;
  seguida?: boolean;
  imagenes?: string[] | null;
  nuevos?: number;
}

/** `mercado_inicio()`. */
export interface InicioMercado {
  cuenta: 'teen' | 'adult';
  provincia: string | null;
  categorias: Record<string, number>;
  total: number;
  estantes: Estante[];
  tiendas: TiendaResumen[];
}

/** `mercado_guardados()`. */
export interface Guardados {
  favoritos: (TarjetaMercado & { guardado_at: string; precio_al_guardar: number | null; disponible: boolean })[];
  vistos: TarjetaMercado[];
  tiendas: TiendaResumen[];
}

/** `tienda_preguntas(p_business, p_estado)`. */
export interface PreguntasTienda {
  pendientes: number;
  items: {
    id: string;
    texto: string;
    respuesta: string | null;
    respondida_at: string | null;
    created_at: string;
    estado: 'visible' | 'oculta';
    listado: { id: string; slug: string; titulo: string; imagen: string | null };
  }[];
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

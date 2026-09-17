import type { BusinessSize, EvidenceTier, VerificationMethod } from '@/lib/supabase/rows-negocio';

/**
 * Los listados fijos del lado empresa. Las etiquetas viven en
 * `messages/*.json` bajo `negocio.*`; acá solo las claves y el orden.
 */

/**
 * Los 12 rubros (02 §3.2 pide "una de 12 opciones" sin nombrarlas). Salen de
 * los rubros de `referencia/CATALOGO_PALANCAS.md` más cuatro que conectan con
 * las categorías del Mercado. MISMO listado y orden que `brote_rubros()` en
 * `0105_negocios_fundaciones.sql`: el servidor rechaza cualquier otro.
 */
export const RUBROS = [
  'gastronomia',
  'comercio-minorista',
  'produccion-alimentos',
  'indumentaria-textil',
  'belleza-cuidado-personal',
  'servicios-profesionales',
  'logistica-transporte',
  'hoteleria-turismo',
  'agro-vivero-huerta',
  'limpieza-higiene',
  'hogar-construccion',
  'reparacion-reuso',
] as const;
export type Rubro = (typeof RUBROS)[number];

export const TAMANOS: BusinessSize[] = ['1', '2-10', '11-50', '51-200', '200+'];

/** Clave i18n de un tamaño (`1` no es un nombre de clave cómodo). */
export function claveTamano(t: BusinessSize): string {
  return { '1': 't1', '2-10': 't2', '11-50': 't3', '51-200': 't4', '200+': 't5' }[t];
}

/** El número visible del nivel. Nunca "rango": eso es de personas. */
export function numeroNivel(tier: EvidenceTier): number {
  return Number(tier.slice(1));
}

/**
 * Colores de nivel (07 §5), para chips. El nivel nunca se comunica solo por
 * color: siempre va con el número y la palabra (07 §7). E0 y E4 no tienen
 * color propio: E0 es neutro y E4 lleva la gradiente en el borde.
 */
export const COLOR_NIVEL: Record<EvidenceTier, string | null> = {
  e0: null,
  e1: '#8A8F98',
  e2: '#2DB4D4',
  e3: '#0E7A52',
  e4: null,
};

export interface MetodoVerificacion {
  method: VerificationMethod;
  fuerza: 'fuerte' | 'media';
  /** Lo resuelve `verify-business` solo; el de Instagram queda en revisión. */
  automatico: boolean;
  requiere: 'sitio' | 'instagram';
}

/**
 * De más fuerte a más liviano (02 §3.3). `email_dominio` no está: necesita un
 * remitente que todavía no existe, y un método roto es peor que uno ausente
 * (fase 1 §6.1).
 */
export const METODOS_VERIFICACION: MetodoVerificacion[] = [
  { method: 'dominio_meta', fuerza: 'fuerte', automatico: true, requiere: 'sitio' },
  { method: 'dominio_dns', fuerza: 'fuerte', automatico: true, requiere: 'sitio' },
  { method: 'dominio_archivo', fuerza: 'fuerte', automatico: true, requiere: 'sitio' },
  { method: 'social_token', fuerza: 'media', automatico: false, requiere: 'instagram' },
];

/** Reintentos del chequeo automático (fase 1 §6.1). Lo aplica la edge function. */
export const REINTENTO_MINUTOS = 10;
export const REINTENTOS_POR_DIA = 20;

/** La cookie de contexto (03 §3.1). Preferencia de UI, jamás autorización. */
export const CTX_COOKIE = 'brote_ctx';

/**
 * Tipos de la sección Negocios (brote-negocios, fase 1).
 *
 * Cada unión de literales está copiada a mano del enum de Postgres que la
 * define, con la migración al lado, para que no se desincronicen en silencio
 * (03_ARQUITECTURA §8). Si cambia el enum, cambia esto en el mismo commit.
 */

/** `business_status` — 0105_negocios_fundaciones. */
export type BusinessStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'suspended'
  | 'rejected'
  | 'closed';

/** `business_role` — 0105. */
export type BusinessRole = 'owner' | 'admin' | 'editor';

/** `evidence_tier` — 0105. */
export type EvidenceTier = 'e0' | 'e1' | 'e2' | 'e3' | 'e4';

/** `verification_method` — 0105. */
export type VerificationMethod =
  | 'dominio_meta'
  | 'dominio_dns'
  | 'dominio_archivo'
  | 'email_dominio'
  | 'social_token'
  | 'cuit_declarado';

/** `verification_status` — 0105. */
export type VerificationStatus = 'pendiente' | 'verificado' | 'fallido' | 'expirado';

/** `business_size` — 0105. */
export type BusinessSize = '1' | '2-10' | '11-50' | '51-200' | '200+';

export type Interes = 'mejora' | 'mercado';

/** Una fila de `my_businesses()`: lo que necesita el selector de contexto. */
export interface MiNegocio {
  id: string;
  nombre: string;
  slug: string;
  role: BusinessRole;
  status: BusinessStatus;
  tier: EvidenceTier;
}

/** Un método, tal como lo devuelve `negocio_detalle`. */
export interface VerificacionNegocio {
  method: VerificationMethod;
  status: VerificationStatus;
  target: string | null;
  token: string;
  intentos: number;
  ultimo_error: string | null;
  tiene_captura: boolean;
  verified_at: string | null;
  ultimo_intento_at: string | null;
  intentos_hoy: number;
}

/** `negocio_detalle(p_business)`: el registro completo, solo para miembros. */
export interface NegocioDetalle {
  id: string;
  slug: string;
  nombre_comercial: string;
  razon_social: string | null;
  cuit: string | null;
  rubro: string;
  tamano: BusinessSize;
  pais: string;
  provincia: string | null;
  ciudad: string | null;
  descripcion: string | null;
  logo_url: string | null;
  sitio_web: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email_contacto: string | null;
  status: BusinessStatus;
  tier: EvidenceTier;
  intereses: Interes[];
  revision_note: string | null;
  revisado_at: string | null;
  enviado_at: string | null;
  alta_paso: number;
  created_at: string;
  verify_token: string;
  role: BusinessRole;
  puede_reaplicar_at: string | null;
  verificaciones: VerificacionNegocio[];
}

/** Riesgos por reglas de `brote_negocio_riesgos` (0105). */
export type RiesgoNegocio =
  | 'sin_verificar'
  | 'sin_descripcion'
  | 'afirmaciones_vagas'
  | 'sitio_caido'
  | 'posible_duplicado';

export type FiltroCola = 'pendientes' | 'observadas' | 'rechazadas' | 'todas';

export interface FilaColaNegocio {
  id: string;
  nombre: string;
  rubro: string;
  provincia: string | null;
  ciudad: string | null;
  tamano: BusinessSize;
  status: BusinessStatus;
  enviado_at: string | null;
  revisado_at: string | null;
  observada: boolean;
  verificacion: { method: VerificationMethod; status: VerificationStatus; verified_at: string | null } | null;
  riesgos: RiesgoNegocio[];
}

export interface ColaNegocios {
  ok: boolean;
  error?: string;
  contadores: Record<FiltroCola, number>;
  items: FilaColaNegocio[];
}

export interface RevisionNegocio {
  ok: boolean;
  error?: string;
  negocio: {
    id: string;
    slug: string;
    nombre_comercial: string;
    razon_social: string | null;
    cuit: string | null;
    cuit_valido: boolean | null;
    rubro: string;
    tamano: BusinessSize;
    provincia: string | null;
    ciudad: string | null;
    descripcion: string | null;
    sitio_web: string | null;
    instagram: string | null;
    whatsapp: string | null;
    email_contacto: string | null;
    status: BusinessStatus;
    tier: EvidenceTier;
    intereses: Interes[];
    score_ia: number | null;
    informe_ia: Record<string, unknown> | null;
    revision_note: string | null;
    revisado_at: string | null;
    enviado_at: string | null;
    created_at: string;
    sitio_estado: 'ok' | 'caido' | null;
    sitio_chequeado_at: string | null;
  };
  creador: { display_name: string | null; username: string | null; desde: string } | null;
  verificaciones: {
    method: VerificationMethod;
    status: VerificationStatus;
    target: string | null;
    intentos: number;
    ultimo_error: string | null;
    evidencia_url: string | null;
    verified_at: string | null;
    ultimo_intento_at: string | null;
  }[];
  duplicados: { id: string; nombre: string; status: BusinessStatus; motivos: ('dominio' | 'cuit' | 'nombre')[] }[];
  riesgos: RiesgoNegocio[];
  anterior: string | null;
  siguiente: string | null;
}

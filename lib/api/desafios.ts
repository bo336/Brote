'use client';

import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compress';

/** Desafíos y certificados para empresas (0132). Todo pasa por RPC. */

export type TipoEvidencia = 'foto' | 'documento' | 'dato' | 'enlace' | 'declaracion';
export type CategoriaDesafio = 'energia' | 'residuos' | 'agua' | 'compras' | 'movilidad' | 'comunidad' | 'gestion';
export type EstadoInscripcion = 'en_curso' | 'enviada' | 'observada' | 'aprobada' | 'rechazada' | 'vencida' | 'abandonada';

export interface Requisito {
  id: string;
  texto: string;
  evidencia: TipoEvidencia;
  ayuda?: string;
  unidad?: string;
}

export interface DesafioListado {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  categoria: CategoriaDesafio;
  nivel: 1 | 2 | 3;
  dias: number;
  requisitos: number;
  inscripcion: { id: string; estado: EstadoInscripcion; vence_at: string; nota: string | null; hechos: number } | null;
  certificado: { codigo: string; vence_at: string; vigente: boolean } | null;
}

export interface Evidencia {
  texto: string | null;
  valor: number | null;
  enlace: string | null;
  archivo_path: string | null;
  completa?: boolean;
}

export interface DetalleDesafio {
  ok: boolean;
  error?: string;
  puede_editar: boolean;
  puede_inscribir: boolean;
  verificada: boolean;
  desafio: {
    id: string;
    slug: string;
    titulo: string;
    resumen: string;
    descripcion: string | null;
    categoria: CategoriaDesafio;
    nivel: 1 | 2 | 3;
    requisitos: Requisito[];
    dias: number;
    vigencia_meses: number;
    abierto: boolean;
  };
  inscripcion: {
    id: string;
    estado: EstadoInscripcion;
    inscripta_at: string;
    vence_at: string;
    enviada_at: string | null;
    revisada_at: string | null;
    nota: string | null;
  } | null;
  evidencias: Record<string, Evidencia>;
  certificado: { codigo: string; emitido_at: string; vence_at: string; vigente: boolean; revocado: boolean } | null;
}

type Res = { ok: boolean; error?: string; [k: string]: unknown };

async function rpc<T = Res>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().rpc(fn, args);
  if (error) return { ok: false, error: error.message } as T;
  return data as T;
}

export const desafiosEmpresa = (negocio: string) =>
  rpc<{ ok: boolean; error?: string; verificada: boolean; puede_editar: boolean; desafios: DesafioListado[] }>('desafios_empresa', {
    p_business: negocio,
  });

export const desafioDetalle = (negocio: string, slug: string) =>
  rpc<DetalleDesafio>('desafio_detalle', { p_business: negocio, p_slug: slug });

export const desafioInscribirse = (negocio: string, desafio: string) =>
  rpc('desafio_inscribirse', { p_business: negocio, p_desafio: desafio });

export const desafioGuardarEvidencia = (
  negocio: string,
  inscripcion: string,
  requisito: string,
  e: { texto?: string | null; valor?: number | null; enlace?: string | null; archivo?: string | null },
) =>
  rpc('desafio_evidencia_guardar', {
    p_business: negocio,
    p_inscripcion: inscripcion,
    p_requisito: requisito,
    p_texto: e.texto ?? null,
    p_valor: e.valor ?? null,
    p_enlace: e.enlace ?? null,
    p_archivo: e.archivo ?? null,
  });

export const desafioEnviar = (negocio: string, inscripcion: string) =>
  rpc<{ ok: boolean; error?: string; faltan?: string[] }>('desafio_enviar', { p_business: negocio, p_inscripcion: inscripcion });

export const desafioAbandonar = (negocio: string, inscripcion: string) =>
  rpc('desafio_abandonar', { p_business: negocio, p_inscripcion: inscripcion });

const LIMITE = 5 * 1024 * 1024;

/** Sube una foto o un PDF al bucket privado de la empresa, en su carpeta de desafíos. */
export async function subirArchivoDesafio(
  negocio: string,
  archivo: File,
): Promise<{ ok: true; ruta: string } | { ok: false; error: string }> {
  const esPdf = archivo.type === 'application/pdf';
  if (!esPdf && !archivo.type.startsWith('image/')) return { ok: false, error: 'tipo' };
  const cuerpo: Blob = esPdf ? archivo : await compressImage(archivo, 1600, 0.85);
  if (cuerpo.size > LIMITE) return { ok: false, error: 'grande' };
  const ruta = `${negocio}/desafios/${crypto.randomUUID()}.${esPdf ? 'pdf' : 'jpg'}`;
  const { error } = await createClient()
    .storage.from('business-evidence')
    .upload(ruta, cuerpo, { contentType: esPdf ? 'application/pdf' : 'image/jpeg', upsert: false });
  if (error) return { ok: false, error: 'subida' };
  return { ok: true, ruta };
}

/** Ver un archivo propio: URL firmada de un minuto (el bucket es privado). */
export async function verArchivoPropio(ruta: string): Promise<string | null> {
  const { data } = await createClient().storage.from('business-evidence').createSignedUrl(ruta, 60);
  return data?.signedUrl ?? null;
}

// ── Panel ───────────────────────────────────────────────────────────────────

export interface DesafioAdmin {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  descripcion: string | null;
  categoria: CategoriaDesafio;
  nivel: 1 | 2 | 3;
  requisitos: Requisito[];
  dias: number;
  vigencia_meses: number;
  para: 'mejorar' | 'vender' | 'todas';
  estado: 'borrador' | 'publicado' | 'archivado';
  orden: number;
  inscriptas: number;
  certificadas: number;
}

export interface EntregaDesafio {
  id: string;
  estado: EstadoInscripcion;
  enviada_at: string;
  nota: string | null;
  empresa: { id: string; nombre: string; slug: string; rubro: string; ciudad: string | null; provincia: string | null };
  desafio: { titulo: string; nivel: number; categoria: CategoriaDesafio; requisitos: Requisito[] };
  evidencias: Record<string, Evidencia>;
}

export const adminDesafios = (pass: string) =>
  rpc<{
    ok: boolean;
    error?: string;
    desafios: DesafioAdmin[];
    certificados: { codigo: string; titulo: string; empresa: string; emitido_at: string; vence_at: string; revocado: boolean }[];
  }>('admin_desafios', { p_pass: pass });

export const adminDesafioGuardar = (pass: string, d: Partial<DesafioAdmin>) =>
  rpc<{ ok: boolean; error?: string; id?: string }>('admin_desafio_guardar', { p_pass: pass, p_desafio: d });

export const adminDesafiosCola = (pass: string) =>
  rpc<{ ok: boolean; error?: string; items: EntregaDesafio[] }>('admin_desafios_cola', { p_pass: pass });

export const adminDesafioRevisar = (pass: string, inscripcion: string, accion: 'aprobar' | 'observar' | 'rechazar', nota: string) =>
  rpc<{ ok: boolean; error?: string; codigo?: string }>('admin_desafio_revisar', {
    p_pass: pass,
    p_inscripcion: inscripcion,
    p_accion: accion,
    p_nota: nota || null,
  });

export const adminCertificadoRevocar = (pass: string, codigo: string, motivo: string) =>
  rpc('admin_certificado_revocar', { p_pass: pass, p_codigo: codigo, p_motivo: motivo });

// ── Textos compartidos ──────────────────────────────────────────────────────

export const CATEGORIA: Record<CategoriaDesafio, { nombre: string; color: string }> = {
  energia: { nombre: 'Energía', color: '#F4A62A' },
  residuos: { nombre: 'Residuos', color: '#C2703D' },
  agua: { nombre: 'Agua', color: '#2DB4D4' },
  compras: { nombre: 'Compras', color: '#B07CD6' },
  movilidad: { nombre: 'Movilidad', color: '#5B6CF0' },
  comunidad: { nombre: 'Equipo y comunidad', color: '#FF8A3D' },
  gestion: { nombre: 'Gestión', color: '#0E7A52' },
};

export const NIVEL: Record<number, string> = { 1: 'Inicial', 2: 'Intermedio', 3: 'Avanzado' };

export const EVIDENCIA: Record<TipoEvidencia, string> = {
  foto: 'Foto',
  documento: 'Documento o enlace',
  dato: 'Un dato',
  enlace: 'Un enlace',
  declaracion: 'Contalo con tus palabras',
};

export const ESTADO_INSCRIPCION: Record<EstadoInscripcion, string> = {
  en_curso: 'En curso',
  enviada: 'En revisión',
  observada: 'Con observaciones',
  aprobada: 'Certificada',
  rechazada: 'No aprobada',
  vencida: 'Vencida',
  abandonada: 'Abandonada',
};

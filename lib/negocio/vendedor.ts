import type { Categoria, Contacto } from '../mercado/categorias';
import type { Practica } from '../mercado/practicas';

/**
 * El alta de vendedores (Mercado v2, 0114): tipos de lo que devuelve la base y
 * la lógica pura que el alta necesita en el cliente y en el servidor. Sin red y
 * sin alias de rutas: la compila también el runner de tests.
 */

export const PASOS_ALTA = ['tienda', 'compromiso', 'prueba', 'mercado_pago'] as const;
export type PasoAlta = (typeof PASOS_ALTA)[number];

/** Lo que le puede faltar a una tienda para abrir (`brote_vendedor_faltantes`). */
export type Faltante = 'tienda' | 'compromiso' | 'prueba' | 'mercado_pago' | 'terminos' | 'suscripcion';

export interface PrecioVendedor {
  usd: number;
  /** Null si no hay cotización del día ni precio de respaldo: nadie se suscribe con un número inventado. */
  ars: number | null;
  tipo_cambio: number | null;
  fecha: string | null;
  fuente: 'oficial' | 'manual' | null;
}

/** `vendedor_estado(p_business)`. */
export interface EstadoVendedor {
  id: string;
  slug: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'suspended' | 'rejected' | 'closed';
  modelo: 'vendedor' | 'legacy';
  rol: 'owner' | 'admin' | 'editor' | null;
  abierta: boolean;
  activa_at: string | null;
  falta: Faltante[];
  tienda: {
    nombre_comercial: string;
    tipo_vendedor: 'persona' | 'empresa';
    categoria_principal: Categoria | null;
    provincia: string | null;
    ciudad: string | null;
    descripcion: string | null;
    whatsapp: string | null;
    sitio_web: string | null;
    instagram: string | null;
    contacto_preferido: Contacto | null;
    cuit: string | null;
    razon_social: string | null;
    logo_url: string | null;
  };
  compromisos: { practica: Practica; estado: 'declarado' | 'revisado' | 'rechazado'; foto_path: string | null; nota: string | null }[];
  prueba_verde_at: string | null;
  mp: { vinculado: boolean; nickname: string | null; vinculado_at: string | null; requerido: boolean };
  terminos: { version: string; aceptados: boolean };
  cobro: boolean;
  precio: PrecioVendedor;
  suscripcion: {
    status: 'pendiente' | 'activa' | 'en_gracia' | 'pausada' | 'cancelada' | 'vencida';
    monto: number | null;
    moneda: string | null;
    periodo_fin: string | null;
    gracia_fin: string | null;
    desde: string;
  } | null;
}

/** Una pregunta de la prueba verde, como viaja: sin la respuesta. */
export interface PreguntaPrueba {
  id: string;
  enunciado: string;
  opciones: { id: string; texto: string }[];
}

export interface EstadoPrueba {
  ok: boolean;
  error?: string;
  aprobada: boolean;
  intento?: string;
  correctas?: number;
  incorrectas?: number;
  necesarias?: number;
  max_errores?: number;
  pregunta?: PreguntaPrueba;
}

export interface RespuestaPrueba {
  ok: boolean;
  error?: string;
  correcta: boolean;
  correcta_id: string;
  explicacion: string;
  correctas: number;
  incorrectas: number;
  estado: 'en_curso' | 'aprobada' | 'fallida';
  siguiente: PreguntaPrueba | null;
}

/** En qué paso está el alta: el primero que falta, o el último si ya no falta nada salvo pagar. */
export function pasoActual(e: Pick<EstadoVendedor, 'falta'>): PasoAlta {
  for (const p of PASOS_ALTA) {
    if (p === 'mercado_pago') break;
    if (e.falta.includes(p)) return p;
  }
  return 'mercado_pago';
}

/** Cuántos pasos del alta están completos (para la barra de progreso). */
export function pasosCompletos(e: Pick<EstadoVendedor, 'falta'>): number {
  const pendientes = new Set<string>(e.falta);
  let n = 0;
  if (!pendientes.has('tienda')) n++;
  if (!pendientes.has('compromiso')) n++;
  if (!pendientes.has('prueba')) n++;
  if (!pendientes.has('mercado_pago') && !pendientes.has('suscripcion') && !pendientes.has('terminos')) n++;
  return n;
}

/**
 * Un número de WhatsApp argentino en el formato que entiende wa.me:
 * `+549` + código de área + número, sin el 0 ni el 15. Acepta lo que la gente
 * escribe de verdad: "11 2233-4455", "011 15 2233-4455", "+54 11 2233 4455",
 * "223 15-455-6677". Un número de otro país (que empieza con + y no con 54)
 * se deja como está. Devuelve null si no alcanza para un número.
 */
export function normalizarWhatsappAR(entrada: string): string | null {
  const s = entrada.trim();
  if (!s) return null;
  const mas = s.startsWith('+');
  let d = s.replace(/\D/g, '');
  if (!d) return null;

  // Extranjero: se respeta tal cual.
  if (mas && !d.startsWith('54')) return /^\d{8,15}$/.test(d) ? `+${d}` : null;

  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  // El 15 va después del código de área (2 a 4 dígitos): sacarlo deja 10.
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === '15') {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  if (d.length !== 10) return null;
  return `+549${d}`;
}

/** "+5491122334455" → "+54 9 11 2233-4455" (o como vino, si no es argentino). */
export function formatearWhatsapp(numero: string | null | undefined): string {
  if (!numero) return '';
  const m = numero.match(/^\+549(\d{10})$/);
  if (!m) return numero;
  const d = m[1]!;
  // Área de Buenos Aires (11) de 2 dígitos; el resto se muestra con 3 + 7 o 4 + 6.
  const area = d.startsWith('11') ? 2 : d.startsWith('2') || d.startsWith('3') ? (d.length === 10 ? 3 : 4) : 3;
  const local = d.slice(area);
  return `+54 9 ${d.slice(0, area)} ${local.slice(0, local.length - 4)}-${local.slice(-4)}`;
}

/**
 * Botón de arrepentimiento y botón de baja de servicio (0147).
 *
 * Disposición 954/2025 (Subsecretaría de Defensa del Consumidor y Lealtad
 * Comercial, BO 04/09/2025), que derogó las Res. 424/2020 y 316/2018, y la
 * Disposición 3/2026 (DNDCyAC, BO 06/02/2026):
 *
 *   · Art. 1 y 4: dos links con esos nombres, a simple vista, en lugar
 *     destacado y en el primer acceso, que se usan SIN registración previa.
 *   · Art. 5: dentro de las 24 h y por el mismo medio, un código del pedido.
 *   · Art. 6: a la vista, el canal de consultas y el área responsable, con un
 *     horario de al menos 8 h por día hábil.
 *   · Res. SCI 274/2021: el link a la Ventanilla Federal de reclamos.
 *
 * El plazo para arrepentirse son 10 días corridos (Ley 24.240 art. 34, CCyC
 * art. 1110). Puro y sin alias de rutas: lo compila el runner de tests.
 */

export type TipoPedido = 'arrepentimiento' | 'baja';
export type Servicio = 'brote_plus' | 'tienda' | 'empresa' | 'anuncio' | 'otro';

/** Los nombres de los links, como los pide la norma (en mayúsculas en el texto oficial). */
export const ETIQUETA: Record<TipoPedido, string> = {
  arrepentimiento: 'Botón de arrepentimiento',
  baja: 'Botón de baja de servicio',
};

export const RUTA: Record<TipoPedido, string> = {
  arrepentimiento: '/legal/arrepentimiento',
  baja: '/legal/baja',
};

export const SERVICIOS: { v: Servicio; label: string }[] = [
  { v: 'brote_plus', label: 'Brote+ (suscripción personal)' },
  { v: 'tienda', label: 'Suscripción de mi tienda en el Mercado' },
  { v: 'empresa', label: 'Plan de mi empresa (programa Mejora)' },
  { v: 'anuncio', label: 'Un anuncio contratado' },
  { v: 'otro', label: 'Otro' },
];

/** Cómo se llama cada plan de negocio en pantalla (en la base: `biz_plan`). */
export const PLAN_NEGOCIO: Record<string, string> = {
  vendedor: 'Suscripción de tienda',
  semilla: 'Plan Semilla',
  raiz: 'Plan Raíz',
  bosque: 'Plan Bosque',
};

/** Días corridos para arrepentirse desde que se contrató. */
export const DIAS_ARREPENTIMIENTO = 10;

export function diasDesde(alta: string | Date, ahora: Date = new Date()): number {
  const t = typeof alta === 'string' ? new Date(alta).getTime() : alta.getTime();
  return Math.floor((ahora.getTime() - t) / 86_400_000);
}

/** Si un alta todavía está dentro de los 10 días corridos. */
export function dentroDelPlazo(alta: string | Date | null | undefined, ahora: Date = new Date()): boolean {
  if (!alta) return false;
  const t = typeof alta === 'string' ? new Date(alta).getTime() : alta.getTime();
  if (Number.isNaN(t)) return false;
  return ahora.getTime() - t <= DIAS_ARREPENTIMIENTO * 86_400_000;
}

/** ARR-XXXX-XXXX / BAJ-XXXX-XXXX, como los arma la base. */
export function codigoValido(c: string): boolean {
  return /^(ARR|BAJ)-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(c.trim().toUpperCase());
}

export function tipoDeCodigo(c: string): TipoPedido | null {
  const s = c.trim().toUpperCase();
  return s.startsWith('BAJ-') ? 'baja' : s.startsWith('ARR-') ? 'arrepentimiento' : null;
}

/** Res. SCI 274/2021: el texto y el destino del link de reclamos. */
export const DEFENSA_CONSUMIDOR = {
  texto: 'Defensa de las y los Consumidores. Para reclamos ingrese aquí',
  url: 'https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor',
};

/** Art. 6: quién atiende y cuándo (al menos 8 h por día hábil). */
export const ATENCION = {
  area: 'Atención a usuarios de Brote',
  horario: 'Lunes a viernes de 9 a 17 h (hora de Argentina)',
  respuesta: 'Respondemos dentro de las 24 h hábiles.',
};

export const ESTADO_PEDIDO: Record<string, string> = {
  recibida: 'Recibido',
  en_proceso: 'En proceso',
  resuelta: 'Resuelto',
  rechazada: 'No se pudo hacer',
};

export const ERROR_PEDIDO: Record<string, string> = {
  tipo: 'Elegí si es arrepentimiento o baja.',
  servicio: 'Elegí qué servicio.',
  nombre: 'Escribí tu nombre (2 letras o más).',
  email: 'Revisá el correo.',
  referencia: 'La referencia es muy larga (hasta 120 caracteres).',
  mensaje: 'El mensaje es muy largo (hasta 1000 caracteres).',
  demasiadas: 'Ya recibimos varios pedidos con ese correo hoy. Si es urgente, escribinos.',
  no_encontrada: 'No encontramos un pedido con ese código y ese correo.',
  error: 'No pudimos guardarlo. Probá de nuevo en un momento o escribinos.',
};

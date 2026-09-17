/**
 * Normalización de lo que escribe una empresa en el alta.
 *
 * Se usa en el cliente (para mostrar el error antes de guardar) y en el server
 * action (para no confiar en el cliente). La base vuelve a validar la forma en
 * `negocio_guardar_alta`: son tres capas a propósito, y esta es la amable.
 */

/** Dígito verificador de CUIT/CUIL, módulo 11. Igual que `brote_cuit_valido`. */
export function cuitValido(entrada: string): boolean {
  const d = entrada.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (!['20', '23', '24', '25', '26', '27', '30', '33', '34'].includes(d.slice(0, 2))) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, p, i) => acc + Number(d[i]) * p, 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) return false;
  return dv === Number(d[10]);
}

/** Solo dígitos, o null si quedó vacío. */
export function limpiarCuit(entrada: string): string | null {
  const d = entrada.replace(/\D/g, '');
  return d.length ? d : null;
}

/** `30712345671` → `30-71234567-1`. Con cualquier otra forma, la devuelve igual. */
export function formatearCuit(cuit: string | null | undefined): string {
  if (!cuit) return '';
  const d = cuit.replace(/\D/g, '');
  if (d.length !== 11) return cuit;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/**
 * El sitio, siempre como `https://dominio`, sin path (fase 1 §5.1 paso 2).
 * Acepta "panaderia.com.ar", "www.panaderia.com.ar/contacto", "http://…".
 * Devuelve null si no hay nada que se parezca a un dominio.
 */
export function normalizarSitio(entrada: string): string | null {
  let s = entrada.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  s = s.replace(/[/?#:].*$/, '');
  s = s.replace(/\.$/, '');
  // Un dominio de verdad: etiquetas alfanuméricas con guiones internos y un TLD.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(s)) return null;
  return `https://${s}`;
}

/** El dominio que se verifica: sin `www.`. Igual que `brote_dominio`. */
export function dominioDe(sitio: string | null | undefined): string | null {
  if (!sitio) return null;
  const host = sitio
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/:?#].*$/, '');
  return host || null;
}

/**
 * El handle limpio. Acepta `@handle`, `instagram.com/handle`,
 * `https://www.instagram.com/handle/?hl=es`. Devuelve null si no es un handle.
 */
export function normalizarInstagram(entrada: string): string | null {
  let s = entrada.trim().toLowerCase();
  if (!s) return null;
  const url = s.match(/instagram\.com\/([^/?#\s]+)/);
  if (url?.[1]) s = url[1];
  s = s.replace(/^@+/, '').replace(/\/+$/, '');
  if (!/^[a-z0-9._]{1,30}$/.test(s)) return null;
  return s;
}

/** Solo dígitos y un `+` inicial. Null si no alcanza para un número. */
export function normalizarWhatsapp(entrada: string): string | null {
  const s = entrada.trim();
  if (!s) return null;
  const limpio = (s.startsWith('+') ? '+' : '') + s.replace(/\D/g, '');
  return /^\+?\d{8,15}$/.test(limpio) ? limpio : null;
}

export function emailValido(entrada: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(entrada.trim()) && entrada.trim().length <= 160;
}

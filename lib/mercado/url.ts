import { lookup } from 'node:dns/promises';

/**
 * La URL de destino, viva (fase 3 §3): `https`, HEAD con 8 s de límite, y sin
 * redirigir a otro dominio que el declarado.
 *
 * Corre en el servidor de Next con la URL que escribió una empresa: sin los
 * guardias de abajo sería un proxy hacia adentro de la red donde corre. Mismos
 * criterios que `verify-business` (fase 1): solo nombres públicos, y cada salto
 * se resuelve y se rechaza si apunta a una IP interna.
 */

const TIMEOUT_MS = 8000;
const MAX_SALTOS = 3;

export type ResultadoUrl =
  | { ok: true; final: string }
  | { ok: false; codigo: 'url_invalida' | 'url_caida' | 'url_redirige' | 'url_bloqueada' };

export function hostSeguro(host: string): boolean {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,63}$/.test(host)) return false;
  if (/(^|\.)(localhost|local|localdomain|internal|intranet|home\.arpa|lan)$/.test(host)) return false;
  return true;
}

export function ipPrivada(ip: string): boolean {
  const v4 = /^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i.exec(ip);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

/** Segundos niveles donde el dominio "de la empresa" tiene tres partes. */
const SLD = new Set(['com.ar', 'gob.ar', 'org.ar', 'net.ar', 'edu.ar', 'int.ar', 'tur.ar', 'coop.ar', 'mutual.ar',
  'com.uy', 'com.br', 'com.mx', 'com.co', 'com.pe', 'com.cl', 'co.uk', 'com.es']);

/** `tienda.molino.com.ar` → `molino.com.ar`. */
export function dominioBase(host: string): string {
  const partes = host.toLowerCase().replace(/^www\./, '').split('.');
  const dos = partes.slice(-2).join('.');
  return SLD.has(dos) ? partes.slice(-3).join('.') : dos;
}

/** Normaliza lo que escribió la empresa: agrega `https://` si falta. */
export function normalizarUrl(u: string): string | null {
  const t = u.trim();
  if (!t) return null;
  const conEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const url = new URL(conEsquema);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function resuelveAInternet(host: string): Promise<boolean> {
  try {
    const ips = await lookup(host, { all: true });
    return ips.length > 0 && !ips.some((x) => ipPrivada(x.address));
  } catch {
    return false;
  }
}

/**
 * Chequea la URL. `declarados`: los dominios que la empresa declaró (su sitio);
 * un redirect a otro dominio que no sea el de la URL ni uno declarado se
 * rechaza (así no se cambia el destino por detrás después de la revisión).
 */
export async function verificarUrl(u: string, declarados: string[] = []): Promise<ResultadoUrl> {
  const normal = normalizarUrl(u);
  if (!normal) return { ok: false, codigo: 'url_invalida' };
  let actual = new URL(normal);
  const permitidos = new Set([dominioBase(actual.hostname), ...declarados.filter(Boolean).map(dominioBase)]);
  const limite = AbortSignal.timeout(TIMEOUT_MS);

  for (let salto = 0; salto <= MAX_SALTOS; salto++) {
    if (actual.protocol !== 'https:' || !hostSeguro(actual.hostname)) return { ok: false, codigo: 'url_bloqueada' };
    if (!permitidos.has(dominioBase(actual.hostname))) return { ok: false, codigo: 'url_redirige' };
    if (!(await resuelveAInternet(actual.hostname))) return { ok: false, codigo: 'url_caida' };

    let res: Response;
    try {
      res = await fetch(actual, { method: 'HEAD', redirect: 'manual', signal: limite, headers: { 'User-Agent': 'BroteMercado/1.0' } });
      // Hay tiendas que no contestan HEAD: se prueba un GET antes de dar por caída.
      if (res.status === 405 || res.status === 403 || res.status === 501) {
        res = await fetch(actual, { method: 'GET', redirect: 'manual', signal: limite, headers: { 'User-Agent': 'BroteMercado/1.0', Range: 'bytes=0-0' } });
        await res.body?.cancel().catch(() => {});
      }
    } catch {
      return { ok: false, codigo: 'url_caida' };
    }
    const destino = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && destino) {
      actual = new URL(destino, actual);
      continue;
    }
    return res.status < 400 ? { ok: true, final: actual.toString() } : { ok: false, codigo: 'url_caida' };
  }
  return { ok: false, codigo: 'url_redirige' };
}

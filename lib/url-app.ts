/**
 * La dirección pública de la app, para enlaces que salen de ella (Mercado Pago,
 * el sitemap, el kit de marca).
 *
 * No se le cree a `NEXT_PUBLIC_APP_URL` a ciegas: en producción llegó a estar
 * cargada con la URL de Supabase, y entonces la vuelta de Mercado Pago, el
 * sitemap y robots.txt apuntaban a un sitio que no es Brote. Se descarta si es
 * de Supabase, si no es http(s), o si es localhost en producción; después se
 * prueba la URL de producción que pone Vercel, y por último la del pedido.
 *
 * Puro y sin `next/headers`: lo usa también el runner de tests.
 */

function limpiar(u: string | null | undefined): string | null {
  if (!u) return null;
  const s = u.trim().replace(/\/+$/, '');
  if (!s) return null;
  const conProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(conProto);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** Si una dirección sirve como la de la app en este entorno. */
export function esUrlDeApp(u: string | null | undefined, produccion: boolean): boolean {
  const s = limpiar(u);
  if (!s) return false;
  const host = new URL(s).hostname;
  if (/(^|\.)supabase\.(co|in|net)$/i.test(host)) return false;
  if (produccion && (host === 'localhost' || host === '127.0.0.1')) return false;
  return true;
}

export interface FuentesUrl {
  env?: string | null;
  vercelProduccion?: string | null;
  pedido?: string | null;
  produccion?: boolean;
}

/** La primera que sirva: la variable, la de producción de Vercel, la del pedido. */
export function elegirUrlApp(f: FuentesUrl): string {
  const prod = f.produccion ?? false;
  for (const c of [f.env, f.vercelProduccion, f.pedido]) {
    if (esUrlDeApp(c, prod)) return limpiar(c)!;
  }
  return prod ? 'https://brote-ft7m.vercel.app' : 'http://localhost:3000';
}

/** Con lo que hay en el entorno de este proceso (sin mirar el pedido). */
export function urlAppEntorno(pedido?: string | null): string {
  return elegirUrlApp({
    env: process.env.NEXT_PUBLIC_APP_URL,
    vercelProduccion: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    pedido,
    produccion: process.env.NODE_ENV === 'production',
  });
}

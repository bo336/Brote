import { textoAdsTxt } from '@/lib/ads/ads-txt';

/**
 * `/ads.txt` (IAB): qué vendedores pueden vender anuncios en este dominio.
 * Se arma con el publisher id de AdSense (`NEXT_PUBLIC_ADSENSE_CLIENT`) y las
 * líneas extra de `ADS_TXT_EXTRA` (otras redes o vendedores directos, una por
 * línea), así que no hay que tocar el repositorio para cambiarlo.
 *
 * Antes era un archivo estático con un id de ejemplo, y además el middleware lo
 * mandaba al login: Google nunca lo podía leer.
 */
export const revalidate = 3600;

export function GET() {
  return new Response(textoAdsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

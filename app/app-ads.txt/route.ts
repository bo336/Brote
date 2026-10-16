import { textoAdsTxt } from '@/lib/ads/ads-txt';

/** `/app-ads.txt`: lo mismo que ads.txt, para cuando haya una app de tienda (AdMob). */
export const revalidate = 3600;

export function GET() {
  return new Response(textoAdsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

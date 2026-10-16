'use server';

import { createClient } from '@/lib/supabase/server';
import { urlApp } from '@/lib/pagos/mp-servidor';
import { textoAdsTxt } from '@/lib/ads/ads-txt';

/**
 * Qué falta para que AdSense funcione, visto desde el servidor
 * (/panel/publicidad). Sólo dice si cada variable está, nunca su valor —
 * salvo el id de editor, que es público (va en cada página y en ads.txt).
 */
export async function estadoAdsenseServidor(pass: string): Promise<{
  ok: boolean;
  cliente?: string;
  bloques?: Record<string, boolean>;
  rastreador?: boolean;
  app_url?: string;
  dominio_propio?: boolean;
  ads_txt?: string;
}> {
  const { data } = await createClient().rpc('admin_check', { p_pass: pass });
  if (data !== true) return { ok: false };
  const app = urlApp();
  const host = (() => {
    try {
      return new URL(app).hostname;
    } catch {
      return '';
    }
  })();
  return {
    ok: true,
    cliente: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '',
    bloques: {
      'news-feed': !!process.env.NEXT_PUBLIC_ADSLOT_NEWS_FEED,
      'news-article': !!process.env.NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE,
      'ranking-footer': !!process.env.NEXT_PUBLIC_ADSLOT_RANKING,
      'catalog-footer': !!process.env.NEXT_PUBLIC_ADSLOT_CATALOG,
      guia: !!(process.env.NEXT_PUBLIC_ADSLOT_GUIA || process.env.NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE),
    },
    rastreador: !!process.env.ADSENSE_CRAWLER_EMAIL,
    app_url: app,
    // Recomendado, no obligatorio: vercel.app está en la Public Suffix List,
    // así que <proyecto>.vercel.app/ads.txt vale. Pero el sitio queda dado de
    // alta en AdSense con ESE nombre, y mudarse después es volver a pedirlo.
    dominio_propio: !!host && !host.endsWith('.vercel.app') && host !== 'localhost',
    ads_txt: textoAdsTxt(),
  };
}

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://brote.vercel.app';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] },
      // El rastreador de AdSense lee las páginas donde hay anuncios para
      // elegirlos; con la regla de arriba no podía usar la entrada de
      // `/auth/crawler` (docs/PUBLICIDAD.md §4). Un grupo propio la reemplaza.
      { userAgent: 'Mediapartners-Google', allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

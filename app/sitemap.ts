import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://brote.vercel.app';
  const routes = ['', '/acciones', '/explorar', '/ranking', '/perfil', '/instalar'];
  return routes.map((r) => ({ url: `${base}${r}`, lastModified: new Date(), changeFrequency: 'weekly', priority: r === '' ? 1 : 0.7 }));
}

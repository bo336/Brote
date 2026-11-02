import type { MetadataRoute } from 'next';
import { leerGuia } from '@/lib/guia';

export const revalidate = 3600;

/**
 * Sólo lo que se lee sin cuenta: la guía de acciones (0135) y los textos
 * legales. El resto de Brote está detrás del login, y listarlo sólo le daba a
 * los buscadores redirecciones a /auth/login.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://brote.vercel.app';
  const ahora = new Date();
  const fijas: MetadataRoute.Sitemap = [
    { url: base, lastModified: ahora, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/guia`, lastModified: ahora, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/instalar`, lastModified: ahora, changeFrequency: 'monthly', priority: 0.5 },
    ...['terminos', 'privacidad', 'fuentes', 'normas', 'niveles', 'negocios'].map((p) => ({
      url: `${base}/legal/${p}`,
      lastModified: ahora,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
  ];
  const acciones = (await leerGuia()).map((a) => ({
    url: `${base}/guia/${a.slug}`,
    lastModified: ahora,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  return [...fijas, ...acciones];
}

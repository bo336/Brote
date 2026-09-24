import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FichaListado } from '@/components/mercado/FichaListado';
import { getCuentaMercado, getFicha } from '@/lib/mercado/servidor';
import { urlImagen } from '@/lib/mercado/imagenes';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const f = await getFicha(params.slug);
  if (!f) return {};
  const img = urlImagen(f.imagenes[0] ?? f.imagen);
  // Al compartir por WhatsApp se ve la foto y la tienda, no un enlace pelado.
  return {
    title: f.titulo,
    description: `${f.negocio.nombre}${f.negocio.provincia ? ` · ${f.negocio.provincia}` : ''}`,
    openGraph: { title: f.titulo, images: img ? [{ url: img }] : undefined },
  };
}

/**
 * `/mercado/[slug]`. La base decide qué ve cada cuenta: un `kid` no ve nada,
 * un `teen` no ve precios ni categorías sensibles, y los miembros de la tienda
 * ven su producto sin publicar como vista previa.
 */
const ORIGENES = ['accion', 'plaza', 'perfil_negocio', 'catalogo', 'busqueda'] as const;

export default async function FichaPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { de?: string };
}) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();
  const f = await getFicha(params.slug);
  if (!f) notFound();
  // "Seguí viendo": lo visto hace poco. Una fila por persona y producto, que
  // la base borra a los 120 días. La tienda no ve quién miró.
  if (!f.vista_previa && !f.propia) await createClient().rpc('mercado_visto', { p_listing: f.id });
  // De dónde venía quien llegó acá: el clic de salida lo registra con ese
  // origen, que es lo que después arma "de dónde vinieron" en la analítica.
  const de = (ORIGENES as readonly string[]).includes(searchParams.de ?? '') ? searchParams.de! : 'ficha';
  return <FichaListado f={f} origen={de} propia={!!f.propia} />;
}

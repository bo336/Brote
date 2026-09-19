import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FichaListado } from '@/components/mercado/FichaListado';
import { getCuentaMercado, getFicha } from '@/lib/mercado/servidor';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const f = await getFicha(params.slug);
  return { title: f?.titulo };
}

/**
 * `/mercado/[slug]`. La base decide qué ve cada cuenta: un `kid` no ve nada,
 * un `teen` no ve precios ni categorías sensibles, y los miembros del negocio
 * ven su listado sin publicar como vista previa.
 */
export default async function FichaPage({ params }: { params: { slug: string } }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();
  const f = await getFicha(params.slug);
  if (!f) notFound();
  return <FichaListado f={f} />;
}

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
  // De dónde venía quien llegó acá: el clic de salida lo registra con ese
  // origen, que es lo que después arma "de dónde vinieron" en la analítica.
  const de = (ORIGENES as readonly string[]).includes(searchParams.de ?? '') ? searchParams.de! : 'ficha';
  return <FichaListado f={f} origen={de} />;
}

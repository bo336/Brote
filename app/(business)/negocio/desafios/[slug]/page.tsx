import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActiveBusiness } from '@/lib/negocio/context';
import { DetalleDesafioEmpresa } from '@/components/negocio/desafios/DetalleDesafio';

export const metadata: Metadata = { title: 'Desafío' };

/** `/negocio/desafios/[slug]` — un desafío: requisitos, evidencia, envío y certificado. */
export default async function DesafioPage({ params }: { params: { slug: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  return <DetalleDesafioEmpresa negocioId={activo.id} slug={params.slug} />;
}

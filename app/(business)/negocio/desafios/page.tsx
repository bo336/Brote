import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getActiveBusiness } from '@/lib/negocio/context';
import { ListaDesafios } from '@/components/negocio/desafios/ListaDesafios';

export const metadata: Metadata = { title: 'Desafíos' };

/** `/negocio/desafios` — los desafíos de Brote y los certificados de esta empresa (0132). */
export default async function DesafiosPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  return <ListaDesafios negocioId={activo.id} />;
}

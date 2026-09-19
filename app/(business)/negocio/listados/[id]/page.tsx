import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { EstadoListado } from '@/components/negocio/listados/EstadoListado';
import { getListadoDetalle } from '@/lib/mercado/servidor';
import { getActiveBusiness } from '@/lib/negocio/context';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (!UUID.test(params.id)) return {};
  const d = await getListadoDetalle(params.id);
  return { title: d?.listado.titulo };
}

/** `/negocio/listados/[id]` — el estado de un listado. `listado_detalle` chequea la membresía. */
export default async function ListadoPage({ params }: { params: { id: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  if (!UUID.test(params.id)) notFound();
  const detalle = await getListadoDetalle(params.id);
  if (!detalle) notFound();
  return <EstadoListado detalle={detalle} />;
}

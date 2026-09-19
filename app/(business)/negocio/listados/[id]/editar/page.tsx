import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { FormListado } from '@/components/negocio/listados/FormListado';
import { getCertificaciones, getListadoDetalle, getMisAfirmaciones } from '@/lib/mercado/servidor';
import { getActiveBusiness } from '@/lib/negocio/context';
import { puede } from '@/lib/negocio/roles';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (!UUID.test(params.id)) return {};
  const d = await getListadoDetalle(params.id);
  return { title: d?.listado.titulo };
}

/**
 * `/negocio/listados/[id]/editar?paso=N`. Solo en borrador o fuera del
 * Mercado: uno pendiente o publicado se ve en su ficha de estado, y para
 * editarlo primero se retira (vuelve a pasar por revisión).
 */
export default async function EditarListadoPage({ params, searchParams }: { params: { id: string }; searchParams: { paso?: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  if (!UUID.test(params.id)) notFound();
  const detalle = await getListadoDetalle(params.id);
  if (!detalle) notFound();
  if (!['draft', 'despublicado'].includes(detalle.listado.status) || !puede(detalle.rol, 'crear_listado')) {
    redirect(`/negocio/listados/${params.id}`);
  }

  const [certs, disponibles] = await Promise.all([getCertificaciones(), getMisAfirmaciones(detalle.listado.business_id)]);
  return (
    <FormListado
      negocioId={detalle.listado.business_id}
      listado={detalle.listado}
      afirmaciones={detalle.afirmaciones}
      disponibles={disponibles}
      certs={certs}
      verificacionFuerte={detalle.verificacion === 'fuerte'}
      paso={Math.max(0, (Number(searchParams.paso) || 1) - 1)}
    />
  );
}

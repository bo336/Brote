import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AltaEnviada, AltaNegocio, ElegirNegocio } from '@/components/negocio/alta/AltaNegocio';
import { getActiveBusiness, getMisNegocios, getNegocioDetalle } from '@/lib/negocio/context';
import { puede } from '@/lib/negocio/roles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.alta');
  return { title: t('tituloNuevo') };
}

const MAX_NEGOCIOS_OWNER = 3;

/**
 * `/negocio/alta` — el alta en 5 pasos (fase 1 §5).
 *
 * El paso vive en la URL (`?paso=3`) y los valores vienen del servidor en cada
 * paso: guardar y avanzar es guardar y volver a pedir la página. Así un
 * refresco, un segundo dispositivo o volver otro día retoman exactamente donde
 * quedó, sin estado de cliente que se pierda.
 */
export default async function AltaPage({
  searchParams,
}: {
  searchParams: { nuevo?: string; paso?: string; enviado?: string };
}) {
  const [negocios, activo] = await Promise.all([getMisNegocios(), getActiveBusiness()]);
  const propios = negocios.filter((n) => n.role === 'owner').length;
  const nuevo = searchParams.nuevo === '1';

  if (!activo || nuevo) {
    // Tiene negocios pero no eligió ninguno: primero elegir, crear es la segunda opción.
    if (!nuevo && negocios.length > 0) {
      return <ElegirNegocio negocios={negocios} puedeCrear={propios < MAX_NEGOCIOS_OWNER} />;
    }
    if (propios >= MAX_NEGOCIOS_OWNER) return <ElegirNegocio negocios={negocios} puedeCrear={false} />;
    return <AltaNegocio negocio={null} paso={1} />;
  }

  const negocio = await getNegocioDetalle(activo.id);
  if (!negocio) redirect('/negocio/contexto');

  const enRevision = negocio.status === 'submitted' || negocio.status === 'in_review';
  if (searchParams.enviado === '1' && enRevision && !negocio.revision_note) {
    return <AltaEnviada negocio={negocio} />;
  }

  const reaplicable =
    negocio.status === 'rejected' &&
    !!negocio.puede_reaplicar_at &&
    new Date(negocio.puede_reaplicar_at).getTime() <= Date.now();
  const editable =
    negocio.status === 'draft' || (enRevision && !!negocio.revision_note) || reaplicable;
  if (!editable || !puede(negocio.role, 'editar_negocio')) redirect('/negocio');

  // En borrador no se salta hacia adelante de lo guardado; una solicitud ya
  // enviada tiene los cinco pasos completos.
  const maxPaso = negocio.status === 'draft' ? Math.min(5, Math.max(1, negocio.alta_paso)) : 5;
  const pedido = Number(searchParams.paso);
  const paso = Number.isInteger(pedido) && pedido >= 1 ? Math.min(pedido, maxPaso) : negocio.status === 'draft' ? maxPaso : 1;

  return <AltaNegocio negocio={negocio} paso={paso} />;
}

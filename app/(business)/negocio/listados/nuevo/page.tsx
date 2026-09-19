import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FormListado } from '@/components/negocio/listados/FormListado';
import { getCertificaciones, getMisListados } from '@/lib/mercado/servidor';
import { getActiveBusiness } from '@/lib/negocio/context';
import { puede } from '@/lib/negocio/roles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.listados');
  return { title: t('nuevo') };
}

/** `/negocio/listados/nuevo` — el primer paso. El listado existe al terminarlo. */
export default async function NuevoListadoPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const datos = await getMisListados(activo.id);
  if (!datos) redirect('/negocio/contexto');
  if (datos.negocio.status !== 'approved' || !puede(datos.rol, 'crear_listado')) redirect('/negocio/listados');

  const certs = await getCertificaciones();
  return (
    <FormListado
      negocioId={activo.id}
      listado={null}
      afirmaciones={[]}
      disponibles={[]}
      certs={certs}
      verificacionFuerte={datos.negocio.verificacion === 'fuerte'}
      paso={0}
    />
  );
}

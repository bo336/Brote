import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FormListado } from '@/components/negocio/listados/FormListado';
import { FormProducto } from '@/components/negocio/vendedor/FormProducto';
import { getCertificaciones, getMisListados } from '@/lib/mercado/servidor';
import { getActiveBusiness } from '@/lib/negocio/context';
import { puede } from '@/lib/negocio/roles';
import { getEstadoVendedor } from '@/lib/negocio/vendedor-acciones';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.listados');
  return { title: t('nuevo') };
}

/**
 * `/negocio/listados/nuevo`. Una tienda nueva (Mercado v2) usa el formulario
 * de una página; lo dado de alta con el flujo anterior, el de cuatro pasos.
 */
export default async function NuevoListadoPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const datos = await getMisListados(activo.id);
  if (!datos) redirect('/negocio/contexto');
  if (datos.negocio.status !== 'approved' || !puede(datos.rol, 'crear_listado')) redirect('/negocio/listados');

  const certs = await getCertificaciones();
  if (datos.negocio.modelo === 'vendedor') {
    const estado = await getEstadoVendedor(activo.id);
    if (!estado) redirect('/negocio/contexto');
    return (
      <FormProducto
        negocioId={activo.id}
        listado={null}
        afirmaciones={[]}
        disponibles={[]}
        certs={certs}
        verificacionFuerte={datos.negocio.verificacion === 'fuerte'}
        canales={{
          modelo: 'vendedor',
          whatsapp: !!estado.tienda.whatsapp,
          instagram: !!estado.tienda.instagram,
          sitio_web: estado.tienda.sitio_web,
          contacto_preferido: estado.tienda.contacto_preferido,
          provincia: estado.tienda.provincia,
        }}
      />
    );
  }
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

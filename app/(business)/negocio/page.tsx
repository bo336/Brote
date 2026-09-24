import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResumenNegocio } from '@/components/negocio/ResumenNegocio';
import { InicioTienda } from '@/components/negocio/vendedor/InicioTienda';
import { getMisListados } from '@/lib/mercado/servidor';
import { getActiveBusiness, getNegocioDetalle } from '@/lib/negocio/context';
import { getEstadoVendedor } from '@/lib/negocio/vendedor-acciones';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio');
  return { title: t('marca') };
}

/**
 * `/negocio` — el inicio del espacio de la tienda.
 *
 * Una tienda del alta nueva que todavía no abrió vuelve al alta (lo único que
 * puede hacer es terminarla); una abierta ve cómo le va. Lo dado de alta con
 * el flujo anterior sigue con su resumen de siempre.
 */
export default async function ResumenPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = await getEstadoVendedor(activo.id);
  if (estado?.modelo === 'vendedor') {
    if (!estado.abierta) redirect('/negocio/alta');
    const datos = await getMisListados(activo.id);
    if (!datos) redirect('/negocio/contexto');
    return <InicioTienda estado={estado} datos={datos} />;
  }
  const negocio = await getNegocioDetalle(activo.id);
  if (!negocio) redirect('/negocio/contexto');
  return <ResumenNegocio negocio={negocio} />;
}

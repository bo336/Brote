import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PerfilTienda } from '@/components/negocio/vendedor/PerfilTienda';
import { getActiveBusiness } from '@/lib/negocio/context';
import { getEstadoVendedor } from '@/lib/negocio/vendedor-acciones';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.vendedor.perfil');
  return { title: t('titulo') };
}

/** `/negocio/tienda` — el perfil de una tienda del alta nueva. */
export default async function TiendaPerfilPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = await getEstadoVendedor(activo.id);
  if (!estado) redirect('/negocio/contexto');
  if (estado.modelo !== 'vendedor') redirect('/negocio');
  if (!estado.abierta) redirect('/negocio/alta');
  if (estado.rol !== 'owner' && estado.rol !== 'admin') redirect('/negocio');
  return <PerfilTienda estado={estado} />;
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BandejaPreguntas } from '@/components/negocio/vendedor/BandejaPreguntas';
import { getPreguntasTienda } from '@/lib/mercado/servidor';
import { getActiveBusiness } from '@/lib/negocio/context';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.vendedor.preguntas');
  return { title: t('titulo') };
}

/** `/negocio/preguntas` — la bandeja de preguntas de la tienda. */
export default async function PreguntasPage({ searchParams }: { searchParams: { estado?: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = searchParams.estado === 'respondidas' || searchParams.estado === 'ocultas' ? searchParams.estado : 'pendientes';
  const datos = await getPreguntasTienda(activo.id, estado);
  if (!datos) redirect('/negocio/contexto');
  return <BandejaPreguntas datos={datos} estado={estado} />;
}

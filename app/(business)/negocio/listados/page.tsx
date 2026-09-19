import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MisListados } from '@/components/negocio/listados/MisListados';
import { getMisListados } from '@/lib/mercado/servidor';
import { getActiveBusiness } from '@/lib/negocio/context';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.listados');
  return { title: t('titulo') };
}

/** `/negocio/listados` — lo que el negocio tiene en el Mercado. */
export default async function ListadosPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const datos = await getMisListados(activo.id);
  if (!datos) redirect('/negocio/contexto');
  return <MisListados datos={datos} />;
}

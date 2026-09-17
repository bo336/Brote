import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ProgramaMejora } from '@/components/negocio/mejora/ProgramaMejora';
import { getActiveBusiness, getMejoraEstado } from '@/lib/negocio/context';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.mejora');
  return { title: `${t('titulo')} · Brote` };
}

/** `/negocio/mejora` — el programa: propuestas, activos y cerrados (07 §4.4). */
export default async function MejoraPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = await getMejoraEstado(activo.id);
  if (!estado) redirect('/negocio/contexto');
  return <ProgramaMejora estado={estado} />;
}

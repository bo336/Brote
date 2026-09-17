import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResumenNegocio } from '@/components/negocio/ResumenNegocio';
import { getActiveBusiness, getNegocioDetalle } from '@/lib/negocio/context';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio');
  return { title: t('marca') };
}

/** `/negocio` — Resumen. En la fase 1: el estado de la solicitud y lo próximo. */
export default async function ResumenPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const negocio = await getNegocioDetalle(activo.id);
  if (!negocio) redirect('/negocio/contexto');
  return <ResumenNegocio negocio={negocio} />;
}

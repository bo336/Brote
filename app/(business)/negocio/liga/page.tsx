import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LigaEmpresas } from '@/components/negocio/empresa/LigaEmpresas';
import { RUBROS } from '@/lib/negocio/catalogo';
import { getActiveBusiness, getLigaEmpresas, getMiPuestoLiga } from '@/lib/negocio/context';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.liga');
  return { title: t('titulo') };
}

/** `/negocio/liga` — la Liga de empresas de la temporada (0121). */
export default async function LigaPage({ searchParams }: { searchParams: { rubro?: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const rubro = searchParams.rubro && (RUBROS as readonly string[]).includes(searchParams.rubro) ? searchParams.rubro : null;
  const [liga, mio] = await Promise.all([getLigaEmpresas(rubro), getMiPuestoLiga(activo.id)]);
  return <LigaEmpresas liga={liga} mio={mio} miId={activo.id} rubro={rubro} />;
}

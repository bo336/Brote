import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { GuardadosMercado } from '@/components/mercado/GuardadosMercado';
import { getCuentaMercado, getGuardados } from '@/lib/mercado/servidor';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.guardados');
  return { title: t('titulo'), robots: { index: false, follow: false } };
}

/** `/mercado/guardados` — lo que la persona guardó, miró y sigue. */
export default async function GuardadosPage({ searchParams }: { searchParams: { tab?: string } }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();
  const g = await getGuardados();
  if (!g) notFound();
  const tab = searchParams.tab === 'vistos' || searchParams.tab === 'tiendas' ? searchParams.tab : 'guardados';
  return <GuardadosMercado g={g} pestana={tab} />;
}

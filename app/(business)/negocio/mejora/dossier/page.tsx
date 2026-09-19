import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DossierNegocio } from '@/components/negocio/mejora/Dossier';
import { DOSSIER_VACIO, normalizarDossier } from '@/lib/mejora/dossier';
import { getActiveBusiness, getMejoraEstado } from '@/lib/negocio/context';
import { puede } from '@/lib/negocio/roles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.mejora.dossier');
  return { title: t('titulo') };
}

/** `/negocio/mejora/dossier` — los ocho bloques, uno por pantalla (fase 2 §4). */
export default async function DossierPage({ searchParams }: { searchParams: { b?: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = await getMejoraEstado(activo.id);
  if (!estado) redirect('/negocio/contexto');

  const dossier = estado.dossier ? normalizarDossier(estado.dossier) : DOSSIER_VACIO;
  return (
    <DossierNegocio
      negocioId={activo.id}
      inicial={dossier}
      completitudInicial={estado.dossier?.completitud ?? 0}
      puedeEditar={puede(estado.rol, 'editar_negocio')}
      bloqueInicial={Number(searchParams.b ?? 0) || 0}
    />
  );
}

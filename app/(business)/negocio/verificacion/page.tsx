import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { VerificacionMetodos } from '@/components/negocio/VerificacionMetodos';
import { getActiveBusiness, getNegocioDetalle } from '@/lib/negocio/context';
import { puede } from '@/lib/negocio/roles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.verificacion');
  return { title: t('eyebrow') };
}

/** `/negocio/verificacion` (fase 1 §6.2, 07 §4.3). */
export default async function VerificacionPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const negocio = await getNegocioDetalle(activo.id);
  if (!negocio) redirect('/negocio/contexto');
  const t = await getTranslations('negocio.verificacion');

  const cerrado = negocio.status === 'suspended' || negocio.status === 'closed';

  return (
    <div className="max-w-2xl">
      <header className="mb-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1.5 font-display text-display-l font-bold">{t('titulo')}</h1>
        <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{t('subtitulo')}</p>
      </header>
      {/* Verificar es cosa de owner y admin: la base lo vuelve a chequear. */}
      <VerificacionMetodos negocio={negocio} puedeEditar={!cerrado && puede(negocio.role, 'editar_negocio')} />
    </div>
  );
}

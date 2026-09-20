import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { KitDeMarca } from '@/components/negocio/KitDeMarca';
import { getActiveBusiness } from '@/lib/negocio/context';
import { getDatosSugerencias } from '@/lib/negocio/plan-servidor';

export const metadata: Metadata = { title: 'Kit de marca' };

/**
 * `/negocio/kit`. Va en todos los planes, a propósito: cada sello puesto en el
 * sitio de una empresa es un enlace entrante hacia Brote (09 §7). Treinta
 * empresas son treinta enlaces, y eso es adquisición que no cuesta nada.
 */
export default async function KitPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  if (activo.status !== 'approved') redirect('/negocio');

  const t = await getTranslations('negocio.kit');
  const datos = await getDatosSugerencias(activo.id);
  const cerrados = datos?.ciclos.length ?? 0;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://brote-ft7m.vercel.app';

  return (
    <div className="space-y-6">
      <header>
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold">{t('titulo')}</h1>
        <p className="mt-2 max-w-prose text-small leading-relaxed text-muted-foreground">{t('bajada')}</p>
      </header>
      <KitDeMarca
        slug={activo.slug}
        nombre={activo.nombre}
        nivel={activo.tier}
        objetivosCerrados={cerrados}
        base={base}
      />
    </div>
  );
}

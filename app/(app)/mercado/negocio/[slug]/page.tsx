import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowLeft, BadgeCheck, MapPin, Store } from 'lucide-react';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { getCatalogo, getCuentaMercado, getNegocioPublico } from '@/lib/mercado/servidor';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const n = await getNegocioPublico(params.slug);
  return { title: n?.negocio.nombre };
}

/**
 * `/mercado/negocio/[slug]` — la ficha pública de un comercio (fase 3 §7.3):
 * descripción, nivel, verificación, ubicación y listados. El historial público
 * de mejora depende del plan (fase 4): acá queda el enganche, vacío hasta
 * entonces. El sitio del comercio se muestra como texto: las salidas hacia un
 * comercio pasan por el interstitial de cada listado.
 */
export default async function NegocioPublicoPage({ params }: { params: { slug: string } }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();
  const datos = await getNegocioPublico(params.slug);
  if (!datos) notFound();
  const n = datos.negocio;
  const [t, tf, f] = await Promise.all([
    getTranslations('mercado.negocioPublico'),
    getTranslations('mercado.ficha'),
    getFormatter(),
  ]);
  const listados = await getCatalogo(
    { categoria: null, dominio: null, nivel: null, zona: null, modalidad: null, orden: 'recomendados', negocio: n.id },
    null,
    cuenta,
  );
  const lugar = [n.ciudad, n.provincia].filter(Boolean).join(', ');

  return (
    <div className="pb-16">
      <Link href="/mercado" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {tf('volver')}
      </Link>

      <header className="mt-5 flex items-start gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-surface-2">
          {n.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.logo} alt="" className="h-16 w-16 object-cover" />
          ) : (
            <Store className="h-7 w-7 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0">
          <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
          <h1 className="mt-1 font-display text-display-l font-bold leading-tight">{n.nombre}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <NivelBadge nivel={n.tier} />
            {n.fundador && (
              <span className="rounded-pill border border-border px-2.5 py-1 text-caption font-semibold">{t('fundador')}</span>
            )}
          </div>
        </div>
      </header>

      <ul className="mt-6 max-w-2xl space-y-2 border-y border-hairline py-4 text-small">
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
          {t(`verificacion.${n.verificacion ?? 'ninguna'}`)}
        </li>
        {lugar && (
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            {lugar}
          </li>
        )}
        {n.sitio_web && (
          <li className="flex items-center gap-2 text-muted-foreground">
            {t('sitio')}: <span className="font-mono text-caption">{n.sitio_web}</span>
          </li>
        )}
        <li className="text-caption text-muted-foreground">{t('desde', { fecha: f.dateTime(new Date(n.desde), { month: 'long', year: 'numeric' }) })}</li>
      </ul>

      {n.descripcion && <p className="mt-5 max-w-prose whitespace-pre-line text-body leading-relaxed">{n.descripcion}</p>}

      {n.nota_correccion && (
        <div className="mt-6 max-w-2xl border-l-2 border-brote-sun pl-3">
          <span className="eyebrow text-muted-foreground">{t('correccion')}</span>
          <p className="mt-1 text-small leading-relaxed">{n.nota_correccion}</p>
        </div>
      )}

      {datos.mejora.length > 0 && (
        <section className="mt-8 max-w-2xl">
          <span className="eyebrow text-muted-foreground">{t('mejora')}</span>
          <ul className="mt-2 border-y border-hairline divide-hairline">
            {datos.mejora.map((g) => (
              <li key={`${g.titulo}-${g.cerrado_at}`} className="flex items-center justify-between gap-3 py-3 text-small">
                <span>{g.titulo}</span>
                <span className="text-caption text-muted-foreground">{f.dateTime(new Date(g.cerrado_at), { month: 'long', year: 'numeric' })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <span className="eyebrow text-muted-foreground">{t('listados')}</span>
        {listados.items.length === 0 ? (
          <p className="mt-2 border-y border-hairline py-6 text-small text-muted-foreground">{t('vacio')}</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {listados.items.map((item) => (
              <li key={item.id}>
                <TarjetaListado t={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

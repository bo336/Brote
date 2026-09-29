import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowLeft, BadgeCheck, CalendarDays, Globe, MapPin, Store } from 'lucide-react';
import { BotonCompartir } from '@/components/mercado/BotonCompartir';
import { BotonSeguir } from '@/components/mercado/BotonSeguir';
import { CompromisosTienda } from '@/components/mercado/CompromisosTienda';
import { GrillaInfinita } from '@/components/mercado/GrillaInfinita';
import { visualCategoria } from '@/components/mercado/categoria-visual';
import { buscar, getCuentaMercado, getNegocioPublico, type FiltrosBusqueda } from '@/lib/mercado/servidor';
import { esCategoria } from '@/lib/mercado/categorias';
import { urlLogo } from '@/lib/mercado/imagenes';
import { cn } from '@/lib/utils/cn';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getNegocioPublico(params.slug);
  if (!d) return {};
  const logo = urlLogo(d.negocio.logo);
  return {
    title: d.negocio.nombre,
    description: d.negocio.descripcion ?? undefined,
    openGraph: { title: d.negocio.nombre, images: logo ? [{ url: logo }] : undefined },
  };
}

/**
 * `/mercado/tienda/[slug]` — la vidriera de una tienda.
 *
 * Arriba, quién es: nombre, dónde está, desde cuándo vende en Brote, cuántas
 * personas la siguen, y su compromiso con las fotos que lo muestran. Debajo,
 * todo lo que publica, con un filtro por categoría si tiene de varias.
 *
 * Sin cuenta se ve la tienda (el sello del kit de marca linkea acá desde el
 * sitio de la tienda) pero no sus productos: los precios y las categorías
 * sensibles dependen de quién mira (08 §9).
 */
export default async function TiendaPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { categoria?: string };
}) {
  const cuenta = await getCuentaMercado();
  if (cuenta?.tipo === 'kid') notFound();
  const datos = await getNegocioPublico(params.slug);
  if (!datos) notFound();
  const n = datos.negocio;
  const [t, tn, tc, f] = await Promise.all([
    getTranslations('mercado.tienda'),
    getTranslations('mercado.negocioPublico'),
    getTranslations('mercado.categorias'),
    getFormatter(),
  ]);

  const categoria = esCategoria(searchParams.categoria) ? searchParams.categoria : null;
  const filtros: FiltrosBusqueda = {
    q: null, categoria, subcategoria: null, nivel: null, zona: null, modalidad: null, condicion: null,
    precioMin: null, precioMax: null, orden: 'recomendados', negocio: n.id,
  };
  const productos = cuenta ? await buscar(filtros, 0, cuenta) : null;
  const logo = urlLogo(n.logo);
  const lugar = [n.ciudad, n.provincia].filter(Boolean).join(', ');
  const acento = visualCategoria(n.categoria_principal ?? '').color;
  const categorias = Object.entries(n.categorias ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div data-shell="wide" className="pb-20">
      {cuenta && (
        <Link href="/mercado" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('volver')}
        </Link>
      )}

      <header className="relative mt-3 overflow-hidden rounded-card border border-border bg-surface">
        <div className="h-24 sm:h-32" style={{ background: `linear-gradient(120deg, ${acento}55, ${acento}14 60%, transparent)` }} aria-hidden />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-2 shadow-soft">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-20 w-20 object-cover" />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground" />
              )}
            </span>
            <div className="flex items-center gap-2 pb-1">
              <BotonCompartir titulo={n.nombre} ruta={`/mercado/tienda/${n.slug}`} className="border border-border" />
              {cuenta && !n.propia && typeof n.seguida === 'boolean' && <BotonSeguir negocioId={n.id} inicial={n.seguida} />}
              {n.propia && (
                <Link href="/negocio" className="press inline-flex h-10 items-center rounded-pill border border-border px-4 text-small font-semibold hover:bg-surface-2">
                  {t('administrar')}
                </Link>
              )}
            </div>
          </div>
          <h1 className="mt-3 font-display text-display-l font-bold leading-tight">{n.nombre}</h1>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-small text-muted-foreground">
            {lugar && (
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {lugar}
              </li>
            )}
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {tn('desde', { fecha: f.dateTime(new Date(n.desde), { month: 'long', year: 'numeric' }) })}
            </li>
            {n.sitio_web && (
              <li className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                <span className="font-mono text-caption">{n.sitio_web}</span>
              </li>
            )}
            {n.mp_vinculado && (
              <li className="inline-flex items-center gap-1.5" title={t('mpAyuda')}>
                <BadgeCheck className="h-4 w-4 text-brote-aqua" />
                {t('mpVinculado')}
              </li>
            )}
          </ul>
          <p className="mt-3 flex gap-5 text-small">
            <span>
              <strong className="font-display tnum">{n.productos ?? 0}</strong> <span className="text-muted-foreground">{t('productos')}</span>
            </span>
            <span>
              <strong className="font-display tnum">{n.seguidores ?? 0}</strong> <span className="text-muted-foreground">{t('seguidores')}</span>
            </span>
          </p>
          {n.descripcion && <p className="mt-3 max-w-prose whitespace-pre-line text-body leading-relaxed">{n.descripcion}</p>}
        </div>
      </header>

      {n.nota_correccion && (
        <div className="mt-6 max-w-2xl border-l-2 border-brote-sun pl-3">
          <span className="eyebrow text-muted-foreground">{tn('correccion')}</span>
          <p className="mt-1 text-small leading-relaxed">{n.nota_correccion}</p>
        </div>
      )}

      {(n.compromisos?.length ?? 0) > 0 && (
        <section id="compromiso" className="mt-8 scroll-mt-20">
          <h2 className="font-display text-h3 font-bold">{t('compromisoTitulo')}</h2>
          <p className="mt-1 max-w-prose text-small text-muted-foreground">{t('compromisoAyuda')}</p>
          <CompromisosTienda compromisos={n.compromisos ?? []} variante="fotos" className="mt-3" />
        </section>
      )}

      {datos.mejora.length > 0 && (
        <section className="mt-8 max-w-2xl">
          <h2 className="font-display text-h3 font-bold">{tn('mejora')}</h2>
          <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
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
        <h2 className="font-display text-h3 font-bold">{t('todoLoQuePublica')}</h2>
        {!cuenta ? (
          <p className="mt-3 rounded-card border border-border bg-surface p-5 text-small text-muted-foreground">
            {tn('entrarParaVer')}{' '}
            <Link href={`/auth/login?next=${encodeURIComponent(`/mercado/tienda/${params.slug}`)}`} className="link-underline font-semibold text-primary">
              {tn('entrar')}
            </Link>
          </p>
        ) : (
          <>
            {categorias.length > 1 && (
              <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
                <li className="shrink-0">
                  <Link
                    href={`/mercado/tienda/${n.slug}`}
                    scroll={false}
                    className={cn('press inline-flex h-9 items-center rounded-pill border px-3.5 text-small font-medium', !categoria ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface')}
                  >
                    {t('todo')} <span className="ml-1 text-muted-foreground tnum">{n.productos}</span>
                  </Link>
                </li>
                {categorias.map(([c, cant]) => (
                  <li key={c} className="shrink-0">
                    <Link
                      href={`/mercado/tienda/${n.slug}?categoria=${c}`}
                      scroll={false}
                      className={cn('press inline-flex h-9 items-center rounded-pill border px-3.5 text-small font-medium', categoria === c ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface')}
                    >
                      {tc(c)} <span className="ml-1 text-muted-foreground tnum">{cant}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {productos && productos.items.length > 0 ? (
              <GrillaInfinita
                inicial={productos.items}
                total={productos.total}
                filtros={filtros}
                origen="perfil_negocio"
                cardOrigen="perfil_negocio"
                className="mt-4"
              />
            ) : (
              <p className="mt-3 rounded-card border border-border bg-surface p-5 text-small text-muted-foreground">{tn('vacio')}</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

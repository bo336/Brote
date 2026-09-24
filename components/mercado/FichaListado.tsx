import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, ExternalLink, Heart, Info, Instagram, MapPin, MessageCircle, Truck } from 'lucide-react';
import { BotonCompartir } from '@/components/mercado/BotonCompartir';
import { BotonGuardar } from '@/components/mercado/BotonGuardar';
import { Estante } from '@/components/mercado/Estante';
import { GaleriaFotos } from '@/components/mercado/GaleriaFotos';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { PreguntasListado } from '@/components/mercado/PreguntasListado';
import { ReportarListado } from '@/components/mercado/ReportarListado';
import { TarjetaVendedor } from '@/components/mercado/TarjetaVendedor';
import { buttonVariants } from '@/components/ui/button';
import { urlBusqueda } from '@/lib/mercado/busqueda';
import { CLAIMS } from '@/lib/mercado/claims';
import { formatoPrecio, urlImagen } from '@/lib/mercado/imagenes';
import type { FichaMercado } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * `/mercado/[slug]` — la ficha de un producto (Mercado v2).
 *
 * Arriba, lo que decide: las fotos, el precio de referencia, cómo se consigue,
 * y UN botón que lleva a la tienda por su canal (WhatsApp, Instagram o su
 * sitio) — siempre a través del interstitial, que registra el clic. En el
 * teléfono ese botón queda fijo abajo, arriba de la barra de pestañas.
 *
 * Después, lo que da confianza: quién vende (y su compromiso), qué afirma el
 * producto con el nivel de CADA afirmación (antihalo: la certificación de la
 * harina no tiñe el envase), las preguntas con sus respuestas, y dos filas
 * para seguir mirando: más de esta tienda y parecidos.
 */
export function FichaListado({ f, origen = 'ficha', propia = false }: { f: FichaMercado; origen?: string; propia?: boolean }) {
  const t = useTranslations('mercado.ficha');
  const t2 = useTranslations('mercado.ficha2');
  const tn = useTranslations('mercado.nivel');
  const tc = useTranslations('mercado.categorias');
  const tm = useTranslations('mercado');
  const tco = useTranslations('mercado.condicion');
  const fotos = (f.imagenes.length ? f.imagenes : f.imagen ? [f.imagen] : [])
    .map((r) => urlImagen(r))
    .filter((x): x is string => !!x);
  const bajo = f.precio !== null && f.precio_anterior != null && Number(f.precio_anterior) > Number(f.precio);
  const canal = f.contacto ?? 'web';
  const salida = `/mercado/salir/${f.id}?o=${origen}`;
  const zonas = f.zonas.filter(Boolean);

  const cta = (
    <>
      {canal === 'whatsapp' ? <MessageCircle className="h-5 w-5" /> : canal === 'instagram' ? <Instagram className="h-5 w-5" /> : null}
      {canal === 'whatsapp' ? t2('ctaWhatsapp') : canal === 'instagram' ? t2('ctaInstagram') : t('cta', { comercio: f.negocio.nombre })}
      {canal === 'web' && <ExternalLink className="h-4 w-4" />}
    </>
  );

  return (
    <article data-shell="wide" className="pb-36 lg:pb-16">
      <Link href="/mercado" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('volver')}
      </Link>

      {f.vista_previa && (
        <p className="mt-3 flex items-start gap-2 rounded-card border border-brote-sun/40 bg-brote-sun/10 px-3.5 py-2.5 text-small">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brote-sun" />
          {t('vistaPrevia')}
        </p>
      )}

      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <GaleriaFotos fotos={fotos} titulo={f.titulo}>
            <div className="absolute right-3 top-3 flex gap-2">
              <BotonCompartir titulo={f.titulo} ruta={`/mercado/${f.slug}`} />
              {!f.vista_previa && !propia && <BotonGuardar listingId={f.id} inicial={!!f.favorito} />}
            </div>
          </GaleriaFotos>
        </div>

        <div className="mt-5 lg:sticky lg:top-4 lg:mt-0 lg:self-start">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-caption text-muted-foreground">
            {f.condicion && f.condicion !== 'nuevo' && (
              <span className="rounded-pill bg-surface-2 px-2 py-0.5 font-semibold text-foreground">{tco(f.condicion)}</span>
            )}
            <Link href={urlBusqueda({ categoria: f.categoria, subcategoria: f.subcategoria ?? null })} className="hover:text-foreground">
              {f.subcategoria ? tm(`subcategorias.${f.categoria}.${f.subcategoria}`) : tc(f.categoria)}
            </Link>
            {(f.favoritos ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {t2('guardadoPor', { n: f.favoritos ?? 0 })}
              </span>
            )}
          </div>

          <h1 className="mt-2 font-display text-h1 font-bold leading-tight">{f.titulo}</h1>

          {f.precio !== null && (
            <div className="mt-4">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="font-display text-display-l font-bold tnum">{formatoPrecio(Number(f.precio), f.moneda)}</span>
                {bajo && (
                  <s className="text-body text-muted-foreground tnum">{formatoPrecio(Number(f.precio_anterior), f.moneda)}</s>
                )}
              </div>
              <span className="mt-0.5 block text-caption text-muted-foreground">{t('precioRef')}</span>
            </div>
          )}

          <ul className="mt-4 space-y-1.5 text-small">
            {f.disponibilidad !== 'local' && (
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" />
                <span>{zonas.length ? t2('envioA', { zonas: zonas.join(', ') }) : t2('envioPais')}</span>
              </li>
            )}
            {f.disponibilidad !== 'online' && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{t2('retiroEn', { lugar: [f.negocio.ciudad, f.negocio.provincia].filter(Boolean).join(', ') || t2('laTienda') })}</span>
              </li>
            )}
          </ul>

          {/* En escritorio el botón vive acá; en el teléfono, fijo abajo. */}
          <div className="mt-5 hidden gap-2 lg:flex">
            {f.vista_previa ? (
              <span className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'pointer-events-none flex-1 rounded-pill opacity-50')}>{cta}</span>
            ) : (
              <Link href={salida} prefetch={false} className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'flex-1 rounded-pill bg-brand-gradient text-white')}>
                {cta}
              </Link>
            )}
            {!f.vista_previa && !propia && <BotonGuardar listingId={f.id} inicial={!!f.favorito} variante="boton" />}
          </div>
          <p className="mt-2 hidden text-caption text-muted-foreground lg:block">{t2('comoSeCompra', { comercio: f.negocio.nombre })}</p>

          <div className="mt-5">
            <TarjetaVendedor n={f.negocio} propia={propia} />
          </div>
        </div>
      </div>

      <div className="mt-10 max-w-3xl space-y-10">
        <section>
          <h2 className="font-display text-h3 font-bold">{t2('descripcion')}</h2>
          <p className="mt-2 whitespace-pre-line text-body leading-relaxed">{f.descripcion}</p>
        </section>

        <section>
          <h2 className="font-display text-h3 font-bold">{f.tipo === 'servicio' ? t('queAfirmaServicio') : t('queAfirma')}</h2>
          {f.afirmaciones.length === 0 ? (
            <p className="mt-2 text-small leading-relaxed text-muted-foreground">{t2('sinAfirmaciones')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
              {f.afirmaciones.map((a) => (
                <li key={a.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-body font-semibold">{CLAIMS[a.kind].nombre}</span>
                    <NivelBadge nivel={a.tier} tamano="sm" className="shrink-0" />
                  </div>
                  <p className="mt-1 text-small leading-relaxed">
                    {CLAIMS[a.kind].textoPublico(
                      { kind: a.kind, alcance: a.alcance, datos: a.datos, cert_numero: a.cert_numero, cert_vence: a.cert_vence, cert: a.cert },
                      a.tier,
                    )}
                  </p>
                  <p className="mt-1 text-caption text-muted-foreground">{tn(`${a.tier}.explicacion`)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {f.negocio.nota_correccion && (
          <div className="border-l-2 border-brote-sun pl-3">
            <span className="eyebrow text-muted-foreground">{t('correccion')}</span>
            <p className="mt-1 text-small leading-relaxed">{f.negocio.nota_correccion}</p>
          </div>
        )}

        {!f.vista_previa && (
          <PreguntasListado
            listingId={f.id}
            inicial={f.preguntas ?? []}
            total={f.preguntas_total ?? 0}
            tienda={f.negocio.nombre}
            propia={propia}
          />
        )}
      </div>

      <div className="mt-12 space-y-10">
        {(f.mas_de_la_tienda?.length ?? 0) > 0 && (
          <Estante
            titulo={t2('masDeLaTienda', { tienda: f.negocio.nombre })}
            verTodo={`/mercado/tienda/${f.negocio.slug}`}
            items={f.mas_de_la_tienda ?? []}
            origen="perfil_negocio"
            cardOrigen="perfil_negocio"
          />
        )}
        {(f.parecidos?.length ?? 0) >= 2 && (
          <Estante
            titulo={t2('parecidos')}
            verTodo={urlBusqueda({ categoria: f.categoria, subcategoria: f.subcategoria ?? null })}
            items={f.parecidos ?? []}
          />
        )}
      </div>

      <footer className="mt-12 max-w-3xl border-t border-hairline pt-5">
        <p className="text-caption leading-relaxed text-muted-foreground">{t('pie', { comercio: f.negocio.nombre })}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/legal/niveles" className="inline-flex items-center gap-1 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
            <span className="link-underline">{t('comoFuncionan')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {!f.vista_previa && !propia && <ReportarListado listingId={f.id} yaReportado={f.ya_reportado} />}
        </div>
      </footer>

      {/* El botón del teléfono: fijo, arriba de la barra de pestañas. */}
      {!f.vista_previa && (
        <div className="fixed inset-x-0 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur-lg lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {f.precio !== null && (
              <span className="min-w-0 shrink">
                <span className="block font-display text-h3 font-bold leading-none tnum">{formatoPrecio(Number(f.precio), f.moneda)}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{t2('deReferencia')}</span>
              </span>
            )}
            <Link href={salida} prefetch={false} className={cn(buttonVariants({ variant: 'primary' }), 'h-12 flex-1 rounded-pill bg-brand-gradient text-white')}>
              {cta}
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

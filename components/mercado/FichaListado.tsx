import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, ExternalLink, ImageOff, Info } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { ReportarListado } from '@/components/mercado/ReportarListado';
import { CLAIMS } from '@/lib/mercado/claims';
import { formatoPrecio, urlImagen } from '@/lib/mercado/imagenes';
import type { FichaMercado } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * `/mercado/[slug]` — la ficha (07 §4.8). Jerarquía Apple: UNA decisión, UN
 * botón.
 *
 * Lo más importante de la pantalla: cada afirmación con SU nivel. Un producto
 * puede mostrar una en Nivel 3 y otra en Nivel 1 al mismo tiempo — la regla
 * antihalo hecha interfaz, y lo que hace que alguien confíe en el catálogo
 * entero. La certificación de la harina no tiñe el envase.
 */
export function FichaListado({ f, origen = 'ficha' }: { f: FichaMercado; origen?: string }) {
  const t = useTranslations('mercado.ficha');
  const tn = useTranslations('mercado.nivel');
  const tc = useTranslations('mercado.categorias');
  const img = urlImagen(f.imagenes[0] ?? f.imagen);
  const resto = f.imagenes.slice(1).map((r) => urlImagen(r)).filter((x): x is string => !!x);

  return (
    <article className="mx-auto max-w-2xl pb-16">
      <Link href="/mercado" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('volver')}
      </Link>

      {f.vista_previa && (
        <p className="mt-4 flex items-start gap-2 rounded-card border border-brote-sun/40 bg-brote-sun/10 px-3.5 py-2.5 text-small">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brote-sun" />
          {t('vistaPrevia')}
        </p>
      )}

      {/* La única `.leaf-clip` de la página. */}
      <div className="leaf-clip relative mt-4 aspect-[4/3] overflow-hidden bg-surface-2">
        {img ? (
          <Image src={img} alt={f.titulo} fill priority sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </span>
        )}
      </div>
      {resto.length > 0 && (
        <ul className="mt-2 flex gap-2">
          {resto.map((src) => (
            <li key={src} className="relative h-16 w-16 overflow-hidden rounded-[12px] bg-surface-2">
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </li>
          ))}
        </ul>
      )}

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <Link href={`/mercado/negocio/${f.negocio.slug}`} className="eyebrow text-muted-foreground transition-colors duration-150 hover:text-foreground">
            {f.negocio.nombre}
          </Link>
          <span aria-hidden className="text-muted-foreground">·</span>
          <span className="eyebrow text-muted-foreground">{tc(f.categoria)}</span>
          <NivelBadge nivel={f.tier} tamano="sm" />
        </div>
        <h1 className="mt-2 bg-brand-gradient bg-clip-text font-display text-hero font-bold leading-[1.05] text-transparent">{f.titulo}</h1>
      </header>

      {f.precio !== null && (
        <div className="mt-5">
          <span className="block text-caption text-muted-foreground">{t('precioRef')}</span>
          <span className="mt-0.5 block font-display text-h1 font-bold tnum">{formatoPrecio(Number(f.precio), f.moneda)}</span>
        </div>
      )}

      {/* El único CTA. Toda salida pasa por el interstitial. */}
      <div className="mt-6">
        {f.vista_previa ? (
          <span className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'pointer-events-none w-full rounded-pill opacity-50 sm:w-auto')}>
            {t('cta', { comercio: f.negocio.nombre })}
          </span>
        ) : (
          <Link
            href={`/mercado/salir/${f.id}?o=${origen}`}
            prefetch={false}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full rounded-pill bg-brand-gradient text-white sm:w-auto')}
          >
            {t('cta', { comercio: f.negocio.nombre })}
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      <section className="mt-10">
        <span className="eyebrow text-muted-foreground">{f.tipo === 'servicio' ? t('queAfirmaServicio') : t('queAfirma')}</span>
        {f.afirmaciones.length === 0 ? (
          <p className="mt-2 border-y border-hairline py-4 text-small text-muted-foreground">{t('sinAfirmaciones')}</p>
        ) : (
          <ul className="mt-2 border-y border-hairline divide-hairline">
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

      <section className="mt-8">
        <span className="eyebrow text-muted-foreground">{f.negocio.nombre}</span>
        <p className="mt-1.5 whitespace-pre-line text-body leading-relaxed">{f.descripcion}</p>
      </section>

      {f.negocio.nota_correccion && (
        <div className="mt-6 border-l-2 border-brote-sun pl-3">
          <span className="eyebrow text-muted-foreground">{t('correccion')}</span>
          <p className="mt-1 text-small leading-relaxed">{f.negocio.nota_correccion}</p>
        </div>
      )}

      <footer className="mt-10 border-t border-hairline pt-5">
        <p className="text-caption leading-relaxed text-muted-foreground">{t('pie', { comercio: f.negocio.nombre })}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/legal/niveles" className="inline-flex items-center gap-1 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
            <span className="link-underline">{t('comoFuncionan')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {!f.vista_previa && <ReportarListado listingId={f.id} yaReportado={f.ya_reportado} />}
        </div>
      </footer>
    </article>
  );
}

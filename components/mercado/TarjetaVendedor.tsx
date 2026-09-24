import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { BadgeCheck, ChevronRight, MapPin, Store } from 'lucide-react';
import { BotonSeguir } from '@/components/mercado/BotonSeguir';
import { CompromisosTienda } from '@/components/mercado/CompromisosTienda';
import { urlLogo } from '@/lib/mercado/imagenes';
import type { FichaMercado } from '@/lib/supabase/rows-mercado';

/**
 * Quién vende, en la ficha: el logo, desde dónde, desde cuándo vende en Brote,
 * cuántos productos tiene, si su cuenta de Mercado Pago está vinculada, y sus
 * compromisos. Seguirla está a un toque.
 */
export function TarjetaVendedor({ n, propia }: { n: FichaMercado['negocio']; propia: boolean }) {
  const t = useTranslations('mercado.tienda');
  const formato = useFormatter();
  const logo = urlLogo(n.logo);
  const lugar = [n.ciudad, n.provincia].filter(Boolean).join(', ');

  return (
    <section aria-label={t('quienVende')} className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <Link href={`/mercado/tienda/${n.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-12 w-12 object-cover" />
            ) : (
              <Store className="h-5 w-5 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-small font-semibold">
              <span className="truncate">{n.nombre}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </span>
            {lugar && (
              <span className="flex items-center gap-1 truncate text-caption text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {lugar}
              </span>
            )}
          </span>
        </Link>
        {!propia && typeof n.seguida === 'boolean' && <BotonSeguir negocioId={n.id} inicial={n.seguida} tamano="sm" />}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Dato valor={String(n.productos ?? 0)} etiqueta={t('productos')} />
        <Dato valor={String(n.seguidores ?? 0)} etiqueta={t('seguidores')} />
        <Dato valor={n.desde ? formato.dateTime(new Date(n.desde), { month: 'short', year: 'numeric' }) : '—'} etiqueta={t('vendeDesde')} />
      </dl>

      {n.mp_vinculado && (
        <p className="mt-3 flex items-center gap-1.5 text-caption text-muted-foreground" title={t('mpAyuda')}>
          <BadgeCheck className="h-4 w-4 text-brote-aqua" />
          {t('mpVinculado')}
        </p>
      )}

      {n.compromisos && n.compromisos.length > 0 && (
        <div className="mt-3 border-t border-hairline pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('compromiso')}</span>
          <CompromisosTienda compromisos={n.compromisos} className="mt-1.5" />
        </div>
      )}
    </section>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-button bg-surface-2 px-2 py-2">
      <dt className="sr-only">{etiqueta}</dt>
      <dd className="font-display text-body font-bold tnum">{valor}</dd>
      <dd className="text-[11px] text-muted-foreground">{etiqueta}</dd>
    </div>
  );
}

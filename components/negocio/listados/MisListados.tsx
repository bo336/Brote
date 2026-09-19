import Image from 'next/image';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle, ChevronRight, ImageOff, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { urlImagen } from '@/lib/mercado/imagenes';
import { puede } from '@/lib/negocio/roles';
import type { ListingStatus, MisListados as Datos } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/** El color del estado, en el eyebrow. Rechazado y fuera del Mercado: coral y ámbar. */
const TONO: Record<ListingStatus, string> = {
  draft: 'text-muted-foreground',
  pendiente: 'text-nivel-2',
  publicado: 'text-primary',
  despublicado: 'text-brote-sun',
  rechazado: 'text-brote-coral',
  removido: 'text-muted-foreground',
};

/**
 * `/negocio/listados`: filas con hairline, denso, como un panel (07 §1). El
 * nivel que se ve acá es el del LISTADO para ordenar; la ficha muestra cada
 * afirmación con el suyo.
 */
export function MisListados({ datos }: { datos: Datos }) {
  const t = useTranslations('mercado.listados');
  const tc = useTranslations('mercado.categorias');
  const f = useFormatter();
  const aprobado = datos.negocio.status === 'approved';
  const puedeCrear = aprobado && puede(datos.rol, 'crear_listado');

  return (
    <div className="max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
          <h1 className="mt-1.5 font-display text-display-l font-bold">{t('titulo')}</h1>
        </div>
        {puedeCrear && (
          <Link href="/negocio/listados/nuevo" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'rounded-pill')}>
            <Plus className="h-4 w-4" />
            {t('nuevo')}
          </Link>
        )}
      </header>

      {!aprobado && <p className="mt-4 text-small text-muted-foreground">{t('noAprobado')}</p>}

      {datos.listados.length === 0 ? (
        <div className="mt-8 border-y border-hairline py-8">
          <p className="text-body font-semibold">{t('vacio.titulo')}</p>
          <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{t('vacio.cuerpo')}</p>
        </div>
      ) : (
        <ul className="mt-6 border-y border-hairline divide-hairline">
          {datos.listados.map((l, i) => {
            const img = urlImagen(l.imagen);
            return (
              <li
                key={l.id}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-both"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <Link href={`/negocio/listados/${l.id}`} className="group flex items-center gap-3.5 py-3.5">
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-surface-2">
                    {img ? (
                      <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <ImageOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                      <span className={TONO[l.status]}>{t(`estado.${l.status}`)}</span>
                      <span aria-hidden>·</span>
                      <span>{tc(l.categoria)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-body font-semibold">
                      <span className="link-underline">{l.titulo}</span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption text-muted-foreground tnum">
                      <span>{t('afirmaciones', { n: l.afirmaciones })}</span>
                      {l.status === 'publicado' && <span>{t('clics', { n: l.clics_30d })}</span>}
                      <span>{t('actualizado', { fecha: f.dateTime(new Date(l.updated_at), { day: 'numeric', month: 'short' }) })}</span>
                      {l.reportes_abiertos > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-brote-sun">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('reportes', { n: l.reportes_abiertos })}
                        </span>
                      )}
                    </span>
                  </span>
                  {l.status === 'publicado' && <NivelBadge nivel={l.tier_efectivo} tamano="sm" enlace={false} className="hidden sm:inline-flex" />}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

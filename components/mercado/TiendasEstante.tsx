import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Store } from 'lucide-react';
import { BotonSeguir } from '@/components/mercado/BotonSeguir';
import { urlImagen, urlLogo } from '@/lib/mercado/imagenes';
import type { TiendaResumen } from '@/lib/supabase/rows-mercado';

/**
 * Tiendas para conocer: cada una con tres de sus productos, cuántos tiene y
 * un botón para seguirla. Seguir es lo que trae de vuelta: la próxima vez que
 * publique algo, llega un aviso.
 */
export function TiendasEstante({ tiendas, titulo }: { tiendas: TiendaResumen[]; titulo: string }) {
  const t = useTranslations('mercado.inicio');
  if (tiendas.length < 3) return null;
  return (
    <section aria-label={titulo}>
      <h2 className="mb-3 font-display text-h3 font-bold">{titulo}</h2>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {tiendas.slice(0, 8).map((s) => {
          const logo = urlLogo(s.logo);
          const fotos = (s.imagenes ?? []).map((i) => urlImagen(i)).filter((x): x is string => !!x).slice(0, 3);
          return (
            <li key={s.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto">
              <Link
                href={`/mercado/tienda/${s.slug}`}
                className="press group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow duration-200 hover:shadow-lift"
              >
                <div className="grid h-24 grid-cols-3 gap-px bg-border">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="relative bg-surface-2">
                      {fotos[i] && <Image src={fotos[i]!} alt="" fill sizes="120px" className="object-cover" />}
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 items-center gap-3 p-3">
                  <span className="-mt-9 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-surface-2 shadow-soft">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" className="h-12 w-12 object-cover" />
                    ) : (
                      <Store className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-semibold">{s.nombre}</span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {t('productosN', { n: s.productos })}
                      {s.ciudad || s.provincia ? ` · ${s.ciudad ?? s.provincia}` : ''}
                    </span>
                  </span>
                  <BotonSeguir negocioId={s.id} inicial={!!s.seguida} tamano="sm" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

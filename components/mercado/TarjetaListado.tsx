import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ImageOff } from 'lucide-react';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { formatoPrecio, urlImagen } from '@/lib/mercado/imagenes';
import type { TarjetaMercado } from '@/lib/supabase/rows-mercado';

/**
 * La tarjeta del catálogo (07 §4.7): densidad de MELI con la tipografía de
 * Bitácora Viva. El nivel SIEMPRE visible — no se esconde el E1, se etiqueta.
 *
 * El badge es su propio enlace (a `/legal/niveles`), así que la tarjeta no es
 * un único `<a>`: son dos enlaces hermanos, nunca uno dentro de otro.
 */
export function TarjetaListado({
  t: item,
  prioridad = false,
  origen,
}: {
  t: TarjetaMercado;
  prioridad?: boolean;
  /**
   * Desde dónde se la está viendo: viaja hasta el clic de salida (fase 4 §2.2).
   * Son los orígenes que `mercado_salir` acepta; la pestaña del Mercado en la
   * Plaza cuenta como catálogo, que es lo que es.
   */
  origen?: 'accion' | 'catalogo' | 'perfil_negocio';
}) {
  const t = useTranslations('mercado.catalogo');
  const img = urlImagen(item.imagen);
  const href = origen ? `/mercado/${item.slug}?de=${origen}` : `/mercado/${item.slug}`;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-card bg-surface-2" tabIndex={-1} aria-hidden>
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            priority={prioridad}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </span>
        )}
      </Link>
      <div className="mt-2.5 flex flex-1 flex-col">
        <NivelBadge nivel={item.tier} tamano="sm" className="self-start" />
        <Link href={href} className="mt-1.5 line-clamp-2 text-small font-semibold leading-snug">
          <span className="link-underline">{item.titulo}</span>
        </Link>
        <span className="mt-0.5 truncate text-caption text-muted-foreground">{item.negocio.nombre}</span>
        {item.precio !== null && (
          <span className="mt-auto pt-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('precioRef')}</span>
            <span className="block font-display text-body font-bold tnum">{formatoPrecio(Number(item.precio), item.moneda)}</span>
          </span>
        )}
      </div>
    </article>
  );
}

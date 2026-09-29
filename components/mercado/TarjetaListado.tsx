import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ImageOff, MapPin, Truck } from 'lucide-react';
import { BotonGuardar } from '@/components/mercado/BotonGuardar';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { formatoPrecio, urlImagen } from '@/lib/mercado/imagenes';
import type { TarjetaMercado } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * La tarjeta de un producto (Mercado v2). Lo que decide si alguien entra está
 * arriba: la foto, el precio de referencia (y el anterior, si bajó de verdad),
 * el título. Después, de quién es y cómo se consigue.
 *
 * - El nivel aparece SOLO si el producto tiene una afirmación con nivel: un
 *   producto sin afirmaciones no lleva badge, y el de la tienda no se le pasa
 *   (antihalo).
 * - "Precio" nunca va solo: siempre "de referencia" (08 §4.3). Lo publica la
 *   tienda; la compra pasa en su canal.
 * - El corazón guarda sin entrar: es un botón dentro de la foto, no un enlace
 *   anidado.
 */
export function TarjetaListado({
  t: item,
  prioridad = false,
  origen,
  compacta = false,
  className,
}: {
  t: TarjetaMercado;
  prioridad?: boolean;
  /**
   * Desde dónde se la está viendo: viaja hasta el clic de salida (fase 4 §2.2).
   * Son los orígenes que `mercado_salir` acepta.
   */
  origen?: 'accion' | 'catalogo' | 'perfil_negocio' | 'busqueda';
  /** En un estante horizontal: sin la fila de etiquetas. */
  compacta?: boolean;
  className?: string;
}) {
  const t = useTranslations('mercado.tarjeta');
  const tc = useTranslations('mercado.condicion');
  const img = urlImagen(item.imagen);
  const href = origen ? `/mercado/${item.slug}?de=${origen}` : `/mercado/${item.slug}`;
  const bajo = item.precio !== null && item.precio_anterior != null && Number(item.precio_anterior) > Number(item.precio);
  const lugar = item.negocio.ciudad ?? item.negocio.provincia;

  return (
    <article className={cn('group relative flex min-w-0 flex-col', className)}>
      <div className="relative aspect-square overflow-hidden rounded-card bg-surface-2">
        <Link href={href} className="absolute inset-0" tabIndex={-1} aria-hidden>
          {img ? (
            <Image
              src={img}
              alt=""
              fill
              priority={prioridad}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-6 w-6" />
            </span>
          )}
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {item.condicion && item.condicion !== 'nuevo' && (
            <span className="rounded-pill bg-background/90 px-2 py-0.5 text-[11px] font-semibold shadow-soft backdrop-blur-sm">
              {tc(item.condicion)}
            </span>
          )}
          {bajo && (
            <span className="rounded-pill bg-brote-green px-2 py-0.5 text-[11px] font-bold text-white shadow-soft">{t('bajo')}</span>
          )}
        </div>
        <BotonGuardar listingId={item.id} inicial={!!item.favorito} className="absolute right-2 top-2" />
      </div>

      <div className="mt-2.5 flex min-w-0 flex-1 flex-col">
        {item.precio !== null ? (
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-display text-[1.15rem] font-bold leading-none tnum">{formatoPrecio(Number(item.precio), item.moneda)}</span>
            {bajo && (
              <s className="text-caption text-muted-foreground tnum">{formatoPrecio(Number(item.precio_anterior), item.moneda)}</s>
            )}
            <span className="w-full text-[10px] font-medium text-muted-foreground">{t('deReferencia')}</span>
          </div>
        ) : item.tiene_precio === false && item.tipo === 'servicio' ? (
          <span className="text-small font-semibold text-muted-foreground">{t('aConsultar')}</span>
        ) : null}

        <Link href={href} className="mt-1 line-clamp-2 text-small font-medium leading-snug">
          <span className="link-underline">{item.titulo}</span>
        </Link>
        <span className="mt-0.5 truncate text-caption text-muted-foreground">
          {item.negocio.nombre}
          {lugar ? ` · ${lugar}` : ''}
        </span>

        {!compacta && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.disponibilidad !== 'local' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brote-green">
                <Truck className="h-3.5 w-3.5" />
                {t('envio')}
              </span>
            )}
            {item.disponibilidad !== 'online' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {t('retiro')}
              </span>
            )}
            {item.tier !== 'e0' && <NivelBadge nivel={item.tier} tamano="sm" />}
          </div>
        )}
      </div>
    </article>
  );
}

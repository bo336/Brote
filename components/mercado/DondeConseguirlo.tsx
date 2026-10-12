'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { buttonVariants } from '@/components/ui/button-variants';
import { getPuenteAccion, marcarVistas } from '@/lib/mercado/acciones';
import { urlBusqueda } from '@/lib/mercado/busqueda';
import type { Puente } from '@/lib/mercado/servidor';

/**
 * "Dónde conseguirlo" (02 §6.1), debajo de las instrucciones de una acción que
 * pide un producto (detergente biodegradable, legumbres a granel, plantines
 * nativos…).
 *
 * Lo decide la base (`mercado_para_accion`, 0123): sólo adultos; con 3
 * empresas o más, las tarjetas y el botón; con 1 o 2, sólo el botón a la
 * búsqueda filtrada; con ninguna, nada. Nunca en el camino de completar, y
 * este componente NO llama a `complete_activity` ni suma un solo punto:
 * comprar no es una acción de Brote.
 *
 * Se renderiza VISIBLE y recién después anima. El repo ya perdió dos
 * componentes por arrancar en `opacity: 0` con el frame loop estrangulado
 * (CountUp y NewsNudge): acá no hay animación de entrada, y punto.
 */
export function DondeConseguirlo({ slugAccion }: { slugAccion: string }) {
  const t = useTranslations('mercado.puente');
  const [datos, setDatos] = useState<Puente | null>(null);
  const pedido = useRef(false);

  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    void getPuenteAccion(slugAccion).then(setDatos);
  }, [slugAccion]);

  // La impresión se cuenta una vez por sesión y por listado, con su origen:
  // así la empresa puede ver cuánto le trajo el puente y cuánto el catálogo.
  useEffect(() => {
    if (!datos?.items.length) return;
    void marcarVistas(
      datos.items.map((i) => i.id),
      'accion',
    );
  }, [datos]);

  if (!datos) return null;
  const conTarjetas = datos.items.length >= 3;
  const total = datos.total ?? datos.items.length;
  if (!conTarjetas && total < 1) return null;

  return (
    <section aria-labelledby="donde-conseguirlo">
      <span className="eyebrow mb-1 block text-muted-foreground tnum" id="donde-conseguirlo">
        {t('titulo')} · {t('cuantos', { n: total })}
      </span>
      <p className="mb-3 text-small leading-relaxed text-muted-foreground">{datos.texto ?? t('ayuda')}</p>
      {conTarjetas && (
        <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
          {datos.items.slice(0, 3).map((item) => (
            <TarjetaListado key={item.id} t={item} origen="accion" />
          ))}
        </div>
      )}
      <Link
        href={urlBusqueda({ categoria: datos.categoria, subcategoria: datos.subcategoria ?? null })}
        prefetch={false}
        className={buttonVariants({ variant: 'secondary', block: true })}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden />
        {t('boton')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <p className="mt-2 text-caption leading-relaxed text-muted-foreground">{t('aclaracion')}</p>
    </section>
  );
}

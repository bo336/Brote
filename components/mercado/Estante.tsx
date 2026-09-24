'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { useImpresiones } from '@/components/mercado/useImpresiones';
import type { OrigenVista } from '@/lib/mercado/acciones';
import type { TarjetaMercado } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * Un estante: una fila horizontal de productos con su título y un "Ver todo".
 *
 * El desplazamiento es el nativo (scroll-snap): el pulgar, la inercia y el
 * trackpad los pone el sistema. En escritorio aparecen flechas, que solo se
 * muestran si hay para dónde ir. Las tarjetas miden lo mismo en todos los
 * estantes, así un inicio con seis estantes se lee como una grilla ordenada.
 */
export function Estante({
  titulo,
  subtitulo,
  verTodo,
  items,
  origen = 'catalogo',
  cardOrigen,
  prioridad = false,
  className,
}: {
  titulo: string;
  subtitulo?: string;
  verTodo?: string | null;
  items: TarjetaMercado[];
  origen?: OrigenVista;
  cardOrigen?: 'accion' | 'catalogo' | 'perfil_negocio' | 'busqueda';
  prioridad?: boolean;
  className?: string;
}) {
  const t = useTranslations('mercado.inicio');
  const ref = useImpresiones<HTMLUListElement>(origen, items);
  const [puede, setPuede] = useState({ izq: false, der: false });

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPuede({ izq: el.scrollLeft > 4, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      el.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, [medir, ref]);

  function mover(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  }

  if (items.length === 0) return null;

  return (
    <section className={cn('min-w-0', className)} aria-label={titulo}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-h3 font-bold">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 line-clamp-1 text-caption text-muted-foreground">{subtitulo}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {verTodo && (
            <Link href={verTodo} className="text-small font-semibold text-primary">
              <span className="link-underline">{t('verTodo')}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={!puede.izq}
            aria-label={t('anterior')}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-surface transition-opacity duration-150 disabled:opacity-30 lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={!puede.der}
            aria-label={t('siguiente')}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-surface transition-opacity duration-150 disabled:opacity-30 lg:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ul
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 lg:mx-0 lg:px-0"
      >
        {items.map((item, i) => (
          <li key={item.id} data-listado={item.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-[18.5%]">
            <TarjetaListado t={item} prioridad={prioridad && i < 3} origen={cardOrigen} compacta />
          </li>
        ))}
      </ul>
    </section>
  );
}

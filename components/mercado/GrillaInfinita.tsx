'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { useImpresiones } from '@/components/mercado/useImpresiones';
import { Skeleton } from '@/components/ui/skeleton';
import { buscarPagina, type OrigenVista } from '@/lib/mercado/acciones';
import type { FiltrosBusqueda } from '@/lib/mercado/servidor';
import type { TarjetaMercado } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * Una grilla que se sigue cargando sola al llegar al final (24 por vez, hasta
 * 40 páginas: más allá conviene afinar la búsqueda). La primera página llega
 * del servidor ya dibujada; las siguientes, por un server action.
 *
 * Las tarjetas aparecen visibles desde el primer cuadro: nada anima desde
 * `opacity: 0` (una grilla que depende de una animación para verse es una
 * grilla que a veces no se ve).
 */
export function GrillaInfinita({
  inicial,
  total,
  filtros,
  origen = 'catalogo',
  cardOrigen = 'catalogo',
  columnas = 'normal',
  className,
}: {
  inicial: TarjetaMercado[];
  total: number;
  filtros: FiltrosBusqueda;
  origen?: OrigenVista;
  cardOrigen?: 'accion' | 'catalogo' | 'perfil_negocio' | 'busqueda';
  /** `ancha`: la página tiene barra lateral de filtros y entra una columna menos. */
  columnas?: 'normal' | 'ancha';
  className?: string;
}) {
  const t = useTranslations('mercado.resultados');
  const [items, setItems] = useState(inicial);
  const [hayMas, setHayMas] = useState(inicial.length < total && inicial.length >= 24);
  const [cargando, setCargando] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);
  const grilla = useImpresiones<HTMLUListElement>(origen, items);
  const clave = JSON.stringify(filtros);

  // Otra búsqueda: otra primera página.
  useEffect(() => {
    setItems(inicial);
    setHayMas(inicial.length < total && inicial.length >= 24);
  }, [inicial, total, clave]);

  useEffect(() => {
    const el = centinela.current;
    if (!el || !hayMas) return;
    const io = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting) || cargando) return;
        setCargando(true);
        void buscarPagina(filtros, items.length).then((p) => {
          setItems((prev) => {
            const ids = new Set(prev.map((x) => x.id));
            return [...prev, ...p.items.filter((x) => !ids.has(x.id))];
          });
          setHayMas(p.items.length >= 24 && items.length + p.items.length < Math.min(p.total, 984));
          setCargando(false);
        });
      },
      { rootMargin: '700px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hayMas, cargando, items.length, clave]);

  const cols =
    columnas === 'ancha'
      ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5';

  return (
    <div className={className}>
      <ul ref={grilla} className={cn('grid gap-x-3 gap-y-6', cols)}>
        {items.map((item, i) => (
          <li key={item.id} data-listado={item.id}>
            <TarjetaListado t={item} prioridad={i < 4} origen={cardOrigen} />
          </li>
        ))}
        {cargando &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={`sk${i}`} aria-hidden>
              <Skeleton className="aspect-square w-full rounded-card" />
              <Skeleton className="mt-2.5 h-5 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
            </li>
          ))}
      </ul>
      <div ref={centinela} aria-hidden className="h-4" />
      {!hayMas && items.length > 8 && <p className="mt-8 text-center text-caption text-muted-foreground">{t('fin')}</p>}
    </div>
  );
}

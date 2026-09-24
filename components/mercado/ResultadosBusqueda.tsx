'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { BuscadorMercado } from '@/components/mercado/BuscadorMercado';
import { GrillaInfinita } from '@/components/mercado/GrillaInfinita';
import { PanelFiltros } from '@/components/mercado/PanelFiltros';
import { visualCategoria } from '@/components/mercado/categoria-visual';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { cuantosFiltros, urlBusqueda, type FiltrosURL } from '@/lib/mercado/busqueda';
import { formatoPrecio } from '@/lib/mercado/imagenes';
import type { FiltrosBusqueda } from '@/lib/mercado/servidor';
import type { Busqueda } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * `/mercado/buscar` — los resultados. Todo vive en la URL.
 *
 * En el teléfono: el buscador fijo arriba, una línea con cuántos hay, el botón
 * de filtros (con su número) y el orden; debajo, los filtros puestos como
 * chips que se sacan de un toque. En escritorio, los filtros son una barra
 * lateral. Con una categoría y sin texto, la pantalla es la de esa categoría:
 * su ícono, su nombre y sus subcategorías a un toque.
 */
export function ResultadosBusqueda({
  f,
  r,
  esTeen,
  filtrosServidor,
}: {
  f: FiltrosURL;
  r: Busqueda;
  esTeen: boolean;
  filtrosServidor: FiltrosBusqueda;
}) {
  const t = useTranslations('mercado.resultados');
  const tf = useTranslations('mercado.filtros');
  const tc = useTranslations('mercado.categorias');
  const tm = useTranslations('mercado');
  const tco = useTranslations('mercado.condicion');
  const router = useRouter();
  const [hoja, setHoja] = useState(false);
  const [navegando, startTransition] = useTransition();
  const n = cuantosFiltros(f);

  function cambiar(parcial: Partial<FiltrosURL>) {
    const siguiente = { ...f, ...parcial };
    // Cambiar de categoría deja sin sentido la subcategoría anterior.
    if ('categoria' in parcial && parcial.categoria !== f.categoria) siguiente.subcategoria = parcial.subcategoria ?? null;
    startTransition(() => router.push(urlBusqueda(siguiente), { scroll: false }));
  }

  const chips: { clave: string; texto: string; quitar: Partial<FiltrosURL> }[] = [];
  if (f.categoria) chips.push({ clave: 'cat', texto: tc(f.categoria), quitar: { categoria: null, subcategoria: null } });
  if (f.categoria && f.subcategoria) chips.push({ clave: 'sub', texto: tm(`subcategorias.${f.categoria}.${f.subcategoria}`), quitar: { subcategoria: null } });
  if (f.condicion) chips.push({ clave: 'cond', texto: tco(f.condicion), quitar: { condicion: null } });
  if (f.modalidad) chips.push({ clave: 'mod', texto: tf(f.modalidad === 'online' ? 'conEnvio' : 'retiro'), quitar: { modalidad: null } });
  if (f.zona) chips.push({ clave: 'zona', texto: tf('llegaA', { zona: f.zona }), quitar: { zona: null } });
  if (f.nivel) chips.push({ clave: 'nivel', texto: tf('nivelDesde', { n: Number(f.nivel.slice(1)) }), quitar: { nivel: null } });
  if (f.precioMin !== null || f.precioMax !== null) {
    chips.push({
      clave: 'precio',
      texto:
        f.precioMin !== null && f.precioMax !== null
          ? tf('precioEntre', { desde: formatoPrecio(f.precioMin), hasta: formatoPrecio(f.precioMax) })
          : f.precioMin !== null
            ? tf('precioDesde', { desde: formatoPrecio(f.precioMin) })
            : tf('precioHasta', { hasta: formatoPrecio(f.precioMax ?? 0) }),
      quitar: { precioMin: null, precioMax: null },
    });
  }

  const ordenes = [
    ...(f.q ? (['relevancia'] as const) : []),
    'recomendados',
    'nuevos',
    ...(esTeen ? [] : (['precio_asc', 'precio_desc'] as const)),
    'nivel',
  ] as const;
  const ordenActual = r.orden;
  const total = r.total > 1000 ? t('masDeMil') : t('resultadosN', { n: r.total });
  const cabeceraCategoria = f.categoria && !f.q;
  const vc = f.categoria ? visualCategoria(f.categoria) : null;

  return (
    <div data-shell="wide" className="pb-20">
      <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 pb-2 pt-1 backdrop-blur-md lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <div className="flex items-center gap-2">
          <Link
            href="/mercado"
            aria-label={t('volver')}
            className="press flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <BuscadorMercado inicial={f.q ?? ''} className="min-w-0 flex-1" />
        </div>
      </div>

      {cabeceraCategoria && vc && (
        <header className="mt-3 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${vc.color}26` }}>
            <vc.icono className="h-6 w-6" style={{ color: vc.color }} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-h1 font-bold">
              {f.subcategoria ? tm(`subcategorias.${f.categoria}.${f.subcategoria}`) : tc(f.categoria!)}
            </h1>
            {f.subcategoria && <p className="text-caption text-muted-foreground">{tc(f.categoria!)}</p>}
          </div>
        </header>
      )}
      {f.q && <h1 className="sr-only">{t('resultadosPara', { q: f.q })}</h1>}

      {/* Subcategorías como accesos, en la pantalla de una categoría. */}
      {cabeceraCategoria && f.categoria && (
        <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {Object.entries(r.facetas.subcategorias ?? {})
            .filter(([s]) => s !== '_')
            .sort((a, b) => b[1] - a[1])
            .map(([s, cant]) => (
              <li key={s} className="shrink-0">
                <button
                  type="button"
                  onClick={() => cambiar({ subcategoria: f.subcategoria === s ? null : s })}
                  aria-pressed={f.subcategoria === s}
                  className={cn(
                    'press h-9 rounded-pill border px-3.5 text-small font-medium transition-colors duration-150',
                    f.subcategoria === s ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface hover:bg-surface-2',
                  )}
                >
                  {tm(`subcategorias.${f.categoria}.${s}`)} <span className="text-muted-foreground tnum">{cant}</span>
                </button>
              </li>
            ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-small text-muted-foreground" aria-live="polite">
          {f.q ? t('resultadosParaN', { total, q: f.q }) : total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHoja(true)}
            className="press inline-flex h-9 items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 text-small font-semibold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {tf('boton')}
            {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-primary-foreground">{n}</span>}
          </button>
          <Select
            value={ordenActual}
            onChange={(e) => cambiar({ orden: e.target.value as FiltrosURL['orden'] })}
            aria-label={tf('orden')}
            className="h-9 w-auto rounded-pill py-0 text-small"
          >
            {ordenes.map((o) => (
              <option key={o} value={o}>
                {tf(`ordenes.${o}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.clave}>
              <button
                type="button"
                onClick={() => cambiar(c.quitar)}
                className="press inline-flex h-8 items-center gap-1 rounded-pill bg-surface-2 pl-3 pr-2 text-caption font-semibold hover:bg-border/60"
                aria-label={tf('quitar', { filtro: c.texto })}
              >
                {c.texto}
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {chips.length > 1 && (
            <li>
              <button
                type="button"
                onClick={() => startTransition(() => router.push(urlBusqueda({ q: f.q, orden: f.orden }), { scroll: false }))}
                className="h-8 px-2 text-caption font-semibold text-primary"
              >
                <span className="link-underline">{tf('limpiar')}</span>
              </button>
            </li>
          )}
        </ul>
      )}

      <div className="mt-5 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <PanelFiltros f={f} facetas={r.facetas} esTeen={esTeen} cambiar={cambiar} />
          </div>
        </aside>

        <div className={cn('min-w-0 transition-opacity duration-150', navegando && 'opacity-60')} aria-busy={navegando}>
          {r.items.length === 0 ? (
            <EmptyState
              title={t('vacio.titulo')}
              message={n > 0 ? t('vacio.conFiltros') : f.q ? t('vacio.conTexto', { q: f.q }) : t('vacio.cuerpo')}
              pipMood="sleepy"
              action={
                n > 0 ? (
                  <button
                    type="button"
                    onClick={() => startTransition(() => router.push(urlBusqueda({ q: f.q }), { scroll: false }))}
                    className="text-small font-semibold text-primary"
                  >
                    <span className="link-underline">{tf('limpiar')}</span>
                  </button>
                ) : (
                  <Link href="/mercado" className="text-small font-semibold text-primary">
                    <span className="link-underline">{t('irAlInicio')}</span>
                  </Link>
                )
              }
            />
          ) : (
            <GrillaInfinita
              inicial={r.items}
              total={r.total}
              filtros={filtrosServidor}
              cardOrigen="busqueda"
              columnas="ancha"
            />
          )}
        </div>
      </div>

      <Sheet open={hoja} onOpenChange={setHoja} title={tf('titulo')}>
        <div className="pb-20">
          <PanelFiltros f={f} facetas={r.facetas} esTeen={esTeen} cambiar={cambiar} />
        </div>
        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-hairline bg-surface px-4 py-3">
          {n > 0 && (
            <button
              type="button"
              onClick={() => startTransition(() => router.push(urlBusqueda({ q: f.q, orden: f.orden }), { scroll: false }))}
              className="press h-11 rounded-pill border border-border px-4 text-small font-semibold"
            >
              {tf('limpiar')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setHoja(false)}
            className="press h-11 flex-1 rounded-pill bg-primary text-small font-semibold text-primary-foreground shadow-crisp"
          >
            {navegando ? tf('actualizando') : tf('ver', { total })}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

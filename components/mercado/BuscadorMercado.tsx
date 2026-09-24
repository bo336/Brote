'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpLeft, Clock, Search, Store, X } from 'lucide-react';
import { visualCategoria } from '@/components/mercado/categoria-visual';
import { sugerir } from '@/lib/mercado/acciones';
import { urlBusqueda } from '@/lib/mercado/busqueda';
import { CATEGORIAS, SUBCATEGORIAS, type Categoria } from '@/lib/mercado/categorias';
import { urlImagen, urlLogo } from '@/lib/mercado/imagenes';
import type { Sugerencias } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

const RECIENTES = 'brote:mercado:busquedas';

function leerRecientes(): string[] {
  try {
    return (JSON.parse(localStorage.getItem(RECIENTES) ?? '[]') as string[]).slice(0, 6);
  } catch {
    return [];
  }
}

function guardarReciente(q: string) {
  try {
    const lista = [q, ...leerRecientes().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECIENTES, JSON.stringify(lista));
  } catch {
    /* una comodidad de este navegador: si no se puede, no pasa nada */
  }
}

function sinAcentos(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

type Opcion =
  | { tipo: 'buscar'; q: string }
  | { tipo: 'reciente'; q: string }
  | { tipo: 'categoria'; categoria: Categoria; sub: string | null; etiqueta: string }
  | { tipo: 'producto'; slug: string; titulo: string; imagen: string | null }
  | { tipo: 'tienda'; slug: string; nombre: string; logo: string | null };

/**
 * El buscador del Mercado. Mientras se escribe sugiere productos, tiendas y
 * categorías (las categorías se resuelven acá, con sus nombres, sin ir a la
 * base); con el campo vacío, las búsquedas recientes de este navegador.
 *
 * Es un combobox de verdad: flechas para moverse, Enter para elegir, Escape
 * para cerrar, y el lector de pantalla anuncia cuántas sugerencias hay.
 */
export function BuscadorMercado({
  inicial = '',
  autoFocus = false,
  className,
}: {
  inicial?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const t = useTranslations('mercado.buscador');
  const tm = useTranslations('mercado');
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState(inicial);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [sug, setSug] = useState<Sugerencias>({ productos: [], tiendas: [] });
  const [recientes, setRecientes] = useState<string[]>([]);
  const caja = useRef<HTMLDivElement>(null);
  const pedido = useRef(0);

  useEffect(() => setQ(inicial), [inicial]);

  // Sugerencias de la base, con 180 ms de espera: no una consulta por tecla.
  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setSug({ productos: [], tiendas: [] });
      return;
    }
    const n = ++pedido.current;
    const h = setTimeout(() => {
      void sugerir(texto).then((r) => {
        if (n === pedido.current) setSug(r);
      });
    }, 180);
    return () => clearTimeout(h);
  }, [q]);

  // Categorías y subcategorías cuyo nombre empieza o contiene lo escrito.
  const categorias = useMemo(() => {
    const texto = sinAcentos(q.trim());
    if (texto.length < 2) return [] as Opcion[];
    const out: Opcion[] = [];
    for (const c of CATEGORIAS) {
      const nombre = tm(`categorias.${c}`);
      if (sinAcentos(nombre).includes(texto)) out.push({ tipo: 'categoria', categoria: c, sub: null, etiqueta: nombre });
      for (const s of SUBCATEGORIAS[c]) {
        const n = tm(`subcategorias.${c}.${s}`);
        if (sinAcentos(n).includes(texto)) out.push({ tipo: 'categoria', categoria: c, sub: s, etiqueta: `${n} · ${nombre}` });
      }
    }
    return out.slice(0, 3);
  }, [q, tm]);

  const opciones: Opcion[] = useMemo(() => {
    const texto = q.trim();
    if (!texto) return recientes.map((r) => ({ tipo: 'reciente', q: r }) as Opcion);
    return [
      { tipo: 'buscar', q: texto } as Opcion,
      ...categorias,
      ...sug.productos.map((p) => ({ tipo: 'producto', slug: p.slug, titulo: p.titulo, imagen: p.imagen }) as Opcion),
      ...sug.tiendas.map((s) => ({ tipo: 'tienda', slug: s.slug, nombre: s.nombre, logo: s.logo }) as Opcion),
    ];
  }, [q, recientes, categorias, sug]);

  useEffect(() => setActiva(-1), [opciones.length]);

  // Cerrar al tocar afuera.
  useEffect(() => {
    if (!abierto) return;
    function fuera(e: PointerEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  function elegir(o: Opcion) {
    setAbierto(false);
    if (o.tipo === 'buscar' || o.tipo === 'reciente') {
      guardarReciente(o.q);
      setQ(o.q);
      router.push(urlBusqueda({ q: o.q }));
    } else if (o.tipo === 'categoria') {
      router.push(urlBusqueda({ categoria: o.categoria, subcategoria: o.sub }));
    } else if (o.tipo === 'producto') {
      if (q.trim()) guardarReciente(q.trim());
      router.push(`/mercado/${o.slug}?de=busqueda`);
    } else {
      router.push(`/mercado/tienda/${o.slug}`);
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const o = activa >= 0 ? opciones[activa] : null;
    if (o) return elegir(o);
    const texto = q.trim();
    if (!texto) return;
    elegir({ tipo: 'buscar', q: texto });
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActiva((a) => Math.min(a + 1, opciones.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiva((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  const mostrar = abierto && opciones.length > 0;
  const listaId = `${id}-lista`;

  return (
    <div ref={caja} className={cn('relative', className)}>
      <form role="search" onSubmit={enviar} className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => {
            setRecientes(leerRecientes());
            setAbierto(true);
          }}
          onKeyDown={teclas}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          role="combobox"
          aria-expanded={mostrar}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={activa >= 0 ? `${id}-o${activa}` : undefined}
          enterKeyHint="search"
          autoComplete="off"
          className="h-12 w-full rounded-pill border border-border bg-surface pl-11 pr-11 text-body shadow-soft outline-none transition-shadow duration-150 placeholder:text-muted-foreground focus:border-primary/60 focus:shadow-glow [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setAbierto(true);
            }}
            aria-label={t('borrar')}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <span className="sr-only" aria-live="polite">
        {mostrar ? t('sugerenciasN', { n: opciones.length }) : ''}
      </span>

      {mostrar && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-card border border-border bg-surface p-1.5 shadow-soft-lg"
        >
          {!q.trim() && <li className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('recientes')}</li>}
          {opciones.map((o, i) => (
            <li
              key={`${o.tipo}-${i}`}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === activa}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => elegir(o)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-button px-3 py-2 text-small',
                i === activa ? 'bg-surface-2' : 'hover:bg-surface-2',
              )}
            >
              <FilaSugerencia o={o} t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaSugerencia({ o, t }: { o: Opcion; t: ReturnType<typeof useTranslations> }) {
  if (o.tipo === 'buscar' || o.tipo === 'reciente') {
    const Icono = o.tipo === 'reciente' ? Clock : Search;
    return (
      <>
        <Icono className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{o.tipo === 'buscar' ? t('buscarTexto', { q: o.q }) : o.q}</span>
        <ArrowUpLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
      </>
    );
  }
  if (o.tipo === 'categoria') {
    const v = visualCategoria(o.categoria);
    const Icono = v.icono;
    return (
      <>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${v.color}22` }}>
          <Icono className="h-4 w-4" style={{ color: v.color }} />
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className="text-muted-foreground">{t('enCategoria')} </span>
          {o.etiqueta}
        </span>
      </>
    );
  }
  if (o.tipo === 'producto') {
    const img = urlImagen(o.imagen);
    return (
      <>
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
          {img && <Image src={img} alt="" fill sizes="36px" className="object-cover" />}
        </span>
        <span className="min-w-0 flex-1 truncate">{o.titulo}</span>
      </>
    );
  }
  const logo = urlLogo(o.logo);
  return (
    <>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-9 w-9 object-cover" />
        ) : (
          <Store className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {o.nombre}
        <span className="text-muted-foreground"> · {t('tienda')}</span>
      </span>
    </>
  );
}

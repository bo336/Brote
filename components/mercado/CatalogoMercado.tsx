'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { BackToTop } from '@/components/ui/back-to-top';
import { ChipRail } from '@/components/ui/chip-rail';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { cargarMasCatalogo, marcarVistas } from '@/lib/mercado/acciones';
import { CATEGORIAS, CATEGORIAS_SENSIBLES } from '@/lib/mercado/categorias';
import type { Cursor, FiltrosCatalogo, PaginaCatalogo } from '@/lib/mercado/servidor';
import { PROVINCES } from '@/lib/data/cities';
import type { TarjetaMercado } from '@/lib/supabase/rows-mercado';

/**
 * `/mercado` — el catálogo (07 §4.7, fase 3 §7.1).
 *
 * Hero con la gradiente UNA vez; "Qué es esto" (08 §4.4); categorías en un
 * ChipRail; grilla de 2/3/4 columnas; scroll infinito POR CURSOR con Skeleton y
 * BackToTop. Cero AdSense: acá no hay un solo espacio de anuncio, y un test lo
 * comprueba.
 */
const CLAVE_VISTAS = 'brote:mercado:vistas';

/** Lo visto en esta pestaña, para no volver a contarlo al volver atrás. */
function vistasDeSesion(): Set<string> {
  try {
    const crudo = sessionStorage.getItem(CLAVE_VISTAS);
    return new Set<string>(crudo ? (JSON.parse(crudo) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function recordarVista(id: string): void {
  try {
    const s = vistasDeSesion();
    s.add(id);
    sessionStorage.setItem(CLAVE_VISTAS, JSON.stringify([...s].slice(-400)));
  } catch {
    /* modo privado: alcanza con la deduplicación de la base */
  }
}

export function CatalogoMercado({
  inicial,
  filtros,
  esTeen,
}: {
  inicial: PaginaCatalogo;
  filtros: FiltrosCatalogo;
  esTeen: boolean;
}) {
  const t = useTranslations('mercado.catalogo');
  const tc = useTranslations('mercado.categorias');
  const tn = useTranslations('mercado.nivel');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [items, setItems] = useState<TarjetaMercado[]>(inicial.items);
  const [cursor, setCursor] = useState<Cursor | null>(inicial.cursor);
  const [cargando, setCargando] = useState(false);
  const [navegando, startTransition] = useTransition();
  const centinela = useRef<HTMLDivElement>(null);
  const grillaRef = useRef<HTMLUListElement>(null);
  // Lo ya contado en esta sesión: volver atrás no vuelve a contar.
  const vistos = useRef<Set<string>>(vistasDeSesion());

  // Una búsqueda nueva (otros filtros) trae otra primera página.
  useEffect(() => {
    setItems(inicial.items);
    setCursor(inicial.cursor);
  }, [inicial]);

  /**
   * Impresiones (05 §4.4 y fase 4 §3.2): se cuenta cuando la tarjeta ENTRA EN
   * PANTALLA, no cuando la página la carga. Una vez por listado y por sesión
   * acá, una vez por persona y día en la base, y en tandas cada 800 ms para no
   * mandar una consulta por tarjeta mientras alguien hace scroll rápido.
   */
  useEffect(() => {
    const grilla = grillaRef.current;
    if (!grilla) return;

    const pendientes = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    function vaciar() {
      timer = null;
      const lote = [...pendientes];
      pendientes.clear();
      if (lote.length) void marcarVistas(lote, 'catalogo');
    }

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.listado;
          if (!id || vistos.current.has(id)) continue;
          vistos.current.add(id);
          recordarVista(id);
          pendientes.add(id);
          io.unobserve(e.target);
        }
        if (pendientes.size && timer === null) timer = setTimeout(vaciar, 800);
      },
      // Media tarjeta a la vista: pasar de largo en un scroll no es haberla visto.
      { threshold: 0.5 },
    );

    for (const el of grilla.querySelectorAll<HTMLElement>('[data-listado]')) io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      vaciar();
    };
  }, [items]);

  // Scroll infinito por cursor.
  useEffect(() => {
    const el = centinela.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting) || cargando) return;
        setCargando(true);
        void cargarMasCatalogo(filtros, cursor).then((p) => {
          setItems((prev) => {
            const ids = new Set(prev.map((x) => x.id));
            return [...prev, ...p.items.filter((x) => !ids.has(x.id))];
          });
          setCursor(p.cursor);
          setCargando(false);
        });
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, cargando, filtros]);

  function filtrar(clave: string, valor: string | null) {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    startTransition(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  }

  const categorias = CATEGORIAS.filter((c) => !esTeen || !CATEGORIAS_SENSIBLES.includes(c));
  const hayFiltros = !!(filtros.categoria || filtros.nivel || filtros.zona || filtros.modalidad || filtros.dominio);

  return (
    <div className="pb-16">
      <header className="pt-2">
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1.5 bg-brand-gradient bg-clip-text font-display text-hero font-bold leading-[1.05] text-transparent">{t('titulo')}</h1>
      </header>

      <section className="mt-5 max-w-2xl border-y border-hairline py-4">
        <span className="eyebrow text-muted-foreground">{t('queEs.titulo')}</span>
        <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('queEs.cuerpo')}</p>
        <Link href="/legal/niveles" className="mt-1.5 inline-flex items-center gap-1 text-small font-medium text-primary">
          <span className="link-underline">{t('queEs.enlace')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <div className="mt-6">
        <ChipRail
          layoutId="mercado-categorias"
          value={filtros.categoria ?? 'todo'}
          onChange={(v) => filtrar('categoria', v === 'todo' ? null : v)}
          options={[{ value: 'todo', label: tc('todo') }, ...categorias.map((c) => ({ value: c, label: tc(c) }))]}
        />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
          <Filtro id="f-nivel" etiqueta={t('filtros.nivel')}>
            <Select id="f-nivel" value={filtros.nivel ?? ''} onChange={(e) => filtrar('nivel', e.target.value || null)} className="h-9 text-small">
              <option value="">{t('filtros.nivelTodos')}</option>
              {(['e2', 'e3'] as const).map((n) => (
                <option key={n} value={n}>
                  {t('filtros.nivelDesde', { n: Number(n.slice(1)) })} · {tn(`${n}.corto`)}
                </option>
              ))}
            </Select>
          </Filtro>
          <Filtro id="f-zona" etiqueta={t('filtros.zona')}>
            <Select id="f-zona" value={filtros.zona ?? ''} onChange={(e) => filtrar('zona', e.target.value || null)} className="h-9 text-small">
              <option value="">{t('filtros.zonaTodas')}</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {t('filtros.zonaOnline', { zona: p })}
                </option>
              ))}
            </Select>
          </Filtro>
          <Filtro id="f-modalidad" etiqueta={t('filtros.modalidad')}>
            <Select id="f-modalidad" value={filtros.modalidad ?? ''} onChange={(e) => filtrar('modalidad', e.target.value || null)} className="h-9 text-small">
              <option value="">{t('filtros.modalidadTodas')}</option>
              <option value="online">{t('filtros.online')}</option>
              <option value="local">{t('filtros.local')}</option>
            </Select>
          </Filtro>
          <Filtro id="f-orden" etiqueta={t('filtros.orden')}>
            <Select id="f-orden" value={filtros.orden} onChange={(e) => filtrar('orden', e.target.value === 'nivel' ? 'nivel' : null)} className="h-9 text-small">
              <option value="recomendados">{t('filtros.recomendados')}</option>
              <option value="nivel">{t('filtros.porNivel')}</option>
            </Select>
          </Filtro>
        </div>
      </div>

      <div className="mt-6" aria-busy={navegando}>
        {items.length === 0 ? (
          hayFiltros ? (
            <EmptyState
              title={t('vacioFiltros.titulo')}
              message={t('vacioFiltros.cuerpo')}
              pipMood="sleepy"
              action={
                <Link href={pathname} className="text-small font-medium text-primary">
                  <span className="link-underline">{t('vacioFiltros.limpiar')}</span>
                </Link>
              }
            />
          ) : (
            <EmptyState title={t('vacio.titulo')} message={t('vacio.cuerpo')} pipMood="happy" />
          )
        ) : (
          <>
            {/* Mientras el catálogo es chico, se dice (fase 5 §8.1). Los
                listados que hay se muestran igual: esconderlos sería peor que
                la verdad, y una grilla con huecos también. */}
            {!hayFiltros && items.length < 12 && (
              <p className="mb-5 rounded-card border border-border bg-surface p-4 text-small leading-relaxed text-muted-foreground">
                {t('pocos.cuerpo')}{' '}
                <Link href="/negocios" prefetch={false} className="font-semibold text-primary">
                  <span className="link-underline">{t('pocos.enlace')}</span>
                </Link>
              </p>
            )}
          <ul ref={grillaRef} className={`grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 ${navegando ? 'opacity-60 transition-opacity' : ''}`}>
            {items.map((item, i) => (
              <li key={item.id} data-listado={item.id} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-both" style={{ animationDelay: `${Math.min(i % 24, 8) * 40}ms` }}>
                <TarjetaListado t={item} prioridad={i < 4} />
              </li>
            ))}
            {cargando &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={`sk${i}`}>
                  <Skeleton className="aspect-square w-full rounded-card" />
                  <Skeleton className="mt-2.5 h-4 w-20" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </li>
              ))}
          </ul>
          </>
        )}
        <div ref={centinela} aria-hidden className="h-4" />
        {!cursor && items.length > 0 && <p className="mt-8 text-center text-caption text-muted-foreground">{t('fin')}</p>}
      </div>
      <BackToTop />
    </div>
  );
}

function Filtro({ id, etiqueta, children }: { id: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 sm:w-auto">
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

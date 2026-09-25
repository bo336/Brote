import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Heart, Info, Store } from 'lucide-react';
import { BuscadorMercado } from '@/components/mercado/BuscadorMercado';
import { CategoriasRail } from '@/components/mercado/CategoriasRail';
import { Estante } from '@/components/mercado/Estante';
import { GrillaInfinita } from '@/components/mercado/GrillaInfinita';
import { TiendasEstante } from '@/components/mercado/TiendasEstante';
import { EmptyState } from '@/components/ui/empty-state';
import { urlBusqueda } from '@/lib/mercado/busqueda';
import type { FiltrosBusqueda } from '@/lib/mercado/servidor';
import { getDomainName } from '@/lib/domains';
import type { Busqueda, Estante as EstanteT, InicioMercado as Inicio } from '@/lib/supabase/rows-mercado';

/**
 * `/mercado` — el inicio del Mercado.
 *
 * Lo primero que se ve en un teléfono son productos: el buscador, una fila de
 * categorías y el primer estante entran enteros en 740 px de alto. La
 * explicación de qué es esto (08 §4.4) sigue estando, pero plegada en una
 * línea: la primera versión la ponía arriba de todo y los productos quedaban
 * debajo del pliegue.
 *
 * Los estantes salen de lo que la persona HACE en Brote (acciones, Academia,
 * guardados, lo que miró, su provincia) y cada uno aparece solo si tiene con
 * qué llenarse. Al final, "Descubrí más": una grilla que no se termina.
 */
export function InicioMercado({
  inicio,
  descubri,
  filtrosDescubri,
}: {
  inicio: Inicio;
  descubri: Busqueda;
  filtrosDescubri: FiltrosBusqueda;
}) {
  const t = useTranslations('mercado.inicio');
  const tc = useTranslations('mercado.catalogo');
  const esTeen = inicio.cuenta === 'teen';
  const vacio = inicio.total === 0;

  const estantes = inicio.estantes.map((e) => ({ e, ...tituloDe(e, t) }));
  const antes = estantes.slice(0, 2);
  const despues = estantes.slice(2);

  return (
    <div data-shell="wide" className="pb-20">
      <div className="flex items-center gap-2">
        <BuscadorMercado className="min-w-0 flex-1" />
        <Link
          href="/mercado/guardados"
          aria-label={t('guardados')}
          title={t('guardados')}
          className="press flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-soft transition-colors duration-150 hover:bg-surface-2"
        >
          <Heart className="h-5 w-5" />
        </Link>
      </div>

      <details className="group mt-3 rounded-card text-small">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-muted-foreground marker:hidden [&::-webkit-details-marker]:hidden">
          <Info className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{t('queEsCorto')}</span>
          <span className="shrink-0 font-semibold text-primary group-open:hidden">{t('comoFunciona')}</span>
        </summary>
        <div className="mt-2 rounded-card border border-border bg-surface p-4">
          <span className="eyebrow text-muted-foreground">{tc('queEs.titulo')}</span>
          <p className="mt-1 leading-relaxed text-muted-foreground">{t('queEsLargo')}</p>
          <Link href="/legal/niveles" className="mt-2 inline-flex items-center gap-1 font-semibold text-primary">
            <span className="link-underline">{tc('queEs.enlace')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </details>

      <CategoriasRail conteos={inicio.categorias} esTeen={esTeen} className="mt-4" />

      {vacio ? (
        <div className="mt-8">
          <EmptyState title={t('vacio.titulo')} message={t('vacio.cuerpo')} pipMood="happy" />
          {!esTeen && <BannerVender className="mt-6" />}
        </div>
      ) : (
        <div className="mt-6 space-y-9">
          {antes.map(({ e, titulo, subtitulo, verTodo }, i) => (
            <Estante key={e.clave} titulo={titulo} subtitulo={subtitulo} verTodo={verTodo} items={e.items} prioridad={i === 0} />
          ))}

          <TiendasEstante tiendas={inicio.tiendas} titulo={t('tiendas')} />

          {despues.map(({ e, titulo, subtitulo, verTodo }) => (
            <Estante key={e.clave} titulo={titulo} subtitulo={subtitulo} verTodo={verTodo} items={e.items} />
          ))}

          {!esTeen && <BannerVender pocos={inicio.total < 12} />}

          <section aria-label={t('descubri')}>
            <h2 className="mb-3 font-display text-h3 font-bold">{t('descubri')}</h2>
            <GrillaInfinita inicial={descubri.items} total={descubri.total} filtros={filtrosDescubri} />
          </section>
        </div>
      )}
    </div>
  );
}

function tituloDe(
  e: EstanteT,
  t: ReturnType<typeof useTranslations>,
): { titulo: string; subtitulo?: string; verTodo: string | null } {
  switch (e.clave) {
    case 'seguir_viendo':
      return { titulo: t('estantes.seguir_viendo'), verTodo: '/mercado/guardados?tab=vistos' };
    case 'para_vos':
      return { titulo: t('estantes.para_vos'), subtitulo: t('estantes.para_vosSub'), verTodo: '/mercado/buscar' };
    case 'porque_hiciste':
      return {
        titulo: t('estantes.porque_hiciste', { accion: e.param ?? '' }),
        subtitulo: t('estantes.porque_hicisteSub'),
        verTodo: e.categoria ? urlBusqueda({ categoria: e.categoria }) : null,
      };
    case 'aprendiendo':
      return {
        titulo: t('estantes.aprendiendo', { rama: getDomainName(e.param ?? '') }),
        subtitulo: t('estantes.aprendiendoSub'),
        verTodo: null,
      };
    case 'cerca':
      return {
        titulo: t('estantes.cerca', { provincia: e.param ?? '' }),
        subtitulo: t('estantes.cercaSub'),
        verTodo: urlBusqueda({ zona: e.param ?? null, modalidad: 'local' }),
      };
    case 'bajaron':
      return { titulo: t('estantes.bajaron'), subtitulo: t('estantes.bajaronSub'), verTodo: null };
    case 'nuevos':
      return { titulo: t('estantes.nuevos'), verTodo: urlBusqueda({ orden: 'nuevos' }) };
    case 'segunda_vida':
      return { titulo: t('estantes.segunda_vida'), subtitulo: t('estantes.segunda_vidaSub'), verTodo: urlBusqueda({ condicion: 'usado' }) };
    case 'documentados':
      return { titulo: t('estantes.documentados'), subtitulo: t('estantes.documentadosSub'), verTodo: urlBusqueda({ nivel: 'e2' }) };
  }
}

/**
 * La invitación a vender. Con el catálogo flaco lo dice (fase 5 §8.1): esconder
 * que hay pocas tiendas sería peor que la verdad.
 */
export function BannerVender({ pocos = false, className }: { pocos?: boolean; className?: string }) {
  const t = useTranslations('mercado.inicio');
  return (
    <Link
      href="/vender"
      className={`press group flex items-center gap-4 overflow-hidden rounded-card bg-brote-ink p-5 text-brote-cream shadow-soft transition-shadow duration-200 hover:shadow-lift ${className ?? ''}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brote-green/20">
        <Store className="h-6 w-6 text-brote-green" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-h3 font-bold">{pocos ? t('vender.tituloPocos') : t('vender.titulo')}</span>
        <span className="mt-0.5 block text-small text-brote-cream/75">{t('vender.cuerpo')}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}

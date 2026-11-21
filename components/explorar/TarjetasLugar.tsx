'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Clock,
  Flower2,
  Leaf,
  MessagesSquare,
  Play,
  RotateCcw,
  Sprout,
  Store,
  TreeDeciduous,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { CountUp } from '@/components/ui/count-up';
import { SafeImage, ImagenFallback } from '@/components/ui/safe-image';
import { SaviaMedidor } from '@/components/academia/SaviaMedidor';
import { defaultPosterFor } from '@/components/mundo3d/poster/defaultPoster';
import {
  mapaOk,
  useImpactoTotal,
  useMapaAcademia,
  useMercadoDestacado,
  usePulsoPlaza,
} from '@/components/inicio/datos';
import { useEmpezar } from '@/lib/academia/usar-empezar';
import { useMisCaminos, useSugeridas } from '@/hooks/use-acciones';
import { fetchProjects } from '@/lib/api/plaza';
import { historiaPrincipal } from '@/lib/impacto/historias';
import { marcarVisita } from '@/lib/inicio/visitas';
import { getDomain, getDomainColor } from '@/lib/domains';
import { formatoPrecio, urlImagen } from '@/lib/mercado/imagenes';
import { useSession } from '@/stores/session';
import { cn } from '@/lib/utils/cn';

const COLOR_TRONCO = '#1FB57A';

/** The island's place names by level, as the game names them. */
export const LUGAR_POR_NIVEL = [
  'El Claro', 'La Pradera', 'El Jardín', 'La Arboleda', 'La Arboleda', 'La Arboleda',
  'El Río', 'El Monte', 'La Cumbre', 'El Islote', 'El Monumento',
] as const;

/** Flowers on the ceibo: one per real action, up to a full crown (`lib/world/game/ceibo.ts`). */
export const CEIBO_MAX_FLORES = 240;

/**
 * Las tarjetas de los lugares (docs/REESTRUCTURA.md D1, D3): Academia, Tu
 * mundo, la Plaza y el Mercado, cada una con algo REAL de esta persona — la
 * próxima lección, su isla y su ceibo, las historias de hoy, productos para
 * ella — y con el color de su lugar. Vivían al fondo de Hoy ("Seguí en
 * Brote"); ahora son el mapa de Explorar.
 *
 * Cuatro formas distintas a propósito, una por lugar: una tarjeta editorial
 * (Academia), una imagen (Tu mundo), un contador en vivo (Plaza) y una tira de
 * productos (Mercado).
 */

// ── Academia ────────────────────────────────────────────────────────────────

export function TarjetaAcademia() {
  const t = useTranslations('inicio.seguir');
  const ta = useTranslations('arbol');
  const q = useMapaAcademia();
  const { empezar, arrancando } = useEmpezar();
  const mapa = mapaOk(q.data);

  if (q.isLoading) return <Skeleton className="h-[172px] w-full rounded-card" />;
  if (!mapa) return null; // paused or failed: no door to a closed room

  const sig = mapa.siguiente;
  const sinSavia = !!mapa.savia && mapa.savia.restante <= 0;
  const color = sig ? (sig.unidad.rama_slug === 'tronco' ? COLOR_TRONCO : getDomainColor(sig.unidad.rama_slug)) : COLOR_TRONCO;
  const rama = sig
    ? sig.unidad.rama_slug === 'tronco'
      ? mapa.ramas.find((r) => r.es_tronco)?.nombre_es ?? t('tronco')
      : getDomain(sig.unidad.rama_slug)?.name_es ?? mapa.ramas.find((r) => r.slug === sig.unidad.rama_slug)?.nombre_es
    : null;

  return (
    <article
      className="relative overflow-hidden rounded-card border border-border bg-surface p-4 shadow-soft transition-shadow duration-200 hover:shadow-lift"
      style={{ borderTopColor: 'rgb(var(--l-academia))', borderTopWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow flex items-center gap-1.5 text-lugar-academia">
          <TreeDeciduous className="h-3.5 w-3.5" aria-hidden />
          {t('academia')}
        </span>
        <SaviaMedidor savia={mapa.savia} pro={mapa.pro} className="shrink-0" />
      </div>

      {sig ? (
        <>
          <Link
            href={`/aprender/u/${sig.unidad.slug}`}
            onClick={() => marcarVisita('academia')}
            className="group mt-2 block"
          >
            <h3 className="text-balance font-display text-h2 font-extrabold leading-tight">
              <span className="link-underline">{sig.unidad.titulo_es}</span>
            </h3>
            <p className="mt-1 text-caption font-semibold" style={{ color }}>
              {ta(`motivo_${sig.motivo}`)}
              {rama ? ` · ${rama}` : ''}
            </p>
            <p className="mt-0.5 text-small leading-snug text-muted-foreground">
              {ta(`tipoSesion_${sig.leccion.tipo}`)} {sig.leccion.orden} · {sig.leccion.titulo_es}
            </p>
          </Link>
          <div className="mt-3.5 flex items-center gap-2.5">
            {sinSavia ? (
              <Link
                href="/aprender/repaso"
                onClick={() => marcarVisita('academia')}
                className="press inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-surface-2 px-4 text-small font-semibold hover:border-lugar-academia/40"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t('repasarMientras')}
              </Link>
            ) : (
              <button
                type="button"
                disabled={!!arrancando}
                onClick={() => {
                  marcarVisita('academia');
                  void empezar(sig.leccion.id);
                }}
                className="press inline-flex h-11 items-center gap-2 rounded-pill bg-lugar-academia px-5 text-small font-bold text-white shadow-crisp disabled:opacity-60 dark:text-brote-ink"
              >
                <Play className="h-4 w-4" fill="currentColor" aria-hidden />
                {arrancando === sig.leccion.id ? t('abriendo') : t('empezar')}
              </button>
            )}
            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {ta('minutos', { n: sig.leccion.minutos })}
            </span>
          </div>
        </>
      ) : (
        <Link href={mapa.repaso > 0 ? '/aprender/repaso' : '/aprender'} onClick={() => marcarVisita('academia')} className="group mt-2 block">
          <h3 className="font-display text-h2 font-extrabold leading-tight">
            <span className="link-underline">{mapa.repaso > 0 ? t('repasoTitulo', { n: mapa.repaso }) : t('arbolTitulo')}</span>
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-lugar-academia">
            {t('abrirArbol')} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </p>
        </Link>
      )}
    </article>
  );
}

// ── Tu mundo ────────────────────────────────────────────────────────────────

export function TarjetaMundo() {
  const t = useTranslations('inicio.seguir');
  const profile = useSession((s) => s.profile);
  const impacto = useImpactoTotal();
  const tier = Math.min(11, Math.max(1, profile?.mundoState?.rankTier ?? 1));
  const src = profile?.worldSnapshotUrl || defaultPosterFor(tier);
  const flores = Math.min(CEIBO_MAX_FLORES, Math.max(0, Math.floor(impacto.data?.actions ?? 0)));

  return (
    <Link
      href="/mundo"
      onClick={() => marcarVisita('mundo')}
      className="press group relative block aspect-[4/5] overflow-hidden rounded-card bg-brote-ink shadow-soft hover:-translate-y-0.5 hover:shadow-lift sm:aspect-[5/4]"
    >
      <SafeImage
        src={src}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        fallback={<ImagenFallback className="absolute inset-0 h-full w-full" icon={TreeDeciduous} iconSize={40} />}
      />
      <div aria-hidden className="absolute inset-0 bg-ink-scrim" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
          {t('mundoEyebrow', { n: tier, lugar: LUGAR_POR_NIVEL[tier - 1] })}
        </span>
        <p className="mt-0.5 font-display text-h3 font-bold leading-tight">{t('mundoTitulo')}</p>
        <p className="mt-1 inline-flex items-center gap-1 rounded-pill bg-white/15 px-2 py-0.5 text-caption font-semibold backdrop-blur-sm">
          <Flower2 className="h-3.5 w-3.5 text-brote-coral" aria-hidden />
          {flores > 0 ? t('mundoFlores', { n: flores }) : t('mundoSinFlores')}
        </p>
      </div>
    </Link>
  );
}

// ── La Plaza ────────────────────────────────────────────────────────────────

export function TarjetaPlaza({ compacta }: { compacta: boolean }) {
  const t = useTranslations('inicio.seguir');
  const q = usePulsoPlaza();
  const tendencia = q.data?.trending ? getDomain(q.data.trending) : undefined;
  const hoy = q.data?.today ?? 0;

  return (
    <Link
      href="/feed"
      onClick={() => marcarVisita('plaza')}
      className={cn(
        'press group flex flex-col justify-between rounded-card border border-border bg-surface-2 p-3.5 shadow-soft hover:-translate-y-0.5 hover:border-lugar-plaza/40 hover:shadow-lift',
        compacta ? 'aspect-[4/5] sm:aspect-[5/4]' : 'min-h-[132px]',
      )}
    >
      <div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-lugar-plaza">
          <span className="h-1.5 w-1.5 rounded-full bg-lugar-plaza animate-live-pulse" aria-hidden />
          {t('plazaEyebrow')}
        </span>
        <p className="mt-2 font-display leading-none">
          {q.isLoading ? (
            <Skeleton className="h-9 w-12" />
          ) : (
            <CountUp value={hoy} className="text-display-l font-extrabold tnum" />
          )}
        </p>
        <p className="mt-1 text-small leading-snug text-muted-foreground">{t('plazaHoy', { n: hoy })}</p>
      </div>
      <div className="mt-2 space-y-1.5">
        {tendencia && (
          <span
            className="inline-flex max-w-full items-center gap-1 truncate rounded-pill px-2 py-0.5 text-caption font-semibold"
            style={{ color: tendencia.color, background: `${tendencia.color}1a` }}
          >
            <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{tendencia.name_es}</span>
          </span>
        )}
        <span className="flex items-center gap-1 text-small font-semibold text-foreground">
          <MessagesSquare className="h-4 w-4 text-lugar-plaza" aria-hidden />
          {t('plazaEntrar')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// ── Mercado ─────────────────────────────────────────────────────────────────

export function TarjetaMercado() {
  const t = useTranslations('inicio.seguir');
  const q = useMercadoDestacado();
  const items = (q.data ?? []).slice(0, 4);

  return (
    <article className="rounded-card border border-border bg-surface p-3.5 shadow-soft">
      <Link href="/mercado" onClick={() => marcarVisita('mercado')} className="group flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="eyebrow flex items-center gap-1.5 text-lugar-mercado">
            <Store className="h-3.5 w-3.5" aria-hidden />
            {t('mercadoEyebrow')}
          </span>
          <span className="mt-0.5 block truncate font-display text-h3 font-bold">{t('mercadoTitulo')}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-lugar-mercado">
          {t('verTodo')}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
      <ul className="mt-3 grid grid-cols-4 gap-2">
        {items.map((p) => (
          <li key={p.id} className="min-w-0">
            <Link href={`/mercado/${p.slug}`} onClick={() => marcarVisita('mercado')} className="group block">
              <span className="block aspect-square overflow-hidden rounded-[14px] bg-surface-2">
                <SafeImage
                  src={urlImagen(p.imagen)}
                  alt={p.titulo}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  fallback={<ImagenFallback className="h-full w-full" color="#FFB23E" icon={Store} iconSize={22} />}
                />
              </span>
              <span className="mt-1 block truncate text-caption font-medium leading-tight">{p.titulo}</span>
              {p.precio != null && (
                <span className="block truncate text-caption font-bold tnum text-foreground/80">{formatoPrecio(Number(p.precio), p.moneda)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ── Acciones ────────────────────────────────────────────────────────────────

/**
 * El catálogo, con lo que la persona tiene empezado: el camino en curso (con
 * su próximo paso) o, si no hay ninguno, tres acciones elegidas para hoy.
 */
export function TarjetaAcciones() {
  const t = useTranslations('explorar');
  const caminos = useMisCaminos();
  const sugeridas = useSugeridas('catalog', 3);
  const enCurso = (caminos.data ?? []).find((c) => !c.completado && c.pasos.some((p) => p.hecho));
  const proximo = enCurso?.pasos.find((p) => !p.hecho);
  const hechos = enCurso ? enCurso.pasos.filter((p) => p.hecho).length : 0;

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <Link href="/acciones" className="group flex items-start justify-between gap-3 p-4 pb-3">
        <span className="min-w-0">
          <span className="eyebrow flex items-center gap-1.5 text-lugar-acciones">
            <Leaf className="h-3.5 w-3.5" aria-hidden />
            {t('acciones.eyebrow')}
          </span>
          <span className="mt-1 block font-display text-h2 font-extrabold leading-tight">
            <span className="link-underline">{enCurso ? enCurso.titulo_es : t('acciones.titulo')}</span>
          </span>
        </span>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-lugar-acciones transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </Link>
      {enCurso ? (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2" aria-label={t('acciones.pasos', { hechos, total: enCurso.pasos.length })}>
            {enCurso.pasos.map((p) => (
              <span key={p.id} className={cn('h-1.5 flex-1 rounded-pill', p.hecho ? 'bg-hecho' : 'bg-border')} />
            ))}
          </div>
          {proximo && (
            <Link
              href={`/acciones/${proximo.slug}`}
              className="press mt-3 flex items-center justify-between gap-2 rounded-button bg-lugar-acciones/[0.08] px-3 py-2.5 text-small font-semibold hover:bg-lugar-acciones/[0.14]"
            >
              <span className="min-w-0 truncate">
                <span className="text-lugar-acciones">{t('acciones.proximo')}</span> {proximo.title_es}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-lugar-acciones" aria-hidden />
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-hairline border-t border-hairline">
          {sugeridas.isLoading
            ? [0, 1, 2].map((i) => (
                <li key={i} className="px-4 py-3">
                  <Skeleton className="h-5 w-3/4" />
                </li>
              ))
            : (sugeridas.data ?? []).slice(0, 3).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/acciones/${a.slug}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface-2"
                  >
                    <DomainIcon domain={a.domain_slug} size={32} />
                    <span className="min-w-0 flex-1 truncate text-small font-medium">{a.title_es}</span>
                    <span className="shrink-0 text-caption font-bold text-brote-sun tnum">+{a.base_points}</span>
                  </Link>
                </li>
              ))}
        </ul>
      )}
    </article>
  );
}

// ── Proyectos ───────────────────────────────────────────────────────────────

/** Lo que se hace en grupo: el próximo encuentro y cuántos proyectos hay abiertos. */
export function TarjetaProyectos() {
  const t = useTranslations('explorar');
  const userId = useSession((s) => s.profile?.id);
  const q = useQuery({
    queryKey: ['projects', userId],
    queryFn: () => fetchProjects(userId),
    staleTime: 5 * 60_000,
  });
  const abiertos = (q.data ?? []).filter((p) => p.status === 'active');
  const ahora = Date.now();
  const proximo = abiertos
    .filter((p) => p.event_date && new Date(p.event_date).getTime() > ahora)
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())[0];
  const mios = abiertos.filter((p) => p.joined).length;

  return (
    <Link
      href="/acciones?tab=proyectos"
      className="press group flex items-center gap-3.5 rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-lugar-proyectos/40 hover:shadow-lift"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lugar-proyectos/12 text-lugar-proyectos">
        <Users className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="eyebrow block text-lugar-proyectos">{t('proyectos.eyebrow')}</span>
        {q.isLoading ? (
          <Skeleton className="mt-1 h-5 w-40" />
        ) : (
          <>
            <span className="mt-0.5 block truncate font-display text-h3 font-bold leading-tight">
              {proximo ? proximo.title : abiertos.length > 0 ? t('proyectos.abiertos', { n: abiertos.length }) : t('proyectos.ninguno')}
            </span>
            <span className="mt-0.5 block truncate text-caption text-muted-foreground">
              {proximo
                ? `${new Date(proximo.event_date!).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}${proximo.city ? ` · ${proximo.city}` : ''}`
                : mios > 0
                  ? t('proyectos.mios', { n: mios })
                  : t('proyectos.bajada')}
            </span>
          </>
        )}
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-lugar-proyectos transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

// ── Tu impacto ──────────────────────────────────────────────────────────────

/** La frase de tu impacto, como puerta a `/impacto`. */
export function TarjetaImpacto() {
  const t = useTranslations('explorar');
  const q = useImpactoTotal();
  const h = q.data ? historiaPrincipal(q.data) : null;

  return (
    <Link
      href="/impacto"
      className="press group relative block overflow-hidden rounded-card bg-brote-ink p-4 text-brote-cream shadow-soft-lg hover:-translate-y-0.5"
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-domain-agua/20 blur-3xl" />
      <span className="eyebrow relative flex items-center gap-1.5 text-brote-cream/70">
        <Sprout className="h-3.5 w-3.5" aria-hidden />
        {t('impacto.eyebrow')}
      </span>
      {q.isLoading ? (
        <Skeleton className="relative mt-2 h-12 w-full !bg-white/10" />
      ) : (
        <p className="relative mt-1.5 text-balance font-display text-h2 font-bold leading-snug">{h ? h.frase : t('impacto.vacio')}</p>
      )}
      <span className="relative mt-3 inline-flex items-center gap-1 text-small font-semibold text-brote-cream/85">
        {t('impacto.ver')}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Clock, Flower2, MessagesSquare, Play, RotateCcw, Store, TreeDeciduous, TrendingUp } from 'lucide-react';
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
  useMundoAbierto,
  usePulsoPlaza,
} from './datos';
import { useEmpezar } from '@/lib/academia/usar-empezar';
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
 * "Seguí en Brote": the four places on a phone that are not in the tab bar
 * (Academia, Tu mundo, Mercado) or deserve a nudge (the Plaza), each with
 * something REAL of this person's in it — the next lesson, their island and
 * its ceibo, today's stories, products picked for them.
 *
 * Four different shapes on purpose, one per section, so the page stops being
 * the same bordered row repeated: an editorial card with the branch colour on
 * top (Academia), a picture (Tu mundo), a live counter (Plaza), a strip of
 * products (Mercado). The Academia card is the dominant one — a lesson is the
 * thing that fits in the five minutes after marking an action.
 */
export function SeguiEnBrote() {
  const t = useTranslations('inicio.seguir');
  const mundo = useMundoAbierto();
  const tipo = useSession((s) => s.profile?.accountType);
  const mercado = useMercadoDestacado();
  const conMercado = tipo !== 'kid' && (mercado.data?.length ?? 0) >= 2;
  const conMundo = mundo.data === true;

  return (
    <section aria-labelledby="segui-en-brote" className="space-y-3">
      <div>
        <span className="eyebrow block text-muted-foreground">{t('eyebrow')}</span>
        <h2 id="segui-en-brote" className="mt-1 font-display text-h2 font-bold leading-tight">
          {t('titulo')}
        </h2>
      </div>

      <TarjetaAcademia />

      <div className={cn('grid gap-3', conMundo ? 'grid-cols-2' : 'grid-cols-1')}>
        {conMundo && <TarjetaMundo />}
        <TarjetaPlaza compacta={conMundo} />
      </div>

      {conMercado && <TarjetaMercado />}
    </section>
  );
}

// ── Academia ────────────────────────────────────────────────────────────────

function TarjetaAcademia() {
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
      style={{ borderTopColor: color, borderTopWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow flex items-center gap-1.5" style={{ color }}>
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
                className="press inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-surface-2 px-4 text-small font-semibold hover:border-primary/30"
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
                className="press inline-flex h-11 items-center gap-2 rounded-pill bg-primary px-5 text-small font-bold text-primary-foreground shadow-crisp disabled:opacity-60"
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
          <p className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-primary">
            {t('abrirArbol')} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </p>
        </Link>
      )}
    </article>
  );
}

// ── Tu mundo ────────────────────────────────────────────────────────────────

function TarjetaMundo() {
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

function TarjetaPlaza({ compacta }: { compacta: boolean }) {
  const t = useTranslations('inicio.seguir');
  const q = usePulsoPlaza();
  const tendencia = q.data?.trending ? getDomain(q.data.trending) : undefined;
  const hoy = q.data?.today ?? 0;

  return (
    <Link
      href="/feed"
      onClick={() => marcarVisita('plaza')}
      className={cn(
        'press group flex flex-col justify-between rounded-card border border-border bg-surface-2 p-3.5 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift',
        compacta ? 'aspect-[4/5] sm:aspect-[5/4]' : 'min-h-[132px]',
      )}
    >
      <div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-live-pulse" aria-hidden />
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
          <MessagesSquare className="h-4 w-4 text-primary" aria-hidden />
          {t('plazaEntrar')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// ── Mercado ─────────────────────────────────────────────────────────────────

function TarjetaMercado() {
  const t = useTranslations('inicio.seguir');
  const q = useMercadoDestacado();
  const items = (q.data ?? []).slice(0, 4);

  return (
    <article className="rounded-card border border-border bg-surface p-3.5 shadow-soft">
      <Link href="/mercado" onClick={() => marcarVisita('mercado')} className="group flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="eyebrow flex items-center gap-1.5 text-brote-sun">
            <Store className="h-3.5 w-3.5" aria-hidden />
            {t('mercadoEyebrow')}
          </span>
          <span className="mt-0.5 block truncate font-display text-h3 font-bold">{t('mercadoTitulo')}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-primary">
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

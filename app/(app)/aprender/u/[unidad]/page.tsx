'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, CheckCircle2, Clock, Lock, Play, RotateCcw, RotateCw, Shuffle, Sprout, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressRing } from '@/components/ui/progress';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { SaviaMedidor } from '@/components/academia/SaviaMedidor';
import { SaviaVacia } from '@/components/academia/SaviaVacia';
import { fetchUnidad } from '@/lib/api/academia';
import { esFallo, leerFalta, type LeccionDeUnidad } from '@/lib/academia/modelo';
import { useEmpezar } from '@/lib/academia/usar-empezar';
import { getDomainColor } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';

const COLOR_TRONCO = '#1FB57A';

/**
 * Una unidad por dentro: qué se va a poder hacer al terminarla, sus sesiones
 * en orden como un camino, y qué unidades anteriores vuelve a traer.
 *
 * Es donde se aprieta "empezar", así que es también donde se explica la savia
 * cuando no queda. Una llamada: `academia_unidad(slug)` trae la unidad, sus
 * sesiones y el estado de la savia juntos.
 */
export default function UnidadPage() {
  const t = useTranslations('arbol');
  const params = useParams<{ unidad: string }>();
  const slug = params?.unidad ?? '';
  const { empezar, arrancando } = useEmpezar();
  const q = useQuery({
    queryKey: ['academia', 'unidad', slug],
    queryFn: () => fetchUnidad(slug),
    enabled: slug.length > 0,
    staleTime: 15_000,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 w-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (q.isError || !q.data || esFallo(q.data)) {
    const f = q.data && esFallo(q.data) ? q.data : null;
    return (
      <EmptyState
        pipMood="worried"
        title={t('unidadNoEncontrada')}
        message={f?.mensaje ?? t('errorCuerpo')}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => q.refetch()}>
              <RotateCw className="h-4 w-4" aria-hidden />
              {t('reintentar')}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/aprender">{t('volverAlArbol')}</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const { unidad: u, rama, lecciones, repasa, siguiente, estado } = q.data;
  const color = rama.es_tronco ? COLOR_TRONCO : getDomainColor(rama.slug);
  const sinSavia = !estado.pro && (estado.savia?.restante ?? 1) <= 0;
  const falta = leerFalta(u.falta);
  const cerrada = u.estado === 'bloqueada';
  const hecha = u.estado === 'completa' || u.estado === 'repasar';
  const proxima = lecciones.find((l) => l.estado === 'disponible');
  const practica = lecciones.find((l) => l.tipo === 'practica');
  const ejercicios = lecciones.reduce((a, l) => a + l.pasos, 0);
  const minutos = lecciones.reduce((a, l) => a + l.minutos, 0);

  return (
    <div className="space-y-6 pb-8">
      <Link
        href={rama.es_tronco ? '/aprender' : `/aprender/${rama.slug}`}
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {rama.es_tronco ? t('volverAlArbol') : rama.nombre_es}
      </Link>

      <header className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow" style={{ color }}>
            {rama.es_tronco ? t('troncoN', { n: u.orden }) : `${rama.nombre_es} · ${t('unidadDeN', { n: u.orden, total: rama.unidades })}`}
            {!rama.es_tronco ? ` · ${t(`nivel_${u.nivel}`)}` : ''}
          </p>
          <h1 className="mt-1 text-balance font-display text-h1 font-extrabold sm:text-display-l leading-tight">{u.titulo_es}</h1>
          <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{u.bajada_es}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
            <span>{t('nSesiones', { n: lecciones.length })}</span>
            <span aria-hidden>·</span>
            <span>{t('nEjercicios', { n: ejercicios })}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {t('minutosAprox', { n: minutos })}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ProgressRing value={u.total ? u.hechas / u.total : 0} size={64} strokeWidth={6} color={color}>
            <span className="tnum font-display text-small font-extrabold">
              {u.hechas}/{u.total}
            </span>
          </ProgressRing>
          <SaviaMedidor savia={estado.savia} pro={estado.pro} />
        </div>
      </header>

      {cerrada ? (
        <div className="flex items-start gap-3 rounded-card border border-hairline bg-surface-2 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-small leading-relaxed">
            {falta?.tipo === 'tronco'
              ? t('faltaTronco', { titulo: falta.titulo })
              : falta
                ? t('faltaUnidad', { titulo: falta.titulo })
                : t('faltaGenerico')}
          </p>
        </div>
      ) : null}

      {hecha ? (
        <div
          className="flex items-start gap-3 rounded-card border p-4"
          style={{ borderColor: `${color}55`, backgroundColor: `${color}10` }}
        >
          {u.estado === 'repasar' ? (
            <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-brote-sun" aria-hidden />
          ) : (
            <Sprout className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-h3 font-bold leading-tight">
              {u.estado === 'repasar' ? t('unidadRepasarTitulo') : t('unidadCompletaTitulo')}
            </p>
            <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">
              {u.estado === 'repasar' ? t('unidadRepasarCuerpo') : t('unidadCompletaCuerpo')}
            </p>
            {practica ? (
              <Button className="mt-3" variant="secondary" loading={arrancando === practica.id} onClick={() => void empezar(practica.id)}>
                <Shuffle className="h-4 w-4" aria-hidden />
                {t('practicarUnidad')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {sinSavia && !hecha ? <SaviaVacia savia={estado.savia} /> : null}

      {u.objetivos_es.length ? (
        <section>
          <SectionHeader eyebrow={t('objetivosEyebrow')} title={t('objetivosTitulo')} />
          <ul className="space-y-2">
            {u.objetivos_es.map((o, i) => (
              <li key={i}>
                <Reveal index={i}>
                  <span className="flex items-start gap-2.5 text-small leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} aria-hidden />
                    {o}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <SectionHeader eyebrow={t('caminoEyebrow')} title={t('caminoTitulo')} subtitle={t('caminoSub')} />
        <ol className="relative">
          {/* La ramita que une las sesiones */}
          <span className="absolute bottom-6 left-[1.35rem] top-6 w-1 rounded-pill bg-hairline" aria-hidden />
          <span
            className="absolute left-[1.35rem] top-6 w-1 rounded-pill transition-[height] duration-700"
            style={{
              backgroundColor: color,
              height: `calc((100% - 3rem) * ${lecciones.length > 1 ? Math.max(0, lecciones.filter((l) => l.estado === 'completa').length - 1) / (lecciones.length - 1) : 0})`,
            }}
            aria-hidden
          />
          {lecciones.map((l, i) => (
            <li key={l.id} className="relative">
              <Reveal index={i}>
                <FilaSesion
                  l={l}
                  color={color}
                  actual={l.id === proxima?.id}
                  sinSavia={sinSavia}
                  cargando={arrancando === l.id}
                  onEmpezar={() => void empezar(l.id)}
                />
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {repasa.length ? (
        <section className="rounded-card border border-hairline bg-surface-2 p-4">
          <h2 className="flex items-center gap-2 font-display text-h3 font-bold leading-tight">
            <RotateCcw className="h-4 w-4 text-brote-aqua" aria-hidden />
            {t('repasaTitulo')}
          </h2>
          <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('repasaCuerpo')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {repasa.map((r) => (
              <Link
                key={r.slug}
                href={`/aprender/u/${r.slug}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-3 py-1.5 text-caption font-semibold transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.rama_slug === 'tronco' ? COLOR_TRONCO : getDomainColor(r.rama_slug) }}
                  aria-hidden
                />
                {r.titulo_es}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {siguiente ? (
        <p className="flex items-center gap-2 border-t border-hairline pt-4 text-small text-muted-foreground">
          <Sprout className="h-4 w-4 shrink-0" style={{ color }} aria-hidden />
          {hecha ? (
            <span>
              {t('siguienteAbierta')}{' '}
              <Link href={`/aprender/u/${siguiente.slug}`} className="font-semibold text-foreground underline-offset-2 hover:underline">
                {siguiente.titulo_es}
              </Link>
            </span>
          ) : (
            <span>{t('siguienteSeAbre', { titulo: siguiente.titulo_es })}</span>
          )}
        </p>
      ) : null}
    </div>
  );
}

function FilaSesion({
  l,
  color,
  actual,
  sinSavia,
  cargando,
  onEmpezar,
}: {
  l: LeccionDeUnidad;
  color: string;
  actual: boolean;
  sinSavia: boolean;
  cargando: boolean;
  onEmpezar: () => void;
}) {
  const t = useTranslations('arbol');
  const hecha = l.estado === 'completa';
  const cerrada = l.estado === 'bloqueada';
  const Icono = hecha ? Check : cerrada ? Lock : l.tipo === 'desafio' ? Trophy : l.tipo === 'practica' ? Shuffle : Play;

  return (
    <div className={cn('flex gap-3.5 py-3', actual && 'rounded-card bg-surface shadow-soft ring-1 ring-hairline -mx-2 px-2')}>
      <span
        className={cn(
          'relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] bg-background',
          hecha && 'text-white',
          cerrada && 'border-hairline text-muted-foreground',
        )}
        style={hecha ? { backgroundColor: color, borderColor: color } : !cerrada ? { borderColor: color, color } : undefined}
        aria-hidden
      >
        <Icono className="h-5 w-5" fill={!hecha && !cerrada && l.tipo === 'leccion' ? 'currentColor' : 'none'} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow" style={!cerrada ? { color } : undefined}>
          {t('sesionN', { n: l.orden })} · {t(`tipoSesion_${l.tipo}`)}
        </p>
        <p className={cn('mt-0.5 font-display text-h3 font-bold leading-snug', cerrada && 'text-muted-foreground')}>{l.titulo_es}</p>
        <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{l.bajada_es}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-caption text-muted-foreground">
          {l.pasos > 0 ? <span>{t('nEjercicios', { n: l.pasos })}</span> : <span>{t('ejerciciosAdaptativos')}</span>}
          <span aria-hidden>·</span>
          <span>{t('minutos', { n: l.minutos })}</span>
          {l.mejor_score > 0 ? (
            <>
              <span aria-hidden>·</span>
              <span className="tnum font-semibold text-foreground">{t('mejor', { n: l.mejor_score })}</span>
            </>
          ) : null}
        </p>
        {!cerrada ? (
          <Button
            size="sm"
            className="mt-2.5"
            variant={actual ? 'primary' : 'secondary'}
            disabled={sinSavia && !hecha}
            loading={cargando}
            onClick={onEmpezar}
          >
            {hecha ? t('rehacer') : t('empezar')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

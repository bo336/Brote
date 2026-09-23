'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, ChevronRight, Droplets, Lock, Play } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchMapa } from '@/lib/api/academia';
import { esFallo, leerFalta, type UnidadDelMapa } from '@/lib/academia/modelo';
import { getDomainColor } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';

const COLOR_TRONCO = '#1FB57A';

/**
 * Una rama entera, de la base a la punta, como una lista vertical: la versión
 * legible en una mano de lo que el árbol dibuja en abanico.
 *
 * No hace una consulta nueva: reusa el caché de `academia_mapa()` (misma
 * clave de query), así que entrar desde el árbol es instantáneo.
 */
export default function RamaPage() {
  const t = useTranslations('arbol');
  const params = useParams<{ rama: string }>();
  const slug = params?.rama ?? '';
  const q = useQuery({ queryKey: ['academia', 'mapa'], queryFn: fetchMapa, staleTime: 20_000 });

  if (q.isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <Skeleton className="h-28 w-full" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const mapa = q.data && !esFallo(q.data) ? q.data : null;
  const rama = mapa?.ramas.find((r) => r.slug === slug);
  if (!rama) {
    return (
      <EmptyState
        pipMood="worried"
        title={t('ramaNoEncontrada')}
        message={t('errorCuerpo')}
        action={
          <Button asChild variant="secondary">
            <Link href="/aprender">{t('volverAlArbol')}</Link>
          </Button>
        }
      />
    );
  }

  const color = rama.es_tronco ? COLOR_TRONCO : getDomainColor(rama.slug);
  const completas = rama.unidades.filter((u) => u.estado === 'completa' || u.estado === 'repasar').length;
  const sesiones = rama.unidades.reduce((a, u) => a + u.total, 0);
  const hechas = rama.unidades.reduce((a, u) => a + u.hechas, 0);
  // Se lee de la base a la punta, como crece: la unidad 1 arriba en pantalla.
  const unidades = rama.unidades;

  return (
    <div className="space-y-5 pb-8">
      <Link
        href="/aprender"
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('volverAlArbol')}
      </Link>

      <header>
        <p className="eyebrow" style={{ color }}>
          {t('rama')}
        </p>
        <h1 className="mt-1 font-display text-h1 font-extrabold leading-tight sm:text-display-l">{rama.nombre_es}</h1>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{rama.bajada_es}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 border-y border-hairline py-3">
          <div>
            <p className="tnum font-display text-h2 font-extrabold">
              {completas}
              <span className="text-muted-foreground">/{unidades.length}</span>
            </p>
            <p className="text-caption text-muted-foreground">{t('statUnidades')}</p>
          </div>
          <div>
            <p className="tnum font-display text-h2 font-extrabold">
              {hechas}
              <span className="text-muted-foreground">/{sesiones}</span>
            </p>
            <p className="text-caption text-muted-foreground">{t('statSesiones')}</p>
          </div>
        </div>
      </header>

      <ol className="relative">
        <span className="absolute bottom-10 left-[1.45rem] top-10 w-1.5 rounded-pill bg-hairline" aria-hidden />
        {unidades.map((u, i) => (
          <li key={u.slug} className="relative pb-3">
            <Reveal index={i}>
              <FilaUnidad u={u} color={color} esTronco={rama.es_tronco} ultima={i === unidades.length - 1} />
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FilaUnidad({ u, color, esTronco, ultima }: { u: UnidadDelMapa; color: string; esTronco: boolean; ultima: boolean }) {
  const t = useTranslations('arbol');
  const hecha = u.estado === 'completa' || u.estado === 'repasar';
  const cerrada = u.estado === 'bloqueada';
  const falta = leerFalta(u.falta);
  const Icono = u.estado === 'completa' ? Check : u.estado === 'repasar' ? Droplets : cerrada ? Lock : Play;

  return (
    <Link
      href={`/aprender/u/${u.slug}`}
      className={cn(
        'group flex gap-3.5 rounded-card p-2 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span
        className={cn(
          'relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] bg-background transition-transform group-hover:scale-105',
          hecha && 'text-white',
          cerrada && 'border-hairline text-muted-foreground',
        )}
        style={hecha ? { backgroundColor: color, borderColor: color } : !cerrada ? { borderColor: color, color } : undefined}
        aria-hidden
      >
        <Icono className="h-5 w-5" fill={!hecha && !cerrada ? 'currentColor' : 'none'} />
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <p className="eyebrow" style={!cerrada ? { color } : undefined}>
          {esTronco ? t('troncoN', { n: u.orden }) : `${t('unidadN', { n: u.orden })} · ${t(`nivel_${u.nivel}`)}`}
          {ultima && !esTronco ? ` · ${t('puntaDeRama')}` : ''}
        </p>
        <p className={cn('mt-0.5 font-display text-h3 font-bold leading-snug', cerrada && 'text-muted-foreground')}>{u.titulo_es}</p>
        <p className="mt-0.5 line-clamp-2 text-small leading-relaxed text-muted-foreground">{u.bajada_es}</p>
        {cerrada ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-caption text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden />
            {falta?.tipo === 'tronco'
              ? t('faltaTroncoCorta', { titulo: falta.titulo })
              : falta
                ? t('faltaUnidadCorta', { titulo: falta.titulo })
                : t('estado_bloqueada')}
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2.5">
            <ProgressBar value={u.total ? u.hechas / u.total : 0} color={color} height={5} />
            <span className="tnum shrink-0 text-caption text-muted-foreground">
              {u.hechas}/{u.total}
            </span>
          </div>
        )}
      </div>
      <ChevronRight className="mt-4 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

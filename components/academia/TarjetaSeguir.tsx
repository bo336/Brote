'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import type { Siguiente, UnidadDelMapa } from '@/lib/academia/modelo';
import { getDomainColor } from '@/lib/domains';
import { useEmpezar } from '@/lib/academia/usar-empezar';

const COLOR_TRONCO = '#1FB57A';

/**
 * "Seguí donde quedaste": la próxima sesión que conviene hacer, con el motivo.
 *
 * El motivo lo decide el servidor (seguir la unidad a medias, empezar por el
 * tronco, una rama que te interesa) porque depende de datos que solo él tiene.
 * Acá solo se dice en castellano.
 */
export function TarjetaSeguir({
  siguiente,
  unidad,
  ramaNombre,
  sinSavia,
}: {
  siguiente: Siguiente;
  unidad: UnidadDelMapa | undefined;
  ramaNombre: string;
  sinSavia: boolean;
}) {
  const t = useTranslations('arbol');
  const { empezar, arrancando } = useEmpezar();
  const color = siguiente.unidad.rama_slug === 'tronco' ? COLOR_TRONCO : getDomainColor(siguiente.unidad.rama_slug);
  const l = siguiente.leccion;
  const nueva = unidad?.lecciones.find((x) => x.id === l.id)?.estado !== 'completa';
  const bloqueadaPorSavia = sinSavia && nueva;

  return (
    <section
      className="relative overflow-hidden rounded-card border border-hairline bg-surface p-5 shadow-soft"
      style={{ borderTopColor: color, borderTopWidth: 4 }}
    >
      <p className="eyebrow" style={{ color }}>
        {t(`motivo_${siguiente.motivo}`)} · {ramaNombre}
      </p>
      <h2 className="mt-1.5 text-balance font-display text-h1 font-extrabold leading-tight">
        {siguiente.unidad.titulo_es}
      </h2>
      <div className="mt-3 flex items-start gap-3 border-t border-hairline pt-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-small font-extrabold text-white"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {l.orden}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold leading-snug">
            {t(`tipoSesion_${l.tipo}`)} · {l.titulo_es}
          </p>
          <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{l.bajada_es}</p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-caption text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {t('minutos', { n: l.minutos })}
          </p>
        </div>
      </div>

      {unidad ? (
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={unidad.total ? unidad.hechas / unidad.total : 0} color={color} height={6} />
          <span className="tnum shrink-0 text-caption text-muted-foreground">
            {t('sesionesHechas', { hechas: unidad.hechas, total: unidad.total })}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          block
          size="lg"
          disabled={bloqueadaPorSavia}
          loading={arrancando === l.id}
          onClick={() => void empezar(l.id)}
          className="sm:flex-1"
        >
          <Play className="h-4 w-4" aria-hidden fill="currentColor" />
          {t('empezarSesion', { n: l.orden })}
        </Button>
        <Button asChild variant="secondary" size="lg" className="sm:w-auto">
          <Link href={`/aprender/u/${siguiente.unidad.slug}`}>
            {t('verUnidad')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

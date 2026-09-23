'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Lock, Play, RotateCcw, Trophy, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { Sheet } from '@/components/ui/sheet';
import type { NodoUbicado } from '@/lib/academia/geometria';
import { leerFalta, type LeccionDelMapa } from '@/lib/academia/modelo';
import { useEmpezar } from '@/lib/academia/usar-empezar';
import { cn } from '@/lib/utils/cn';

/**
 * Lo que se abre al tocar una unidad en el árbol: de qué se trata, cuánto
 * falta y el botón para seguir, sin salir del árbol.
 *
 * Una unidad cerrada también se abre: dice exactamente qué hay que terminar
 * para abrirla. Una puerta cerrada sin cartel es la peor pantalla posible.
 */
export function HojaUnidad({
  nodo,
  onCerrar,
  sinSavia,
}: {
  nodo: NodoUbicado | null;
  onCerrar: () => void;
  sinSavia: boolean;
}) {
  const t = useTranslations('arbol');
  const { empezar, arrancando } = useEmpezar();
  const u = nodo?.unidad;
  const color = nodo?.color ?? '#1FB57A';
  const falta = leerFalta(u?.falta ?? null);
  const proxima = u?.lecciones.find((l) => l.estado === 'disponible');
  const practica = u?.lecciones.find((l) => l.tipo === 'practica');
  const hecha = u?.estado === 'completa' || u?.estado === 'repasar';

  return (
    <Sheet
      open={!!nodo}
      onOpenChange={(o) => {
        if (!o) onCerrar();
      }}
      title={u?.titulo_es ?? ''}
      description={u?.bajada_es}
    >
      {u && nodo ? (
        <div className="space-y-4 pb-2">
          <p className="eyebrow -mt-1" style={{ color }}>
            {nodo.ramaSlug === 'tronco' ? t('troncoN', { n: u.orden }) : `${nodo.ramaNombre} · ${t('unidadN', { n: u.orden })}`}
            {nodo.ramaSlug !== 'tronco' ? ` · ${t(`nivel_${u.nivel}`)}` : ''}
          </p>

          {u.estado === 'bloqueada' ? (
            <div className="flex items-start gap-3 rounded-card border border-hairline bg-surface-2 p-3.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-small leading-relaxed">
                {falta?.tipo === 'tronco'
                  ? t('faltaTronco', { titulo: falta.titulo })
                  : falta
                    ? t('faltaUnidad', { titulo: falta.titulo })
                    : t('faltaGenerico')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ProgressBar value={u.total ? u.hechas / u.total : 0} color={color} height={7} />
              <span className="tnum shrink-0 text-caption text-muted-foreground">
                {t('sesionesHechas', { hechas: u.hechas, total: u.total })}
              </span>
            </div>
          )}

          <ol className="divide-y divide-hairline border-y border-hairline">
            {u.lecciones.map((l) => (
              <FilaLeccion key={l.id} l={l} color={color} />
            ))}
          </ol>

          <div className="flex flex-col gap-2">
            {proxima ? (
              <Button
                block
                size="lg"
                disabled={sinSavia && proxima.estado !== 'completa'}
                loading={arrancando === proxima.id}
                onClick={() => void empezar(proxima.id)}
              >
                <Play className="h-4 w-4" aria-hidden fill="currentColor" />
                {t('empezarSesion', { n: proxima.orden })}
              </Button>
            ) : hecha && practica ? (
              <Button block size="lg" variant="secondary" loading={arrancando === practica.id} onClick={() => void empezar(practica.id)}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t('practicarUnidad')}
              </Button>
            ) : null}
            <Button asChild block variant={proxima ? 'secondary' : 'primary'}>
              <Link href={`/aprender/u/${u.slug}`} onClick={onCerrar}>
                {t('verUnidad')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

function FilaLeccion({ l, color }: { l: LeccionDelMapa; color: string }) {
  const t = useTranslations('arbol');
  const Icono = l.estado === 'completa' ? Check : l.estado === 'bloqueada' ? Lock : l.tipo === 'desafio' ? Trophy : l.tipo === 'practica' ? Shuffle : Play;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-caption',
          l.estado === 'completa' ? 'border-transparent text-white' : 'border-hairline text-muted-foreground',
        )}
        style={l.estado === 'completa' ? { backgroundColor: color } : l.estado === 'disponible' ? { borderColor: color, color } : undefined}
        aria-hidden
      >
        <Icono className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-small', l.estado === 'bloqueada' ? 'text-muted-foreground' : 'font-semibold')}>
          {l.orden}. {l.titulo_es}
        </span>
        <span className="block text-caption text-muted-foreground">
          {t(`tipoSesion_${l.tipo}`)} · {t('minutos', { n: l.minutos })}
        </span>
      </span>
      {l.mejor_score > 0 ? <span className="tnum shrink-0 text-caption font-semibold text-muted-foreground">{l.mejor_score}%</span> : null}
    </li>
  );
}

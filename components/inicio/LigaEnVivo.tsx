'use client';

import Link from 'next/link';
import { ArrowUpRight, Trophy, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FraseLiga, quedanTexto } from '@/components/ranking/TuLiga';
import { useMiLiga } from '@/hooks/use-liga';
import { formatPoints } from '@/lib/points';

/**
 * La liga de la semana, en vivo, en Hoy (docs/REESTRUCTURA.md D4).
 *
 * El dueño dijo que la liga semanal es lo más importante (2026-11-02), y Hoy
 * no la mostraba: había que ir a buscarla. Ahora cada acción que se marca
 * mueve una tarjeta que está a la vista — el puesto en el grupo, los puntos de
 * la semana y lo que falta, con la misma frase que la Liga.
 */
export function LigaEnVivo() {
  const q = useMiLiga();

  if (q.isLoading) return <Skeleton className="h-[104px] w-full rounded-card" />;
  const d = q.data;
  if (!d) return null;
  const liga = d.ligas.find((l) => l.tier === d.tier);
  if (!liga) return null;
  const siguiente = d.ligas.find((l) => l.tier === d.tier + 1) ?? null;
  const cuando = d.periodo.tipo === 'mes' ? 'este mes' : 'esta semana';
  const tope = Math.max(liga.subir ?? Math.round(liga.mantener * 1.4), d.puntos, 1);
  const pct = Math.min(100, (d.puntos / tope) * 100);
  const piso = (liga.mantener / tope) * 100;

  // La semana pasada, sólo los primeros dos días de la nueva: es noticia, no historial.
  const ultimo = d.historial[0];
  const reciente = ultimo && d.periodo.dias - d.periodo.quedan <= 1;
  const subio = reciente && ultimo.resultado === 'sube';

  return (
    <Link
      href="/ranking"
      aria-label={`Tu liga: ${liga.nombre}. Ver la liga`}
      className="press group block overflow-hidden rounded-card border border-border bg-surface shadow-soft hover:-translate-y-0.5 hover:border-lugar-liga/40 hover:shadow-lift"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lugar-liga/12 text-lugar-liga">
          <Trophy className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <span className="eyebrow flex items-center gap-1.5 text-lugar-liga">
            Tu liga · {quedanTexto(d.periodo.quedan)}
          </span>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-display text-h3 font-bold leading-tight">
            <span style={{ color: liga.color }}>{liga.nombre}</span>
            {d.en_grupo && d.pos != null && (
              <span className="text-small font-semibold text-muted-foreground tnum">
                {d.pos}º de {d.tam}
              </span>
            )}
          </p>
          <p className="mt-1 text-small leading-snug text-muted-foreground">
            {d.puntos === 0 ? (
              <>Tu primer punto de la semana te mete en un grupo de {d.reglas.tamano_grupo}.</>
            ) : (
              <FraseLiga liga={liga} siguiente={siguiente} puntos={d.puntos} cuando={cuando} />
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-h1 font-extrabold leading-none tnum">{formatPoints(d.puntos)}</p>
          <p className="mt-0.5 text-caption text-muted-foreground">pts</p>
        </div>
      </div>

      <div className="relative mx-4 mb-3 h-1.5 overflow-hidden rounded-pill bg-surface-2" aria-hidden>
        <div className="h-full rounded-pill transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: liga.color }} />
        {liga.tier > 1 && liga.mantener > 0 && <span className="absolute top-0 h-full w-0.5 bg-foreground/40" style={{ left: `${piso}%` }} />}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-hairline px-4 py-2.5 text-caption">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground">
          {subio ? (
            <>
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-hecho" aria-hidden />
              <span className="truncate font-semibold text-foreground">La semana pasada subiste. ¡A sostenerla!</span>
            </>
          ) : d.hoy > 0 ? (
            <span className="truncate tnum">Hoy sumaste {formatPoints(Math.min(d.hoy, d.reglas.tope_diario))} para la liga</span>
          ) : (
            <span className="truncate">Cada acción de hoy suma acá</span>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-lugar-liga">
          Ver la liga
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

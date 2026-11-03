'use client';

import { useState } from 'react';
import { ChevronDown, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardRow } from '@/components/ranking/LeaderboardRow';
import { useCupoProyectos, useMiLiga } from '@/hooks/use-liga';
import { usePipStyles } from '@/hooks/use-pip-styles';
import type { LigaCompleta, MiLiga } from '@/lib/api/ligas';
import { estadoSemana } from '@/lib/ligas';
import { formatPoints } from '@/lib/points';
import { cn } from '@/lib/utils/cn';

/**
 * Tu liga de esta semana: en cuál estás, cuántos puntos llevás y qué te falta
 * para mantenerte o subir. Es lo primero que se ve en /ranking.
 */

const fechaCorta = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

function quedanTexto(n: number) {
  return n <= 1 ? 'Termina hoy' : `Quedan ${n} días`;
}

/** Hasta dónde llega la barra: la meta de subir, o un poco más que el piso en la última liga. */
function topeBarra(l: LigaCompleta, puntos: number) {
  return Math.max(l.subir ?? Math.round(l.mantener * 1.4), puntos, 1);
}

function Frase({ liga, siguiente, puntos, cuando }: { liga: LigaCompleta; siguiente: LigaCompleta | null; puntos: number; cuando: string }) {
  const e = estadoSemana(liga, puntos);
  const f = formatPoints(e.faltan);
  if (e.caso === 'por_mantener') {
    return (
      <>
        Te faltan <b className="tnum">{f}</b> puntos para seguir en {liga.nombre} {cuando}.
      </>
    );
  }
  if (e.caso === 'tope') return <>Ya te mantenés en {liga.nombre}, la liga más alta.</>;
  if (e.caso === 'ya_sube') return <>Ya llegaste: el lunes subís a {siguiente?.nombre}.</>;
  return (
    <>
      {liga.tier > 1 ? 'Ya te mantenés. ' : ''}Te faltan <b className="tnum">{f}</b> puntos para subir a {siguiente?.nombre}.
    </>
  );
}

export function TuLiga() {
  const q = useMiLiga();
  const cupo = useCupoProyectos();
  const [abierto, setAbierto] = useState(false);

  if (q.isLoading) return <Skeleton className="h-60 w-full" />;
  const d = q.data;
  if (!d) return null;

  const liga = d.ligas.find((l) => l.tier === d.tier);
  if (!liga) return null;
  const siguiente = d.ligas.find((l) => l.tier === d.tier + 1) ?? null;
  const tope = topeBarra(liga, d.puntos);
  const pct = Math.min(100, (d.puntos / tope) * 100);
  const piso = (liga.mantener / tope) * 100;
  const cuando = d.periodo.tipo === 'mes' ? 'este mes' : 'esta semana';
  const ultimo = d.historial[0];
  const nombreDe = (t: number) => d.ligas.find((l) => l.tier === t)?.nombre ?? '';

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-4" style={{ background: `${liga.color}14` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="eyebrow block text-muted-foreground">
              Tu liga · {fechaCorta(d.periodo.inicio)} al {fechaCorta(d.periodo.fin)}
            </span>
            <p className="mt-0.5 font-display text-h2 font-extrabold leading-tight" style={{ color: liga.color }}>
              {liga.nombre}
            </p>
          </div>
          <span className="shrink-0 rounded-pill border border-border bg-surface px-2.5 py-1 text-caption font-medium">
            {quedanTexto(d.periodo.quedan)}
          </span>
        </div>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{liga.descripcion}</p>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-display-l font-extrabold leading-none tnum">{formatPoints(d.puntos)}</p>
          <p className="text-caption text-muted-foreground">puntos {cuando}</p>
        </div>

        <div>
          <div className="relative h-2.5 overflow-hidden rounded-pill bg-surface-2">
            <div className="h-full rounded-pill transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: liga.color }} />
            {liga.tier > 1 && liga.mantener > 0 && (
              <span className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${piso}%` }} aria-hidden />
            )}
          </div>
          <div className="relative mt-1 h-4 text-[11px] text-muted-foreground tnum">
            {liga.tier > 1 && liga.mantener > 0 && (
              <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.max(piso, 12)}%` }}>
                {formatPoints(liga.mantener)} mantenés
              </span>
            )}
            {liga.subir != null && <span className="absolute right-0">{formatPoints(liga.subir)} subís</span>}
          </div>
        </div>

        <p className="text-small font-semibold leading-relaxed">
          <Frase liga={liga} siguiente={siguiente} puntos={d.puntos} cuando={cuando} />
        </p>

        {d.hoy >= d.reglas.tope_diario && (
          <p className="text-caption leading-relaxed text-muted-foreground">
            Hoy llegaste al tope: en la liga cuentan hasta {formatPoints(d.reglas.tope_diario)} puntos por día. Tus puntos totales igual suben.
          </p>
        )}

        {ultimo && (
          <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
            {ultimo.resultado === 'sube' ? (
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brote-green" aria-hidden />
            ) : ultimo.resultado === 'baja' ? (
              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-brote-coral" aria-hidden />
            ) : (
              <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            La semana pasada: {ultimo.resultado === 'sube' ? 'subiste a' : ultimo.resultado === 'baja' ? 'bajaste a' : 'seguiste en'} {nombreDe(ultimo.nuevo)}
            {ultimo.puntos != null ? `, con ${formatPoints(Number(ultimo.puntos))} puntos` : ''}.
          </p>
        )}

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="flex w-full items-center justify-between gap-2 border-t border-hairline pt-3 text-small font-medium"
        >
          Cómo funcionan las ligas
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', abierto && 'rotate-180')} />
        </button>

        {abierto && (
          <div className="space-y-3">
            <ul className="space-y-1.5 text-caption leading-relaxed text-muted-foreground">
              <li>Cada lunes se cierra la semana. Si llegaste a la meta, subís una liga; si no llegaste al piso, bajás una; en el medio, seguís donde estás.</li>
              <li>Cuentan todos los puntos que sumás, hasta {formatPoints(d.reglas.tope_diario)} por día: un solo día de empujón no alcanza.</li>
              <li>En un grupo de {d.reglas.grupo_minimo} personas o más, los {d.reglas.top_suben} primeros también suben, si llegaron a mantenerse.</li>
              {cupo.data?.adulto && (
                <li>
                  Sumarte a un proyecto es libre. Para crear y manejar uno hace falta estar en {cupo.data.min_nombre} o más
                  {cupo.data.cupo > 0 ? `: hoy podés organizar ${cupo.data.cupo === 1 ? '1 proyecto' : `${cupo.data.cupo} proyectos`} a la vez.` : '.'}
                </li>
              )}
              <li>Tu rango (Semilla, Brote…) va por todos tus puntos y nunca baja.</li>
            </ul>
            <ol className="overflow-hidden rounded-button border border-border">
              {[...d.ligas].reverse().map((l) => (
                <li
                  key={l.tier}
                  className={cn('flex items-center gap-2.5 border-b border-hairline px-3 py-2.5 last:border-b-0', l.tier === d.tier && 'bg-primary/5')}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-semibold">
                      {l.nombre}
                      {l.tier === d.tier && <span className="font-normal text-muted-foreground"> · vos</span>}
                    </span>
                    <span className="block text-caption text-muted-foreground tnum">
                      {l.tier > 1 && `${formatPoints(l.mantener)} para seguir`}
                      {l.tier > 1 && l.subir != null && ' · '}
                      {l.subir != null && `${formatPoints(l.subir)} para subir`}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Tu grupo de la semana: la tabla de la liga. La flecha dice cómo cerraría hoy. */
export function TablaLiga({ myId }: { myId?: string }) {
  const q = useMiLiga();
  const d: MiLiga | null | undefined = q.data;
  const pips = usePipStyles((d?.filas ?? []).map((f) => f.user_id));

  if (q.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[60px] w-full" />
        ))}
      </div>
    );
  }
  if (q.isError || !d) return <EmptyState message="No pudimos cargar tu liga. Probá de nuevo." />;
  if (!d.en_grupo) {
    return (
      <EmptyState
        message={
          d.puntos > 0
            ? 'Esta cuenta se mide con sus metas y no entra en la tabla de un grupo.'
            : 'Sumá tu primer punto de la semana y entrás a un grupo de tu liga.'
        }
      />
    );
  }

  const liga = d.ligas.find((l) => l.tier === d.tier);
  const grande = d.tam >= d.reglas.grupo_minimo;
  const zona = (pos: number, puntos: number): 'sube' | 'baja' | null => {
    if (!liga) return null;
    if (liga.subir != null && puntos >= liga.subir) return 'sube';
    if (liga.subir != null && grande && pos <= d.reglas.top_suben && puntos >= liga.mantener && puntos > 0) return 'sube';
    if (liga.tier > 1 && puntos < liga.mantener) return 'baja';
    return null;
  };

  return (
    <div className="space-y-2">
      <p className="text-caption leading-relaxed text-muted-foreground">
        Tu grupo: {d.tam === 1 ? 'por ahora estás vos' : `${d.tam} personas de ${liga?.nombre} que ya sumaron esta semana`}. La flecha dice quién subiría o bajaría si la semana cerrara hoy.
      </p>
      {d.filas.map((f) => (
        <LeaderboardRow
          key={f.user_id}
          entry={{
            pos: f.pos,
            user_id: f.user_id,
            username: f.username,
            display_name: f.display_name,
            avatar_url: f.avatar_url,
            neighborhood: null,
            xp: f.puntos,
            rank_slug: f.rank_slug,
            division: f.division,
            title_es: null,
          }}
          isMe={f.user_id === myId}
          metric="xp"
          pipStyle={pips.data?.[f.user_id]?.pip_style ?? null}
          zona={zona(f.pos, f.puntos)}
        />
      ))}
    </div>
  );
}

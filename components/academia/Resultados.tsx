'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
import { Pip } from '@/components/pip/Pip';
import { Reveal } from '@/components/ui/reveal';
import { FuerzaMedidor } from '@/components/academia/FuerzaMedidor';
import { DomainIcon } from '@/components/icons/DomainIcon';
import type { ResultadoSesion } from '@/lib/academia/types';
import { cerrarAnillo, marcarGancho } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/types';
import { useRewards } from '@/stores/rewards';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { localDate } from '@/lib/utils/dates';
import { getDomainColor } from '@/lib/domains';

/**
 * El cierre de una sesión.
 *
 * EL ORDEN ES LA PANTALLA (15-ui-motion.md §5): Pip, el puntaje, lo que se
 * ganó, qué conceptos se movieron, y recién ahí el gancho de acción — con el
 * peso de CTA primario, porque es lo único de esta pantalla que cambia algo
 * afuera de la app. Saber que el agua virtual existe no ahorra un litro; poner
 * el lavarropas lleno, sí.
 *
 * Si el servidor no encontró una acción elegible devuelve `null` y no se
 * dibuja nada: una acción en enfriamiento sería un link roto disfrazado de
 * sugerencia, y esta sección no inventa acciones.
 */
export function Resultados({
  resultado,
  sesionId,
  ramaSlug,
  onCerrar,
}: {
  resultado: ResultadoSesion;
  sesionId: string;
  ramaSlug: string;
  onCerrar: () => void;
}) {
  const t = useTranslations('academia');
  const yaCelebrado = useRef(false);
  const color = getDomainColor(ramaSlug);

  // Las celebraciones van por los caminos que ya existen: la cola de premios y
  // el toast de puntos. La Academia no estrena su propio sistema de festejo.
  useEffect(() => {
    if (yaCelebrado.current) return;
    yaCelebrado.current = true;

    if (resultado.xp > 0) toast.points(resultado.xp);

    const { profile, applyCompletion } = useSession.getState();
    if (profile) {
      applyCompletion({
        totalXp: profile.totalXp + resultado.xp,
        streak: resultado.racha,
        streakDate: resultado.racha_sumo ? localDate() : undefined,
      });
    }

    const eventos: Parameters<ReturnType<typeof useRewards.getState>['enqueue']>[0] = [];
    for (const x of (resultado.nuevos_titulos ?? []) as { name_es?: string; rarity?: string }[]) {
      if (x?.name_es) eventos.push({ kind: 'title', name: x.name_es, rarity: x.rarity ?? 'comun' });
    }
    for (const x of (resultado.nuevas_insignias ?? []) as { name_es?: string; rarity?: string }[]) {
      if (x?.name_es) eventos.push({ kind: 'badge', name: x.name_es, rarity: x.rarity ?? 'comun' });
    }
    if (eventos.length) useRewards.getState().enqueue(eventos);

    // El gancho se muestra: queda registrado para poder calcular la tasa de
    // toques. Es la métrica que dice si la sección cumple su única promesa.
    if (resultado.accion) void marcarGancho(sesionId, resultado.accion.id, 'mostrado');

    // ¿Se cerró un anillo? Se pregunta ACÁ y no en `finish_session` porque el
    // cierre depende del estado del árbol entero, no de esta sesión. La
    // ceremonia va por la MISMA cola de premios que todo lo demás.
    void (async () => {
      const r = await cerrarAnillo();
      if (!esFallo(r) && r.cerrado && r.anillo) {
        useRewards.getState().enqueue([
          { kind: 'anilloUp', anillo: r.anillo, nombre: r.nombre ?? '' },
        ]);
      }
    })();
  }, [resultado, sesionId]);

  const titulo =
    resultado.score >= 100
      ? t('resultadoPerfecto')
      : resultado.aprobada
        ? t('resultadoBien')
        : t('resultadoFlojo');

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-8 pt-10">
        {/* 1 · Pip. La tercera y última aparición de la sesión. */}
        <div className="flex flex-col items-center text-center">
          <Pip size={96} mood={resultado.aprobada ? 'celebrating' : 'happy'} />

          {/* 2 · El puntaje. */}
          <h1 className="mt-3 font-display text-display-l font-extrabold leading-none">
            <CountUp value={resultado.score} format={(n) => `${n}%`} className="tnum" />
          </h1>
          <p className="mt-1 font-display text-h2 font-bold" style={{ color }}>
            {titulo}
          </p>
          <p className="mt-0.5 text-small text-muted-foreground">
            {t('resultadoSub', { aciertos: resultado.correctas, total: resultado.total })}
          </p>
        </div>

        {/* 3 · Lo que se ganó. */}
        <Reveal className="mt-6">
          <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-hairline">
            <div className="bg-surface px-4 py-3 text-center">
              <dd className="font-display text-h2 font-bold text-primary">
                <CountUp value={resultado.xp} format={(n) => `+${n}`} className="tnum" />
              </dd>
              <dt className="mt-0.5 text-caption text-muted-foreground">XP</dt>
            </div>
            <div className="border-l border-hairline bg-surface px-4 py-3 text-center">
              <dd className="flex items-center justify-center gap-1 font-display text-h2 font-bold text-brote-sun">
                <Sprout className="h-5 w-5" aria-hidden />
                <CountUp value={resultado.semillas} format={(n) => `+${n}`} className="tnum" />
              </dd>
              <dt className="mt-0.5 text-caption text-muted-foreground">
                {t('semillas')}
              </dt>
            </div>
          </dl>
          {resultado.racha_sumo ? (
            <p className="mt-2 text-center text-small font-semibold text-brote-sun">
              {t('rachaSigue', { n: resultado.racha })}
            </p>
          ) : null}
        </Reveal>

        {/* 4 · Qué se movió. Hasta cuatro: la lista completa no es un resultado. */}
        {resultado.conceptos.length > 0 ? (
          <Reveal index={1} className="mt-6">
            <h2 className="eyebrow mb-2 text-muted-foreground">{t('seMovio')}</h2>
            <ul className="divide-y divide-hairline border-y border-hairline">
              {resultado.conceptos.slice(0, 4).map((c) => (
                <li key={c.slug} className="py-2.5">
                  <FuerzaMedidor fuerza={c.fuerza} titulo={c.titulo_es} compacto />
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {/* 5 · El gancho de acción, con peso de CTA primario. */}
        {resultado.accion ? (
          <Reveal index={2} className="mt-6">
            <div className="rounded-card border-2 border-primary/30 bg-primary/5 p-4">
              <p className="eyebrow text-primary">{t('accionTitulo')}</p>
              <div className="mt-2 flex items-start gap-3">
                <DomainIcon domain={resultado.accion.domain_slug} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold leading-snug">{resultado.accion.titulo_es}</p>
                  {resultado.accion.short_es ? (
                    <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
                      {resultado.accion.short_es}
                    </p>
                  ) : null}
                  {resultado.accion.equivalencia_es ? (
                    <p className="mt-1 text-caption font-medium text-primary">
                      {resultado.accion.equivalencia_es}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-caption leading-relaxed text-muted-foreground">{t('accionCuerpo')}</p>
              <Button asChild block className="mt-3">
                <Link
                  href={`/acciones/${resultado.accion.slug}`}
                  onClick={() => {
                    if (resultado.accion) void marcarGancho(sesionId, resultado.accion.id, 'tocado');
                    onCerrar();
                  }}
                >
                  {t('accionCta')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
        ) : null}

        {/* 6 · Navegación, al final y sin gritar. */}
        <div className="mt-auto flex flex-col gap-2 pt-8">
          {resultado.tipo === 'hoja' ? (
            <Button asChild variant="secondary" block>
              <Link href={`/aprender/${ramaSlug}`} onClick={onCerrar}>
                {t('otraHoja')}
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" block onClick={onCerrar}>
            {t('volverAlBosque')}
          </Button>
        </div>
      </div>
    </div>
  );
}

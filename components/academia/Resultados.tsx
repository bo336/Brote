'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Flame, History, Play, RotateCcw, Sprout, TreeDeciduous } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
import { ProgressBar } from '@/components/ui/progress';
import { Reveal } from '@/components/ui/reveal';
import { Pip } from '@/components/pip/Pip';
import type { Resultado, Sesion } from '@/lib/academia/modelo';
import { marcarGancho } from '@/lib/api/academia';
import { useEmpezar } from '@/lib/academia/usar-empezar';
import { useJugada } from '@/lib/academia/jugada';
import { getDomainName } from '@/lib/domains';
import { localDate } from '@/lib/utils/dates';
import { useRewards } from '@/stores/rewards';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

/**
 * El cierre de una sesión.
 *
 * EL ORDEN ES LA PANTALLA: Pip, el puntaje, lo que se ganó, cuánto avanzó la
 * unidad (y si la rama creció), el repaso que se hizo sin darse cuenta, y
 * recién ahí el gancho de acción —con peso de CTA primario, porque es lo único
 * de esta pantalla que cambia algo afuera de la app— y la próxima sesión.
 *
 * Si no alcanzó el puntaje para completar la sesión, se dice sin drama y con
 * el camino claro: cuánto hacía falta y un botón para rehacerla (gratis).
 */
export function Resultados({
  resultado: r,
  sesion,
  color,
  onCerrar,
}: {
  resultado: Resultado;
  sesion: Sesion;
  color: string;
  onCerrar: () => void;
}) {
  const t = useTranslations('arbol');
  const quieto = useReducedMotion();
  const yaCelebrado = useRef(false);
  const cerrar = useJugada((s) => s.cerrar);
  const { empezar, arrancando } = useEmpezar();

  // Las celebraciones van por los caminos que ya existen: el toast de puntos y
  // la cola de premios. La Academia no estrena un sistema de festejo propio.
  useEffect(() => {
    if (yaCelebrado.current) return;
    yaCelebrado.current = true;
    if (r.xp > 0) toast.points(r.xp);
    const { profile, applyCompletion } = useSession.getState();
    if (profile) {
      applyCompletion({
        totalXp: profile.totalXp + r.xp,
        streak: r.racha,
        streakDate: r.racha_sumo ? localDate() : undefined,
      });
    }
    const eventos: Parameters<ReturnType<typeof useRewards.getState>['enqueue']>[0] = [];
    if (r.unidad?.completa) {
      eventos.push({
        kind: 'ramaCrece',
        rama: r.unidad.rama_slug === 'tronco' ? t('tronco') : getDomainName(r.unidad.rama_slug),
        unidad: r.unidad.titulo_es,
        ramasAbiertas: r.ramas_abiertas,
      });
    }
    for (const x of (r.nuevos_titulos ?? []) as { name_es?: string; rarity?: string }[]) {
      if (x?.name_es) eventos.push({ kind: 'title', name: x.name_es, rarity: x.rarity ?? 'comun' });
    }
    for (const x of (r.nuevas_insignias ?? []) as { name_es?: string; rarity?: string }[]) {
      if (x?.name_es) eventos.push({ kind: 'badge', name: x.name_es, rarity: x.rarity ?? 'comun' });
    }
    if (eventos.length) useRewards.getState().enqueue(eventos);
    if (r.accion) void marcarGancho(sesion.intento_id, r.accion.id, 'mostrado');
  }, [r, sesion.intento_id, t]);

  const titulo =
    r.score >= 100 ? t('resultadoPerfecto') : r.aprobada ? t('resultadoBien') : r.score >= r.umbral - 15 ? t('resultadoCasi') : t('resultadoFlojo');

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-10 pt-10">
        {/* 1 · Pip y el puntaje */}
        <div className="flex flex-col items-center text-center">
          <Pip size={96} mood={r.aprobada ? 'celebrating' : 'happy'} />
          <h1 className="mt-3 font-display text-hero font-extrabold leading-none">
            <CountUp value={r.score} format={(n) => `${n}%`} className="tnum" />
          </h1>
          <p className="mt-1.5 font-display text-h2 font-bold" style={{ color }}>
            {titulo}
          </p>
          <p className="mt-0.5 text-small text-muted-foreground">{t('resultadoSub', { bien: r.correctas, total: r.total })}</p>
          {!r.aprobada && sesion.leccion ? (
            <p className="mt-2 max-w-sm text-small leading-relaxed">{t('faltoUmbral', { umbral: r.umbral })}</p>
          ) : null}
        </div>

        {/* 2 · Lo que se ganó */}
        <Reveal className="mt-6">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="tnum inline-flex items-center gap-1.5 rounded-pill bg-primary/15 px-3 py-1.5 text-small font-bold text-primary">
              +<CountUp value={r.xp} /> {t('xp')}
            </span>
            {r.semillas > 0 ? (
              <span className="tnum inline-flex items-center gap-1.5 rounded-pill bg-brote-sun/15 px-3 py-1.5 text-small font-bold text-brote-sun">
                <Sprout className="h-4 w-4" aria-hidden />+<CountUp value={r.semillas} /> {t('semillas')}
              </span>
            ) : null}
            {r.racha > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-brote-coral/15 px-3 py-1.5 text-small font-bold text-brote-coral">
                <Flame className="h-4 w-4" aria-hidden />
                {t('rachaDias', { n: r.racha })}
              </span>
            ) : null}
          </div>
        </Reveal>

        {/* 3 · La unidad, y la rama si creció */}
        {r.unidad ? (
          <Reveal index={1} className="mt-6">
            {r.unidad.completa ? (
              <div className="overflow-hidden rounded-card border-2 p-5 text-center" style={{ borderColor: color }}>
                <RamaQueCrece color={color} quieto={!!quieto} />
                <p className="eyebrow mt-2" style={{ color }}>
                  {r.ramas_abiertas ? t('ramasAbiertasEyebrow') : t('unidadCompletaEyebrow')}
                </p>
                <h2 className="mt-1 text-balance font-display text-h1 font-extrabold leading-tight">
                  {r.ramas_abiertas ? t('ramasAbiertasTitulo') : t('ramaCrecioTitulo')}
                </h2>
                <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
                  {r.ramas_abiertas ? t('ramasAbiertasCuerpo') : t('ramaCrecioCuerpo', { unidad: r.unidad.titulo_es })}
                </p>
                {r.unidad_desbloqueada ? (
                  <Button asChild className="mt-4" variant="secondary">
                    <Link href={`/aprender/u/${r.unidad_desbloqueada.slug}`} onClick={() => cerrar()}>
                      {t('seAbrio', { titulo: r.unidad_desbloqueada.titulo_es })}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="rounded-card border border-hairline bg-surface p-4">
                <p className="eyebrow" style={{ color }}>
                  {t('tuUnidad')}
                </p>
                <p className="mt-0.5 font-display text-h3 font-bold leading-snug">{r.unidad.titulo_es}</p>
                <div className="mt-2.5 flex items-center gap-3">
                  <ProgressBar value={r.unidad.total ? r.unidad.hechas / r.unidad.total : 0} color={color} height={8} />
                  <span className="tnum shrink-0 text-caption font-semibold text-muted-foreground">
                    {t('sesionesHechas', { hechas: r.unidad.hechas, total: r.unidad.total })}
                  </span>
                </div>
              </div>
            )}
          </Reveal>
        ) : null}

        {/* 4 · El repaso que se hizo: la memoria espaciada, a la vista */}
        {r.repasados > 0 ? (
          <Reveal index={2} className="mt-4">
            <p className="flex items-start gap-2.5 rounded-card bg-brote-aqua/10 p-3.5 text-small leading-relaxed">
              <History className="mt-0.5 h-4 w-4 shrink-0 text-brote-aqua" aria-hidden />
              {t('repasaste', { n: r.repasados })}
            </p>
          </Reveal>
        ) : null}

        {/* 5 · El gancho: de saber a hacer */}
        {r.accion ? (
          <Reveal index={3} className="mt-6">
            <section className="rounded-card border border-primary/30 bg-primary/[0.06] p-5">
              <p className="eyebrow text-primary">{t('accionEyebrow')}</p>
              <h2 className="mt-1 font-display text-h2 font-bold leading-snug">{r.accion.titulo_es}</h2>
              {r.accion.short_es ? <p className="mt-1 text-small leading-relaxed text-muted-foreground">{r.accion.short_es}</p> : null}
              <Button asChild block size="lg" className="mt-4">
                <Link
                  href={`/acciones/${r.accion.slug}`}
                  onClick={() => {
                    void marcarGancho(sesion.intento_id, r.accion!.id, 'tocado');
                    cerrar();
                  }}
                >
                  {t('accionCta', { puntos: r.accion.base_points })}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </section>
          </Reveal>
        ) : null}

        {/* 6 · Seguir */}
        <div className="mt-6 flex flex-col gap-2">
          {!r.aprobada && sesion.leccion ? (
            <Button block size="lg" variant={r.accion ? 'secondary' : 'primary'} loading={arrancando === sesion.leccion.id} onClick={() => void empezar(sesion.leccion!.id)}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t('rehacerSesion')}
            </Button>
          ) : r.siguiente ? (
            <Button block size="lg" variant={r.accion ? 'secondary' : 'primary'} loading={arrancando === r.siguiente.id} onClick={() => void empezar(r.siguiente!.id)}>
              <Play className="h-4 w-4" aria-hidden fill="currentColor" />
              {t('seguirCon', { titulo: r.siguiente.titulo_es })}
            </Button>
          ) : null}
          <Button block variant="ghost" onClick={onCerrar}>
            <TreeDeciduous className="h-4 w-4" aria-hidden />
            {t('volverAlArbol')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Una rama que crece: la madera se dibuja, la vena de color la sigue y brotan
 * las hojas. Es chica, dura un segundo y medio y existe para una sola cosa:
 * que completar una unidad se VEA como lo que es en el árbol.
 */
function RamaQueCrece({ color, quieto }: { color: string; quieto: boolean }) {
  const hojas = [
    { x: 70, y: 70, r: -30 },
    { x: 110, y: 52, r: 20 },
    { x: 150, y: 40, r: -40 },
    { x: 190, y: 30, r: 30 },
    { x: 226, y: 26, r: -15 },
  ];
  const trazo = 'M 20 104 C 80 90, 140 50, 240 24';
  return (
    <svg viewBox="0 0 260 120" className="mx-auto h-24 w-full max-w-[260px]" aria-hidden>
      <motion.path
        d={trazo}
        fill="none"
        stroke="#6B4D35"
        strokeWidth={10}
        strokeLinecap="round"
        initial={quieto ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d={trazo}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        initial={quieto ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {hojas.map((h, i) => (
        // La posición va en el <g>: framer-motion escribe `transform` como
        // estilo en el elemento que anima, y pisaría un translate puesto ahí.
        <g key={i} transform={`translate(${h.x} ${h.y}) rotate(${h.r})`}>
          <motion.path
            d="M 0 -12 C 8 -7 10 1 0 12 C -10 1 -8 -7 0 -12 Z"
            fill={color}
            stroke="#fff"
            strokeWidth={1}
            initial={quieto ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 380, damping: 16 }}
          />
        </g>
      ))}
    </svg>
  );
}

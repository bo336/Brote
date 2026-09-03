'use client';

/**
 * El bosque, dibujado.
 *
 * SVG inline y nada más: ni WebGL, ni canvas, ni una librería de árboles. Un
 * `<defs>` con la hoja, un `<use>` por gajo, y el navegador hace el resto.
 *
 * Tres decisiones que valen la pena explicar:
 *
 *   1. **El scroll es nativo.** El contenedor tiene `overflow: auto` y adentro
 *      hay un lienzo que mide lo que tiene que medir. Podría haber sido una
 *      transformación sobre un `<g>`, pero entonces habría que reimplementar la
 *      inercia del pulgar, el rebote y la barra de scroll — y en un Android de
 *      gama media eso se nota. El zoom sí es nuestro, porque no hay forma
 *      nativa de hacerlo dentro de un contenedor.
 *   2. **Se recorta lo que no se ve.** Con 105 gajos y el árbol medido en
 *      miles de unidades, dibujar los de la copa mientras se mira la base es
 *      trabajo tirado. Se calcula la ventana visible al hacer scroll y se
 *      filtra. En la práctica se dibujan entre 20 y 40 gajos a la vez.
 *   3. **Un solo gajo es tabulable a la vez.** 105 paradas de tabulador no son
 *      accesibilidad, son un laberinto. Roving tabindex y flechas, que es el
 *      patrón que espera cualquiera que navegue con teclado.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { armarBosque, opacidadAnillo, relleno, PINTA, ANCHO, type GajoUbicado } from '@/lib/academia/bosque';
import type { EstadoGajo, RamaDelArbol } from '@/lib/academia/types';
import { cn } from '@/lib/utils/cn';

/** Una hoja, centrada en el origen y de unas 30 unidades de alto. */
const HOJA = 'M 0 -15 C 10.5 -9 13.5 2 0 15.5 C -13.5 2 -10.5 -9 0 -15 Z';

const ZOOM_MIN = 0.65;
const ZOOM_MAX = 2.6;
/** Margen de recorte, en unidades de viewBox: una pantalla de sobra a cada lado. */
const HOLGURA = 420;

const CLAVE_ESTADO: Record<EstadoGajo, string> = {
  latente: 'estadoLatente',
  disponible: 'estadoDisponible',
  en_curso: 'estadoEnCurso',
  frondoso: 'estadoFrondoso',
  marchito: 'estadoMarchito',
};

interface Props {
  ramas: RamaDelArbol[];
  anillo: number;
  /** El gajo que la pantalla propone: late, y solo él. */
  destacado?: string | null;
  onAbrir: (gajo: GajoUbicado) => void;
  className?: string;
}

export function ArbolBosque({ ramas, anillo, destacado, onAbrir, className }: Props) {
  const t = useTranslations('academia');
  const quieto = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [ventana, setVentana] = useState<[number, number]>([0, Number.POSITIVE_INFINITY]);
  const [foco, setFoco] = useState(0);

  const bosque = useMemo(() => armarBosque(ramas), [ramas]);
  const { alto, orden } = bosque;

  // El árbol se lee de abajo hacia arriba, así que arranca abajo.
  useEffect(() => {
    const el = caja.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [alto]);

  const recalcularVentana = useCallback(() => {
    const el = caja.current;
    if (!el) return;
    const escala = (el.clientWidth * zoom) / ANCHO || 1;
    const y0 = el.scrollTop / escala - HOLGURA;
    const y1 = (el.scrollTop + el.clientHeight) / escala + HOLGURA;
    // Se re-renderiza solo cuando la ventana se movió de verdad: si no, cada
    // fotograma de scroll sería un render del árbol entero.
    setVentana(([a, b]) => (Math.abs(a - y0) < 80 && Math.abs(b - y1) < 80 ? [a, b] : [y0, y1]));
  }, [zoom]);

  useEffect(() => {
    recalcularVentana();
    const el = caja.current;
    if (!el) return;
    let pendiente = 0;
    const alScroll = () => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(() => {
        pendiente = 0;
        recalcularVentana();
      });
    };
    el.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll);
    return () => {
      if (pendiente) cancelAnimationFrame(pendiente);
      el.removeEventListener('scroll', alScroll);
      window.removeEventListener('resize', alScroll);
    };
  }, [recalcularVentana]);

  // ── Zoom: rueda con Ctrl (o pellizco de trackpad) y pellizco de dos dedos ──

  const aplicarZoom = useCallback((siguiente: number, anclaY?: number) => {
    const el = caja.current;
    setZoom((previo) => {
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, siguiente));
      if (el && z !== previo) {
        // Lo que estaba bajo el ancla se queda donde estaba.
        const y = anclaY ?? el.clientHeight / 2;
        const antes = (el.scrollTop + y) / previo;
        requestAnimationFrame(() => {
          el.scrollTop = antes * z - y;
        });
      }
      return z;
    });
  }, []);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const alRodar = (e: WheelEvent) => {
      // Sin Ctrl es scroll, y el scroll es del sistema.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      aplicarZoom(zoom * (1 - e.deltaY * 0.0018), e.clientY - el.getBoundingClientRect().top);
    };
    el.addEventListener('wheel', alRodar, { passive: false });
    return () => el.removeEventListener('wheel', alRodar);
  }, [aplicarZoom, zoom]);

  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ dist: number; zoom: number } | null>(null);

  const distanciaEntreDedos = () => {
    const [a, b] = [...dedos.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const alBajarDedo = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.current.size === 2) pellizco.current = { dist: distanciaEntreDedos(), zoom };
  };

  const alMoverDedo = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || !dedos.current.has(e.pointerId)) return;
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = pellizco.current;
    if (!p || dedos.current.size !== 2) return;
    const d = distanciaEntreDedos();
    if (d > 0 && p.dist > 0) aplicarZoom(p.zoom * (d / p.dist));
  };

  const alSoltarDedo = (e: React.PointerEvent) => {
    dedos.current.delete(e.pointerId);
    if (dedos.current.size < 2) pellizco.current = null;
  };

  // ── Teclado ───────────────────────────────────────────────────────────────

  const irA = useCallback(
    (i: number) => {
      const n = orden.length;
      if (!n) return;
      const k = ((i % n) + n) % n;
      const g = orden[k];
      if (!g) return;
      setFoco(k);
      const el = caja.current;
      if (el) {
        const escala = (el.clientWidth * zoom) / ANCHO || 1;
        el.scrollTo({ top: g.y * escala - el.clientHeight / 2, behavior: quieto ? 'auto' : 'smooth' });
      }
      // El nodo puede no existir hasta que el recorte lo deje entrar.
      requestAnimationFrame(() => {
        caja.current?.querySelector<SVGElement>(`[data-gajo="${g.gajo.slug}"]`)?.focus();
      });
    },
    [orden, quieto, zoom],
  );

  const alTeclear = (e: React.KeyboardEvent) => {
    // El bosque crece hacia arriba: "el siguiente" está más arriba en pantalla.
    const salto: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };
    if (e.key in salto) {
      e.preventDefault();
      irA(foco + salto[e.key]!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      irA(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      irA(orden.length - 1);
    }
  };

  const gajoFoco = orden[foco];
  const gajoDestacado = destacado ? orden.find((g) => g.gajo.slug === destacado) : undefined;
  const enVentana = (y: number) => y >= ventana[0] && y <= ventana[1];

  return (
    <div
      ref={caja}
      className={cn(
        'relative overflow-auto overscroll-contain rounded-card border border-hairline bg-surface-2',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ touchAction: 'pan-x pan-y' }}
      onPointerDown={alBajarDedo}
      onPointerMove={alMoverDedo}
      onPointerUp={alSoltarDedo}
      onPointerCancel={alSoltarDedo}
      onKeyDown={alTeclear}
    >
      <div style={{ width: `${zoom * 100}%`, aspectRatio: `${ANCHO} / ${alto}` }}>
        <svg
          viewBox={`0 0 ${ANCHO} ${alto}`}
          width="100%"
          height="100%"
          role="group"
          aria-label={t('arbolEtiqueta', { ramas: bosque.ramas.length, gajos: orden.length })}
          aria-describedby="bosque-ayuda"
        >
          <defs>
            <path id="ac-hoja" d={HOJA} />
            <linearGradient id="ac-tronco" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#5C4632" />
              <stop offset="100%" stopColor="#836647" />
            </linearGradient>
          </defs>

          <path d={bosque.tronco} fill="url(#ac-tronco)" />

          {bosque.ramas.map((r) => {
            const visibles = r.gajos.filter((g) => enVentana(g.y));
            const dibujarRama = r.d !== '' && visibles.length > 0;
            return (
              <g key={r.rama.slug}>
                {dibujarRama ? (
                  <>
                    <path d={r.d} fill={r.color} opacity={0.82} />
                    <text
                      x={r.etiqueta.x}
                      y={r.etiqueta.y}
                      textAnchor={r.anclaEtiqueta}
                      fill={r.color}
                      fontSize={24}
                      fontWeight={700}
                      className="pointer-events-none select-none"
                    >
                      {r.rama.nombre_es}
                    </text>
                  </>
                ) : null}
                {visibles.map((g) => {
                  const pinta = PINTA[g.gajo.estado];
                  return (
                    <use
                      key={g.gajo.slug}
                      href="#ac-hoja"
                      data-gajo={g.gajo.slug}
                      transform={`translate(${g.x} ${g.y}) rotate(${g.angulo + pinta.caida}) scale(${
                        (g.r / 16) * pinta.escala
                      })`}
                      fill={g.color}
                      fillOpacity={relleno(g.gajo.estado, g.gajo.progreso)}
                      stroke={g.color}
                      strokeWidth={pinta.grosorBorde}
                      opacity={pinta.opacidad * opacidadAnillo(g.gajo.anillo, anillo)}
                      role="button"
                      tabIndex={gajoFoco?.gajo.slug === g.gajo.slug ? 0 : -1}
                      aria-label={
                        `${g.gajo.titulo_es}. ${g.ramaNombre}. ${t(CLAVE_ESTADO[g.gajo.estado])}` +
                        // Un gajo latente sin decir QUÉ falta es una puerta cerrada
                        // sin cartel. El dato ya viene en el árbol.
                        (g.gajo.estado === 'latente' && g.gajo.falta
                          ? `. ${t('bloqueada', { concepto: g.gajo.falta })}`
                          : '')
                      }
                      className="cursor-pointer outline-none hover:brightness-110 active:brightness-90"
                      onClick={() => {
                        setFoco(orden.indexOf(g));
                        onAbrir(g);
                      }}
                      onFocus={() => setFoco(orden.indexOf(g))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onAbrir(g);
                        }
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* El aro de foco es un nodo aparte: el contorno del navegador sobre
              un <use> es inconsistente entre motores, y sin foco visible esto
              no se puede usar con teclado. */}
          {gajoFoco && enVentana(gajoFoco.y) ? (
            <circle
              cx={gajoFoco.x}
              cy={gajoFoco.y}
              r={gajoFoco.r * 1.8}
              fill="none"
              stroke="rgb(var(--ring))"
              strokeWidth={3}
              opacity={0.9}
              className="pointer-events-none"
            />
          ) : null}

          {/* El gajo propuesto late. Uno solo, y quieto si así lo pidieron. */}
          {gajoDestacado && enVentana(gajoDestacado.y) ? (
            <motion.circle
              cx={gajoDestacado.x}
              cy={gajoDestacado.y}
              r={gajoDestacado.r * 1.5}
              fill="none"
              stroke={gajoDestacado.color}
              strokeWidth={3}
              className="pointer-events-none"
              initial={false}
              animate={quieto ? { opacity: 0.6 } : { scale: [1, 1.45, 1], opacity: [0.75, 0, 0.75] }}
              transition={quieto ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              style={{ transformOrigin: `${gajoDestacado.x}px ${gajoDestacado.y}px` }}
            />
          ) : null}
        </svg>
      </div>
      <p id="bosque-ayuda" className="sr-only">
        {t('arbolAyuda')}
      </p>
    </div>
  );
}

'use client';

/**
 * El Árbol, dibujado.
 *
 * SVG inline: ni WebGL ni canvas ni una librería de árboles. La geometría sale
 * de `lib/academia/geometria.ts` y acá solo se pinta.
 *
 * Decisiones que vale la pena explicar:
 *
 *   1. **Es grande a propósito.** Ochenta y pico de unidades con sus sesiones
 *      no entran legibles en una pantalla de teléfono, y achicarlas hasta que
 *      entren las vuelve ilegibles. Así que el árbol mide lo que tiene que
 *      medir y se recorre: arrastrando, con dos dedos, con la rueda, o con los
 *      botones. Arranca encuadrado en la próxima sesión, con "Ver todo" a un
 *      toque para la vista general.
 *   2. **El scroll es nativo.** El contenedor tiene `overflow: auto` y adentro
 *      hay un lienzo del tamaño del árbol. La inercia del pulgar, el rebote y
 *      el rendimiento en un Android de gama media los pone el sistema. El
 *      zoom sí es propio, anclado al punto donde se hace.
 *   3. **Nada se re-renderiza al hacer scroll.** Ni un setState en el camino
 *      caliente: el árbol entero son unos mil nodos estáticos y el navegador
 *      los desplaza sin tocar React.
 *   4. **Un solo nodo tabulable a la vez** (roving tabindex con flechas):
 *      ochenta paradas de Tab no son accesibilidad, son un laberinto. La lista
 *      de ramas debajo del árbol es la alternativa completa sin dibujo.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'framer-motion';
import { Check, Droplets, LocateFixed, Lock, Maximize2, Minus, Play, Plus } from 'lucide-react';
import { armarArbol, PILDORA, type NodoUbicado } from '@/lib/academia/geometria';
import type { RamaDelMapa, Siguiente } from '@/lib/academia/modelo';
import { getDomainColor } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';

/** Una hoja, centrada en el origen, de unas 20 unidades de largo. */
const HOJA = 'M 0 -10 C 7 -6 9 1 0 10.5 C -9 1 -7 -6 0 -10 Z';
const COLOR_TRONCO = '#1FB57A';
const ZOOM_MAX = 1.7;

/** ¿Texto claro u oscuro sobre este color? Por luminancia relativa (WCAG). */
function tintaSobre(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  // Contraste contra blanco vs. contra la tinta de la marca: gana el mayor.
  const contraBlanco = 1.05 / (L + 0.05);
  const contraTinta = (L + 0.05) / 0.0131;
  return contraBlanco >= contraTinta ? '#FFFFFF' : '#0C1A13';
}

const colorDe = (slug: string) => (slug === 'tronco' ? COLOR_TRONCO : getDomainColor(slug));

interface Props {
  ramas: RamaDelMapa[];
  siguiente: Siguiente | null;
  /** Unidades que se completaron desde la última visita: brotan con animación. */
  recienCompletas?: Set<string>;
  onElegir: (nodo: NodoUbicado) => void;
  className?: string;
}

export function Arbol({ ramas, siguiente, recienCompletas, onElegir, className }: Props) {
  const t = useTranslations('arbol');
  const quieto = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  const arbol = useMemo(() => armarArbol(ramas, colorDe), [ramas]);
  const { ancho, alto, orden } = arbol;

  const [zoom, setZoom] = useState(0.85);
  const [zoomMin, setZoomMin] = useState(0.2);
  const [foco, setFoco] = useState(0);
  const [listo, setListo] = useState(false);

  const destacado = siguiente ? orden.find((n) => n.unidad.id === siguiente.unidad.id) : undefined;

  // ── Encuadre ──────────────────────────────────────────────────────────────

  /** Centra un punto del árbol en la ventana, con el zoom dado. */
  const centrarEn = useCallback(
    (x: number, y: number, z: number, suave: boolean) => {
      const el = caja.current;
      if (!el) return;
      el.scrollTo({
        left: x * z - el.clientWidth / 2,
        top: y * z - el.clientHeight / 2,
        behavior: suave && !quieto ? 'smooth' : 'auto',
      });
    },
    [quieto],
  );

  // El zoom mínimo es el que hace entrar el árbol entero.
  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => {
      const zm = Math.min(el.clientWidth / ancho, el.clientHeight / alto);
      setZoomMin(Math.max(0.08, Math.min(0.6, zm)));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ancho, alto]);

  // Arranca encuadrado en la próxima sesión (o en la base del tronco). Se
  // hace una sola vez: si el mapa se refresca mientras alguien está mirando
  // otra rama, arrancarlo de ahí sería un robo de scroll.
  const encuadrado = useRef(false);
  useLayoutEffect(() => {
    if (encuadrado.current) return;
    const el = caja.current;
    if (!el) return;
    const z = el.clientWidth < 640 ? 0.8 : 0.9;
    setZoom(z);
    const objetivo = destacado ?? arbol.troncoNodos[0] ?? orden[0];
    requestAnimationFrame(() => {
      if (objetivo) centrarEn(objetivo.x, objetivo.y - 60, z, false);
      else centrarEn(ancho / 2, alto / 2, z, false);
      encuadrado.current = true;
      setListo(true);
    });
  }, [destacado, arbol.troncoNodos, orden, ancho, alto, centrarEn]);

  const aplicarZoom = useCallback(
    (siguienteZoom: number, ancla?: { x: number; y: number }) => {
      const el = caja.current;
      if (!el) return;
      setZoom((previo) => {
        const z = Math.min(ZOOM_MAX, Math.max(zoomMin, siguienteZoom));
        if (z !== previo) {
          // Lo que estaba bajo el ancla se queda donde estaba.
          const ax = ancla?.x ?? el.clientWidth / 2;
          const ay = ancla?.y ?? el.clientHeight / 2;
          const px = (el.scrollLeft + ax) / previo;
          const py = (el.scrollTop + ay) / previo;
          requestAnimationFrame(() => {
            el.scrollLeft = px * z - ax;
            el.scrollTop = py * z - ay;
          });
        }
        return z;
      });
    },
    [zoomMin],
  );

  const verTodo = () => {
    setZoom(zoomMin);
    requestAnimationFrame(() => centrarEn(ancho / 2, alto / 2, zoomMin, false));
  };

  const irAMiLugar = () => {
    const objetivo = destacado ?? arbol.troncoNodos[0];
    if (!objetivo) return;
    const z = Math.max(zoom, 0.8);
    setZoom(z);
    requestAnimationFrame(() => centrarEn(objetivo.x, objetivo.y - 60, z, true));
  };

  // ── Rueda con Ctrl, pellizco y arrastre con mouse ─────────────────────────

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const alRodar = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // sin Ctrl es scroll, y el scroll es del sistema
      e.preventDefault();
      const r = el.getBoundingClientRect();
      aplicarZoom(zoom * (1 - e.deltaY * 0.0022), { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener('wheel', alRodar, { passive: false });
    return () => el.removeEventListener('wheel', alRodar);
  }, [aplicarZoom, zoom]);

  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ dist: number; zoom: number } | null>(null);
  const arrastre = useRef<{ x: number; y: number; sl: number; st: number; movio: boolean } | null>(null);

  const alBajar = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (dedos.current.size === 2) {
        const [a, b] = [...dedos.current.values()];
        pellizco.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom };
      }
      return;
    }
    // Mouse: arrastrar el fondo mueve el árbol, como un mapa.
    if (e.button !== 0 || (e.target as Element).closest('[data-nodo]')) return;
    const el = caja.current;
    if (!el) return;
    arrastre.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop, movio: false };
  };

  const alMover = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      if (!dedos.current.has(e.pointerId)) return;
      dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = pellizco.current;
      if (!p || dedos.current.size !== 2) return;
      const [a, b] = [...dedos.current.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const el = caja.current;
      if (d > 0 && p.dist > 0 && el) {
        const r = el.getBoundingClientRect();
        aplicarZoom(p.zoom * (d / p.dist), { x: (a!.x + b!.x) / 2 - r.left, y: (a!.y + b!.y) / 2 - r.top });
      }
      return;
    }
    const a = arrastre.current;
    const el = caja.current;
    if (!a || !el) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) a.movio = true;
    el.scrollLeft = a.sl - dx;
    el.scrollTop = a.st - dy;
  };

  const alSoltar = (e: React.PointerEvent) => {
    dedos.current.delete(e.pointerId);
    if (dedos.current.size < 2) pellizco.current = null;
    arrastre.current = null;
  };

  // ── Teclado ───────────────────────────────────────────────────────────────

  const irA = useCallback(
    (i: number) => {
      const n = orden.length;
      if (!n) return;
      const k = ((i % n) + n) % n;
      const nodo = orden[k]!;
      setFoco(k);
      centrarEn(nodo.x, nodo.y, zoom, true);
      requestAnimationFrame(() => {
        caja.current?.querySelector<SVGGElement>(`[data-nodo="${nodo.unidad.slug}"]`)?.focus({ preventScroll: true });
      });
    },
    [orden, centrarEn, zoom],
  );

  const alTeclear = (e: React.KeyboardEvent) => {
    const salto: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in salto) {
      e.preventDefault();
      irA(foco + salto[e.key]!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      irA(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      irA(orden.length - 1);
    } else if (e.key === '+' || e.key === '=') {
      aplicarZoom(zoom * 1.2);
    } else if (e.key === '-') {
      aplicarZoom(zoom / 1.2);
    }
  };

  const etiquetaEstado = (n: NodoUbicado) => {
    const u = n.unidad;
    const base = `${u.titulo_es}. ${n.ramaNombre}, ${t('unidadN', { n: u.orden })}. ${t(`estado_${u.estado}`)}. ${t('sesionesHechas', { hechas: u.hechas, total: u.total })}`;
    return base;
  };

  const animarBrotes = !quieto && listo;

  return (
    <div className={cn('relative overflow-hidden rounded-card border border-hairline', className)}>
      <div
        ref={caja}
        className={cn(
          'arbol-cielo h-full w-full overflow-auto overscroll-contain',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'cursor-grab active:cursor-grabbing',
        )}
        style={{ touchAction: 'pan-x pan-y' }}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onPointerLeave={alSoltar}
        onKeyDown={alTeclear}
      >
        <div style={{ width: ancho * zoom, height: alto * zoom }} className={cn('transition-opacity duration-300', listo ? 'opacity-100' : 'opacity-0')}>
          <svg
            viewBox={`0 0 ${ancho} ${alto}`}
            width={ancho * zoom}
            height={alto * zoom}
            role="group"
            aria-label={t('arbolEtiqueta', { unidades: orden.length })}
            aria-describedby="arbol-ayuda"
            className="select-none"
          >
            <defs>
              <path id="ab-hoja" d={HOJA} />
              <linearGradient id="ab-tronco" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4A3526" />
                <stop offset="45%" stopColor="#7A5A3F" />
                <stop offset="100%" stopColor="#5A412E" />
              </linearGradient>
              <radialGradient id="ab-copa0" cx="45%" cy="40%" r="65%">
                <stop offset="0%" stopColor="#2F8A55" />
                <stop offset="100%" stopColor="#1C6B41" />
              </radialGradient>
              <radialGradient id="ab-copa1" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#4DB372" />
                <stop offset="100%" stopColor="#2E8E57" />
              </radialGradient>
              <radialGradient id="ab-copa2" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#8BD89A" />
                <stop offset="100%" stopColor="#4FB673" />
              </radialGradient>
              <radialGradient id="ab-sombra" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <pattern id="ab-textura" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
                <use href="#ab-hoja" transform="translate(12 14) scale(0.55)" fill="#0E4D2C" opacity="0.22" />
                <use href="#ab-hoja" transform="translate(34 34) rotate(70) scale(0.5)" fill="#9BE3AC" opacity="0.18" />
              </pattern>
            </defs>

            {/* Suelo */}
            <ellipse cx={arbol.centroX} cy={arbol.suelo + 22} rx={900} ry={80} fill="url(#ab-sombra)" />
            {/* Una loma, no una franja: los bordes rectos se leían como un recorte. */}
            <path
              d={`M ${arbol.centroX - 1100} ${arbol.suelo + 110} C ${arbol.centroX - 700} ${arbol.suelo + 10}, ${arbol.centroX - 300} ${arbol.suelo - 30}, ${arbol.centroX} ${arbol.suelo - 30} C ${arbol.centroX + 300} ${arbol.suelo - 30}, ${arbol.centroX + 700} ${arbol.suelo + 10}, ${arbol.centroX + 1100} ${arbol.suelo + 110} Z`}
              className="arbol-pasto"
            />

            {/* Raíces y tronco */}
            {arbol.raices.map((d, i) => (
              <path key={i} d={d} fill="#5A412E" />
            ))}
            <path d={arbol.tronco} fill="url(#ab-tronco)" />
            {arbol.corteza.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#3A2A1E" strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
            ))}

            {/* La copa: primero todas las sombras, después los cuerpos y arriba
                las luces. Así cada grumo tiene volumen y la copa no es una
                mancha plana. */}
            {[0, 1, 2].map((capa) => (
              <g key={capa} opacity={capa === 2 ? 0.8 : 1}>
                {arbol.copa
                  .filter((c) => c.capa === capa)
                  .map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={`url(#ab-copa${capa})`} />
                  ))}
              </g>
            ))}
            <g opacity={0.7}>
              {arbol.copa
                .filter((c) => c.capa === 1)
                .map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={c.r * 0.97} fill="url(#ab-textura)" />
                ))}
            </g>

            {/* Madera de las ramas */}
            {arbol.ramas.map((r) => (
              <path key={r.slug} d={r.madera} fill="#6B4D35" stroke="#4A3526" strokeWidth={2} strokeOpacity={0.5} />
            ))}

            {/* La vena de color: viva hasta donde se llegó, punteada lo que falta */}
            {arbol.ramas.map((r) => (
              <g key={r.slug} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={r.futuro} stroke={r.color} strokeOpacity={0.55} strokeWidth={4} strokeDasharray="2 12" />
                {r.vivo ? (
                  <path
                    d={r.vivo}
                    stroke={r.color}
                    strokeWidth={9}
                    className="arbol-vena"
                    style={
                      animarBrotes
                        ? ({ strokeDasharray: r.largoVivo, ['--largo' as string]: r.largoVivo } as React.CSSProperties)
                        : undefined
                    }
                  />
                ) : null}
              </g>
            ))}

            {/* Brotes: lo ya aprendido llena la copa */}
            {arbol.brotes.map((b, i) => (
              <use
                key={i}
                href="#ab-hoja"
                transform={`translate(${b.x} ${b.y}) rotate(${b.rot}) scale(${b.escala})`}
                fill={b.color}
                stroke="#FFFFFF"
                strokeOpacity={0.5}
                strokeWidth={1}
              />
            ))}

            {/* Carteles con el nombre de cada rama, en la punta */}
            {arbol.ramas.map((r) => (
              <g key={r.slug} transform={`translate(${r.cartel.x} ${r.cartel.y})`} className="pointer-events-none">
                <rect x={-r.cartel.w / 2} y={-19} width={r.cartel.w} height={38} rx={19} className="arbol-cartel" stroke={r.color} strokeWidth={2.5} />
                <text textAnchor="middle" y={6} fontSize={17} fontWeight={800} fill={r.color} className="font-display">
                  {r.nombre}
                </text>
              </g>
            ))}

            {/* Las unidades */}
            {orden.map((n, i) => (
              <Pildora
                key={n.unidad.slug}
                nodo={n}
                enfocable={i === foco}
                destacada={n === destacado}
                brota={!!recienCompletas?.has(n.unidad.slug) && animarBrotes}
                etiqueta={etiquetaEstado(n)}
                eyebrow={n.ramaSlug === 'tronco' ? t('troncoN', { n: n.unidad.orden }) : t('unidadNCorta', { n: n.unidad.orden, nivel: t(`nivel_${n.unidad.nivel}`) })}
                seguiAca={t('seguiAca')}
                onFoco={() => setFoco(i)}
                onElegir={() => onElegir(n)}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Controles */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
        <div className="pointer-events-auto hidden items-center gap-3 rounded-pill border border-hairline bg-surface/90 px-3 py-1.5 text-caption text-muted-foreground shadow-soft backdrop-blur sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
            {t('leyendaHecha')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" aria-hidden />
            {t('leyendaAbierta')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" aria-hidden />
            {t('leyendaCerrada')}
          </span>
        </div>
        <div className="pointer-events-auto ml-auto flex items-center gap-1 rounded-pill border border-hairline bg-surface/90 p-1 shadow-soft backdrop-blur">
          <BotonControl etiqueta={t('alejar')} onClick={() => aplicarZoom(zoom / 1.25)} disabled={zoom <= zoomMin + 0.001}>
            <Minus className="h-4 w-4" aria-hidden />
          </BotonControl>
          <BotonControl etiqueta={t('acercar')} onClick={() => aplicarZoom(zoom * 1.25)} disabled={zoom >= ZOOM_MAX - 0.001}>
            <Plus className="h-4 w-4" aria-hidden />
          </BotonControl>
          <BotonControl etiqueta={t('verTodo')} onClick={verTodo}>
            <Maximize2 className="h-4 w-4" aria-hidden />
          </BotonControl>
          <BotonControl etiqueta={t('miLugar')} onClick={irAMiLugar}>
            <LocateFixed className="h-4 w-4" aria-hidden />
          </BotonControl>
        </div>
      </div>

      <p id="arbol-ayuda" className="sr-only">
        {t('arbolAyuda')}
      </p>
    </div>
  );
}

function BotonControl({
  etiqueta,
  onClick,
  disabled,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-[background-color,transform,opacity] duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

// ── Una píldora ──────────────────────────────────────────────────────────────

function Pildora({
  nodo,
  enfocable,
  destacada,
  brota,
  etiqueta,
  eyebrow,
  seguiAca,
  onFoco,
  onElegir,
}: {
  nodo: NodoUbicado;
  enfocable: boolean;
  destacada: boolean;
  brota: boolean;
  etiqueta: string;
  eyebrow: string;
  seguiAca: string;
  onFoco: () => void;
  onElegir: () => void;
}) {
  const { unidad: u, color } = nodo;
  const { w, h } = PILDORA;
  const estado = u.estado;
  const hecha = estado === 'completa' || estado === 'repasar';
  const cerrada = estado === 'bloqueada';
  const tinta = hecha ? tintaSobre(color) : undefined;
  const lineas = nodo.lineas;
  const avance = u.total > 0 ? u.hechas / u.total : 0;

  // Geometría interna de la píldora.
  const bx = -w / 2 + 35; // centro del botón de estado
  const tx = -w / 2 + 64; // inicio del texto
  const arco = 2 * Math.PI * 23;

  return (
    <g
      data-nodo={u.slug}
      transform={`translate(${nodo.x} ${nodo.y})`}
      role="button"
      tabIndex={enfocable ? 0 : -1}
      aria-label={etiqueta}
      onFocus={onFoco}
      onClick={onElegir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onElegir();
        }
      }}
      className={cn('arbol-nodo cursor-pointer outline-none', brota && 'arbol-brota')}
    >
      {destacada ? (
        <>
          <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={(h + 20) / 2} fill="none" stroke={color} strokeWidth={4} className="arbol-halo" />
          <g transform={`translate(0 ${-h / 2 - 30})`}>
            <rect x={-54} y={-15} width={108} height={30} rx={15} fill={color} />
            <text textAnchor="middle" y={5.5} fontSize={14} fontWeight={800} fill={tintaSobre(color)} className="font-display">
              {seguiAca}
            </text>
            <path d="M -7 14 L 0 22 L 7 14 Z" fill={color} />
          </g>
        </>
      ) : null}

      {/* Sombra de contacto y cuerpo */}
      <rect x={-w / 2} y={-h / 2 + 5} width={w} height={h} rx={h / 2} fill="#0C1A13" opacity={0.16} />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={hecha ? color : undefined}
        className={cn(!hecha && (cerrada ? 'arbol-pildora-cerrada' : 'arbol-pildora'))}
        stroke={cerrada ? undefined : estado === 'repasar' ? '#FFB23E' : color}
        strokeWidth={cerrada ? 0 : estado === 'repasar' ? 4 : 3.5}
      />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="none" className="arbol-foco" />

      {/* El botón de estado */}
      <circle cx={bx} cy={0} r={20} fill={hecha ? '#FFFFFF' : cerrada ? 'rgba(128,128,128,0.25)' : color} opacity={hecha ? 0.95 : 1} />
      {estado === 'en_curso' ? (
        <circle
          cx={bx}
          cy={0}
          r={23}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeDasharray={`${arco * avance} ${arco}`}
          transform={`rotate(-90 ${bx} 0)`}
          strokeLinecap="round"
        />
      ) : null}
      <g transform={`translate(${bx - 9} -9)`} className="pointer-events-none">
        {estado === 'completa' ? (
          <Check width={18} height={18} color={color} strokeWidth={3} />
        ) : estado === 'repasar' ? (
          <Droplets width={18} height={18} color="#D9A441" strokeWidth={2.6} />
        ) : cerrada ? (
          <Lock width={18} height={18} className="arbol-candado" strokeWidth={2.4} />
        ) : (
          <Play width={18} height={18} color={tintaSobre(color)} fill={tintaSobre(color)} strokeWidth={2} />
        )}
      </g>

      {/* Texto */}
      <text
        x={tx}
        y={lineas.length > 1 ? -h / 2 + 21 : -h / 2 + 25}
        fontSize={10}
        fontWeight={700}
        letterSpacing={0.7}
        fill={tinta}
        className={cn('uppercase', !tinta && (cerrada ? 'arbol-texto-cerrado' : 'arbol-eyebrow'))}
        opacity={0.85}
      >
        {eyebrow}
      </text>
      {lineas.map((l, i) => (
        <text
          key={i}
          x={tx}
          y={(lineas.length > 1 ? -h / 2 + 40 : -h / 2 + 46) + i * 18}
          fontSize={15.5}
          fontWeight={700}
          fill={tinta}
          className={cn('font-display', !tinta && (cerrada ? 'arbol-texto-cerrado' : 'arbol-texto'))}
        >
          {l}
        </text>
      ))}

      {/* Las sesiones, como hojitas colgando */}
      {nodo.hojas.map((hoja, i) => {
        const l = u.lecciones[i];
        const hechaL = l?.estado === 'completa';
        const abierta = l?.estado === 'disponible';
        return (
          <use
            key={i}
            href="#ab-hoja"
            transform={`translate(${hoja.x} ${hoja.y}) rotate(${hoja.rot}) scale(${l?.tipo === 'desafio' ? 0.95 : 0.72})`}
            fill={hechaL ? color : abierta ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
            stroke={hechaL ? '#FFFFFF' : color}
            strokeWidth={hechaL ? 1.2 : 2}
            strokeOpacity={cerrada ? 0.5 : 1}
            className="pointer-events-none"
          />
        );
      })}
    </g>
  );
}

/**
 * La geometría del Árbol: dónde va el tronco, cada rama, cada unidad y cada
 * hoja de sesión.
 *
 * Matemática pura: sin React y sin DOM. El componente la recalcula solo cuando
 * cambia el mapa, y el layout se puede mirar y discutir sin abrir el SVG.
 *
 * LA FORMA. Un árbol de copa ancha —un ombú, no un pino—: un tronco grueso,
 * una horqueta, y de ahí las ramas se abren en abanico, salen hacia los
 * costados y después suben. Cada rama sube por su propia columna, y las
 * unidades se apilan sobre ella de la base a la punta. Las columnas forman una
 * cúpula (las del centro arrancan más arriba, las de los costados más abajo),
 * que es la silueta de la copa. Las unidades básicas e intermedias quedan
 * dentro del follaje; las avanzadas asoman por encima, en zarcillos finos, con
 * el nombre de la rama en la punta. La forma misma cuenta el recorrido: lo que
 * ya creció está adentro de la copa, lo que falta asoma afuera esperando.
 *
 * POR QUÉ COLUMNAS Y NO UN ABANICO LIBRE. La primera versión ubicaba cada
 * unidad sobre un rayo y relajaba las superposiciones con física. Con 80+
 * píldoras el resultado era un revoltijo: las ramas se cruzaban y no se podía
 * seguir ninguna con la vista (medido en captura, 2026-09-22). Con columnas
 * ordenadas y curvas que se anidan, nada se pisa por construcción y cada rama
 * se lee de abajo hacia arriba como un camino.
 *
 * Coordenadas: SVG, y crece hacia abajo. El árbol crece hacia arriba.
 */

import type { RamaDelMapa, UnidadDelMapa } from '@/lib/academia/modelo';

// ── Medidas ──────────────────────────────────────────────────────────────────

export const PILDORA = { w: 214, h: 68 } as const;
/** Separación horizontal entre columnas de rama. */
const COLUMNA = 244;
/** Separación vertical entre unidades de una misma rama. */
const PASO = 128;
/** Cuánto más abajo arrancan las columnas de los costados que las del centro. */
const CUPULA = 560;
/** Altura de la base de la columna central sobre la horqueta. */
const BASE_CENTRO = 330;
const ALTO_TRONCO = 900;
const MARGEN = 190;
const SEP_HOJAS = 19;

// ── Tipos de salida ──────────────────────────────────────────────────────────

export interface Punto {
  x: number;
  y: number;
}

export interface HojaSesion extends Punto {
  /** Grados. */
  rot: number;
}

export interface NodoUbicado {
  unidad: UnidadDelMapa;
  ramaSlug: string;
  ramaNombre: string;
  color: string;
  /** Centro de la píldora. */
  x: number;
  y: number;
  lineas: string[];
  /** Las sesiones, como hojitas bajo la píldora (relativas al centro). */
  hojas: HojaSesion[];
  /** Asoma por afuera de la copa (unidades avanzadas). */
  afuera: boolean;
}

export interface RamaUbicada {
  slug: string;
  nombre: string;
  color: string;
  /** Contorno relleno de la madera, afinándose hacia la punta. */
  madera: string;
  /** La vena de color ya viva: hasta la última unidad abierta. */
  vivo: string;
  /** El resto, punteado: lo que todavía no creció. */
  futuro: string;
  /** Largo aproximado del tramo vivo, para animar su crecimiento. */
  largoVivo: number;
  nodos: NodoUbicado[];
  /** El cartel con el nombre de la rama, en la punta. */
  cartel: Punto & { w: number };
}

export interface Brote extends Punto {
  rot: number;
  escala: number;
  color: string;
}

export interface Copa extends Punto {
  r: number;
  /** 0 sombra · 1 cuerpo · 2 luz. */
  capa: 0 | 1 | 2;
}

export interface ArbolUbicado {
  ancho: number;
  alto: number;
  suelo: number;
  centroX: number;
  tronco: string;
  corteza: string[];
  raices: string[];
  copa: Copa[];
  ramas: RamaUbicada[];
  troncoNodos: NodoUbicado[];
  /** Hojitas decorativas sobre lo ya aprendido: la copa se llena al avanzar. */
  brotes: Brote[];
  /** Todas las unidades, en orden de lectura (tronco primero, después ramas). */
  orden: NodoUbicado[];
}

// ── Azar determinístico ──────────────────────────────────────────────────────

/** Un número entre 0 y 1 que depende solo de la semilla: el árbol no baila entre renders. */
function azar(semilla: string, n = 0): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967295;
}

// ── Texto ────────────────────────────────────────────────────────────────────

/**
 * Parte un título en hasta dos renglones que entren en la píldora. Ancho de
 * letra estimado para Bricolage 15,5 px en negrita: no hay DOM para medir, y
 * un estimado prudente con puntos suspensivos es mejor que texto cortado.
 */
export function partirTitulo(t: string, porRenglon = 19): string[] {
  const palabras = t.split(/\s+/);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (prueba.length <= porRenglon || !actual) actual = prueba;
    else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= 2) return lineas;
  const segunda = lineas.slice(1).join(' ');
  return [lineas[0]!, segunda.length > porRenglon ? `${segunda.slice(0, porRenglon - 1).trimEnd()}…` : segunda];
}

// ── Curvas ───────────────────────────────────────────────────────────────────

function bezier(p0: Punto, p1: Punto, p2: Punto, p3: Punto, n: number): Punto[] {
  const out: Punto[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return out;
}

/** Catmull-Rom muestreada: una curva suave que pasa por todos los puntos. */
function spline(ps: Punto[], porTramo = 10): Punto[] {
  if (ps.length < 2) return ps.slice();
  const out: Punto[] = [];
  const ext = [ps[0]!, ...ps, ps[ps.length - 1]!];
  for (let i = 1; i < ext.length - 2; i++) {
    const p0 = ext[i - 1]!, p1 = ext[i]!, p2 = ext[i + 1]!, p3 = ext[i + 2]!;
    for (let k = 0; k < porTramo; k++) {
      const t = k / porTramo;
      const t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(ps[ps.length - 1]!);
  return out;
}

function largo(ps: Punto[]): number {
  let l = 0;
  for (let i = 1; i < ps.length; i++) l += Math.hypot(ps[i]!.x - ps[i - 1]!.x, ps[i]!.y - ps[i - 1]!.y);
  return l;
}

const f = (n: number) => Math.round(n * 10) / 10;

function polilinea(ps: Punto[]): string {
  if (!ps.length) return '';
  return `M ${f(ps[0]!.x)} ${f(ps[0]!.y)} ` + ps.slice(1).map((p) => `L ${f(p.x)} ${f(p.y)}`).join(' ');
}

/**
 * Un contorno relleno que se afina a lo largo de la curva. Una rama de ancho
 * fijo se lee como un cable; una que se afina, como madera.
 */
function afinado(ps: Punto[], anchoDe: (t: number) => number): string {
  if (ps.length < 2) return '';
  const izq: Punto[] = [];
  const der: Punto[] = [];
  const n = ps.length;
  for (let i = 0; i < n; i++) {
    const a = ps[Math.max(0, i - 1)]!;
    const b = ps[Math.min(n - 1, i + 1)]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    const w = anchoDe(i / (n - 1)) / 2;
    izq.push({ x: ps[i]!.x + (-dy / l) * w, y: ps[i]!.y + (dx / l) * w });
    der.push({ x: ps[i]!.x - (-dy / l) * w, y: ps[i]!.y - (dx / l) * w });
  }
  const punta = ps[n - 1]!;
  const previo = ps[n - 2]!;
  return (
    polilinea(izq) +
    ` Q ${f(punta.x + (punta.x - previo.x) * 0.4)} ${f(punta.y + (punta.y - previo.y) * 0.4)} ${f(der[n - 1]!.x)} ${f(der[n - 1]!.y)} ` +
    der
      .slice(0, -1)
      .reverse()
      .map((p) => `L ${f(p.x)} ${f(p.y)}`)
      .join(' ') +
    ' Z'
  );
}

// ── El layout ────────────────────────────────────────────────────────────────

export function armarArbol(ramas: RamaDelMapa[], colorDe: (slug: string) => string): ArbolUbicado {
  const tronco = ramas.find((r) => r.es_tronco);
  const laterales = ramas
    .filter((r) => !r.es_tronco && r.unidades.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  // La horqueta está en (0, 0) y todo se corre al final para que entre.
  const horqueta: Punto = { x: 0, y: 0 };
  const suelo = ALTO_TRONCO;
  const n = laterales.length;
  const centro = (n - 1) / 2;

  const hojasDe = (u: UnidadDelMapa): HojaSesion[] => {
    const k = u.lecciones.length;
    const ancho = (k - 1) * SEP_HOJAS;
    return u.lecciones.map((_, i) => {
      const t = k === 1 ? 0 : i / (k - 1) - 0.5;
      return {
        x: -ancho / 2 + i * SEP_HOJAS,
        // Un arco suave, como hojas colgando de una ramita.
        y: PILDORA.h / 2 + 15 - Math.pow(t * 2, 2) * 4,
        rot: -35 + t * 50 + (azar(u.slug, i) - 0.5) * 16,
      };
    });
  };

  const ramasUbicadas: RamaUbicada[] = laterales.map((rama, i) => {
    const color = colorDe(rama.slug);
    // Posición en la cúpula: −1 en el borde izquierdo, 0 al centro, +1 a la derecha.
    const u = n === 1 ? 0 : (i - centro) / centro;
    const x = (i - centro) * COLUMNA;
    // Las columnas vecinas se escalonan medio paso: si no, las píldoras de
    // columnas contiguas quedan en fila y la copa se lee como una tabla.
    const escalon = i % 2 === 1 ? PASO * 0.48 : 0;
    const base = -BASE_CENTRO + CUPULA * u * u + escalon;

    const nodos: NodoUbicado[] = rama.unidades.map((unidad, k) => {
      // Un vaivén chico de izquierda a derecha: una rama de verdad no sube a plomo.
      const vaiven = Math.sin(k * 1.3 + i) * 14;
      return {
        unidad,
        ramaSlug: rama.slug,
        ramaNombre: rama.nombre_es,
        color,
        x: x + vaiven,
        y: base - k * PASO,
        lineas: partirTitulo(unidad.titulo_es),
        hojas: hojasDe(unidad),
        afuera: unidad.nivel >= 3,
      };
    });

    // El recorrido: de la horqueta sale hacia su columna y la sube. La curva
    // de aproximación entra a la columna desde abajo y en vertical, así las
    // ramas se anidan sin cruzarse.
    const pie: Punto = { x, y: base + 118 };
    const aproximacion = bezier(
      horqueta,
      { x: x * 0.3, y: -40 - 90 * (1 - Math.abs(u)) },
      { x: x * 0.95, y: pie.y + 180 + 60 * Math.abs(u) },
      pie,
      26,
    );
    const ultimo = nodos[nodos.length - 1]!;
    const cartel: Punto & { w: number } = {
      x: ultimo.x,
      y: ultimo.y - PASO * 0.95,
      w: Math.max(118, rama.nombre_es.length * 9.8 + 40),
    };
    const columna = spline([pie, ...nodos.map((nd) => ({ x: nd.x, y: nd.y })), { x: cartel.x, y: cartel.y + 22 }], 10);
    const recorrido = [...aproximacion, ...columna.slice(1)];

    // Madera: gruesa en la horqueta, un brazo firme hasta la columna, y
    // afinándose hasta volverse zarcillo en las unidades avanzadas.
    const nA = aproximacion.length;
    const anchoDe = (t: number) => {
      const idx = t * (recorrido.length - 1);
      if (idx <= nA) return 54 - (idx / nA) * 30; // 54 → 24
      const s = (idx - nA) / Math.max(1, recorrido.length - 1 - nA);
      return 24 - s * 20; // 24 → 4
    };
    const madera = afinado(recorrido, anchoDe);

    // ¿Hasta dónde está viva? Hasta la última unidad que no está bloqueada.
    let ultimaViva = -1;
    nodos.forEach((nd, k) => {
      if (nd.unidad.estado !== 'bloqueada') ultimaViva = k;
    });
    // La vena arranca a un tercio del brazo: trece venas de colores saliendo
    // del mismo punto de la horqueta eran un arco iris ilegible.
    const desde = Math.floor(nA * 0.34);
    const corte = ultimaViva < 0 ? desde : nA - 1 + (ultimaViva + 1) * 10;
    const vivoPts = ultimaViva < 0 ? [] : recorrido.slice(desde, corte + 1);
    const futuroPts = recorrido.slice(Math.max(desde, corte));

    return {
      slug: rama.slug,
      nombre: rama.nombre_es,
      color,
      madera,
      vivo: vivoPts.length > 1 ? polilinea(vivoPts) : '',
      futuro: polilinea(futuroPts),
      largoVivo: largo(vivoPts),
      nodos,
      cartel,
    };
  });

  // ── Tronco: sus unidades se apilan sobre la madera, de la raíz a la horqueta.
  const nt = tronco?.unidades.length ?? 0;
  const troncoNodos: NodoUbicado[] = (tronco?.unidades ?? []).map((unidad, i) => ({
    unidad,
    ramaSlug: 'tronco',
    ramaNombre: tronco!.nombre_es,
    color: colorDe('tronco'),
    x: 0,
    y: suelo - 150 - i * ((ALTO_TRONCO - 330) / Math.max(1, nt - 1)),
    lineas: partirTitulo(unidad.titulo_es),
    hojas: hojasDe(unidad),
    afuera: false,
  }));

  // ── La copa. Grumos de follaje alrededor de lo básico y lo intermedio, con
  // una sombra abajo y una luz arriba a la izquierda: sin volumen, la copa es
  // una mancha plana. Lo avanzado queda afuera, asomando.
  const copa: Copa[] = [];
  const grumo = (x: number, y: number, r: number, s: string) => {
    copa.push({ x: x + r * 0.08, y: y + r * 0.14, r: r * 1.02, capa: 0 });
    copa.push({ x, y, r, capa: 1 });
    copa.push({ x: x - r * 0.22, y: y - r * 0.26, r: r * 0.62 * (0.85 + azar(s, 1) * 0.3), capa: 2 });
  };
  ramasUbicadas.forEach((r) => {
    const dentro = r.nodos.filter((nd) => !nd.afuera);
    dentro.forEach((nd, k) => {
      const s = `${nd.unidad.slug}`;
      // El grumo de la unidad más alta de la copa baja y se achica: si no,
      // el follaje tapa la primera unidad avanzada, que tiene que asomar.
      const tope = k === dentro.length - 1;
      const r0 = tope ? 112 + azar(s, 4) * 20 : 138 + azar(s, 4) * 40;
      grumo(nd.x + (azar(s, 2) - 0.5) * 70, nd.y + (tope ? 48 : 14) + (azar(s, 3) - 0.5) * 30, r0, s);
      if (k === 0) grumo(nd.x + (azar(s, 5) - 0.5) * 90, nd.y + 150, 150 + azar(s, 6) * 30, `${s}b`);
    });
  });
  // Relleno entre la horqueta y las columnas, para que la copa sea una sola.
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : (i - centro) / centro;
    const x = (i - centro) * COLUMNA;
    grumo(x * 0.6, -BASE_CENTRO * 0.4 + CUPULA * 0.55 * u * u + 90, 190, `relleno${i}`);
  }
  if (!n && nt) grumo(0, -200, 260, 'solo-tronco');

  // ── Brotes: hojitas nuevas donde ya se aprendió. La copa se llena al avanzar.
  const brotes: Brote[] = [];
  for (const r of ramasUbicadas) {
    for (const nd of r.nodos) {
      if (nd.unidad.estado !== 'completa' && nd.unidad.estado !== 'repasar') continue;
      for (let k = 0; k < 8; k++) {
        const ang = azar(nd.unidad.slug, 20 + k) * Math.PI * 2;
        const dist = 124 + azar(nd.unidad.slug, 40 + k) * 30;
        brotes.push({
          x: nd.x + Math.cos(ang) * dist,
          y: nd.y + Math.sin(ang) * dist * 0.62,
          rot: azar(nd.unidad.slug, 60 + k) * 360,
          escala: 0.85 + azar(nd.unidad.slug, 80 + k) * 0.6,
          color: nd.unidad.estado === 'repasar' ? '#D9A441' : r.color,
        });
      }
    }
  }

  // ── Tronco, corteza y raíces
  const aB = 150; // media base
  const aA = 92; // media arriba
  const troncoD = [
    `M ${-aB - 70} ${suelo + 8}`,
    `C ${-aB + 6} ${suelo - 20}, ${-aB + 20} ${suelo - 170}, ${-aA - 8} ${suelo * 0.42}`,
    `C ${-aA} ${suelo * 0.22}, ${-120} ${60}, ${-190} ${-40}`,
    `L ${-60} ${-10}`,
    `Q 0 ${-70}, ${60} ${-10}`,
    `L ${190} ${-40}`,
    `C ${120} ${60}, ${aA} ${suelo * 0.22}, ${aA + 8} ${suelo * 0.42}`,
    `C ${aB - 20} ${suelo - 170}, ${aB - 6} ${suelo - 20}, ${aB + 70} ${suelo + 8}`,
    'Z',
  ].join(' ');

  const corteza: string[] = [];
  for (let i = 0; i < 9; i++) {
    const x = -80 + i * 20 + (azar('corteza', i) - 0.5) * 8;
    const y0 = suelo - 40 - azar('corteza', 10 + i) * 80;
    const y1 = suelo * 0.2 + azar('corteza', 20 + i) * 160;
    const curva = (azar('corteza', 30 + i) - 0.5) * 34;
    corteza.push(`M ${f(x)} ${f(y0)} C ${f(x + curva)} ${f((y0 * 2 + y1) / 3)}, ${f(x - curva)} ${f((y0 + y1 * 2) / 3)}, ${f(x * 0.75)} ${f(y1)}`);
  }

  const raices: string[] = [];
  for (let i = 0; i < 8; i++) {
    const lado = i < 4 ? -1 : 1;
    const j = i % 4;
    const x0 = lado * (40 + j * 28);
    const x1 = lado * (230 + j * 150 + azar('raiz', i) * 70);
    const y1 = suelo + 34 + j * 22 + azar('raiz', 10 + i) * 18;
    raices.push(
      `M ${f(x0)} ${f(suelo - 14)} Q ${f((x0 + x1) / 2)} ${f(suelo + 2)}, ${f(x1)} ${f(y1)} ` +
        `L ${f(x1 + lado * 5)} ${f(y1 + 3)} Q ${f((x0 + x1) / 2 + lado * 12)} ${f(suelo + 22)}, ${f(x0 + lado * 30)} ${f(suelo - 6)} Z`,
    );
  }

  // ── Encuadre: todo se corre para que entre con margen.
  const xs: number[] = [];
  const ys: number[] = [];
  const meter = (x: number, y: number, mw = 0, mh = 0) => {
    xs.push(x - mw, x + mw);
    ys.push(y - mh, y + mh);
  };
  for (const r of ramasUbicadas) {
    for (const nd of r.nodos) meter(nd.x, nd.y, PILDORA.w / 2, PILDORA.h / 2 + 30);
    meter(r.cartel.x, r.cartel.y, r.cartel.w / 2, 24);
  }
  for (const c of copa) meter(c.x, c.y, c.r, c.r);
  for (const nd of troncoNodos) meter(nd.x, nd.y, PILDORA.w / 2, PILDORA.h / 2);
  meter(0, suelo + 130, 820, 10);

  const minX = Math.min(...xs) - MARGEN;
  const maxX = Math.max(...xs) + MARGEN;
  const minY = Math.min(...ys) - MARGEN * 0.6;
  const maxY = Math.max(...ys) + MARGEN * 0.4;
  const dx = -minX;
  const dy = -minY;

  const mover = (d: string) =>
    d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a: string, b: string) => `${f(Number(a) + dx)} ${f(Number(b) + dy)}`);
  const moverNodo = (nd: NodoUbicado): NodoUbicado => ({ ...nd, x: nd.x + dx, y: nd.y + dy });

  const ramasFinal = ramasUbicadas.map((r) => ({
    ...r,
    madera: mover(r.madera),
    vivo: mover(r.vivo),
    futuro: mover(r.futuro),
    nodos: r.nodos.map(moverNodo),
    cartel: { ...r.cartel, x: r.cartel.x + dx, y: r.cartel.y + dy },
  }));
  const troncoFinal = troncoNodos.map(moverNodo);

  return {
    ancho: Math.round(maxX - minX),
    alto: Math.round(maxY - minY),
    suelo: suelo + dy,
    centroX: dx,
    tronco: mover(troncoD),
    corteza: corteza.map(mover),
    raices: raices.map(mover),
    copa: copa.map((c) => ({ ...c, x: c.x + dx, y: c.y + dy })),
    ramas: ramasFinal,
    troncoNodos: troncoFinal,
    brotes: brotes.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
    orden: [...troncoFinal, ...ramasFinal.flatMap((r) => r.nodos)],
  };
}

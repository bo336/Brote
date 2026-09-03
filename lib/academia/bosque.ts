/**
 * La geometría del bosque: dónde va cada rama y cada gajo.
 *
 * Es matemática pura, sin React y sin DOM, por dos razones. Una: el árbol es la
 * pantalla identitaria de la sección y su layout tiene que poder mirarse,
 * discutirse y corregirse sin abrir un componente de 300 líneas. Dos: el
 * componente recalcula el layout solo cuando cambia el árbol, y para eso el
 * cálculo tiene que ser una función de sus argumentos y nada más.
 *
 * Sistema de coordenadas: SVG, con la y creciendo hacia ABAJO. El árbol crece
 * hacia arriba, así que la base del tronco está en `alto` y la copa en y chicas.
 * Todo se expresa en unidades de viewBox (ancho fijo 1000) y el zoom es cosa de
 * la pantalla, no de acá.
 */

import { getDomainColor } from '@/lib/domains';
import type { EstadoGajo, GajoDelArbol, RamaDelArbol } from '@/lib/academia/types';

export const ANCHO = 1000;
/** Media caña del tronco en la base. Se afina hacia arriba. */
const TRONCO_BASE = 46;
const TRONCO_COPA = 16;
const CX = ANCHO / 2;

/** Aire debajo de la primera rama y encima de la última. */
const PIE = 150;
const CIELO = 190;
/** Separación vertical entre inserciones de rama. */
const PASO = 178;

export interface Punto {
  x: number;
  y: number;
}

export interface GajoUbicado {
  gajo: GajoDelArbol;
  /** Centro del gajo, en unidades de viewBox. */
  x: number;
  y: number;
  /** Radio base antes de que el estado lo modifique. */
  r: number;
  /** Inclinación en grados: sigue la tangente de la rama. */
  angulo: number;
  color: string;
  ramaSlug: string;
  ramaNombre: string;
}

export interface RamaUbicada {
  rama: RamaDelArbol;
  color: string;
  /** −1 izquierda, +1 derecha. El tronco es 0. */
  lado: -1 | 0 | 1;
  /** Contorno relleno de la rama. Vacío en el tronco: el tronco se dibuja aparte. */
  d: string;
  /** Ancho de la rama donde nace, por si algo necesita medirla. */
  grosor: number;
  /** Dónde poner el nombre de la rama. */
  etiqueta: Punto;
  /** `start` o `end`, según el lado. */
  anclaEtiqueta: 'start' | 'end';
  gajos: GajoUbicado[];
}

export interface Bosque {
  alto: number;
  /** `d` del tronco, de la base a la copa. */
  tronco: string;
  ramas: RamaUbicada[];
  /** Todos los gajos en orden de recorrido por teclado. */
  orden: GajoUbicado[];
}

// ── Bézier cúbica ────────────────────────────────────────────────────────────

type Cubica = [Punto, Punto, Punto, Punto];

function enT([p0, p1, p2, p3]: Cubica, t: number): Punto {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function tangenteEnT([p0, p1, p2, p3]: Cubica, t: number): Punto {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

// ── El tronco ────────────────────────────────────────────────────────────────

/**
 * Media caña del tronco a una altura dada.
 *
 * MEDIDO: con un afinamiento suave el tronco salía como un tablón parado —
 * 46 unidades abajo y 16 arriba repartidas en 2.600 de alto no se leen como
 * cónicas. El exponente alto concentra el ensanchamiento en el tercio inferior,
 * que es donde un árbol de verdad tiene la panza, y el último tramo agrega el
 * ensanche de la raíz.
 */
function medioTronco(y: number, alto: number, yCopa: number): number {
  const largo = Math.max(1, alto - yCopa);
  const t = Math.min(1, Math.max(0, (alto - y) / largo)); // 0 en la base, 1 en la copa
  const base = TRONCO_COPA + (TRONCO_BASE - TRONCO_COPA) * Math.pow(1 - t, 2.6);
  // Raíz: solo en el 6 % más bajo, y creciendo rápido.
  const raiz = t < 0.06 ? Math.pow(1 - t / 0.06, 2) * 26 : 0;
  return base + raiz;
}

/** Dónde termina el tronco: un poco más arriba que la rama más alta. */
function copaDe(alto: number, laterales: number): number {
  return alto - PIE - Math.max(0, laterales - 1) * PASO - 160;
}

/** El contorno cerrado del tronco, subiendo por la derecha y bajando por la izquierda. */
function troncoPath(alto: number, yCopa: number): string {
  const pasos = 22;
  const der: string[] = [];
  const izq: string[] = [];
  for (let i = 0; i <= pasos; i++) {
    const y = alto - ((alto - yCopa) * i) / pasos;
    const w = medioTronco(y, alto, yCopa);
    // Una ondulación mínima: un tronco perfectamente recto se lee como columna.
    const sesgo = Math.sin((i / pasos) * Math.PI * 1.4) * 9;
    const n = (v: number) => Math.round(v * 10) / 10;
    der.push(`${n(CX + w + sesgo)} ${n(y)}`);
    izq.push(`${n(CX - w + sesgo)} ${n(y)}`);
  }
  izq.reverse();
  return `M ${der.join(' L ')} L ${izq.join(' L ')} Z`;
}

/**
 * El contorno de una rama: gruesa donde nace, fina en la punta.
 *
 * Un `<path>` con `stroke-width` fijo da una rama de ancho constante, que es un
 * cable. Esto muestrea la curva y la engrosa a lo largo de su normal, así que
 * sale UN nodo con la forma correcta en vez de un trazo uniforme.
 */
function ramaPath(curva: Cubica, grueso: number, fino: number): string {
  const pasos = 16;
  const arriba: string[] = [];
  const abajo: string[] = [];
  const n = (v: number) => Math.round(v * 10) / 10;
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const p = enT(curva, t);
    const tg = tangenteEnT(curva, t);
    const largo = Math.hypot(tg.x, tg.y) || 1;
    const w = (grueso + (fino - grueso) * Math.pow(t, 0.7)) / 2;
    const nx = (-tg.y / largo) * w;
    const ny = (tg.x / largo) * w;
    arriba.push(`${n(p.x + nx)} ${n(p.y + ny)}`);
    abajo.push(`${n(p.x - nx)} ${n(p.y - ny)}`);
  }
  abajo.reverse();
  return `M ${arriba.join(' L ')} L ${abajo.join(' L ')} Z`;
}

// ── El layout ────────────────────────────────────────────────────────────────

/**
 * El alcance de cada rama. Se alterna corto/largo para que las puntas no queden
 * todas alineadas en dos columnas: un árbol real no es simétrico.
 */
const ALCANCES = [318, 392, 344, 418, 300, 370, 406];

function ordenarGajos(gajos: GajoDelArbol[]): GajoDelArbol[] {
  // Los anillos crecen hacia afuera: lo básico nace pegado al tronco.
  return [...gajos].sort((a, b) => a.anillo - b.anillo || a.slug.localeCompare(b.slug));
}

export function armarBosque(ramas: RamaDelArbol[]): Bosque {
  const tronco = ramas.find((r) => r.es_tronco) ?? null;
  const laterales = ramas.filter((r) => !r.es_tronco).sort((a, b) => a.sort_order - b.sort_order);

  const alto = PIE + CIELO + Math.max(1, laterales.length) * PASO;
  const yCopa = copaDe(alto, laterales.length);
  const ubicadas: RamaUbicada[] = [];

  // El tronco primero: sus gajos van sobre el fuste, no sobre una rama.
  if (tronco) {
    const gajos = ordenarGajos(tronco.gajos);
    const yBase = alto - PIE * 0.55;
    const yTope = alto - PIE * 0.55 - Math.max(1, gajos.length - 1) * 46;
    const ubicados: GajoUbicado[] = gajos.map((g, i) => {
      const y = gajos.length === 1 ? yBase : yBase - ((yBase - yTope) * i) / (gajos.length - 1);
      const lado = i % 2 === 0 ? -1 : 1;
      return {
        gajo: g,
        x: CX + lado * (medioTronco(y, alto, yCopa) + 26),
        y,
        r: 17,
        angulo: lado * -14,
        color: '#1FB57A',
        ramaSlug: tronco.slug,
        ramaNombre: tronco.nombre_es,
      };
    });
    ubicadas.push({
      rama: tronco,
      color: '#1FB57A',
      lado: 0,
      d: '',
      grosor: 0,
      etiqueta: { x: CX, y: alto - 34 },
      anclaEtiqueta: 'start',
      gajos: ubicados,
    });
  }

  laterales.forEach((rama, i) => {
    const lado: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const yNace = alto - PIE - i * PASO;
    const alcance = ALCANCES[i % ALCANCES.length] ?? 360;
    const elevacion = 132 + (i % 3) * 26;
    const x0 = CX + lado * (medioTronco(yNace, alto, yCopa) - 8);

    const curva: Cubica = [
      { x: x0, y: yNace },
      { x: CX + lado * (alcance * 0.36), y: yNace - elevacion * 0.08 },
      { x: CX + lado * (alcance * 0.78), y: yNace - elevacion * 0.72 },
      { x: CX + lado * alcance, y: yNace - elevacion },
    ];

    const gajos = ordenarGajos(rama.gajos);
    const n = gajos.length;
    const ubicados: GajoUbicado[] = gajos.map((g, k) => {
      // Los gajos ocupan del 32 % de la rama hacia afuera: el arranque queda
      // libre para que se lea de dónde nace.
      const t = n === 1 ? 0.72 : 0.32 + (0.66 * k) / (n - 1);
      const p = enT(curva, t);
      const tg = tangenteEnT(curva, t);
      const largo = Math.hypot(tg.x, tg.y) || 1;
      // Normal a la rama: los gajos brotan a los costados, alternando.
      const nx = -tg.y / largo;
      const ny = tg.x / largo;
      const signo = k % 2 === 0 ? 1 : -1;
      const sep = 21 + (k % 3) * 8;
      return {
        gajo: g,
        x: p.x + nx * sep * signo,
        y: p.y + ny * sep * signo,
        r: 16,
        angulo: (Math.atan2(tg.y, tg.x) * 180) / Math.PI + (signo > 0 ? -18 : 18),
        color: getDomainColor(rama.slug),
        ramaSlug: rama.slug,
        ramaNombre: rama.nombre_es,
      };
    });

    const punta = enT(curva, 1);
    // MEDIDO: con la etiqueta anclada hacia AFUERA de la punta, "Consumo
    // Responsable" y "Animales y Vida Silvestre" se salían del lienzo de 1000
    // y quedaban cortadas. El nombre se lee ahora hacia ADENTRO, arrancando en
    // la punta y volviendo hacia el tronco, que además es la dirección en la
    // que se lee el árbol.
    ubicadas.push({
      rama,
      color: getDomainColor(rama.slug),
      lado,
      d: ramaPath(curva, 26, 6),
      grosor: 26,
      etiqueta: { x: punta.x - lado * 6, y: punta.y - 30 },
      anclaEtiqueta: lado === -1 ? 'start' : 'end',
      gajos: ubicados,
    });
  });

  return {
    alto,
    tronco: troncoPath(alto, yCopa),
    ramas: ubicadas,
    orden: ubicadas.flatMap((r) => r.gajos),
  };
}

// ── Cómo se pinta cada estado ────────────────────────────────────────────────

export interface PintaGajo {
  /** Multiplica el radio base. */
  escala: number;
  opacidad: number;
  relleno: number;
  grosorBorde: number;
  /** Grados extra: los marchitos cuelgan. */
  caida: number;
}

/**
 * Los cinco estados, cada uno distinto sin depender del color — un gajo latente
 * y uno frondoso se distinguen en escala de grises y con daltonismo.
 */
export const PINTA: Record<EstadoGajo, PintaGajo> = {
  latente: { escala: 0.62, opacidad: 0.3, relleno: 0, grosorBorde: 1.6, caida: 0 },
  disponible: { escala: 1, opacidad: 1, relleno: 0, grosorBorde: 3, caida: 0 },
  en_curso: { escala: 1, opacidad: 1, relleno: -1, grosorBorde: 3, caida: 0 },
  frondoso: { escala: 1.16, opacidad: 1, relleno: 1, grosorBorde: 0, caida: 0 },
  marchito: { escala: 0.86, opacidad: 0.72, relleno: 0.28, grosorBorde: 2, caida: 26 },
};

/** `relleno: -1` significa "la fracción real": es la fuerza del gajo. */
export function relleno(estado: EstadoGajo, progreso: number): number {
  const p = PINTA[estado].relleno;
  return p === -1 ? Math.max(0.12, Math.min(1, progreso)) : p;
}

/**
 * Los anillos que todavía no tocan se ven, pero apagados: el bosque entero
 * tiene que estar a la vista desde el primer día, o no es un mapa.
 */
export function opacidadAnillo(anilloGajo: number, anilloActual: number): number {
  if (anilloGajo <= anilloActual) return 1;
  return anilloGajo === anilloActual + 1 ? 0.55 : 0.28;
}

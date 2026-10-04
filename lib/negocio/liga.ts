/**
 * La Liga de empresas — el espejo en TypeScript de `brote_liga_puntaje` (0121).
 *
 * La base es la que puntúa; esto existe para dos cosas: explicarle a una
 * empresa con números de verdad cómo se arma su puntaje, y que un test pueda
 * probar la propiedad que importa — **el tamaño no entra** — sin una base.
 * `lib/negocio/__tests__/liga.test.ts` compara estas constantes con el SQL.
 *
 * Por qué así. Una planta de doscientas personas reduce más kilos que un bar
 * de tres en cualquier escala absoluta; si la liga midiera kilos, ganaría
 * siempre la más grande. Acá cada empresa compite contra su PROPIO plan:
 *
 *   logros      cuánto de lo que se propuso cumplió, con evidencia aprobada,
 *               pesado por la ambición del objetivo. Cuentan los 4 mejores:
 *               un equipo grande no gana por cantidad.
 *   constancia  qué tan seguido reporta avances (semanas con algo / semanas).
 *   avance      qué parte de los pasos de sus objetivos en curso ya hizo.
 */

export const LIGA = {
  porLogro: 150,
  maxLogros: 4,
  topeLogros: 600,
  topeConstancia: 250,
  topeAvance: 150,
  peso: { logrado: 1, logrado_parcial: 0.5 },
  ambicion: { basico: 1, intermedio: 1.2, avanzado: 1.5 },
} as const;

export type Ambicion = keyof typeof LIGA.ambicion;

export interface CierreLiga {
  estado: 'logrado' | 'logrado_parcial';
  ambicion: Ambicion;
  /** Aprobado por un revisor. Un cierre sin aprobar no suma. */
  aprobado: boolean;
}

export interface EnCursoLiga {
  pasos: number;
  hechos: number;
}

export interface EntradaLiga {
  cierres: CierreLiga[];
  enCurso: EnCursoLiga[];
  semanas: number;
  semanasActivas: number;
}

export interface PuntajeCalculado {
  logros: number;
  constancia: number;
  avance: number;
  total: number;
}

export function puntajeLiga(e: EntradaLiga): PuntajeCalculado {
  const pts = e.cierres
    .filter((c) => c.aprobado)
    .map((c) => LIGA.porLogro * LIGA.peso[c.estado] * LIGA.ambicion[c.ambicion])
    .sort((a, b) => b - a)
    .slice(0, LIGA.maxLogros);
  const logros = Math.round(Math.min(LIGA.topeLogros, pts.reduce((s, x) => s + x, 0)));

  const semanas = Math.max(1, e.semanas);
  const constancia = Math.round(LIGA.topeConstancia * Math.min(1, e.semanasActivas / semanas));

  const fr = e.enCurso.map((g) => Math.min(1, g.hechos / Math.max(1, g.pasos)));
  const avance = Math.round(LIGA.topeAvance * (fr.length ? fr.reduce((s, x) => s + x, 0) / fr.length : 0));

  return { logros, constancia, avance, total: logros + constancia + avance };
}

export const TOPE_TOTAL = LIGA.topeLogros + LIGA.topeConstancia + LIGA.topeAvance;

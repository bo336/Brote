/**
 * Los rangos por período (LANZAMIENTO F7, 0133).
 *
 * ESPEJO de la tabla `rangos` y de `brote_rango_requisitos` /
 * `brote_rango_decidir` en `0133_rangos.sql`. Decide la base; esto sirve para
 * explicar en pantalla y para los tests (`lib/rangos/__tests__`), que leen la
 * migración y comparan.
 *
 * No confundir con el NIVEL (`lib/ranks.ts`): Semilla → Gaia, por puntos de
 * por vida, mueve el mundo y nunca baja. El rango dice qué tipo de persona que
 * cuida el ambiente fuiste en el último período.
 */

export type ClaveRequisito = 'dias' | 'acciones' | 'temas' | 'medidas' | 'comunidad' | 'aprendizaje';
export type Requisitos = Partial<Record<ClaveRequisito, number>>;

export interface Rango {
  tier: number;
  slug: string;
  nombre: string;
  descripcion: string;
  color: string;
  /** Por semana. */
  requisitos: Requisitos;
  /** Rango que hay que haber tenido el período anterior. */
  previo: number | null;
}

export const RANGOS: Rango[] = [
  { tier: 1, slug: 'aprendiz', nombre: 'Aprendiz', descripcion: 'Empieza a mirar su huella y prueba sus primeras acciones.', color: '#A38B6D', requisitos: {}, previo: null },
  { tier: 2, slug: 'practicante', nombre: 'Practicante', descripcion: 'Hace algo por el ambiente varias veces por semana.', color: '#9CC93B', requisitos: { dias: 2, acciones: 3 }, previo: null },
  { tier: 3, slug: 'ambientalista', nombre: 'Ambientalista', descripcion: 'Cuidar ya es parte de su semana, en varios temas.', color: '#3CB371', requisitos: { dias: 4, acciones: 8, temas: 3, medidas: 1 }, previo: null },
  { tier: 4, slug: 'referente', nombre: 'Referente', descripcion: 'Su forma de vivir se nota y se mide.', color: '#1FB57A', requisitos: { dias: 5, acciones: 12, temas: 4, medidas: 3, aprendizaje: 1 }, previo: null },
  { tier: 5, slug: 'agente', nombre: 'Agente de cambio', descripcion: 'Mueve a otros, no sólo a sí.', color: '#2DB4D4', requisitos: { dias: 6, acciones: 16, temas: 5, medidas: 5, comunidad: 1, aprendizaje: 1 }, previo: null },
  { tier: 6, slug: 'guia', nombre: 'Guía', descripcion: 'Sostiene a su comunidad, período tras período.', color: '#5B6CF0', requisitos: { dias: 6, acciones: 20, temas: 6, medidas: 7, comunidad: 2, aprendizaje: 2 }, previo: 5 },
  { tier: 7, slug: 'faro', nombre: 'Faro', descripcion: 'Lo más alto de Brote, y hay que sostenerlo.', color: '#FFB23E', requisitos: { dias: 7, acciones: 25, temas: 7, medidas: 10, comunidad: 3, aprendizaje: 3 }, previo: 6 },
];

export const RANGO_POR_TIER: Record<number, Rango> = Object.fromEntries(RANGOS.map((r) => [r.tier, r]));

export const ETIQUETA_REQUISITO: Record<ClaveRequisito, { corta: string; larga: string }> = {
  dias: { corta: 'días', larga: 'días con al menos una acción' },
  acciones: { corta: 'acciones', larga: 'acciones (cuentan hasta 6 por día)' },
  temas: { corta: 'temas', larga: 'temas distintos' },
  medidas: { corta: 'con impacto', larga: 'acciones con agua, CO₂, residuos o energía medidos' },
  comunidad: { corta: 'comunidad', larga: 'días con algo para la comunidad (proyecto, Plaza o un regalo en un mundo)' },
  aprendizaje: { corta: 'Academia', larga: 'sesiones de la Academia aprobadas' },
};

export const ORDEN_REQUISITOS: ClaveRequisito[] = ['dias', 'acciones', 'temas', 'medidas', 'comunidad', 'aprendizaje'];

/** Lo que pide un rango en un período de `dias` días (espejo de `brote_rango_requisitos`). */
export function requisitosPara(req: Requisitos, dias: number): Requisitos {
  const out: Requisitos = {};
  for (const k of Object.keys(req) as ClaveRequisito[]) {
    const v = req[k] ?? 0;
    out[k] =
      k === 'dias'
        ? Math.min(Math.ceil((v * dias) / 7), dias)
        : k === 'temas'
          ? Math.min(Math.ceil(v * Math.min(1, dias / 7)), 13)
          : Math.ceil((v * dias) / 7);
  }
  return out;
}

/** Cierre de período (espejo de `brote_rango_decidir`). */
export function decidir(previo: number, calificado: number, margenUsado: boolean): { nuevo: number; resultado: 'sube' | 'mantiene' | 'margen' | 'baja'; margenUsado: boolean } {
  if (calificado > previo) return { nuevo: calificado, resultado: 'sube', margenUsado: false };
  if (calificado === previo) return { nuevo: previo, resultado: 'mantiene', margenUsado: false };
  if (calificado === previo - 1 && !margenUsado) return { nuevo: previo, resultado: 'margen', margenUsado: true };
  return { nuevo: Math.max(calificado, previo - 2, 1), resultado: 'baja', margenUsado: false };
}

/** Cuánto falta de cada requisito (0 si ya se cumple). */
export function faltantes(req: Requisitos, metricas: Partial<Record<ClaveRequisito, number>>): Requisitos {
  const out: Requisitos = {};
  for (const k of Object.keys(req) as ClaveRequisito[]) out[k] = Math.max(0, (req[k] ?? 0) - (metricas[k] ?? 0));
  return out;
}

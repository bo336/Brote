/**
 * Las ligas de la semana (0142).
 *
 * ESPEJO de la tabla `rangos` y de `brote_liga_decidir`. Decide la base; esto
 * sirve para explicar en pantalla y para los tests (`lib/ligas/__tests__`), que
 * leen la migración y comparan.
 *
 * No confundir con el RANGO (`lib/ranks.ts`): Semilla → Gaia, por puntos totales,
 * mueve el mundo y nunca baja. La liga se juega cada semana.
 */

export interface Liga {
  tier: number;
  slug: string;
  nombre: string;
  descripcion: string;
  color: string;
  /** Puntos por semana para no bajar. */
  mantener: number;
  /** Puntos por semana para subir. Null en la última liga. */
  subir: number | null;
}

export const LIGAS: Liga[] = [
  { tier: 1, slug: 'aprendiz', nombre: 'Aprendiz', descripcion: 'Empieza a mirar su huella y prueba sus primeras acciones.', color: '#A38B6D', mantener: 0, subir: 150 },
  { tier: 2, slug: 'practicante', nombre: 'Practicante', descripcion: 'Hace algo por el ambiente varias veces por semana.', color: '#9CC93B', mantener: 100, subir: 300 },
  { tier: 3, slug: 'ambientalista', nombre: 'Ambientalista', descripcion: 'Cuidar ya es parte de su semana, en varios temas.', color: '#3CB371', mantener: 200, subir: 500 },
  { tier: 4, slug: 'referente', nombre: 'Referente', descripcion: 'Su forma de vivir se nota y se mide.', color: '#1FB57A', mantener: 350, subir: 750 },
  { tier: 5, slug: 'agente', nombre: 'Agente de cambio', descripcion: 'Mueve a otros, no sólo a sí.', color: '#2DB4D4', mantener: 500, subir: 1000 },
  { tier: 6, slug: 'guia', nombre: 'Guía', descripcion: 'Sostiene a su comunidad, semana tras semana.', color: '#5B6CF0', mantener: 700, subir: 1300 },
  { tier: 7, slug: 'faro', nombre: 'Faro', descripcion: 'Lo más alto de Brote, y hay que sostenerlo.', color: '#FFB23E', mantener: 900, subir: null },
];

export const LIGA_POR_TIER: Record<number, Liga> = Object.fromEntries(LIGAS.map((l) => [l.tier, l]));

export interface ReglasLiga {
  tope_diario: number;
  tamano_grupo: number;
  top_suben: number;
  grupo_minimo: number;
}

export const REGLAS_LIGA: ReglasLiga = { tope_diario: 400, tamano_grupo: 30, top_suben: 3, grupo_minimo: 10 };

export type ResultadoLiga = 'sube' | 'mantiene' | 'baja';

/** Cierre de la semana (espejo de `brote_liga_decidir`). `pos` es null fuera de un grupo. */
export function decidirLiga(
  tier: number,
  puntos: number,
  pos: number | null,
  tam: number,
  mantener: number,
  subir: number | null,
  top: number,
  minimo: number,
): { nuevo: number; resultado: ResultadoLiga } {
  if (subir != null && puntos >= subir) return { nuevo: tier + 1, resultado: 'sube' };
  if (subir != null && pos != null && pos <= top && tam >= minimo && puntos >= mantener && puntos > 0) {
    return { nuevo: tier + 1, resultado: 'sube' };
  }
  if (puntos >= mantener || tier === 1) return { nuevo: tier, resultado: 'mantiene' };
  return { nuevo: tier - 1, resultado: 'baja' };
}

/** Lo que conviene decirle a alguien sobre su semana, con lo que lleva hasta hoy. */
export function estadoSemana(
  liga: Pick<Liga, 'tier' | 'mantener' | 'subir'>,
  puntos: number,
): { caso: 'por_mantener' | 'por_subir' | 'ya_sube' | 'tope'; faltan: number } {
  if (liga.tier > 1 && puntos < liga.mantener) return { caso: 'por_mantener', faltan: liga.mantener - puntos };
  if (liga.subir == null) return { caso: 'tope', faltan: 0 };
  if (puntos >= liga.subir) return { caso: 'ya_sube', faltan: 0 };
  return { caso: 'por_subir', faltan: liga.subir - puntos };
}

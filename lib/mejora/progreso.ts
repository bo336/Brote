import type { Ambicion, EstadoObjetivo } from './tipos';

/**
 * Progreso de Mejora (`05_ALGORITMOS.md` §6).
 *
 * ```
 * progreso = min(100, Σ peso × multiplicador × 18 × e^(−antigüedad/540 días))
 * ```
 *
 * Espejo exacto de `brote_progreso_mejora()` en SQL (0106). La base es la que
 * manda — este cálculo existe para poder mostrar el número sin una consulta y
 * para poder testear la calibración: 5 a 6 ciclos cerrados llegan a 100, y la
 * media vida de 18 meses castiga el abandono, no una pausa estacional.
 *
 * **Nunca sube un nivel por sí solo.** Si el esfuerzo comprara nivel, el nivel
 * dejaría de significar evidencia.
 */

export const PESO_CICLO: Record<string, number> = { logrado: 1, logrado_parcial: 0.5 };
export const MULTIPLICADOR: Record<Ambicion, number> = { avanzado: 1.5, intermedio: 1.2, basico: 1 };
export const PUNTOS_POR_CICLO = 18;
export const MEDIA_VIDA_DIAS = 540;

export interface CicloCerrado {
  status: EstadoObjetivo;
  ambicion: Ambicion;
  cerrado_at: string | Date;
}

export function progresoDeCiclos(ciclos: CicloCerrado[], ahora: Date = new Date()): number {
  let suma = 0;
  for (const c of ciclos) {
    const peso = PESO_CICLO[c.status];
    if (!peso) continue;
    const dias = (ahora.getTime() - new Date(c.cerrado_at).getTime()) / 86_400_000;
    suma += peso * MULTIPLICADOR[c.ambicion] * PUNTOS_POR_CICLO * Math.exp(-dias / MEDIA_VIDA_DIAS);
  }
  return Math.min(100, Math.round(suma));
}

/** Cuántos ciclos cerrados con evidencia aprobada tiene (requisito de E4: 2). */
export function ciclosCerrados(ciclos: CicloCerrado[]): number {
  return ciclos.filter((c) => c.status === 'logrado' || c.status === 'logrado_parcial').length;
}

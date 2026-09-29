/**
 * Inicio · adónde seguir después de marcar una acción.
 *
 * El momento en que alguien marca una acción es el momento en que más ganas
 * tiene de seguir, y hasta ahora la pantalla no le ofrecía nada: marcaba y
 * cerraba. Esto decide, con datos reales, qué puerta ofrecerle primero:
 *
 *   1. aprender más del MISMO tema en la Academia (si hay una unidad abierta
 *      en esa rama y le queda savia),
 *   2. productos del Mercado para ese tema (si hay y la cuenta lo ve),
 *   3. su isla, donde el ceibo tiene una flor por cada acción real,
 *   4. la Plaza, para contarlo.
 *
 * Y lo que ya visitó hoy va al final: ofrecerle otra vez la puerta que acaba
 * de usar es la forma más rápida de que deje de mirar la tarjeta.
 */

export type Destino = 'academia' | 'mercado' | 'mundo' | 'plaza';

export interface ContextoPuentes {
  /** A unit to open in the branch of the action just done. */
  academiaEnTema: boolean;
  /** Any next lesson at all. */
  academiaSiguiente: boolean;
  /** Sessions left today; null = unlimited (Brote+) or unknown. */
  saviaRestante: number | null;
  /** Products in the Mercado for the action's domain. */
  mercadoEnTema: number;
  /** The account sees the Mercado and it has something. */
  mercadoDisponible: boolean;
  mundoAbierto: boolean;
  /** Visited from Inicio today, oldest first. */
  visitadosHoy: Destino[];
}

export function elegirPuentes(ctx: ContextoPuentes): Destino[] {
  const conSavia = ctx.saviaRestante === null || ctx.saviaRestante > 0;
  const orden: Destino[] = [];
  const add = (d: Destino, cond: boolean) => {
    if (cond && !orden.includes(d)) orden.push(d);
  };
  add('academia', ctx.academiaEnTema && conSavia);
  add('mercado', ctx.mercadoEnTema > 0);
  add('mundo', ctx.mundoAbierto);
  add('plaza', true);
  add('academia', ctx.academiaSiguiente && conSavia);
  add('mercado', ctx.mercadoDisponible);

  const visto = new Set(ctx.visitadosHoy);
  return [...orden.filter((d) => !visto.has(d)), ...orden.filter((d) => visto.has(d))];
}

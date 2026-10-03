/**
 * Las dos cuentas de empresa (0121).
 *
 *   · TIENDA (`vender`): su único objetivo es vender en el Mercado.
 *   · EMPRESA QUE MEJORA (`mejorar`): usa Brote para bajar su huella; recibe
 *     objetivos y acciones a su medida y compite en la Liga de empresas.
 *   · `ambos`: las dos cosas.
 *
 * Qué secciones ve cada una sale de acá, y la base hace cumplir lo que importa
 * (una empresa que sólo mejora no puede publicar productos).
 */

export type ObjetivoNegocio = 'vender' | 'mejorar' | 'ambos';

export type SeccionNegocio =
  | 'resumen'
  | 'mejora'
  | 'liga'
  | 'productos'
  | 'preguntas'
  | 'tienda'
  | 'analitica'
  | 'verificacion'
  | 'plan';

export function normalizarObjetivo(v: unknown, modelo?: string | null): ObjetivoNegocio {
  if (v === 'vender' || v === 'mejorar' || v === 'ambos') return v;
  // Antes de 0121 no existía: una tienda nueva vendía, lo anterior hacía las dos.
  return modelo === 'legacy' ? 'ambos' : 'vender';
}

export const vende = (o: ObjetivoNegocio) => o === 'vender' || o === 'ambos';
export const mejora = (o: ObjetivoNegocio) => o === 'mejorar' || o === 'ambos';

/**
 * El menú, en orden. Una tienda empieza por lo que vende; una empresa que
 * mejora, por su programa y su liga. Con las dos, el programa va primero: es lo
 * que se trabaja todas las semanas.
 */
export function seccionesDe(objetivo: ObjetivoNegocio, modelo?: string | null): SeccionNegocio[] {
  const tiendaV2 = modelo === 'vendedor';
  const venta: SeccionNegocio[] = tiendaV2
    ? ['productos', 'preguntas', 'tienda', 'analitica', 'plan']
    : ['productos', 'analitica', 'plan'];
  const programa: SeccionNegocio[] = ['mejora', 'liga', 'verificacion'];
  if (objetivo === 'vender') return ['resumen', ...venta];
  if (objetivo === 'mejorar') return ['resumen', ...programa];
  return ['resumen', 'mejora', 'liga', ...venta, 'verificacion'];
}

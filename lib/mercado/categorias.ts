/**
 * Las 12 categorías del Mercado (02 §5.2), pensadas para conectar con las
 * acciones diarias.
 *
 * MISMO listado y orden que `brote_mercado_categorias()` en
 * `supabase/migrations/0107_mercado.sql`; un test lee ese archivo y los compara.
 * Relativo y sin alias: lo compila también el runner de tests.
 */
export const CATEGORIAS = [
  'alimentos-frescos',
  'almacen-granel',
  'bebidas',
  'limpieza-hogar',
  'cuidado-personal',
  'indumentaria',
  'hogar-y-deco',
  'jardin-y-huerta',
  'mascotas',
  'movilidad',
  'servicios-profesionales',
  'reparacion-y-reuso',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

/**
 * Lo que una cuenta `teen` no ve (08 §9). Bebidas incluye alcohol; movilidad,
 * vehículos y financiación; servicios profesionales, contratación. MISMO
 * listado que `brote_mercado_sensibles()`: el filtro real está en la base.
 */
export const CATEGORIAS_SENSIBLES: readonly Categoria[] = ['bebidas', 'movilidad', 'servicios-profesionales'];

/**
 * Grupos para la alerta de halo (fase 3 §5.3): dentro de un grupo una
 * afirmación puede viajar entre listados; entre grupos, el revisor la mira.
 * Espejo de `brote_mercado_grupo()`.
 */
export function grupoCategoria(c: string): string {
  if (c === 'alimentos-frescos' || c === 'almacen-granel' || c === 'bebidas') return 'alimentos';
  if (c === 'limpieza-hogar' || c === 'hogar-y-deco' || c === 'jardin-y-huerta') return 'hogar';
  if (c === 'cuidado-personal' || c === 'indumentaria') return 'personal';
  return c;
}

export function esCategoria(c: unknown): c is Categoria {
  return typeof c === 'string' && (CATEGORIAS as readonly string[]).includes(c);
}

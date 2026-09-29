import type { Categoria } from './categorias';

/**
 * Las prácticas que una tienda puede comprometer en el alta (Mercado v2).
 *
 * Son concretas a propósito: algo que se hace o no se hace, y que se puede
 * mostrar en una foto. Nada de "cuidamos el planeta". ESPEJO EXACTO de
 * `brote_practicas()` en `supabase/migrations/0113_mercado_v2.sql`; un test
 * compara las dos listas.
 *
 * Un compromiso NUNCA es un nivel: los niveles son de cada afirmación de un
 * producto. En la tienda se muestra como lo que es — "declarado por la tienda,
 * con foto" o "revisado por Brote" —, y no le suma nivel a ningún producto.
 */
export const PRACTICAS = [
  'envio-sin-plastico',
  'recibe-envases',
  'materia-prima-local',
  'produccion-a-pedido',
  'repara-o-da-repuestos',
  'vende-usado',
  'energia-renovable',
  'separa-residuos',
  'materiales-recuperados',
  'ingredientes-publicos',
  'agroecologico',
  'granel-o-recarga',
  'de-estacion',
  'entrega-sin-emisiones',
  'precio-justo',
  'hecho-para-durar',
  'alquila-o-presta',
  'packaging-compostable',
  'cuida-el-agua',
  'dona-excedentes',
] as const;

export type Practica = (typeof PRACTICAS)[number];

export const MIN_PRACTICAS = 2;
export const MAX_PRACTICAS = 6;

export function esPractica(p: unknown): p is Practica {
  return typeof p === 'string' && (PRACTICAS as readonly string[]).includes(p);
}

/**
 * Las que suelen aplicar a cada rubro, para mostrarlas primero. Las demás
 * siguen disponibles: una tienda de ropa también puede entregar en bicicleta.
 */
export const PRACTICAS_SUGERIDAS: Record<Categoria, readonly Practica[]> = {
  'alimentos-frescos': ['agroecologico', 'de-estacion', 'materia-prima-local', 'recibe-envases', 'dona-excedentes', 'entrega-sin-emisiones'],
  'almacen-granel': ['granel-o-recarga', 'recibe-envases', 'envio-sin-plastico', 'materia-prima-local', 'precio-justo'],
  bebidas: ['recibe-envases', 'materia-prima-local', 'produccion-a-pedido', 'cuida-el-agua', 'energia-renovable'],
  'limpieza-hogar': ['granel-o-recarga', 'recibe-envases', 'ingredientes-publicos', 'envio-sin-plastico', 'cuida-el-agua'],
  'cuidado-personal': ['ingredientes-publicos', 'granel-o-recarga', 'packaging-compostable', 'envio-sin-plastico', 'recibe-envases'],
  indumentaria: ['vende-usado', 'hecho-para-durar', 'materiales-recuperados', 'produccion-a-pedido', 'repara-o-da-repuestos'],
  'hogar-y-deco': ['materiales-recuperados', 'hecho-para-durar', 'produccion-a-pedido', 'materia-prima-local', 'repara-o-da-repuestos'],
  'jardin-y-huerta': ['agroecologico', 'materia-prima-local', 'separa-residuos', 'cuida-el-agua', 'de-estacion'],
  mascotas: ['granel-o-recarga', 'materia-prima-local', 'envio-sin-plastico', 'materiales-recuperados'],
  movilidad: ['repara-o-da-repuestos', 'vende-usado', 'alquila-o-presta', 'hecho-para-durar', 'entrega-sin-emisiones'],
  'servicios-profesionales': ['entrega-sin-emisiones', 'energia-renovable', 'precio-justo', 'alquila-o-presta'],
  'reparacion-y-reuso': ['repara-o-da-repuestos', 'vende-usado', 'hecho-para-durar', 'separa-residuos', 'materiales-recuperados'],
};

/** Las sugeridas de un rubro primero, después todas las demás. */
export function practicasOrdenadas(categoria: Categoria | null): Practica[] {
  const primero = categoria ? PRACTICAS_SUGERIDAS[categoria] : [];
  return [...primero, ...PRACTICAS.filter((p) => !primero.includes(p))];
}

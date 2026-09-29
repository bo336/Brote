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

/**
 * El segundo nivel (Mercado v2): lo que hace falta para que miles de productos
 * se puedan recorrer sin buscar. ESPEJO EXACTO de `brote_mercado_subcategorias()`
 * en `supabase/migrations/0113_mercado_v2.sql`; un test compara los dos.
 */
export const SUBCATEGORIAS: Record<Categoria, readonly string[]> = {
  'alimentos-frescos': ['frutas-y-verduras', 'bolsones', 'panaderia', 'lacteos-y-quesos', 'carnes-y-huevos', 'conservas-y-dulces'],
  'almacen-granel': ['legumbres-y-cereales', 'harinas', 'frutos-secos-y-semillas', 'yerba-cafe-y-te', 'especias', 'aceites-y-vinagres'],
  bebidas: ['jugos-y-aguas', 'vinos', 'cervezas', 'fermentados'],
  'limpieza-hogar': ['detergentes', 'jabon-para-ropa', 'limpiadores', 'recargas', 'esponjas-y-utensilios'],
  'cuidado-personal': ['solidos', 'cosmetica', 'higiene-bucal', 'higiene-menstrual', 'desodorantes', 'bebes'],
  indumentaria: ['ropa', 'calzado', 'accesorios', 'ninos', 'segunda-mano'],
  'hogar-y-deco': ['muebles', 'textiles', 'cocina', 'iluminacion', 'decoracion'],
  'jardin-y-huerta': ['semillas-y-plantines', 'sustratos-y-compost', 'composteras', 'macetas-y-herramientas', 'riego'],
  mascotas: ['alimento', 'accesorios', 'higiene', 'juguetes'],
  movilidad: ['bicicletas', 'repuestos-y-service', 'electrica', 'accesorios', 'alquiler'],
  'servicios-profesionales': ['consultoria', 'talleres-y-cursos', 'diseno', 'instalaciones', 'eventos'],
  'reparacion-y-reuso': ['electronica', 'electrodomesticos', 'costura', 'muebles', 'reacondicionados'],
};

export function esSubcategoria(categoria: unknown, sub: unknown): sub is string {
  return esCategoria(categoria) && typeof sub === 'string' && SUBCATEGORIAS[categoria].includes(sub);
}

/** La clave de mensaje de una subcategoría: únicas por categoría, no globalmente ("accesorios"). */
export function claveSubcategoria(categoria: string, sub: string): string {
  return `${categoria}.${sub}`;
}

/** Estado de un producto: el reuso necesita decirlo, y quien compra, saberlo. */
export const CONDICIONES = ['nuevo', 'usado', 'reacondicionado'] as const;
export type Condicion = (typeof CONDICIONES)[number];

/** Por dónde se consulta o se compra. WhatsApp e Instagram salen del dato de la tienda. */
export const CONTACTOS = ['whatsapp', 'web', 'instagram'] as const;
export type Contacto = (typeof CONTACTOS)[number];

/** Los órdenes de la búsqueda. Precio solo para adultos: un teen no ve precios. */
export const ORDENES = ['relevancia', 'recomendados', 'nuevos', 'precio_asc', 'precio_desc', 'nivel'] as const;
export type OrdenBusqueda = (typeof ORDENES)[number];

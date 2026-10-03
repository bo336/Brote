/**
 * Qué puede hacer cada tipo de cuenta — en un solo lugar.
 *
 * Las reglas de verdad viven en Postgres (cada RPC vuelve a mirar el tipo de
 * cuenta: una pantalla se puede saltear, una función de la base no). Esto es su
 * espejo para la interfaz: qué botón mostrar, qué explicar, y la tabla que la
 * persona ve en Ajustes. `lib/cuentas/__tests__/reglas.test.ts` compara este
 * archivo con el SQL de las migraciones que hacen cumplir cada regla.
 *
 * Cuatro roles, cada uno con su objetivo:
 *
 *   · CHICOS (hasta 12): aprender y hacer, sin exponerse. Acciones seguras,
 *     noticias adaptadas, su isla y la Academia. Nada social con desconocidos,
 *     nada de compras, cero publicidad.
 *   · ADOLESCENTES (13 a 17): autonomía con cuidado. Publican y siguen, se suman
 *     a proyectos, ven el Mercado sin precios ni categorías sensibles. No
 *     organizan encuentros, no compran ni contratan, publicidad sólo genérica.
 *   · ADULTOS: todo. Organizan proyectos desde el rango Arbusto, abren tiendas o
 *     empresas, se suscriben a Brote+.
 *   · EMPRESAS: no son una persona — son un espacio aparte (la tienda o el
 *     programa Mejora) que abre una cuenta adulta. Ver `lib/negocio/objetivo.ts`.
 */

export type TipoCuenta = 'kid' | 'teen' | 'adult';

export type Capacidad =
  | 'acciones'
  | 'academia'
  | 'mundo'
  | 'noticias'
  | 'publicar'
  | 'seguir'
  | 'buscar_personas'
  | 'mercado'
  | 'mercado_precios'
  | 'proyectos_sumarse'
  | 'proyectos_crear'
  | 'competencias_crear'
  | 'brote_plus'
  | 'negocios';

/** El rango desde el que una cuenta adulta organiza proyectos (0120, editable en /panel). */
export const RANGO_MIN_PROYECTOS = 5;

export const PUEDE: Record<TipoCuenta, Record<Capacidad, boolean>> = {
  kid: {
    acciones: true,
    academia: true,
    mundo: true,
    noticias: true, // sólo las marcadas para chicos
    publicar: false,
    seguir: false,
    buscar_personas: false,
    mercado: false,
    mercado_precios: false,
    proyectos_sumarse: false,
    proyectos_crear: false,
    competencias_crear: true, // sólo entre cuentas de chicos, por código
    brote_plus: false,
    negocios: false,
  },
  teen: {
    acciones: true,
    academia: true,
    mundo: true,
    noticias: true,
    publicar: true,
    seguir: true,
    buscar_personas: true,
    mercado: true,
    mercado_precios: false,
    proyectos_sumarse: true,
    proyectos_crear: false,
    competencias_crear: true,
    brote_plus: false,
    negocios: false,
  },
  adult: {
    acciones: true,
    academia: true,
    mundo: true,
    noticias: true,
    publicar: true,
    seguir: true,
    buscar_personas: true,
    mercado: true,
    mercado_precios: true,
    proyectos_sumarse: true,
    proyectos_crear: true, // desde RANGO_MIN_PROYECTOS
    competencias_crear: true,
    brote_plus: true,
    negocios: true,
  },
};

export function puede(tipo: TipoCuenta | null | undefined, c: Capacidad): boolean {
  return PUEDE[tipo ?? 'adult'][c];
}

/** Crear un proyecto: adulto y con el rango mínimo. Devuelve el motivo si no. */
export function puedeCrearProyecto(
  tipo: TipoCuenta | null | undefined,
  tier: number,
  minimo: number = RANGO_MIN_PROYECTOS,
): { ok: true } | { ok: false; motivo: 'edad' | 'rango' } {
  if (!puede(tipo, 'proyectos_crear')) return { ok: false, motivo: 'edad' };
  if (tier < minimo) return { ok: false, motivo: 'rango' };
  return { ok: true };
}

/** Lo que se le muestra a la persona sobre su propia cuenta, en Ajustes. */
export const EXPLICACION: Record<TipoCuenta, { podes: string[]; cuidado: string[] }> = {
  kid: {
    podes: [
      'Hacer acciones pensadas para tu edad y ver tu impacto real',
      'Aprender en la Academia y cuidar tu isla',
      'Leer noticias elegidas para chicos',
      'Competir con amigos que tengan cuenta de chicos, con un código',
    ],
    cuidado: [
      'No publicás ni seguís a nadie, y nadie te encuentra en la búsqueda',
      'No hay Mercado, compras ni publicidad',
      'Los proyectos en persona los hace una persona adulta de tu familia',
    ],
  },
  teen: {
    podes: [
      'Todas las acciones para tu edad, la Academia y tu isla',
      'Publicar, comentar y seguir a otras personas',
      'Sumarte a proyectos de tu barrio',
      'Mirar el Mercado y guardar lo que te guste',
    ],
    cuidado: [
      'Los proyectos los organizan personas adultas',
      'En el Mercado no ves precios ni categorías para mayores',
      'No podés suscribirte ni abrir una tienda: lo hace una persona adulta',
      'La publicidad, si la hay, es siempre genérica',
    ],
  },
  adult: {
    podes: [
      'Todas las acciones, la Academia, tu isla y la Plaza',
      `Organizar proyectos en persona desde el rango Arbusto`,
      'Abrir una tienda en el Mercado o sumar tu empresa al programa Mejora',
      'Suscribirte a Brote+',
    ],
    cuidado: ['El tipo de cuenta se elige al empezar; para cambiarlo, escribinos'],
  },
};

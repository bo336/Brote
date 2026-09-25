import { CONDICIONES, ORDENES, esCategoria, esSubcategoria, type Condicion, type OrdenBusqueda } from './categorias';

/**
 * La búsqueda vive en la URL: se comparte, se vuelve atrás, se recarga y
 * sigue igual. Esto la lee y la escribe, validando cada valor; lo que no es
 * válido se ignora (una URL tocada a mano nunca rompe la pantalla).
 *
 * Pura y sin alias de rutas: la usan el servidor, el cliente y los tests.
 */

export interface FiltrosURL {
  q: string | null;
  categoria: string | null;
  subcategoria: string | null;
  nivel: 'e1' | 'e2' | 'e3' | null;
  zona: string | null;
  modalidad: 'online' | 'local' | null;
  condicion: Condicion | null;
  precioMin: number | null;
  precioMax: number | null;
  orden: OrdenBusqueda | null;
}

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function valor(p: Params, clave: string): string | null {
  const v = p instanceof URLSearchParams ? p.get(clave) : p[clave];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && s.trim() ? s.trim() : null;
}

function numero(s: string | null): number | null {
  if (!s) return null;
  const n = Number(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.round(n) : null;
}

export function leerFiltros(p: Params, provincias: readonly string[]): FiltrosURL {
  const categoria = valor(p, 'categoria');
  const cat = esCategoria(categoria) ? categoria : null;
  const sub = valor(p, 'sub');
  const nivel = valor(p, 'nivel');
  const zona = valor(p, 'zona');
  const modalidad = valor(p, 'modalidad');
  const condicion = valor(p, 'condicion');
  const orden = valor(p, 'orden');
  let precioMin = numero(valor(p, 'desde'));
  let precioMax = numero(valor(p, 'hasta'));
  if (precioMin !== null && precioMax !== null && precioMin > precioMax) [precioMin, precioMax] = [precioMax, precioMin];
  return {
    q: valor(p, 'q')?.slice(0, 80) ?? null,
    categoria: cat,
    subcategoria: cat && esSubcategoria(cat, sub) ? sub : null,
    nivel: nivel === 'e1' || nivel === 'e2' || nivel === 'e3' ? nivel : null,
    zona: zona && provincias.includes(zona) ? zona : null,
    modalidad: modalidad === 'online' || modalidad === 'local' ? modalidad : null,
    condicion: (CONDICIONES as readonly string[]).includes(condicion ?? '') ? (condicion as Condicion) : null,
    precioMin,
    precioMax,
    orden: (ORDENES as readonly string[]).includes(orden ?? '') ? (orden as OrdenBusqueda) : null,
  };
}

/** La URL de una búsqueda, con solo lo que no está vacío (y en un orden fijo). */
export function urlBusqueda(f: Partial<FiltrosURL>, base = '/mercado/buscar'): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.categoria) p.set('categoria', f.categoria);
  if (f.categoria && f.subcategoria) p.set('sub', f.subcategoria);
  if (f.condicion) p.set('condicion', f.condicion);
  if (f.modalidad) p.set('modalidad', f.modalidad);
  if (f.zona) p.set('zona', f.zona);
  if (f.nivel) p.set('nivel', f.nivel);
  if (f.precioMin !== null && f.precioMin !== undefined) p.set('desde', String(f.precioMin));
  if (f.precioMax !== null && f.precioMax !== undefined) p.set('hasta', String(f.precioMax));
  if (f.orden) p.set('orden', f.orden);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

/** Cuántos filtros hay puestos, sin contar el texto ni el orden. Es el número del botón "Filtros". */
export function cuantosFiltros(f: FiltrosURL): number {
  return [
    f.categoria,
    f.subcategoria,
    f.condicion,
    f.modalidad,
    f.zona,
    f.nivel,
    f.precioMin !== null || f.precioMax !== null ? 'precio' : null,
  ].filter(Boolean).length;
}

export const FILTROS_VACIOS: FiltrosURL = {
  q: null,
  categoria: null,
  subcategoria: null,
  nivel: null,
  zona: null,
  modalidad: null,
  condicion: null,
  precioMin: null,
  precioMax: null,
  orden: null,
};

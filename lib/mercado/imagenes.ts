/**
 * La URL pública de una imagen de listado (bucket `listing-images`, público).
 * Sirve en servidor y en cliente: la ruta guardada es `<negocio>/<listado>/<uuid>.jpg`.
 */
export function urlImagen(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//.test(ruta)) return ruta;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/listing-images/${ruta}` : null;
}

/** "$ 4.200" — el número, sin la palabra: la etiqueta la pone la pantalla. */
export function formatoPrecio(precio: number, moneda = 'ARS'): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(precio);
  } catch {
    return `$ ${Math.round(precio).toLocaleString('es-AR')}`;
  }
}

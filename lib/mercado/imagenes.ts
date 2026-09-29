/**
 * La URL pública de una imagen de listado (bucket `listing-images`, público).
 * Sirve en servidor y en cliente: la ruta guardada es `<negocio>/<listado>/<uuid>.jpg`.
 */
export function urlImagen(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//.test(ruta)) return ruta;
  // Una ruta absoluta de la propia app (`/demo/1.png`): es lo que usan los
  // listados de demostración, que no viven en Storage.
  if (ruta.startsWith('/')) return ruta;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/listing-images/${ruta}` : null;
}

/**
 * La URL pública del logo de una tienda (bucket `business-logos`). Acepta una
 * URL completa o una ruta de la app, como `urlImagen`.
 */
export function urlLogo(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//.test(ruta) || ruta.startsWith('/')) return ruta;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/business-logos/${ruta}` : null;
}

/** "$ 4.200" — el número, sin la palabra: la etiqueta la pone la pantalla. */
export function formatoPrecio(precio: number, moneda = 'ARS'): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(precio);
  } catch {
    return `$ ${Math.round(precio).toLocaleString('es-AR')}`;
  }
}

/**
 * Argentine provinces (F15.4).
 *
 * This used to be a city list that mixed levels — "Vicente López" (a
 * municipality inside Buenos Aires province) sat beside "Chubut" (a province),
 * so two people from the same place could land in different leaderboards and
 * neither list meant anything. One level only: the 23 provinces plus CABA.
 *
 * The underlying column is still `profiles.city` for compatibility; only the
 * values and the labels changed.
 */
export const PROVINCES = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

/** Kept so existing imports keep working; prefer PROVINCES in new code. */
export const CITIES = PROVINCES;

/** Sentinel used by the UI to reveal the free-text input (people abroad). */
export const OTHER_CITY = 'Otra…';

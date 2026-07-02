/**
 * Main Argentine cities for onboarding/profile (replaces the old
 * neighborhood-centric model). The UI offers this curated list plus an
 * "Otra…" option with free text, so any city in the world is valid.
 */
export const CITIES = [
  'Buenos Aires',
  'Córdoba',
  'Rosario',
  'Mendoza',
  'La Plata',
  'Mar del Plata',
  'San Miguel de Tucumán',
  'Salta',
  'Santa Fe',
  'Corrientes',
  'Neuquén',
  'Bahía Blanca',
  'Resistencia',
  'Posadas',
  'San Salvador de Jujuy',
  'Paraná',
  'Santiago del Estero',
  'San Juan',
  'San Luis',
  'La Rioja',
  'Catamarca',
  'Formosa',
  'San Carlos de Bariloche',
  'Comodoro Rivadavia',
  'Río Gallegos',
  'Ushuaia',
  'Santa Rosa',
  'Rawson',
  'Viedma',
  'Tigre',
  'Quilmes',
  'Morón',
  'San Isidro',
  'Vicente López',
  'Lomas de Zamora',
  'Pilar',
] as const;

/** Sentinel used by the UI to reveal the free-text input. */
export const OTHER_CITY = 'Otra…';

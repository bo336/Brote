/**
 * Acciones propias (0150, docs/REESTRUCTURA.md D6).
 *
 * Alguien carga algo que hizo y no está en el catálogo. ESPEJO de
 * `brote_propias_reglas()` y `brote_propia_motivo()`: la base decide, esto
 * sirve para avisar antes de mandar y para los tests (que leen la migración y
 * comparan). La lista de palabras de la Plaza la mira sólo la base.
 *
 * Simple a propósito: siempre los mismos puntos, las 3 primeras del día suman,
 * no mueven el impacto real ni la racha.
 */

export const REGLAS_PROPIAS = {
  puntos: 15,
  con_puntos_por_dia: 3,
  max_por_dia: 10,
  min_largo: 6,
  max_largo: 90,
  min_palabras: 2,
  max_nota: 280,
} as const;

export type ReglasPropias = { [K in keyof typeof REGLAS_PROPIAS]: number };

export type MotivoPropia =
  | 'corto'
  | 'largo'
  | 'palabras'
  | 'texto'
  | 'palabras_prohibidas'
  | 'tema'
  | 'nota'
  | 'tope_dia'
  | 'repetida'
  | 'no_autenticado'
  | 'no_disponible';

/** Lo que se le dice a la persona por cada motivo. */
export const TEXTO_MOTIVO: Record<MotivoPropia, string> = {
  corto: 'Contalo con un poco más de detalle.',
  largo: 'Es muy largo: hasta 90 letras.',
  palabras: 'Usá al menos dos palabras: qué hiciste y con qué.',
  texto: 'Eso no parece una acción. Contalo con palabras.',
  palabras_prohibidas: 'Hay una palabra que no podemos aceptar.',
  tema: 'Elegí de qué tema es.',
  nota: 'La nota es muy larga o tiene una palabra que no podemos aceptar.',
  tope_dia: 'Ya cargaste 10 hoy. Mañana seguís.',
  repetida: 'Eso ya lo cargaste hoy.',
  no_autenticado: 'Tu sesión venció. Volvé a entrar.',
  no_disponible: 'Todavía no está disponible. Probá en un rato.',
};

/** Espacios de más afuera: "  Llevé   bolsas " → "Llevé bolsas". */
export function limpiarTitulo(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Igual que `brote_propia_normalizar`: minúsculas, sin acentos, sólo letras y números. */
export function normalizarPropia(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

/** Por qué un título no sirve (sin la lista de palabras), o null. */
export function motivoTituloPropio(titulo: string, r: ReglasPropias = REGLAS_PROPIAS): MotivoPropia | null {
  const t = limpiarTitulo(titulo);
  const largo = [...t].length;
  if (largo < r.min_largo) return 'corto';
  if (largo > r.max_largo) return 'largo';
  const n = normalizarPropia(t);
  if (n.split(' ').length < r.min_palabras) return 'palabras';
  if (!/[a-zñ]{3,}/.test(n) || /(.)\1{4,}/.test(n)) return 'texto';
  return null;
}

/** Cuántos puntos daría la próxima, según cómo viene el día. */
export function puntosDeLaProxima(conPuntosRestantes: number, r: ReglasPropias = REGLAS_PROPIAS): number {
  return conPuntosRestantes > 0 ? r.puntos : 0;
}

// ── ¿Ya está en el catálogo? ────────────────────────────────────────────────

/*
 * Mientras alguien escribe, si lo que cuenta se parece a una acción del
 * catálogo, se la ofrecemos: esa sí suma su impacto real medido. Es una
 * coincidencia de palabras con raíz recortada, sin librería: alcanza para
 * "llevé bolsas al super" ↔ "Llevá tu bolsa al súper".
 */

const VACIAS = new Set([
  'a', 'al', 'algo', 'con', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'lo', 'los', 'mi', 'mis', 'me', 'para',
  'por', 'que', 'se', 'su', 'sus', 'tu', 'tus', 'un', 'una', 'unos', 'unas', 'y', 'o', 'hoy', 'ayer', 'hice', 'fui',
  'todo', 'toda', 'muy', 'mas', 'menos', 'casa', 'vez', 'veces', 'dia',
]);

/**
 * Una raíz que aguanta la conjugación y el plural: "llevé", "llevá" y "llevar"
 * dan "llev"; "bolsas" y "bolsa", "bols". Sin plural, sin la última vocal, y
 * las primeras 5 letras.
 */
function raiz(w: string): string {
  let r = w;
  if (r.length > 4 && r.endsWith('s')) r = r.slice(0, -1);
  if (r.length > 4 && /[aeiou]$/.test(r)) r = r.slice(0, -1);
  if (r.length > 5 && r.endsWith('r')) r = r.slice(0, -1);
  return r.slice(0, 5);
}

/** Las palabras que pesan, como raíces. */
export function raices(s: string): string[] {
  const out = new Set<string>();
  for (const w of normalizarPropia(s).split(' ')) {
    if (w.length < 3 || VACIAS.has(w)) continue;
    out.add(raiz(w));
  }
  return [...out];
}

export interface CandidataCatalogo {
  id: string;
  slug: string;
  title_es: string;
  domain_slug: string;
}

/**
 * Hasta `max` acciones del catálogo que se parecen a lo que se escribió, de la
 * más parecida a la menos. Primero las que comparten dos raíces o más; sólo si
 * no hay ninguna, las que comparten una palabra que casi no aparece en el
 * catálogo ("tapitas" sí, "agua" no). Mejor no sugerir que sugerir mal.
 */
export function sugerirDelCatalogo<T extends CandidataCatalogo>(texto: string, catalogo: T[], max = 2): T[] {
  const mias = raices(texto);
  if (mias.length === 0) return [];
  const porAccion = catalogo.map((a) => ({ a, r: raices(a.title_es) }));
  const frecuencia = new Map<string, number>();
  for (const { r } of porAccion) for (const x of r) frecuencia.set(x, (frecuencia.get(x) ?? 0) + 1);

  const fuertes: { a: T; n: number; s: number }[] = [];
  const debiles: { a: T; n: number; s: number }[] = [];
  for (const { a, r } of porAccion) {
    if (r.length === 0) continue;
    const comunes = r.filter((x) => mias.includes(x));
    if (comunes.length === 0) continue;
    const s = comunes.length / Math.sqrt(r.length * mias.length);
    if (comunes.length >= Math.min(2, r.length)) fuertes.push({ a, n: comunes.length, s });
    else if (comunes.some((x) => x.length >= 4 && (frecuencia.get(x) ?? 0) <= 3)) debiles.push({ a, n: 1, s });
  }
  const lista = fuertes.length > 0 ? fuertes : debiles;
  return lista
    .sort((x, y) => y.n - x.n || y.s - x.s)
    .slice(0, max)
    .map((p) => p.a);
}

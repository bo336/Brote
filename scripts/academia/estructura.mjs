// ─────────────────────────────────────────────────────────────────────────────
// ac_anillos + ac_ramas — the fixed skeleton of the tree.
//
// The 13 ramas are the 13 domains from `lib/domains.ts`, verbatim. There is no
// fourteenth: the domains are product identity, and 14-generation-pipeline.md §6
// forbids even the generator from inventing one. `tronco` is the only extra and
// it is not a domain — it is the shared foundation, drawn as the trunk.
// ─────────────────────────────────────────────────────────────────────────────

/** Growth rings. The rubric is the prompt fragment Phase 3 generates against. */
export const ANILLOS = [
  {
    n: 1,
    nombre_es: 'Reconocer',
    descripcion_es: 'Nombrar las cosas y saber cuáles son. El primer anillo del tronco.',
    rubrica:
      'Nivel cognitivo: reconocer e identificar. El ítem pide nombrar, distinguir o clasificar algo concreto y observable. Una sola idea por ítem. Sin cadenas causales de más de un paso. Vocabulario cotidiano.',
  },
  {
    n: 2,
    nombre_es: 'Explicar',
    descripcion_es: 'Por qué pasa lo que pasa, y qué se relaciona con qué.',
    rubrica:
      'Nivel cognitivo: explicar y relacionar. El ítem pide una causa, un mecanismo o una relación entre dos cosas. Se admiten cadenas causales de dos o tres pasos. Se puede pedir comparar dos casos.',
  },
  {
    n: 3,
    nombre_es: 'Decidir',
    descripcion_es: 'Comparar opciones reales con números reales y elegir.',
    rubrica:
      'Nivel cognitivo: comparar y decidir. El ítem presenta dos o más opciones legítimas con costos y beneficios distintos y pide elegir con un criterio explícito. Los números son reales y llevan su fuente. Nunca hay una única opción obviamente buena.',
  },
  {
    n: 4,
    nombre_es: 'Sistemas',
    descripcion_es: 'Efectos de segundo orden, compensaciones y consecuencias no buscadas.',
    rubrica:
      'Nivel cognitivo: sistemas y compensaciones. El ítem trabaja efectos de segundo orden, rebotes, externalidades o conflictos entre objetivos legítimos. Se admite que la respuesta correcta sea "depende de X" cuando X está explicitado.',
  },
];

/**
 * `tronco` first, then the 13 domains in their canonical sort order.
 * `es_tronco` is what the SVG uses to know what to draw at the base.
 */
export const RAMAS = [
  {
    slug: 'tronco',
    es_tronco: true,
    nombre_es: 'El tronco',
    bajada_es: 'Lo que sostiene todo lo demás: cómo funciona un sistema vivo y cómo se lee un número.',
    sort_order: 0,
  },
  { slug: 'residuos', es_tronco: false, nombre_es: 'Residuos y Reciclaje', bajada_es: 'Adónde va lo que tirás, y por qué el orden de las erres no es el que se repite.', sort_order: 1 },
  { slug: 'agua', es_tronco: false, nombre_es: 'Agua', bajada_es: 'La que ves por la canilla y la que viene escondida en todo lo demás.', sort_order: 2 },
  { slug: 'energia', es_tronco: false, nombre_es: 'Energía y CO₂', bajada_es: 'De dónde sale la luz que usás y cuánto pesa cada kilovatio.', sort_order: 3 },
  { slug: 'movilidad', es_tronco: false, nombre_es: 'Movilidad', bajada_es: 'Cómo te movés, cuánto cuesta cada kilómetro y quién más viaja con vos.', sort_order: 4 },
  { slug: 'plantas', es_tronco: false, nombre_es: 'Plantas y Verde Urbano', bajada_es: 'Nativas, exóticas e invasoras, y lo que un árbol hace por una cuadra.', sort_order: 5 },
  { slug: 'animales', es_tronco: false, nombre_es: 'Animales y Vida Silvestre', bajada_es: 'La rama más profunda del bosque: quiénes son, cómo se sostienen y cómo se cuidan.', sort_order: 6 },
  { slug: 'alimentacion', es_tronco: false, nombre_es: 'Alimentación', bajada_es: 'Lo que comés pesa más que la distancia que recorrió.', sort_order: 7 },
  { slug: 'consumo', es_tronco: false, nombre_es: 'Consumo Responsable', bajada_es: 'Leer una etiqueta, detectar el verde falso y hacer durar las cosas.', sort_order: 8 },
  { slug: 'digital', es_tronco: false, nombre_es: 'Digital y Tecnología', bajada_es: 'La nube es física, y tu celular pesa más de lo que parece.', sort_order: 9 },
  { slug: 'comunidad', es_tronco: false, nombre_es: 'Comunidad', bajada_es: 'Lo que se decide entre varios: reclamos, audiencias y derechos ambientales.', sort_order: 10 },
  { slug: 'agua_azul', es_tronco: false, nombre_es: 'Océanos y Ríos', bajada_es: 'El Mar Argentino, el Río de la Plata y todo lo que llega desde tierra.', sort_order: 11 },
  { slug: 'aire_suelo', es_tronco: false, nombre_es: 'Aire y Suelo', bajada_es: 'Lo que respirás y lo que pisás, que son dos sistemas y no uno.', sort_order: 12 },
  { slug: 'ciencia', es_tronco: false, nombre_es: 'Ciencia Ciudadana', bajada_es: 'Cómo se sabe lo que se sabe, y cómo sumar tus propios datos.', sort_order: 13 },
];

export const RAMA_SLUGS = new Set(RAMAS.map((r) => r.slug));

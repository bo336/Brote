// Las ramas del Árbol: el tronco y los 13 dominios de lib/domains.ts.
//
// Los nombres son los mismos del resto de la app (la identidad de un dominio
// no cambia de una sección a otra). `bajada_es` es lo que se lee en la rama
// dentro de la Academia: dice qué se aprende ahí, no qué acciones hay.
//
// `sort_order` es el orden de la lista accesible y también el orden en que las
// ramas se abren en abanico sobre la copa, de izquierda a derecha. Se eligió
// para que temas vecinos queden vecinos (agua junto a océanos, plantas junto a
// animales) y para alternar ramas "de casa" con ramas "de afuera", así la copa
// no queda cargada de un lado.

export const RAMAS = [
  {
    slug: 'tronco',
    es_tronco: true,
    nombre_es: 'Tronco',
    bajada_es: 'La base de todo: cómo funciona el ambiente, cómo se mide y cómo se pasa de saber a hacer.',
    sort_order: 0,
  },
  {
    slug: 'agua_azul',
    nombre_es: 'Océanos y Ríos',
    bajada_es: 'Ríos, humedales y mar: cómo funcionan, qué los amenaza y qué los protege.',
    sort_order: 1,
  },
  {
    slug: 'agua',
    nombre_es: 'Agua',
    bajada_es: 'De dónde sale el agua de tu canilla, adónde va la que usás y cómo cuidarla.',
    sort_order: 2,
  },
  {
    slug: 'alimentacion',
    nombre_es: 'Alimentación',
    bajada_es: 'Qué hay detrás de lo que comés: huella, desperdicio, estaciones y etiquetas.',
    sort_order: 3,
  },
  {
    slug: 'plantas',
    nombre_es: 'Plantas y Verde Urbano',
    bajada_es: 'Cómo vive una planta, qué es una nativa y cómo hacer crecer verde donde estás.',
    sort_order: 4,
  },
  {
    slug: 'animales',
    nombre_es: 'Animales y Vida Silvestre',
    bajada_es: 'Fauna, cadenas de vida y conservación: de los bichos de tu barrio al yaguareté.',
    sort_order: 5,
  },
  {
    slug: 'aire_suelo',
    nombre_es: 'Aire y Suelo',
    bajada_es: 'El aire que respirás, el suelo que te alimenta y el clima que los une.',
    sort_order: 6,
  },
  {
    slug: 'ciencia',
    nombre_es: 'Ciencia Ciudadana',
    bajada_es: 'Cómo sabemos lo que sabemos: datos, gráficos, fuentes y pensamiento crítico.',
    sort_order: 7,
  },
  {
    slug: 'energia',
    nombre_es: 'Energía y CO₂',
    bajada_es: 'Qué es la energía, cuánto usás en casa y de dónde sale la electricidad.',
    sort_order: 8,
  },
  {
    slug: 'movilidad',
    nombre_es: 'Movilidad',
    bajada_es: 'Cómo nos movemos, cuánto pesa cada forma de viajar y cómo se diseña una ciudad.',
    sort_order: 9,
  },
  {
    slug: 'residuos',
    nombre_es: 'Residuos y Reciclaje',
    bajada_es: 'Qué pasa con lo que tirás, cómo separar bien y por qué reducir le gana a reciclar.',
    sort_order: 10,
  },
  {
    slug: 'consumo',
    nombre_es: 'Consumo Responsable',
    bajada_es: 'Lo que cuesta de verdad lo que comprás, cómo detectar el greenwashing y cómo durar más.',
    sort_order: 11,
  },
  {
    slug: 'digital',
    nombre_es: 'Digital y Tecnología',
    bajada_es: 'La huella de tus dispositivos y de la nube, y cómo usar la tecnología a favor.',
    sort_order: 12,
  },
  {
    slug: 'comunidad',
    nombre_es: 'Comunidad',
    bajada_es: 'Actuar con otros: organizarse, participar, comunicar y buscar justicia ambiental.',
    sort_order: 13,
  },
];
